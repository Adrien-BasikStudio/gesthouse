import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import NotesClient from '@/components/notes/notes-client'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = (await getActiveHouseholdId(memberships))!
  const admin = createAdminClient()

  // Toutes les notes : les miennes + les partagées du foyer
  const { data: notes } = await admin
    .from('notes')
    .select('id, title, content, note_date, is_shared, color, user_id, profiles:user_id(display_name)')
    .or(`user_id.eq.${user.id},and(is_shared.eq.true,household_id.eq.${householdId})`)
    .eq('household_id', householdId)
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <NotesClient
      initialNotes={(notes ?? []) as any}
      householdId={householdId}
      currentUserId={user.id}
    />
  )
}
