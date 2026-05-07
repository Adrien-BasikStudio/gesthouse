'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRecipe(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Titre requis' }

  const householdId = String(formData.get('household_id'))
  const tags = String(formData.get('tags') ?? '')
    .split(',').map(t => t.trim()).filter(Boolean)

  const admin = createAdminClient()
  const { data: recipe, error } = await admin.from('recipes').insert({
    household_id: householdId,
    title,
    servings: formData.get('servings') ? Number(formData.get('servings')) : 4,
    prep_minutes: formData.get('prep_minutes') ? Number(formData.get('prep_minutes')) : null,
    cook_minutes: formData.get('cook_minutes') ? Number(formData.get('cook_minutes')) : null,
    instructions: formData.get('instructions') ? String(formData.get('instructions')) : null,
    source_url: formData.get('source_url') ? String(formData.get('source_url')) : null,
    video_url: formData.get('video_url') ? String(formData.get('video_url')) : null,
    tags: tags.length > 0 ? tags : null,
    created_by: user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  // Insert ingredients
  const names = formData.getAll('ingredient_name').map(String)
  const qtys = formData.getAll('ingredient_qty').map(String)
  const units = formData.getAll('ingredient_unit').map(String)

  const ingredients = names
    .map((name, i) => ({ name: name.trim(), qty: qtys[i], unit: units[i], pos: i }))
    .filter(ing => ing.name)

  if (ingredients.length > 0) {
    await admin.from('recipe_ingredients').insert(
      ingredients.map(ing => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.qty ? Number(ing.qty) : null,
        unit: ing.unit || null,
        position: ing.pos,
      }))
    )
  }

  revalidatePath('/recipes')
  redirect(`/recipes/${recipe.id}`)
}

export async function updateRecipe(recipeId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Titre requis' }

  const tags = String(formData.get('tags') ?? '')
    .split(',').map(t => t.trim()).filter(Boolean)

  const admin = createAdminClient()
  const { error } = await admin.from('recipes').update({
    title,
    servings: formData.get('servings') ? Number(formData.get('servings')) : 4,
    prep_minutes: formData.get('prep_minutes') ? Number(formData.get('prep_minutes')) : null,
    cook_minutes: formData.get('cook_minutes') ? Number(formData.get('cook_minutes')) : null,
    instructions: formData.get('instructions') ? String(formData.get('instructions')) : null,
    source_url: formData.get('source_url') ? String(formData.get('source_url')) : null,
    video_url: formData.get('video_url') ? String(formData.get('video_url')) : null,
    tags: tags.length > 0 ? tags : null,
  }).eq('id', recipeId)

  if (error) return { error: error.message }

  // Replace ingredients
  await admin.from('recipe_ingredients').delete().eq('recipe_id', recipeId)

  const names = formData.getAll('ingredient_name').map(String)
  const qtys = formData.getAll('ingredient_qty').map(String)
  const units = formData.getAll('ingredient_unit').map(String)
  const ingredients = names
    .map((name, i) => ({ name: name.trim(), qty: qtys[i], unit: units[i], pos: i }))
    .filter(ing => ing.name)

  if (ingredients.length > 0) {
    await admin.from('recipe_ingredients').insert(
      ingredients.map(ing => ({
        recipe_id: recipeId,
        name: ing.name,
        quantity: ing.qty ? Number(ing.qty) : null,
        unit: ing.unit || null,
        position: ing.pos,
      }))
    )
  }

  revalidatePath('/recipes')
  revalidatePath(`/recipes/${recipeId}`)
  return { success: true }
}

export async function toggleFavorite(recipeId: string, current: boolean) {
  const admin = createAdminClient()
  const { error } = await admin.from('recipes')
    .update({ is_favorite: !current })
    .eq('id', recipeId)
  if (error) return { error: error.message }
  revalidatePath('/recipes')
  return { success: true }
}

