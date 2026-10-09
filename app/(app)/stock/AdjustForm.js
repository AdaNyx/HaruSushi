'use client'

import { useActionState, useEffect, useState } from 'react'
import { adjustAction } from '@/lib/actions'
import { Msg } from '@/components/Msg'

export function AdjustForm({ item }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(adjustAction, null)
  useEffect(() => { if (state?.ok) setOpen(false) }, [state])
  if (!open) {
    return (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        {state?.ok && <span className="pos" style={{ fontSize: 13 }}>Corrigé</span>}
        <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>Corriger</button>
      </span>
    )
  }
  return (
    <form action={action} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <input type="hidden" name="item" value={item.id} />
      <input id={`adj-${item.id}`} name="quantity" type="number" min="0" defaultValue={state?.values?.quantity ?? item.quantity} style={{ width: 80 }} aria-label="Nouvelle quantité" autoFocus />
      <input id={`adj-note-${item.id}`} name="note" defaultValue={state?.values?.note} placeholder="Raison" style={{ width: 130 }} />
      <button className="btn small" disabled={pending}>OK</button>
      <button type="button" className="btn ghost small" onClick={() => setOpen(false)}>Annuler</button>
      {state && !state.ok && <div style={{ flexBasis: '100%' }}><Msg state={state} /></div>}
    </form>
  )
}
