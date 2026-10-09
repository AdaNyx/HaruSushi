import { requireUser } from '@/lib/auth'
import { ROLES } from '@/lib/roles'
import { PasswordForm } from './PasswordForm'

export const metadata = { title: 'Mon compte' }

export default async function ComptePage() {
  const me = await requireUser()
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{ROLES[me.role].label}</span>
          <h1>{me.display_name}</h1>
          <p>Identifiant : <span className="num">{me.username}</span></p>
        </div>
      </div>
      <PasswordForm />
    </>
  )
}
