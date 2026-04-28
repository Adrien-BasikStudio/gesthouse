'use client'

import { useEffect } from 'react'

export default function PwaRegister({
  householdId,
}: {
  householdId: string
}) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  useEffect(() => {
    if (!householdId || !('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission === 'denied') return

    async function subscribe() {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        // Re-sync existing subscription
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: existing, householdId }),
        })
        return
      }

      if (Notification.permission !== 'granted') return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, householdId }),
      })
    }

    subscribe().catch(() => {})
  }, [householdId])

  return null
}
