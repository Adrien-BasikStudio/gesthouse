'use client'

import { useTransition } from 'react'
import { Crown, X, ShieldCheck, ShieldOff } from 'lucide-react'
import { removeMember, updateMemberRole } from '@/lib/actions/household'
import { toast } from 'sonner'

type Member = {
  user_id: string
  role: string
  profiles: { display_name: string; avatar_url: string | null } | null
}

export default function MembersList({
  members,
  currentUserId,
  householdId,
  isAdmin,
}: {
  members: Member[]
  currentUserId: string
  householdId: string
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Retirer ${name} de la fourmilière ?`)) return
    startTransition(async () => {
      const result = await removeMember(householdId, userId)
      if (result?.error) toast.error(result.error)
      else toast.success(`${name} a été retiré.`)
    })
  }

  function handleRoleToggle(userId: string, currentRole: string, name: string) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const msg = newRole === 'admin'
      ? `Passer ${name} en admin ?`
      : `Retirer les droits admin de ${name} ?`
    if (!confirm(msg)) return
    startTransition(async () => {
      const result = await updateMemberRole(householdId, userId, newRole)
      if (result?.error) toast.error(result.error)
      else toast.success(`Rôle de ${name} mis à jour.`)
    })
  }

  return (
    <div className="bg-card rounded-2xl border divide-y">
      {members.map((member) => {
        const name = member.profiles?.display_name ?? 'Membre'
        const isCurrentUser = member.user_id === currentUserId
        const initial = name.charAt(0).toUpperCase()

        return (
          <div key={member.user_id} className="flex items-center gap-3 p-3">
            <div className="size-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm">{name}</span>
                {member.role === 'admin' && <Crown className="size-3.5 text-amber-500" />}
                {isCurrentUser && <span className="text-xs text-muted-foreground">(toi)</span>}
              </div>
              <p className="text-xs text-muted-foreground capitalize">{member.role === 'admin' ? 'Admin' : 'Membre'}</p>
            </div>

            {isAdmin && !isCurrentUser && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRoleToggle(member.user_id, member.role, name)}
                  disabled={isPending}
                  title={member.role === 'admin' ? 'Retirer admin' : 'Passer admin'}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                >
                  {member.role === 'admin'
                    ? <ShieldOff className="size-4" />
                    : <ShieldCheck className="size-4" />
                  }
                </button>
                <button
                  onClick={() => handleRemove(member.user_id, name)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
