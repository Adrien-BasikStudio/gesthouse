'use client'

import { useTransition } from 'react'
import { Heart, Trash2, ShoppingBasket, Calendar } from 'lucide-react'
import { toggleFavorite, deleteRecipe, addIngredientsToShopping } from '@/lib/actions/recipes'
import { toast } from 'sonner'

export function ToggleFavoriteButton({
  recipeId,
  isFavorite,
}: {
  recipeId: string
  isFavorite: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      const result = await toggleFavorite(recipeId, isFavorite)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className={`p-2 rounded-xl transition-colors ${
        isFavorite
          ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
          : 'text-muted-foreground bg-secondary hover:bg-secondary/80'
      }`}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={`size-5 ${isFavorite ? 'fill-rose-500' : ''}`} />
    </button>
  )
}

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [isPending, startTransition] = useTransition()

  function handle() {
    if (!confirm('Supprimer cette recette ?')) return
    startTransition(async () => {
      await deleteRecipe(recipeId)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="p-2 rounded-xl text-muted-foreground bg-secondary hover:text-destructive hover:bg-destructive/10 transition-colors"
      aria-label="Supprimer la recette"
    >
      <Trash2 className="size-5" />
    </button>
  )
}

export function AddToShoppingButton({
  recipeId,
  householdId,
  listId,
  listName,
}: {
  recipeId: string
  householdId: string
  listId: string
  listName: string
}) {
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      const result = await addIngredientsToShopping(recipeId, householdId, listId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`${result.count} ingrédient${result.count > 1 ? 's' : ''} ajouté${result.count > 1 ? 's' : ''} à "${listName}"`)
      }
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors w-full"
    >
      <ShoppingBasket className="size-4 shrink-0" />
      {isPending ? 'Ajout…' : `Ajouter à "${listName}"`}
    </button>
  )
}
