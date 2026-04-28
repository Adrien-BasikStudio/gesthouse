'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { addDays } from 'date-fns'

const createHouseholdSchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().min(1),
})

export async function createHousehold(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createHouseholdSchema.safeParse({
    name: formData.get('name'),
    emoji: formData.get('emoji'),
  })

  if (!parsed.success) return { error: 'Données invalides' }

  const { name, emoji } = parsed.data
  const admin = createAdminClient()

  const { data: household, error: householdError } = await admin
    .from('households')
    .insert({ name, emoji, created_by: user.id })
    .select()
    .single()

  if (householdError || !household) {
    return { error: householdError?.message ?? 'Erreur création foyer' }
  }

  const { error: memberError } = await admin
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id, role: 'admin' })

  if (memberError) return { error: memberError.message }

  redirect('/tasks')
}

export async function generateInviteLink(householdId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const token = randomBytes(24).toString('hex')
  const admin = createAdminClient()

  const { error } = await admin.from('household_invitations').insert({
    household_id: householdId,
    email: `invite_${token}@lesfourmis.link`,
    invited_by: user.id,
    token,
    expires_at: addDays(new Date(), 7).toISOString(),
  })

  if (error) return { error: error.message }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return { link: `${appUrl}/invite/${token}` }
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Connecte-toi d\'abord', redirectLogin: true }

  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('household_invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return { error: 'Ce lien est invalide ou a expiré.' }

  // Vérifie si déjà membre
  const { data: existing } = await admin
    .from('household_members')
    .select('user_id')
    .eq('household_id', invite.household_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: memberError } = await admin
      .from('household_members')
      .insert({ household_id: invite.household_id, user_id: user.id, role: 'member' })

    if (memberError) return { error: memberError.message }
  }

  await admin
    .from('household_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  revalidatePath('/tasks')
  redirect('/tasks')
}

export async function switchHousehold(householdId: string) {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.set('fourmis_household', householdId, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  revalidatePath('/')
  redirect('/tasks')
}

export async function removeMember(householdId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
