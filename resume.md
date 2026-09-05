# Histae Dashboard — résumé technique, fonctionnel et sécurité

Mise à jour : 5 septembre 2026.

## Réconciliation Stripe — R05

La page Stripe consomme la file paginée `/api/admin/billing-reconciliation`, limitée aux dead letters et filtrable
par type. Elle n’affiche que les UUID locaux, tentatives, dates et codes d’erreur normalisés. Une dead letter peut
être remise en file via l’outbox commune après confirmation et motif ; WebAuthn récent et audit restent imposés
par l’API. La revérification relit Stripe et ne déclenche ni paiement ni association choisie par l’opérateur. Aucun Customer ID,
Subscription ID, payload fournisseur ou moyen de paiement n’entre dans le navigateur.

## Effacement reprenable — R02

La page RGPD distingue désormais l’acceptation de l’effacement de sa terminaison. « Lancer l’effacement »
désactive le compte ; les étapes Stripe, photos, Scylla et PostgreSQL sont suivies depuis `erasure` dans la
réponse API. Le bouton « Actualiser » recharge les checkpoints. Une dead letter peut être relancée avec motif
de 3 à 500 caractères via l’outbox auditée ; un traitement commencé ne peut plus être refusé ou annulé.
Ces mutations exigent une authentification WebAuthn récente. Le dashboard ne reçoit ni clé S3, ni URL photo,
ni identifiant Customer Stripe et n’a aucun droit de modifier directement l’étape persistée.

## 1. Vision du projet

`histae-dashboard` est la console réservée aux administrateurs de Histae. Elle sert à observer l’état de la plateforme, modérer les signalements, gérer les mesures de sûreté, administrer les catalogues de traits et de questions de profil, et traiter les demandes relatives aux droits des personnes.

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

Un module `src/admin` isole les contrats, DTO, modèles de réponse, règles métier, accès PostgreSQL et contrôleur de la console.

### Session et synthèse

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/admin/me` | Vérifie que la session possède le rôle `admin` ou `superadmin`. |
| GET | `/api/admin/metrics` | Retourne la synthèse initiale et le CA Premium du mois en cours. |
| GET | `/api/admin/revenue` | Recalcule uniquement le CA Premium estimé pour la période demandée. |
| GET | `/api/admin/photo-reconciliation` | Liste les traitements photo anciens et suppressions en cours sans exposer les objets. |
| POST | `/api/admin/photo-reconciliation/:id/retry` | Remet une opération anormale dans l’outbox avec motif et audit transactionnel. |
| GET | `/api/admin/billing-reconciliation` | Liste les anomalies Stripe opérationnelles sans identifiant fournisseur. |
| GET | `/api/admin/content-moderation` | Liste les métadonnées des cas de photo, bio et réponse, sans contenu. |
| GET | `/api/admin/content-moderation/:id` | Ouvre le contenu après justification et audit. |
| PATCH | `/api/admin/content-moderation/:id` | Approuve ou rejette avec version optimiste, checklist photo et motif audité. |
| GET | `/api/admin/profile-questions` | Liste le catalogue avec le nombre de réponses liées. |
| POST | `/api/admin/profile-questions` | Ajoute une question. |
| PATCH | `/api/admin/profile-questions/:id` | Modifie son libellé, sa catégorie ou son ordre. |
| DELETE | `/api/admin/profile-questions/:id` | Supprime la question et toutes ses réponses associées. |

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
Une relance photo exige la même justification et produit `admin_reconcile_photo`. L’API refuse une photo `ready`,
un traitement récent et un événement encore possédé par un worker actif. Le dashboard ne reçoit aucune clé objet,
URL signée ou image dans cette file opérationnelle.

La file de modération ne reçoit que des métadonnées. L’ouverture du détail exige une justification et produit
`view_moderation_content` avant qu’un texte ou une URL photo courte soit délivré. Une décision exige son propre motif,
utilise la version affichée pour détecter une revue concurrente et produit `admin_review_content`. Le dashboard
n’affiche jamais de clé objet et ne peut pas contourner la checklist d’une photo.

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

Les anciens stores et view-models ont été supprimés avec leurs contrats obsolètes. Le nombre de dépendances de production est passé à un socle réduit : React, React Router, Axios, Material UI, Emotion et le client navigateur SimpleWebAuthn.

## 8. Authentification du dashboard

1. le dashboard demande des options de connexion WebAuthn anonymes à `/admin/auth/login/options` ;
2. le navigateur choisit une passkey découvrable et impose la vérification locale de l’utilisateur ;
3. `/admin/auth/login/verify` vérifie challenge, origine, RP ID, signature et compteur ;
4. l’API ouvre une session serveur courte dans un cookie `HttpOnly; SameSite=Strict` ;
5. `/admin/auth/session` relit le rôle, l’état du compte, la passkey et les expirations à chaque chargement ;
6. une réponse `401` ferme l’interface locale et renvoie vers la connexion ;
7. l’écran Sécurité ajoute des passkeys et révoque les autres sessions après une authentification récente.

La première passkey utilise un jeton d’enrôlement généré hors bande par l’API. Le dashboard ne conserve jamais ce
jeton après la cérémonie et ne reçoit jamais le secret de session. Les JWT/OTP mobiles ne sont acceptés par aucune
route administrative. Le développement utilise exclusivement `http://localhost:5173` avec le RP ID `localhost`.

