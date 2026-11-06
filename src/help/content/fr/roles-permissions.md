---
title: Rôles et autorisations
summary: Comprends les autorisations et les rôles intégrés, crée des rôles personnalisés pour ton produit et consulte le catalogue des autorisations du produit.
keywords: rôle, autorisation, permission, rôle personnalisé, rôle intégré, droits d’accès, droits, privilèges, portée, autorisation de produit, autorisation déclarée, autorisation retirée, RBAC, contrôle d’accès
---

Une **autorisation** permet une action, par exemple `records:write` (créer, modifier et supprimer des
enregistrements). Un **rôle** est un ensemble nommé d’autorisations que tu attribues à des personnes. Axentra refuse
tout par défaut : une personne ou une clé d’API ne peut faire que ce qu’un rôle ou la liste d’autorisations de la clé
accorde explicitement.

Chaque autorisation a une **portée** :

| Portée         | S’applique à                                                                  | Accordée par                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **plateforme** | Toute l’installation, par exemple `products:create`                           | Les rôles sur la plateforme uniquement ; jamais les rôles personnalisés ni les clés d’API                                                |
| **produit**    | Un produit dans son ensemble, par exemple `tenants:create`, `api_keys:manage` | Les rôles de produit et les clés d’API                                                                                                   |
| **locataire**  | Les données d’un locataire, par exemple `records:read`                        | Les rôles de locataire dans ce locataire ; les rôles de produit et les clés d’API valables pour tout le produit dans tous les locataires |

La liste complète figure dans la [référence des autorisations](help:permissions-reference).

> [!IMPORTANT]
> Les écrans **Rôles** et **Autorisations** exigent le module d’accès et `roles:read` (l’écran
> **Autorisations** s’ouvre aussi avec `api_keys:read`). Créer, modifier et supprimer des rôles personnalisés
> exige `roles:manage` (propriétaires et administrateurs du produit).

## Rôles intégrés {#built-in-roles}

Les rôles intégrés sont fournis par Axentra et ne peuvent pas être modifiés. Ouvre [Rôles](app:roles) et choisis
l’icône en forme d’œil pour voir exactement quelles autorisations un rôle intégré détient dans ton produit.

| Rôle               | Portée    | Rôle joué                                                                                                                         |
| ------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Product owner**  | produit   | Contrôle total du produit, y compris les opérateurs et les autorisations de produit                                               |
| **Product admin**  | produit   | Gère les locataires, les rôles, les clés et les données ; ne peut pas gérer les opérateurs ni déclarer d’autorisations de produit |
| **Support**        | produit   | Consulte tout ; gère les membres des locataires dans la limite de ses propres autorisations (en pratique : les lecteurs)          |
| **Product viewer** | produit   | Accès en lecture seule au produit et à tous ses locataires                                                                        |
| **Owner**          | locataire | Contrôle total du locataire, y compris les autres propriétaires                                                                   |
| **Admin**          | locataire | Mêmes autorisations qu’Owner, mais sans le rang de propriétaire                                                                   |
| **Member**         | locataire | Travaille avec les données du locataire                                                                                           |
| **Viewer**         | locataire | Accès en lecture seule au locataire                                                                                               |

