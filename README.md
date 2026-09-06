# Histae Dashboard

Console React d’administration, de modération et d’exploitation de Histae. Le dashboard consomme le contrat HTTP
de `histae-api` v3 ; l’API reste l’unique autorité pour les rôles, les autorisations, les transactions et l’audit.

Ce guide part d’une machine Debian neuve. Il couvre le développement local avec Vite et explique la construction de
l’artefact statique. Il ne constitue pas à lui seul une procédure de mise en production : le domaine HTTPS, le
reverse proxy et les contrôles de l’hébergement final doivent encore être choisis et validés.

## Prérequis fonctionnels

Avant de lancer le dashboard, disposer de :

- Histae API démarrée et prête sur `http://localhost:8080` ;
- un compte PostgreSQL Histae portant le rôle `admin` ou `superadmin` pour tester une vraie connexion ;
- un navigateur récent compatible WebAuthn ;
- un navigateur ouvert sur exactement `http://localhost:5173` en développement.

Le [README de l’API](../histae-api/README.md) décrit son installation complète sur Debian.

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

corepack enable
corepack prepare pnpm@11.22.0 --activate
node --version
pnpm --version
```

Le résultat doit indiquer Node.js 22 ou plus récent et pnpm 11.22.0.

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

Après avoir attribué le rôle `admin` ou `superadmin` à un compte, exécuter depuis le dépôt `histae-api` :

```bash
pnpm run admin:webauthn:bootstrap -- <uuid-du-compte-admin>
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
du stockage objet local. Ne pas rendre Vite, SeaweedFS ou l’API directement publics pour contourner le tunnel.

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
| [`histae-api/routes.md`](../histae-api/routes.md) | contrat HTTP de référence |

Sources d’installation : [nvm](https://github.com/nvm-sh/nvm), [pnpm](https://pnpm.io/installation) et
[Playwright sur Linux](https://playwright.dev/docs/browsers#install-system-dependencies).
