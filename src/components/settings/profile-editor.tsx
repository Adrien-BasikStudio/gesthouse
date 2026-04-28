'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ProfileEditor({
  displayName,
  email,
}: {
  displayName: string
  email: string
}) {
  const [name, setName] = useState(displayName)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('display_name', name)
    startTransition(async () => {
      const result = await updateProfile(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Profil mis à jour')
        setEditing(false)
      }
    })
  }

  return (
    <div className="bg-card border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                required
              />
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? '…' : 'OK'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => { setName(displayName); setEditing(false) }}>
                ✕
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="ml-auto text-xs text-primary hover:underline"
              >
                Modifier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
