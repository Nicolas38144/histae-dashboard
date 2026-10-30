# Sécurité du dashboard Histae

## Modèle de confiance

Le dashboard manipule des fonctions administratives et doit être moins exposé que l’application publique. L’API
reste l’autorité : les extracteurs de session Rust, les DTO, les transactions et l’audit serveur doivent refuser une action même
si le navigateur est compromis ou modifié.

Une restriction réseau, un tunnel ou Cloudflare réduit l’exposition, mais ne remplace jamais l’authentification et
l’autorisation applicatives.

## Authentification et session

- WebAuthn natif avec credential découvrable et vérification utilisateur obligatoire ;
- origine et RP ID exacts, sans mot de passe de secours ni SSO ;
- session opaque hashée côté API et cookie `HttpOnly; SameSite=Strict` ;
- cookie `Secure` préfixé `__Host-` dès que l’origine WebAuthn est en HTTPS, y compris en dev ;
- relecture serveur du rôle, du bannissement, des expirations et de la passkey active ;
- vérification exacte de `Origin` pour les mutations ;
- authentification récente pour la gestion des passkeys et les opérations sensibles ;
- bootstrap initial hors bande, court, hashé et à usage unique.

Le JavaScript ne doit jamais recevoir ni stocker le secret de session. Une XSS pourrait néanmoins agir avec une
session ouverte : CSP, dépendances maîtrisées, sessions courtes et validation serveur restent indispensables.

La console revalide la session toutes les 60 secondes et au retour sur l’onglet, au focus et à la restauration
d’une page. Elle retire les écrans privés et vide le cache de prénoms en arrière-plan ; les données sont relues
après confirmation serveur. Les formulaires non enregistrés sont donc perdus lors de ce verrouillage.
Une vérification échouée, y compris une panne réseau, ferme l’affichage. Les réponses antérieures et les
requêtes annulées ne peuvent pas le réactiver. Après 15 minutes sans interaction, la console revient à la connexion.
Le verrou local reste en mémoire jusqu’à une nouvelle authentification WebAuthn ; il ne constitue pas une
révocation du cookie serveur et ne survit pas au rechargement complet du document.

Une déconnexion demandée retire immédiatement l’affichage, avant la réponse API. La connexion reste désactivée
pendant la requête de révocation. Si celle-ci échoue, l’écran de connexion affiche un avertissement persistant
et permet de réessayer ; le cookie `HttpOnly` peut encore être valide et doit être révoqué par l’API.
Le délai de détection d’une révocation distante reste borné par la relecture périodique lorsque le navigateur
exécute ses timers ; les timers peuvent être suspendus en arrière-plan ou pendant la veille.

## Minimisation des données

Ne jamais exposer au dashboard :

- téléphone, empreinte ou valeur chiffrée ;
- latitude et longitude précises ;
- clé objet, URL photo durable ou image dans une collection administrative ;
- payload, Customer ID ou moyen de paiement Stripe ;
- token/hash de session, clé publique complète ou secret WebAuthn.

Les consultations de profils, matchs, conversations et contenus sont auditées par l’API. Le motif est
obligatoire pour un admin et facultatif pour le superadmin, avec un libellé serveur par défaut. La liste de
modération reste sans contenu ; les photos signées de courte durée sont accessibles uniquement dans les détails autorisés et audités.
Les décisions utilisent une version optimiste et les mêmes règles de motif selon le rôle.

La lecture administrative des messages exige un signalement conservé lié au match exact et à ses
deux participants, sans exception superadmin. Un signalement de profil ou concernant un autre match
ne suffit pas. La liste administrative expose `can_view_messages` ; absent ou faux, il interdit
l’ouverture dans le dashboard. L’API revérifie la règle à chaque page, avant de lire les messages
ou d’inscrire les deux consultations dans l’audit. Un match absent ou non signalé retourne `404`.
Les champs d’autorisation ne sont pas ajoutés aux réponses mobiles.

Seules les préférences `histae_theme` et `histae_locale` sont persistées dans le navigateur. Le nettoyage des
anciens jetons tolère un refus d’accès au stockage navigateur. Le cache de prénoms en mémoire est vidé
au chargement d’une nouvelle session et lors de son invalidation. Une vérification antérieure ne peut pas
réactiver une session invalidée dans la même séquence de réponses. Les tests empêchent la réintroduction d’un token dans
`localStorage` ou `sessionStorage` et l’usage de `console.*` dans les sources applicatives.

Les exports du journal d’accès sont limités à 5 000 entrées, 5 Mio de CSV UTF-8 (échappement compris),
100 pages et 60 secondes. Une limite atteinte refuse l’export complet, sans fichier partiel. Le téléchargement
est annulé lors d’une sortie de l’écran, d’un verrouillage ou sur demande. Les protections contre les formules
CSV sont conservées. Le contrat actuel ne permet pas de filtrer ces journaux par période : les historiques
plus volumineux nécessitent un export serveur autorisé, audité et borné avant d’ajouter cette fonction à l’interface.

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
`http://localhost:8080` pour l’API. Le navigateur peut aussi charger une URL photo signée depuis
`http://storage.histae.localhost:8333` (ou l’ancien endpoint loopback `127.0.0.1:8333`), tous deux explicitement
bornés par la CSP Vite. Ces exceptions HTTP locales ne doivent pas être reproduites en production.

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
