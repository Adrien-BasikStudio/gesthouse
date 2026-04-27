import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare } from 'lucide-react'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(name, emoji)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {(membership?.households as { emoji?: string; name?: string })?.emoji}{' '}
            {(membership?.households as { emoji?: string; name?: string })?.name}
          </p>
          <h1 className="text-2xl font-bold">
            Bonjour {profile?.display_name} 👋
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <CheckSquare className="size-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Aucune tâche pour aujourd&apos;hui</p>
        <p className="text-sm text-muted-foreground">Le module tâches arrive bientôt !</p>
      </div>
    </div>
  )
}
