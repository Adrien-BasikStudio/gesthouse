import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth,
  addWeeks, subWeeks, addMonths, subMonths,
  format,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import WeekView from '@/components/calendar/week-view'
import MonthView from '@/components/calendar/month-view'
import AddEventSheet from '@/components/calendar/add-event-sheet'
import { Suspense } from 'react'
import FilterChips from '@/components/tasks/filter-chips'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; offset?: string; members?: string; groups?: string; tasks?: string; new?: string }>
}) {
  const { view = 'week', offset = '0', members: membersParam = '', groups: groupsParam = '', tasks: tasksParam, new: newDate } = await searchParams
  const off = parseInt(offset) || 0
  const activeMembers = membersParam.split(',').filter(Boolean)
  const activeGroups = groupsParam.split(',').filter(Boolean)
  const showTasks = tasksParam === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = (await getActiveHouseholdId(memberships))!
  const admin = createAdminClient()

  const [{ data: members }, { data: groups }] = await Promise.all([
    admin
      .from('household_members')
      .select('user_id, profiles(display_name)')
      .eq('household_id', householdId),
    admin
      .from('household_groups')
      .select('id, name, emoji, color')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
  ])

  const memberMap: Record<string, string> = {}
  for (const m of members ?? []) {
    memberMap[m.user_id] = (m.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Membre'
  }

  const membersForSheet = (members ?? []).map(m => ({
    user_id: m.user_id,
    display_name: memberMap[m.user_id] ?? 'Membre',
  }))

  const membersForFilter = membersForSheet
  const groupsForFilter = groups ?? []

  const now = new Date()
  let days: Date[]
  let rangeStart: Date
  let rangeEnd: Date
  let title: string
  let prevHref: string
  let nextHref: string

  if (view === 'month') {
    const baseMonth = off >= 0 ? addMonths(now, off) : subMonths(now, -off)
    rangeStart = startOfMonth(baseMonth)
    rangeEnd = endOfMonth(baseMonth)
    const gridStart = startOfWeek(rangeStart, { locale: fr })
    const gridEnd = endOfWeek(rangeEnd, { locale: fr })
    days = eachDayOfInterval({ start: gridStart, end: gridEnd })
    title = format(baseMonth, 'MMMM yyyy', { locale: fr })
    prevHref = `/calendar?view=month&offset=${off - 1}`
    nextHref = `/calendar?view=month&offset=${off + 1}`
  } else {
    const baseWeek = off >= 0 ? addWeeks(now, off) : subWeeks(now, -off)
    rangeStart = startOfWeek(baseWeek, { locale: fr })
    rangeEnd = endOfWeek(baseWeek, { locale: fr })
    days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    const start = format(rangeStart, 'd MMM', { locale: fr })
    const end = format(rangeEnd, 'd MMM', { locale: fr })
    title = `${start} – ${end}`
    prevHref = `/calendar?view=week&offset=${off - 1}`
    nextHref = `/calendar?view=week&offset=${off + 1}`
  }

  // Build event query
  let eventsQuery = admin
    .from('events')
    .select('id, title, starts_at, ends_at, all_day, location, color, attendee_ids, group_id')
    .eq('household_id', householdId)
    .gte('starts_at', rangeStart.toISOString())
    .lte('starts_at', rangeEnd.toISOString())
    .order('starts_at', { ascending: true })

  if (activeMembers.length > 0) {
    eventsQuery = eventsQuery.overlaps('attendee_ids', activeMembers)
  }
  if (activeGroups.length > 0) {
    eventsQuery = eventsQuery.in('group_id', activeGroups)
  }

  // Build tasks query (for calendar display)
  const rangeStartDate = format(rangeStart, 'yyyy-MM-dd')
  const rangeEndDate = format(rangeEnd, 'yyyy-MM-dd')

  let tasksQuery = admin
    .from('tasks')
    .select('id, title, due_at, completed_at, assigned_to, group_id, household_groups:group_id(name, color, emoji)')
    .eq('household_id', householdId)
    .not('due_at', 'is', null)
    .gte('due_at', rangeStart.toISOString())
    .lte('due_at', rangeEnd.toISOString())
    .is('completed_at', null)
    .order('due_at', { ascending: true })

  if (activeMembers.length > 0) {
    tasksQuery = tasksQuery.in('assigned_to', activeMembers)
  }
  if (activeGroups.length > 0) {
    tasksQuery = tasksQuery.in('group_id', activeGroups)
  }

  const [{ data: events }, { data: tasks }] = await Promise.all([
    eventsQuery,
    showTasks ? tasksQuery : Promise.resolve({ data: [] }),
  ])

  const today = format(now, 'yyyy-MM-dd')

  // Build filter URL base (preserve view + offset)
  const filterBase = `/calendar?view=${view}&offset=${offset}`

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <Link href={prevHref} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="font-bold text-lg capitalize">{title}</h1>
          <Link href={nextHref} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ChevronRight className="size-5" />
          </Link>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl">
          <Link
            href={`/calendar?view=week&offset=0`}
            className={`flex-1 text-center text-sm py-1.5 rounded-lg font-medium transition-colors ${
              view === 'week' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Semaine
          </Link>
          <Link
            href={`/calendar?view=month&offset=0`}
            className={`flex-1 text-center text-sm py-1.5 rounded-lg font-medium transition-colors ${
              view === 'month' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Mois
          </Link>
        </div>

        {/* Filters */}
        <Suspense>
          <FilterChips
            members={membersForFilter.length > 1 ? membersForFilter : []}
            groups={groupsForFilter}
            showTasksToggle
          />
        </Suspense>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto">
        {view === 'week' ? (
          <Suspense>
          <WeekView
            days={days}
            events={events ?? []}
            tasks={showTasks ? (tasks ?? []).map(t => ({
              ...t,
              household_groups: Array.isArray(t.household_groups)
                ? (t.household_groups[0] ?? null)
                : t.household_groups as { name: string; color: string; emoji: string | null } | null,
            })) : []}
            memberMap={memberMap}
            currentUserId={user.id}
          />
          </Suspense>
        ) : (
          <MonthView
            days={days}
            events={events ?? []}
            currentMonth={view === 'month' ? addMonths(now, off) : now}
          />
        )}
      </div>

      <AddEventSheet
        householdId={householdId}
        members={membersForSheet}
        defaultDate={newDate ?? today}
        initialOpen={!!newDate}
      />
    </div>
  )
}
