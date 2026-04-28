import { cookies } from 'next/headers'

const COOKIE = 'fourmis_household'

export async function getActiveHouseholdId(
  memberships: { household_id: string }[]
): Promise<string | null> {
  if (memberships.length === 0) return null

  const store = await cookies()
  const saved = store.get(COOKIE)?.value

  if (saved && memberships.some(m => m.household_id === saved)) {
    return saved
  }

  return memberships[0].household_id
}
