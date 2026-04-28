'use client'

import { format, isSameDay, isToday, isSameMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

type Event = {
  id: string
  title: string
  starts_at: string
  color: string | null
}

export default function MonthView({
  days,
  events,
  currentMonth,
}: {
  days: Date[]
  events: Event[]
  currentMonth: Date
}) {
  return (
    <div className="px-2 pb-24">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden">
        {days.map(day => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.starts_at), day))
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={`bg-background min-h-16 p-1 ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className={`size-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 mx-auto ${
                isCurrentDay ? 'bg-primary text-primary-foreground' : ''
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded font-medium truncate text-white"
                    style={{ backgroundColor: event.color ?? '#E8923C' }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
