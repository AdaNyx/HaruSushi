import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { can, CATEGORIES } from '@/lib/roles'
import { getItems, getCash, getTotals, getOperations, getProductSales, periodStart } from '@/lib/data'
import { money, num } from '@/lib/format'
import { OpsTable } from '@/components/OpsTable'

export const metadata = { title: 'Tableau de bord' }

export default async function Dashboard() {
  const user = await requireUser()
  const boss = can(user.role, 'manager')
  const today = periodStart('jour')
  const week = periodStart('semaine')
  const [items, dayTotals, weekTotals, cash, ops, top] = await Promise.all([
    getItems(),
    getTotals(today),
    boss ? getTotals(week) : null,
    boss ? getCash() : null,
    getOperations({ since: week, userId: boss ? null : user.id, limit: 12 }),
    boss ? getProductSales(week) : []
  ])
  const alerts = items.filter((i) => i.alert_threshold > 0 && i.quantity <= i.alert_threshold)
  const finished = items.filter((i) => i.category === 'fini')
  const topMax = Math.max(1, ...top.map((t) => t.total))

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Bonjour {user.display_name}</span>
          <h1>Tableau de bord</h1>
        </div>
        <div className="form-row" style={{ flex: '0 0 auto' }}>
          <Link className="btn ghost tight" href="/preparer">Préparer</Link>
          <Link className="btn tight" href="/ventes">Nouvelle vente</Link>
        </div>
      </div>

      {boss ? (
        <div className="stats">
          <div className="stat lead"><span className="eyebrow">Caisse</span><span className="v">{money(cash)}</span></div>
          <div className="stat"><span className="eyebrow">Ventes aujourd’hui</span><span className="v good">{money(dayTotals.sales)}</span><span className="faint">{dayTotals.saleCount} vente{dayTotals.saleCount > 1 ? 's' : ''}</span></div>
          <div className="stat"><span className="eyebrow">Ventes 7 jours</span><span className="v good">{money(weekTotals.sales)}</span></div>
          <div className="stat"><span className="eyebrow">Dépenses 7 jours</span><span className="v bad">{money(weekTotals.expense)}</span></div>
          <div className="stat"><span className="eyebrow">Résultat 7 jours</span><span className={`v ${weekTotals.income - weekTotals.expense >= 0 ? 'good' : 'bad'}`}>{money(weekTotals.income - weekTotals.expense)}</span></div>
        </div>
      ) : (
        <div className="stats">
          <div className="stat"><span className="eyebrow">Préparations aujourd’hui</span><span className="v">{dayTotals.craftCount}</span><span className="faint">tout le restaurant</span></div>
          <div className="stat"><span className="eyebrow">Ventes aujourd’hui</span><span className="v">{dayTotals.saleCount}</span><span className="faint">tout le restaurant</span></div>
          <div className="stat"><span className="eyebrow">Alertes stock</span><span className={`v ${alerts.length ? 'bad' : 'good'}`}>{alerts.length}</span></div>
        </div>
      )}

      <div className="grid cols-2">
        <section className="panel">
          <div className="panel-head"><h2>Stock à surveiller</h2><Link href="/stock" className="faint">Tout le stock</Link></div>
          {alerts.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Produit</th><th>Type</th><th className="r">Stock</th><th className="r">Seuil</th></tr></thead>
                <tbody>
                  {alerts.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td className="faint">{CATEGORIES[i.category]}</td>
                      <td className="r"><span className={`pill ${i.quantity === 0 ? 'out' : 'low'}`}>{num(i.quantity)}</span></td>
                      <td className="r num faint">{i.alert_threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="empty">Tout est au-dessus des seuils.</p>}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Plats prêts à vendre</h2></div>
          <div className="table-wrap">
            <table>
              <tbody>
                {finished.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td className="r num">{i.sell_price !== null ? money(i.sell_price) : <span className="faint">prix ?</span>}</td>
                    <td className="r"><span className={`pill ${i.quantity === 0 ? 'out' : i.quantity <= i.alert_threshold ? 'low' : 'ok'}`}>{num(i.quantity)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {boss && (
        <section className="panel">
          <div className="panel-head"><h2>Meilleures ventes</h2><span className="eyebrow">7 jours</span></div>
          {top.length ? (
            <div className="table-wrap">
              <table>
                <tbody>
                  {top.map((t) => (
                    <tr key={t.name}>
                      <td style={{ width: '32%' }}>{t.name}</td>
                      <td style={{ width: '40%' }}><div className="bar"><i style={{ width: `${(t.total / topMax) * 100}%` }} /></div></td>
                      <td className="r num">{t.qty}</td>
                      <td className="r num">{money(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="empty">Aucune vente sur les 7 derniers jours.</p>}
        </section>
      )}

      <section className="panel">
        <div className="panel-head"><h2>{boss ? 'Dernières opérations' : 'Mes dernières actions'}</h2>{boss && <Link href="/compta" className="faint">Toute la compta</Link>}</div>
        <OpsTable ops={ops} showAmount={boss} showUser={boss} />
      </section>
    </>
  )
}
