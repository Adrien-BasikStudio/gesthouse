import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import { startOfDay, endOfWeek, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TaskListRealtime from '@/components/tasks/task-list-realtime'
import CreateTaskSheet from '@/components/tasks/create-task-sheet'
import { Suspense } from 'react'
import FilterChips from '@/components/tasks/filter-chips'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ members?: string; groups?: string }>
}) {
  const { members: membersParam = '', groups: groupsParam = '' } = await searchParams

  const activeMembers = membersParam.split(',').filter(Boolean)
  const activeGroups = groupsParam.split(',').filter(Boolean)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, role, households(name, emoji)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = (await getActiveHouseholdId(memberships))!
  const membership = memberships.find(m => m.household_id === householdId) ?? memberships[0]
  const household = membership.households as unknown as { name: string; emoji: string } | null

  const admin = createAdminClient()

  const [{ data: members }, { data: groups }] = await Promise.all([
    admin
      .from('household_members')
      .select('user_id, profiles(display_name)')
      .eq('household_id', householdId),
    admin
      .from('household_groups')
      .select('id, name, emoji, color, group_members(user_id)')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
  ])

  const now = new Date()

  function applyFilters(query: ReturnType<typeof admin.from>) {
    if (activeMembers.length > 0) {
      query = (query as any).in('assigned_to', activeMembers)
    }
    if (activeGroups.length > 0) {
      query = (query as any).in('group_id', activeGroups)
    }
    return query
  }

  let todayQuery = admin
    .from('tasks')
    .select('*, profiles:assigned_to(display_name), household_groups:group_id(name, color, emoji)')
    .eq('household_id', householdId)
    .or(`completed_at.is.null,completed_at.gte.${startOfDay(now).toISOString()}`)
    .order('due_at', { ascending: true, nullsFirst: false })

  let weekQuery = admin
    .from('tasks')
    .select('*, profiles:assigned_to(display_name), household_groups:group_id(name, color, emoji)')
    .eq('household_id', householdId)
    .gte('due_at', startOfWeek(now, { locale: fr }).toISOString())
    .lte('due_at', endOfWeek(now, { locale: fr }).toISOString())
    .order('due_at', { ascending: true })

  let historyQuery = admin
    .from('tasks')
    .select('*, profiles:assigned_to(display_name), household_groups:group_id(name, color, emoji)')
    .eq('household_id', householdId)
    .not('completed_at', 'is', null)
    .lt('completed_at', startOfDay(now).toISOString())
    .order('completed_at', { ascending: false })
    .limit(50)

  if (activeMembers.length > 0) {
    todayQuery = todayQuery.in('assigned_to', activeMembers)
    weekQuery = weekQuery.in('assigned_to', activeMembers)
    historyQuery = historyQuery.in('assigned_to', activeMembers)
  }
  if (activeGroups.length > 0) {
    todayQuery = todayQuery.in('group_id', activeGroups)
    weekQuery = weekQuery.in('group_id', activeGroups)
    historyQuery = historyQuery.in('group_id', activeGroups)
  }

  const [{ data: todayTasks }, { data: weekTasks }, { data: historyTasks }] = await Promise.all([
    todayQuery,
    weekQuery,
    historyQuery,
  ])

  const membersForFilter = (members ?? []).map(m => ({
    user_id: m.user_id,
    display_name: (m.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Membre',
  }))

  const groupsForFilter = (groups ?? []).map(g => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    color: g.color,
  }))

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="px-4 pt-6 pb-2">
        <p className="text-sm text-muted-foreground">
          {household?.emoji} {household?.name}
        </p>
        <h1 className="text-2xl font-bold mt-0.5">
          Bonjour {profile?.display_name} 👋
        </h1>
      </div>

      {/* Filters */}
      {(membersForFilter.length > 1 || groupsForFilter.length > 0) && (
        <div className="px-4 pb-2">
          <Suspense>
            <FilterChips members={membersForFilter} groups={groupsForFilter} />
          </Suspense>
        </div>
      )}

      <Tabs defaultValue="today" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 mb-1">
          <TabsTrigger value="today" className="flex-1">
            Aujourd&apos;hui
            {(todayTasks?.filter(t => !t.completed_at).length ?? 0) > 0 && (
              <span className="ml-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {todayTasks!.filter(t => !t.completed_at).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="week" className="flex-1">Semaine</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="flex-1 px-4 overflow-y-auto">
          <TaskListRealtime
            initialTasks={todayTasks ?? []}
            householdId={householdId}
            channelSuffix="today"
            members={membersForFilter}
            groups={groupsForFilter}
          />
        </TabsContent>

        <TabsContent value="week" className="flex-1 px-4 overflow-y-auto">
          <TaskListRealtime
            initialTasks={weekTasks ?? []}
            householdId={householdId}
            channelSuffix="week"
            members={membersForFilter}
            groups={groupsForFilter}
          />
        </TabsContent>

        <TabsContent value="history" className="flex-1 px-4 overflow-y-auto">
          <TaskListRealtime
            initialTasks={historyTasks ?? []}
            householdId={householdId}
            channelSuffix="history"
            members={membersForFilter}
            groups={groupsForFilter}
          />
        </TabsContent>
      </Tabs>

      <CreateTaskSheet
        householdId={householdId}
        members={(members ?? []) as unknown as { user_id: string; profiles: { display_name: string } | null }[]}
        groups={groupsForFilter}
      />
    </div>
  )
}
