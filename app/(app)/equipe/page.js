import { requireUser } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { ROLES, ROLE_KEYS, canManage } from '@/lib/roles'
import { CreateUser, UserRow } from './forms'

export const metadata = { title: 'Équipe' }

export default async function EquipePage() {
  const me = await requireUser('copatron')
  const users = await getUsers()
  const assignable = ROLE_KEYS.filter((r) => canManage(me.role, r, r)).map((r) => ({ key: r, label: ROLES[r].label }))
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Personnel</span>
          <h1>Équipe</h1>
          <p>Crée un compte pour chaque employé et donne-lui son rôle. Un compte désactivé ne peut plus se connecter mais son historique reste dans la compta.</p>
        </div>
      </div>

      <section className="panel">
        <h2>Ce que chaque rôle peut faire</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rôle</th><th>Accès</th></tr></thead>
            <tbody>
              <tr><td><span className="pill role">Employé</span></td><td>Préparer, encaisser des ventes, voir le stock, calculateur</td></tr>
              <tr><td><span className="pill role">Manager</span></td><td>+ achats, correction du stock, compta, dépenses et recettes</td></tr>
              <tr><td><span className="pill role">Co-patron</span></td><td>+ gestion des employés et managers, prix et seuils d’alerte</td></tr>
              <tr><td><span className="pill role">Patron</span></td><td>Tout, y compris les co-patrons</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <CreateUser roles={assignable} />

      <section className="panel">
        <h2>Comptes ({users.filter((u) => u.active).length} actifs)</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nom RP</th><th>Identifiant</th><th>Rôle</th><th>Actif</th><th className="r">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={{ id: u.id, username: u.username, display_name: u.display_name, role: u.role, active: u.active }} roles={assignable} self={u.id === me.id} editable={u.id !== me.id && canManage(me.role, u.role, u.role)} roleLabel={ROLES[u.role].label} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
