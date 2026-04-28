import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInDays, parseISO, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckSquare, ChevronRight, Clock } from 'lucide-react'
import { formatChf } from '@/lib/expenses'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, households(name, emoji)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = (await getActiveHouseholdId(memberships))!
  const admin = createAdminClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [
    { data: todayTasks },
    { data: tonightMeal },
    { data: expiringSoon },
    { data: balances },
    { data: shoppingLists },
  ] = await Promise.all([
    admin.from('tasks')
      .select('id, title, completed_at, assigned_to, profiles:assigned_to(display_name)')
      .eq('household_id', householdId)
      .is('completed_at', null)
      .or(`due_at.is.null,due_at.lte.${startOfDay(new Date()).toISOString()}`)
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(5),
    admin.from('meal_plans')
      .select('id, meal_type, custom_title, recipes(title)')
      .eq('household_id', householdId)
      .eq('planned_for', today)
      .in('meal_type', ['dinner', 'lunch'])
      .order('meal_type', { ascending: false })
      .limit(3),
    admin.from('stock_items')
      .select('id, name, expires_on')
      .eq('household_id', householdId)
      .not('expires_on', 'is', null)
      .lte('expires_on', format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      .order('expires_on', { ascending: true })
      .limit(5),
    admin.from('expense_groups')
      .select('id, expense_balances(user_id, balance_cents)')
      .eq('household_id', householdId)
      .eq('is_archived', false)
      .limit(1)
      .single(),
    admin.from('shopping_lists')
      .select('id')
      .eq('household_id', householdId)
      .eq('is_archived', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  type RawBalance = { user_id: string; balance_cents: number }
  const myBalance = (balances?.expense_balances as unknown as RawBalance[] | null)
    ?.find(b => b.user_id === user.id)
  const balanceCents = myBalance?.balance_cents ?? 0

  const household = memberships[0].households as unknown as { name: string; emoji: string } | null

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full px-4 pt-6 pb-24 space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{household?.emoji} {household?.name}</p>
        <h1 className="text-2xl font-bold mt-0.5">
          {greeting()}, {profile?.display_name} 🐜
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">
          {format(new Date(), 'EEEE d MMMM', { locale: fr })}
        </p>
      </div>

      {/* Expiry alert */}
      {expiringSoon && expiringSoon.length > 0 && (
        <Link href="/stock" className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 hover:bg-amber-100 transition-colors">
          <span>⚠️</span>
          <span className="flex-1">
            <strong>{expiringSoon[0].name}</strong>
            {expiringSoon.length > 1 && ` + ${expiringSoon.length - 1} autre${expiringSoon.length > 2 ? 's' : ''}`}
            {' '}à consommer bientôt
          </span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      )}

      {/* Today's tasks */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Tâches du jour</h2>
          <Link href="/tasks" className="text-xs text-primary hover:underline">Tout voir</Link>
        </div>

        {!todayTasks || todayTasks.length === 0 ? (
          <div className="bg-card border rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckSquare className="size-4" />
            Aucune tâche en attente 🎉
          </div>
        ) : (
          <div className="bg-card border rounded-2xl divide-y overflow-hidden">
            {todayTasks.map(task => (
              <Link key={task.id} href="/tasks" className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                <div className="size-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                <span className="text-sm flex-1 min-w-0 truncate">{task.title}</span>
                {task.profiles && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(task.profiles as unknown as { display_name: string }).display_name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tonight's meal */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Au menu ce soir</h2>
          <Link href="/meals" className="text-xs text-primary hover:underline">Planning</Link>
        </div>

        {!tonightMeal || tonightMeal.length === 0 ? (
          <Link href="/recipes" className="flex items-center gap-2 bg-card border rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-accent/50 transition-colors">
            <span>🍽️</span>
            <span className="flex-1">Rien de planifié — ajouter une recette ?</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        ) : (
          <div className="bg-card border rounded-2xl divide-y overflow-hidden">
            {tonightMeal.map(meal => {
              const title = meal.recipes
                ? (Array.isArray(meal.recipes) ? (meal.recipes[0] as { title: string })?.title : (meal.recipes as { title: string }).title)
                : meal.custom_title ?? 'Repas'
              return (
                <Link key={meal.id} href="/meals" className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                  <span className="text-base">🍽️</span>
                  <span className="text-sm font-medium flex-1">{title}</span>
                  <span className="text-xs text-muted-foreground capitalize">{meal.meal_type === 'dinner' ? 'Dîner' : 'Déjeuner'}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Shopping quick access */}
      {shoppingLists?.id && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Courses</h2>
            <Link href={`/shopping/${shoppingLists.id}`} className="text-xs text-primary hover:underline">Voir la liste</Link>
          </div>
          <Link
            href={`/shopping/${shoppingLists.id}`}
            className="flex items-center gap-3 bg-card border rounded-2xl px-4 py-3 hover:bg-accent/50 transition-colors"
          >
            <span className="text-xl">🛒</span>
            <span className="text-sm flex-1">Liste de courses</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </section>
      )}

      {/* Balance */}
      {balances && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Mon solde</h2>
            <Link href={`/expenses/${balances.id}`} className="text-xs text-primary hover:underline">Détails</Link>
          </div>
          <div className={`bg-card border rounded-2xl px-4 py-3 flex items-center gap-3 ${
            balanceCents > 0 ? 'border-green-200 bg-green-50' :
            balanceCents < 0 ? 'border-red-200 bg-red-50' : ''
          }`}>
            <span className="text-xl">{balanceCents >= 0 ? '💚' : '🔴'}</span>
            <div>
              <p className="text-sm font-semibold">
                {balanceCents > 0 ? 'On te doit ' : balanceCents < 0 ? 'Tu dois ' : 'Tout est équilibré'}
                {balanceCents !== 0 && (
                  <span className={balanceCents > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatChf(Math.abs(balanceCents))}
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
