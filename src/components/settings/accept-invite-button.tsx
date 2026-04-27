'use client'

import { useTransition } from 'react'
import { acceptInvite } from '@/lib/actions/household'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvite(token)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
    >
      {isPending ? 'Rejoindre...' : 'Rejoindre 🐜'}
    </button>
  )
}
