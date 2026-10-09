export const ROLES = {
  employe: { rank: 1, label: 'Employé' },
  manager: { rank: 2, label: 'Manager' },
  copatron: { rank: 3, label: 'Co-patron' },
  patron: { rank: 4, label: 'Patron' }
}

export const ROLE_KEYS = ['patron', 'copatron', 'manager', 'employe']

export function can(role, min) {
  return (ROLES[role]?.rank || 0) >= ROLES[min].rank
}

export function canManage(actor, targetRole, newRole) {
  if (actor === 'patron') return true
  const a = ROLES[actor]?.rank || 0
  return (ROLES[targetRole]?.rank || 0) < a && (ROLES[newRole || targetRole]?.rank || 0) < a
}

export const NAV = [
  { href: '/', label: 'Tableau de bord', min: 'employe' },
  { href: '/preparer', label: 'Préparer', min: 'employe' },
  { href: '/ventes', label: 'Ventes', min: 'employe' },
  { href: '/stock', label: 'Stock', min: 'employe' },
  { href: '/calculateur', label: 'Calculateur', min: 'employe' },
  { href: '/achats', label: 'Achats', min: 'manager' },
  { href: '/compta', label: 'Compta', min: 'manager' },
  { href: '/equipe', label: 'Équipe', min: 'copatron' },
  { href: '/parametres', label: 'Paramètres', min: 'copatron' }
]

export const CATEGORIES = {
  brut: 'Produits bruts',
  intermediaire: 'Intermédiaires',
  fini: 'Plats finis',
  boisson: 'Boissons'
}

export const STATIONS = {
  riz: 'Poste riz',
  poisson: 'Poste poisson',
  montage: 'Poste montage'
}

export const KINDS = {
  preparation: 'Préparation',
  achat: 'Achat',
  vente: 'Vente',
  ajustement: 'Ajustement',
  depense: 'Dépense',
  recette: 'Recette'
}
