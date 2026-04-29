'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const eventSchema = z.object({
  household_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
  all_day: z.boolean().default(false),
  location: z.string().optional(),
  color: z.string().optional(),
})

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const allDay = formData.get('all_day') === 'true'
  const dateStr = String(formData.get('date'))
  const startTime = String(formData.get('start_time') || '09:00')
  const endTime = String(formData.get('end_time') || '10:00')

  const startsAt = allDay
    ? `${dateStr}T00:00:00`
    : `${dateStr}T${startTime}:00`
  const endsAt = allDay
    ? `${dateStr}T23:59:59`
    : `${dateStr}T${endTime}:00`

  const attendeeIds = formData.getAll('attendees').map(String).filter(Boolean)

  const parsed = eventSchema.safeParse({
    household_id: formData.get('household_id'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    location: formData.get('location') || undefined,
    color: formData.get('color') || undefined,
  })

  if (!parsed.success) return { error: 'Données invalides' }

  const admin = createAdminClient()
  const { error } = await admin.from('events').insert({
    ...parsed.data,
    attendee_ids: attendeeIds.length > 0 ? attendeeIds : null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const allDay = formData.get('all_day') === 'true'
  const dateStr = String(formData.get('date'))
  const startTime = String(formData.get('start_time') || '09:00')
  const endTime = String(formData.get('end_time') || '10:00')
  const attendeeIds = formData.getAll('attendees').map(String).filter(Boolean)

  const admin = createAdminClient()
  const { error } = await admin.from('events').update({
    title: String(formData.get('title')),
    starts_at: allDay ? `${dateStr}T00:00:00` : `${dateStr}T${startTime}:00`,
    ends_at: allDay ? `${dateStr}T23:59:59` : `${dateStr}T${endTime}:00`,
    all_day: allDay,
    location: formData.get('location') ? String(formData.get('location')) : null,
    color: formData.get('color') ? String(formData.get('color')) : null,
    attendee_ids: attendeeIds.length > 0 ? attendeeIds : null,
  }).eq('id', eventId)

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}
