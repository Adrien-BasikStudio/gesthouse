'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { deleteExpense } from '@/lib/actions/expenses'
import { formatChf } from '@/lib/expenses'
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

  function handleDelete() {
    if (!confirm('Supprimer cette dépense ?')) return
    startTransition(async () => {
      const result = await deleteExpense(expense.id)
      if (result?.error) toast.error(result.error)
    })
  }

  const canDelete = expense.paid_by === currentUserId || isAdmin
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
