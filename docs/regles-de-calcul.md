# Règles de calcul

Toutes ces règles sont implémentées dans `src/domain/` et couvertes par des tests (`tests/unit`).

## Montants

- Stockés en **centimes entiers** (`amountCents ≥ 0`). Le sens (entrée/sortie) vient du type d'opération.
- Saisie française acceptée : `53,48`, `53.48`, `1 234,5`, `900 €`. Plus de deux décimales = invalide.
- **Arrondi unique** (`roundHalfUp`) : au centime le plus proche, demi-centime arrondi vers le haut en valeur absolue.
- Facteurs exprimés en pour mille (1 150 = × 1,15) pour éviter les flottants non maîtrisés.
- Contribution minimale (épargne) : division arrondie au centime **supérieur**.

## Dates

- Dates calendaires `AAAA-MM-JJ`, sans heure ni fuseau : un changement d'heure ne décale jamais une opération.
- La date du jour est calculée dans le fuseau de l'appareil (jamais via `toISOString()`, qui est en UTC).
- Ajout de mois : jour d'ancrage conservé et ramené au dernier jour si besoin (31 janv. → 28/29 févr. → 31 mars).

## Statuts

| Statut | Effet sur le solde constaté | Effet sur les projections |
| --- | --- | --- |
| Prévu | aucun | inclus (revenus : selon scénario) |
| Confirmé | aucun | inclus (revenus : dès le scénario prudent par défaut) |
| Encaissé (revenu) / Payé (dépense) / Effectué (transfert) | **oui** | — (déjà dans le solde) |
| Annulé | aucun | aucun |

Statuts autorisés : revenu = prévu, confirmé, encaissé, annulé ; dépense = prévu, confirmé, payé, annulé ;
transfert = prévu, effectué, annulé. Transitions : voir `src/domain/model/status.ts` (un règlement peut être corrigé
vers « confirmé »/« prévu » ; un annulé ne peut que redevenir « prévu »). Les mêmes contraintes existent en SQL.

## Soldes

- **Solde calculé** = solde déclaré à la date d'ouverture (début de journée) + opérations **réglées** datées de ce jour ou après.
- Solde déclaré inconnu ⇒ solde **inconnu** (on affiche seulement les mouvements). Aucun solde n'est inventé.
- **Transfert** : − sur le compte source, + sur le compte destination ⇒ effet nul sur le total, jamais compté comme revenu ou dépense.
- Total = somme des comptes suivis au solde connu ; les comptes au solde inconnu sont listés à part.
- Une opération réglée **avant** la date du solde déclaré est considérée comme déjà incluse dans ce solde. C'est pourquoi,
  pour une échéance en retard, l'application demande si elle a été réglée à la date prévue ou aujourd'hui.

## Récurrence

- Fréquences : mensuelle, hebdomadaire, annuelle, tous les N jours ; fin facultative ou nombre d'échéances.
- Chaque occurrence a une clé `règle:date` et un identifiant dérivé de cette clé ⇒ **jamais de doublon**, même après
  plusieurs ouvertures, plusieurs appareils, suppression ou rapprochement de l'occurrence.
- Génération jusqu'à la fin du mois suivant, à partir du 1er du mois de début du suivi.
- **Jour inconnu** : occurrence placée en fin de mois, marquée « date estimée » (« avant le 31 »).
- **Calendrier inconnu** (ex. PS5) : la règle n'est pas projetée et apparaît dans « Ce qui n'est pas encore projeté ».
- Échéance dont la date est passée et toujours « prévue » : signalée **« à actualiser »**, jamais supposée impayée ni payée.

## Doublons et rapprochement

Doublon probable : même type, même montant, même compte, dates à ± 4 jours, l'une prévue et l'autre réglée.
Le rapprochement transfère le lien (règle, occurrence, dette, catégorie) vers l'opération réglée et supprime la prévue :
la dépense n'est comptée qu'une fois.

## Budgets

- Budget effectif d'un mois = dernière ligne de la catégorie dont `fromMonth ≤ mois`. Modifier « à partir de » un mois
  ne change jamais les mois précédents.
- Consommé = dépenses **payées** de la catégorie ; « prévu » affiché à part ; annulées exclues.
- Report : seul le reliquat **positif** du mois précédent est reporté (chaîne limitée à 12 mois).
- L'épargne n'est pas budgétée comme une dépense (c'est un transfert).

## Dettes

- Capital restant = capital déclaré − part capital des remboursements postérieurs à la déclaration ; si capital et
  intérêts ne sont pas distingués, le total est utilisé et le résultat est marqué « approximatif ».
- Un remboursement = **une** sortie d'argent (transaction, catégorie Crédits) liée à la dette ⇒ pas de double comptage.
- Un découvert lié à un compte n'est pas ajouté au total des dettes : il est déjà dans le solde négatif du compte.
- Intérêts mensuels = capital × taux annuel / 12, arrondis au centime. Taux inconnu ⇒ simulé à 0 % avec avertissement ;
  les économies ne sont alors pas chiffrées. Les frais de remboursement anticipé ne sont jamais supposés.

## Prévisions de fin de mois

Pour chaque scénario :

```
fin de mois = soldes connus aujourd'hui
            + revenus en attente inclus dans le scénario (jusqu'à la fin du mois)
            − dépenses et transferts sortants en attente (jusqu'à la fin du mois, retards compris)
            − dépenses courantes restantes estimées × facteur du scénario
```

| | Prudent | Réaliste | Favorable |
| --- | --- | --- | --- |
| Revenus | confirmés (ou forcés « prudent ») | + prévus à confiance élevée | tous |
| Montant variable (80–100 €) | borne haute | milieu | borne basse |
| Dépenses courantes (défaut) | × 1,15 | × 1,00 | × 0,90 |

Aucune probabilité n'est appliquée : un revenu est inclus entièrement ou pas du tout. Le scénario d'un revenu peut être
choisi manuellement.

**Dépenses courantes estimées** (dépenses hors factures, récurrences et dettes, dans les catégories non fixes) : valeur
saisie dans les hypothèses ; sinon moyenne des 3 derniers mois disposant de données ; sinon somme des budgets des
catégories variables ; sinon 0 (signalé). On en retire ce qui est déjà dépensé ce mois.

**Capacité de dépense** : scénario prudent **sans** les dépenses courantes estimées, en retenant le minimum entre le solde
de fin de mois et le point le plus bas du mois (une facture peut tomber avant un revenu), moins le seuil de sécurité.
Par jour = ce montant / jours restants (arrondi inférieur) ; semaine = par jour × min(7, jours restants).
**Épargne possible** = fin de mois prudente (dépenses courantes incluses) − seuil.

Sans aucun solde connu, l'interface affiche la **variation** prévue et non un solde de fin de mois.

## Chiffre d'affaires

Le chiffre d'affaires déclaré (ex. 3 360 € en octobre, avant prélèvements) est conservé à part. Il n'est jamais utilisé
comme trésorerie. Revenus facturés (référence de facture) et revenus reçus sont comparés séparément.
