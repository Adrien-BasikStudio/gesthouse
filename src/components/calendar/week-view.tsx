'use client'

import { useTransition } from 'react'
import { format, isToday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MapPin, Trash2, Clock } from 'lucide-react'
import { deleteEvent } from '@/lib/actions/calendar'
import { toast } from 'sonner'

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

type MemberMap = Record<string, string>

export default function WeekView({
  days,
  events,
  memberMap,
  currentUserId,
}: {
  days: Date[]
  events: Event[]
  memberMap: MemberMap
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()

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
        const isCurrentDay = isToday(day)

        return (
          <div key={day.toISOString()}>
            {/* Day header */}
            <div className={`flex items-center gap-3 px-4 py-2 sticky top-0 bg-background z-10 ${isCurrentDay ? '' : ''}`}>
              <div className={`flex flex-col items-center size-10 rounded-full justify-center shrink-0 ${
                isCurrentDay ? 'bg-primary text-primary-foreground' : ''
              }`}>
                <span className={`text-xs font-medium uppercase ${isCurrentDay ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE', { locale: fr })}
                </span>
                <span className={`text-sm font-bold leading-none ${isCurrentDay ? 'text-primary-foreground' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              {dayEvents.length === 0 && (
                <span className="text-xs text-muted-foreground/50">Rien de prévu</span>
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
          </div>
        )
      })}
    </div>
  )
}
