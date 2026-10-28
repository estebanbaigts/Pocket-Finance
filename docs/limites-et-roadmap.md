# Limites connues et feuille de route

## Limites connues

- **Synchronisation non testée contre un vrai projet Supabase** : moteur testé sur serveur simulé, SQL/RLS testés sur
  PostgreSQL 15. Suivre la procédure de test de [synchronisation](synchronisation.md).
- **Hors ligne** : service worker installé et cache vérifiés ; rechargement hors ligne à confirmer dans un vrai
  navigateur (voir [déploiement](deploiement.md)).
- **Conflits** : résolution au niveau de l'enregistrement entier (pas de fusion champ par champ).
- **Pièces jointes** : champ prévu dans le modèle, aucun téléversement.
- **Devise unique** : euro seulement.
- **Modification d'une règle récurrente** : ne modifie pas les occurrences déjà générées (choix volontaire : les
  échéances passées restent fidèles) ; les occurrences futures déjà générées doivent être ajustées une à une.
- **Paramètres fiscaux** : saisis et suivis (source, date, statut), mais pas encore utilisés pour calculer un net
  à partir du chiffre d'affaires.
- **Courbe des prévisions** : limitée au mois en cours.
- **Pas de tests de bout en bout automatisés** (parcours vérifiés manuellement).
- **Session de connexion** conservée dans le navigateur ; pas de verrouillage par code dans l'application.

## Feuille de route

1. Tester et finaliser la synchronisation sur un projet Supabase réel ; tests Playwright des parcours.
2. Calcul du net à partir du CA déclaré et des paramètres fiscaux confirmés (réserve fiscale automatique).
3. Projection sur 3 à 12 mois, scénario « baisse de revenu » et « dépense imprévue » paramétrables.
4. Édition d'une règle « pour les occurrences futures ».
5. Import CSV de relevés bancaires (sans connexion bancaire) avec rapprochement assisté.
6. Verrouillage local facultatif (code / Face ID via WebAuthn) et chiffrement local optionnel.
7. Pièces jointes stockées localement (et dans Supabase Storage si synchronisé).
8. Couche de langage naturel facultative, jamais source de vérité des chiffres.
