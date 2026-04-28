'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const displayName = String(formData.get('display_name') ?? '').trim()
  if (!displayName) return { error: 'Nom requis' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/home')
  revalidatePath('/tasks')
  return { success: true }
}
