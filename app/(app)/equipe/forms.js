'use client'

import { useActionState, useEffect, useState } from 'react'
import { createUserAction, updateUserAction, resetPasswordAction } from '@/lib/actions'
import { Msg } from '@/components/Msg'

export function CreateUser({ roles }) {
  const [state, action, pending] = useActionState(createUserAction, null)
  return (
    <form action={action} className="panel gold">
      <h2>Ajouter un employé</h2>
      <div className="form-row">
        <label className="field grow">Nom RP<input id="new-name" name="display_name" defaultValue={state?.values?.display_name} placeholder="Prénom Nom" required /></label>
        <label className="field">Identifiant<input id="new-username" name="username" defaultValue={state?.values?.username} placeholder="prenom.nom" required /></label>
        <label className="field">Rôle
          <select id="new-role" name="role" defaultValue={state?.values?.role || roles[roles.length - 1]?.key}>
            {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </label>
        <label className="field">Mot de passe provisoire<input id="new-password" name="password" type="text" minLength={8} required autoComplete="off" /></label>
        <button className="btn tight" disabled={pending}>{pending ? '…' : 'Créer le compte'}</button>
      </div>
      <Msg state={state} />
      <p className="faint" style={{ fontSize: 13 }}>Donne l’identifiant et le mot de passe à l’employé. Il pourra le changer dans « Mon compte ».</p>
    </form>
  )
}

export function UserRow({ user, roles, self, editable, roleLabel }) {
  const [state, action, pending] = useActionState(updateUserAction, null)
  const [pwState, pwAction, pwPending] = useActionState(resetPasswordAction, null)
  const [pwOpen, setPwOpen] = useState(false)
  useEffect(() => { if (pwState?.ok) setPwOpen(false) }, [pwState])
  const formId = `user-${user.id}`
  return (
    <tr style={user.active ? undefined : { opacity: 0.55 }}>
      <td>{user.display_name}{self && <span className="faint"> (toi)</span>}</td>
      <td className="num faint">{user.username}</td>
      <td>
        {editable ? (
          <select id={`role-${user.id}`} name="role" form={formId} defaultValue={user.role}>
            {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        ) : <span className="pill role">{roleLabel}</span>}
      </td>
      <td>
        {editable ? <input id={`active-${user.id}`} type="checkbox" name="active" form={formId} defaultChecked={user.active} aria-label="Compte actif" /> : <span className={`pill ${user.active ? 'ok' : 'off'}`}>{user.active ? 'Oui' : 'Non'}</span>}
      </td>
      <td className="r">
        {editable && (
          <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <form id={formId} action={action}>
              <input type="hidden" name="id" value={user.id} />
              <button className="btn small" disabled={pending}>Enregistrer</button>
            </form>
            {pwOpen ? (
              <form action={pwAction} style={{ display: 'inline-flex', gap: 6 }}>
                <input type="hidden" name="id" value={user.id} />
                <input id={`pw-${user.id}`} name="password" placeholder="Nouveau mot de passe" minLength={8} required style={{ width: 170 }} autoComplete="off" />
                <button className="btn small" disabled={pwPending}>OK</button>
                <button type="button" className="btn ghost small" onClick={() => setPwOpen(false)}>×</button>
              </form>
            ) : <button type="button" className="btn ghost small" onClick={() => setPwOpen(true)}>Mot de passe</button>}
          </div>
        )}
        {(state || pwState) && <div style={{ marginTop: 6 }}><Msg state={pwState?.t > (state?.t || 0) ? pwState : state} /></div>}
      </td>
    </tr>
  )
}