Deux rôles sur la plateforme s’y ajoutent : **Administrateur de la plateforme** et **Lecteur de la plateforme**. Ils sont
attribués sur la page d’un utilisateur, voir [utilisateurs](help:users#platform-role).

## Créer un rôle personnalisé {#create}

Crée un rôle personnalisé quand aucun rôle intégré ne convient, par exemple pour un agent de support qui peut lire les enregistrements
mais pas les fichiers.

1. Ouvre [Rôles](app:roles) et choisis **Nouveau rôle personnalisé**.
2. Saisis un **Nom**.
3. Vérifie la **Clé**. Studio la dérive du nom.
4. Choisis la **Portée** : **Locataire** pour les rôles que tu donnes aux membres des locataires, **Produit** pour les rôles
   que tu donnes aux opérateurs du produit.
5. Saisis éventuellement une **Description**.
6. Sélectionne les **Autorisations** (voir [la liste des autorisations](#checklist)).
7. Choisis **Enregistrer les modifications**.

Le rôle est désormais proposé partout où des membres de sa portée sont ajoutés ou invités.

| Champ             | Effet                                                                                                              | Valeurs autorisées / par défaut                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Nom**           | Nom affiché dans les listes de rôles.                                                                              | 1 à 100 caractères. Modifiable.                                                                                                   |
| **Clé**           | Identifiant stable enregistré dans les adhésions, par exemple `support_agent`.                                     | 2 à 41 lettres minuscules, chiffres ou tirets bas ; unique dans le produit ; pas une clé intégrée comme `member`. Non modifiable. |
| **Portée**        | **Locataire** : uniquement des autorisations de locataire. **Produit** : autorisations de produit et de locataire. | Par défaut **Locataire**. Non modifiable.                                                                                         |
| **Description**   | Explique le rôle aux autres administrateurs.                                                                       | Jusqu’à 500 caractères.                                                                                                           |
| **Autorisations** | Ce que le rôle permet.                                                                                             | Jusqu’à 100 autorisations. Les autorisations de plateforme ne sont jamais proposées.                                              |

## Modifier un rôle personnalisé {#edit}

Choisis l’icône en forme de crayon d’un rôle personnalisé, modifie le nom, la description ou les autorisations, puis choisis
**Enregistrer les modifications**. La clé et la portée restent fixes.

> [!WARNING]
> Les modifications s’appliquent immédiatement à toutes les personnes qui détiennent le rôle, dans tous les locataires du produit.

## Supprimer un rôle personnalisé {#delete}

1. Choisis l’icône de corbeille du rôle.
2. Saisis le nom du rôle pour confirmer, puis choisis **Supprimer le rôle**.

Un rôle encore attribué à un membre ou à un opérateur ne peut pas être supprimé : le serveur répond
**Conflit** avec le nombre d’attributions. Donne d’abord un autre rôle à ces personnes.

## Utiliser la liste des autorisations {#checklist}

La liste des autorisations apparaît dans l’éditeur de rôle et lors de la création d’une clé d’API.

- Les autorisations sont regroupées par ressource (la partie avant le deux-points, par exemple `records`). La
  case à cocher du groupe sélectionne ou désélectionne tout le groupe ; le compteur indique combien d’autorisations sont sélectionnées.
- **Filtrer les autorisations…** recherche dans les noms et les descriptions.
- Les groupes marqués **Produit** contiennent les autorisations que ton produit a déclarées lui-même.
- Chaque autorisation affiche sa description et sa portée. Un rôle de locataire ne se voit proposer que des autorisations
  de locataire ; les autorisations de produit retirées ne sont jamais proposées.

> [!NOTE]
> Un rôle personnalisé peut contenir n’importe quelle autorisation de sa portée. Le [plafond
> des rôles](help:members-invitations#role-ceiling) s’applique quand le rôle est _attribué_ : seules
> les personnes qui détiennent toutes ses autorisations peuvent le donner à quelqu’un.

## Autorisations définies par le produit {#product-permissions}

En plus du catalogue intégré, un produit peut déclarer ses propres autorisations pour ses propres fonctions, par
exemple `crm.deals:approve`. Leur nom contient toujours un point : `<namespace>.<resource>:<action>`.
Une fois déclarées, elles peuvent être accordées par des rôles personnalisés et des clés d’API comme les autorisations intégrées, et le
code de ton produit les vérifie.

Ouvre [Autorisations](app:permissions) pour voir le catalogue du produit. Avec `permissions:manage` (propriétaires du produit), tu peux aussi y déclarer des autorisations.

| Colonne                  | Signification                                                                                                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autorisation**         | Nom et description.                                                                                                                                                                                                                                                                         |
| **Portée**               | **produit** ou **locataire**.                                                                                                                                                                                                                                                               |
| **Également accordée à** | Les rôles intégrés qui la détiennent en plus des attributions automatiques. **Rôles en lecture seule** signifie que Support, Product viewer et Lecteur de la plateforme la détiennent ; **Propriétaires et administrateurs uniquement** signifie qu’aucun autre rôle intégré ne la détient. |
| **Déclarée par**         | **Code du produit** (enregistrée par le code du produit au démarrage) ou **API** (déclarée via l’API HTTP).                                                                                                                                                                                 |
| **Statut**               | **Active**, ou **Retirée** avec la date. Active **Afficher les retirées** pour lister les autorisations retirées.                                                                                                                                                                           |

Les propriétaires et administrateurs du produit ainsi que les administrateurs de la plateforme détiennent toujours toutes les autorisations de produit
actives ; les propriétaires et administrateurs d’un locataire, toutes celles de portée locataire.

> [!NOTE]
> Choisis **Déclarer une autorisation** pour en déclarer une via l’API. Pour les autorisations
> déclarées ainsi, le crayon en modifie une (ou réactive une autorisation retirée) et la corbeille
> la retire après que tu as saisi son nom. Les autorisations enregistrées par le code du produit se
> modifient dans le code ; Studio ne propose aucune action pour elles. Un produit peut déclarer
> jusqu’à 500 autorisations.

### Autorisations retirées {#retired}

Une autorisation retirée n’accorde plus rien, même là où elle est encore enregistrée dans un rôle
personnalisé ou une clé d’API. La déclarer de nouveau rétablit son effet pour ces détenteurs.
Enregistrer un rôle personnalisé dans Studio conserve les noms retirés qu’il contient (l’éditeur les
indique sous la liste) sans permettre d’en ajouter, et le renouvellement d’une clé d’API les retire
de la clé de remplacement.

## Dépannage {#troubleshooting}

**Conflit : « a role with this key exists » / « this key belongs to a built-in role ».** Choisis une
autre clé.

**Vérifie ta saisie : « key must be 2-41 lowercase letters, digits or underscores ».** Retire de la clé les
majuscules, les tirets et les espaces.

**Conflit : « the role is assigned N times; reassign those members first ».** Change le rôle de
ces membres (dans les onglets **Membres** des locataires et du produit) avant de le supprimer.

**Vérifie ta saisie : « permissions not allowed for a tenant role ».** Un rôle de locataire ne peut contenir que des
autorisations de locataire.

**Le catalogue des autorisations n’a pas pu être chargé.** Il te manque `roles:read` (ou `api_keys:read`), ou le
serveur est injoignable. Recharge la page, ou adresse-toi à un propriétaire du produit.

**Modifié entre-temps.** Une autre personne a enregistré le rôle pendant que tu le modifiais. Ferme
l’éditeur, rouvre le rôle et répète ta modification.

**Une autorisation est absente de la liste.** Il s’agit d’une autorisation de plateforme (jamais attribuable
ici), d’une autorisation de produit de l’autre portée, ou d’une autorisation retirée.
