'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendPushToHousehold } from '@/lib/push'
import { differenceInDays, parseISO } from 'date-fns'

export async function addStockItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Nom requis' }

  const admin = createAdminClient()
  const { error } = await admin.from('stock_items').insert({
    household_id: String(formData.get('household_id')),
    name,
    quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
    unit: formData.get('unit') ? String(formData.get('unit')) : null,
    location: formData.get('location') ? String(formData.get('location')) : 'placard',
    category: formData.get('category') ? String(formData.get('category')) : null,
    expires_on: formData.get('expires_on') ? String(formData.get('expires_on')) : null,
  })

  if (error) return { error: error.message }

  // Alert if expires within 3 days
  const expiresOn = formData.get('expires_on') ? String(formData.get('expires_on')) : null
  if (expiresOn) {
    const days = differenceInDays(parseISO(expiresOn), new Date())
    if (days <= 3 && days >= 0) {
      const name = String(formData.get('name') ?? '')
      await sendPushToHousehold(String(formData.get('household_id')), {
        title: 'Article bientôt périmé',
        body: `${name} expire dans ${days === 0 ? "aujourd'hui" : `${days} jour${days > 1 ? 's' : ''}`}`,
        url: '/stock',
      })
    }
  }

  revalidatePath('/stock')
  return { success: true }
}

export async function deleteStockItem(itemId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('stock_items').delete().eq('id', itemId)
  if (error) return { error: error.message }
  revalidatePath('/stock')
  return { success: true }
}

export async function updateStockItem(itemId: string, formData: FormData) {
  const admin = createAdminClient()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Nom requis' }

  const { error } = await admin.from('stock_items').update({
    name,
    quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
    unit: formData.get('unit') ? String(formData.get('unit')) : null,
    location: formData.get('location') ? String(formData.get('location')) : 'placard',
    category: formData.get('category') ? String(formData.get('category')) : null,
    expires_on: formData.get('expires_on') ? String(formData.get('expires_on')) : null,
  }).eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/stock')
  return { success: true }
}

export async function updateQuantity(itemId: string, delta: number) {
  const admin = createAdminClient()
  const { data: item } = await admin
    .from('stock_items')
    .select('quantity')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Introuvable' }

  const newQty = Math.max(0, (item.quantity ?? 1) + delta)

  if (newQty === 0) {
    await admin.from('stock_items').delete().eq('id', itemId)
  } else {
    await admin.from('stock_items').update({ quantity: newQty }).eq('id', itemId)
  }

  revalidatePath('/stock')
  return { success: true }
}
