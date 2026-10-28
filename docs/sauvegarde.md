# Sauvegarde et restauration

Les données vivent dans le navigateur (IndexedDB). Le navigateur peut les effacer (nettoyage des données de site,
navigation privée, manque d'espace ; Safari peut purger le stockage d'un site non utilisé pendant plusieurs semaines
s'il n'est pas installé sur l'écran d'accueil). **Exporte régulièrement**, même avec la synchronisation : l'offre
gratuite Supabase n'inclut pas de sauvegarde automatique.

## Exporter

Paramètres → Sauvegarde et restauration → **Exporter mes données**. Un fichier
`pocket-sauvegarde-AAAA-MM-JJ.json` est téléchargé. Il contient toutes les entités (y compris les éléments supprimés
logiquement, pour une restauration fidèle), au format :

```json
{ "format": "pocket-backup", "version": 1, "exportedAt": "…", "appName": "Pocket",
  "data": { "settings": [], "accounts": [], "categories": [], "transactions": [], "recurringRules": [],
            "budgets": [], "debts": [], "debtPayments": [], "savingsGoals": [] } }
```

Format ouvert et lisible : les montants sont en centimes (`amountCents`), les dates en `AAAA-MM-JJ`.

## Restaurer

Paramètres → **Restaurer une sauvegarde…** :

1. Le fichier est validé (format, version, types, montants entiers ≥ 0, dates). Un fichier invalide est refusé
   sans rien modifier.
2. Un résumé (date, nombre d'opérations et de comptes) est affiché ; confirmation obligatoire.
3. Les données de l'appareil sont **remplacées** en une seule transaction (tout ou rien).
4. Si la synchronisation est active, tout est remis en file d'envoi ; un enregistrement modifié entre-temps sur un
   autre appareil donnera un conflit à résoudre (rien n'est écrasé silencieusement).

## Sauvegarde côté serveur (si synchronisé)

Sur l'offre gratuite, pas de sauvegarde automatique. Option : `supabase db dump --data-only -f sauvegarde.sql`
avec la CLI (nécessite le mot de passe de la base, à ne jamais mettre dans l'application).
