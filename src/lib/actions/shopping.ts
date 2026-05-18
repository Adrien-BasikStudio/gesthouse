'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function revalidateShopping() {
  revalidatePath('/shopping/[listId]', 'page')
  revalidatePath('/shopping')
}

export async function createList(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') || 'Courses').trim()
  const householdId = String(formData.get('household_id'))

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shopping_lists')
    .insert({ household_id: householdId, name })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidateShopping()
  return { id: data.id }
}

export async function addItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') || '').trim()
  if (!name) return { error: 'Nom requis' }

  const listId = String(formData.get('list_id'))
  const householdId = String(formData.get('household_id'))
  const quantity = formData.get('quantity') ? Number(formData.get('quantity')) : null
  const unit = formData.get('unit') ? String(formData.get('unit')) : null

  const admin = createAdminClient()
  const { error } = await admin.from('shopping_items').insert({
    list_id: listId,
    household_id: householdId,
    name,
    quantity,
    unit,
    added_by: user.id,
  })

  if (error) return { error: error.message }
  revalidateShopping()
  return { success: true }
}

export async function toggleItem(itemId: string, checked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('shopping_items')
    .update({
      is_checked: checked,
      checked_by: checked ? user.id : null,
    })
    .eq('id', itemId)

  if (error) return { error: error.message }
  // Pas de revalidatePath : le realtime met à jour le state local directement
  return { success: true }
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin.from('shopping_items').delete().eq('id', itemId)
  if (error) return { error: 'Erreur lors de la suppression' }
  return { success: true }
}

export async function resetList(listId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('shopping_items')
    .update({ is_checked: false, checked_by: null })
    .eq('list_id', listId)

  if (error) return { error: 'Erreur lors de la réinitialisation' }
  revalidateShopping()
  return { success: true }
}

export async function deleteCheckedItems(listId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('shopping_items')
    .delete()
    .eq('list_id', listId)
    .eq('is_checked', true)

  if (error) return { error: 'Erreur lors de la suppression' }
  revalidateShopping()
  return { success: true }
}

export async function addCheckedItemsToStock(listId: string, householdId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: items } = await admin
    .from('shopping_items')
    .select('name, quantity, unit')
    .eq('list_id', listId)
    .eq('is_checked', true)

  if (!items || items.length === 0) return { error: 'Aucun article coché' }

  const { error } = await admin.from('stock_items').insert(
    items.map(item => ({
      household_id: householdId,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? null,
      location: 'placard',
    }))
  )

  if (error) return { error: error.message }
  revalidatePath('/stock')
  return { count: items.length }
}
