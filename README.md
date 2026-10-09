# Haru Sushi

Compta et gestion de stock de l’entreprise Haru Sushi (GtarRP).

## Mise en ligne sur Vercel

1. Pousse ce dossier sur GitHub (`AdaNyx/HaruSushi`).
2. Sur Vercel : **Add New → Project**, importe le dépôt. Framework détecté : Next.js.
3. Onglet **Storage** du projet : **Create Database → Neon**. Vercel ajoute `DATABASE_URL` tout seul.
4. **Settings → Environment Variables**, ajoute :
   - `AUTH_SECRET` : une longue chaîne aléatoire (32 caractères ou plus)
   - `SETUP_KEY` : un code secret que toi seule connais
5. Redéploie, ouvre le site : il propose de créer le compte Patron avec le `SETUP_KEY`. La base et toutes les recettes s’installent à ce moment-là.

## Rôles

| Rôle | Accès |
| --- | --- |
| Employé | Préparer, ventes, stock, calculateur |
| Manager | + achats, correction du stock, compta |
| Co-patron | + équipe (employés, managers), prix et seuils |
| Patron | Tout |

## En local

```
npm install
cp .env.example .env.local
npm run dev
```
