'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const content = String(formData.get('content') ?? '').trim()
  if (!content) return { error: 'Contenu requis' }

  const householdId = String(formData.get('household_id'))
  const noteDate = String(formData.get('note_date') ?? new Date().toISOString().slice(0, 10))
  const title = formData.get('title') ? String(formData.get('title')).trim() : null
  const isShared = formData.get('is_shared') === 'true'
  const color = formData.get('color') ? String(formData.get('color')) : '#8B5CF6'

  const admin = createAdminClient()
  const { error } = await admin.from('notes').insert({
    household_id: householdId,
    user_id: user.id,
    title: title || null,
    content,
    note_date: noteDate,
    is_shared: isShared,
    color,
  })

  if (error) return { error: error.message }
  revalidatePath('/notes')
  revalidatePath('/calendar')
  return { success: true }
}

export async function updateNote(noteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const content = String(formData.get('content') ?? '').trim()
  if (!content) return { error: 'Contenu requis' }

  const title = formData.get('title') ? String(formData.get('title')).trim() : null
  const isShared = formData.get('is_shared') === 'true'
  const color = formData.get('color') ? String(formData.get('color')) : '#8B5CF6'
  const noteDate = String(formData.get('note_date'))

  const admin = createAdminClient()
  // Vérifie que la note appartient à l'utilisateur
  const { data: note } = await admin.from('notes').select('user_id').eq('id', noteId).single()
  if (!note || note.user_id !== user.id) return { error: 'Non autorisé' }

  const { error } = await admin.from('notes').update({
    title: title || null,
    content,
    note_date: noteDate,
    is_shared: isShared,
    color,
    updated_at: new Date().toISOString(),
  }).eq('id', noteId)

  if (error) return { error: error.message }
  revalidatePath('/notes')
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: note } = await admin.from('notes').select('user_id').eq('id', noteId).single()
  if (!note || note.user_id !== user.id) return { error: 'Non autorisé' }

  const { error } = await admin.from('notes').delete().eq('id', noteId)
  if (error) return { error: error.message }
  revalidatePath('/notes')
  revalidatePath('/calendar')
  return { success: true }
}
