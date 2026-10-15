# Histae Dashboard — état du projet

Ce document décrit les capacités livrées. Le [README](README.md) couvre le démarrage, [test.md](test.md)
les vérifications, [SECURITY.md](SECURITY.md) la sécurité et [roadmap.md](roadmap.md) les travaux ouverts.

## Architecture

React 19, TypeScript strict, Vite 7, Material UI et Axios. Les pages sont chargées à la demande.
Le client appelle `/api` sur la même origine ; l’image finale Caddy sert le build statique et relaie l’API.
Les règles métier, permissions, transactions et traces d’audit restent dans l’API Rust.

| Dossier | Fonction |
| --- | --- |
| `api/`, `auth/` | Types et appels HTTP, WebAuthn et cycle de vie de la session |
| `pages/`, `routes/` | Écrans métier et accès protégés |
| `components/` | Présentation et interactions partagées |
| `hooks/`, `utils/` | Chargements, pagination, formatage et résolution des prénoms |

## Identité et rôles

WebAuthn utilise des passkeys découvrables avec vérification utilisateur. Le bootstrap à usage unique
est émis sur le serveur. La session opaque reste dans un cookie `HttpOnly; SameSite=Strict`, avec `Secure`
et préfixe `__Host-` en HTTPS. Les anciens tokens navigateur sont supprimés ; seul le thème est persisté.

Une invalidation ferme l’interface et vide le cache de prénoms. Une ancienne réponse de vérification de
session ne peut pas rétablir l’accès local. L’API continue de vérifier le rôle et la session à chaque appel.
Un admin justifie les accès sensibles ; le superadmin peut omettre le motif et reste audité.

## Écrans livrés

| Écran | Capacités |
| --- | --- |
| Vue d’ensemble | Comptes, matchs, modération, revenus bruts des factures payées et maintenance |
| Utilisateurs | Recherche/filtres, prénoms avec UUID au survol, fiche auditée, bannissement, promotion/retrait admin par le superadmin |
| Matchs et conversations | Liste paginée par compte, historique audité et messages en ordre chronologique |
| Signalements | Filtres et transitions `pending`, `reviewed`, `dismissed` |
| Modération | File minimisée, détail audité, checklist photo et décision versionnée |
| Traits et questions | Création, modification, ordre/catégorie et suppression confirmée |
| Demandes RGPD | Transitions, progression d’effacement asynchrone et reprise d’échec |
| Photos et Stripe | Diagnostics minimisés et reprise auditée des opérations actionnables |
| Outbox | Dead letters, reprise et abandon lorsque l’API l’autorise |
| Plans et crédits | Catalogue en lecture seule et quotas transmis par l’API dans les fiches |
| Journal d’accès | Recherche UUID, liste des admins, ouverture/fermeture du journal et export CSV |
| Sécurité | Passkeys, renommage/révocation, sessions et historique de sécurité |
| Supervision | Accès superadmin à Grafana, Prometheus et Alertmanager via Caddy |

L’effacement suit Stripe, photos, swipes puis anonymisation PostgreSQL. Une reprise ne réactive jamais
le compte et ne permet pas de modifier un checkpoint depuis le navigateur.

## Données et robustesse

Les listes évitent contenu de modération, coordonnées précises, téléphone, secrets et données Stripe brutes.
Les détails sensibles sont autorisés et audités. Les photos sont des URL signées courtes.
Les prénoms sont regroupés en lots ; les UUID restent disponibles au survol.

Les pages utilisent les curseurs opaques de l’API, dédupliquent les identifiants et ignorent les réponses
obsolètes. Les conversations sont isolées par identifiant de match lors d’un changement de sélection.
Le timeout HTTP est de 15 secondes ; aucune mutation n’est automatiquement rejouée.

Free dispose de 3 crédits inclus par semaine, d’un stock publicitaire maximal de 3 et d’un plafond de
6 continuations confirmées. Les deux participants Free paient seulement après deux accords.
Premium reste illimité et sans publicité. Le dashboard lit ces valeurs et l’état effectif dans l’API.

## Vérification et limites

`pnpm run check`, `pnpm run test:unit` et `pnpm run test:e2e` vérifient typage, lint, build, contrats simulés,
pagination, sessions et cérémonies WebAuthn Chromium virtuelles. Les résultats courants sont dans la
[revue fonctionnelle](../histae-api-rust/docs/feature-audit.md).

La validation du domaine réel, des authenticators matériels, de l’accessibilité et des procédures de reprise
reste nécessaire sur le serveur. Les recours de modération n’ont pas de parcours produit livré.
