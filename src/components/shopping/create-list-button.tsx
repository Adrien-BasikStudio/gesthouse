'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { createList } from '@/lib/actions/shopping'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CreateListButton({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('household_id', householdId)

    startTransition(async () => {
      const result = await createList(formData)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.id) {
        toast.success('Liste créée')
        setOpen(false)
        router.push(`/shopping/${result.id}`)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
      >
        <Plus className="size-3.5" />
        Nouvelle liste
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Nouvelle liste de courses</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="new-list-name">Nom de la liste</Label>
            <Input
              id="new-list-name"
              name="name"
              defaultValue="Courses"
              required
             
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Création…' : 'Créer'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
