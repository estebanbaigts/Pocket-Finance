# Architecture

## Principes

1. **Local d'abord** : IndexedDB est la source de vérité de l'appareil. L'interface lit et écrit toujours en local ;
   la synchronisation est un processus d'arrière-plan qui ne bloque jamais une saisie.
2. **Logique financière isolée** : tout calcul vit dans `src/domain/`, en fonctions pures, déterministes, sans React
   ni stockage. Les composants n'additionnent jamais de montants eux-mêmes.
3. **Rien de dérivé n'est stocké** : soldes, budgets consommés, projections sont recalculés à partir des opérations.
   Modifier ou supprimer une opération ne peut donc pas laisser un cumul faux (pas de double comptage).
4. **Petits fichiers** : une responsabilité par fichier, environ quatre fonctions au plus.

## Organisation

```
src/
  app/          coque : routes, navigation (barre latérale / onglets), raccourcis, démarrage
  domain/       règles métier pures et testées
    model/        types des entités, statuts et transitions
    money/        saisie, formatage, arithmétique en centimes
    dates/        dates calendaires AAAA-MM-JJ sans fuseau
    ledger/       soldes, agrégats mensuels, doublons et rapprochement
    recurrence/   calendrier des règles, matérialisation idempotente, équivalent mensuel
    budgets/      budget effectif, consommation, report, synthèse
    debts/        amortissement, stratégies, progression
    savings/      objectifs, répartition de l'argent
    forecast/     estimation des dépenses courantes, scénarios, courbe, capacité de dépense
    analysis/     tendances
    income/       chiffre d'affaires vs trésorerie
    insights/     constats explicables
  services/
    storage/      Dexie, dépôt (écriture + file atomiques), sauvegarde, récurrence, valeurs par défaut
    sync/         moteur (envoi/réception), conflits, état, adaptateur Supabase, authentification
  features/     un dossier par section (page + composants + formulaires + actions)
  components/   design system : ui/, motion/, charts/
  styles/       tokens CSS et base
db/
  migrations/   SQL versionné (schéma, RLS)
  tests/        tests de sécurité exécutés sur un PostgreSQL local
tests/
  unit/         règles métier
  integration/  stockage, synchronisation
```

## Flux de données

```
Formulaire (RHF + Zod) ─▶ features/*/actions ─▶ services/storage/repository
                                                   │  (écriture + entrée de file, même transaction)
                                                   ▼
                                               IndexedDB ──▶ LedgerProvider (useLiveQuery) ──▶ useFinancials (domain) ──▶ UI
                                                   ▲
                       services/sync/engine ◀──────┘  (si activée : réception puis envoi, verrou optimiste)
```

## Arbitrages

| Sujet | Choix | Raison |
| --- | --- | --- |
| Vite 6 | plutôt que 7/8 | Node 20.18 installé ; Vite ≥ 7 exige Node 20.19 |
| Graphiques | SVG maison (≈ 150 lignes) | Recharts ajoutait ~100 ko gzip pour trois graphiques simples ; le SVG suit les tokens et le mode sombre |
| shadcn/ui | non utilisé | Composants propres sur les tokens, pour éviter l'aspect « template » demandé à éviter ; Radix non nécessaire |
| TanStack Query | non utilisé | Aucun appel serveur hors moteur de synchronisation |
| Routage | fragment d'URL (`#/budgets`) | Fonctionne hors ligne et depuis l'écran d'accueil iOS sans configuration serveur |
| Factures | `recurring_rules` + transactions prévues | Une échéance *est* une opération prévue : la marquer payée change son statut, aucun double comptage possible |
| Revenus attendus | transactions `income` en statut prévu/confirmé | Mêmes règles, même liste, mêmes projections |
| Contributions d'épargne | transferts avec `goal_id` | L'épargne est un transfert, jamais une dépense |
| `monthly_snapshots` | non stocké | Tout est recalculable ; stocker un cumul créerait un risque d'incohérence |
| `income_expectations`, `bills`, `savings_contributions` | non créées | Couvertes par les choix ci-dessus (documentés dans le modèle de données) |
| `sync_metadata` | local uniquement (tables `outbox`, `conflicts`, `meta`) | Propre à chaque appareil |
| Service worker | écrit à la main, liste générée au build | Moins de dépendances que vite-plugin-pwa/workbox pour un besoin simple |
| SDK Supabase | chargé à la demande | Le mode local n'en télécharge pas un octet |

## Motion

Convention dans `src/components/motion/` : durées 140 / 200 / 280 / 420 ms, courbe `cubic-bezier(.2,.8,.2,1)`,
ressort amorti pour feuilles et listes. `MotionConfig reducedMotion="user"` + règle CSS `prefers-reduced-motion`.
Les montants s'animent en ≤ 350 ms et la valeur finale est toujours exposée aux lecteurs d'écran. Aucune action
financière n'attend la fin d'une animation ; aucune animation permanente.
