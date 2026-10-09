import { redirect } from 'next/navigation'
import { needsSetup } from '@/lib/actions'
import { currentUser } from '@/lib/auth'
import { LoginForm, SetupForm } from './forms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Connexion' }

export default async function LoginPage() {
  const setup = await needsSetup()
  if (!setup) {
    const user = await currentUser().catch(() => null)
    if (user) redirect('/')
  }
  return (
    <main className="auth">
      <div className="panel">
        <div>
          <span className="eyebrow" style={{ color: 'var(--gold)' }}>GtarRP · Restaurant</span>
          <h1 style={{ marginTop: 6 }}>Haru Sushi</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {setup ? 'Première connexion : crée le compte Patron. La base sera installée avec toutes les recettes.' : 'Connecte-toi avec le compte que ton patron t’a donné.'}
          </p>
        </div>
        {setup ? <SetupForm /> : <LoginForm />}
      </div>
    </main>
  )
}
