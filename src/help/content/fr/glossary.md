---
title: Glossaire
summary: De courtes explications des termes utilisés dans Axentra et le Studio, avec des liens vers les détails.
keywords: glossaire, termes, définitions, vocabulaire, signification, qu’est-ce que, dictionnaire, lexique
---

De courtes définitions des termes utilisés dans le Studio et dans cette aide. Chaque entrée renvoie
vers l’article qui donne les détails. Les entrées suivent l’ordre alphabétique des termes anglais
indiqués entre parenthèses.

## Clé d’API (API key) {#api-key}

Identifiants destinés aux machines (format `axk_…`) qui appellent l’API Axentra pour un produit,
avec une liste explicite d’autorisations et éventuellement liés à un locataire. Voir
[Clés d’API](help:api-keys).

## Archiver (archive) {#archive}

Mettre un produit hors service sans le supprimer. Seuls les administrateurs de la plateforme
peuvent encore travailler dans un produit archivé ; il peut être restauré. Voir
[Produits](help:products).

## Journal d’audit (audit log) {#audit-log}

L’enregistrement, en ajout seul, de qui a modifié quoi et quand sur le serveur, avec le résultat,
l’ID de requête et l’adresse IP. Voir [Journal d’audit](help:audit).

## Rôle intégré (built-in role) {#built-in-role}

