'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createRecipe } from '@/lib/actions/recipes'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Ingredient = { id: number; name: string; qty: string; unit: string }

export default function AddRecipeSheet({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: 1, name: '', qty: '', unit: '' },
  ])

  function addIngredient() {
    setIngredients(prev => [...prev, { id: Date.now(), name: '', qty: '', unit: '' }])
  }

  function removeIngredient(id: number) {
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  function updateIngredient(id: number, field: keyof Omit<Ingredient, 'id'>, value: string) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('household_id', householdId)

    // Append ingredients from state
    formData.delete('ingredient_name')
    formData.delete('ingredient_qty')
    formData.delete('ingredient_unit')
    ingredients.forEach(ing => {
      formData.append('ingredient_name', ing.name)
      formData.append('ingredient_qty', ing.qty)
      formData.append('ingredient_unit', ing.unit)
    })

    startTransition(async () => {
      const result = await createRecipe(formData)
      if (result?.error) {
        toast.error(result.error)
      }
      // redirect happens server-side on success
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="fixed bottom-20 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Ajouter une recette"
      >
        <Plus className="size-6" />
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nouvelle recette</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" name="title" placeholder="Tarte aux pommes, Pasta bolognese…" required/>
          </div>

          {/* Times + servings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prep_minutes">Prép. (min)</Label>
              <Input id="prep_minutes" name="prep_minutes" type="number" min="0" placeholder="15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook_minutes">Cuisson (min)</Label>
              <Input id="cook_minutes" name="cook_minutes" type="number" min="0" placeholder="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Portions</Label>
              <Input id="servings" name="servings" type="number" min="1" placeholder="4" />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground font-normal">(séparés par virgule)</span></Label>
            <Input id="tags" name="tags" placeholder="végétarien, rapide, hiver…" />
          </div>

          {/* Ingredients */}
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
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.id)}
                      className="shrink-0 p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
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

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Étapes de préparation…"
              rows={4}
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source_url">Lien source</Label>
            <Input id="source_url" name="source_url" type="url" placeholder="https://…" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Enregistrement…' : 'Créer la recette'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
