# Sécurité du dashboard Histae

## Modèle de sécurité

Le dashboard est une application d’administration : son exposition doit être plus restrictive que celle du client public. L’API reste l’autorité de sécurité. Les contrôles visuels du dashboard ne remplacent jamais `JwtActiveGuard` et `AdminGuard`.

## Authentification

- connexion OTP avec les routes publiques de l’API ;
- vérification systématique du rôle par `GET /api/admin/me` après connexion et au rechargement ;
- access token et refresh token conservés dans `sessionStorage`, jamais dans `localStorage` ;
- rotation automatique du refresh token sur une réponse `401` ;
- une seule rotation concurrente, les requêtes en attente étant rejouées ensuite ;
- suppression locale inconditionnelle des tokens à la déconnexion ou à l’expiration ;
- bannissement côté API avec vérification à chaque requête et révocation de tous les refresh tokens.

Cette architecture limite la persistance d’un vol de token, mais une application web ne peut pas protéger un token contre une XSS exécutée dans sa propre origine. La CSP, l’absence de HTML injecté et la maîtrise des dépendances restent donc essentielles.

## Données personnelles

- les numéros de téléphone, leurs empreintes et leur valeur chiffrée ne sont jamais exposés ;
- les coordonnées géographiques précises ne sont pas retournées au dashboard ;
- les consultations de profils, matchs et messages sont inscrites dans `data_access_log` ;
- l’ouverture d’une conversation exige une justification explicite ;
- un admin ne peut pas bannir un autre admin ; un superadmin ne peut ni agir sur lui-même ni bannir un autre superadmin ;
- l’effacement RGPD reste géré par la machine de transitions de l’API.

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

Si l’API se trouve sur une origine séparée, cette origine HTTPS doit être ajoutée à `connect-src` et l’origine du dashboard doit être ajoutée à `CORS_ORIGINS` côté API.

## Dépendances

Audit effectué le 20 août 2026 avec `pnpm audit --prod` : aucune vulnérabilité connue après mise à niveau d’Axios et React Router et verrouillage de `yaml@1.10.3`.

Le lockfile pnpm est obligatoire. Le seul script d’installation de dépendance explicitement autorisé est celui d’`esbuild`, via `pnpm-workspace.yaml`.

## Limites opérationnelles

- réserver l’accès réseau du dashboard à un VPN, une passerelle Zero Trust ou une liste d’adresses d’entreprise ;
- protéger l’hébergement par une authentification supplémentaire si l’infrastructure le permet ;
- surveiller les événements `admin_ban`, `admin_unban`, `view_messages` et les volumes de consultation ;
- définir une politique de rotation et de révocation des comptes administrateur ;
- tester régulièrement la restauration, la rétention des logs et les droits superadmin ;
- ne jamais publier de source maps de production contenant des informations internes.

Les vulnérabilités doivent être signalées de manière privée aux mainteneurs du projet, sans ouvrir de ticket public contenant des données ou secrets exploitables.

