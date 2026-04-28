import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/home')
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-8">

        <div className="space-y-4">
          <div className="text-6xl">🐜</div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
            Les Fourmis
          </h1>
          <p className="text-xl font-medium text-foreground/80">
            Le cerveau partagé de votre foyer.
          </p>
          <p className="text-muted-foreground">
            Tâches, agenda, courses, recettes, stock et comptes partagés.
            Une seule app où votre famille s&apos;organise comme une fourmilière.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'w-full text-base')}>
            Je veux y être 🐜
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}>
            Se connecter
          </Link>
        </div>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <span className="text-2xl">✅</span>
              <span>Tâches</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <span className="text-2xl">🛒</span>
              <span>Courses</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <span className="text-2xl">💰</span>
              <span>Dépenses</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <span className="text-2xl">🍳</span>
              <span>Recettes</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <span className="text-2xl">📅</span>
              <span>Agenda</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <span className="text-2xl">📦</span>
              <span>Stock</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Essai 30 jours gratuit · Aucune carte bancaire requise
            </p>
            <p className="text-xs text-muted-foreground">
              Ensuite dès 9,90 CHF/mois · Code <span className="font-medium text-amber-600">EARLY100</span> = -25% à vie
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
