'use client'

import { useState, useTransition } from 'react'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { deleteStockItem, updateQuantity, updateStockItem } from '@/lib/actions/stock'
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

type Item = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  category: string | null
  location: string | null
  expires_on: string | null
}

export default function StockItemRow({ item }: { item: Item }) {
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [location, setLocation] = useState<string>(item.location ?? 'placard')
  const [category, setCategory] = useState<string>(item.category ?? '')

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteStockItem(item.id)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleQty(delta: number) {
    startTransition(async () => {
      const result = await updateQuantity(item.id, delta)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('location', location)
    if (category) formData.set('category', category)

    startTransition(async () => {
      const result = await updateStockItem(item.id, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Article modifié')
        setEditOpen(false)
      }
    })
  }

  const expiryBadge = () => {
    if (!item.expires_on) return null
    const days = differenceInDays(parseISO(item.expires_on), new Date())
    if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Périmé</span>
    if (days === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Aujourd&apos;hui</span>
    if (days <= 3) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">J-{days}</span>
    return null
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{item.name}</span>
          {expiryBadge()}
        </div>
        {item.category && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => handleQty(-1)}
          disabled={isPending}
          className="size-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="text-sm font-semibold w-12 text-center">
          {item.quantity ?? 1}{item.unit ? ` ${item.unit}` : ''}
        </span>
        <button
          onClick={() => handleQty(1)}
          disabled={isPending}
          className="size-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetTrigger
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Pencil className="size-4" />
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier l&apos;article</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor={`edit-stock-name-${item.id}`}>Article *</Label>
              <Input
                id={`edit-stock-name-${item.id}`}
                name="name"
                defaultValue={item.name}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`edit-stock-qty-${item.id}`}>Quantité</Label>
                <Input
                  id={`edit-stock-qty-${item.id}`}
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  defaultValue={item.quantity ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-stock-unit-${item.id}`}>Unité</Label>
                <Input
                  id={`edit-stock-unit-${item.id}`}
                  name="unit"
                  defaultValue={item.unit ?? ''}
                  placeholder="kg, L, pcs…"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Emplacement</Label>
              <Select value={location} onValueChange={v => { if (v !== null) setLocation(v) }}>
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
              <Select value={category || 'none'} onValueChange={v => { if (v !== null) setCategory(v === 'none' ? '' : v) }}>
                <SelectTrigger>
                  <SelectValue>
                    {category || <span className="text-muted-foreground">Aucune</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-stock-exp-${item.id}`}>Date de péremption</Label>
              <Input
                id={`edit-stock-exp-${item.id}`}
                name="expires_on"
                type="date"
                defaultValue={item.expires_on ?? ''}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
