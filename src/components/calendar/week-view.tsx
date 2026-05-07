'use client'

import { useState, useTransition } from 'react'
import { format, isToday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MapPin, Pencil, Trash2, Clock, CheckSquare, UtensilsCrossed, BookOpen } from 'lucide-react'
import { deleteEvent, updateEvent } from '@/lib/actions/calendar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

type MealPlan = {
  id: string
  recipe_id: string | null
  custom_title: string | null
  planned_for: string
  meal_type: string | null
  recipe_title: string | null
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🥣',
  lunch: '🍽️',
  snack: '🍎',
  dinner: '🌙',
}

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner']

type CalendarNote = {
  id: string
  title: string | null
  content: string
  note_date: string
  color: string
  user_id: string
  author: string | null
}

type MemberMap = Record<string, string>
type Member = { user_id: string; display_name: string }

const COLORS = [
  { value: '#E8923C', label: 'Ambre' },
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#F59E0B', label: 'Jaune' },
]

function EventEditSheet({
  event,
  members,
}: {
  event: Event
  members: Member[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [allDay, setAllDay] = useState(event.all_day)
  const [color, setColor] = useState(event.color ?? COLORS[0].value)
  const [attendees, setAttendees] = useState<string[]>(event.attendee_ids ?? members.map(m => m.user_id))

  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)

  function toggleAttendee(uid: string) {
    setAttendees(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('all_day', String(allDay))
    formData.set('color', color)
    attendees.forEach(uid => formData.append('attendees', uid))

    startTransition(async () => {
      const result = await updateEvent(event.id, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Événement modifié')
        setOpen(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="shrink-0 p-1 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-secondary transition-colors self-start"
      >
        <Pencil className="size-4" />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier l&apos;événement</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor={`edit-event-title-${event.id}`}>Titre *</Label>
            <Input
              id={`edit-event-title-${event.id}`}
              name="title"
              defaultValue={event.title}
              required
             
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-event-date-${event.id}`}>Date *</Label>
            <Input
              id={`edit-event-date-${event.id}`}
              name="date"
              type="date"
              defaultValue={format(startDate, 'yyyy-MM-dd')}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllDay(!allDay)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${allDay ? 'bg-primary text-primary-foreground border-primary' : 'border-input'}`}
            >
              Journée entière
            </button>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`edit-event-start-${event.id}`}>Début</Label>
                <Input
                  id={`edit-event-start-${event.id}`}
                  name="start_time"
                  type="time"
                  defaultValue={format(startDate, 'HH:mm')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-event-end-${event.id}`}>Fin</Label>
                <Input
                  id={`edit-event-end-${event.id}`}
                  name="end_time"
                  type="time"
                  defaultValue={format(endDate, 'HH:mm')}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`edit-event-loc-${event.id}`}>Lieu</Label>
            <Input
              id={`edit-event-loc-${event.id}`}
              name="location"
              defaultValue={event.location ?? ''}
              placeholder="Adresse ou lieu"
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`size-7 rounded-full transition-transform ${color === c.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => toggleAttendee(m.user_id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      attendees.includes(m.user_id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {m.display_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default function WeekView({
  days,
  events,
  tasks = [],
  meals = [],
  notes = [],
  memberMap,
  members = [],
  currentUserId,
}: {
  days: Date[]
  events: Event[]
  tasks?: Task[]
  meals?: MealPlan[]
  notes?: CalendarNote[]
  memberMap: MemberMap
  members?: Member[]
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleDayClick(day: Date) {
    const date = format(day, 'yyyy-MM-dd')
    const params = new URLSearchParams(searchParams.toString())
    params.set('new', date)
    params.delete('tasks')
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
        const dayNotes = notes.filter(n => n.note_date === format(day, 'yyyy-MM-dd'))
        const dayMeals = meals
          .filter(m => m.planned_for === format(day, 'yyyy-MM-dd'))
          .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type ?? 'dinner') - MEAL_ORDER.indexOf(b.meal_type ?? 'dinner'))
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
              {dayEvents.length === 0 && dayTasks.length === 0 && dayMeals.length === 0 && dayNotes.length === 0 ? (
                <span className="text-xs text-muted-foreground/50">Rien de prévu</span>
              ) : (
                <span className="text-xs text-muted-foreground/30 ml-auto">+ Ajouter</span>
              )}
            </div>

            {/* Events */}
            {dayEvents.map(event => {
              const start = new Date(event.starts_at)
              const end = new Date(event.ends_at)

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
                  <div className="flex flex-col gap-1 shrink-0">
                    <EventEditSheet event={event} members={members} />
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={isPending}
                      className="p-1 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
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

            {/* Notes partagées */}
            {dayNotes.map(note => (
              <Link
                key={note.id}
                href="/notes"
                className="mx-4 mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-card border hover:bg-accent/50 transition-colors"
                style={{ borderLeftWidth: 3, borderLeftColor: note.color }}
              >
                <BookOpen className="size-3.5 shrink-0" style={{ color: note.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {note.title ?? note.content.slice(0, 40)}
                  </p>
                  {note.author && note.user_id !== currentUserId && (
                    <p className="text-[10px] text-muted-foreground">{note.author}</p>
                  )}
                </div>
              </Link>
            ))}

            {/* Meals */}
            {dayMeals.length > 0 && (
              <Link
                href="/meals"
                className="mx-4 mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors"
              >
                <UtensilsCrossed className="size-3.5 text-amber-500 shrink-0" />
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 flex-1 min-w-0">
                  {dayMeals.map(meal => (
                    <span key={meal.id} className="text-xs text-amber-700 dark:text-amber-300 truncate">
                      {MEAL_EMOJI[meal.meal_type ?? 'dinner']} {meal.recipe_title ?? meal.custom_title ?? 'Repas'}
                    </span>
                  ))}
                </div>
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
