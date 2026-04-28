import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExpenseRow from '@/components/expenses/expense-row'
import BalancesView from '@/components/expenses/balances-view'
import AddExpenseSheet from '@/components/expenses/add-expense-sheet'
import type { BalanceEntry } from '@/lib/expenses'

export default async function ExpenseGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id
  const isAdmin = membership.role === 'admin'
  const admin = createAdminClient()

  const [
    { data: groups },
    { data: currentGroup },
    { data: expenses },
    { data: members },
    { data: rawBalances },
  ] = await Promise.all([
    admin.from('expense_groups').select('id, name').eq('household_id', householdId).eq('is_archived', false).order('created_at'),
    admin.from('expense_groups').select('id, name').eq('id', groupId).single(),
    admin.from('expenses')
      .select('id, description, amount_cents, category, spent_at, paid_by, profiles:paid_by(display_name)')
      .eq('group_id', groupId)
      .order('spent_at', { ascending: false })
      .limit(100),
    admin.from('household_members')
      .select('user_id, profiles(display_name)')
      .eq('household_id', householdId),
    admin.from('expense_balances')
      .select('user_id, balance_cents')
      .eq('group_id', groupId),
  ])

  if (!currentGroup) redirect('/expenses')

  // Build member map for names
  const memberMap = new Map(
    (members ?? []).map(m => [
      m.user_id,
      (m.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Membre',
    ])
  )

  const membersForSheet = (members ?? []).map(m => ({
    user_id: m.user_id,
    display_name: memberMap.get(m.user_id) ?? 'Membre',
  }))

  const balances: BalanceEntry[] = (rawBalances ?? []).map(b => ({
    userId: b.user_id,
    name: memberMap.get(b.user_id) ?? 'Membre',
    cents: b.balance_cents,
  }))

  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount_cents, 0)

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {groups && groups.length > 1 ? groups.map(g => (
            <Link
              key={g.id}
              href={`/expenses/${g.id}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                g.id === groupId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {g.name}
            </Link>
          )) : (
            <h1 className="text-2xl font-bold">{currentGroup.name}</h1>
          )}
        </div>
        {(expenses?.length ?? 0) > 0 && (
          <p className="text-sm text-muted-foreground">
            {expenses!.length} dépense{expenses!.length > 1 ? 's' : ''} · Total CHF {(totalExpenses / 100).toFixed(2)}
          </p>
        )}
      </div>

      <Tabs defaultValue="expenses" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mb-1">
          <TabsTrigger value="expenses" className="flex-1">Dépenses</TabsTrigger>
          <TabsTrigger value="balances" className="flex-1">Soldes</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="flex-1 px-4 overflow-y-auto pb-24">
          {(expenses?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <p className="text-3xl">💸</p>
              <p className="font-medium text-muted-foreground">Aucune dépense.</p>
              <p className="text-sm text-muted-foreground">Appuie sur + pour en ajouter une.</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {(expenses ?? []).map(e => (
                <ExpenseRow
                  key={e.id}
                  expense={e as never}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances" className="flex-1 px-4 overflow-y-auto pb-24">
          <BalancesView
            balances={balances}
            groupId={groupId}
            householdId={householdId}
            currentUserId={user.id}
          />
        </TabsContent>
      </Tabs>

      <AddExpenseSheet
        groupId={groupId}
        householdId={householdId}
        members={membersForSheet}
        currentUserId={user.id}
      />
    </div>
  )
}
