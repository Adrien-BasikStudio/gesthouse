'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { KeyRound, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export default function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next.length < 8) { toast.error('8 caractères minimum'); return }
    if (next !== confirm) { toast.error('Les mots de passe ne correspondent pas'); return }

    setLoading(true)
    const supabase = createClient()

    // Re-authentifier avec le mot de passe actuel
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { toast.error('Session invalide'); setLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })

    if (signInError) {
      toast.error('Mot de passe actuel incorrect')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: next })
    setLoading(false)

    if (error) { toast.error('Erreur lors du changement'); return }

    toast.success('Mot de passe mis à jour !')
    setCurrent(''); setNext(''); setConfirm('')
    setOpen(false)
  }

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <KeyRound className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1 text-left">Changer le mot de passe</span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t pt-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw" className="text-xs">Mot de passe actuel</Label>
            <Input id="current-pw" type="password" value={current} onChange={e => setCurrent(e.target.value)} required placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw" className="text-xs">Nouveau mot de passe</Label>
            <Input id="new-pw" type="password" value={next} onChange={e => setNext(e.target.value)} required placeholder="8 caractères minimum" minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw" className="text-xs">Confirmer</Label>
            <Input id="confirm-pw" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" size="sm" disabled={loading}>
            {loading ? 'Mise à jour…' : 'Enregistrer'}
          </Button>
        </form>
      )}
    </div>
  )
}
