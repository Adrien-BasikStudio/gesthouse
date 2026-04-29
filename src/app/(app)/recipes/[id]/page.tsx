import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, Users, ExternalLink } from 'lucide-react'
import { ToggleFavoriteButton, DeleteRecipeButton, AddToShoppingButton } from '@/components/recipes/recipe-actions'
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

  const [{ data: recipe }, { data: ingredients }, { data: lists }] = await Promise.all([
    admin
      .from('recipes')
      .select('id, title, servings, prep_minutes, cook_minutes, instructions, source_url, tags, is_favorite, household_id')
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
  ])

  if (!recipe || recipe.household_id !== householdId) notFound()

  const totalMin = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)
  const defaultList = lists?.[0]

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
            <EditRecipeSheet recipe={recipe} ingredients={ingredients ?? []} />
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
        {ingredients && ingredients.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-2">Ingrédients</h2>
            <div className="bg-card border rounded-2xl divide-y">
              {ingredients.map(ing => (
                <div key={ing.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm">{ing.name}</span>
                  {(ing.quantity || ing.unit) && (
                    <span className="text-sm text-muted-foreground">
                      {ing.quantity ?? ''}{ing.unit ? ` ${ing.unit}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <section>
            <h2 className="text-base font-semibold mb-2">Préparation</h2>
            <div className="bg-card border rounded-2xl px-4 py-3">
              <p className="text-sm whitespace-pre-line leading-relaxed text-foreground/90">
                {recipe.instructions}
              </p>
            </div>
          </section>
        )}

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
          {defaultList && ingredients && ingredients.length > 0 && (
            <AddToShoppingButton
              recipeId={recipe.id}
              householdId={householdId}
              listId={defaultList.id}
              listName={defaultList.name}
            />
          )}
        </section>
      </div>
    </div>
  )
}
