'use client'

import { useActionState } from 'react'
import { changePasswordAction } from '@/lib/actions'
import { Msg } from '@/components/Msg'

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null)
  return (
    <form action={action} className="panel" style={{ maxWidth: 460 }}>
      <h2>Changer mon mot de passe</h2>
      <label className="field">Mot de passe actuel<input id="pw-current" name="current" type="password" autoComplete="current-password" required /></label>
      <label className="field">Nouveau mot de passe<input id="pw-next" name="next" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label className="field">Confirmer<input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></label>
      <Msg state={state} />
      <div><button className="btn" disabled={pending}>{pending ? '…' : 'Changer le mot de passe'}</button></div>
    </form>
  )
}
