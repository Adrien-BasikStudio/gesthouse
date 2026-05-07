import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, Users, ExternalLink, CheckCircle2, Circle, Play } from 'lucide-react'
import { ToggleFavoriteButton, DeleteRecipeButton, AddToShoppingButton, AddMissingToShoppingButton } from '@/components/recipes/recipe-actions'
import PlanMealSheet from '@/components/recipes/plan-meal-sheet'
import EditRecipeSheet from '@/components/recipes/edit-recipe-sheet'

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const [{ data: recipe }, { data: ingredients }, { data: lists }, { data: stockItems }] = await Promise.all([
    admin
      .from('recipes')
      .select('id, title, servings, prep_minutes, cook_minutes, instructions, source_url, video_url, tags, is_favorite, household_id')
      .eq('id', id)
      .single(),
    admin
      .from('recipe_ingredients')
      .select('id, name, quantity, unit, position')
      .eq('recipe_id', id)
      .order('position', { ascending: true }),
    admin
      .from('shopping_lists')
      .select('id, name')
      .eq('household_id', householdId)
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
    admin
      .from('stock_items')
      .select('name, quantity, unit')
      .eq('household_id', householdId),
  ])

  if (!recipe || recipe.household_id !== householdId) notFound()

  const totalMin = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)
  const defaultList = lists?.[0]

  // Détection et extraction de l'ID YouTube
  function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&\n?#]{11})/)
    return match ? match[1] : null
  }

  const youtubeId = recipe.video_url ? getYouTubeId(recipe.video_url) : null
  const isInstagram = recipe.video_url ? recipe.video_url.includes('instagram.com') : false

  // Match ingredients against stock (case-insensitive, accent-insensitive)
  function normalizeName(s: string) {
    return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
  }
  const stockNames = new Set((stockItems ?? []).map(s => normalizeName(s.name)))
  const stockMap = new Map((stockItems ?? []).map(s => [normalizeName(s.name), s]))

  function findInStock(name: string) {
    const norm = normalizeName(name)
    for (const [key, val] of stockMap) {
      if (key === norm || key.includes(norm) || norm.includes(key)) return val
    }
    return null
  }

  const ingredientsWithStock = (ingredients ?? []).map(ing => ({
    ...ing,
    stockInfo: findInStock(ing.name),
  }))

  const missingCount = ingredientsWithStock.filter(i => !i.stockInfo).length

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/recipes"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" /> Recettes
          </Link>
          <div className="flex items-center gap-2">
            <ToggleFavoriteButton recipeId={recipe.id} isFavorite={recipe.is_favorite} />
            <EditRecipeSheet recipe={{ ...recipe, video_url: recipe.video_url ?? null }} ingredients={ingredients ?? []} />
            <DeleteRecipeButton recipeId={recipe.id} />
          </div>
        </div>

        <h1 className="text-2xl font-bold leading-tight">{recipe.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
          {totalMin > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {recipe.prep_minutes ? `${recipe.prep_minutes} min prép.` : ''}
              {recipe.prep_minutes && recipe.cook_minutes ? ' + ' : ''}
              {recipe.cook_minutes ? `${recipe.cook_minutes} min cuisson` : ''}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {recipe.servings} personnes
            </span>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {recipe.tags.map((tag: string) => (
              <span key={tag} className="text-xs px-2.5 py-1 bg-secondary rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
        {/* Ingredients */}
        {ingredientsWithStock.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Ingrédients</h2>
              {stockItems && stockItems.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {ingredientsWithStock.length - missingCount}/{ingredientsWithStock.length} en stock
                </span>
              )}
            </div>
            <div className="bg-card border rounded-2xl divide-y">
              {ingredientsWithStock.map(ing => (
                <div key={ing.id} className="flex items-center gap-3 px-4 py-2.5">
                  {stockItems && stockItems.length > 0 && (
                    ing.stockInfo
                      ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      : <Circle className="size-4 text-muted-foreground/30 shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${ing.stockInfo ? '' : ''}`}>{ing.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {(ing.quantity || ing.unit) && (
                      <span className="text-sm text-muted-foreground">
                        {ing.quantity ?? ''}{ing.unit ? ` ${ing.unit}` : ''}
                      </span>
                    )}
                    {ing.stockInfo && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {ing.stockInfo.quantity != null ? `${ing.stockInfo.quantity}${ing.stockInfo.unit ? ` ${ing.stockInfo.unit}` : ''} dispo` : 'en stock'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video */}
        {recipe.video_url && (
          <section>
            <h2 className="text-base font-semibold mb-2">Vidéo</h2>
            {youtubeId ? (
              <div className="rounded-2xl overflow-hidden aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Vidéo recette"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <a
                href={recipe.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-card border rounded-2xl hover:bg-accent/50 transition-colors"
              >
                <div className="size-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shrink-0">
                  <Play className="size-4 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{isInstagram ? 'Voir sur Instagram' : 'Voir la vidéo'}</p>
                  <p className="text-xs text-muted-foreground truncate">{recipe.video_url}</p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground shrink-0" />
              </a>
            )}
          </section>
        )}

        {/* Instructions */}
        <section>
          <h2 className="text-base font-semibold mb-2">Préparation</h2>
          {recipe.instructions ? (
            <div className="bg-card border rounded-2xl px-4 py-3">
              <p className="text-sm whitespace-pre-line leading-relaxed text-foreground/90">
                {recipe.instructions}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic px-1">
              Aucune instruction. Appuie sur Modifier pour en ajouter.
            </p>
          )}
        </section>

        {/* Source */}
        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Voir la source
          </a>
        )}

        {/* Actions */}
        <section className="space-y-2 pt-2">
          <PlanMealSheet
            recipeId={recipe.id}
            recipeTitle={recipe.title}
            householdId={householdId}
          />
          {defaultList && ingredientsWithStock.length > 0 && (
            <>
              {missingCount > 0 && (
                <AddMissingToShoppingButton
                  recipeId={recipe.id}
                  householdId={householdId}
                  listId={defaultList.id}
                  listName={defaultList.name}
                  missingCount={missingCount}
                />
              )}
              {missingCount === 0 && stockItems && stockItems.length > 0 ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center py-1">
                  Tout est en stock 🎉
                </p>
              ) : (
                <AddToShoppingButton
                  recipeId={recipe.id}
                  householdId={householdId}
                  listId={defaultList.id}
                  listName={defaultList.name}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
