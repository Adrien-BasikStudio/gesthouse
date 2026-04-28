export function formatChf(cents: number): string {
  return `CHF ${(Math.abs(cents) / 100).toFixed(2)}`
}

export type BalanceEntry = {
  userId: string
  name: string
  cents: number
}

export type Transfer = {
  fromUserId: string
  toUserId: string
  fromName: string
  toName: string
  cents: number
}

// Greedy algorithm: minimize number of transfers to settle all debts
export function minimizeTransfers(balances: BalanceEntry[]): Transfer[] {
  const creditors = balances
    .filter(b => b.cents > 0)
    .map(b => ({ ...b }))
    .sort((a, b) => b.cents - a.cents)

  const debtors = balances
    .filter(b => b.cents < 0)
    .map(b => ({ ...b }))
    .sort((a, b) => a.cents - b.cents)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(-debtor.cents, creditor.cents)

    if (amount > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        fromName: debtor.name,
        toName: creditor.name,
        cents: amount,
      })
    }

    debtor.cents += amount
    creditor.cents -= amount

    if (debtor.cents === 0) i++
    if (creditor.cents === 0) j++
  }

  return transfers
}
