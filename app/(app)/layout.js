import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { logoutAction } from '@/lib/actions'
import { NAV, ROLES, can } from '@/lib/roles'
import { Nav } from '@/components/Nav'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }) {
  const user = await requireUser()
  const items = NAV.filter((n) => can(user.role, n.min)).map(({ href, label }) => ({ href, label }))
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand"><span>GtarRP</span><b>Haru Sushi</b></Link>
        <Nav items={items} />
        <div className="me">
          <div className="who">
            <b>{user.display_name}</b>
            <span className="eyebrow" style={{ color: 'var(--gold)' }}>{ROLES[user.role].label}</span>
          </div>
          <div className="links">
            <Link href="/compte">Mon compte</Link>
            <form action={logoutAction}><button className="linkbtn">Déconnexion</button></form>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
