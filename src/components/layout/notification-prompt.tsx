'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

export default function NotificationPrompt({ householdId }: { householdId: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission !== 'default') return
    const dismissed = sessionStorage.getItem('notif-dismissed')
    if (dismissed) return
    // Show after 3 seconds
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  async function handleAllow() {
    const permission = await Notification.requestPermission()
    setShow(false)
    if (permission !== 'granted') return

    const reg = await navigator.serviceWorker.ready
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

  function handleDismiss() {
    sessionStorage.setItem('notif-dismissed', '1')
    setShow(false)
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto bg-card border rounded-2xl shadow-lg p-4 flex items-start gap-3">
      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Activer les notifications</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Reçois des alertes pour les tâches, la péremption du stock et les repas.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAllow}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Activer
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground">
        <X className="size-4" />
      </button>
    </div>
  )
}
