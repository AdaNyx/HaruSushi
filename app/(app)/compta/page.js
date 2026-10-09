import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getCash, getTotals, getOperations, getProductSales, getStaffActivity, periodStart, PERIODS } from '@/lib/data'
import { KINDS } from '@/lib/roles'
import { money } from '@/lib/format'
import { OpsTable } from '@/components/OpsTable'
import { MoneyForm } from './MoneyForm'

export const metadata = { title: 'Compta' }

export default async function ComptaPage({ searchParams }) {
  await requireUser('manager')
  const sp = await searchParams
  const p = PERIODS[sp.p] ? sp.p : 'semaine'
  const type = KINDS[sp.type] ? sp.type : ''
  const since = periodStart(p)
  const [cash, totals, ops, products, staff] = await Promise.all([
    getCash(),
    getTotals(since),
    getOperations({ since, kind: type || null, limit: 300 }),
    getProductSales(since),
    getStaffActivity(since)
  ])
  const result = totals.income - totals.expense
  const href = (np, nt) => {
    const q = new URLSearchParams()
    if (np !== 'semaine') q.set('p', np)
    if (nt) q.set('type', nt)
    const s = q.toString()
    return `/compta${s ? `?${s}` : ''}`
  }
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Comptabilité</span>
          <h1>Compta</h1>
          <p>Toutes les entrées et sorties d’argent. Les ventes et achats arrivent tout seuls, les salaires, primes et autres frais s’ajoutent à la main.</p>
        </div>
        <nav className="tabs" aria-label="Période">
          {Object.entries(PERIODS).map(([k, v]) => <Link key={k} href={href(k, type)} aria-current={k === p ? 'true' : undefined}>{v.label}</Link>)}
        </nav>
      </div>

      <div className="stats">
        <div className="stat lead"><span className="eyebrow">Caisse actuelle</span><span className="v">{money(cash)}</span></div>
        <div className="stat"><span className="eyebrow">Entrées</span><span className="v good">{money(totals.income)}</span><span className="faint">dont ventes {money(totals.sales)}</span></div>
        <div className="stat"><span className="eyebrow">Sorties</span><span className="v bad">{money(totals.expense)}</span><span className="faint">dont achats {money(totals.purchases)}</span></div>
        <div className="stat"><span className="eyebrow">Résultat</span><span className={`v ${result >= 0 ? 'good' : 'bad'}`}>{money(result)}</span><span className="faint">{PERIODS[p].label.toLowerCase()}</span></div>
      </div>

      <div className="grid cols-2">
        <section className="panel">
          <h2>Ventes par produit</h2>
          {products.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Produit</th><th className="r">Qté</th><th className="r">Total</th></tr></thead>
                <tbody>{products.map((r) => <tr key={r.name}><td>{r.name}</td><td className="r num">{r.qty}</td><td className="r num">{money(r.total)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="empty">Aucune vente sur la période.</p>}
        </section>
        <section className="panel">
          <h2>Activité de l’équipe</h2>
          {staff.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Employé</th><th className="r">Prépa.</th><th className="r">Ventes</th><th className="r">Encaissé</th></tr></thead>
                <tbody>{staff.map((r) => <tr key={r.name}><td>{r.name}</td><td className="r num">{r.crafts}</td><td className="r num">{r.sales}</td><td className="r num">{money(r.sales_total)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="empty">Aucune activité sur la période.</p>}
        </section>
      </div>

      <MoneyForm />

      <section className="panel">
        <div className="panel-head">
          <h2>Journal</h2>
          <nav className="tabs" aria-label="Type">
            <Link href={href(p, '')} aria-current={!type ? 'true' : undefined}>Tout</Link>
            {Object.entries(KINDS).map(([k, v]) => <Link key={k} href={href(p, k)} aria-current={k === type ? 'true' : undefined}>{v}</Link>)}
          </nav>
        </div>
        <OpsTable ops={ops} />
      </section>
    </>
  )
}
