---
title: Produits
summary: Crée, configure, archive et restaure des produits, gère les opérateurs de produit et comprends le mode produit unique.
keywords: produit, application, appli, projet, opérateurs, membres du produit, archiver, restaurer, paramètres du produit, mode produit unique, mode multi-produit, slug
---

Un **produit** est une application qui fonctionne sur ton serveur Axentra, par exemple un CRM ou un service de
réservation. Chaque produit possède ses propres locataires, utilisateurs, rôles, clés d’API et données, et rien n’est partagé
entre les produits. Les personnes qui exploitent un produit (plutôt que de l’utiliser en tant que client) en sont les
**opérateurs** : elles détiennent un rôle de produit comme **Product owner** et figurent dans l’onglet **Membres**
du produit.

Ouvre la liste des produits avec [Produits](app:products) dans la barre latérale. **Ouvrir le tableau de bord** te fait entrer
dans un produit ; tous les autres écrans de la barre latérale fonctionnent alors dans ce produit.

> [!IMPORTANT]
> Toute personne qui appartient à un produit le voit dans la liste. Les administrateurs et les lecteurs de la
> plateforme voient tous les produits, y compris les produits archivés. Créer, archiver et restaurer des produits
> exige les autorisations de plateforme `products:create` et `products:archive` (administrateurs de la
> plateforme) et n’est possible qu’en mode multi-produit. Consulte le
> [mode produit unique](#single-product-mode).

## Créer un produit {#create}

1. Ouvre [Produits](app:products) et choisis **Nouveau produit**.
2. Saisis un **Nom**.
3. Vérifie le **Slug**. Studio le dérive du nom ; tu peux le modifier avant de créer le
   produit.
4. Saisis éventuellement une **Description**.
5. Choisis **Créer le produit**.

Studio ouvre la page du nouveau produit. Tu en deviens **Product owner** et peux donc ajouter immédiatement d’autres
opérateurs dans l’onglet **Membres**.

> [!NOTE]
> Le slug ne peut plus être modifié ensuite. Choisis-en un que tu acceptes de voir dans les URL, les journaux et
> les fichiers de configuration.

### Champs d’un produit {#fields}

| Champ           | Effet                                                                              | Valeurs autorisées / par défaut                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nom**         | Nom affiché dans Studio et dans les e-mails, par exemple les e-mails d’invitation. | 1 à 200 caractères. Modifiable ultérieurement.                                                                                  |
| **Slug**        | Identifiant stable, adapté aux URL.                                                | 2 à 63 lettres minuscules, chiffres et tirets, commençant par une lettre ou un chiffre ; unique sur le serveur. Non modifiable. |
| **Description** | Texte libre affiché dans la liste des produits.                                    | Jusqu’à 2 000 caractères. Facultatif.                                                                                           |
| **ID**          | Identifiant généré (`prd_…`) utilisé par l’API.                                    | Attribué par le serveur.                                                                                                        |
| **Statut**      | **Actif** ou **Archivé**.                                                          | Voir [archiver un produit](#archive).                                                                                           |

## Modifier les paramètres d’un produit {#settings}

L’onglet **Paramètres** d’un produit contient son nom, sa description et les **Paramètres (JSON)** : un objet
JSON avec la configuration propre au produit. Le code de ton produit peut le lire, et certains modules d’Axentra
y utilisent des clés.

1. Ouvre le produit depuis [Produits](app:products) et sélectionne l’onglet **Paramètres**.
2. Modifie le **Nom**, la **Description** ou les **Paramètres (JSON)**.
3. Choisis **Enregistrer les modifications**.

Les modifications s’appliquent immédiatement à tous les locataires du produit.

| Clé dans Paramètres (JSON) | Utilisée par  | Effet                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invitation_accept_url`    | Notifications | Lien utilisé dans les e-mails d’invitation. `{token}` est remplacé par le jeton d’invitation ; à défaut, `?token=…` est ajouté à la fin. Doit commencer par `http://` ou `https://`. Consulte les [invitations](help:members-invitations). Si la clé n’est pas définie, le paramètre de serveur `notify.invitation_accept_url` s’applique, sinon `/accept-invitation` sur l’adresse publique de l’API. |
| `default_locale`           | Notifications | Langue de repli des modèles de notification, par exemple `"en"`.                                                                                                                                                                                                                                                                                                                                       |
| `storage`                  | Fichiers      | Quotas de stockage et politique de types de contenu pour les téléversements. Modifie plutôt la politique dans l’onglet **Fichiers**. Consulte les [fichiers](help:files).                                                                                                                                                                                                                              |

```json
{
  "invitation_accept_url": "https://studio.example.com/invitations/accept?token={token}",
  "default_locale": "en"
}
```

> [!WARNING]
> **Enregistrer les modifications** remplace l’objet de paramètres en entier. Si tu supprimes une clé du texte, elle est retirée
> du produit. L’objet peut compter jusqu’à environ 32 000 caractères.

> [!IMPORTANT]
> Modifier les paramètres exige `product:manage` (propriétaires et administrateurs du produit). Sans cette autorisation, l’onglet
> affiche **Tu peux consulter ces paramètres, mais pas les modifier.** Un produit archivé ne peut pas être modifié
> dans Studio ; restaure-le d’abord.

L’onglet **Fichiers** (uniquement quand le module de fichiers est activé) contient la politique de stockage du produit. Elle
est décrite dans [fichiers](help:files).

## Gérer les opérateurs du produit {#members}

L’onglet **Membres** liste les opérateurs du produit : les utilisateurs qui ont un rôle de produit. Leurs autorisations de
locataire s’appliquent dans **tous** les locataires du produit. Les membres des locataires se gèrent quant à eux dans chaque locataire,
voir [membres et invitations](help:members-invitations).

| Rôle de produit intégré               | Peut                                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Product owner** (`product_owner`)   | Tout faire dans le produit, y compris gérer les opérateurs et déclarer des autorisations de produit.                         |
| **Product admin** (`product_admin`)   | Gérer les locataires, les rôles, les clés d’API et les données ; ne peut pas gérer les opérateurs.                           |
| **Support** (`product_support`)       | Tout consulter et gérer les membres des locataires dans la limite de ses propres autorisations (en pratique : les lecteurs). |
| **Product viewer** (`product_viewer`) | Accéder au produit en lecture seule.                                                                                         |

Les rôles de produit personnalisés apparaissent aussi dans la liste. Consulte les [rôles et autorisations](help:roles-permissions).

### Ajouter un opérateur {#add-operator}

1. Ouvre l’onglet **Membres** et choisis **Ajouter un membre**.
2. Saisis l’**Adresse e-mail** de la personne et choisis un **Rôle**.
3. Choisis **Ajouter un membre**.

> [!IMPORTANT]
> L’onglet **Membres** exige `product_members:read` ; ajouter, modifier et retirer des opérateurs exige
> `product_members:manage` (propriétaires du produit et administrateurs de la plateforme).

> [!NOTE]
> Tu ne peux ajouter que des comptes visibles pour toi : les administrateurs de la plateforme voient
> tous les comptes, les utilisateurs disposant de `product_users:read` voient les utilisateurs de ce
> produit (membres de ses locataires et ses opérateurs). Pour toute autre personne, le serveur
> répond **Utilisateur introuvable** et la boîte de dialogue propose **Envoyer plutôt une
> invitation**, qui invite l’adresse dans l’équipe du produit. Voir
> [invitations dans l’équipe du produit](help:members-invitations#product-team).

Pour modifier le rôle d’un opérateur, choisis-en un nouveau dans la colonne **Rôle**. Pour retirer un opérateur, choisis
l’icône de corbeille de sa ligne et confirme. Les rôles au-dessus de ton propre niveau sont affichés mais ne peuvent pas être
sélectionnés (voir le [plafond des rôles](help:members-invitations#role-ceiling)).

## Archiver un produit {#archive}

Archiver un produit le met hors service sans rien supprimer.

1. Ouvre le produit depuis [Produits](app:products).
2. Choisis **Archiver**.
3. Saisis le nom du produit pour confirmer, puis choisis **Archiver**.

Tant qu’un produit est archivé :

- les opérateurs et les membres des locataires ne le voient plus dans la liste des produits, et chacune de leurs requêtes
  dans ce produit est refusée ;
- aucune de ses clés d’API ne fonctionne plus (les requêtes échouent avec **Non autorisé**) ;
- les administrateurs de la plateforme conservent un accès complet, les lecteurs de la plateforme un accès en lecture ;
- Studio affiche **Ce produit est archivé. Restaure-le pour pouvoir le modifier.** et ne propose pas
  **Ouvrir le tableau de bord**.

> [!NOTE]
> Studio ne peut pas supprimer un produit. L’archivage est le moyen de le mettre hors service.

## Restaurer un produit {#restore}

1. Ouvre le produit archivé (en tant qu’administrateur de la plateforme, il reste listé avec le statut
   **Archivé**).
2. Choisis **Restaurer** et confirme.

Le produit, ses membres et ses clés d’API fonctionnent de nouveau immédiatement. Les clés qui ont expiré
entre-temps restent expirées.

## Mode produit unique {#single-product-mode}

Un serveur Axentra fonctionne dans l’un des deux modes, défini par l’opérateur du serveur dans la configuration
du serveur :

|                                                  | Mode produit unique (`single`)                                        | Mode multi-produit (`multi`)                          |
| ------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Produits                                         | Exactement un, créé à partir de la configuration au premier démarrage | Autant que nécessaire, créés dans Studio ou via l’API |
| **Nouveau produit**, **Archiver**, **Restaurer** | Non proposés ; l’API les refuse avec **Indisponible dans ce mode**    | Avec `products:create` / `products:archive`           |
| Liste des produits                               | Affiche l’unique produit et la mention **Mode produit unique**        | Tous les produits auxquels tu as accès                |

En mode produit unique, tu modifies toujours le nom, la description, les paramètres et les membres du produit
sur sa page. Pour exploiter plusieurs produits, l’opérateur du serveur définit `mode = "multi"` dans la configuration
du serveur ; aucune migration de données n’est nécessaire. Consulte la [configuration du serveur](help:server-configuration).

## Bon à savoir {#good-to-know}

- Les comptes utilisateur valent pour toute l’installation : un même compte peut travailler dans plusieurs produits.
- Les produits archivés conservent leurs données, leurs événements d’audit et leurs clés ; rien n’expire du fait de l’archivage.
- Les paramètres du produit ne sont pas un stockage de secrets. Ne mets ni mots de passe ni jetons dans les **Paramètres (JSON)**.

## Dépannage {#troubleshooting}

**Conflit à la création d’un produit.** Un autre produit utilise déjà ce slug. Choisis un autre
slug.

**Vérifie ta saisie : « slug must be 2-63 lowercase letters, digits or dashes ».** Retire du slug les
majuscules, les espaces et les caractères spéciaux.

**Ce JSON n’est pas valide. / Les paramètres doivent être un objet JSON.** Les **Paramètres (JSON)** doivent former un seul
objet entre accolades, par exemple `{"key": "value"}`. Les tableaux, les simples chaînes et les virgules finales
sont refusés.

**Vérifie ta saisie : « settings are too large »** ou un message concernant `storage`. L’objet dépasse
environ 32 000 caractères, ou la partie `storage` n’est pas valide. Raccourcis-le, ou modifie la
politique de stockage dans l’onglet **Fichiers**.

**Modifié entre-temps.** Une autre personne a enregistré le produit pendant que tu le modifiais. Recharge la
page et applique de nouveau ta modification.

**Indisponible dans ce mode.** Le serveur fonctionne en mode produit unique, dans lequel les produits ne peuvent être ni
créés, ni archivés, ni restaurés.

**Utilisateur introuvable lors de l’ajout d’un opérateur.** La personne n’a pas de compte, ou pas de compte visible pour toi.
Consulte [ajouter un opérateur](#add-operator).

**Conflit : « the product needs at least one owner ».** Tu as tenté de retirer ou de rétrograder le dernier
**Product owner**. Désigne d’abord une autre personne comme propriétaire.

**Un produit est absent de la liste.** Il est archivé (seuls les administrateurs et les lecteurs de la plateforme
voient les produits archivés), ou tu n’en es pas membre. Adresse-toi à un administrateur de la plateforme.
