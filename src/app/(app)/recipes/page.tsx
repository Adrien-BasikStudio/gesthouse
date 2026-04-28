import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart, Clock } from 'lucide-react'
import AddRecipeSheet from '@/components/recipes/add-recipe-sheet'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>
}) {
  const { q = '', filter = 'all' } = await searchParams

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

  let query = admin
    .from('recipes')
    .select('id, title, servings, prep_minutes, cook_minutes, tags, is_favorite')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })

  if (filter === 'favorites') query = query.eq('is_favorite', true)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: recipes } = await query

  const filters = [
    { value: 'all', label: 'Toutes' },
    { value: 'favorites', label: 'Favoris' },
  ]

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recettes</h1>
          <span className="text-sm text-muted-foreground">{recipes?.length ?? 0} recettes</span>
        </div>

        {/* Search */}
        <form method="GET" className="relative">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher une recette…"
            className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 pr-10"
          />
          {q && (
            <Link
              href={`/recipes${filter !== 'all' ? `?filter=${filter}` : ''}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
            >
              ✕
            </Link>
          )}
          <input type="hidden" name="filter" value={filter} />
        </form>

        {/* Filters */}
        <div className="flex gap-1.5">
          {filters.map(f => (
            <Link
              key={f.value}
              href={`/recipes?filter=${f.value}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {f.value === 'favorites' && <span className="mr-1">♥</span>}
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {(recipes?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-3xl">👨‍🍳</p>
            <p className="font-medium text-muted-foreground">
              {q || filter === 'favorites' ? 'Aucune recette trouvée.' : 'Aucune recette pour le moment.'}
            </p>
            {!q && filter === 'all' && (
              <p className="text-sm text-muted-foreground">Appuie sur + pour ajouter ta première recette.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 py-2">
            {(recipes ?? []).map(recipe => {
              const totalMin = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)
              return (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-start gap-3 px-4 py-3 bg-card rounded-2xl border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold leading-snug">{recipe.title}</span>
                      {recipe.is_favorite && <Heart className="size-3.5 fill-rose-500 text-rose-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {totalMin > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {totalMin} min
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="text-xs text-muted-foreground">{recipe.servings} pers.</span>
                      )}
                    </div>
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {recipe.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <AddRecipeSheet householdId={householdId} />
    </div>
  )
}
