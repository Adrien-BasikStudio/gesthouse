'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { switchHousehold } from '@/lib/actions/household'
import { toast } from 'sonner'

type Household = { household_id: string; name: string; emoji: string }

export default function HouseholdSwitcher({
  households,
  activeId,
}: {
  households: Household[]
  activeId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [joinMode, setJoinMode] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const router = useRouter()

  function handleSwitch(id: string) {
    startTransition(async () => {
      await switchHousehold(id)
    })
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const url = inviteUrl.trim()
    const match = url.match(/\/invite\/([a-zA-Z0-9_-]+)/) ?? [null, url]
    const token = match[1]
    if (!token) { toast.error('Lien invalide'); return }
    router.push(`/invite/${token}`)
  }

  if (households.length <= 1 && !joinMode) {
    return (
      <button
        onClick={() => setJoinMode(true)}
        className="text-sm text-primary underline underline-offset-4"
      >
        + Rejoindre une autre fourmilière
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {households.map(h => (
        <div key={h.household_id} className="flex items-center justify-between px-4 py-3 bg-card rounded-2xl border">
          <div className="flex items-center gap-2">
            <span className="text-xl">{h.emoji}</span>
            <span className="font-medium text-sm">{h.name}</span>
          </div>
          {h.household_id === activeId ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Actif</span>
          ) : (
            <button
              onClick={() => handleSwitch(h.household_id)}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-xl bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
            >
              Changer
            </button>
          )}
        </div>
      ))}

      {!joinMode ? (
        <button
          onClick={() => setJoinMode(true)}
          className="text-sm text-primary underline underline-offset-4"
        >
          + Rejoindre une autre fourmilière
        </button>
      ) : (
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            value={inviteUrl}
            onChange={e => setInviteUrl(e.target.value)}
            placeholder="Lien d'invitation..."
            className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none focus:border-primary"
           
          />
          <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
            Rejoindre
          </button>
          <button type="button" onClick={() => setJoinMode(false)} className="px-3 py-2 text-sm text-muted-foreground">
            ✕
          </button>
        </form>
      )}
    </div>
  )
}
