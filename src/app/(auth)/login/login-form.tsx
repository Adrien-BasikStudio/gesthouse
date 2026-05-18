'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/tasks'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      toast.error('Email ou mot de passe incorrect')
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🐜</div>
          <CardTitle>Content de te revoir !</CardTitle>
          <CardDescription>Connecte-toi à ta fourmilière</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ton@email.ch"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-3">
            <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
              Mot de passe oublié ?
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-2">
            Pas encore là ?{' '}
            <Link
              href={`/signup${next !== '/tasks' ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Créer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground/60 mt-4">
        <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
          Politique de confidentialité
        </Link>
      </p>
    </main>
  )
}
