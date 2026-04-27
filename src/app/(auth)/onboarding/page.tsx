'use client'

import { useState } from 'react'
import { createHousehold } from '@/lib/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const EMOJIS = ['🏠', '🏡', '🏘️', '🏰', '🌻', '🌈', '⭐', '🦋', '🌿', '🎯']

export default function OnboardingPage() {
  const [emoji, setEmoji] = useState('🏠')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <CardTitle>Bienvenue sur GestHome</CardTitle>
          <CardDescription>Créez votre foyer pour commencer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du foyer</Label>
              <Input
                id="name"
                name="name"
                placeholder="Famille Martin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg transition-colors ${
                      emoji === e
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? 'Création en cours...' : `Créer ${emoji} ${name || 'mon foyer'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
