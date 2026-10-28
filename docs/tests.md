# Tests

```bash
npm test          # Vitest : domaine + intégration (IndexedDB simulée par fake-indexeddb)
npm run test:db   # PostgreSQL local jetable : migrations + RLS
```

## Couverture des cas obligatoires

| Cas | Où |
| --- | --- |
| Montant nul | `unit/money`, `unit/ledger/balances` |
| Remboursement partiel, dette remboursée | `unit/debts` |
| Opération annulée | `unit/ledger/balances`, `unit/budgets`, `unit/forecast` |
| Transfert entre comptes (ni revenu ni dépense, total inchangé) | `unit/ledger/balances`, `unit/savings`, `unit/forecast` |
| Revenu attendu non encaissé | `unit/ledger/balances`, `unit/forecast` |
| Facture payée vs dépense séparée (rapprochement) | `unit/ledger/duplicates` |
| Récurrence sur deux mois, février, année bissextile | `unit/recurrence`, `unit/dates` |
| Changement de fuseau / d'heure | `unit/dates` |
| Synchronisation répétée, conflit, perte de connexion | `integration/sync` |
| Restauration depuis une sauvegarde, fichier invalide | `integration/storage` |
| Suppression d'une transaction (et annulation) | `integration/storage` |
| Recalcul historique après modification | `unit/ledger/balances`, `integration/storage` |
| Factures récurrentes sans doublon (répétition, suppression, initialisation concurrente) | `unit/recurrence`, `integration/storage` |
| Isolation entre utilisateurs, accès anonyme, usurpation | `db/tests/rls_test.sql` |

## Vérifications manuelles réalisées (navigateur, 28/10/2026)

- Assistant complet avec les valeurs pré-remplies ; reprise sans doublon après rechargement.
- Création (raccourci N), modification, suppression confirmée puis annulation d'une dépense ; totaux recalculés.
- Règlement d'une échéance depuis la vue d'ensemble ; projections mises à jour.
- Saisie d'un solde de compte ; vue d'ensemble, prévisions et capacité de dépense recalculées.
- Les 10 sections à 375 px (iPhone) : aucune barre de défilement horizontale ; mode clair et sombre.
- Build de production : service worker activé, 27 fichiers en cache.

Non vérifié automatiquement : parcours de bout en bout scriptés (pas de Playwright installé), synchronisation avec un
vrai projet Supabase, rechargement hors ligne (voir [déploiement](deploiement.md)).
