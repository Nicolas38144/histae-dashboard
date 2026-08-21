# Histae Dashboard — résumé technique, fonctionnel et sécurité

Mise à jour : 20 août 2026.

## 1. Vision du projet

`histae-dashboard` est la console réservée aux administrateurs de Histae. Elle sert à observer l’état de la plateforme, modérer les signalements, gérer les mesures de sûreté, administrer le catalogue de traits et traiter les demandes relatives aux droits des personnes.

La sécurité est appliquée côté API. Le dashboard améliore l’expérience de travail, mais ne constitue jamais une frontière d’autorisation autonome.

## 2. État initial de l’ancien dashboard

### Ce qui allait bien

- séparation déjà présente entre pages, hooks, stores et services ;
- usage cohérent de React, TypeScript, Material UI et Axios ;
- composant de tableau générique avec recherche, édition et confirmation ;
- états de chargement, erreurs et notifications utilisateur ;
- protection visuelle des routes ;
- tentative de cache des données et de renouvellement automatique de session ;
- fiche utilisateur riche et interface de consultation des conversations ;
- thème clair/sombre et préparation à l’internationalisation.

Ces fondations montraient que le dépôt était déjà une véritable application d’administration et pas seulement une maquette.

### Ce qui n’allait plus

Le dashboard et l’API appartenaient à deux générations fonctionnelles différentes.

- authentification historique par téléphone et mot de passe, alors que l’API v3 utilise un OTP et une paire access/refresh token ;
- route de refresh historique `/auth/refresh-token`, remplacée par `/auth/refresh` avec le refresh token dans le corps ;
- anciens domaines `posts`, `postreports`, `matchreports` et `vibes` absents de l’API actuelle ;
- anciennes routes CRUD de matchs et messages incompatibles avec leur caractère désormais contrôlé et immuable ;
- anciennes métriques et routes globales d’utilisateurs absentes ;
- contrats TypeScript correspondant à l’ancien schéma de données ;
- tokens persistés dans `localStorage` ;
- aucune vérification effective du rôle administrateur au démarrage ;
- variables Firebase résiduelles et inutilisées ;
- documentation presque vide ;
- npm et `package-lock.json` alors que l’API utilise pnpm ;
- dépendances inutilisées et versions comportant des vulnérabilités connues ;
- compilation initialement bloquée par deux symboles inutilisés.

## 3. Source de vérité contractuelle

La première référence est `../histae-api/routes.md`. Chaque route utilisée a aussi été vérifiée contre les contrôleurs, DTO, services et repositories NestJS.

Cette double lecture évite deux erreurs possibles : adapter l’interface à une documentation obsolète, ou utiliser un détail interne non garanti par le contrat public.

## 4. Choix de migration fonctionnelle

Les anciens domaines sans équivalent dans l’API n’ont pas été artificiellement recréés.

- les pages de publications et de vibes ont été supprimées ;
- les signalements de publications et de matchs ont été remplacés par les signalements d’utilisateurs actuels ;
- la création manuelle de matchs a été supprimée, car un match ne peut être créé que par deux likes réciproques ;
- la modification et la suppression manuelles des messages ont été supprimées, car les messages sont immuables ;
- les plans sont consultables mais non modifiables, car l’activation Premium appartient au fournisseur de facturation ;
- la suppression directe d’un utilisateur n’est pas exposée : la sûreté utilise le bannissement et l’effacement suit le workflow RGPD.

## 5. Ajouts réalisés dans l’API

Un module `src/admin` isole les contrats, DTO, réponses OpenAPI, règles métier, accès PostgreSQL et contrôleur de la console.

### Session et synthèse

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/admin/me` | Vérifie que la session possède le rôle `admin` ou `superadmin`. |
| GET | `/api/admin/metrics` | Retourne la synthèse initiale et le CA Premium du mois en cours. |
| GET | `/api/admin/revenue` | Recalcule uniquement le CA Premium estimé pour la période demandée. |

### Utilisateurs

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/admin/users` | Liste paginée, filtrée et recherchable des comptes. |
| GET | `/api/admin/users/:id` | Détail administratif sans téléphone ni coordonnées précises. |
| PATCH | `/api/admin/users/:id/status` | Bannissement ou débannissement contrôlé et audité. |

Le bannissement révoque tous les refresh tokens du compte. Le guard vérifiant aussi `is_banned` à chaque requête, un access token déjà émis ne permet plus de continuer à utiliser l’API.

