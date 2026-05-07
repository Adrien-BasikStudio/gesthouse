'use client'

import { useState, useTransition } from 'react'
import { Plus, Check, ChevronDown } from 'lucide-react'
import { addSuggestedRecipe } from '@/lib/actions/recipes'
import { toast } from 'sonner'

type Ingredient = { name: string; quantity?: number; unit?: string }
type Recipe = {
  title: string
  tags: string[]
  prep_minutes: number
  cook_minutes: number
  servings: number
  ingredients: Ingredient[]
}
type Category = { label: string; emoji: string; recipes: Recipe[] }

const CATEGORIES: Category[] = [
  {
    label: 'Petit-déjeuner',
    emoji: '🥣',
    recipes: [
      { title: 'Crêpes maison', tags: ['petit-déjeuner', 'sucré'], prep_minutes: 10, cook_minutes: 20, servings: 4,
        ingredients: [{ name: 'Farine', quantity: 250, unit: 'g' }, { name: 'Lait', quantity: 500, unit: 'ml' }, { name: 'Oeufs', quantity: 3 }, { name: 'Beurre', quantity: 30, unit: 'g' }, { name: 'Sucre', quantity: 1, unit: 'cs' }] },
      { title: 'Pancakes moelleux', tags: ['petit-déjeuner', 'sucré'], prep_minutes: 10, cook_minutes: 15, servings: 4,
        ingredients: [{ name: 'Farine', quantity: 200, unit: 'g' }, { name: 'Lait', quantity: 250, unit: 'ml' }, { name: 'Oeufs', quantity: 2 }, { name: 'Levure chimique', quantity: 1, unit: 'cs' }, { name: 'Sucre', quantity: 2, unit: 'cs' }] },
      { title: 'Pain perdu', tags: ['petit-déjeuner', 'sucré'], prep_minutes: 5, cook_minutes: 10, servings: 4,
        ingredients: [{ name: 'Pain de mie', quantity: 8, unit: 'tranches' }, { name: 'Oeufs', quantity: 3 }, { name: 'Lait', quantity: 200, unit: 'ml' }, { name: 'Sucre vanillé', quantity: 1, unit: 'sachet' }, { name: 'Beurre', quantity: 20, unit: 'g' }] },
      { title: 'Granola maison', tags: ['petit-déjeuner', 'sain'], prep_minutes: 10, cook_minutes: 25, servings: 6,
        ingredients: [{ name: 'Flocons d\'avoine', quantity: 300, unit: 'g' }, { name: 'Miel', quantity: 3, unit: 'cs' }, { name: 'Huile de coco', quantity: 2, unit: 'cs' }, { name: 'Amandes', quantity: 80, unit: 'g' }, { name: 'Raisins secs', quantity: 50, unit: 'g' }] },
    ],
  },
  {
    label: 'Déjeuner',
    emoji: '🥗',
    recipes: [
      { title: 'Salade niçoise', tags: ['déjeuner', 'salade'], prep_minutes: 15, cook_minutes: 0, servings: 4,
        ingredients: [{ name: 'Thon en boîte', quantity: 200, unit: 'g' }, { name: 'Oeufs', quantity: 4 }, { name: 'Tomates', quantity: 4 }, { name: 'Olives noires', quantity: 80, unit: 'g' }, { name: 'Haricots verts', quantity: 200, unit: 'g' }] },
      { title: 'Wrap poulet avocat', tags: ['déjeuner', 'rapide'], prep_minutes: 10, cook_minutes: 10, servings: 2,
        ingredients: [{ name: 'Tortillas', quantity: 4 }, { name: 'Poulet', quantity: 300, unit: 'g' }, { name: 'Avocat', quantity: 2 }, { name: 'Salade', quantity: 1, unit: 'poignée' }, { name: 'Crème fraîche', quantity: 2, unit: 'cs' }] },
      { title: 'Soupe de légumes', tags: ['déjeuner', 'soupe', 'végétarien'], prep_minutes: 15, cook_minutes: 30, servings: 4,
        ingredients: [{ name: 'Carottes', quantity: 3 }, { name: 'Pommes de terre', quantity: 3 }, { name: 'Poireaux', quantity: 2 }, { name: 'Courgettes', quantity: 2 }, { name: 'Bouillon de légumes', quantity: 1, unit: 'L' }] },
      { title: 'Quiche lorraine', tags: ['déjeuner', 'tarte'], prep_minutes: 15, cook_minutes: 35, servings: 6,
        ingredients: [{ name: 'Pâte brisée', quantity: 1 }, { name: 'Lardons', quantity: 200, unit: 'g' }, { name: 'Oeufs', quantity: 3 }, { name: 'Crème fraîche', quantity: 200, unit: 'ml' }, { name: 'Gruyère râpé', quantity: 100, unit: 'g' }] },
    ],
  },
  {
    label: 'Dîner',
    emoji: '🍽️',
    recipes: [
      { title: 'Pâtes bolognaise', tags: ['dîner', 'pâtes', 'viande'], prep_minutes: 10, cook_minutes: 30, servings: 4,
        ingredients: [{ name: 'Pâtes', quantity: 400, unit: 'g' }, { name: 'Viande hachée', quantity: 500, unit: 'g' }, { name: 'Tomates concassées', quantity: 400, unit: 'g' }, { name: 'Oignon', quantity: 1 }, { name: 'Ail', quantity: 2, unit: 'gousses' }] },
      { title: 'Poulet rôti', tags: ['dîner', 'viande'], prep_minutes: 10, cook_minutes: 70, servings: 4,
        ingredients: [{ name: 'Poulet entier', quantity: 1 }, { name: 'Citron', quantity: 1 }, { name: 'Ail', quantity: 4, unit: 'gousses' }, { name: 'Herbes de Provence', quantity: 1, unit: 'cs' }, { name: 'Huile d\'olive', quantity: 2, unit: 'cs' }] },
      { title: 'Gratin dauphinois', tags: ['dîner', 'gratin', 'végétarien'], prep_minutes: 20, cook_minutes: 50, servings: 6,
        ingredients: [{ name: 'Pommes de terre', quantity: 1, unit: 'kg' }, { name: 'Crème fraîche', quantity: 400, unit: 'ml' }, { name: 'Lait', quantity: 200, unit: 'ml' }, { name: 'Gruyère râpé', quantity: 100, unit: 'g' }, { name: 'Ail', quantity: 1, unit: 'gousse' }] },
      { title: 'Saumon au four', tags: ['dîner', 'poisson', 'sain'], prep_minutes: 5, cook_minutes: 20, servings: 4,
        ingredients: [{ name: 'Filets de saumon', quantity: 4 }, { name: 'Citron', quantity: 1 }, { name: 'Aneth', quantity: 1, unit: 'bouquet' }, { name: 'Huile d\'olive', quantity: 2, unit: 'cs' }, { name: 'Sel et poivre', quantity: 1, unit: 'pincée' }] },
      { title: 'Ratatouille', tags: ['dîner', 'végétarien', 'été'], prep_minutes: 20, cook_minutes: 45, servings: 4,
        ingredients: [{ name: 'Aubergines', quantity: 2 }, { name: 'Courgettes', quantity: 2 }, { name: 'Poivrons', quantity: 2 }, { name: 'Tomates', quantity: 4 }, { name: 'Oignon', quantity: 1 }, { name: 'Ail', quantity: 3, unit: 'gousses' }] },
      { title: 'Risotto aux champignons', tags: ['dîner', 'végétarien', 'riz'], prep_minutes: 10, cook_minutes: 25, servings: 4,
        ingredients: [{ name: 'Riz arborio', quantity: 300, unit: 'g' }, { name: 'Champignons', quantity: 300, unit: 'g' }, { name: 'Bouillon de légumes', quantity: 1, unit: 'L' }, { name: 'Parmesan', quantity: 80, unit: 'g' }, { name: 'Oignon', quantity: 1 }] },
    ],
  },
  {
    label: 'Desserts',
    emoji: '🍰',
    recipes: [
      { title: 'Moelleux au chocolat', tags: ['dessert', 'chocolat'], prep_minutes: 10, cook_minutes: 12, servings: 6,
        ingredients: [{ name: 'Chocolat noir', quantity: 200, unit: 'g' }, { name: 'Beurre', quantity: 150, unit: 'g' }, { name: 'Oeufs', quantity: 4 }, { name: 'Sucre', quantity: 150, unit: 'g' }, { name: 'Farine', quantity: 50, unit: 'g' }] },
      { title: 'Tarte aux pommes', tags: ['dessert', 'fruit'], prep_minutes: 20, cook_minutes: 35, servings: 8,
        ingredients: [{ name: 'Pâte brisée', quantity: 1 }, { name: 'Pommes', quantity: 6 }, { name: 'Sucre', quantity: 80, unit: 'g' }, { name: 'Beurre', quantity: 30, unit: 'g' }, { name: 'Cannelle', quantity: 1, unit: 'cc' }] },
      { title: 'Tiramisu', tags: ['dessert', 'café', 'italien'], prep_minutes: 20, cook_minutes: 0, servings: 6,
        ingredients: [{ name: 'Mascarpone', quantity: 250, unit: 'g' }, { name: 'Oeufs', quantity: 3 }, { name: 'Sucre', quantity: 80, unit: 'g' }, { name: 'Biscuits cuillère', quantity: 200, unit: 'g' }, { name: 'Café', quantity: 200, unit: 'ml' }, { name: 'Cacao en poudre', quantity: 2, unit: 'cs' }] },
      { title: 'Crème brûlée', tags: ['dessert', 'crème'], prep_minutes: 10, cook_minutes: 40, servings: 4,
        ingredients: [{ name: 'Crème liquide', quantity: 500, unit: 'ml' }, { name: 'Jaunes d\'oeufs', quantity: 5 }, { name: 'Sucre', quantity: 100, unit: 'g' }, { name: 'Extrait de vanille', quantity: 1, unit: 'cc' }] },
    ],
  },
  {
    label: 'Snacks',
    emoji: '🥨',
    recipes: [
      { title: 'Guacamole maison', tags: ['snack', 'dip', 'végétarien'], prep_minutes: 10, cook_minutes: 0, servings: 4,
        ingredients: [{ name: 'Avocats', quantity: 3 }, { name: 'Citron vert', quantity: 1 }, { name: 'Tomate', quantity: 1 }, { name: 'Oignon rouge', quantity: 0.5 }, { name: 'Coriandre', quantity: 1, unit: 'bouquet' }] },
      { title: 'Houmous maison', tags: ['snack', 'dip', 'végétarien'], prep_minutes: 10, cook_minutes: 0, servings: 6,
        ingredients: [{ name: 'Pois chiches', quantity: 400, unit: 'g' }, { name: 'Tahini', quantity: 2, unit: 'cs' }, { name: 'Citron', quantity: 1 }, { name: 'Ail', quantity: 1, unit: 'gousse' }, { name: 'Huile d\'olive', quantity: 3, unit: 'cs' }] },
      { title: 'Energy balls', tags: ['snack', 'sain', 'sans cuisson'], prep_minutes: 15, cook_minutes: 0, servings: 12,
        ingredients: [{ name: 'Flocons d\'avoine', quantity: 150, unit: 'g' }, { name: 'Beurre de cacahuète', quantity: 3, unit: 'cs' }, { name: 'Miel', quantity: 2, unit: 'cs' }, { name: 'Chocolat en pépites', quantity: 50, unit: 'g' }, { name: 'Graines de lin', quantity: 1, unit: 'cs' }] },
    ],
  },
]

