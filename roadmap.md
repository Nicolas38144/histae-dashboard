# Histae Dashboard — feuille de route

État au 5 septembre 2026.

Cette feuille de route contient uniquement les travaux encore ouverts du dashboard. Le comportement livré est
décrit dans [resume.md](resume.md), les exigences de déploiement dans [SECURITY.md](SECURITY.md) et le contrat HTTP
dans [`histae-api/routes.md`](../histae-api/routes.md). La roadmap de l'API reste la source de vérité pour les lots
backend R05 à R13.

Le dashboard facilite le travail des opérateurs, mais ne constitue jamais une frontière d'autorisation. Toute règle
de rôle, de réauthentification, de concurrence, d'audit ou de minimisation des données doit être imposée par l'API.

## Périmètre et principes

- Une liste potentiellement volumineuse utilise un curseur opaque ; aucun écran ne doit masquer un plafond fixe.
- Une action sensible présente sa portée, demande une confirmation et affiche le résultat réellement confirmé par
  l'API. Une désactivation asynchrone ne doit pas être présentée comme un effacement terminé.
- Une liste administrative n'expose que les informations nécessaires au tri. Le contenu sensible n'apparaît que dans
  un détail autorisé, motivé et audité.
- Les erreurs `401`, `403`, `409`, `429` et `5xx` restent distinguables. Le dashboard ne doit ni réessayer aveuglément
  une mutation ni interpréter une erreur réseau comme un succès.
- Grafana supervise l'infrastructure ; le dashboard reste centré sur les indicateurs métier et les décisions humaines.

## État acquis

- connexion WebAuthn native, cookie de session `HttpOnly` et refus des anciens tokens côté navigateur ;
- ajout/révocation de passkeys et fermeture des autres sessions ;
- vue d'ensemble, métriques métier et estimation de revenu ;
- utilisateurs, bannissements, signalements, traits, questions de profil et plans ;
- consultations motivées et auditées des profils, matchs et conversations ;
- file de modération avec détail motivé, checklist photo et version optimiste ;
- réconciliation photo et reprise auditée des dead letters ;
- dead letters Stripe filtrables et reprise auditée des seules anomalies persistantes ;
- suivi de l'effacement RGPD reprenable ;
- demandes RGPD et journal d’accès paginés par curseur, avec filtres préservés ;
- progression persistante des traitements bornés affichée dans la vue d’ensemble ;
- interface responsive, thème clair/sombre et pages chargées à la demande ;
- typecheck, lint, build de production et audit des dépendances disponibles.

Il n'existe pas encore de suite automatisée de composants ou de parcours navigateur dans ce dépôt. La validation
fonctionnelle repose donc encore en partie sur une inspection manuelle.

## Niveaux de priorité

| Niveau | Signification |
| --- | --- |
| P0 | Bloque une utilisation sûre du dashboard ou corrige une divergence de contrat avérée |
| P1 | Requis avant utilisation administrative en production |
| P2 | Requis avant augmentation sensible du volume ou du nombre d'opérateurs |
| P3 | Amélioration utile, à réaliser après mesure d'un besoin réel |

## Synthèse des lots

| Référence | Résultat attendu | Priorité | Dépendances | État |
| --- | --- | --- | --- | --- |
| D01 | Contrats et listes compatibles avec les volumes réels | P1/P2 | API R06 livrée | En cours |
| D03 | Recours de modération instruits et auditables | P1 avant ouverture | API R09, décisions produit | Bloqué par le workflow API |
| D04 | Récupération WebAuthn exploitable sans affaiblir l'identité | P1 | API R11, exploitation | À concevoir |
| D05 | Parcours sensibles couverts automatiquement | P1 | Fixtures et environnement de test | À faire |
| D06 | Version hébergée sécurisée, accessible et supervisée | P1 | Domaine et hébergement | À valider sur la cible |

## D01 — Contrats, pagination et volumes

### Risque traité

Les demandes RGPD et le journal d’accès suivent désormais les curseurs R06. Les matchs d’un utilisateur et les
messages d’un match restent consommés comme des tableaux bornés ; l’opérateur pourrait encore croire à tort qu’il
consulte l’historique entier.

### Travail

- [ ] Suivre les curseurs des matchs administratifs et permettre de charger les pages suivantes au-delà des
  100 premiers résultats.
- [ ] Paginer les conversations sans inverser localement une page comme si elle représentait tout l'historique ;
  préserver un ordre stable lors du chargement de messages plus anciens.
- [x] Paginer les demandes RGPD et le journal d’accès, préserver leur filtre/recherche et ignorer les réponses obsolètes.
- [ ] Vérifier utilisateurs, signalements, modération et réconciliation photo lorsque leurs contrats de curseur
  évoluent ; désactiver « Suivant » uniquement à partir du curseur renvoyé par l'API.
