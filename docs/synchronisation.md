# Synchronisation (facultative)

Sans configuration, l'application est **entièrement locale**. Rien n'est envoyé nulle part.

> État : le moteur de synchronisation est testé contre un serveur en mémoire qui reproduit les règles SQL, et les
> migrations/RLS sont testées sur PostgreSQL 15. **La connexion à un vrai projet Supabase n'a pas été testée** (aucun
> projet n'était disponible pendant le développement). Fais le test décrit en fin de page avant de t'y fier.

## Mise en place (≈ 15 minutes, gratuit)

1. Crée un compte sur <https://supabase.com> puis un projet (région UE, par ex. Paris ou Francfort).
2. **Appliquer les migrations** — au choix :
   - Tableau de bord → *SQL Editor* → exécute, dans l'ordre, le contenu de
     `db/migrations/20261028000001_schema.sql` puis `db/migrations/20261028000002_rls.sql` ;
   - ou avec la CLI : `supabase link --project-ref <ref>` puis `supabase db push` (le dossier `supabase/migrations`
     pointe vers `db/migrations`).
3. *Authentication → URL Configuration* : mets l'URL de ton application dans **Site URL** et ajoute-la aux
   **Redirect URLs** (ex. `https://pocket.example.pages.dev` et `http://localhost:5173` pour le développement).
4. *Project Settings → API* : copie **Project URL** et la clé **anon / publishable**.
5. Crée `.env.local` (ignoré par git) :

   ```bash
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   Ne mets **jamais** la clé `service_role` / secret dans ce fichier : tout ce qui commence par `VITE_` finit dans le
   navigateur. La clé publique est faite pour ça ; la sécurité repose sur RLS.
6. Relance `npm run dev` (ou reconstruis), puis Paramètres → Synchronisation → active, saisis ton e-mail, ouvre le lien.

## Fonctionnement

- **File d'attente** : chaque écriture locale ajoute (dans la même transaction) une entrée dans `outbox`.
- **Cycle** : réception des changements distants (curseur `server_updated_at`), puis envoi. Déclenché à l'ouverture,
  au retour du réseau, 1,5 s après une modification, et toutes les 60 s (délai croissant après erreurs, max 5 min).
- **Verrou optimiste** : un envoi met à jour la ligne seulement si sa `version` est celle sur laquelle reposait la
  modification ; le serveur passe à `version + 1` (trigger). Sinon → **conflit**.
- **Conflits** : jamais d'écrasement silencieux. Les deux versions sont gardées ; Paramètres → Synchronisation affiche
  les champs différents et propose « Garder ma version » / « Garder celle de l'autre appareil ». Si les contenus sont
  identiques, il n'y a pas de conflit.
- **Doublons** : identifiants générés par l'appareil ; occurrences récurrentes et catégories par défaut ont un
  identifiant déterministe ⇒ deux appareils produisent la même ligne, pas deux.
- **Suppressions** : logiques (`deleted_at`), donc propagées.
- **Paramètres** : un seul jeu par compte ; au premier appareil connecté, ses paramètres deviennent ceux du compte.
- **États affichés** : Données locales, Synchronisé, En attente, Erreur, Conflit, Hors ligne + date de dernière synchro.

## Offre gratuite Supabase (vérifiée le 28/10/2026 sur supabase.com/pricing)

| Limite | Free |
| --- | --- |
| Base de données | 500 Mo par projet |
| Utilisateurs actifs | 50 000 / mois |
| Trafic sortant | 5 Go (+ 5 Go en cache) |
| Stockage de fichiers | 1 Go |
| Projets actifs | 2 |
| **Mise en pause** | **après 1 semaine d'inactivité** |
| Sauvegardes automatiques | **non incluses** |

Conséquences : un usage personnel tient très largement dans 500 Mo (des dizaines de milliers d'opérations).
Mais un projet inutilisé une semaine est mis en pause (réactivation manuelle depuis le tableau de bord), et il n'y a
pas de sauvegarde côté serveur : **exporte régulièrement** (voir [sauvegarde](sauvegarde.md)). Les conditions peuvent
changer ; rien ne garantit une gratuité permanente. Si le projet est en pause ou le quota atteint, l'application continue
de fonctionner en local et les modifications restent en file.

## Tester la synchronisation réelle

1. Appareil A : active la synchro, connecte-toi, ajoute une dépense → l'état passe à « Synchronisé ».
2. Supabase → Table Editor → `transactions` : la ligne existe avec ton `owner_id`, `version = 1`.
3. Appareil B : connecte-toi avec le même e-mail → la dépense apparaît.
4. Coupe le réseau sur A, modifie la dépense ; modifie-la aussi sur B ; rétablis le réseau sur A → un conflit est proposé.
5. Avec un **second compte**, vérifie dans l'éditeur SQL que `select count(*) from transactions` renvoie 0.