export default function RecipeSuggestions({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function handleAdd(recipe: Recipe) {
    startTransition(async () => {
      const result = await addSuggestedRecipe(householdId, recipe)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setAdded(prev => new Set([...prev, recipe.title]))
        toast.success(`"${recipe.title}" ajoutée à ton carnet 🐜`)
      }
    })
  }

  return (
    <div className="mt-4 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card border rounded-2xl hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="font-semibold text-sm">Recettes suggérées</span>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 bg-card border rounded-2xl overflow-hidden">
          {/* Category tabs */}
          <div className="flex gap-1 p-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recipe cards */}
          <div className="divide-y">
            {CATEGORIES[activeCategory].recipes.map(recipe => {
              const isAdded = added.has(recipe.title)
              const totalMin = recipe.prep_minutes + recipe.cook_minutes
              return (
                <div key={recipe.title} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{recipe.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {totalMin > 0 && (
                        <span className="text-xs text-muted-foreground">{totalMin} min</span>
                      )}
                      <span className="text-xs text-muted-foreground">{recipe.servings} pers.</span>
                      {recipe.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(recipe)}
                    disabled={isPending || isAdded}
                    className={`size-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      isAdded
                        ? 'bg-green-100 text-green-600'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                    title={isAdded ? 'Déjà ajoutée' : 'Ajouter au carnet'}
                  >
                    {isAdded ? <Check className="size-4" /> : <Plus className="size-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
