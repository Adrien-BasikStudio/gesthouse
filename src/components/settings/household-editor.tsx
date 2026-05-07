'use client'

import { useState, useTransition } from 'react'
import { updateHousehold } from '@/lib/actions/household'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const EMOJIS = ['🏠', '🏡', '🐜', '🌿', '🔥', '⚡', '🌊', '🏔️', '🌸', '🦁', '🐻', '🦊']

export default function HouseholdEditor({
  householdId,
  initialName,
  initialEmoji,
}: {
  householdId: string
  initialName: string
  initialEmoji: string
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('name', name)
    fd.set('emoji', emoji)
    startTransition(async () => {
      const result = await updateHousehold(householdId, fd)
      if (result?.error) toast.error(result.error)
      else { toast.success('Foyer mis à jour'); setEditing(false) }
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="font-semibold">{name}</span>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">
          Modifier
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {EMOJIS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`text-xl p-1.5 rounded-lg transition-colors ${emoji === e ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary'}`}
          >
            {e}
          </button>
        ))}
      </div>
      <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Nom du foyer" />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending} className="flex-1">
          {isPending ? '…' : 'Enregistrer'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { setName(initialName); setEmoji(initialEmoji); setEditing(false) }}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
