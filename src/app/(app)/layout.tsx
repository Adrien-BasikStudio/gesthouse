import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import BottomNav from '@/components/layout/bottom-nav'
import NotesFab from '@/components/layout/notes-fab'
import PwaRegister from '@/components/layout/pwa-register'
import NotificationPrompt from '@/components/layout/notification-prompt'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get household for push subscriptions
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  const householdId = memberships && memberships.length > 0
    ? (await getActiveHouseholdId(memberships)) ?? memberships[0].household_id
    : null

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {householdId && (
        <>
          <PwaRegister householdId={householdId} />
          <NotificationPrompt householdId={householdId} />
        </>
      )}
      <main className="flex-1">{children}</main>
      <NotesFab />
      <BottomNav />
    </div>
  )
}
