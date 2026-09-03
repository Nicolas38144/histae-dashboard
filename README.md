# Histae Dashboard

Console d’administration et de modération de Histae, alignée sur le contrat de `histae-api` v3.

## Prérequis

- Node.js 22 ou supérieur
- pnpm 11.22.0
- une instance de `histae-api` configurée
- un compte Histae possédant le rôle `admin` ou `superadmin`

## Démarrage

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

En développement, Vite transmet `/api` à `VITE_API_PROXY_TARGET`, configuré par défaut sur `http://localhost:8080`.

La vue d’ensemble inclut un CA estimé calculé à partir des abonnements Premium et du tarif mensuel courant.
Les périodes proposées sont les 7 ou 30 derniers jours, le mois en cours, le mois précédent, l’année en cours
et l’historique complet. Cette valeur ne remplace pas un registre de paiements réel.
Le premier affichage fait partie de la synthèse générale ; les changements de période rechargent ensuite
uniquement la carte CA via `/api/admin/revenue`, avec un indicateur de progression local.

L’écran « Photos » affiche les métriques `user_photo`, les traitements bloqués et les suppressions en cours. Il
permet de remettre en file une opération réellement anormale avec un motif obligatoire ; l’API protège et audite
la mutation et ne transmet au dashboard ni clé objet, ni URL signée, ni contenu d’image.

L’écran « Questions de profil » administre le catalogue présenté dans l’application mobile. Il permet d’ajouter,
modifier et réordonner les questions. Avant une suppression définitive, il affiche le nombre de réponses
utilisateur qui seront également supprimées par l’API.

L’écran « Modération » centralise les photos, bios et réponses libres. La liste n’expose aucun contenu ; un motif
est demandé avant d’ouvrir le détail audité, puis un second motif accompagne toute décision. La revue photo exige
de confirmer séparément le visage, la netteté et le contenu autorisé. Les versions de cas empêchent d’écraser une
décision concurrente.

## Commandes

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run check
pnpm run security:audit
```

`pnpm run check` exécute le typecheck, le lint et le build de production. npm n’est plus utilisé et aucun `package-lock.json` ne doit être créé.

## Déploiement

Le mode recommandé publie le dashboard et expose l’API sous la même origine via `/api`. Si les deux applications utilisent des origines distinctes, configurez `VITE_API_URL` avec l’URL HTTPS complète et ajoutez exactement l’origine du dashboard dans `CORS_ORIGINS` côté API.

Le serveur frontal doit reproduire les en-têtes décrits dans [SECURITY.md](SECURITY.md), servir l’application uniquement en HTTPS et rediriger les routes SPA vers `index.html`.

## Documentation

- [Résumé technique et fonctionnel](resume.md)
- [Sécurité et déploiement](SECURITY.md)
- [Contrat exhaustif de l’API](https://github.com/Nicolas38144/histae-api/blob/main/routes.md)
