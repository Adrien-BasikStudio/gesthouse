import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <div className="text-6xl">🏠</div>
          <h1 className="text-3xl font-bold tracking-tight">GestHome</h1>
          <p className="text-muted-foreground text-lg">
            Le cerveau partagé de votre foyer. Tâches, courses, repas, dépenses — tout au même endroit.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            Commencer gratuitement
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}>
            Se connecter
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Gratuit pour 2 membres. Aucune carte bancaire requise.
        </p>
      </div>
    </main>
  )
}
