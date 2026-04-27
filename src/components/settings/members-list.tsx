'use client'

import { useTransition } from 'react'
import { Crown, X } from 'lucide-react'
import { removeMember } from '@/lib/actions/household'
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
                {member.role === 'admin' && (
                  <Crown className="size-3.5 text-amber-500" />
                )}
                {isCurrentUser && (
                  <span className="text-xs text-muted-foreground">(toi)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
            </div>

            {isAdmin && !isCurrentUser && (
              <button
                onClick={() => handleRemove(member.user_id, name)}
                disabled={isPending}
                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