### Modération des matchs

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/matches/:userId` | Liste des matchs d’un utilisateur avec justification obligatoire et journalisation. |
| GET | `/api/admin/matches/:id/messages` | Conversation paginée avec justification obligatoire, journalisée pour les deux participants. |

### Protection HTTP

- CORS optionnel sur liste blanche via `CORS_ORIGINS` ;
- aucun credential cross-origin ;
- méthodes et en-têtes explicitement autorisés ;
- `Cache-Control: no-store` ;
- `X-Content-Type-Options: nosniff` ;
- `X-Frame-Options: DENY` ;
- `Referrer-Policy: no-referrer` ;
- désactivation caméra, microphone et géolocalisation ;
- HSTS en production.

## 6. Règles d’accès aux données personnelles

La consultation d’un profil enregistre `view_profile`. La consultation des matchs enregistre `view_matches`. La consultation d’une conversation enregistre `view_messages` pour chacun des deux participants.

Une justification de 3 à 500 caractères est obligatoire pour les matchs, profils détaillés et messages. Les actions de bannissement et débannissement utilisent `admin_ban` et `admin_unban`.

Les informations suivantes ne sont jamais retournées :

- téléphone clair ;
- téléphone chiffré ;
- empreinte du téléphone ;
- latitude et longitude ;
- métadonnées réseau des consentements.

## 7. Architecture du nouveau dashboard

```text
src/
  api/          client HTTP, authentification, services et contrats
  auth/         stockage et cycle de vie de la session
  components/   layout et composants d’interface réutilisables
  hooks/        chargement asynchrone commun
  pages/        écrans métier
  routes/       routes publiques et protégées
  utils/        formatage sans logique métier