## 9. Écrans disponibles

### Vue d’ensemble

- comptes actifs, bannis et onboardés ;
- créations des trente derniers jours ;
- signalements en attente ;
- demandes RGPD ouvertes ;
- contenus en attente de modération ;
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

### Questions de profil

- liste triée avec catégorie, code stable et nombre de réponses ;
- création et modification du libellé, de la catégorie et de l’ordre ;
- avertissement lorsque la modification affecte des réponses déjà visibles ;
- confirmation destructive indiquant le nombre de réponses supprimées en cascade avec la question.

### Demandes RGPD

- filtre par état ;
- transitions autorisées uniquement ;
- notes de traitement ;
- lancement asynchrone de l’effacement après confirmation irréversible et authentification récente ; suivi des étapes, actualisation et reprise auditée des dead letters, sans annulation après acceptation.

### Plans et journal d’accès

- catalogue commercial en lecture seule ;
- recherche des accès par UUID utilisateur ;
- affichage de l’acteur, de l’action, de la justification et de la date.

### Réconciliation des photos

- métriques des états `pending`, `processing`, `ready` et `deleting` ;
- compteurs des traitements bloqués, dead letters et suppressions sans événement ;
- filtres et pagination par curseur de la file opérationnelle ;
- diagnostic de l’état outbox et nombre de tentatives ;
- relance confirmée avec motif obligatoire, uniquement pour les anomalies actionnables.

### Réconciliation Stripe

- filtre abonnement/création Customer sur les seules dead letters actionnables ;
- diagnostic normalisé et dates de file, sans payload ni identifiant Stripe ;
- nouvelle vérification des dead letters avec confirmation et motif ;
- aucune action de paiement, d’annulation ou d’association manuelle dans le dashboard.

### Modération des contenus

- filtres par statut et type (`photo`, `bio`, `profile_answer`) avec pagination par curseur ;
- signaux automatiques et version de politique visibles sans exposer le contenu dans la liste ;
- justification préalable à l’ouverture du texte ou de la photo signée ;
- checklist explicite visage/netteté/contenu autorisé pour une photo ;
- approbation ou rejet motivé, protégé contre les décisions concurrentes ;
- actualisation de la file et du compteur de la vue d’ensemble après décision.

### Sécurité du compte

- connexion par passkey ou clé de sécurité, sans OTP, SSO ni fournisseur externe ;
- enrôlement initial par jeton temporaire affiché une seule fois par l’API ;
- liste des passkeys et indication de celle utilisée par la session courante ;
- ajout d’une passkey de secours ;
- révocation d’une passkey non courante, sans possibilité de supprimer la dernière ;
- fermeture de toutes les autres sessions administratives.

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

- suppression du stockage des tokens administrateur ; la session est exclusivement un cookie `HttpOnly` ;
- nettoyage automatique des anciennes clés `localStorage`/`sessionStorage` lors du chargement ;
- aucune donnée de session dans Zustand ou une persistance applicative ;
- aucune injection de HTML ;
- timeout réseau de quinze secondes ;
- aucune logique de refresh JWT dans le dashboard ;
- WebAuthn natif, vérification utilisateur obligatoire et écran de gestion des passkeys ;
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
- campagne complète hors intégration : 80 suites et 568 tests réussis ;
- 12 suites et 190 tests d’intégration PostgreSQL, ScyllaDB, Redis, stockage objet et coupures réseau réussis ;
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

Le serveur Vite transmet `/api` à l’API sans réécriture. Le navigateur doit ouvrir exactement
`http://localhost:5173`, et non `127.0.0.1`. L’API utilise par défaut `ADMIN_WEBAUTHN_ORIGIN=http://localhost:5173`
et `ADMIN_WEBAUTHN_RP_ID=localhost`. En production, le reverse proxy doit conserver le modèle même-origine `/api`
sur une origine HTTPS exacte.

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
- configurer l’origine HTTPS et le RP ID WebAuthn définitifs lors du choix du domaine de production.

### Exploitation

- créer et gouverner les comptes `admin` et `superadmin` ;
- imposer deux passkeys par compte, protéger la commande d’enrôlement et documenter la récupération hors bande ;
- définir les procédures de justification et revue des conversations ;
- surveiller les actions sensibles du journal d’accès ;
- définir le SLA, les habilitations et le soutien des reviewers, ainsi qu’une procédure de contestation ;
- définir des alertes sur les bannissements, décisions de modération et volumes anormaux de consultation.

### Tests futurs

- ajouter des tests de composants avec un serveur API simulé ;
- ajouter un scénario E2E avec PostgreSQL, Redis, Scylla et un compte administrateur de test ;
- vérifier un parcours WebAuthn réel avec plusieurs authenticators et la modération dans un environnement de staging ;
- tester le reverse proxy et les en-têtes du véritable hébergement.

## 18. Conclusion

Le dépôt n’est plus une adaptation partielle de l’ancien produit. Il constitue maintenant une console cohérente avec Histae API v3, centrée sur les responsabilités réellement présentes dans le backend et sur la traçabilité des opérations administratives.

Les anciens points forts — richesse de la fiche utilisateur, retours d’état, interface Material UI et séparation des responsabilités — ont été conservés sous une architecture plus compacte. Les contrats obsolètes, la persistance durable des tokens, les dépendances inutiles et les vulnérabilités connues ont été retirés.
