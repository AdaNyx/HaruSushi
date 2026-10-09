'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Nav({ items }) {
  const path = usePathname()
  return (
    <nav className="nav" aria-label="Menu">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={(i.href === '/' ? path === '/' : path.startsWith(i.href)) ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
