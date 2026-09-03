# Histae Dashboard

Console d’administration et de modération de Histae, alignée sur le contrat de `histae-api` v3.

## Prérequis

- Node.js 22 ou supérieur
- pnpm 11.22.0
- une instance de `histae-api` configurée
- un compte Histae possédant le rôle `admin` ou `superadmin`
- un navigateur compatible WebAuthn et une passkey ou clé de sécurité

## Démarrage

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

En développement, ouvrez exactement **`http://localhost:5173`**. Vite transmet `/api` à
`VITE_API_PROXY_TARGET`, configuré par défaut sur `http://localhost:8080`. N’utilisez pas `127.0.0.1` pour le
dashboard : le RP ID WebAuthn de développement est `localhost`.

L’authentification administrateur est native à Histae, sans SSO ni fournisseur externe. Elle n’utilise ni l’OTP
mobile, ni un token accessible au JavaScript : l’API conserve la session dans un cookie `HttpOnly`, strictement
même-origine. Pour la première connexion, appliquez `007_native_admin_webauthn`, puis générez depuis le dépôt API
un jeton temporaire :

```powershell
pnpm run admin:webauthn:bootstrap -- <uuid-du-compte-admin>
```

Collez ce jeton dans « Enregistrer la première passkey ». Il expire après quinze minutes par défaut et n’est
utilisable qu’une fois.

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

L’écran « Sécurité » liste les passkeys, en ajoute une après authentification WebAuthn récente, permet de révoquer
une clé non courante sans jamais supprimer la dernière et ferme les autres sessions. Deux passkeys distinctes,
dont idéalement une clé physique de secours, sont recommandées.

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

Le dashboard et l’API doivent être publiés sous la même origine, l’API étant exposée via `/api`. En production,
cette origine doit être HTTPS et correspondre exactement à `ADMIN_WEBAUTHN_ORIGIN`; son hôte doit correspondre à
`ADMIN_WEBAUTHN_RP_ID`. Cloudflare peut transporter le trafic, mais ne participe ni à l’identité ni aux passkeys.

Le serveur frontal doit reproduire les en-têtes décrits dans [SECURITY.md](SECURITY.md), servir l’application uniquement en HTTPS et rediriger les routes SPA vers `index.html`.

## Documentation

- [Résumé technique et fonctionnel](resume.md)
- [Sécurité et déploiement](SECURITY.md)
- [Contrat exhaustif de l’API](https://github.com/Nicolas38144/histae-api/blob/main/routes.md)
