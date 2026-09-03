# Sécurité du dashboard Histae

## Modèle de sécurité

Le dashboard est une application d’administration : son exposition doit être plus restrictive que celle du client public. L’API reste l’autorité de sécurité. Les contrôles visuels du dashboard ne remplacent jamais `AdminSessionGuard`.

## Authentification

- passkeys WebAuthn découvrables avec vérification utilisateur obligatoire, sans SSO ni fournisseur externe ;
- vérification systématique de la session et du rôle par `GET /api/admin/auth/session` au chargement ;
- aucun access token ou refresh token administrateur dans `localStorage`, `sessionStorage` ou le JavaScript ;
- session opaque dans un cookie API `HttpOnly; SameSite=Strict`, `Secure` et préfixé `__Host-` en production ;
- expiration inactive de 30 minutes et absolue de 8 heures par défaut, avec révocation serveur ;
- relecture à chaque requête du rôle, du bannissement et de la passkey active ;
- contrôle de l’en-tête `Origin` exact sur toutes les mutations administratives ;
- authentification récente pour ajouter/révoquer une passkey ou révoquer les autres sessions ;
- jeton d’enrôlement initial créé hors bande, hashé, à usage unique et de courte durée.

WebAuthn rend l’authentification résistante au phishing et le cookie `HttpOnly` empêche le JavaScript de lire le
secret de session. Une XSS pourrait toutefois agir au nom d’une session ouverte : CSP, absence de HTML injecté,
contrôle des dépendances, sessions courtes et vérification d’origine restent essentiels.

## Données personnelles

- les numéros de téléphone, leurs empreintes et leur valeur chiffrée ne sont jamais exposés ;
- les coordonnées géographiques précises ne sont pas retournées au dashboard ;
- les consultations de profils, matchs et messages sont inscrites dans `data_access_log` ;
- l’ouverture d’une conversation exige une justification explicite ;
- un admin ne peut pas bannir un autre admin ; un superadmin ne peut ni agir sur lui-même ni bannir un autre superadmin ;
- l’effacement RGPD reste géré par la machine de transitions de l’API.
- la file de réconciliation photo ne reçoit ni clé objet, ni URL signée, ni image ; une relance est validée côté API,
  refuse les photos saines et les workers actifs, puis journalise `admin_reconcile_photo` avec son motif.
- la suppression d’une question de profil annonce le nombre de réponses concernées et exige une confirmation ;
  l’autorisation et la cascade définitive restent imposées transactionnellement par l’API et PostgreSQL.
- la liste de modération ne reçoit aucun texte, image, URL ou clé objet. L’ouverture d’un détail exige un motif et
  journalise `view_moderation_content`; la décision motivée journalise `admin_review_content`.
- une photo détaillée utilise uniquement une URL signée courte. La revue impose les trois contrôles visage,
  netteté et contenu autorisé, et la version optimiste évite d’écraser une décision concurrente.

## En-têtes attendus en production

Le serveur frontal doit au minimum envoyer :

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
Cache-Control: no-store
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

L’API doit être montée sous `/api` sur la même origine que le dashboard. En développement, l’unique exception de
transport est le proxy Vite : le navigateur reste sur `http://localhost:5173` tandis que Vite relaie vers
`http://localhost:8080`. En production, l’origine WebAuthn doit être HTTPS.

## Dépendances

Audit effectué le 20 août 2026 avec `pnpm audit --prod` : aucune vulnérabilité connue après mise à niveau d’Axios et React Router et verrouillage de `yaml@1.10.3`.

Le lockfile pnpm est obligatoire. Le seul script d’installation de dépendance explicitement autorisé est celui d’`esbuild`, via `pnpm-workspace.yaml`.

## Limites opérationnelles

- réserver l’accès réseau du dashboard à un VPN, une passerelle Zero Trust ou une liste d’adresses d’entreprise ;
- imposer deux passkeys par administrateur, dont idéalement une clé physique conservée séparément ;
- documenter et contrôler la procédure hors bande de récupération et de nouvel enrôlement ;
- surveiller les événements `admin_ban`, `admin_unban`, `admin_reconcile_photo`, `view_moderation_content`,
  `admin_review_content`, `view_messages` et les volumes de consultation ;
- définir une politique de rotation et de révocation des comptes administrateur ;
- tester régulièrement la restauration, la rétention des logs et les droits superadmin ;
- ne jamais publier de source maps de production contenant des informations internes.

Les vulnérabilités doivent être signalées de manière privée aux mainteneurs du projet, sans ouvrir de ticket public contenant des données ou secrets exploitables.
