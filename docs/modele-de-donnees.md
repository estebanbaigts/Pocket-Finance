# Modèle de données

Types : `src/domain/model/entities.ts`. Tables : `db/migrations/20261028000001_schema.sql`.

## Champs communs (toute entité synchronisée)

| Champ local | Colonne | Rôle |
| --- | --- | --- |
| — | `owner_id` | Propriétaire, imposé par le serveur (`auth.uid()`) |
| `id` | `id` | UUID généré par l'appareil (ou déterministe pour occurrences et catégories par défaut) |
| `createdAt`, `updatedAt` | `created_at`, `updated_at` | Horodatages de l'appareil |
| `deletedAt` | `deleted_at` | Suppression logique, propagée aux autres appareils, annulable |
| `version` | `version` | Dernière version serveur connue (0 = jamais envoyée) ; verrou optimiste |
| — | `server_updated_at` | Horodatage serveur, curseur de réception |

Clé primaire **composite `(owner_id, id)`** ; toutes les clés étrangères sont composites, donc une ligne ne peut
référencer que des lignes du même utilisateur.

## Tables

| Table | Contenu | Contraintes notables |
| --- | --- | --- |
| `profiles` | profil minimal, créé à l'inscription | 1 par utilisateur |
| `app_settings` | nom, mode de synchro, date de début, seuil, facteurs, CA déclarés, paramètres fiscaux | unique par utilisateur |
| `accounts` | comptes et solde déclaré (nullable) | devise EUR, type énuméré |
| `categories` | catégories modifiables | type dépense/revenu/épargne |
| `debts` | crédits, paiements fractionnés, découverts | montants ≥ 0, taux 0–1000 %, compte lié (découvert) |
| `savings_goals` | objectifs | priorité 1–3 |
| `recurring_rules` | factures, abonnements, revenus réguliers, mensualités, virements d'épargne | min ≤ max, fin ≥ début, intervalle 1–366 |
| `transactions` | toutes les opérations (réelles et prévues) | statut compatible avec le type, transfert = 2 comptes distincts, occurrence unique |
| `budgets` | budget par catégorie « à partir de » un mois | unique (catégorie, mois) hors suppressions |
| `debt_payments` | remboursements (capital / intérêts / frais facultatifs) | capital + intérêts + frais ≤ total |

## Tables du cahier des charges non créées (arbitrage)

| Table | Remplacée par |
| --- | --- |
| `bills` | `recurring_rules` (kind `bill`/`subscription`) + transactions prévues `is_bill` |
| `income_expectations` | transactions `income` prévues/confirmées avec `confidence` et `scenario` |
| `savings_contributions` | transferts avec `goal_id` |
| `monthly_snapshots` | recalcul à la volée (aucun cumul stocké) |
| `sync_metadata` | tables locales `outbox`, `conflicts`, `meta` (IndexedDB) |

## Données locales uniquement

- `outbox` : une entrée par enregistrement modifié et non encore envoyé.
- `conflicts` : versions locale et distante en attente de choix.
- `meta` : curseurs de réception, date et erreur de dernière synchronisation.
- `localStorage` : uniquement des préférences de confort (dernier compte utilisé, thème).