```

Les anciens stores et view-models ont été supprimés avec leurs contrats obsolètes. Le nombre de dépendances de production est passé à un socle réduit : React, React Router, Axios, Material UI et Emotion.

## 8. Authentification du dashboard

1. l’administrateur saisit son numéro français ;
2. le dashboard appelle `/auth/otp/send` avec une clé d’idempotence UUID v4 ;
3. le code est vérifié par `/auth/otp/verify` ;
4. les tokens sont placés dans `sessionStorage` ;
5. `/admin/me` vérifie immédiatement le rôle ;
6. cette vérification est rejouée à chaque rechargement de l’application ;
7. une réponse `401` déclenche une rotation unique du refresh token ;
8. les requêtes concurrentes reprennent avec le nouvel access token ;
9. tout échec de rotation efface la session et renvoie vers la connexion.

Un compte non administrateur peut obtenir des tokens valides via OTP, mais il est refusé par `AdminGuard` et le dashboard efface immédiatement sa session.

## 9. Écrans disponibles

### Vue d’ensemble

- comptes actifs, bannis et onboardés ;
- créations des trente derniers jours ;
- signalements en attente ;
- demandes RGPD ouvertes ;
- messages conservés ;
- états des matchs ;
- répartition des abonnements ;
- CA estimé à partir des abonnements Premium et du tarif mensuel courant ;
- sélection rapide : 7 jours, 30 jours, mois en cours, mois précédent, année en cours ou depuis le début.

Un changement de période ne recharge ni les comptes, ni la modération, ni les matchs : seule la carte CA appelle
`/api/admin/revenue`. Elle affiche sa propre progression circulaire, conserve les anciennes valeurs atténuées pendant
la requête et protège l’interface contre les réponses obsolètes ou les requêtes annulées.

L’estimation utilise `user_subscription.updated_at` comme date d’activation ou de mise à jour. Elle est
explicitement présentée comme une estimation et non comme un bénéfice comptable : les renouvellements non
enregistrés, remboursements, taxes, commissions et charges ne sont pas disponibles dans le modèle actuel.

### Utilisateurs

- recherche par prénom ou UUID exact ;
- filtres de rôle et d’état ;
- pagination par curseur ;
- fiche profil, préférences, traits, consentements et fraîcheur de présence ;
- bannissement avec motif obligatoire ;
- consultation des matchs et conversation avec justification.

### Signalements

- filtre par état ;
- accès direct aux profils émetteur et signalé ;
- description et contexte de match ;
- transition entre `pending`, `reviewed` et `dismissed`.

### Traits

- liste ;
- création ;
- renommage ;
- suppression confirmée.

### Demandes RGPD

- filtre par état ;
- transitions autorisées uniquement ;
- notes de traitement ;
- avertissement renforcé avant de terminer une demande d’effacement.

### Plans et journal d’accès

- catalogue commercial en lecture seule ;
- recherche des accès par UUID utilisateur ;
- affichage de l’acteur, de l’action, de la justification et de la date.

## 10. Expérience et accessibilité

- interface française ;
- navigation responsive avec drawer mobile ;
- thème clair/sombre ;
- titres de pages et descriptions explicites ;
- tableaux sémantiques ;
- boutons avec libellés et icônes accessibles ;
- états de chargement, erreur, absence de résultats et notifications ;
- confirmation des actions destructrices ou sensibles ;
- chargement différé des pages pour réduire le bundle initial.

## 11. Migration de npm vers pnpm

- ajout de `packageManager: pnpm@11.22.0` ;
- ajout de `pnpm-lock.yaml` ;
- suppression de `package-lock.json` ;
- ajout de `pnpm-workspace.yaml` ;
- script d’installation autorisé uniquement pour `esbuild` ;
- override de sécurité `yaml@1.10.3` ;
- scripts `typecheck`, `check` et `security:audit`.

## 12. Audit de sécurité du dashboard

### Corrections de code et configuration

- tokens déplacés de `localStorage` vers `sessionStorage` ;
- suppression des anciens tokens lors de la première déconnexion ;
- aucune donnée de session dans Zustand ou une persistance applicative ;
- aucune injection de HTML ;
- timeout réseau de quinze secondes ;
- renouvellement concurrent sérialisé ;
- CSP restrictive en production ;
- absence de source maps de production ;
- balise `noindex,nofollow,noarchive` ;
- politique même-origine `/api` recommandée ;
- suppression des variables Firebase résiduelles ;
- dépendances inutilisées supprimées.

### Dépendances

Le premier audit a trouvé des vulnérabilités connues dans les anciennes versions d’Axios et React Router, ainsi qu’une dépendance YAML transitive. Après mise à niveau et override :

```text
pnpm audit --prod
No known vulnerabilities found
```

## 13. Audit de sécurité de l’API

L’audit a aussi trouvé des versions transitives vulnérables d’`@fastify/static` et `adm-zip`. Elles sont verrouillées respectivement en `10.1.2` et `0.6.0` dans le workspace pnpm de l’API.

Résultat final :

```text
pnpm audit --prod
No known vulnerabilities found
```

## 14. Tests et validations

### API

- typecheck TypeScript réussi ;
- ESLint réussi avec zéro avertissement ;
- 23 suites et 126 tests unitaires réussis, dont le calcul de CA, le chargement dédié, les règles d’administration et la validation CORS ;
- campagne complète hors intégration : 25 suites et 135 tests réussis ;
- audit de dépendances de production sans vulnérabilité connue.

### Dashboard

- typecheck réussi ;
- ESLint réussi ;
- build Vite de production réussi ;
- audit de dépendances de production sans vulnérabilité connue ;
- inspection réelle dans le navigateur ;
- rendu desktop et mobile vérifié ;
- aucune erreur ou alerte dans une nouvelle session navigateur après correction de la CSP de développement.

## 15. Configuration

Le développement utilise :

```dotenv
VITE_ENV=development
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```

Le serveur Vite transmet `/api` à l’API sans réécriture. En production, le reverse proxy doit appliquer le même modèle ou une origine HTTPS séparée doit être déclarée à la fois dans la CSP du dashboard et dans `CORS_ORIGINS` de l’API.

## 16. Commandes principales

```bash
pnpm install --frozen-lockfile
pnpm run dev
pnpm run check
pnpm run security:audit
```

## 17. Limites et décisions restant à prendre

### Infrastructure

- choisir l’URL et le reverse proxy de production ;
- appliquer les en-têtes de `SECURITY.md` au CDN ou au serveur frontal ;
- réserver idéalement le dashboard à un VPN ou une passerelle Zero Trust ;
- configurer `CORS_ORIGINS` seulement si une origine séparée est indispensable.

### Exploitation

- créer et gouverner les comptes `admin` et `superadmin` ;
- définir les procédures de justification et revue des conversations ;
- surveiller les actions sensibles du journal d’accès ;
- définir des alertes sur les bannissements et volumes anormaux de consultation.

### Tests futurs

- ajouter des tests de composants avec un serveur API simulé ;
- ajouter un scénario E2E avec PostgreSQL, Redis, Scylla et un compte administrateur de test ;
- vérifier les workflows OTP et modération dans un environnement de staging ;
- tester le reverse proxy et les en-têtes du véritable hébergement.

## 18. Conclusion

Le dépôt n’est plus une adaptation partielle de l’ancien produit. Il constitue maintenant une console cohérente avec Histae API v3, centrée sur les responsabilités réellement présentes dans le backend et sur la traçabilité des opérations administratives.

Les anciens points forts — richesse de la fiche utilisateur, retours d’état, interface Material UI et séparation des responsabilités — ont été conservés sous une architecture plus compacte. Les contrats obsolètes, la persistance durable des tokens, les dépendances inutiles et les vulnérabilités connues ont été retirés.
