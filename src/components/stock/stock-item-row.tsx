'use client'

import { useTransition } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { deleteStockItem, updateQuantity } from '@/lib/actions/stock'
import { toast } from 'sonner'

type Item = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  category: string | null
  expires_on: string | null
}

export default function StockItemRow({ item }: { item: Item }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteStockItem(item.id)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleQty(delta: number) {
    startTransition(async () => {
      const result = await updateQuantity(item.id, delta)
      if (result?.error) toast.error(result.error)
    })
  }

  const expiryBadge = () => {
    if (!item.expires_on) return null
    const days = differenceInDays(parseISO(item.expires_on), new Date())
    if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Périmé</span>
    if (days === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Aujourd&apos;hui</span>
    if (days <= 3) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">J-{days}</span>
    return null
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{item.name}</span>
          {expiryBadge()}
        </div>
        {item.category && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => handleQty(-1)}
          disabled={isPending}
          className="size-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="text-sm font-semibold w-12 text-center">
          {item.quantity ?? 1}{item.unit ? ` ${item.unit}` : ''}
        </span>
        <button
          onClick={() => handleQty(1)}
          disabled={isPending}
          className="size-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
