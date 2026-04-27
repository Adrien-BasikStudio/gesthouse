'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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

  if (!parsed.success) {
    return { error: 'Données invalides' }
  }

  const { name, emoji } = parsed.data

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name, emoji, created_by: user.id })
    .select()
    .single()

  if (householdError || !household) {
    return { error: householdError?.message ?? 'Erreur création foyer' }
  }

  const { error: memberError } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id, role: 'admin' })

  if (memberError) {
    return { error: memberError.message }
  }

  redirect('/tasks')
}
