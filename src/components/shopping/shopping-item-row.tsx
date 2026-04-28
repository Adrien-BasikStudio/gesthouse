'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toggleItem, deleteItem } from '@/lib/actions/shopping'
import { toast } from 'sonner'
import AddToStockSheet from './add-to-stock-sheet'

type Item = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  is_checked: boolean
  category: string | null
}

export default function ShoppingItemRow({
  item,
  householdId,
}: {
  item: Item
  householdId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticChecked, setOptimisticChecked] = useState(item.is_checked)

  function handleToggle() {
    const next = !optimisticChecked
    setOptimisticChecked(next)
    startTransition(async () => {
      const result = await toggleItem(item.id, next)
      if (result?.error) {
        setOptimisticChecked(!next)
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteItem(item.id)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`size-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          optimisticChecked
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {optimisticChecked && (
          <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${optimisticChecked ? 'line-through text-muted-foreground' : ''}`}>
          {item.name}
        </span>
        {(item.quantity || item.unit) && (
          <span className="text-xs text-muted-foreground ml-1.5">
            {item.quantity && item.quantity !== 1 ? item.quantity : ''}{item.unit ? ` ${item.unit}` : ''}
          </span>
        )}
      </div>

      {optimisticChecked && (
        <AddToStockSheet
          item={{ name: item.name, quantity: item.quantity, unit: item.unit }}
          householdId={householdId}
        />
      )}

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
