'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHousehold } from '@/lib/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const EMOJIS = ['🏠', '🏡', '🏘️', '🏰', '🌻', '🌈', '⭐', '🦋', '🌿', '🎯']

export default function OnboardingPage() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [emoji, setEmoji] = useState('🏠')
  const [name, setName] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('emoji', emoji)
    const result = await createHousehold(formData)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
  }

  function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const url = inviteUrl.trim()
    // Extract token from full URL or bare token
    const match = url.match(/\/invite\/([a-zA-Z0-9_-]+)/) ?? [null, url]
    const token = match[1]
    if (!token) {
      toast.error('Lien invalide')
      return
    }
    router.push(`/invite/${token}`)
  }

  if (mode === 'choose') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🐜</div>
            <CardTitle>Bienvenue !</CardTitle>
            <CardDescription>Comment veux-tu commencer ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => setMode('create')}>
              🏠 Créer ma fourmilière
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setMode('join')}>
              🔗 Rejoindre avec un lien d&apos;invitation
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (mode === 'join') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🔗</div>
            <CardTitle>Rejoindre une fourmilière</CardTitle>
            <CardDescription>Colle le lien d&apos;invitation reçu</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite">Lien d&apos;invitation</Label>
                <Input
                  id="invite"
                  placeholder="https://… ou juste le code"
                  value={inviteUrl}
                  onChange={e => setInviteUrl(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">Rejoindre</Button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Retour
              </button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🏠</div>
          <CardTitle>Crée ta fourmilière</CardTitle>
          <CardDescription>Donne un nom à ton foyer pour commencer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la fourmilière</Label>
              <Input
                id="name"
                name="name"
                placeholder="Famille Martin"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg transition-colors ${
                      emoji === e ? 'bg-primary/15 ring-2 ring-primary' : 'hover:bg-muted'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? 'Création...' : `Créer ${emoji} ${name || 'ma fourmilière'}`}
            </Button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
