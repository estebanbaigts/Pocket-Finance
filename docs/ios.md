# Application iPhone (Capacitor)

L'app iOS est une coque native (Capacitor 7) autour du même code que la version web : mêmes écrans, mêmes calculs,
mêmes tests. Les fichiers sont embarqués dans l'app : elle fonctionne hors ligne sans serveur.

## Ce qu'elle ajoute

- **Face ID** (repli sur le code) : Réglages → Sur cet iPhone. Jamais activable si Face ID/code n'est pas configuré,
  pour ne pas se retrouver bloqué.
- **Rappels d'échéances** : la veille à 9 h (factures, récurrences, mensualités des 30 prochains jours), montants
  masqués par défaut.
- **Connexion** : le lien de l'e-mail rouvre l'app (`com.estebanbaigts.pocket://login`).
- Retour haptique, icône et écran de démarrage, stockage non effacé par Safari.

## Compiler et lancer

Prérequis : Xcode (testé avec 27.1), Node 20.

```bash
npm run ios:sync   # build web + copie dans le projet iOS
npm run ios:open   # ouvre Xcode
```

Dans Xcode : choisis un simulateur ou ton iPhone, puis ▶︎.

### Sur ton iPhone

- **Gratuit** : Xcode → Signing & Capabilities → Team = ton identifiant Apple. L'app expire au bout de 7 jours
  (relancer depuis Xcode). Active le mode développeur sur l'iPhone (Réglages → Confidentialité et sécurité).
- **Apple Developer Program (99 €/an)** : TestFlight, pas d'expiration, App Store possible.

## Notes techniques

- Capacitor 7 (et non 8, qui exige Node 22) ; Swift Package Manager, sans CocoaPods.
- Cible minimale iOS 15 (Xcode 27 refuse iOS 14).
- Langue de développement : français (boîtes de dialogue système en français).
