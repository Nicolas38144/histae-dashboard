# Histae Dashboard

Console React d’administration, de modération et d’exploitation de Histae. Elle consomme le contrat HTTP de
`histae-api` v3 ; l’API reste l’unique autorité pour les rôles, les autorisations, les transactions et l’audit.

## Démarrage local

Prérequis : Node.js 22 ou supérieur, pnpm 11.22.0, l’API locale configurée et un navigateur compatible WebAuthn.

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

Ouvrir exactement `http://localhost:5173`. Le RP ID WebAuthn local est `localhost` : utiliser `127.0.0.1` dans le
navigateur ferait échouer les cérémonies. Vite relaie `/api` vers `VITE_API_PROXY_TARGET`, par défaut
`http://localhost:8080`.

La première passkey nécessite un compte `admin` ou `superadmin` et un jeton à usage unique généré depuis le dépôt
API :

```powershell
# À exécuter depuis le dépôt histae-api
pnpm run admin:webauthn:bootstrap -- <uuid-du-compte-admin>
```

Le jeton est saisi dans « Enregistrer la première passkey ». Le dashboard ne le persiste pas et ne reçoit jamais le
secret de session, conservé dans un cookie API `HttpOnly`.

## Configuration

| Variable | Usage local |
| --- | --- |
| `VITE_ENV` | Nom de l’environnement affichable au build |
| `VITE_API_URL` | Préfixe appelé par le navigateur, normalement `/api` |
| `VITE_API_PROXY_TARGET` | Origine de l’API derrière le proxy Vite |

Copier `.env.example` vers `.env.development` si nécessaire. Aucune variable `VITE_*` ne doit contenir un secret :
ces valeurs sont intégrées au JavaScript livré au navigateur.

## Commandes

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run check
pnpm run test:unit
pnpm run test:e2e
pnpm test
pnpm run validate
pnpm run security:audit
```

- `check` exécute typecheck, lint et build de production ;
- `test:unit` exécute Vitest, Testing Library et MSW sans API réelle ;
- `test:e2e` exécute les parcours Chromium isolés, dont WebAuthn virtuel ;
- `test:e2e:real` vérifie en lecture seule une API locale lorsque `HISTAE_REAL_API_URL` est défini ;
- `validate` regroupe le contrôle statique, le build et tous les tests autonomes.

Les détails d’isolation et d’installation du navigateur sont dans [test.md](test.md).

## Production

Servir le dashboard et `/api` sous la même origine HTTPS. Cette origine doit correspondre exactement à
`ADMIN_WEBAUTHN_ORIGIN` et son hôte à `ADMIN_WEBAUTHN_RP_ID`. Le serveur frontal doit appliquer les en-têtes de
[SECURITY.md](SECURITY.md), ne publier aucune source map et renvoyer les routes SPA vers `index.html`.

## Documentation

- [resume.md](resume.md) : architecture et capacités actuellement livrées ;
- [test.md](test.md) : stratégie, commandes et isolation des tests ;
- [SECURITY.md](SECURITY.md) : modèle de sécurité et checklist de déploiement ;
- [roadmap.md](roadmap.md) : travaux encore ouverts uniquement ;
- [`histae-api/routes.md`](../histae-api/routes.md) : contrat HTTP de référence.