- [ ] Préserver filtres et recherche pendant la pagination et réinitialiser le curseur lorsqu'un filtre change.
- [x] Représenter les traitements par lots avec leur progression et leur dernier état persistant, sans extrapoler
  un pourcentage absent du contrat.
- [ ] Ajouter des fixtures de contrat pour les pages vide, initiale, intermédiaire et finale, ainsi que pour un curseur
  invalide ou devenu obsolète.

### Validation

- Jeu d'au moins deux pages par collection concernée.
- Aucun doublon, trou, inversion ou résultat d'un ancien filtre après navigation rapide.
- La réponse à une pagination retardée ne remplace pas les données d'un filtre plus récent.
- Les types TypeScript, libellés et états d'erreur correspondent à `histae-api/routes.md`.

### Critère de fin

Toutes les collections non catalogues peuvent être parcourues sans plafond implicite, et leur comportement est couvert
par des tests de contrat et de composant.

## D03 — Modération et recours

### Décisions préalables

Le produit doit définir qui peut contester, pendant combien de temps, le niveau d'explication fourni, le SLA, les
habilitations des reviewers et les cas nécessitant une seconde revue. Le dashboard ne doit pas inventer ces règles.

### Travail

- [ ] Ajouter une file dédiée aux recours, filtrable par état, type de contenu, âge et priorité définie par l'API.
- [ ] Garder les listes sans texte, image, URL signée ou clé objet ; demander un motif avant tout détail sensible.
- [ ] Afficher décision contestée, version de politique, explication destinée à l'utilisateur et historique utile,
  sans publier de score comme une certitude ni révéler des règles contournables.
- [ ] Protéger chaque décision par authentification récente, motif, version optimiste et audit serveur.
- [ ] Si une double revue est retenue, distinguer proposition, confirmation et conflit entre reviewers.
- [ ] Ajouter taille et âge de la file, respect du SLA et taux de décisions annulées aux indicateurs métier.
- [ ] Prévoir les états : contenu supprimé entre-temps, URL photo expirée, recours déjà traité, conflit et dépendance
  d'analyse indisponible.

### Validation

- Aucun contenu n'est chargé avant justification.
- Retour arrière et navigation n'affichent pas un détail sensible précédemment chargé sans nouvelle autorisation.
- Deux décisions concurrentes ne donnent jamais une confirmation trompeuse au second reviewer.
- Le parcours clavier et lecteur d'écran couvre ouverture, comparaison, décision et confirmation.

### Critère de fin

Un recours complet peut être reçu, instruit, décidé, expliqué et audité avec une exposition minimale des données et
sans contourner les garanties de l'API.

## D04 — Exploitation et récupération WebAuthn

### Risque traité

L'authentification est résistante au phishing, mais un administrateur possédant une seule passkey peut perdre tout
accès. Une récupération improvisée au moment de l'incident risquerait de devenir un contournement permanent.

### Travail

- [ ] Afficher un avertissement persistant tant que le compte ne possède pas au moins deux passkeys actives.
- [ ] Accompagner l'obligation serveur de deux passkeys, dont un moyen de secours conservé séparément.
- [ ] Expliquer clairement passkey courante, dernière utilisation, ajout, révocation et fermeture des autres sessions.
- [ ] Définir les écrans nécessaires au workflow hors bande retenu par R11, sans question secrète, mot de passe de
  secours ni session longue spéciale.
- [ ] Couvrir perte d'appareil, départ d'un administrateur, passkey compromise, compteur invalide et rôle révoqué.
- [ ] Vérifier sur la cible HTTPS l'origine exacte, le RP ID, le cookie `__Host-`, le proxy `/api` et l'absence de
  fonctionnement via une origine ou un sous-domaine inattendu.

### Validation

- Cérémonies WebAuthn testées avec au moins deux authenticators distincts.
- La passkey courante et la dernière passkey restent impossibles à révoquer.
- Une session liée à une passkey révoquée cesse immédiatement d'autoriser les routes administratives.
- La procédure de récupération laisse une trace d'audit et n'abaisse pas durablement le niveau d'authentification.

### Critère de fin

La perte ou la compromission d'un authenticator possède une procédure répétable, testée et auditable qui ne dépend ni
d'un SSO ni d'un fournisseur d'identité externe.

## D05 — Tests automatisés

### Socle recommandé

- Vitest et Testing Library pour les composants et hooks ;
- Mock Service Worker pour simuler le contrat HTTP sans réimplémenter Axios ;
- Playwright pour les parcours navigateur, avec authenticator virtuel Chromium pour les scénarios WebAuthn ciblés.

