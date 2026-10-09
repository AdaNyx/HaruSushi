'use client'

import { useActionState } from 'react'
import { moneyAction } from '@/lib/actions'
import { Msg } from '@/components/Msg'

export function MoneyForm() {
  const [state, action, pending] = useActionState(moneyAction, null)
  return (
    <form action={action} className="panel">
      <div className="panel-head"><h2>Ajouter une dépense ou une recette</h2><span className="faint">Salaires, primes, facture, fonds de départ…</span></div>
      <div className="form-row">
        <label className="field tight">Type
          <select id="money-kind" name="kind" defaultValue={state?.values?.kind || 'depense'}>
            <option value="depense">Dépense</option>
            <option value="recette">Recette</option>
          </select>
        </label>
        <label className="field grow">Libellé<input id="money-label" name="label" defaultValue={state?.values?.label} placeholder="Salaire de la semaine, prime…" required /></label>
        <label className="field">Montant ($)<input id="money-amount" name="amount" defaultValue={state?.values?.amount} type="number" min="0.01" step="0.01" required /></label>
        <label className="field grow">Note<input id="money-note" name="note" defaultValue={state?.values?.note} placeholder="Facultatif" /></label>
        <button className="btn tight" disabled={pending}>{pending ? '…' : 'Ajouter'}</button>
      </div>
      <Msg state={state} />
    </form>
  )
}
