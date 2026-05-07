'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Calendar, ShoppingCart, ChefHat, CreditCard, Settings, NotebookPen } from 'lucide-react'

const navItems = [
  { href: '/tasks', label: 'Tâches', icon: CheckSquare },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
  { href: '/shopping', label: 'Courses', icon: ShoppingCart, extra: ['/stock'] },
  { href: '/recipes', label: 'Recettes', icon: ChefHat, extra: ['/meals'] },
  { href: '/notes', label: 'Notes', icon: NotebookPen },
  { href: '/expenses', label: 'Dépenses', icon: CreditCard },
  { href: '/settings', label: 'Foyer', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon, extra }) => {
          const active = pathname.startsWith(href) || (extra ?? []).some(e => pathname.startsWith(e))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`size-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
