'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Package } from 'lucide-react'

export default function ShoppingStockNav({ shoppingHref }: { shoppingHref: string }) {
  const pathname = usePathname()
  const isStock = pathname.startsWith('/stock')

  return (
    <div className="flex gap-1 p-1 bg-secondary rounded-xl">
      <Link
        href={shoppingHref}
        className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-medium transition-colors ${
          !isStock ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <ShoppingCart className="size-3.5" />
        Courses
      </Link>
      <Link
        href="/stock"
        className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-medium transition-colors ${
          isStock ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Package className="size-3.5" />
        Stock
      </Link>
    </div>
  )
}