export async function deleteRecipe(recipeId: string) {
  const admin = createAdminClient()
  await admin.from('recipes').delete().eq('id', recipeId)
  revalidatePath('/recipes')
  redirect('/recipes')
}

export async function planMeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin.from('meal_plans').insert({
    household_id: String(formData.get('household_id')),
    recipe_id: formData.get('recipe_id') ? String(formData.get('recipe_id')) : null,
    custom_title: formData.get('custom_title') ? String(formData.get('custom_title')) : null,
    planned_for: String(formData.get('planned_for')),
    meal_type: String(formData.get('meal_type') ?? 'dinner'),
    servings: formData.get('servings') ? Number(formData.get('servings')) : 4,
  })

  if (error) return { error: error.message }
  revalidatePath('/recipes')
  return { success: true }
}

export async function deleteMealPlan(planId: string) {
  const admin = createAdminClient()
  await admin.from('meal_plans').delete().eq('id', planId)
  revalidatePath('/recipes')
  return { success: true }
}

type SuggestedIngredient = { name: string; quantity?: number; unit?: string }
type SuggestedRecipeData = {
  title: string
  tags: string[]
  prep_minutes: number
  cook_minutes: number
  servings: number
  instructions?: string
  ingredients: SuggestedIngredient[]
}

export async function addSuggestedRecipe(householdId: string, recipe: SuggestedRecipeData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('recipes')
    .select('id')
    .eq('household_id', householdId)
    .ilike('title', recipe.title)
    .single()

  if (existing) return { error: 'Cette recette est déjà dans ton carnet' }

  const { data: created, error } = await admin.from('recipes').insert({
    household_id: householdId,
    title: recipe.title,
    tags: recipe.tags,
    prep_minutes: recipe.prep_minutes,
    cook_minutes: recipe.cook_minutes,
    servings: recipe.servings,
    instructions: recipe.instructions ?? null,
    created_by: user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  if (recipe.ingredients.length > 0) {
    await admin.from('recipe_ingredients').insert(
      recipe.ingredients.map((ing, i) => ({
        recipe_id: created.id,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        position: i,
      }))
    )
  }

  revalidatePath('/recipes')
  return { id: created.id }
}

export async function addIngredientsToShopping(
  recipeId: string,
  householdId: string,
  listId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: ingredients } = await admin
    .from('recipe_ingredients')
    .select('name, quantity, unit')
    .eq('recipe_id', recipeId)

  if (!ingredients || ingredients.length === 0) return { error: 'Aucun ingrédient' }

  const { error } = await admin.from('shopping_items').insert(
    ingredients.map(ing => ({
      list_id: listId,
      household_id: householdId,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      added_by: user.id,
    }))
  )

  if (error) return { error: error.message }
  revalidatePath('/shopping')
  return { count: ingredients.length }
}

function normalizeIngredientName(s: string) {
  return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export async function addMissingIngredientsToShopping(
  recipeId: string,
  householdId: string,
  listId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const [{ data: ingredients }, { data: stockItems }] = await Promise.all([
    admin.from('recipe_ingredients').select('name, quantity, unit').eq('recipe_id', recipeId),
    admin.from('stock_items').select('name').eq('household_id', householdId),
  ])

  if (!ingredients || ingredients.length === 0) return { error: 'Aucun ingrédient' }

  const stockNames = new Set((stockItems ?? []).map(s => normalizeIngredientName(s.name)))

  const missing = ingredients.filter(ing => {
    const norm = normalizeIngredientName(ing.name)
    for (const sName of stockNames) {
      if (sName === norm || sName.includes(norm) || norm.includes(sName)) return false
    }
    return true
  })

  if (missing.length === 0) return { count: 0 }

  const { error } = await admin.from('shopping_items').insert(
    missing.map(ing => ({
      list_id: listId,
      household_id: householdId,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      added_by: user.id,
    }))
  )

  if (error) return { error: error.message }
  revalidatePath('/shopping')
  return { count: missing.length }
}