Un rôle fourni par Axentra dans chaque produit, comme **Product admin**, **Owner** ou **Viewer**.
Il ne peut pas être modifié. Voir la
[référence des autorisations](help:permissions-reference#built-in-roles).

## Paiement (checkout) {#checkout}

Le paiement d’une offre sur la page hébergée du prestataire de paiement. Le Studio ne traite
jamais de données de carte. Voir [Offres et abonnements](help:plans-subscriptions).

## Collection {#collection}

Un groupe nommé d’enregistrements dans un locataire, par exemple `contacts`. Voir
[Enregistrements](help:records).

## Expression cron (cron expression) {#cron-expression}

Cinq champs (minute, heure, jour du mois, mois, jour de la semaine) qui décrivent quand une
planification s’exécute, toujours en UTC. Voir [Planifications](help:schedules).

## CSRF {#csrf}

Falsification de requête intersites (cross-site request forgery) : une attaque dans laquelle un
autre site web tente d’envoyer des modifications via ton navigateur connecté. Le Studio et le
serveur la bloquent automatiquement. Voir [Sécurité](help:security#csrf).

## Rôle personnalisé (custom role) {#custom-role}

Un rôle défini pour un produit avec un ensemble choisi d’autorisations, pour un produit ou un
locataire. Voir [Rôles et autorisations](help:roles-permissions).

## Livraison (delivery) {#delivery}

Une série de tentatives d’envoi d’un événement à un point de terminaison de webhook, avec statut,
réponse et nouvelles tentatives. Voir [Webhooks](help:webhooks).

## Droit (entitlement) {#entitlement}

Une fonctionnalité (activée ou non) ou une limite qu’une offre accorde aux locataires qui y sont
abonnés. Voir [Offres et abonnements](help:plans-subscriptions).

## Événement (event) {#event}

Un message de ton produit signalant que quelque chose s’est produit, par exemple
`invoice.created`. Les événements peuvent déclencher des webhooks et des gestionnaires. Voir
[Événements](help:events).

## Délai de grâce (grace period) {#grace-period}

La durée après un renouvellement de secret pendant laquelle l’ancien secret fonctionne encore
(7 jours au maximum), pour que les services puissent basculer sans interruption. Voir
[Clés d’API](help:api-keys) et [Webhooks](help:webhooks).

## Clé d’idempotence (idempotency key) {#idempotency-key}

Une valeur unique envoyée avec une requête pour que la répétition de la même requête ne l’exécute
pas deux fois. Réutiliser une clé avec des valeurs différentes est refusé. Voir
[Dépannage](help:troubleshooting#idempotency-conflict).

## Invitation {#invitation}

Une proposition de rejoindre un locataire avec un rôle donné, envoyée à une adresse e-mail. Son
lien et son jeton ne sont affichés qu’une fois. Voir
[Membres et invitations](help:members-invitations).

## Tâche (job) {#job}

Un traitement d’arrière-plan exécuté par un worker, avec de nouvelles tentatives en cas d’échec.
Voir [Tâches](help:jobs).

## Membre (member) {#member}

Un utilisateur qui appartient à un locataire avec un rôle de locataire. C’est aussi le nom du rôle
de locataire intégré **Member**, qui travaille avec les données du locataire. Voir
[Membres et invitations](help:members-invitations).

## Compteur (meter) {#meter}

Une grandeur que mesure un produit, comme les appels d’API ou le stockage, ainsi que la façon dont
elle est agrégée (somme, maximum ou dernière valeur) et réinitialisée. Voir
[Utilisation](help:usage).

## Module {#module}

Une brique du serveur Axentra (par exemple `storage` ou `billing`) qu’un opérateur peut activer ou
désactiver. Voir la [référence des modules](help:modules-reference).

## Mode multi-produit (multi-product mode) {#multi-product-mode}

Un mode de serveur dans lequel une installation héberge plusieurs produits, créés par les
administrateurs de la plateforme. Voir [Concepts](help:concepts).

## Rang de propriétaire (owner rank) {#owner-rank}

Le rang particulier des rôles **Owner** (locataire) et **Product owner** : seul un propriétaire de
la même portée, ou une personne ayant autorité à un niveau supérieur, peut l’attribuer ou le
retirer. Voir [Plafond de rôle](help:security#role-ceiling).

## Autorisation (permission) {#permission}

Un droit unique écrit sous la forme `resource:action`, par exemple `files:write`, avec une portée
plateforme, produit ou locataire. Voir la [référence des autorisations](help:permissions-reference).

## Offre (plan) {#plan}

Une formule avec des prix et des droits, à laquelle les locataires s’abonnent. Voir
[Offres et abonnements](help:plans-subscriptions).

## Rôle sur la plateforme (platform role) {#platform-role}

Un rôle à l’échelle de l’installation : **Administrateur de la plateforme** (tout) ou **Lecteur de
la plateforme** (accès en lecture partout). Seuls les administrateurs de la plateforme peuvent
l’accorder. Voir [Utilisateurs](help:users).

## Produit (product) {#product}

Une application qui tourne sur le serveur Axentra, avec ses propres locataires, rôles, clés et
données. Voir [Produits](help:products).

## Opérateur du produit (product operator) {#product-operator}

Un utilisateur disposant d’un rôle de produit, comme **Product owner** ou **Support**, qui
travaille sur le produit dans son ensemble. Voir [Produits](help:products).

## Autorisation du produit (product permission) {#product-permission}

Une autorisation qu’un produit déclare lui-même, nommée par exemple `crm.deals:approve`. Voir la
[référence des autorisations](help:permissions-reference#product-defined).

## Quota {#quota}

Une limite supérieure de l’utilisation ou du stockage d’un locataire. La dépasser donne
[Quota dépassé](help:troubleshooting#quota-exceeded). Voir [Utilisation](help:usage).

## Enregistrement (record) {#record}

Un objet JSON stocké dans une collection d’un locataire. Voir [Enregistrements](help:records).

## ID de requête (request ID) {#request-id}

L’identifiant `req_…` de chaque requête au serveur, affiché dans les détails des erreurs et dans le
journal d’audit ; la clé pour le support. Voir [Dépannage](help:troubleshooting#request-id).

## Réservation (reservation) {#reservation}

Une utilisation réservée à l’avance, puis validée avec la quantité réelle ou libérée. Voir
[Utilisation](help:usage).

## Rôle (role) {#role}

Un ensemble nommé d’autorisations attribué à des personnes (ou, sous forme de liste
d’autorisations, à des clés d’API). Voir [Rôles et autorisations](help:roles-permissions).

## Plafond de rôle (role ceiling) {#role-ceiling}

La règle selon laquelle personne ne peut attribuer un rôle comportant des autorisations qu’il ne
possède pas lui-même. Voir [Sécurité](help:security#role-ceiling).

## Renouvellement (rotation) {#rotation}

Le remplacement d’un secret par un nouveau, éventuellement avec un délai de grâce. Voir
[Clés d’API](help:api-keys).

## Sécurité au niveau des lignes (row-level security) {#row-level-security}

Une fonctionnalité de la base de données qui limite chaque transaction aux lignes d’un produit ou
d’un locataire, comme seconde ligne de défense derrière les vérifications d’autorisations. Voir
[Sécurité](help:security#tenant-isolation).

## Planification (schedule) {#schedule}

Une règle qui met une tâche en file d’attente à intervalles fixes ou selon des horaires cron. Voir
[Planifications](help:schedules).

## Session {#session}

L’état connecté d’un navigateur. Elle prend fin après une durée de vie maximale, après une période
d’inactivité, à la déconnexion ou lorsqu’elle est révoquée. Voir [Sécurité](help:security#sessions).

## Jeton d’installation (setup token) {#setup-token}

Un jeton à usage unique, affiché sur le serveur, qui permet de créer le premier administrateur de
la plateforme. Voir [Première installation](help:first-run-setup).

## Secret de signature (signing secret) {#signing-secret}

Le secret (`whsec_…`) avec lequel Axentra signe les requêtes de webhook (HMAC-SHA256) pour que les
destinataires puissent les vérifier. Voir [Webhooks](help:webhooks) et
[Sécurité](help:security#webhook-signing).

## Mode mono-produit (single-product mode) {#single-product-mode}

Un mode de serveur avec exactement un produit, créé à partir de la configuration du serveur ; il
est impossible de créer ou d’archiver des produits. Voir [Concepts](help:concepts).

## Slug {#slug}

Un identifiant court, utilisable dans une URL, d’un produit ou d’un locataire, par exemple `acme`.
Il est unique et ne peut pas contenir d’espaces. Voir [Locataires](help:tenants).

## Abonnement (subscription) {#subscription}

La souscription d’un locataire à une offre, avec un statut (par exemple essai, actif, en retard de
paiement) et une période. Voir [Offres et abonnements](help:plans-subscriptions).

## Suspendre (suspend) {#suspend}

Bloquer l’accès à un locataire sans supprimer ses données. Il peut être réactivé. Voir
[Locataires](help:tenants).

## Modèle (template) {#template}

Un e-mail de notification avec des variantes linguistiques et des variables. Voir
[Notifications](help:notifications).

## Locataire (tenant) {#tenant}

Un client ou une organisation au sein d’un produit. Les données de chaque locataire sont
strictement séparées. Voir [Locataires](help:tenants).

## UTC {#utc}

Le temps universel coordonné, base horaire de toutes les planifications. Le Studio affiche les
heures dans ton propre fuseau horaire lorsque c’est possible.

## Webhook {#webhook}

Une requête HTTP signée qu’Axentra envoie à un autre système lorsqu’un événement se produit. Voir
[Webhooks](help:webhooks).

## Worker {#worker}

Un processus serveur qui exécute les tâches, les planifications et les livraisons de webhooks. Sans
worker en service, les tâches restent en file d’attente. Voir [Tâches](help:jobs).
