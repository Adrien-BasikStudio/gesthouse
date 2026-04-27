import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import AcceptInviteButton from '@/components/settings/accept-invite-button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('household_invitations')
    .select('*, households(name, emoji)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold">Lien invalide ou expiré</h1>
          <p className="text-muted-foreground text-sm">
            Ce lien d&apos;invitation n&apos;est plus valide. Demande un nouveau lien à l&apos;admin de la fourmilière.
          </p>
          <Link href="/" className={cn(buttonVariants(), 'w-full')}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    )
  }

  const household = invite.households as unknown as { name: string; emoji: string }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="space-y-6 max-w-sm">
          <div className="text-5xl">{household.emoji}</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Tu es invité(e) dans</h1>
            <p className="text-xl font-semibold text-primary">{household.name}</p>
          </div>
          <p className="text-muted-foreground text-sm">
            Connecte-toi ou crée un compte pour rejoindre la fourmilière.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/signup?next=/invite/${token}`}
              className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
            >
              Créer un compte 🐜
            </Link>
            <Link
              href={`/login?next=/invite/${token}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-sm">
        <div className="text-5xl">{household.emoji}</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Rejoindre la fourmilière</h1>
          <p className="text-xl font-semibold text-primary">{household.name}</p>
        </div>
        <p className="text-muted-foreground text-sm">
          Clique sur le bouton pour rejoindre ce foyer.
        </p>
        <AcceptInviteButton token={token} />
      </div>
    </main>
  )
}
