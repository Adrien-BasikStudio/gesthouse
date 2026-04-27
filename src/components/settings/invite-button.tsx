'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Copy, Check } from 'lucide-react'
import { generateInviteLink } from '@/lib/actions/household'
import { toast } from 'sonner'

export default function InviteButton({ householdId }: { householdId: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateInviteLink(householdId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.link) {
        setLink(result.link)
      }
    })
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  if (link) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">Lien prêt</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm font-medium text-primary disabled:opacity-50"
    >
      <UserPlus className="size-4" />
      {isPending ? 'Génération...' : 'Inviter'}
    </button>
  )
}
