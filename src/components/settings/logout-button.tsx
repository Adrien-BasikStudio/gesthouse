'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-3 w-full p-4 text-destructive hover:bg-destructive/5 transition-colors rounded-2xl"
    >
      <LogOut className="size-4" />
      <span className="text-sm font-medium">
        {isPending ? 'Déconnexion...' : 'Se déconnecter'}
      </span>
    </button>
  )
}
