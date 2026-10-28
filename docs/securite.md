# Sécurité et confidentialité

## Ce qui est en place

- **Aucun secret dans le client** : seules l'URL Supabase et la clé publique (anon) sont lues, et seulement si
  configurées. `.env*` est ignoré par git ; `.env.example` ne contient aucune valeur.
- **Row Level Security forcée** sur toutes les tables privées : lecture, insertion, modification et suppression
  limitées à `owner_id = auth.uid()`. Aucun droit pour le rôle `anon`. Aucune politique globale.
- **Propriétaire imposé côté serveur** : un trigger remplace `owner_id` par `auth.uid()` à l'insertion et interdit
  sa modification ; impossible d'écrire « au nom » d'un autre utilisateur.
- **Clés étrangères composites** `(owner_id, …)` : impossible de rattacher une opération au compte d'autrui.
- **Validation serveur** : contraintes `CHECK` (montants ≥ 0 en centimes, statuts compatibles, transferts entre deux
  comptes distincts, longueurs maximales, formats de mois), unicités, verrou de version.
- **Validation client** : Zod sur les formulaires et sur les fichiers de sauvegarde avant toute écriture.
- **Authentification sans mot de passe** : lien magique e-mail, flux PKCE.
- **Effacement** : Paramètres → effacer les données de l'appareil (IndexedDB) et, si connecté, `delete_my_data()`
  (fonction `SECURITY INVOKER`, donc elle-même soumise à RLS).
- **Journalisation** : les erreurs de synchronisation enregistrent seulement un type/code d'erreur, jamais de montant,
  de libellé ni de contenu d'opération.
- **Aucune collecte** : ni mesure d'audience, ni traceur, ni police ou script tiers chargé à l'exécution
  (polices système). `referrer` désactivé.
- **Service worker** : ne met en cache que l'interface (HTML/JS/CSS), jamais de données financières.

Tests : `npm run test:db` exécute 7 scénarios (isolation lecture/écriture/suppression entre deux utilisateurs,
usurpation de propriétaire, référence croisée, accès anonyme refusé, verrou de version, contraintes, effacement ciblé).

## Ce qui n'est pas fait (à ne pas surestimer)

- **Pas de chiffrement de bout en bout.** Chez Supabase, les données sont chiffrées en transit (HTTPS) et au repos
  par l'hébergeur, mais lisibles par celui-ci et par quiconque obtiendrait la clé `service_role`.
- **Stockage local en clair** : IndexedDB n'est pas chiffré. Sur un appareil partagé, toute personne ayant accès à
  la session du navigateur peut lire les données. Utilise un profil/compte système personnel et le verrouillage de
  l'appareil. « Effacer les données de cet appareil » avant de prêter ou céder un appareil.
- **Fichiers de sauvegarde en clair** (JSON) : à ranger dans un endroit sûr.
- **Session Supabase** conservée dans le `localStorage` du navigateur (comportement standard du SDK).
- **Pièces jointes** : seul un nom de fichier est prévu dans le modèle ; aucun téléversement n'est implémenté.
- Pas d'en-têtes CSP fournis : à configurer chez l'hébergeur (voir [déploiement](deploiement.md)).
