---
title: Utilisateurs
summary: Trouve les personnes qui ont accès à un produit, consulte leur profil et leurs sessions, déconnecte-les, désactive des comptes et attribue des rôles sur la plateforme.
keywords: utilisateur, compte, personne, personnes, désactiver un utilisateur, désactivation, déconnecter partout, sessions, rôle sur la plateforme, administrateur de la plateforme, lecteur de la plateforme, sans e-mail
---

Un **utilisateur** est le compte d’une personne sur le serveur Axentra. Les comptes valent pour toute l’installation : un
même compte peut être opérateur d’un produit et membre de locataires dans plusieurs autres. Ce qu’un utilisateur
peut faire provient de trois sources :

- un **rôle sur la plateforme** (valable pour toute l’installation, rare),
- un **rôle de produit**, quand l’utilisateur est opérateur d’un produit (voir
  [produits](help:products#members)),
- un **rôle de locataire** dans chaque locataire dont l’utilisateur est membre (voir
  [membres et invitations](help:members-invitations)).

L’écran [Utilisateurs](app:users) liste les utilisateurs du produit actuel : ses opérateurs et les
membres de ses locataires.

> [!IMPORTANT]
> L’écran **Utilisateurs** exige `product_users:read` (propriétaires, administrateurs, support et lecteurs du produit ;
> administrateurs et lecteurs de la plateforme). Désactiver des utilisateurs, mettre fin à leurs sessions et voir leurs
> sessions exige l’autorisation de plateforme `users:manage`, que seuls les administrateurs de la plateforme
> détiennent. Seuls les administrateurs de la plateforme modifient les rôles sur la plateforme.

## Trouver un utilisateur {#find}

Ouvre [Utilisateurs](app:users). Utilise **Rechercher des utilisateurs** pour filtrer par nom ou par adresse e-mail, et le
filtre **Statut** pour afficher les utilisateurs **Actif** ou **Désactivé**. Sélectionne un nom pour ouvrir la page de l’utilisateur.

Studio ne crée pas de comptes. Ils sont créés quand le premier administrateur termine
l’installation initiale, quand une personne se connecte pour la première fois par authentification unique (si les
paramètres du fournisseur d’identité autorisent l’inscription, ou si une invitation est ouverte pour cette adresse e-mail), ou par
le code d’un produit qui intègre Axentra. Consulte [se connecter](help:signing-in).

## La page d’un utilisateur {#profile}

La carte **Profil** affiche :

| Champ                               | Signification                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Nom**, **Adresse e-mail**         | Proviennent du compte. Les utilisateurs modifient leur propre nom dans leur profil.                    |
| **Statut**                          | **Actif** ou **Désactivé**.                                                                            |
| **Langue**                          | La langue d’interface de l’utilisateur.                                                                |
| **Rôle sur la plateforme**          | **Aucun rôle sur la plateforme**, **Lecteur de la plateforme** ou **Administrateur de la plateforme**. |
| **Connexion par mot de passe**      | **Mot de passe défini**, ou **Aucun mot de passe (authentification unique uniquement)**.               |
| **Dernière connexion**, **Créé le** | Horodatages.                                                                                           |

### Adhésions {#memberships}

La carte **Adhésions** montre ce à quoi l’utilisateur appartient, dans la mesure où tu peux le
voir :

- **Rôles de produit** : les produits dont l’utilisateur est opérateur, avec le rôle. Les
  administrateurs et observateurs de la plateforme les voient tous ; les autres voient les produits
  où ils disposent de `product_members:read`.
- **Adhésions aux locataires** : les locataires dont l’utilisateur est membre, avec le produit, le
  rôle et le statut du locataire. Les autres voient les locataires où ils disposent de
  `members:read`.

La carte est en lecture seule. Pour modifier ce qu’un utilisateur peut faire, ouvre l’onglet
**Membres** du locataire (depuis son nom) ou, pour les opérateurs, l’onglet **Membres** du produit.

### Utilisateurs sans adresse e-mail {#no-email}

Certains comptes n’ont pas d’adresse e-mail, par exemple quand un fournisseur d’identité n’en a pas confirmé et
que le serveur autorise ce type d’inscription. Studio affiche alors l’ID de l’utilisateur à la place de l’adresse.
Ces utilisateurs :

- se connectent uniquement par authentification unique, jamais avec un mot de passe ;
- ne peuvent pas accepter d’invitations, car les invitations sont liées à une adresse ;
- peuvent malgré tout être ajoutés directement à des locataires par une personne qui les voit (par exemple un administrateur
  de la plateforme).

## Déconnecter un utilisateur partout {#sign-out}

1. Ouvre la page de l’utilisateur.
2. Choisis **Déconnecter partout** et confirme.

Toutes les sessions de l’utilisateur prennent fin immédiatement, sur tous les appareils. L’utilisateur peut se reconnecter. Utilise cette action
quand un appareil a été perdu ou qu’une session risque d’être compromise. **Sessions actives** sur la même page
liste chaque session avec l’appareil, la **Méthode de connexion**, la **Dernière activité** et **Expire le**.

## Désactiver un utilisateur {#disable}

1. Ouvre la page de l’utilisateur.
2. Choisis **Désactiver l’utilisateur**.
3. Saisis l’adresse e-mail de l’utilisateur (ou son ID, pour les utilisateurs qui n’en ont pas) pour confirmer, puis choisis **Désactiver
   l’utilisateur**.

Un utilisateur désactivé ne peut plus se connecter, ni par mot de passe ni par authentification unique, et toutes ses sessions prennent fin
immédiatement. Ses adhésions, son rôle sur la plateforme et son historique d’audit sont conservés : **Activer l’utilisateur** rétablit donc
l’accès précédent.

> [!WARNING]
> Les clés d’API créées par un utilisateur cessent de fonctionner dès qu’il est désactivé ou perd
> les autorisations que les clés utilisent : les requêtes sont refusées avec
> `api_key_creator_lost_access` (consulte les [clés d’API](help:api-keys#creator-permissions)). Les
> clés ne sont pas révoquées et fonctionnent de nouveau si l’accès est rétabli. Quand quelqu’un
> part, crée des clés de remplacement en tant que quelqu’un qui reste, bascule les services dessus
> et révoque les anciennes clés.

Tu ne peux pas te désactiver toi-même, et le dernier administrateur actif de la plateforme ne peut pas être désactivé.

## Changer le rôle sur la plateforme {#platform-role}

Les rôles sur la plateforme s’appliquent à **tous les produits** du serveur, indépendamment des adhésions.

| Rôle sur la plateforme              | Signification                                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aucun rôle sur la plateforme**    | Accès uniquement via les adhésions aux produits et aux locataires.                                                                                                     |
| **Lecteur de la plateforme**        | Accès en lecture seule à tous les produits, y compris les produits archivés et les locataires suspendus, aux paramètres et au journal d’audit de toute l’installation. |
| **Administrateur de la plateforme** | Contrôle total de toute l’installation : tous les produits et utilisateurs, création et archivage de produits, aucun plafond des rôles.                                |

1. Ouvre la page de l’utilisateur. La carte **Rôle sur la plateforme** n’est affichée qu’aux administrateurs de la plateforme.
2. Choisis le nouveau **Rôle sur la plateforme**.
3. Choisis **Changer le rôle sur la plateforme** et confirme. Attribuer le rôle **Administrateur de la plateforme** exige de
   saisir l’adresse e-mail (ou l’ID) de l’utilisateur.

> [!CAUTION]
> Un administrateur de la plateforme peut tout faire sur le serveur, y compris supprimer des locataires et
> créer des clés dans n’importe quel produit. Attribue ce rôle au plus petit nombre de personnes possible. Le dernier administrateur
> de la plateforme ne peut pas perdre ce rôle.

## Dépannage {#troubleshooting}

**Non autorisé sur l’écran Utilisateurs.** Il te manque `product_users:read` dans ce produit. Les propriétaires
et les membres d’un locataire ne l’ont pas ; ils voient leurs collègues dans l’onglet **Membres** du locataire.

**Pas de boutons Désactiver l’utilisateur ni Déconnecter partout.** Ils exigent `users:manage`, que seuls les
administrateurs de la plateforme détiennent.

**Conflit : « you cannot disable yourself ».** Adresse-toi à un autre administrateur de la plateforme.

**Conflit : « the last platform admin cannot be disabled » / « the last platform admin cannot lose
the role ».** Désigne d’abord un autre utilisateur comme administrateur de la plateforme.

**Non autorisé : « only platform admins can change platform roles ».** Adresse-toi à un administrateur de la plateforme.

**Un utilisateur est absent de la liste.** L’utilisateur n’est ni opérateur de ce produit ni membre
de l’un de ses locataires. Ajoute-le ou invite-le, voir
[membres et invitations](help:members-invitations).

**Un utilisateur désactivé apparaît toujours dans des locataires.** La désactivation ne retire pas les adhésions. Retire-les
dans l’onglet **Membres** du locataire si l’accès ne doit pas revenir quand l’utilisateur sera réactivé.
