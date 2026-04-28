'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus } from 'lucide-react'
import { planMeal } from '@/lib/actions/recipes'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Goûter' },
]

export default function PlanMealSheet({
  recipeId,
  recipeTitle,
  householdId,
}: {
  recipeId: string
  recipeTitle: string
  householdId: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mealType, setMealType] = useState<string>('dinner')

  const today = new Date().toISOString().slice(0, 10)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('household_id', householdId)
    formData.set('recipe_id', recipeId)
    formData.set('meal_type', mealType)

    startTransition(async () => {
      const result = await planMeal(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Repas planifié !')
        setOpen(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full">
        <CalendarPlus className="size-4 shrink-0" />
        Planifier ce repas
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Planifier</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground mt-1 px-0.5">{recipeTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="planned_for">Date</Label>
            <Input
              id="planned_for"
              name="planned_for"
              type="date"
              defaultValue={today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Repas</Label>
            <Select value={mealType} onValueChange={(v) => { if (v) setMealType(v) }}>
              <SelectTrigger>
                <SelectValue>
                  {MEAL_TYPES.find(m => m.value === mealType)?.label ?? 'Dîner'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servings">Portions</Label>
            <Input id="servings" name="servings" type="number" min="1" defaultValue="4" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Planification…' : 'Planifier'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
