'use client'

import { useTransition } from 'react'
import { leaveHousehold, deleteHousehold } from '@/lib/actions/household'
import { toast } from 'sonner'
import { LogOut, Trash2 } from 'lucide-react'

export default function DangerZone({
  householdId,
  householdName,
  isAdmin,
  memberCount,
}: {
  householdId: string
  householdName: string
  isAdmin: boolean
  memberCount: number
}) {
  const [isPending, startTransition] = useTransition()

  function handleLeave() {
    if (!confirm(`Quitter "${householdName}" ?`)) return
    startTransition(async () => {
      const result = await leaveHousehold(householdId)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleDelete() {
    if (!confirm(`Supprimer définitivement "${householdName}" et toutes ses données ?`)) return
    if (!confirm('Cette action est irréversible. Confirmer ?')) return
    startTransition(async () => {
      const result = await deleteHousehold(householdId)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="bg-card rounded-2xl border border-destructive/20 divide-y">
      <button
        onClick={handleLeave}
        disabled={isPending}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="size-4 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">Quitter le foyer</p>
          <p className="text-xs text-muted-foreground">Tu perdras accès à toutes les données</p>
        </div>
      </button>

      {isAdmin && memberCount <= 1 && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-destructive/5 transition-colors"
        >
          <Trash2 className="size-4 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Supprimer le foyer</p>
            <p className="text-xs text-muted-foreground">Supprime toutes les données définitivement</p>
          </div>
        </button>
      )}
    </div>
  )
}
