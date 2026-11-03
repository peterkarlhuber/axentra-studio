---
title: Référence des autorisations
summary: Chaque autorisation intégrée d’Axentra, les rôles intégrés qui la détiennent et ce qu’elle te permet de faire dans le Studio.
keywords: autorisation, permission, liste des autorisations, catalogue, matrice des rôles, portée, plateforme, produit, locataire, lecture, gestion, droits d’accès, rôles intégrés, propriétaire, owner, administrateur, admin, lecteur, viewer, support, membre, member
---

Une _autorisation_ est un droit unique écrit sous la forme `resource:action`, par exemple
`files:write`. L’accès est refusé tant qu’un rôle ou une clé d’API n’accorde pas explicitement
l’autorisation. Cette page liste chaque autorisation intégrée, indique quel rôle intégré la détient
et précise ce qu’elle débloque dans le Studio. Pour savoir comment les rôles sont créés et
attribués, voir [Rôles et autorisations](help:roles-permissions).

## Comment fonctionnent les autorisations {#how-permissions-work}

Chaque autorisation a une **portée** :

- **Plateforme** : à l’échelle de l’installation. Accordée uniquement par les rôles sur la
  plateforme **Administrateur de la plateforme** et **Lecteur de la plateforme**, jamais par des
  rôles de produit ou de locataire, et jamais par des clés d’API.
- **Produit** : concerne un produit dans son ensemble (ses locataires, rôles, clés, tâches,
  offres …).
- **Locataire** : concerne les données d’un locataire (enregistrements, fichiers, membres …).

Qui détient quoi :

- Un **rôle de locataire** accorde des autorisations de locataire **dans ce locataire
  uniquement**.
- Un **rôle de produit** accorde des autorisations de produit et des autorisations de locataire
  **dans chaque locataire du produit**.
- Un **rôle sur la plateforme** accorde ses autorisations dans chaque produit.
- Une personne qui n’est que membre d’un locataire obtient quand même `product:read` pour le
  produit, afin de pouvoir l’ouvrir et choisir son locataire, et rien d’autre au niveau du
  produit.
- Une **clé d’API** détient exactement les autorisations qui y figurent, dans son produit (et,
  si elle est liée, uniquement dans son locataire).

