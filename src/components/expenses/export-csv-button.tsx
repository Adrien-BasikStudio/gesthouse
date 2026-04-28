'use client'

import { Download } from 'lucide-react'

type Expense = {
  description: string
  amount_cents: number
  category: string | null
  spent_at: string
  profiles: { display_name: string } | null
}

export default function ExportCsvButton({
  expenses,
  groupName,
}: {
  expenses: Expense[]
  groupName: string
}) {
  function handleExport() {
    const rows = [
      ['Date', 'Description', 'Catégorie', 'Montant (CHF)', 'Payé par'],
      ...expenses.map(e => [
        new Date(e.spent_at).toLocaleDateString('fr-CH'),
        e.description,
        e.category ?? '',
        (e.amount_cents / 100).toFixed(2),
        e.profiles?.display_name ?? '',
      ]),
    ]

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `depenses-${groupName.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
    >
      <Download className="size-3.5" />
      Exporter CSV
    </button>
  )
}
