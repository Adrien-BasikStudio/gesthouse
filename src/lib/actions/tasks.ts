'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays, addWeeks, addMonths } from 'date-fns'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  due_at: z.string().optional().nullable(),
  recurrence_rule: z.string().optional().nullable(),
  household_id: z.string().uuid(),
})

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createTaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    assigned_to: (() => { const v = formData.get('assigned_to'); return (!v || v === 'none') ? null : String(v) })(),
    due_at: formData.get('due_at') || null,
    recurrence_rule: (() => { const v = formData.get('recurrence_rule'); return (!v || v === 'none') ? null : String(v) })(),
    household_id: formData.get('household_id'),
  })

  if (!parsed.success) return { error: 'Données invalides' }

  const admin = createAdminClient()
  const { error } = await admin.from('tasks').insert({
    ...parsed.data,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  return { success: true }
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: task } = await admin.from('tasks').select('*').eq('id', taskId).single()
  if (!task) return { error: 'Tâche introuvable' }

  await admin.from('tasks').update({
    completed_at: new Date().toISOString(),
    completed_by: user.id,
  }).eq('id', taskId)

  // Génère la prochaine occurrence si récurrente
  if (task.recurrence_rule && task.due_at) {
    const nextDue = getNextOccurrence(new Date(task.due_at), task.recurrence_rule)
    let nextAssignedTo = task.assigned_to
    let nextRotationIndex = task.rotation_index ?? 0

    if (task.rotation_user_ids?.length > 0) {
      nextRotationIndex = (nextRotationIndex + 1) % task.rotation_user_ids.length
      nextAssignedTo = task.rotation_user_ids[nextRotationIndex]
    }

    await admin.from('tasks').insert({
      household_id: task.household_id,
      title: task.title,
      description: task.description,
      assigned_to: nextAssignedTo,
      due_at: nextDue.toISOString(),
      recurrence_rule: task.recurrence_rule,
      rotation_user_ids: task.rotation_user_ids,
      rotation_index: nextRotationIndex,
      category: task.category,
      priority: task.priority,
      created_by: task.created_by,
    })
  }

  revalidatePath('/tasks')
  return { success: true }
}

export async function uncompleteTask(taskId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('tasks')
    .update({ completed_at: null, completed_by: null })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('tasks').delete().eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

function getNextOccurrence(date: Date, rule: string): Date {
  if (rule.includes('FREQ=DAILY')) return addDays(date, 1)
  if (rule.includes('FREQ=WEEKLY')) return addWeeks(date, 1)
  if (rule.includes('FREQ=MONTHLY')) return addMonths(date, 1)
  return addWeeks(date, 1)
}
