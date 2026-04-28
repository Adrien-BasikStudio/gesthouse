'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/tasks'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { full_name: name.trim() || email.split('@')[0] },
      },
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="text-4xl mb-2">📬</div>
            <CardTitle>Confirme ton email</CardTitle>
            <CardDescription>
              On a envoyé un lien à <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clique sur le lien pour activer ton compte. Ensuite tu pourras te connecter. 🐜
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🐜</div>
          <CardTitle>Rejoins la fourmilière</CardTitle>
          <CardDescription>Essai 30 jours gratuit · Sans carte bancaire</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Prénom</Label>
              <Input
                id="name"
                type="text"
                placeholder="Adrien"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ton@email.ch"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="8 caractères minimum"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte 🐜'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
