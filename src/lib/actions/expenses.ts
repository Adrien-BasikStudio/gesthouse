'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

function revalidateExpenses() {
  revalidatePath('/expenses/[groupId]', 'page')
  revalidatePath('/expenses')
  revalidatePath('/home')
}

export async function createExpenseGroup(householdId: string, name: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('expense_groups')
    .insert({ household_id: householdId, name, currency: 'CHF', emoji: '💰' })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidateExpenses()
  return { id: data.id }
}

const addExpenseSchema = z.object({
  group_id: z.string().uuid(),
  household_id: z.string().uuid(),
  description: z.string().min(1).max(200),
  amount: z.string().regex(/^\d+([.,]\d{1,2})?$/),
  paid_by: z.string().uuid(),
  category: z.string().optional(),
})

export async function addExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = addExpenseSchema.safeParse({
    group_id: formData.get('group_id'),
    household_id: formData.get('household_id'),
    description: formData.get('description'),
    amount: formData.get('amount'),
    paid_by: formData.get('paid_by'),
    category: formData.get('category') || undefined,
  })
  if (!parsed.success) return { error: 'Données invalides' }

  const amountCents = Math.round(parseFloat(parsed.data.amount.replace(',', '.')) * 100)
  if (amountCents <= 0) return { error: 'Montant invalide' }

  const participantIds = formData.getAll('participants').map(String)
  if (participantIds.length === 0) return { error: 'Sélectionne au moins un participant' }

  const sharePerPerson = Math.floor(amountCents / participantIds.length)
  const remainder = amountCents - sharePerPerson * participantIds.length

  const admin = createAdminClient()
  const { data: expense, error } = await admin
    .from('expenses')
    .insert({
      group_id: parsed.data.group_id,
      household_id: parsed.data.household_id,
      paid_by: parsed.data.paid_by,
      amount_cents: amountCents,
      currency: 'CHF',
      description: parsed.data.description,
      category: parsed.data.category ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const shares = participantIds.map((uid, idx) => ({
    expense_id: expense.id,
    user_id: uid,
    share_cents: sharePerPerson + (idx === 0 ? remainder : 0),
  }))

  const { error: sharesError } = await admin.from('expense_shares').insert(shares)
  if (sharesError) return { error: sharesError.message }

  revalidateExpenses()
  return { success: true }
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const description = String(formData.get('description') ?? '').trim()
  if (!description) return { error: 'Description requise' }

  const amountStr = String(formData.get('amount') ?? '').replace(',', '.')
  const amountCents = Math.round(parseFloat(amountStr) * 100)
  if (!amountCents || amountCents <= 0) return { error: 'Montant invalide' }

  const admin = createAdminClient()
  const { error } = await admin.from('expenses').update({
    description,
    amount_cents: amountCents,
    category: formData.get('category') ? String(formData.get('category')) : null,
    spent_at: formData.get('spent_at') ? String(formData.get('spent_at')) : undefined,
  }).eq('id', expenseId)

  if (error) return { error: error.message }
  revalidateExpenses()
  return { success: true }
}

export async function addSettlement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin.from('expense_settlements').insert({
    group_id: String(formData.get('group_id')),
    household_id: String(formData.get('household_id')),
    from_user: String(formData.get('from_user')),
    to_user: String(formData.get('to_user')),
    amount_cents: Math.round(parseFloat(String(formData.get('amount_cents')))),
    currency: 'CHF',
    note: formData.get('note') ? String(formData.get('note')) : null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidateExpenses()
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('expenses').delete().eq('id', expenseId)
  if (error) return { error: error.message }
  revalidateExpenses()
  return { success: true }
}
