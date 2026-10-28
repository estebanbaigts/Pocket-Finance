# Déploiement (facultatif)

Pour installer l'application sur iPhone, elle doit être servie en **HTTPS**. Le build est un site statique (`dist/`).

```bash
npm run build
```

Hébergeurs statiques avec offre gratuite (conditions susceptibles d'évoluer, aucune gratuité permanente garantie) :
Cloudflare Pages, Netlify, Vercel, GitHub Pages. Réglages : commande `npm run build`, dossier `dist`, Node 20.
Les variables `VITE_*` doivent être définies **au moment du build** chez l'hébergeur.

Le routage utilise le fragment d'URL (`#/…`) : aucune règle de réécriture n'est nécessaire.

## En-têtes recommandés

À ajouter chez l'hébergeur (ex. fichier `_headers` sur Cloudflare Pages / Netlify) :

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/sw.js
  Cache-Control: no-cache
```

`sw.js` ne doit pas être mis en cache longtemps, sinon les mises à jour tardent à arriver.

## Tester le hors ligne

1. `npm run build && npm run preview`, ouvre <http://localhost:4173>, attends quelques secondes (installation du
   service worker : DevTools → Application → Service Workers = *activated*).
2. DevTools → Network → **Offline** (ou arrête le serveur), recharge : l'application et tes données s'affichent.

> Vérifié pendant le développement : le service worker s'active et met en cache les 27 fichiers du build. Le
> rechargement hors ligne n'a **pas** pu être confirmé dans le navigateur intégré utilisé pour les tests (il
> contourne le service worker pour les sous-ressources) ; fais ce test une fois dans Safari ou Chrome.
