'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { addStockItem } from '@/lib/actions/stock'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const LOCATIONS = [
  { value: 'frigo', label: '🧊 Frigo' },
  { value: 'placard', label: '🗄️ Placard' },
  { value: 'congelateur', label: '❄️ Congélateur' },
  { value: 'cave', label: '🍷 Cave' },
]

const CATEGORIES = [
  'Fruits & Légumes', 'Produits laitiers', 'Viandes & Poissons',
  'Épicerie', 'Boissons', 'Surgelés', 'Hygiène', 'Divers',
]

export default function AddStockSheet({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [location, setLocation] = useState<string | null>('placard')
  const [category, setCategory] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('household_id', householdId)
    formData.set('location', location ?? 'placard')
    if (category) formData.set('category', category)

    startTransition(async () => {
      const result = await addStockItem(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Article ajouté au stock 🐜')
        setOpen(false)
        setCategory(null)
        ;(e.target as HTMLFormElement).reset()
        setLocation('placard')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="fixed bottom-20 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Ajouter au stock"
      >
        <Plus className="size-6" />
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ajouter au stock</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="name">Article *</Label>
            <Input id="name" name="name" placeholder="Lait, Pâtes, Tomates…" required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input id="quantity" name="quantity" type="number" min="0" step="0.1" placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <Input id="unit" name="unit" placeholder="kg, L, pcs…" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Emplacement</Label>
            <Select value={location} onValueChange={v => setLocation(v)}>
              <SelectTrigger>
                <SelectValue>
                  {LOCATIONS.find(l => l.value === location)?.label ?? 'Placard'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={v => setCategory(v)}>
              <SelectTrigger>
                <SelectValue>
                  {category ?? <span className="text-muted-foreground">Choisir…</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_on">Date de péremption</Label>
            <Input id="expires_on" name="expires_on" type="date" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
