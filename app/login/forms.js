'use client'

import { useActionState } from 'react'
import { loginAction, setupAction } from '@/lib/actions'
import { Msg } from '@/components/Msg'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null)
  return (
    <form action={action}>
      <label className="field">Identifiant<input id="username" name="username" autoComplete="username" defaultValue={state?.values?.username} required /></label>
      <label className="field">Mot de passe<input id="password" name="password" type="password" autoComplete="current-password" required /></label>
      <Msg state={state} />
      <button className="btn" disabled={pending}>{pending ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  )
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAction, null)
  return (
    <form action={action}>
      <label className="field">Code d’installation<input id="key" name="key" type="password" required /></label>
      <label className="field">Nom RP<input id="display_name" name="display_name" placeholder="Prénom Nom" defaultValue={state?.values?.display_name} required /></label>
      <label className="field">Identifiant<input id="username" name="username" autoComplete="username" defaultValue={state?.values?.username} required /></label>
      <label className="field">Mot de passe<input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <Msg state={state} />
      <button className="btn" disabled={pending}>{pending ? 'Installation…' : 'Installer et créer le compte Patron'}</button>
    </form>
  )
}
