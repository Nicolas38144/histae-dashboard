# Tests du dashboard Histae

## Niveaux de validation

| Niveau | Outil | Infrastructure |
| --- | --- | --- |
| Unitaire et composant | Vitest, Testing Library, jsdom | aucune |
| Contrat HTTP simulé | MSW | aucune ; les requêtes Axios sont interceptées |
| Parcours navigateur | Playwright Chromium | serveur Vite lancé automatiquement, API simulée |
| Smoke réel | Playwright request | API et stockages locaux configurés |

Les fixtures utilisent uniquement des UUID déterministes et du contenu fictif. Elles ne doivent contenir ni compte,
token, téléphone, photo ni texte de modération provenant d’un environnement réel.

## Installation

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

Le navigateur Playwright est nécessaire uniquement aux tests E2E. `msw` et le navigateur sont des dépendances de
développement ; aucun serveur de test n’est ajouté au build de production.

## Commandes autonomes

```powershell
pnpm run test:unit
pnpm run test:e2e
pnpm test
pnpm run validate
```

- `test:unit` couvre client HTTP, WebAuthn simulé, hooks, composants et actions administratives ;
- `test:e2e` démarre Vite sur `http://localhost:4173`, exclut les tests marqués `@real` et utilise Chromium ;
- `test` exécute les deux niveaux autonomes ;
- `validate` ajoute typecheck, lint et build de production.

Vitest exécute les fichiers avec un seul worker afin d’éviter les démarrages de processus instables observés sous
Windows. Cette sérialisation privilégie la reproductibilité ; elle ne change pas l’isolation entre les fichiers.

Le serveur MSW refuse toute requête non déclarée. Une mutation `POST`, `PATCH` ou `DELETE` ne doit jamais être
réessayée implicitement par un test ou par le client HTTP.

## Smoke test contre l’API locale

```powershell
$env:HISTAE_REAL_API_URL='http://localhost:8080'
pnpm run test:e2e:real
```

Ce test est volontairement en lecture seule :

- `/health/ready` confirme que l’API rejoint ses dépendances locales configurées ;
- une session administrative anonyme doit être refusée ;
- l’accès à un UUID aléatoire doit être refusé avant toute lecture métier.

Il ne dépend d’aucun compte de production et n’écrit aucune donnée. Les parcours administratifs authentifiés restent
isolés avec MSW et l’authenticator virtuel tant qu’un mécanisme officiel de création/destruction de compte admin de
test n’existe pas côté API.

## WebAuthn virtuel

Le parcours Playwright crée un authenticator CTAP2 Chromium avec :

- credential découvrable ;
- vérification utilisateur ;
- présence automatique ;
- RP ID `localhost`.

Il enregistre une première passkey, réutilise cette passkey pour une connexion et vérifie qu’aucun token n’apparaît
dans `localStorage` ou `sessionStorage`. Cela valide l’intégration navigateur ; la cryptographie et les règles serveur
restent testées dans `histae-api`.

## Règles d’isolation

- aucun test autonome ne contacte l’API, Stripe ou un autre fournisseur ;
- chaque test remet à zéro handlers MSW, DOM et stockages navigateur ;
- les actions utilisent des motifs explicitement fictifs ;
- les traces et captures Playwright ne sont conservées qu’en cas d’échec et sont ignorées par Git ;
- le smoke réel ne doit jamais cibler une URL de production ;
- ne pas ajouter de retry global qui masquerait une mutation dupliquée ou un test instable.

Un échec E2E doit être diagnostiqué depuis la trace avant d’augmenter un timeout. Une validation verte ne remplace ni
un test sur l’hébergement final, ni un pentest, ni une revue d’accessibilité manuelle.
