'use client'

import { useRef, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { addItem } from '@/lib/actions/shopping'
import { toast } from 'sonner'

export default function AddItemInput({
  listId,
  householdId,
  suggestions = [],
}: {
  listId: string
  householdId: string
  suggestions?: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = value.trim().length > 0
    ? suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase().trim()) &&
        s.toLowerCase() !== value.toLowerCase().trim()
      ).slice(0, 5)
    : []

  function submit(name: string) {
    if (!name.trim()) return
    setValue('')
    setShowSuggestions(false)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', name.trim())
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(value)
  }

  return (
    <div className="relative">
      {/* Suggestions */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-popover border-t border-x rounded-t-2xl overflow-hidden shadow-lg">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); submit(s) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors border-b last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 bg-card border-t"
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
    </div>
  )
}
