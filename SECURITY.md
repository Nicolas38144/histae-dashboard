# Sécurité du dashboard Histae

## Modèle de confiance

Le dashboard manipule des fonctions administratives et doit être moins exposé que l’application publique. L’API
reste l’autorité : `AdminSessionGuard`, les DTO, les transactions et l’audit serveur doivent refuser une action même
si le navigateur est compromis ou modifié.

Une restriction réseau, un tunnel ou Cloudflare réduit l’exposition, mais ne remplace jamais l’authentification et
l’autorisation applicatives.

## Authentification et session

- WebAuthn natif avec credential découvrable et vérification utilisateur obligatoire ;
- origine et RP ID exacts, sans mot de passe de secours ni SSO ;
- session opaque hashée côté API et cookie `HttpOnly; SameSite=Strict` ;
- cookie `Secure` préfixé `__Host-` en production ;
- relecture serveur du rôle, du bannissement, des expirations et de la passkey active ;
- vérification exacte de `Origin` pour les mutations ;
- authentification récente pour la gestion des passkeys et les opérations sensibles ;
- bootstrap initial hors bande, court, hashé et à usage unique.

Le JavaScript ne doit jamais recevoir ni stocker le secret de session. Une XSS pourrait néanmoins agir avec une
session ouverte : CSP, dépendances maîtrisées, sessions courtes et validation serveur restent indispensables.

## Minimisation des données

Ne jamais exposer au dashboard :

- téléphone, empreinte ou valeur chiffrée ;
- latitude et longitude précises ;
- clé objet, URL photo durable ou image dans une collection administrative ;
- payload, Customer ID ou moyen de paiement Stripe ;
- token/hash de session, clé publique complète ou secret WebAuthn.

Les consultations de profils, matchs, conversations et contenus sont motivées et auditées par l’API. La liste de
modération reste sans contenu ; une URL photo signée courte n’est produite qu’après ouverture justifiée du détail.
Les décisions utilisent un motif et une version optimiste.

Le navigateur ne conserve que la préférence `histae_theme`. Les tests empêchent la réintroduction d’un token dans
`localStorage` ou `sessionStorage` et l’usage de `console.*` dans les sources applicatives.

## En-têtes de production

Le serveur qui distribue le build doit envoyer au minimum :

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
Cache-Control: no-store
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

Le dashboard et `/api` doivent partager la même origine HTTPS. Les routes SPA retournent `index.html`, mais aucun
fichier inconnu, source map ou fichier d’environnement ne doit être publié. Les erreurs et redirections doivent
également recevoir les en-têtes applicables.

En développement, le navigateur reste sur `http://localhost:5173`; seul Vite contacte
`http://localhost:8080`. Cette exception locale ne doit pas être reproduite en production.

## Dépendances et chaîne de construction

- pnpm et `pnpm-lock.yaml` sont obligatoires ; ne pas créer de `package-lock.json` ;
- les scripts d’installation autorisés sont déclarés dans `pnpm-workspace.yaml` ; `msw` est uniquement une
  dépendance de test ;
- `pnpm run security:audit` contrôle les dépendances de production ;
- le build de production n’émet pas de source map ;
- aucune variable `VITE_*` ne doit contenir un secret ;
- une mise à jour de dépendance sensible doit être suivie de `pnpm run validate` et de l’audit.

Les audits de dépendances ne couvrent ni l’infrastructure, ni une compromission de compte, ni les erreurs métier et
ne remplacent pas un pentest.

## Vérifications avant déploiement

- URL HTTPS, certificat, redirections, origine et RP ID vérifiés sur la cible ;
- cookie réellement `__Host-`, `Secure`, `HttpOnly` et `SameSite=Strict` ;
- en-têtes contrôlés sur HTML, actifs, erreurs et redirections ;
- accès réseau restreint selon la politique retenue ;
- au moins deux passkeys distinctes par administrateur et procédure de récupération testée ;
- rôle révoqué et passkey compromise invalidant immédiatement les sessions ;
- build inspecté sans source map, secret, URL interne ou fichier local ;
- `pnpm run validate` et smoke test réel exécutés contre l’environnement cible ;
- procédures de déploiement, retour arrière et révocation urgente répétées.

## Signalement et incident

Une vulnérabilité doit être signalée en privé aux mainteneurs, sans ticket public contenant un secret ou une donnée
personnelle. En cas de compromission : restreindre l’accès, révoquer passkeys et sessions côté API, préserver les
audits utiles, corriger la cause puis vérifier la restauration avant réouverture.
