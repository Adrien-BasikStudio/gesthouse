'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const createHouseholdSchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().min(1),
})

export async function createHousehold(formData: FormData) {
  // Vérifie l'identité via le client normal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createHouseholdSchema.safeParse({
    name: formData.get('name'),
    emoji: formData.get('emoji'),
  })

  if (!parsed.success) {
    return { error: 'Données invalides' }
  }

  const { name, emoji } = parsed.data

  // Utilise le client admin pour l'insert (bypass RLS pour l'initialisation)
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

  if (memberError) {
    return { error: memberError.message }
  }

  redirect('/tasks')
}
