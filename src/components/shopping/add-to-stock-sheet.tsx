'use client'

import { useState, useTransition } from 'react'
import { Package } from 'lucide-react'
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

export default function AddToStockSheet({
  item,
  householdId,
}: {
  item: { name: string; quantity: number | null; unit: string | null }
  householdId: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [location, setLocation] = useState('placard')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('household_id', householdId)
    formData.set('location', location)

    startTransition(async () => {
      const result = await addStockItem(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${item.name} ajouté au stock`)
        setOpen(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        onClick={e => e.stopPropagation()}
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Package className="size-3" />
        Stock
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Ajouter au stock</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="name">Article</Label>
            <Input id="name" name="name" defaultValue={item.name} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="0.1"
                defaultValue={item.quantity ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <Input id="unit" name="unit" defaultValue={item.unit ?? ''} placeholder="kg, L, pcs…" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Emplacement</Label>
            <Select value={location} onValueChange={v => { if (v) setLocation(v) }}>
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
            <Label htmlFor="expires_on">Date de péremption</Label>
            <Input id="expires_on" name="expires_on" type="date" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Ajout…' : 'Ajouter au stock'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
