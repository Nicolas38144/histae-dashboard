# Histae Dashboard — feuille de route

État au 6 septembre 2026.

Ce document contient uniquement les travaux ouverts. Les capacités livrées sont dans [resume.md](resume.md), la
validation dans [test.md](test.md), la sécurité dans [SECURITY.md](SECURITY.md) et le contrat dans
[`histae-api/routes.md`](../histae-api/routes.md).

L’API reste la frontière d’autorisation. Aucun lot du dashboard ne doit déplacer une règle de rôle, de concurrence,
de réauthentification ou d’audit dans React.

## État acquis

| Lot | Résultat durable |
| --- | --- |
| R02/R05/R06 | effacement reprenable, anomalies Stripe actionnables et progression des maintenances |
| Modération | liste minimisée, détail justifié, checklist photo et décision optimiste |
| Identité | connexion WebAuthn, gestion des passkeys et cookie de session inaccessible au JavaScript |
| D05 | Vitest/Testing Library/MSW, parcours Playwright WebAuthn et smoke test API local facultatif |
| D01 | pagination complète, déduplication, filtres stables et conversations en ordre chronologique |

## Priorités

| Lot | Objectif | Priorité | Dépendance |
| --- | --- | --- | --- |
| D04 | rendre la récupération WebAuthn exploitable | P1 avant production | API R11, exploitation |
| D03 | instruire et auditer les recours de modération | P1 avant ouverture | API R09, produit |
| D06 | valider sécurité, accessibilité et déploiement réels | P1 avant production | domaine et hébergement |

## D04 — Exploitation et récupération WebAuthn

### Travail

- [ ] avertir tant qu’un administrateur possède moins de deux passkeys actives ;
- [ ] accompagner l’obligation serveur d’un moyen de secours distinct ;
- [ ] définir le workflow hors bande de récupération sans mot de passe ou question secrète ;
- [ ] couvrir perte d’appareil, départ, compromission, compteur invalide et rôle révoqué ;
- [ ] vérifier sur HTTPS l’origine, le RP ID, le cookie `__Host-` et le proxy `/api`.

### Critère de fin

La perte ou compromission d’un authenticator possède une procédure répétable et auditée qui ne dépend d’aucun SSO et
n’abaisse pas durablement la sécurité.

## D03 — Modération et recours

### Décisions nécessaires

Le produit doit fixer délai de recours, explication utilisateur, SLA, habilitations et éventuelle double revue. Le
dashboard ne doit pas inventer ces règles.

### Travail

- [ ] ajouter une file de recours filtrable sans contenu sensible dans la liste ;
- [ ] afficher politique, décision contestée, explication publique et historique strictement nécessaire ;
- [ ] protéger détail et décision par motif, authentification récente, version et audit serveur ;
- [ ] traiter conflits, contenu supprimé, photo expirée et recours déjà clos ;
- [ ] exposer taille, âge, SLA et décisions annulées sous forme agrégée.

### Critère de fin

Un recours peut être reçu, instruit, expliqué et audité avec exposition minimale des données et gestion explicite de
la concurrence.

## D06 — Sécurité, accessibilité et déploiement

### Travail

- [ ] choisir l’URL définitive et servir le dashboard avec `/api` sous la même origine HTTPS ;
- [ ] vérifier CSP, HSTS, cache, permissions, anti-framing et type MIME sur les réponses réellement hébergées ;
- [ ] confirmer l’absence de source map, secret, URL interne et fichier de développement dans l’artefact ;
- [ ] définir un budget de chargement et mesurer le découpage du bundle partagé sur l’hébergement cible ;
- [ ] tester clavier, focus, dialogues, contrastes, zoom à 200 % et lecteur d’écran ;
- [ ] définir et tester les navigateurs représentatifs ;
- [ ] superviser disponibilité, erreurs de chargement et certificat sans suivi individuel ;
- [ ] répéter déploiement, retour arrière et révocation urgente.

### Critère de fin

Le build hébergé — et pas seulement Vite local — respecte les contrôles de sécurité et d’accessibilité, et une
livraison comme un retour arrière ont été réellement exécutés.

## Ordre conseillé

1. D04 avant tout accès administratif en production.
2. D03 avec les décisions R09.
3. D06 sur l’hébergement cible.

Mettre cette roadmap à jour à la fin de chaque lot. Une fois un lot terminé, déplacer uniquement ses invariants
durables dans `resume.md`, `SECURITY.md` ou `test.md` puis retirer son détail d’ici.
