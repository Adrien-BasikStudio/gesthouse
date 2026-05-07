'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addExpense } from '@/lib/actions/expenses'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Member = { user_id: string; display_name: string }

const CATEGORIES = [
  { value: 'courses', label: '🛒 Courses' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'loyer', label: '🏠 Loyer / Charges' },
  { value: 'sorties', label: '🎭 Sorties' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'sante', label: '💊 Santé' },
  { value: 'divers', label: '📦 Divers' },
]

export default function AddExpenseSheet({
  groupId,
  householdId,
  members,
  currentUserId,
}: {
  groupId: string
  householdId: string
  members: Member[]
  currentUserId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [paidBy, setPaidBy] = useState<string | null>(currentUserId)
  const [category, setCategory] = useState<string | null>(null)
  const [participants, setParticipants] = useState<string[]>(members.map(m => m.user_id))

  function toggleParticipant(uid: string) {
    setParticipants(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (participants.length === 0) {
      toast.error('Sélectionne au moins un participant')
      return
    }
    const formData = new FormData(e.currentTarget)
    formData.set('group_id', groupId)
    formData.set('household_id', householdId)
    formData.set('paid_by', paidBy ?? currentUserId)
    if (category) formData.set('category', category)
    participants.forEach(uid => formData.append('participants', uid))

    startTransition(async () => {
      const result = await addExpense(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Dépense ajoutée 🐜')
        setOpen(false)
        setCategory(null)
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
        setParticipants(members.map(m => m.user_id))
        setPaidBy(currentUserId)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="fixed bottom-20 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Ajouter une dépense"
      >
        <Plus className="size-6" />
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nouvelle dépense</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" name="description" placeholder="Courses Migros" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (CHF) *</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payé par</Label>
              <Select value={paidBy} onValueChange={v => setPaidBy(v)}>
                <SelectTrigger>
                  <SelectValue>
                    {members.find(m => m.user_id === paidBy)?.display_name ?? 'Moi'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={v => setCategory(v)}>
              <SelectTrigger>
                <SelectValue>
                  {category
                    ? CATEGORIES.find(c => c.value === category)?.label
                    : <span className="text-muted-foreground">Choisir...</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pour qui <span className="text-muted-foreground font-normal">(parts égales)</span></Label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => toggleParticipant(m.user_id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    participants.includes(m.user_id)
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
            {isPending ? 'Ajout...' : 'Ajouter la dépense'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