Ces outils sont des dépendances de développement, pas des services de production.

### Travail

- [ ] Ajouter les scripts `test:unit`, `test:e2e` et `test` sans remplacer `check`.
- [ ] Tester le client HTTP : timeout, absence de réponse, enveloppe d'erreur, expiration de session et absence de
  retry automatique des mutations.
- [ ] Tester chargement, erreur, absence de résultat, annulation, filtres, curseurs, dialogues et notifications.
- [ ] Couvrir les parcours critiques : connexion, ajout/révocation de passkey, bannissement, signalement, suppression
  de question, revue concurrente, reprise photo, dead letter et effacement RGPD.
- [ ] Vérifier qu'aucun token, contenu de modération ou détail personnel ne rejoint `localStorage`, `sessionStorage`,
  une URL, un log navigateur ou une fixture versionnée.
- [ ] Ajouter un petit parcours E2E contre l'API et les stockages locaux avec des identifiants et données temporaires.
- [ ] Documenter l'isolation, la remise à zéro et les prérequis des tests réels.

### Critère de fin

Une régression d'autorisation visible, de contrat, de concurrence ou d'exposition de donnée échoue automatiquement ;
les tests réels ne dépendent d'aucun compte ni contenu de production.

## D06 — Sécurité, accessibilité et déploiement

### Travail

- [ ] Choisir l'URL définitive et servir le dashboard et `/api` sous la même origine HTTPS.
- [ ] Appliquer puis vérifier sur les réponses réellement hébergées CSP, HSTS, `Cache-Control`, `Permissions-Policy`,
  anti-framing, politique de référent et type MIME définis dans [SECURITY.md](SECURITY.md).
- [ ] Restreindre l'accès réseau au dashboard selon l'exploitation retenue, sans considérer cette restriction comme
  une autorisation métier.
- [ ] Vérifier qu'aucune source map, variable de développement, URL interne ou ancienne clé de session n'est publiée.
- [ ] Tester navigation clavier, ordre du focus, dialogues, contrastes, zoom à 200 %, tableaux et annonces des erreurs,
  puis corriger les écarts WCAG retenus pour le produit.
- [ ] Définir les navigateurs supportés et tester au minimum leurs versions représentatives sur desktop et mobile.
- [ ] Surveiller disponibilité, erreurs de chargement et validité TLS sans envoyer de donnée personnelle à un outil
  tiers non approuvé.
- [ ] Écrire les procédures de déploiement, retour arrière, révocation urgente et vérification après livraison.

### Critère de fin

Le build déployé, et pas seulement le serveur Vite local, respecte les contrôles de sécurité et d'accessibilité ; une
livraison et un retour arrière ont été répétés sur l'environnement cible.

## Dépendances et hors périmètre

- R09 et R11 doivent définir leurs contrats côté API avant les écrans correspondants. Les contrats R06 utilisés par
  le dashboard sont livrés ; D01 reste ouvert pour les matchs, conversations et tests de composants.
- Les alertes techniques R08 appartiennent à Prometheus/Grafana et à l'exploitation. Le dashboard peut afficher une
  synthèse métier, mais ne doit pas devenir l'unique canal d'alerte.
- Sauvegardes, restauration des bases et stockage objet relèvent de R10 côté infrastructure.
- Les textes juridiques, durées de conservation et habilitations finales relèvent de décisions compétentes ; le
  dashboard les applique mais ne les invente pas.
- L'autorisation ne doit jamais être déplacée dans React sous prétexte d'améliorer l'expérience utilisateur.

## Ordre conseillé

1. D05 en premier : il sécurise toutes les évolutions suivantes.
2. Terminer D01 sur les matchs, conversations et tests de pagination.
3. D04 avant tout accès administratif en production.
4. D03 avec R09 avant d'ouvrir la modération et les recours à une équipe réelle.
5. D06 pendant la préparation du domaine et de l'hébergement définitifs.

## Définition de fini commune

Un lot n'est terminé que si :

- le contrat API correspondant est documenté et ses types sont à jour ;
- chargement, succès, absence de résultat, erreur, concurrence et session expirée sont traités ;
- les permissions et invariants sont testés côté API, pas seulement masqués dans l'interface ;
- aucune donnée supplémentaire n'est exposée pour simplifier l'écran ;
- navigation clavier et libellés accessibles ont été vérifiés ;
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` et les tests concernés réussissent ;
- `resume.md`, `SECURITY.md` et cette feuille de route sont ajustés sans dupliquer l'historique du lot.

Après validation, déplacer le résultat durable dans `resume.md` ou `SECURITY.md`, puis retirer le détail terminé de
cette feuille de route.
