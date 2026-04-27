'use client'

import { useTransition, useState } from 'react'
import { MoreVertical, RotateCcw, Trash2, Plus } from 'lucide-react'
import { resetList, deleteCheckedItems, createList } from '@/lib/actions/shopping'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ListActionsMenu({
  listId,
  checkedCount,
  householdId,
}: {
  listId: string
  checkedCount: number
  householdId: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleReset() {
    setOpen(false)
    startTransition(async () => {
      const result = await resetList(listId)
      if (result?.error) toast.error(result.error)
      else toast.success('Liste réinitialisée')
    })
  }

  function handleDeleteChecked() {
    setOpen(false)
    startTransition(async () => {
      const result = await deleteCheckedItems(listId)
      if (result?.error) toast.error(result.error)
      else toast.success('Articles cochés supprimés')
    })
  }

  async function handleNewList() {
    setOpen(false)
    const name = prompt('Nom de la nouvelle liste')
    if (!name?.trim()) return
    const fd = new FormData()
    fd.set('name', name.trim())
    fd.set('household_id', householdId)
    startTransition(async () => {
      const result = await createList(fd)
      if (result?.error) toast.error(result.error)
      else if (result?.id) router.push(`/shopping/${result.id}`)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-52 bg-popover border rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={handleNewList}
              disabled={isPending}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              <Plus className="size-4" /> Nouvelle liste
            </button>
            {checkedCount > 0 && (
              <>
                <div className="h-px bg-border mx-3" />
                <button
                  onClick={handleReset}
                  disabled={isPending}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-accent transition-colors"
                >
                  <RotateCcw className="size-4" /> Tout décocher
                </button>
                <button
                  onClick={handleDeleteChecked}
                  disabled={isPending}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-4" /> Supprimer les cochés
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
