'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { updateRecipe } from '@/lib/actions/recipes'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Ingredient = { id: number; name: string; qty: string; unit: string }

type Recipe = {
  id: string
  title: string
  servings: number | null
  prep_minutes: number | null
  cook_minutes: number | null
  instructions: string | null
  source_url: string | null
  tags: string[] | null
}

type ExistingIngredient = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  position: number
}

export default function EditRecipeSheet({
  recipe,
  ingredients: existingIngredients,
}: {
  recipe: Recipe
  ingredients: ExistingIngredient[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [ingredients, setIngredients] = useState<Ingredient[]>(() =>
    existingIngredients.length > 0
      ? existingIngredients.map((ing, i) => ({
          id: i + 1,
          name: ing.name,
          qty: ing.quantity != null ? String(ing.quantity) : '',
          unit: ing.unit ?? '',
        }))
      : [{ id: 1, name: '', qty: '', unit: '' }]
  )

  function addIngredient() {
    setIngredients(prev => [...prev, { id: Date.now(), name: '', qty: '', unit: '' }])
  }

  function removeIngredient(id: number) {
    if (ingredients.length === 1) return
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  function updateIngredient(id: number, field: keyof Omit<Ingredient, 'id'>, value: string) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    formData.delete('ingredient_name')
    formData.delete('ingredient_qty')
    formData.delete('ingredient_unit')
    ingredients.forEach(ing => {
      formData.append('ingredient_name', ing.name)
      formData.append('ingredient_qty', ing.qty)
      formData.append('ingredient_unit', ing.unit)
    })

    startTransition(async () => {
      const result = await updateRecipe(recipe.id, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Recette modifiée')
        setOpen(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm hover:bg-secondary transition-colors"
        aria-label="Modifier la recette"
      >
        <Pencil className="size-4" />
        Modifier
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier la recette</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titre *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={recipe.title}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-prep">Prép. (min)</Label>
              <Input
                id="edit-prep"
                name="prep_minutes"
                type="number"
                min="0"
                defaultValue={recipe.prep_minutes ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cook">Cuisson (min)</Label>
              <Input
                id="edit-cook"
                name="cook_minutes"
                type="number"
                min="0"
                defaultValue={recipe.cook_minutes ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-servings">Portions</Label>
              <Input
                id="edit-servings"
                name="servings"
                type="number"
                min="1"
                defaultValue={recipe.servings ?? 4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">
              Tags <span className="text-muted-foreground font-normal">(séparés par virgule)</span>
            </Label>
            <Input
              id="edit-tags"
              name="tags"
              defaultValue={recipe.tags?.join(', ') ?? ''}
              placeholder="végétarien, rapide, hiver…"
            />
          </div>

          <div className="space-y-2">
            <Label>Ingrédients</Label>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`Ingrédient ${idx + 1}`}
                    value={ing.name}
                    onChange={e => updateIngredient(ing.id, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Qté"
                    value={ing.qty}
                    onChange={e => updateIngredient(ing.id, 'qty', e.target.value)}
                    className="w-16 shrink-0"
                    type="number"
                    min="0"
                    step="0.1"
                  />
                  <Input
                    placeholder="Unité"
                    value={ing.unit}
                    onChange={e => updateIngredient(ing.id, 'unit', e.target.value)}
                    className="w-16 shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="shrink-0 p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
            >
              <Plus className="size-3.5" /> Ajouter un ingrédient
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-instructions">Instructions</Label>
            <Textarea
              id="edit-instructions"
              name="instructions"
              defaultValue={recipe.instructions ?? ''}
              placeholder="Étapes de préparation…"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-source">Lien source</Label>
            <Input
              id="edit-source"
              name="source_url"
              type="url"
              defaultValue={recipe.source_url ?? ''}
              placeholder="https://…"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
