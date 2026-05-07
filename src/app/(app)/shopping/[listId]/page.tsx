import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, RotateCcw, EyeOff, Eye, Plus } from 'lucide-react'
import ShoppingListRealtime from '@/components/shopping/shopping-list-realtime'
import AddItemInput from '@/components/shopping/add-item-input'
import ListActionsMenu from '@/components/shopping/list-actions-menu'
import CreateListButton from '@/components/shopping/create-list-button'
import ShoppingStockNav from '@/components/shopping/shopping-stock-nav'

export default async function ShoppingListPage({
  params,
  searchParams,
}: {
  params: Promise<{ listId: string }>
  searchParams: Promise<{ hide?: string }>
}) {
  const { listId } = await params
  const { hide } = await searchParams
  const hideChecked = hide === '1'

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

  const [{ data: lists }, { data: items }, { data: currentList }, { data: historyRaw }] = await Promise.all([
    admin
      .from('shopping_lists')
      .select('id, name')
      .eq('household_id', householdId)
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
    admin
      .from('shopping_items')
      .select('id, name, quantity, unit, is_checked, category')
      .eq('list_id', listId)
      .order('created_at', { ascending: true }),
    admin
      .from('shopping_lists')
      .select('id, name')
      .eq('id', listId)
      .single(),
    admin
      .from('shopping_items')
      .select('name')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  // Deduplicate by normalized name, keep original casing of most recent occurrence
  const seen = new Set<string>()
  const historySuggestions: string[] = []
  for (const item of historyRaw ?? []) {
    const norm = item.name.toLowerCase().trim()
    if (!seen.has(norm)) {
      seen.add(norm)
      historySuggestions.push(item.name)
    }
  }
  historySuggestions.sort((a, b) => a.localeCompare(b, 'fr'))

  if (!currentList) redirect('/shopping')

  const checkedCount = items?.filter(i => i.is_checked).length ?? 0

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3">
        <ShoppingStockNav shoppingHref={`/shopping/${listId}`} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {lists && lists.length > 1 && lists.map(list => (
              <Link
                key={list.id}
                href={`/shopping/${list.id}`}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  list.id === listId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {list.name}
              </Link>
            ))}
            {lists && lists.length === 1 && (
              <h1 className="text-2xl font-bold">{currentList.name}</h1>
            )}
            <CreateListButton householdId={householdId} />
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/shopping/${listId}?hide=${hideChecked ? '0' : '1'}`}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
              title={hideChecked ? 'Afficher les cochés' : 'Masquer les cochés'}
            >
              {hideChecked ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Link>
            <ListActionsMenu listId={listId} checkedCount={checkedCount} householdId={householdId} />
          </div>
        </div>

        {(items?.length ?? 0) > 0 && (
          <p className="text-sm text-muted-foreground">
            {items!.filter(i => !i.is_checked).length} restant{items!.filter(i => !i.is_checked).length > 1 ? 's' : ''}
            {checkedCount > 0 && ` · ${checkedCount} coché${checkedCount > 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ShoppingListRealtime
          initialItems={items ?? []}
          listId={listId}
          householdId={householdId}
          hideChecked={hideChecked}
        />
      </div>

      {/* Add input pinned at bottom */}
      <AddItemInput listId={listId} householdId={householdId} suggestions={historySuggestions} />
    </div>
  )
}
