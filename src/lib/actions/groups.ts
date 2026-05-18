'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Nom requis' }

  const admin = createAdminClient()
  const { data, error } = await admin.from('household_groups').insert({
    household_id: String(formData.get('household_id')),
    name,
    emoji: formData.get('emoji') ? String(formData.get('emoji')) : null,
    color: formData.get('color') ? String(formData.get('color')) : '#6366f1',
  }).select('id').single()

  if (error) return { error: error.message }

  // Add selected members
  const memberIds = formData.getAll('member_ids').map(String).filter(Boolean)
  if (memberIds.length > 0) {
    await admin.from('group_members').insert(
      memberIds.map(uid => ({ group_id: data.id, user_id: uid }))
    )
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateGroup(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Nom requis' }

  const admin = createAdminClient()
  const { error } = await admin.from('household_groups').update({
    name,
    emoji: formData.get('emoji') ? String(formData.get('emoji')) : null,
    color: formData.get('color') ? String(formData.get('color')) : '#6366f1',
  }).eq('id', groupId)

  if (error) return { error: error.message }

  // Replace members
  await admin.from('group_members').delete().eq('group_id', groupId)
  const memberIds = formData.getAll('member_ids').map(String).filter(Boolean)
  if (memberIds.length > 0) {
    await admin.from('group_members').insert(
      memberIds.map(uid => ({ group_id: groupId, user_id: uid }))
    )
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  await admin.from('household_groups').delete().eq('id', groupId)
  revalidatePath('/settings')
  return { success: true }
}
