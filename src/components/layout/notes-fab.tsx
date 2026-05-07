'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotebookPen } from 'lucide-react'

export default function NotesFab() {
  const pathname = usePathname()

  // Caché sur la page notes elle-même
  if (pathname.startsWith('/notes')) return null

  return (
    <Link
      href="/notes"
      aria-label="Mes notes"
      className="fixed bottom-20 left-4 z-40 size-12 rounded-full bg-card border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary hover:shadow-lg transition-all"
    >
      <NotebookPen className="size-5" />
    </Link>
  )
}
