'use client'

import { useRef, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { addItem } from '@/lib/actions/shopping'
import { toast } from 'sonner'

export default function AddItemInput({
  listId,
  householdId,
}: {
  listId: string
  householdId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return

    const name = value.trim()
    setValue('')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', name)
      fd.set('list_id', listId)
      fd.set('household_id', householdId)
      const result = await addItem(fd)
      if (result?.error) {
        toast.error(result.error)
        setValue(name)
      }
    })

    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 bg-card border-t"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ajouter un article..."
        disabled={isPending}
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={isPending || !value.trim()}
        className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
      >
        <Plus className="size-4" />
      </button>
    </form>
  )
}
