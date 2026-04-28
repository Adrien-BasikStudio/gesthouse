'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ShoppingItemRow from './shopping-item-row'

type Item = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  is_checked: boolean
  category: string | null
}

export default function ShoppingListRealtime({
  initialItems,
  listId,
  householdId,
  hideChecked,
}: {
  initialItems: Item[]
  listId: string
  householdId: string
  hideChecked: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`shopping-${listId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: `list_id=eq.${listId}`,
      }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [listId, router])

  const pending = items.filter(i => !i.is_checked)
  const checked = items.filter(i => i.is_checked)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-3xl">🛒</p>
        <p className="font-medium text-muted-foreground">La liste est vide.</p>
        <p className="text-sm text-muted-foreground">Ajoute un article ci-dessous.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 py-2">
      {pending.map(item => (
        <ShoppingItemRow key={item.id} item={item} householdId={householdId} />
      ))}

      {checked.length > 0 && !hideChecked && (
        <div className="mt-6 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-1">
            Dans le panier ({checked.length})
          </p>
          {checked.map(item => (
            <ShoppingItemRow key={item.id} item={item} householdId={householdId} />
          ))}
        </div>
      )}

      {checked.length > 0 && hideChecked && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {checked.length} article{checked.length > 1 ? 's' : ''} coché{checked.length > 1 ? 's' : ''} masqué{checked.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
