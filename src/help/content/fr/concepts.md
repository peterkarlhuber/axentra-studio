---
title: Concepts clés
summary: Les briques d’Axentra expliquées simplement, de la plateforme et du produit au locataire, au rôle, à l’autorisation et à la clé d’API.
keywords: termes, terminologie, notions de base, modèle, hiérarchie, plateforme, produit, locataire, tenant, client, organisation, utilisateur, membre, opérateur, invitation, rôle, autorisation, permission, module, clé d’API, API, produit unique, multi-produit, mode
---

Cet article explique les termes que tu rencontres partout dans Studio et la façon dont ils s’articulent. Lis-le
une fois avant de commencer ; le [glossaire](help:glossary) contient des définitions courtes à consulter ensuite.

```diagram
hierarchy
```

## Plateforme (installation) {#platform}

La **plateforme** correspond à un serveur Axentra et à sa base de données. Les comptes utilisateur existent une seule fois par plateforme
et peuvent appartenir à plusieurs produits. Les pages de Studio qui concernent toute la plateforme sont **Produits**,
**Journal d’audit**, **État du système**, **Supervision** et **Paramètres**.

### Rôles sur la plateforme {#platform-roles}

Un utilisateur peut détenir un rôle sur la plateforme, qui s’applique à **tous les produits** du serveur :

| Rôle sur la plateforme                             | Ce qu’il permet                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Administrateur de la plateforme (`platform_admin`) | Contrôle total de l’installation : créer et archiver des produits, gérer tous les utilisateurs et leurs rôles sur la plateforme, tout consulter. |
| Lecteur de la plateforme (`platform_viewer`)       | Accès en lecture à l’ensemble de l’installation.                                                                                                 |

Le premier administrateur de la plateforme est créé lors de l’[installation initiale](help:first-run-setup).
Les autres rôles sur la plateforme s’attribuent sur la page d’un utilisateur (voir [utilisateurs](help:users)). Le dernier
administrateur de la plateforme ne peut être ni désactivé ni privé de ce rôle.

## Produit {#product}

