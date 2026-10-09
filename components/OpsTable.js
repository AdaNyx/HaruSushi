import { KINDS } from '@/lib/roles'
import { date, signedMoney } from '@/lib/format'

function describe(lines) {
  return lines
    .map((l) => `${l.delta > 0 ? '+' : ''}${l.delta} ${l.name}${l.price !== null && l.price !== undefined ? ` à ${Number(l.price)} $` : ''}`)
    .join(' · ')
}

export function OpsTable({ ops, showAmount = true, showUser = true }) {
  if (!ops.length) return <p className="empty">Aucune opération sur cette période.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Détail</th>
            {showUser && <th>Par</th>}
            {showAmount && <th className="r">Montant</th>}
          </tr>
        </thead>
        <tbody>
          {ops.map((o) => {
            const amount = Number(o.amount)
            return (
              <tr key={o.id}>
                <td className="num faint" style={{ whiteSpace: 'nowrap' }}>{date(o.created_at)}</td>
                <td><span className={`kind ${o.kind}`}>{KINDS[o.kind]}</span></td>
                <td>
                  {o.label}
                  {o.note && <span className="faint"> · {o.note}</span>}
                  {o.lines.length > 0 && o.kind !== 'ajustement' && <div className="lines">{describe(o.lines)}</div>}
                </td>
                {showUser && <td className="faint">{o.user_name || '—'}</td>}
                {showAmount && <td className={`r num ${amount > 0 ? 'pos' : amount < 0 ? 'neg' : 'faint'}`}>{amount ? signedMoney(amount) : '—'}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
