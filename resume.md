# Histae Dashboard — état du projet

Mise à jour : 6 septembre 2026.

Ce document résume ce qui est livré. Il ne duplique ni le démarrage du [README](README.md), ni les procédures de
[test](test.md), ni les exigences de [sécurité](SECURITY.md), ni le travail restant de la [roadmap](roadmap.md).

## Rôle et architecture

Le dashboard est une application React 19, TypeScript strict, Vite 7 et Material UI. Axios appelle l’API sous
`/api`; React Router sépare la connexion des routes protégées. Le code est organisé ainsi :

```text
src/
  api/          client HTTP, WebAuthn, fonctions de contrat et types
  auth/         cycle de vie local de la session
  components/   composants et retours d’état partagés
  hooks/        chargements asynchrones
  pages/        écrans métier
  routes/       routes publiques et protégées
  utils/        formatage sans règle métier
```

Le dashboard n’est jamais une frontière de sécurité. Un bouton masqué ou désactivé améliore l’interface, mais toute
autorisation, relecture de rôle, authentification récente, validation et écriture d’audit reste imposée par l’API.

## Identité administrateur

- WebAuthn natif Histae, sans OTP mobile, mot de passe, SSO ou fournisseur d’identité ;
- passkeys découvrables avec vérification locale de l’utilisateur ;
- bootstrap initial par jeton hors bande court et à usage unique ;
- session opaque dans un cookie API `HttpOnly; SameSite=Strict` ;
- vérification serveur de la session au chargement des routes protégées ;
- redirection vers `/login` après un `401` privé ;
- aucune session, clé ou passkey persistée dans le stockage JavaScript ;
- ajout/révocation de passkeys et fermeture des autres sessions depuis l’écran Sécurité.

Les anciennes clés de tokens sont supprimées de `localStorage` et `sessionStorage` au chargement. Seule la préférence
non sensible `histae_theme` peut être conservée localement.

## Écrans livrés

| Écran | Capacités principales |
| --- | --- |
| Vue d’ensemble | métriques métier, revenu estimé, état et progression des maintenances bornées |
| Utilisateurs | recherche et filtres, profil minimisé, bannissement, matchs et conversations justifiés |
| Signalements | filtrage et transitions `pending`, `reviewed`, `dismissed` |
| Modération | file sans contenu, détail motivé, checklist photo, décision versionnée et auditée |
| Traits | création, renommage et suppression confirmée |
| Questions de profil | catalogue, ordre, catégorie et suppression avec nombre de réponses impactées |
| Demandes RGPD | transitions, effacement asynchrone, progression et reprise de dead letter |
| Photos | métriques techniques et reprise auditée des anomalies actionnables |
| Stripe | dead letters minimisées et nouvelle lecture fournisseur, sans action de paiement |
| Plans | catalogue commercial en lecture seule |
| Journal d’accès | recherche par utilisateur et historique paginé |
| Sécurité | passkeys et révocation des autres sessions |

Les demandes RGPD, consultations d’accès, utilisateurs, photos, modération et anomalies Stripe utilisent les contrats
de curseur disponibles. Les matchs et conversations administratives restent bornés par leur contrat actuel et sont
suivis dans D01.

## Données et actions sensibles

Le navigateur ne reçoit jamais le téléphone, son empreinte ou son chiffrement, les coordonnées géographiques
précises, une clé objet photo, un payload Stripe ou un moyen de paiement. Les listes de modération ne contiennent ni
texte ni image ; le détail exige un motif et une trace serveur.

Les actions suivantes demandent confirmation et/ou motif selon leur contrat : bannissement, consultation de
conversation, suppression de question, revue de contenu, réconciliation photo ou Stripe et reprise d’effacement.
Une décision de modération transporte sa version afin qu’un second reviewer ne puisse pas écraser silencieusement la
première décision.

L’effacement RGPD est présenté comme asynchrone : son acceptation désactive le compte, puis l’API poursuit Stripe,
photos, Scylla et PostgreSQL. Une reprise ne réactive jamais le compte et le dashboard ne peut pas modifier un
checkpoint directement.

## Robustesse de l’interface

- timeout HTTP de 15 secondes et aucune reprise automatique de mutation ;
- erreurs API affichées depuis l’enveloppe `{ error: { code, message } }` ;
- requêtes annulables et protection contre les réponses obsolètes sur les écrans concernés ;
- pagination par curseur avec filtres préservés ;
- chargement différé des pages ;
- états de chargement, erreur, absence de résultat et notifications accessibles ;
- thème clair/sombre et mise en page responsive.

## Tests livrés — D05

Vitest, Testing Library et MSW vérifient le client HTTP, les erreurs, l’expiration de session, l’absence de retry,
WebAuthn, les contrats de mutations critiques, les dialogues, notifications, filtres, curseurs et réponses
concurrentes. Les tests de sécurité contrôlent également l’absence de token persistant, de journal navigateur et de
secret ayant une forme de production dans les fixtures.

Playwright couvre la redirection d’une session expirée et une cérémonie complète d’enrôlement puis de connexion avec
un authenticator Chromium virtuel. Un smoke test facultatif vérifie en lecture seule `/health/ready` et la frontière
administrative d’une API locale. Voir [test.md](test.md).

## Limites connues

- les matchs et conversations ne parcourent pas encore toutes les pages disponibles ;
- la récupération WebAuthn après perte de tous les authenticators reste à formaliser ;
- le workflow de recours de modération n’est pas défini ;
- sécurité, accessibilité et en-têtes doivent encore être validés sur l’hébergement réel ;
- la supervision d’infrastructure appartient à l’outillage d’exploitation, pas au dashboard.

Le détail et les critères de fin sont centralisés dans [roadmap.md](roadmap.md).
