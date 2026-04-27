'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { createTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Member = { user_id: string; profiles: { display_name: string } | null }

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Pas de répétition' },
  { value: 'FREQ=DAILY', label: 'Tous les jours' },
  { value: 'FREQ=WEEKLY', label: 'Toutes les semaines' },
  { value: 'FREQ=MONTHLY', label: 'Tous les mois' },
]

export default function CreateTaskSheet({
  householdId,
  members,
}: {
  householdId: string
  members: Member[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('household_id', householdId)
    formData.set('assigned_to', assignedTo ?? '')
    formData.set('recurrence_rule', recurrence ?? '')

    startTransition(async () => {
      const result = await createTask(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Tâche ajoutée 🐜')
        setOpen(false)
        setAssignedTo(null)
        setRecurrence(null)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="fixed bottom-20 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          aria-label="Ajouter une tâche"
        >
          <Plus className="size-6" />
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouvelle tâche</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tâche *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Sortir les poubelles"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assignée à</Label>
                <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v)}>
                  <SelectTrigger>
                    <SelectValue>
                      {assignedTo && assignedTo !== 'none'
                        ? (members.find(m => m.user_id === assignedTo)?.profiles?.display_name ?? 'Membre')
                        : <span className="text-muted-foreground">N&apos;importe qui</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">N&apos;importe qui</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profiles?.display_name ?? 'Membre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_at">Date</Label>
                <Input
                  id="due_at"
                  name="due_at"
                  type="date"
                  className="block"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Répétition</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v)}>
                <SelectTrigger>
                  <SelectValue>
                    {recurrence && recurrence !== 'none'
                      ? (RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label ?? recurrence)
                      : <span className="text-muted-foreground">Pas de répétition</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Ajout en cours...' : 'Ajouter la tâche'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
