import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import StockItemRow from '@/components/stock/stock-item-row'
import AddStockSheet from '@/components/stock/add-stock-sheet'
import ShoppingStockNav from '@/components/shopping/shopping-stock-nav'

const LOCATIONS = [
  { value: 'all', label: 'Tout', emoji: '📦' },
  { value: 'frigo', label: 'Frigo', emoji: '🧊' },
  { value: 'placard', label: 'Placard', emoji: '🗄️' },
  { value: 'congelateur', label: 'Congélo', emoji: '❄️' },
  { value: 'cave', label: 'Cave', emoji: '🍷' },
]

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ loc?: string }>
}) {
  const { loc = 'all' } = await searchParams

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

  let query = admin
    .from('stock_items')
    .select('id, name, quantity, unit, location, category, expires_on')
    .eq('household_id', householdId)
    .order('name', { ascending: true })

  if (loc !== 'all') {
    query = query.eq('location', loc)
  }

  const { data: items } = await query

  // Items expiring within 3 days
  const expiringSoon = (items ?? []).filter(i => {
    if (!i.expires_on) return false
    const days = differenceInDays(parseISO(i.expires_on), new Date())
    return days <= 3
  })

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3">
        <ShoppingStockNav shoppingHref="/shopping" />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Stock</h1>
          <span className="text-sm text-muted-foreground">{items?.length ?? 0} articles</span>
        </div>

        {/* Expiry alert */}
        {expiringSoon.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <span>⚠️</span>
            <span>
              <strong>{expiringSoon.length} article{expiringSoon.length > 1 ? 's' : ''}</strong> à consommer bientôt :
              {' '}{expiringSoon.slice(0, 3).map(i => i.name).join(', ')}
              {expiringSoon.length > 3 ? '…' : ''}
            </span>
          </div>
        )}

        {/* Location tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {LOCATIONS.map(l => (
            <Link
              key={l.value}
              href={`/stock?loc=${l.value}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                loc === l.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              <span>{l.emoji}</span>
              <span>{l.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {(items?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-3xl">📦</p>
            <p className="font-medium text-muted-foreground">Aucun article ici.</p>
            <p className="text-sm text-muted-foreground">Appuie sur + pour ajouter au stock.</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {(items ?? []).map(item => (
              <StockItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <AddStockSheet householdId={householdId} />
    </div>
  )
}
