# Histae Dashboard

Console React d’administration, de modération et d’exploitation de Histae. Le dashboard consomme le contrat HTTP
de `histae-api-rust` ; l’API reste l’unique autorité pour les rôles, les autorisations, les transactions et l’audit.

Ce guide part d’une machine Debian neuve. Il couvre le développement local avec Vite et explique la construction de
l’artefact statique. La pile de production utilise Caddy derrière Cloudflare Tunnel sur `https://dashboard.histae.com`, avec
`/api` sous la même origine. Les commandes de déploiement et contrôles de la cible sont dans le
[guide API](../histae-api-rust/docs/container-deployment.md#production).

## Prérequis fonctionnels

La page **Plans** affiche trois cartes issues de `GET /api/plans` : Free (0 EUR), Premium Mensuel
(5 EUR/mois) et Premium Annuel (48 EUR/an), selon le catalogue initial. Chaque carte utilise le prix,
la devise de `offers`, puis les fonctionnalités et quotas du plan référencé par `plan_code`.
Les deux offres Premium partagent les mêmes droits. Le dashboard ne crée aucun abonnement depuis
cette page et n'embarque aucun tarif de secours. Le contrat exige `plans` et `offers` : une réponse
sans `offers` est rejetée. Une liste explicitement vide reste vide et les données malformées sont refusées.

Aucune carte ne propose d'essai. Le champ `trial_days` a été retiré du catalogue HTTP et des modèles
clients ; les nouvelles créations Checkout sont sans essai.

La **Vue d'ensemble** exige `subscription_offers` de `/api/admin/metrics` pour compter Free,
Premium Mensuel et Premium Annuel selon les droits effectifs. Les accès Premium sans périodicité
sont signalés séparément. Des compteurs absents, incomplets ou invalides provoquent une erreur
de chargement ; aucune ventilation n'est calculée depuis l'ancien total Premium.
Déployer ensemble l'API et le dashboard correspondant au contrat courant.

Après transfert des sources à jour sur le serveur, reconstruire/recréer séparément l'API et le
dashboard avec `reset-api.sh --production --full` puis `reset-dashboard.sh --production --full`
depuis `histae-scripts`. Vérifier que `HISTAE_ROOT` cible les dossiers réellement mis à jour.
Ces commandes conservent la base ; supprimer les volumes n'ajouterait pas le champ `offers` à une
ancienne image de l'API. Recharger ensuite le navigateur.

Avant de lancer le dashboard, disposer de :

- Histae API démarrée et prête sur `http://localhost:8080` ;
- un compte PostgreSQL Histae portant le rôle `admin` ou `superadmin` pour tester une vraie connexion ;
- un navigateur récent compatible WebAuthn ;
- un navigateur ouvert sur exactement `http://localhost:5173` en développement.

Le [README de l’API](../histae-api-rust/README.md) décrit son installation complète sur Debian.

## 1. Préparer Debian

Installer Git, les certificats, `curl` et les outils nécessaires aux dépendances Node.js :

```bash
sudo apt update
sudo apt install -y ca-certificates curl git build-essential
```

Installer Node.js 22 avec `nvm`, puis la version de pnpm fixée par le dépôt :

```bash
curl -fsSLo /tmp/nvm-install.sh \
  https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh
bash /tmp/nvm-install.sh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22
nvm alias default 22

corepack disable pnpm
npm install --global pnpm@12.11.2
node --version
pnpm --version
```

Le résultat doit indiquer Node.js 22.13 ou plus récent et pnpm 12.11.2.
pnpm 12 utilise un exécutable natif ; l'installation ci-dessus remplace le shim
Corepack de pnpm lorsqu'il est présent.
Sous Windows, si pnpm est installé dans `C:\Program Files\nodejs`, exécuter
`corepack disable pnpm` puis `npm install --global pnpm@12.11.2` dans un terminal
administrateur pour remplacer cette installation système.

## 2. Cloner et installer le dashboard

Cloner le dépôt du dashboard :

```bash
git clone https://github.com/Nicolas38144/histae-dashboard.git
cd histae-dashboard
pnpm install --frozen-lockfile
cp .env.example .env.development
```

Le dépôt ne doit contenir ni `.env.development` ni secret.

## 3. Configurer l’environnement local

Le fichier `.env.development` doit normalement rester minimal :

```ini
VITE_ENV=development
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```

| Variable | Rôle |
| --- | --- |
| `VITE_ENV` | nom de l’environnement intégré au build |
| `VITE_API_URL` | préfixe appelé par le navigateur, normalement `/api` |
| `VITE_API_PROXY_TARGET` | origine jointe uniquement par le proxy Vite en développement |

Toute variable préfixée par `VITE_` est intégrée au JavaScript envoyé au navigateur. Elle ne doit donc jamais
contenir un mot de passe, un token, une clé API ou un autre secret.

Vérifier que l’API répond avant de démarrer le dashboard :

```bash
curl -fsS http://127.0.0.1:8080/health/ready
```

## 4. Lancer le dashboard

```bash
pnpm run dev
```

Ouvrir ensuite :

```text
http://localhost:5173
```

Ne pas remplacer `localhost` par `127.0.0.1`. En développement, le RP ID WebAuthn est `localhost` et l’origine
autorisée par l’API est exactement `http://localhost:5173`. Vite relaie `/api` vers
`VITE_API_PROXY_TARGET`; le navigateur ne contacte donc pas directement le port 8080 pour les routes métier.

La session d’administration est conservée dans un cookie API `HttpOnly; SameSite=Strict`. Le dashboard ne reçoit
jamais le secret de session et ne le stocke ni dans `localStorage` ni dans `sessionStorage`.

## 5. Enregistrer la première passkey

Le compte doit déjà porter le rôle `admin` ou `superadmin`, être actif et non banni. Le
[guide d’administration de l’API](../histae-api-rust/docs/administration.md) décrit l’initialisation du
premier superadmin et la gestion des rôles. Depuis la racine de `histae-api-rust`, générer le jeton
d’enrôlement avec le binaire Rust `admin-bootstrap`. Avec la pile Docker locale recommandée :

```bash
sudo docker compose --env-file .env -f compose.yaml -f compose.dev.yaml \
  exec api /app/bin/admin-bootstrap <uuid-du-compte-admin>
```

Si l’API tourne directement sur l’hôte :

```bash
cargo run --locked --bin admin-bootstrap -- <uuid-du-compte-admin>
```

Saisir le jeton obtenu dans l’écran « Enregistrer la première passkey ». Ce jeton est un secret à usage unique :
il n’est affiché qu’une fois, n’est pas persisté par le dashboard et expire après quinze minutes par défaut.

Conserver ensuite au moins deux passkeys distinctes, dont idéalement une clé physique de secours.

## Développement sur une Debian distante

WebAuthn local doit toujours voir l’origine `http://localhost:5173` dans le navigateur. Si Debian tourne sur une
autre machine, garder Vite et SeaweedFS liés à la boucle locale du serveur et ouvrir un tunnel SSH depuis le poste
qui porte le navigateur :

```bash
ssh \
  -L 5173:127.0.0.1:5173 \
  -L 8333:127.0.0.1:8333 \
  utilisateur@serveur-debian
```

Le port 5173 donne accès au dashboard et à son proxy API. Le port 8333 est utile pour afficher les photos signées
du stockage objet local : `storage.histae.localhost` résout vers la boucle locale et traverse donc ce tunnel. Ne
pas rendre Vite, SeaweedFS ou l’API directement publics pour contourner le tunnel.

## Tests et validation

Installer Chromium et ses bibliothèques Debian uniquement si les tests E2E doivent être exécutés :

```bash
pnpm exec playwright install --with-deps chromium
```

Puis lancer les contrôles :

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test:unit
pnpm run test:e2e
pnpm run validate
pnpm run security:audit
```

| Commande | Contenu |
| --- | --- |
| `pnpm run check` | typecheck, lint et build de production |
| `pnpm run test:unit` | Vitest, Testing Library et MSW sans API réelle |
| `pnpm run test:e2e` | parcours Chromium isolés, dont WebAuthn virtuel |
| `pnpm run validate` | contrôles statiques, build et tous les tests autonomes |
| `pnpm run security:audit` | audit des dépendances de production |

Le smoke test réel reste en lecture seule et doit viser uniquement l’API locale :

```bash
HISTAE_REAL_API_URL=http://127.0.0.1:8080 pnpm run test:e2e:real
```

Les prérequis, garanties d’isolation et limites sont détaillés dans [test.md](test.md).

## Construire l’artefact statique

```bash
pnpm run build
```

Le résultat se trouve dans `dist/`. Pour l’inspecter localement :

```bash
pnpm run preview -- --host 127.0.0.1
```

Le serveur de prévisualisation Vite n’est pas un serveur de production.

En production, le serveur frontal doit :

- servir le dashboard et `/api` sous la même origine HTTPS ;
- faire correspondre cette origine à `ADMIN_WEBAUTHN_ORIGIN` et son hôte à `ADMIN_WEBAUTHN_RP_ID` ;
- renvoyer les routes de la SPA vers `index.html` sans exposer `.env`, sources ou source maps ;
- appliquer les CSP, HSTS, règles de cache, permissions et protections anti-framing de [SECURITY.md](SECURITY.md) ;
- restreindre l’accès au réseau d’administration retenu et prévoir un retour arrière testé.

Le [dépôt reverse proxy](../histae-reverse-proxy/README.md) décrit le routage Caddy, le tunnel et les réseaux
partagés. Le certificat TLS public est géré par Cloudflare. Les validations à effectuer sur le serveur restent
dans [roadmap.md](roadmap.md).

## Commandes courantes

| Commande | Usage |
| --- | --- |
| `pnpm run dev` | lancer Vite avec rechargement automatique |
| `pnpm run build` | produire `dist/` sans source map |
| `pnpm run preview` | prévisualiser localement le build |
| `pnpm run check` | exécuter les contrôles statiques et le build |
| `pnpm test` | exécuter les tests unitaires et E2E autonomes |
| `pnpm run validate` | exécuter toute la validation autonome |

## Documentation

| Document | Rôle |
| --- | --- |
| [resume.md](resume.md) | architecture et capacités actuellement livrées |
| [test.md](test.md) | stratégie, commandes et isolation des tests |
| [SECURITY.md](SECURITY.md) | modèle de confiance et checklist de déploiement |
| [roadmap.md](roadmap.md) | travaux encore ouverts |
| [Contrat HTTP Rust](../histae-api-rust/docs/http-contract.md) | contrat HTTP de référence |

Sources d’installation : [nvm](https://github.com/nvm-sh/nvm), [pnpm](https://pnpm.io/installation) et
[Playwright sur Linux](https://playwright.dev/docs/browsers#install-system-dependencies).

## Continuations et crédits

La fiche auditée d’un compte affiche le solde transmis dans `continuation_quota` : crédits gratuits disponibles, stock publicitaire, réservations et continuations confirmées de la semaine. Le catalogue distingue les trois crédits gratuits du plafond de six continuations. Premium reste illimité, sans publicité ni débit. Pendant `awaiting_continuation`, la discussion est en pause ; les décisions individuelles ne sont pas révélées à l’autre participant. Les règles et le webhook AdMob sont documentés dans le guide API `docs/continuation-and-rewards.md`.

## Conventions React et TypeScript

Les pages coordonnent le chargement et les mutations ; les composants typés présentent les réponses de l’API.
`PlanCard` et `ContinuationCredits` utilisent les prix, plafonds et soldes reçus, sans recréer les règles métier.
Les états asynchrones passent par les hooks partagés. Le client HTTP centralise les erreurs et conserve les
contrôles de session, les cookies et l’absence de retry automatique des mutations.

Avant de livrer : `pnpm run check` puis `pnpm run test:unit`. Les tests découverts par Vitest sont les fichiers
`*.spec.ts` et `*.spec.tsx` de `tests/unit` et `tests/components`. `pnpm run test:e2e` utilise Chromium et une API
simulée ; les scénarios `@real` nécessitent une pile de test dédiée.

## Serveur Caddy et confidentialité des logs

L’image finale utilise Caddy **2.11.7**, figé par digest, pour servir les fichiers statiques.
`Caddyfile` désactive l’API d’administration, HTTPS automatique et la sauvegarde de configuration.
Il écoute en HTTP interne et charge `caddy-common.caddy` pour la politique commune des logs et du corps HTTP.
Le runtime utilise UID/GID 1000, une racine en lecture seule et uniquement `NET_BIND_SERVICE`.

Les logs JSON suppriment la requête complète et les en-têtes de réponse. Ils conservent le statut,
la durée, des métriques numériques, la méthode normalisée, la catégorie de route et l’UUID de réponse
API validé. Les URL, paramètres, IP, cookies et autres en-têtes privés sont exclus. Les erreurs HTTP
ordinaires sont représentées par ce log expurgé ; le logger runtime ne les duplique pas.
La pile `reverse-proxy` borne les logs Docker à cinq fichiers de 10 Mo par conteneur.

Lors d’une copie manuelle, copier **`Caddyfile`**, **`caddy-common.caddy`** et **`Dockerfile`**, puis reconstruire
et recréer le service. Les anciens fichiers `nginx.conf` et `nginx-logging.conf` sont supprimés.
Le guide et les vérifications sont dans `../histae-api-rust/docs/caddy-migration.md`.

Le dashboard approuve uniquement le proxy edge `172.30.0.4` pour les IP et HTTPS publics. Il conserve
`Origin`, cookies, corps JSON et préfixe `/api`, force `Cache-Control: no-store` et garde les erreurs API
hors du repli React. Les fichiers absents, sources, fichiers cachés et source maps renvoient 404.
L’HSTS est ajouté seulement pour une requête HTTPS annoncée par ce proxy approuvé.

## Supervision Docker

La page **Supervision** est visible uniquement pour le superadmin. Elle ouvre Grafana, Prometheus et
Alertmanager dans un nouvel onglet, sous `/monitoring/grafana/`, `/monitoring/prometheus/` et
`/monitoring/alertmanager/`, sur la même origine que le dashboard. Aucun secret ni URL de backend n’est
intégré au JavaScript et aucun second mot de passe n’est demandé.

L’accès nécessite la pile Caddy `reverse-proxy` et l’API avec `compose.proxy.yaml` en dev,
ou `compose.production-observability.yaml` en production. Caddy fait vérifier
chaque requête par l’API avec la session WebAuthn existante : seuls les superadmins actifs sont acceptés.
Un admin ne peut pas contourner la restriction avec une URL directe. Les mutations exigent l’origine exacte.
Vite seul ne fournit pas les routes des outils ; les services de supervision doivent être démarrés.

Depuis `../histae-scripts`, après configuration des `.env` et du tunnel :

```bash
bash reset-docker-compose.sh --dev
# Pour la production, avec secrets et certificats préparés :
bash reset-docker-compose.sh --production
```

Le [guide de supervision API](../histae-api-rust/docs/observability.md) couvre la collecte, les secrets,
les règles d’alerte et la validation. Aucun nouvel ingress Cloudflare n’est nécessaire.

## Revenus dans la vue d’ensemble

Le dashboard affiche les **revenus bruts estimés** renvoyés par l’API (`basis: stripe_paid_invoices`).
Le total additionne les montants des factures d’abonnement Stripe payées enregistrées, selon leur date
`paid_at`, dans la devise du catalogue. Un achat annuel est compté pour son montant payé, sans division
par douze ; les renouvellements et remises sont donc pris en compte. Ce montant n’est pas un MRR.

Les cartes indiquent aussi le nombre de factures et d’abonnements distincts avec paiement sur la période.
Les essais à zéro et factures impayées sont exclus. Une annulation ultérieure ou l’effacement du compte
ne retire pas une facture historique. Les factures dans une autre devise sont exclues et signalées.

Les taxes facturées sont incluses ; frais et remboursements ne sont pas déduits. Les webhooks non reçus
peuvent laisser des factures absentes : il ne s’agit ni d’un bénéfice, ni d’un relevé des versements Stripe.
Déployer ce dashboard avec la version de l’API portant le même contrat de revenus.

## Traductions du catalogue

Les écrans Traits et Questions de profil éditent le français, l’anglais, l’espagnol et l’italien.
Le français reste canonique. Les indicateurs EN/ES/IT montrent la couverture ; vider un champ traduit
supprime sa traduction et rétablit le repli français. Les listes affichent la projection correspondant à la langue
choisie ; les champs « Nom (français) » et « Question (français) » modifient toujours la source canonique française.
La préparation des formulaires est séparée des composants et du client HTTP.

## Langue de l’interface

Le bouton de langue est disponible sur la connexion et dans l’en-tête de la console : **Français, English,
Español, Italiano**. Le français est la langue initiale. Le choix est conservé dans `localStorage` sous
`histae_locale`, validé sur ces quatre codes et synchronisé entre les onglets. Si le stockage est bloqué,
le changement fonctionne pour l’onglet courant. Aucun jeton ni contenu personnel n’y est stocké.

Le changement est immédiat : menus, formulaires, confirmations, notifications à venir, erreurs, libellés de
rôles et consentements, titre de page, `html[lang]`, messages MUI, dates, nombres et devises. Une notification
déjà affichée est fermée. Les appels Axios envoient la langue courante dans `Accept-Language`. Les données
chargées par les hooks sont relues ; la pagination repart de sa première page et les anciennes réponses
sont ignorées. Les saisies et les permissions restent conservées.

Les noms, motifs, messages et autres contenus saisis par les utilisateurs ne sont pas traduits. Les UUID,
routes, codes de diagnostic et colonnes CSV restent les identifiants techniques du contrat. Le nom du
fichier CSV exporté suit la langue de l’interface.

### Ajouter ou modifier un texte

- Les textes d’interface se trouvent uniquement dans `src/i18n/messages/{fr,en,es,it}.json`.
- Utiliser `t('section.message', { name: value })` et une clé descriptive ; ne pas concaténer des fragments de phrase.
- Ajouter la même clé et les mêmes paramètres dans les quatre fichiers. Pour les pluriels, utiliser
  `{ "one": "… {count} …", "other": "… {count} …" }` ; `Intl.PluralRules` sélectionne la forme.
- Appeler `useLocale()` dans un composant qui lit `t()`, un libellé de domaine ou un formateur. Les collections
  de libellés sont construites au rendu, pour ne pas figer une ancienne traduction.
- Utiliser les fonctions de `src/utils/format.ts` pour les dates, nombres et montants ; conserver les
  valeurs d’un champ éditable dans leur format technique attendu par le navigateur et l’API.
- Les erreurs locales portent une clé via `LocalizedError`. Le client traduit les codes API connus et
  affiche un message localisé avec le code technique pour les autres erreurs HTTP ; il ne reproduit pas
  les messages bruts d’un fournisseur.

`src/i18n/catalogs.ts` porte les types et les ressources ; `core.ts` gère la traduction et la préférence ;
`useLocale.ts` adapte le store à React ; `domain.ts` présente les codes API sans modifier leurs valeurs.
Aucune dépendance d’internationalisation supplémentaire n’est requise.

Les tests vérifient les clés et paramètres, les pluriels, les formats, la persistance et les changements de
langue pendant un chargement ou une saisie. `tests/unit/ui-text.spec.ts` analyse les sources TypeScript et
refuse les textes visibles écrits directement dans le code (hors valeurs techniques explicitement permises).


## Protection des envois SMS

L’onglet **SMS Sweego** (`/sms-safety`) affiche les limites OTP par numéro (5/heure et 10/24 h par défaut), les compteurs
agrégés et une alerte de pic. Le superadmin peut suspendre/reprendre globalement les SMS avec une
session WebAuthn récente et une confirmation, sans motif obligatoire. Les administrateurs ordinaires
ont uniquement la lecture. Le statut est actualisé toutes les 30 secondes.

La version lue accompagne la mutation ; un état devenu obsolète est refusé. Une réponse perdue est
résolue par lecture, sans rejeu automatique de la mutation. Un arrêt imposé par la configuration du
serveur reste prioritaire. Les compteurs ne sont jamais remis à zéro lors d’une reprise.

Le blocage est appliqué par l’API/PostgreSQL et reste actif si les outils de supervision sont arrêtés.
Voir le [guide API](../histae-api-rust/docs/sms-safety.md) pour la configuration et le mode secours.

## Achats Apple / Google Play

L’onglet **Abonnements stores** affiche l’activation, les droits natifs, acquittements Google,
notifications et derniers abonnements. Accès admin ; import financier réservé au superadmin avec
authentification récente et confirmation explicite du fichier/fournisseur/rapport sélectionnés.
Le CSV normalisé, son format et l’idempotence sont décrits dans le
[guide serveur](../histae-api-rust/docs/store-billing.md#dashboard-et-rapports-financiers).
Le modèle téléchargeable contient uniquement l’en-tête. Les rapports bruts fournisseurs doivent être
normalisés avant import. Les devises sont séparées, les nets inconnus restent inconnus, Stripe reste
affiché séparément sur factures payées. Aucun revenu natif n’est déduit du nombre de comptes Premium.


Le module `src/features/store-billing/` sépare modèles, normalisation CSV, totaux par devise,
panneaux de lecture et cycle d’import. `src/api/store-billing-codec.ts` contrôle les réponses
inconnues avant affichage. Le hook conserve une copie des lignes à confirmer et ignore les lectures
de fichier devenues obsolètes ou terminées après démontage. La page assemble ces responsabilités.

## Source access and licensing

Copyright © 2026 Nicolas GERMANI. Original Histae code is proprietary and publicly available only
for inspection and security audits. Reuse, modification outside an audit, redistribution and use
in another project or service are prohibited for commercial and non-commercial purposes without
prior written permission. See [LICENSE.md](LICENSE.md) for the limited audit permission and
applicable exceptions. External contributions are not accepted.

Third-party dependencies, SDKs and fonts retain their own licenses; these restrictions do not
override their rights or notices. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Navigation and working context

The overview starts with an attention queue derived from existing metrics. Navigation is grouped
by activity and includes a page search (Ctrl/Cmd+K). List filters and scroll positions are held
in memory for the authenticated session. Returning to a list reloads its previously opened page
depth through the existing endpoints; refresh starts again at the first page. Signing out clears
this context. No user records or search terms are written to browser storage.

Traits and profile questions include missing-translation filters and fictional previews, including
unsaved editor values. Preview language is independent from the interface language. All additions
use the existing API contract.


### Frontend boundaries

- `AppShell` owns layout and the authenticated view-state lifetime; `AppNavigation` owns the menu interaction. Routes, groups and role-dependent visibility live in `navigation/navigation.tsx`.
- `utils/attention-tasks.ts` derives actionable items without UI dependencies. `AttentionQueue` translates and renders them.
- `useCursorPagination` owns request cancellation and loading state. `utils/cursor-pages.ts` fetches page ranges, while `useListRestoration` and `useListPosition` restore view preferences. Only successful, current requests update remembered depth.
- `components/catalog-translations.ts` defines the shared missing-translation and fallback policy used by catalog filters and previews.
