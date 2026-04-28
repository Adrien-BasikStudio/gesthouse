'use client'

import { useTransition } from 'react'
import { X } from 'lucide-react'
import { deleteMealPlan } from '@/lib/actions/recipes'

export default function DeleteMealButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      await deleteMealPlan(planId)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="shrink-0 size-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
    >
      <X className="size-3" />
    </button>
  )
}
