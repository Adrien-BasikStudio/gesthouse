import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createList } from '@/lib/actions/shopping'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, households(name, emoji)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id
  const admin = createAdminClient()

  const { data: lists } = await admin
    .from('shopping_lists')
    .select('id, name, created_at')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  // Redirect to first list if exists
  if (lists && lists.length > 0) {
    redirect(`/shopping/${lists[0].id}`)
  }

  // No lists yet — show create prompt
  async function handleCreate(formData: FormData) {
    'use server'
    formData.set('household_id', householdId)
    const result = await createList(formData)
    if (result?.id) redirect(`/shopping/${result.id}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-4 max-w-sm mx-auto">
      <p className="text-4xl">🛒</p>
      <h1 className="text-xl font-bold">Pas encore de liste</h1>
      <p className="text-sm text-muted-foreground">Crée ta première liste de courses pour commencer.</p>
      <form action={handleCreate} className="w-full space-y-3">
        <input
          name="name"
          defaultValue="Courses"
          className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="Nom de la liste"
        />
        <button type="submit" className={cn(buttonVariants(), 'w-full')}>
          <Plus className="size-4 mr-1" /> Créer la liste
        </button>
      </form>
    </div>
  )
}
