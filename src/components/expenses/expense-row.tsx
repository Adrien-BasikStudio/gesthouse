'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { deleteExpense, updateExpense } from '@/lib/actions/expenses'
import { formatChf } from '@/lib/expenses'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<string, string> = {
  courses: '🛒',
  restaurant: '🍽️',
  loyer: '🏠',
  sorties: '🎭',
  transport: '🚗',
  sante: '💊',
  divers: '📦',
}

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, emoji]) => ({
  value,
  label: `${emoji} ${value.charAt(0).toUpperCase() + value.slice(1)}`,
}))

type Expense = {
  id: string
  description: string
  amount_cents: number
  category: string | null
  spent_at: string
  paid_by: string
  profiles: { display_name: string } | null
}

export default function ExpenseRow({
  expense,
  currentUserId,
  isAdmin,
}: {
  expense: Expense
  currentUserId: string
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [category, setCategory] = useState<string>(expense.category ?? 'none')

  function handleDelete() {
    if (!confirm('Supprimer cette dépense ?')) return
    startTransition(async () => {
      const result = await deleteExpense(expense.id)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (category && category !== 'none') formData.set('category', category)

    startTransition(async () => {
      const result = await updateExpense(expense.id, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Dépense modifiée')
        setEditOpen(false)
      }
    })
  }

  const canEdit = expense.paid_by === currentUserId || isAdmin
  const canDelete = canEdit
  const emoji = expense.category ? (CATEGORY_LABELS[expense.category] ?? '📦') : '📦'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="size-9 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{expense.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Payé par {expense.profiles?.display_name ?? '–'} · {format(new Date(expense.spent_at), 'd MMM', { locale: fr })}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold">{formatChf(expense.amount_cents)}</span>

        {canEdit && (
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetTrigger
              className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="size-4" />
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Modifier la dépense</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 pb-6">
                <div className="space-y-2">
                  <Label htmlFor={`edit-exp-desc-${expense.id}`}>Description *</Label>
                  <Input
                    id={`edit-exp-desc-${expense.id}`}
                    name="description"
                    defaultValue={expense.description}
                    required
                   
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`edit-exp-amount-${expense.id}`}>Montant (CHF) *</Label>
                  <Input
                    id={`edit-exp-amount-${expense.id}`}
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    defaultValue={(expense.amount_cents / 100).toFixed(2)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={v => { if (v !== null) setCategory(v) }}>
                    <SelectTrigger>
                      <SelectValue>
                        {category && category !== 'none'
                          ? CATEGORIES.find(c => c.value === category)?.label ?? category
                          : <span className="text-muted-foreground">Aucune</span>}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        )}

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
