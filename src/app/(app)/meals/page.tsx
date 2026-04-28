import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, startOfWeek, format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import DeleteMealButton from '@/components/recipes/delete-meal-button'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Goûter',
}

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner']

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>
}) {
  const { offset = '0' } = await searchParams
  const weekOffset = parseInt(offset, 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = (await getActiveHouseholdId(memberships))!
  const admin = createAdminClient()

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7)
  const weekEnd = addDays(weekStart, 6)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const from = format(weekStart, 'yyyy-MM-dd')
  const to = format(weekEnd, 'yyyy-MM-dd')

  const { data: plans } = await admin
    .from('meal_plans')
    .select('id, recipe_id, custom_title, planned_for, meal_type, servings, recipes(title)')
    .eq('household_id', householdId)
    .gte('planned_for', from)
    .lte('planned_for', to)
    .order('planned_for', { ascending: true })

  const today = new Date()
  const isCurrentWeek = weekOffset === 0

  const weekLabel = isCurrentWeek
    ? 'Cette semaine'
    : weekOffset === 1
    ? 'Semaine prochaine'
    : weekOffset === -1
    ? 'Semaine dernière'
    : `Sem. du ${format(weekStart, 'd MMM', { locale: fr })}`

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Repas</h1>
          <Link
            href="/recipes"
            className="text-sm text-primary hover:underline"
          >
            + Planifier
          </Link>
        </div>

        {/* Week nav */}
        <div className="flex items-center justify-between">
          <Link
            href={`/meals?offset=${weekOffset - 1}`}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold">{weekLabel}</p>
            <p className="text-xs text-muted-foreground">
              {format(weekStart, 'd MMM', { locale: fr })} — {format(weekEnd, 'd MMM yyyy', { locale: fr })}
            </p>
          </div>
          <Link
            href={`/meals?offset=${weekOffset + 1}`}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Days */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayPlans = (plans ?? []).filter(p => p.planned_for === dateStr)
          const isToday = isSameDay(day, today)

          const sortedPlans = [...dayPlans].sort((a, b) => {
            const ai = MEAL_ORDER.indexOf(a.meal_type ?? 'dinner')
            const bi = MEAL_ORDER.indexOf(b.meal_type ?? 'dinner')
            return ai - bi
          })

          return (
            <div
              key={dateStr}
              className={`rounded-2xl border ${isToday ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}
            >
              <div className={`px-4 pt-3 pb-2 flex items-center justify-between ${isToday ? 'text-primary' : ''}`}>
                <span className="text-sm font-semibold">
                  {format(day, 'EEEE d MMM', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
                </span>
                {isToday && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {"Aujourd'hui"}
                  </span>
                )}
              </div>

              {sortedPlans.length === 0 ? (
                <p className="px-4 pb-3 text-xs text-muted-foreground italic">Rien de prévu</p>
              ) : (
                <div className="px-4 pb-3 space-y-1.5">
                  {sortedPlans.map(plan => {
                    const recipeTitle = Array.isArray(plan.recipes)
                      ? (plan.recipes[0] as { title: string } | undefined)?.title
                      : (plan.recipes as { title: string } | null)?.title
                    const title = recipeTitle ?? plan.custom_title ?? 'Repas'
                    return (
                      <div key={plan.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">
                          {MEAL_LABELS[plan.meal_type ?? 'dinner'] ?? plan.meal_type}
                        </span>
                        {plan.recipe_id ? (
                          <Link
                            href={`/recipes/${plan.recipe_id}`}
                            className="text-sm font-medium hover:text-primary transition-colors flex-1 min-w-0 truncate"
                          >
                            {title}
                          </Link>
                        ) : (
                          <span className="text-sm flex-1 min-w-0 truncate">{title}</span>
                        )}
                        <DeleteMealButton planId={plan.id} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
