'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { createEvent } from '@/lib/actions/calendar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Member = { user_id: string; display_name: string }

const COLORS = [
  { value: '#E8923C', label: 'Ambre' },
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#F59E0B', label: 'Jaune' },
]

export default function AddEventSheet({
  householdId,
  members,
  defaultDate,
}: {
  householdId: string
  members: Member[]
  defaultDate?: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState(COLORS[0].value)
  const [attendees, setAttendees] = useState<string[]>(members.map(m => m.user_id))

  function toggleAttendee(uid: string) {
    setAttendees(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('household_id', householdId)
    formData.set('all_day', String(allDay))
    formData.set('color', color)
    attendees.forEach(uid => formData.append('attendees', uid))

    startTransition(async () => {
      const result = await createEvent(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Événement ajouté 🐜')
        setOpen(false)
        ;(e.target as HTMLFormElement).reset()
        setAllDay(false)
        setColor(COLORS[0].value)
        setAttendees(members.map(m => m.user_id))
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="fixed bottom-20 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Ajouter un événement"
      >
        <Plus className="size-6" />
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nouvel événement</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" name="title" placeholder="Rendez-vous médecin" required autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" name="date" type="date" defaultValue={defaultDate ?? today} required />
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
                <Label htmlFor="start_time">Début</Label>
                <Input id="start_time" name="start_time" type="time" defaultValue="09:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fin</Label>
                <Input id="end_time" name="end_time" type="time" defaultValue="10:00" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input id="location" name="location" placeholder="Adresse ou lieu" />
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
