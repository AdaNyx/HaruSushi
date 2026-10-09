import { requireUser } from '@/lib/auth'
import { getItems, getRecipes } from '@/lib/data'
import { Calculator } from './Calculator'

export const metadata = { title: 'Calculateur' }

export default async function CalculateurPage() {
  await requireUser()
  const [items, recipes] = await Promise.all([getItems(), getRecipes()])
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Avant le service</span>
          <h1>Calculateur de commande</h1>
          <p>Indique ce que tu veux avoir à vendre. Le calcul remonte toutes les recettes et te dit quoi acheter et combien de fois cliquer sur « Préparer » à chaque poste.</p>
        </div>
      </div>
      <Calculator items={items} recipes={recipes} />
    </>
  )
}
