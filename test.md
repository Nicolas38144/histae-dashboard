# Tests du dashboard Histae

## Niveaux de validation

`tests/components/plans.spec.tsx` vérifie les trois cartes commerciales, leurs prix et périodicités,
la prise en compte d'un prix API modifié et le refus d'une offre sans plan de droits correspondant.

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

- `test:unit` couvre client HTTP, WebAuthn simulé, hooks, pagination, composants et actions administratives ;
- `test:e2e` démarre Vite sur `http://localhost:4173`, exclut les tests marqués `@real` et utilise Chromium ;
- `test` exécute les deux niveaux autonomes ;
- `validate` ajoute typecheck, lint et build de production.

Vitest exécute les fichiers avec un seul worker afin d’éviter les démarrages de processus instables observés sous
Windows. Cette sérialisation privilégie la reproductibilité ; elle ne change pas l’isolation entre les fichiers.

Le serveur MSW refuse toute requête non déclarée. Une mutation `POST`, `PATCH` ou `DELETE` ne doit jamais être
réessayée implicitement par un test ou par le client HTTP.

Les scénarios de pagination vérifient une collection vide, les pages initiale, intermédiaire et finale, la
déduplication d’un élément recouvrant deux pages, le refus d’un curseur et l’abandon d’une réponse liée à un ancien
filtre. Le parcours utilisateur charge plusieurs pages de matchs puis recompose les pages de messages, reçues de la
plus récente à la plus ancienne, dans un ordre chronologique global.

## Internationalisation

- `tests/unit/i18n.spec.ts` : parité des quatre catalogues, paramètres, pluriels, formats, préférence
  validée, stockage bloqué, synchronisation entre onglets, erreurs et en-tête HTTP dynamique ;
- `tests/unit/ui-text.spec.ts` : analyse AST interdisant les textes d’interface dans les sources ;
- `tests/components/language-selector.spec.tsx` : changement des quatre langues dès la connexion,
  conservation des saisies et des éditions françaises canoniques, abandon des résultats périmés ;
- `tests/e2e/languages.spec.ts` : parcours Chromium de la connexion à la console en anglais, espagnol
  et italien, persistance après rechargement, retour au français et en-tête API.

Les tests réinitialisent aussi la préférence de langue après chaque scénario. Les données personnelles
restent dans leur langue d’origine. Les noms de colonnes CSV et codes techniques ne sont pas des traductions.

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
restent testées dans `histae-api-rust`.

## Règles d’isolation

- aucun test autonome ne contacte l’API, Stripe ou un autre fournisseur ;
- chaque test remet à zéro handlers MSW, DOM et stockages navigateur ;
- les actions utilisent des motifs explicitement fictifs ;
- les traces et captures Playwright ne sont conservées qu’en cas d’échec et sont ignorées par Git ;
- le smoke réel ne doit jamais cibler une URL de production ;
- ne pas ajouter de retry global qui masquerait une mutation dupliquée ou un test instable.

Un échec E2E doit être diagnostiqué depuis la trace avant d’augmenter un timeout. Une validation verte ne remplace ni
un test sur l’hébergement final, ni un pentest, ni une revue d’accessibilité manuelle.

## Résultats actuels

Validation locale de l’internationalisation le **20 octobre 2026** :

- `pnpm run check` : typage, ESLint et build de production validés ;
- suite Vitest complète : **90 tests réussis** dans 24 fichiers ;
- après ajout du cas de stockage navigateur bloqué, **10 tests ciblés réussis** sur le sélecteur,
  l’absence de textes en dur et la confidentialité du stockage (dont 9 déjà dans la suite complète,
  soit **91 scénarios distincts validés**) ;
- Playwright Chromium : **5 parcours réussis**, dont anglais, espagnol, italien et WebAuthn virtuel.

Ces parcours utilisent une API simulée et ne valident pas le déploiement de production.

La [revue fonctionnelle de la livraison](../histae-api-rust/docs/feature-audit.md) centralise les résultats
API/dashboard/site et leurs limites. Le navigateur virtuel vérifie la cérémonie WebAuthn, sans valider
le matériel de secours ni le tunnel de production.


## Protection SMS

`tests/components/sms-safety.spec.tsx` vérifie la lecture sans commandes pour un admin, la confirmation
et la version de suspension, l’arrêt forcé par le serveur, le signalement des pics, le rejet d’un état
API mal formé et la résolution d’une réponse perdue sans seconde mutation. Les traductions fr/en/es/it
et les parcours navigateur de la vue d’ensemble sont conservés.


## Abonnements stores — 22 octobre 2026

- `pnpm check` : typage, lint et build réussis.
- Suite Vitest complète : **98 tests réussis**, dont le parseur CSV et les contraintes financières.
- Après ajout du récapitulatif de confirmation : dix contrôles ciblés traduction/texte/CSV réussis.
- `pnpm exec playwright test tests/e2e/store-billing.spec.ts` : deux parcours Chromium réussis.
  L’import n’est envoyé qu’après confirmation du fournisseur/rapport/fichier ; un admin ordinaire
  n’a pas accès à cette action. Les réponses API et montants sont fictifs.

Le contrôle du rôle courant, l’idempotence et le rollback d’un rapport contradictoire sont également
testés sur un PostgreSQL jetable dans l’API. Aucun rapport réel n’a été importé ni serveur déployé.
Le chunk principal conserve son avertissement de taille connu ; le build réussit.
Voir [le guide](../histae-api-rust/docs/store-billing.md#dashboard-et-rapports-financiers).

### Refactoring du parcours stores

Après séparation des modèles, de la lecture HTTP, de la normalisation CSV, des totaux, des panneaux
et du hook d’import : `pnpm check` réussit, les **12 contrôles ciblés** (finance, DTO malformés,
traductions et absence de texte en dur) passent, ainsi que les **deux parcours Chromium stores**.
La lecture d’un fichier devenue obsolète ou terminée après démontage est ignorée ; la confirmation
utilise son propre instantané. Les 98 tests complets précédents constituent la campagne initiale.
