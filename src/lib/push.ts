import webpush from 'web-push'
import { createAdminClient } from './supabase/admin'

function initWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com'

  if (!publicKey || !privateKey) return false

  webpush.setVapidDetails(email, publicKey, privateKey)
  return true
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!initWebPush()) return

  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const message = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      ).catch(async err => {
        if (err.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}

export async function sendPushToHousehold(
  householdId: string,
  payload: { title: string; body: string; url?: string },
  excludeUserId?: string
) {
  if (!initWebPush()) return

  const admin = createAdminClient()
  let query = admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .eq('household_id', householdId)

  if (excludeUserId) query = query.neq('user_id', excludeUserId)

  const { data: subs } = await query
  if (!subs || subs.length === 0) return

  const message = JSON.stringify(payload)
  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      ).catch(async err => {
        if (err.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}
