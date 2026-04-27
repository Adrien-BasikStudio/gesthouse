import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TaskListRealtime from '@/components/tasks/task-list-realtime'
import CreateTaskSheet from '@/components/tasks/create-task-sheet'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(name, emoji)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id
  const household = membership.households as unknown as { name: string; emoji: string } | null

  // Membres du foyer pour l'assignation
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, profiles(display_name)')
    .eq('household_id', householdId)

  const now = new Date()

  // Tâches du jour (dues aujourd'hui ou en retard, non complétées + complétées aujourd'hui)
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('*, profiles:assigned_to(display_name)')
    .eq('household_id', householdId)
    .or(
      `and(due_at.lte.${endOfDay(now).toISOString()},completed_at.is.null),` +
      `and(completed_at.gte.${startOfDay(now).toISOString()},completed_at.lte.${endOfDay(now).toISOString()})`
    )
    .order('due_at', { ascending: true, nullsFirst: false })

  // Tâches de la semaine
  const { data: weekTasks } = await supabase
    .from('tasks')
    .select('*, profiles:assigned_to(display_name)')
    .eq('household_id', householdId)
    .gte('due_at', startOfWeek(now, { locale: fr }).toISOString())
    .lte('due_at', endOfWeek(now, { locale: fr }).toISOString())
    .order('due_at', { ascending: true })

  // Historique (complétées, hors aujourd'hui)
  const { data: historyTasks } = await supabase
    .from('tasks')
    .select('*, profiles:assigned_to(display_name)')
    .eq('household_id', householdId)
    .not('completed_at', 'is', null)
    .lt('completed_at', startOfDay(now).toISOString())
    .order('completed_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <p className="text-sm text-muted-foreground">
          {household?.emoji} {household?.name}
        </p>
        <h1 className="text-2xl font-bold">
          Bonjour {profile?.display_name} 👋
        </h1>
      </div>

      <Tabs defaultValue="today" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mb-2">
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
          />
        </TabsContent>

        <TabsContent value="week" className="flex-1 px-4 overflow-y-auto">
          <TaskListRealtime
            initialTasks={weekTasks ?? []}
            householdId={householdId}
            channelSuffix="week"
          />
        </TabsContent>

        <TabsContent value="history" className="flex-1 px-4 overflow-y-auto">
          <TaskListRealtime
            initialTasks={historyTasks ?? []}
            householdId={householdId}
            channelSuffix="history"
          />
        </TabsContent>
      </Tabs>

      <CreateTaskSheet
        householdId={householdId}
        members={(members ?? []) as unknown as { user_id: string; profiles: { display_name: string } | null }[]}
      />
    </div>
  )
}
