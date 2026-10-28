# Pocket

Gestionnaire financier personnel pour Mac et iPhone (PWA installable), pensé comme un **outil de décision** :
combien j'ai réellement, ce qui va entrer et sortir, ce que je peux dépenser aujourd'hui, ce qu'il me restera
en fin de mois, comment rembourser mes dettes et épargner sans me mettre en difficulté.

- **100 % local par défaut** : aucune inscription, aucun compte bancaire connecté, fonctionne hors ligne.
- **Synchronisation facultative** entre appareils via Supabase (offre gratuite), activable plus tard.
- **Calculs fiables** : montants en centimes entiers, logique financière isolée et testée.
- **Honnête** : un revenu prévu n'est jamais compté comme encaissé, une facture prévue jamais comme payée,
  un solde inconnu n'est jamais deviné, toutes les hypothèses sont visibles et modifiables.

Le nom affiché est configurable (`VITE_APP_NAME` ou Paramètres).

---

## Démarrer depuis un clone vierge

Prérequis : **Node.js 20** (testé avec 20.18) et npm 10+. Rien d'autre n'est nécessaire pour le mode local.

```bash
git clone git@github.com:estebanbaigts/Pocket-Finance.git
cd Pocket-Finance
npm install
npm run dev
```

Ouvre <http://localhost:5173>. L'assistant de premier lancement te guide (comptes, revenus, dépenses fixes,
crédits, budgets, première projection). Chaque étape peut être passée.

### Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification des types puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production (service worker actif) |
| `npm test` | Tests unitaires et d'intégration (Vitest) |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint |
| `npm run test:db` | Migrations + tests de sécurité RLS sur un PostgreSQL local jetable (nécessite PostgreSQL ≥ 15) |
| `npm run check` | Types + lint + tests + build |

### Installer sur iPhone / Mac

L'application doit être servie en HTTPS (un hébergement statique gratuit suffit, voir
[docs/deploiement.md](docs/deploiement.md)).

- **iPhone** : Safari → Partager → « Sur l'écran d'accueil ».
- **Mac** : Safari → Fichier → « Ajouter au Dock » (ou Chrome → Installer l'application).

---

## Ce qui est livré

| Section | Contenu |
| --- | --- |
| Vue d'ensemble | Argent réellement disponible, fin de mois en 3 scénarios, dépensable aujourd'hui / cette semaine / d'ici la fin du mois, mois en cours (réel vs estimé), à venir, constats justifiés, doublons à rapprocher |
| Transactions | Création, modification, suppression (confirmée, annulable), statuts, recherche et filtres |
| Factures et échéances | À payer / à recevoir, échéances passées « à actualiser », règles récurrentes |
| Budgets | Par catégorie, « à partir de tel mois » sans réécrire l'historique, report, alertes, comparaison |
| Comptes | Soldes déclarés ou inconnus, solde calculé |
| Dettes | Capital, mensualité, taux facultatif, remboursements, simulateur, avalanche / boule de neige |
| Épargne | Objectifs, contribution mensuelle nécessaire, épargne affectée / libre / réserve factures |
| Prévisions | Trois scénarios déterministes, courbe jour par jour, hypothèses modifiables |
| Analyses | 6 derniers mois, catégories, fixe/variable, poids des dettes, constats |
| Paramètres | Synchronisation, sauvegarde/restauration, catégories, CA déclaré, paramètres fiscaux, effacement |

## Documentation

- [Architecture](docs/architecture.md) — organisation du code, choix techniques et arbitrages
- [Règles de calcul](docs/regles-de-calcul.md) — statuts, soldes, projections, arrondis
- [Modèle de données](docs/modele-de-donnees.md) — entités, tables, contraintes
- [Synchronisation](docs/synchronisation.md) — configuration Supabase pas à pas, limites gratuites
- [Sécurité et confidentialité](docs/securite.md)
- [Sauvegarde et restauration](docs/sauvegarde.md)
- [Déploiement](docs/deploiement.md)
- [Tests](docs/tests.md)
- [Guide utilisateur](docs/guide-utilisateur.md)
- [Limites connues et feuille de route](docs/limites-et-roadmap.md)

## Pile technique

React 19 · TypeScript strict · Vite 6 · Tailwind CSS 4 · Motion 12 (`motion/react`) · Dexie 4 (IndexedDB) ·
React Hook Form + Zod · Lucide · Supabase (facultatif). Graphiques en SVG maison (pas de Recharts : voir
[architecture](docs/architecture.md#arbitrages)).
