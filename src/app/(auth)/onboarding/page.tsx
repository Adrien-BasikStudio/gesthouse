'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const EMOJIS = ['🏠', '🏡', '🏘️', '🏰', '🌻', '🌈', '⭐', '🦋', '🌿', '🎯']

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Créer le foyer
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: name.trim(), emoji, created_by: user.id })
      .select()
      .single()

    if (householdError || !household) {
      toast.error('Erreur lors de la création du foyer')
      setLoading(false)
      return
    }

    // Ajouter le créateur comme admin
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: user.id, role: 'admin' })

    if (memberError) {
      toast.error('Erreur lors de la configuration du foyer')
      setLoading(false)
      return
    }

    toast.success(`Bienvenue dans ${emoji} ${name} !`)
    router.push('/tasks')
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