Le Studio masque les boutons, onglets et boîtes de dialogue que tes autorisations ne permettent
pas. Les sections de la barre latérale restent visibles ; s’il te manque l’autorisation de lecture,
la page affiche **Non autorisé** avec l’autorisation manquante (voir
[Dépannage](help:troubleshooting#forbidden)).

> [!TIP]
> Dans le Studio, ouvre [Autorisations](app:permissions) pour voir le catalogue complet de ton
> produit, y compris les autorisations déclarées par le produit lui-même, avec les descriptions du
> serveur.

## Autorisations de plateforme {#platform-permissions}

| Autorisation        | Description du serveur (traduite)                      | Ce qu’elle permet dans le Studio                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `products:create`   | Créer des produits (mode multi-produit)                | **Nouveau produit** sur la page Produits (mode multi-produit uniquement)                                                                                                                                                                               |
| `products:archive`  | Archiver et restaurer des produits                     | Archiver et restaurer sur la page du produit (mode multi-produit uniquement)                                                                                                                                                                           |
| `users:read`        | Lister tous les utilisateurs de l’installation         | Ouvrir la page de détail de n’importe quel utilisateur, y compris hors de tes produits ; lister tous les utilisateurs via l’API                                                                                                                        |
| `users:manage`      | Désactiver des utilisateurs et révoquer leurs sessions | **Désactiver l’utilisateur** / **Activer l’utilisateur** et **Déconnecter partout** sur la page d’un utilisateur, ainsi que sa liste **Sessions actives**. Modifier un **Rôle sur la plateforme** exige en plus d’être administrateur de la plateforme |
| `platform:settings` | Lire les paramètres de l’installation                  | La page [Paramètres](app:settings) ; le statut du prestataire de paiement et les paramètres de stockage affichés sur les pages des produits                                                                                                            |
| `platform:audit`    | Lire les événements d’audit de toute l’installation    | Le [Journal d’audit](app:audit) de tous les produits, y compris les événements de plateforme comme les connexions                                                                                                                                      |

## Autorisations de produit {#product-permissions}

| Autorisation             | Description du serveur (traduite)                                                    | Ce qu’elle permet dans le Studio                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product:read`           | Voir le produit et sa vue d’ensemble                                                 | Ouvrir le produit et son tableau de bord                                                                                                                                                                        |
| `product:manage`         | Modifier les détails et paramètres du produit                                        | Modifier le nom, la description et les paramètres sur la page du produit (y compris la politique de stockage) ; permet aussi de lire la page [Paramètres](app:settings) et le statut du prestataire de paiement |
| `product_members:read`   | Voir les opérateurs du produit                                                       | L’onglet **Membres** de la page du produit                                                                                                                                                                      |
| `product_members:manage` | Ajouter, modifier et retirer des opérateurs du produit                               | Ajouter, modifier et retirer des membres du produit (dans la limite du [plafond de rôle](help:security#role-ceiling))                                                                                           |
| `permissions:manage`     | Déclarer et retirer les autorisations propres au produit via l’API                   | Rien à cliquer dans le Studio (la page Autorisations est en lecture seule) ; permet de lire le catalogue des autorisations. La déclaration se fait via l’API                                                    |
| `product_users:read`     | Voir les utilisateurs appartenant aux locataires du produit                          | La page [Utilisateurs](app:users) du produit et les pages de détail des utilisateurs                                                                                                                            |
| `tenants:read`           | Lister les locataires                                                                | La liste [Locataires](app:tenants) et les pages des locataires ; les sélecteurs de locataire des autres sections                                                                                                |
| `tenants:create`         | Créer des locataires                                                                 | **Nouveau locataire** (page Locataires et tableau de bord)                                                                                                                                                      |
| `tenants:update`         | Modifier et suspendre des locataires                                                 | Modifier, suspendre et réactiver un locataire ; définir le quota de stockage d’un locataire                                                                                                                     |
| `tenants:delete`         | Supprimer des locataires et toutes leurs données                                     | Supprimer un locataire (irréversible)                                                                                                                                                                           |
| `roles:read`             | Voir les rôles                                                                       | La page [Rôles](app:roles) et le catalogue des autorisations ; permet au Studio d’afficher les rôles que tu peux attribuer                                                                                      |
| `roles:manage`           | Créer, modifier et supprimer des rôles personnalisés                                 | **Nouveau rôle personnalisé**, modification et suppression des rôles personnalisés                                                                                                                              |
| `api_keys:read`          | Voir les clés d’API (jamais leurs secrets)                                           | La liste [Clés d’API](app:apiKeys) et le catalogue des autorisations                                                                                                                                            |
| `api_keys:manage`        | Créer, renouveler et révoquer des clés d’API                                         | **Nouvelle clé d’API**, **Renouveler le secret**, **Révoquer la clé**                                                                                                                                           |
| `audit:read`             | Lire les événements d’audit du produit                                               | Le [Journal d’audit](app:audit) de ce produit                                                                                                                                                                   |
| `collections:read`       | Voir les statistiques des collections d’enregistrements                              | Les statistiques des collections dans l’[Aperçu des données](app:dataOverview)                                                                                                                                  |
| `jobs:read`              | Voir les tâches d’arrière-plan et les événements                                     | [Tâches](app:jobs), [Planifications](app:schedules), [Événements](app:events), y compris la vue en direct                                                                                                       |
| `jobs:manage`            | Mettre en file d’attente, relancer et annuler des tâches                             | **Mettre une tâche en file d’attente**, relancer et annuler des tâches ; créer, modifier et supprimer des planifications                                                                                        |
| `webhooks:read`          | Voir les webhooks et les livraisons                                                  | [Webhooks](app:webhooks) et leurs livraisons                                                                                                                                                                    |
| `webhooks:manage`        | Créer, modifier et supprimer des webhooks                                            | Créer, modifier, supprimer des webhooks ; renouveler le secret de signature, envoyer un test, relivrer                                                                                                          |
| `usage:manage`           | Définir des compteurs et des quotas                                                  | Créer et modifier des compteurs ; définir les quotas d’utilisation des locataires                                                                                                                               |
| `billing:manage`         | Gérer les offres, les prix et les abonnements                                        | Créer et modifier des offres ; créer et modifier les abonnements des locataires                                                                                                                                 |
| `notify:manage`          | Gérer les modèles de notification et envoyer des tests                               | [Notifications](app:notifications) : modèles, journal des messages, statistiques, boîte de réception locale                                                                                                     |
| `notify:send_external`   | Envoyer des notifications à des adresses e-mail qui ne sont pas membres du locataire | Envoyer un test à n’importe quelle adresse e-mail, pas seulement aux membres du locataire                                                                                                                       |

## Autorisations de locataire {#tenant-permissions}

Lorsqu’un rôle de produit détient une autorisation de locataire, elle s’applique dans chaque
locataire du produit.

| Autorisation         | Description du serveur (traduite)                                                    | Ce qu’elle permet dans le Studio                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant:read`        | Voir le locataire                                                                    | Ouvrir le locataire auquel tu appartiens                                                                                                                          |
| `members:read`       | Voir les membres et les invitations du locataire                                     | Les onglets **Membres** et **Invitations** d’un locataire ; la page [Invitations](app:invitations)                                                                |
| `members:manage`     | Inviter, modifier et retirer des membres du locataire                                | Ajouter des membres, inviter, modifier des rôles, retirer des membres, révoquer des invitations (dans la limite du [plafond de rôle](help:security#role-ceiling)) |
| `records:read`       | Lire des enregistrements                                                             | [Enregistrements](app:records) du locataire                                                                                                                       |
| `records:write`      | Créer, modifier et supprimer des enregistrements                                     | Créer, modifier et supprimer des enregistrements                                                                                                                  |
| `files:read`         | Lister et télécharger des fichiers                                                   | [Fichiers](app:files) du locataire, téléchargement                                                                                                                |
| `files:write`        | Téléverser et supprimer des fichiers                                                 | Téléverser, modifier et supprimer des fichiers                                                                                                                    |
| `events:publish`     | Publier des événements et mettre des tâches en file d’attente pour le locataire      | **Publier un événement** sur la page Événements                                                                                                                   |
| `usage:read`         | Voir l’utilisation et les quotas                                                     | [Utilisation](app:usage) du locataire, quotas, widgets d’utilisation du tableau de bord                                                                           |
| `usage:record`       | Enregistrer l’utilisation                                                            | Enregistrer l’utilisation et valider ou libérer des réservations pour un locataire                                                                                |
| `billing:read`       | Voir l’abonnement et les droits                                                      | [Offres](app:plans), [Abonnements](app:subscriptions) et la facturation d’un locataire                                                                            |
| `notify:send`        | Envoyer des notifications                                                            | Envoyer des notifications de test aux membres du locataire ; voir les messages du locataire                                                                       |
| `notify:preferences` | Gérer les préférences de notification                                                | Tes propres préférences de notification pour un locataire                                                                                                         |
| `search:query`       | Interroger l’index de recherche du locataire                                         | [Recherche](app:search) dans le locataire                                                                                                                         |
| `search:index`       | Ajouter, remplacer et supprimer des documents dans l’index de recherche du locataire | **Retirer de l’index** sur l’écran [Recherche](app:search)                                                                                                        |

## Rôles intégrés {#built-in-roles}

| Rôle (clé)                                             | Niveau     | Rôle et usage                                                                                                        |
| ------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| **Administrateur de la plateforme** (`platform_admin`) | Plateforme | Toutes les autorisations partout ; exempté du plafond de rôle                                                        |
| **Lecteur de la plateforme** (`platform_viewer`)       | Plateforme | Toutes les autorisations de lecture, plus `platform:settings`, `platform:audit` et `search:query`                    |
| **Product owner** (`product_owner`)                    | Produit    | Contrôle total du produit, y compris les opérateurs et le rang de propriétaire                                       |
| **Product admin** (`product_admin`)                    | Produit    | Tout, sauf la gestion des opérateurs du produit et la déclaration d’autorisations du produit                         |
| **Support** (`product_support`)                        | Produit    | Lit tout et gère les membres des locataires dans la limite de ses propres autorisations (en pratique : des lecteurs) |
| **Product viewer** (`product_viewer`)                  | Produit    | Accès en lecture seule au produit                                                                                    |
| **Owner** (`tenant_owner`)                             | Locataire  | Toutes les autorisations de locataire, plus le rang de propriétaire                                                  |
| **Admin** (`tenant_admin`)                             | Locataire  | Toutes les autorisations de locataire, sans le rang de propriétaire                                                  |
| **Member** (`member`)                                  | Locataire  | Travaille avec les données du locataire                                                                              |
| **Viewer** (`viewer`)                                  | Locataire  | Accès en lecture seule au locataire                                                                                  |

## Matrice des rôles {#role-matrix}

✓ = le rôle détient l’autorisation. Abréviations : **PA** Administrateur de la plateforme, **PV**
Lecteur de la plateforme, **PO** Product owner, **PAd** Product admin, **Sup** Support, **PVi**
Product viewer, **TO** Owner, **TA** Admin, **M** Member, **V** Viewer.

| Autorisation             | PA  | PV  | PO  | PAd | Sup | PVi | TO  | TA  | M   | V   |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `products:create`        | ✓   |     |     |     |     |     |     |     |     |     |
| `products:archive`       | ✓   |     |     |     |     |     |     |     |     |     |
| `users:read`             | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `users:manage`           | ✓   |     |     |     |     |     |     |     |     |     |
| `platform:settings`      | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `platform:audit`         | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `product:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `product_members:read`   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product_members:manage` | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `permissions:manage`     | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `product_users:read`     | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:create`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:update`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:delete`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `roles:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `roles:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `api_keys:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `api_keys:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `audit:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `collections:read`       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:read`              | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:manage`            | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `webhooks:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `webhooks:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `usage:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `billing:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:manage`          | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:send_external`   | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenant:read`            | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:manage`         | ✓   |     | ✓   | ✓   | ✓   |     | ✓   | ✓   |     |     |
| `records:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `records:write`          | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `files:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `files:write`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `events:publish`         | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `usage:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `usage:record`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `billing:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `notify:send`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `notify:preferences`     | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `search:query`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `search:index`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   |     |     |

> [!NOTE]
> **Owner** et **Admin** d’un locataire détiennent les mêmes autorisations. La différence tient au
> rang de propriétaire : seul un propriétaire (ou un opérateur du produit ou un administrateur de
> la plateforme) peut nommer quelqu’un propriétaire, ou modifier ou retirer un propriétaire. Voir
> [Plafond de rôle](help:security#role-ceiling).

## Autorisations déclarées par le produit {#product-defined}

En plus du catalogue intégré, un produit peut déclarer ses propres autorisations, nommées
`<namespace>.<resource>:<action>`, par exemple `crm.deals:approve`. Elles sont listées sur la page
[Autorisations](app:permissions) sous **Autorisations du produit**, et tu peux les accorder dans des
rôles personnalisés et des clés d’API comme les autorisations intégrées.

- **Product owner**, **Product admin** et **Administrateur de la plateforme** les détiennent
  toutes ; **Owner** et **Admin** d’un locataire détiennent celles dont la portée est le locataire.
- **Product viewer**, **Support** et **Lecteur de la plateforme** détiennent celles en lecture
  seule.
- **Member** et **Viewer** ne détiennent que celles que le produit leur attribue (colonne
  **Également accordée à**).
- Une autorisation _retirée_ n’a plus aucun effet, même là où elle est encore listée.

## Clés d’API et autorisations {#api-keys}

Une [clé d’API](help:api-keys) ne détient que les autorisations sélectionnées lors de sa création,
et uniquement dans son produit (et son locataire, si elle y est liée). Tu ne peux donner à une clé
que des autorisations que tu détiens toi-même au niveau du produit. Les autorisations de plateforme
ne sont jamais disponibles pour les clés.

## Dépannage {#troubleshooting}

| Situation                                                                       | Que faire                                                                                                                                                                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Non autorisé** avec `missing permission …`                                    | Trouve l’autorisation ci-dessus et demande un rôle qui la détient.                                                                                                                       |
| Un membre d’un locataire voit le produit mais aucune page du produit            | Comportement normal : les membres d’un locataire n’obtiennent que `product:read` au niveau du produit. Ils travaillent dans leur locataire.                                              |
| Un rôle ne peut pas être sélectionné (**« … (au-delà de tes autorisations) »**) | Le rôle détient des autorisations que tu n’as pas, ou c’est un rôle de propriétaire. Voir [Plafond de rôle](help:security#role-ceiling).                                                 |
| Une autorisation manque dans l’éditeur de rôles                                 | Les rôles de locataire ne proposent que des autorisations de locataire ; les autorisations de plateforme ne sont jamais proposées ; les autorisations de produit retirées sont masquées. |
| Le champ du rôle est une simple zone de texte                                   | Tu ne peux pas lire les rôles (`roles:read`) ; le Studio ne peut pas les lister. Saisis la clé du rôle ; le serveur la vérifie.                                                          |
