'use client'

import { useTransition } from 'react'
import { addSettlement } from '@/lib/actions/expenses'
import { formatChf, minimizeTransfers, type BalanceEntry } from '@/lib/expenses'
import { toast } from 'sonner'

export default function BalancesView({
  balances,
  groupId,
  householdId,
  currentUserId,
}: {
  balances: BalanceEntry[]
  groupId: string
  householdId: string
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()
  const transfers = minimizeTransfers(balances)

  function handleSettle(fromUserId: string, toUserId: string, cents: number) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('group_id', groupId)
      fd.set('household_id', householdId)
      fd.set('from_user', fromUserId)
      fd.set('to_user', toUserId)
      fd.set('amount_cents', String(cents))
      const result = await addSettlement(fd)
      if (result?.error) toast.error(result.error)
      else toast.success('Règlement enregistré ✓')
    })
  }

  if (balances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-3xl">⚖️</p>
        <p className="font-medium text-muted-foreground">Aucune dépense pour l&apos;instant.</p>
      </div>
    )
  }

  const allSettled = transfers.length === 0

  return (
    <div className="space-y-6 py-2">
      {/* Individual balances */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-1">Soldes</p>
        {balances.map(b => (
          <div key={b.userId} className="flex items-center justify-between px-4 py-3 bg-card rounded-2xl border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                {b.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{b.name}</span>
              {b.userId === currentUserId && <span className="text-xs text-muted-foreground">(toi)</span>}
            </div>
            <span className={`text-sm font-semibold ${b.cents > 0 ? 'text-green-600' : b.cents < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {b.cents > 0 ? '+' : ''}{formatChf(b.cents)}
            </span>
          </div>
        ))}
      </div>

      {/* Transfers to settle */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-1">
          {allSettled ? 'Tout est réglé 🎉' : 'À rembourser'}
        </p>
        {transfers.map((t, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 bg-card rounded-2xl border">
            <div className="text-sm">
              <span className="font-medium">{t.fromName}</span>
              <span className="text-muted-foreground"> doit </span>
              <span className="font-semibold text-primary">{formatChf(t.cents)}</span>
              <span className="text-muted-foreground"> à </span>
              <span className="font-medium">{t.toName}</span>
            </div>
            {(t.fromUserId === currentUserId || t.toUserId === currentUserId) && (
              <button
                onClick={() => handleSettle(t.fromUserId, t.toUserId, t.cents)}
                disabled={isPending}
                className="ml-3 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 shrink-0"
              >
                Réglé ✓
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
