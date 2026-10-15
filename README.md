# Histae Dashboard

Console React d’administration, de modération et d’exploitation de Histae. Le dashboard consomme le contrat HTTP
de `histae-api-rust` ; l’API reste l’unique autorité pour les rôles, les autorisations, les transactions et l’audit.

Ce guide part d’une machine Debian neuve. Il couvre le développement local avec Vite et explique la construction de
l’artefact statique. Il ne constitue pas à lui seul une procédure de mise en production : le domaine HTTPS, le
reverse proxy et les contrôles de l’hébergement final doivent encore être choisis et validés.

## Prérequis fonctionnels

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

Le dépôt Git porte encore le nom historique `viboa-dashboard`. Le second argument de `git clone` crée directement
un dossier local cohérent :

```bash
git clone https://github.com/Nicolas38144/viboa-dashboard.git histae-dashboard
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

Le reverse proxy, le certificat et le domaine définitifs ne sont volontairement pas inventés dans ce dépôt. Leur
validation fait partie de [roadmap.md](roadmap.md).

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

## Supervision du développement Docker

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
