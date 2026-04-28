import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import { createExpenseGroup } from '@/lib/actions/expenses'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = (await getActiveHouseholdId(memberships))!
  const admin = createAdminClient()

  const { data: groups } = await admin
    .from('expense_groups')
    .select('id, name')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (groups && groups.length > 0) {
    redirect(`/expenses/${groups[0].id}`)
  }

  async function handleCreate() {
    'use server'
    const result = await createExpenseGroup(householdId, 'Vie quotidienne')
    if (result?.id) redirect(`/expenses/${result.id}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-4 max-w-sm mx-auto">
      <p className="text-4xl">💰</p>
      <h1 className="text-xl font-bold">Pas encore de groupe</h1>
      <p className="text-sm text-muted-foreground">Crée ton premier groupe de dépenses pour suivre vos comptes.</p>
      <form action={handleCreate} className="w-full">
        <button type="submit" className={cn(buttonVariants(), 'w-full')}>
          Créer &quot;Vie quotidienne&quot;
        </button>
      </form>
    </div>
  )
}
