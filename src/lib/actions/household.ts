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
  store.set('fourmis_household', householdId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  revalidatePath('/')
  redirect('/tasks')
}

async function requireAdmin(householdId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Non authentifié' as const }

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { user: null, error: 'Accès refusé' as const }
  return { user, error: null }
}

export async function removeMember(householdId: string, userId: string) {
  const { error: authError } = await requireAdmin(householdId)
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId)

  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateMemberRole(householdId: string, userId: string, role: 'admin' | 'member') {
  const { error: authError } = await requireAdmin(householdId)
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('household_members')
    .update({ role })
    .eq('household_id', householdId)
    .eq('user_id', userId)

  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidatePath('/settings')
  return { success: true }
}

export async function updateHousehold(householdId: string, formData: FormData) {
  const { error: authError } = await requireAdmin(householdId)
  if (authError) return { error: authError }

  const name = String(formData.get('name') ?? '').trim()
  const emoji = String(formData.get('emoji') ?? '').trim()
  if (!name) return { error: 'Nom requis' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('households')
    .update({ name, emoji: emoji || '🏠' })
    .eq('id', householdId)

  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidatePath('/settings')
  revalidatePath('/home')
  return { success: true }
}

export async function leaveHousehold(householdId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Vérifie qu'il reste au moins un autre admin
  const { data: admins } = await admin
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId)
    .eq('role', 'admin')
    .neq('user_id', user.id)

  const { data: members } = await admin
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId)
    .neq('user_id', user.id)

  if (members && members.length > 0 && (!admins || admins.length === 0)) {
    return { error: 'Désigne un autre admin avant de partir.' }
  }

  const { error } = await admin
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Supprime le foyer si plus personne
  if (!members || members.length === 0) {
    await admin.from('households').delete().eq('id', householdId)
  }

  redirect('/onboarding')
}

export async function deleteHousehold(householdId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Vérif admin
  const { data: membership } = await admin
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Accès refusé' }

  const { error } = await admin.from('households').delete().eq('id', householdId)
  if (error) return { error: error.message }

  redirect('/onboarding')
}
