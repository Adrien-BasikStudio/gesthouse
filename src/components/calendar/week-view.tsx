'use client'

import { useTransition } from 'react'
import { format, isToday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MapPin, Trash2, Clock, CheckSquare } from 'lucide-react'
import { deleteEvent } from '@/lib/actions/calendar'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type Event = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  all_day: boolean
  location: string | null
  color: string | null
  attendee_ids: string[] | null
}

type Task = {
  id: string
  title: string
  due_at: string | null
  assigned_to: string | null
  group_id: string | null
  household_groups: { name: string; color: string; emoji: string | null } | null
}

type MemberMap = Record<string, string>

export default function WeekView({
  days,
  events,
  tasks = [],
  memberMap,
  currentUserId,
}: {
  days: Date[]
  events: Event[]
  tasks?: Task[]
  memberMap: MemberMap
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleDayClick(day: Date) {
    const date = format(day, 'yyyy-MM-dd')
    const params = new URLSearchParams(searchParams.toString())
    params.set('new', date)
    params.delete('tasks') // don't carry tasks param into new event flow
    router.push(`/calendar?${params.toString()}`)
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteEvent(id)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="space-y-1 pb-24">
      {days.map(day => {
        const dayEvents = events.filter(e => isSameDay(new Date(e.starts_at), day))
        const dayTasks = tasks.filter(t => t.due_at && isSameDay(new Date(t.due_at), day))
        const isCurrentDay = isToday(day)

        return (
          <div key={day.toISOString()}>
            {/* Day header */}
            <div className={`flex items-center gap-3 px-4 py-2 sticky top-0 bg-background z-10`}>
              <button
                onClick={() => handleDayClick(day)}
                className={`flex flex-col items-center size-10 rounded-full justify-center shrink-0 transition-colors hover:bg-secondary ${
                  isCurrentDay ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                }`}
              >
                <span className={`text-xs font-medium uppercase ${isCurrentDay ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE', { locale: fr })}
                </span>
                <span className={`text-sm font-bold leading-none ${isCurrentDay ? 'text-primary-foreground' : ''}`}>
                  {format(day, 'd')}
                </span>
              </button>
              {dayEvents.length === 0 && dayTasks.length === 0 ? (
                <span className="text-xs text-muted-foreground/50">Rien de prévu</span>
              ) : (
                <span className="text-xs text-muted-foreground/30 ml-auto">+ Ajouter</span>
              )}
            </div>

            {/* Events */}
            {dayEvents.map(event => {
              const start = new Date(event.starts_at)
              const end = new Date(event.ends_at)
              const canDelete = event.attendee_ids?.includes(currentUserId) || true

              return (
                <div
                  key={event.id}
                  className={`mx-4 mb-1.5 flex gap-3 px-3 py-2.5 rounded-2xl bg-card border transition-opacity ${isPending ? 'opacity-50' : ''}`}
                  style={{ borderLeftWidth: 3, borderLeftColor: event.color ?? '#E8923C' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {!event.all_day && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                        </span>
                      )}
                      {event.all_day && (
                        <span className="text-xs text-muted-foreground">Journée entière</span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.attendee_ids && event.attendee_ids.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {event.attendee_ids.map(uid => (
                          <span key={uid} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {memberMap[uid] ?? '?'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={isPending}
                    className="shrink-0 p-1 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors self-start"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            })}

            {/* Tasks */}
            {dayTasks.map(task => (
              <Link
                key={task.id}
                href="/tasks"
                className="mx-4 mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-dashed hover:bg-secondary transition-colors"
              >
                <CheckSquare className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground/80 flex-1 min-w-0 truncate">{task.title}</span>
                {task.household_groups && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: task.household_groups.color }}
                  >
                    {task.household_groups.emoji ?? ''}{task.household_groups.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )
      })}
    </div>
  )
}