Un **produit** est une application qui fonctionne sur la plateforme, par exemple « Example CRM ». Chaque
produit possède ses propres locataires, rôles, clés d’API, données, offres et modèles, isolés de tous les autres
produits. La plupart des pages de Studio appartiennent à un produit ; l’adresse commence alors par
`/p/<product id>/` et le [sélecteur de produit](help:interface#product-switcher) indique lequel.

Les personnes qui gèrent un produit dans son ensemble sont les **opérateurs de produit**. Elles détiennent un rôle de produit :

| Rôle de produit intégré                   | En bref                                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Product owner (propriétaire du produit)   | Contrôle total du produit. La personne qui crée un produit en devient propriétaire.                                                           |
| Product admin (administrateur du produit) | Gère les locataires, les rôles, les clés et les données ; ne peut pas gérer les opérateurs de produit ni déclarer d’autorisations de produit. |
| Support                                   | Consulte tout le contenu du produit et gère les membres des locataires dans la limite de ses propres autorisations.                           |
| Product viewer (lecteur du produit)       | Accès en lecture seule au produit.                                                                                                            |

Un rôle de produit qui contient des autorisations de locataire les accorde dans **tous** les locataires du produit.
Consulte les [produits](help:products).

## Locataire {#tenant}

Un **locataire** est un client ou une organisation au sein d’un produit, par exemple « Acme Ltd ». Les données
des différents locataires sont strictement séparées, y compris dans la base de données (sécurité au niveau des lignes). Un locataire
est **actif** ou **suspendu** ; la suspension bloque ses membres et ses clés d’API liées au locataire sans
supprimer de données. Consulte les [locataires](help:tenants).

## Utilisateur {#user}

Un **utilisateur** est une personne qui possède un compte sur la plateforme, généralement identifiée par une adresse e-mail.
Le même compte peut être membre de plusieurs locataires et opérateur de plusieurs produits. Un utilisateur
peut être **actif** ou **désactivé** ; la désactivation met fin immédiatement à toutes ses sessions.

Les comptes ne sont pas créés dans Studio. Ils proviennent de l’[installation initiale](help:first-run-setup), d’une connexion par
[authentification unique](help:signing-in#sso) ou du code de ton propre produit (Axentra utilisé comme
bibliothèque). Consulte les [utilisateurs](help:users).

## Membre {#member}

Un **membre** est un utilisateur qui détient un **rôle de locataire** dans un locataire. C’est l’adhésion qui donne à une personne
l’accès aux données d’un locataire. Rôles de locataire intégrés :

| Rôle de locataire intégré | En bref                                                                   |
| ------------------------- | ------------------------------------------------------------------------- |
| Owner (propriétaire)      | Contrôle total du locataire.                                              |
| Admin (administrateur)    | Gère les membres et les données du locataire.                             |
| Member (membre)           | Travaille avec les données du locataire. Rôle par défaut des invitations. |
| Viewer (lecteur)          | Accès en lecture seule au locataire.                                      |

Ne confonds pas les membres d’un locataire avec les **opérateurs de produit** (membres du produit), qui détiennent un rôle
de produit. Consulte les [membres et invitations](help:members-invitations).

## Invitation {#invitation}

Une **invitation** propose à une personne, via son adresse e-mail, de rejoindre un locataire avec un
rôle donné. Elle contient un jeton à usage unique, reste valable 7 jours et peut être révoquée. La
personne invitée l’accepte en étant connectée avec un compte qui possède **la même adresse e-mail**.
Les opérateurs de produit peuvent être invités dans l’équipe d’un produit de la même façon. Consulte
les [membres et invitations](help:members-invitations).

## Rôle {#role}

Un **rôle** est un ensemble nommé d’autorisations. Axentra fournit des rôles intégrés (ci-dessus) qui ne peuvent pas être
modifiés. Un produit peut ajouter des **rôles personnalisés** dotés d’une **portée** :

- Portée **Locataire** : attribué aux membres des locataires, ne contient que des autorisations de locataire.
- Portée **Produit** : attribué aux opérateurs de produit, peut contenir des autorisations de produit et de locataire.

Consulte les [rôles et autorisations](help:roles-permissions).

## Autorisation {#permission}

Une **autorisation** est un droit unique noté `resource:action`, par exemple `tenants:create` ou
`records:write`. L’accès est refusé tant qu’un rôle ou une clé d’API n’accorde pas explicitement l’autorisation.
Chaque autorisation a une portée :

| Portée     | Signification                                                                                             | Exemples                                            |
| ---------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Plateforme | Valable pour toute l’installation ; seuls les rôles sur la plateforme l’accordent, jamais les clés d’API. | `products:create`, `users:manage`                   |
| Produit    | Concerne un produit dans son ensemble.                                                                    | `tenants:create`, `api_keys:manage`, `roles:manage` |
| Locataire  | Concerne les données d’un locataire.                                                                      | `members:manage`, `records:read`, `files:write`     |

Les produits peuvent aussi déclarer leurs **propres autorisations**, avec un espace de noms et un point, par exemple
`crm.deals:approve`. La liste complète figure dans la [référence des autorisations](help:permissions-reference).

### Plafond des rôles {#role-ceiling}

Avoir le droit de gérer des membres ne signifie pas que tu peux attribuer n’importe quel rôle. Tu ne peux attribuer un rôle que
si tu détiens toi-même **toutes les autorisations de ce rôle** ; les rôles de propriétaire exigent en plus le rang de propriétaire.
Les administrateurs de la plateforme ne sont pas concernés. Studio signale les rôles au-dessus de ton niveau comme non sélectionnables. La même
règle s’applique aux clés d’API : une clé ne peut recevoir que des autorisations que tu détiens.

## Module {#modules}

Un **module** est un bloc fonctionnel du serveur que l’opérateur active ou désactive dans la configuration du
serveur. `identity`, `tenancy`, `access`, `data` et `audit` sont toujours activés. Les modules facultatifs
comprennent `storage` (fichiers), `events` (tâches, planifications, événements, webhooks), `usage`,
`billing` et `notify` (notifications).

Dans Studio, une entrée de la barre latérale dont le module n’est pas activé reste visible et affiche **Désactivé**. En l’ouvrant,
tu vois **Module non activé sur ce serveur** ainsi que l’identifiant du module que l’opérateur doit activer. La
carte **Serveur** du tableau de bord liste tous les modules et leur état. Consulte la
[référence des modules](help:modules-reference).

## Clé d’API {#api-key}

Une **clé d’API** permet à une machine (le backend de ton produit, une intégration, un script) d’appeler l’API
sans utilisateur. Chaque clé appartient à un seul produit, possède une liste explicite d’autorisations et peut
éventuellement être liée à un locataire. Son secret n’est affiché **qu’une seule fois** ; Axentra n’en conserve qu’une empreinte (hash). Consulte les
[clés d’API](help:api-keys).

## Enregistrements et fichiers {#records-files}

- Les **enregistrements** sont des documents JSON stockés dans des collections nommées au sein d’un locataire, par exemple une
  collection `contacts`. Consulte les [enregistrements](help:records) et l’[aperçu des données](help:data-overview).
- Les **fichiers** sont des objets binaires téléversés (documents, images) accompagnés de métadonnées, stockés par locataire
  (module `storage`). Consulte les [fichiers](help:files).

## Événements et tâches {#events-jobs}

Avec le module `events`, Axentra exécute des traitements en arrière-plan et informe d’autres systèmes de ce qui s’est passé :

- **Tâches** : unités de traitement en arrière-plan, avec statut, nouvelles tentatives et résultats. Consulte les [tâches](help:jobs).
- **Planifications** : tâches exécutées selon une expression cron. Consulte les [planifications](help:schedules).
- **Événements** : traces de ce qui s’est passé, par exemple « un contact a été créé ». Consulte les
  [événements](help:events).
- **Webhooks** : appels HTTP qui livrent les événements à tes points de terminaison, signés avec un secret. Consulte les
  [webhooks](help:webhooks).

## Utilisation et facturation {#usage-billing}

- L’**utilisation** (module `usage`) mesure la consommation par locataire avec des **compteurs**, par exemple les appels d’API ou
  le stockage, et peut imposer des **quotas**. Consulte l’[utilisation](help:usage).
- La **facturation** (module `billing`) définit des **offres** avec leurs prix et leurs droits, et les attribue aux
  locataires sous forme d’**abonnements**. Studio ne traite jamais de données de carte bancaire. Consulte les
  [offres et abonnements](help:plans-subscriptions).

## Journal d’audit {#audit-log}

Chaque modification, et chaque tentative refusée, est inscrite dans le **journal d’audit** au sein de la même transaction que
la modification : qui (auteur), quoi (action, par exemple `tenancy.tenant.create`), sur quoi (cible),
quand, et avec quel résultat (autorisé ou refusé). Consulte le [journal d’audit](help:audit).

## Mode produit unique et mode multi-produit {#single-multi-product}

Le serveur fonctionne dans l’un des deux **modes**, défini par l’opérateur :

|                                | Produit unique                                                                    | Multi-produit                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Produits                       | Exactement un, créé à partir de la configuration du serveur au premier démarrage. | Autant que nécessaire, créés par les administrateurs de la plateforme. |
| Créer ou archiver des produits | Impossible (`mode_not_supported`).                                                | Avec `products:create` et `products:archive`.                          |
| Sélecteur de produit           | Une étiquette fixe **Produit** avec le nom du produit.                            | Un menu qui liste tes produits.                                        |

Tout le reste (locataires, rôles, chemins d’API, autorisations) fonctionne de la même façon dans les deux modes. Passer
du mode produit unique au mode multi-produit est une modification de configuration, sans migration de données. La carte **Serveur**
du tableau de bord indique le **Mode** actuel.

## ID de requête {#request-id}

Chaque requête d’API reçoit un **ID de requête** unique. Studio l’affiche avec les messages d’erreur ; transmets-le à
ton opérateur, qui pourra retrouver l’entrée de journal et les événements d’audit correspondants.

## Dépannage {#troubleshooting}

| Ce que tu vois                                              | Signification et solution                                                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Non autorisé**                                            | Tes rôles ne comportent pas l’autorisation. Demande à une personne ayant un rôle plus élevé, ou consulte les [rôles et autorisations](help:roles-permissions).        |
| Un rôle est affiché avec « (au-delà de tes autorisations) » | Le [plafond des rôles](help:concepts#role-ceiling) le bloque. Une personne qui détient toutes les autorisations de ce rôle doit l’attribuer.                          |
| **Introuvable** pour un élément qui existe                  | Axentra répond « introuvable » quand tu n’as aucun accès, afin de ne pas révéler ce qui existe. Vérifie que tu te trouves dans le bon produit et que tu y as un rôle. |
| **Indisponible dans ce mode**                               | Le serveur fonctionne en mode produit unique ; il est impossible de créer ou d’archiver des produits.                                                                 |
