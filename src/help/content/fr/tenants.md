---
title: Locataires
summary: Crée des locataires pour tes clients, renomme-les, suspends-les, réactive-les et supprime-les, et comprends l’effet de chaque action sur l’accès et les données.
keywords: locataire, tenant, client, organisation, compte, espace de travail, entreprise, suspendre, réactiver, supprimer un locataire, slug
---

Un **locataire** est un client ou une organisation au sein d’un produit. Les données de chaque locataire (enregistrements,
fichiers, utilisation, abonnements, notifications) sont strictement séparées de celles de tous les autres locataires, y compris
dans la base de données. Les personnes accèdent à un locataire par une **adhésion** assortie d’un rôle de locataire, voir
[membres et invitations](help:members-invitations).

Crée un locataire par client. Les opérateurs de produit (utilisateurs ayant un rôle de produit) travaillent dans tous les
locataires ; les membres d’un locataire ne voient que leur propre locataire.

```diagram
hierarchy
```

> [!IMPORTANT]
> L’écran **Locataires** exige le module des locataires. Voir la liste exige `tenants:read` ;
> sans cette autorisation, tu ne vois que les locataires dont tu es membre. Créer exige `tenants:create`,
> renommer, suspendre et réactiver `tenants:update`, supprimer `tenants:delete`. Les propriétaires
> et les administrateurs du produit les détiennent toutes.

## Trouver un locataire {#find}

Ouvre [Locataires](app:tenants). Utilise **Rechercher des locataires** pour filtrer par nom ou par slug, et le filtre **Statut**
pour n’afficher que les locataires **Actif** ou **Suspendu**. La colonne **Membres** compte les
adhésions du locataire.

## Créer un locataire {#create}

1. Ouvre [Locataires](app:tenants) et choisis **Nouveau locataire**.
2. Saisis le **Nom**, par exemple la raison sociale du client.
3. Vérifie le **Slug**. Studio le dérive du nom ; tu peux le modifier avant de créer le
   locataire.
4. Choisis **Créer le locataire**.

Studio ouvre le nouveau locataire. Il n’a encore aucun membre : ajoute la première personne du client dans l’onglet
**Membres**, ou invite-la dans l’onglet **Invitations**, généralement avec le rôle **Owner**. Consulte les
[membres et invitations](help:members-invitations).

| Champ      | Effet                                                                                  | Valeurs autorisées / par défaut                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Nom**    | Nom affiché dans Studio et dans les e-mails d’invitation.                              | 1 à 200 caractères. Modifiable ultérieurement.                                                                                      |
| **Slug**   | Identifiant stable, adapté aux URL, également à saisir pour confirmer une suppression. | 2 à 63 lettres minuscules, chiffres et tirets, commençant par une lettre ou un chiffre ; unique au sein du produit. Non modifiable. |
| **ID**     | Identifiant généré (`ten_…`) utilisé par l’API.                                        | Attribué par le serveur.                                                                                                            |
| **Statut** | **Actif** ou **Suspendu**.                                                             | Les nouveaux locataires sont **Actif**.                                                                                             |

> [!TIP]
> Via l’API, un locataire peut être créé avec un propriétaire en une seule étape (`owner_user_id`), et il peut
> porter son propre objet `settings`. Studio n’affiche pas ces éléments.

## Renommer un locataire {#rename}

1. Ouvre le locataire et reste dans l’onglet **Détails**.
2. Modifie le **Nom** sous **Modifier le locataire**.
3. Choisis **Enregistrer les modifications**.

Le slug et l’ID ne changent jamais.

## Suspendre un locataire {#suspend}

La suspension bloque tout accès à un locataire sans rien supprimer, par exemple quand un client
n’a pas payé ou qu’un contrat est mis en pause.

1. Ouvre le locataire.
2. Choisis **Suspendre le locataire** et confirme.

Tant qu’un locataire est suspendu :

- ses membres ne peuvent pas y accéder ; leurs requêtes sont refusées avec **Non autorisé** ;
- les clés d’API liées au locataire, et les clés valables pour tout le produit qui y travaillent, sont refusées elles aussi ;
- les opérateurs du produit perdent eux aussi l’accès aux données du locataire et à sa page ; le locataire reste dans la
  liste [Locataires](app:tenants) avec le statut **Suspendu** ;
- les administrateurs de la plateforme conservent un accès complet et les lecteurs de la plateforme un accès en lecture ;
- aucune donnée n’est supprimée.

## Réactiver un locataire {#reactivate}

1. Ouvre le locataire suspendu.
2. Choisis **Réactiver le locataire**.

Les membres et les clés fonctionnent de nouveau immédiatement.

> [!WARNING]
> Seuls les administrateurs de la plateforme (et les lecteurs de la plateforme, en lecture seule) peuvent ouvrir la page
> d’un locataire suspendu. Un propriétaire ou un administrateur du produit qui n’est pas administrateur de la plateforme y obtient **Non autorisé**
> et ne peut pas atteindre **Réactiver le locataire** dans Studio. Adresse-toi à un administrateur de la plateforme, ou réactive le locataire
> via l’API avec `tenants:update` :
>
> ```http
> PATCH /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE
> Content-Type: application/json
>
> {"status": "active"}
> ```

## Supprimer un locataire {#delete}

> [!CAUTION]
> La suppression d’un locataire est irréversible. Le locataire est supprimé avec ses enregistrements, ses fichiers,
> ses adhésions, ses invitations, ses clés d’API liées, ses données d’utilisation, son abonnement, ses notifications et ses données
> de recherche. En cas de doute, [suspends](#suspend) plutôt le locataire.

1. Ouvre le locataire.
2. Choisis **Supprimer le locataire**.
3. Saisis le **slug** du locataire (pas son nom) pour confirmer, puis choisis **Supprimer le locataire**.

Studio revient à la liste des locataires. Le journal d’audit conserve la trace de la suppression. Le contenu des fichiers
stockés est retiré du backend de stockage par la maintenance régulière du stockage du serveur.

## Parcourir les données d’un locataire {#records}

**Parcourir les enregistrements** sur la page du locataire ouvre [Enregistrements](app:records) filtré sur ce locataire. Ce bouton est
affiché quand le module des enregistrements est activé et que tu détiens `records:read` dans le locataire. Consulte les
[enregistrements](help:records).

## Bon à savoir {#good-to-know}

- Un utilisateur peut être membre de plusieurs locataires, dans le même produit ou dans des produits différents, avec un rôle
  différent dans chacun.
- Les opérateurs de produit n’ont pas besoin d’adhésion : leur rôle de produit couvre déjà tous les locataires.
- Les sélecteurs des autres écrans (par exemple **Portée locataire** pour les clés d’API, ou l’écran **Invitations**)
  listent les 200 premiers locataires par ordre de nom.

## Dépannage {#troubleshooting}

**Conflit : « a tenant with this slug exists in the product ».** Choisis un autre slug. Les slugs des
locataires supprimés peuvent être réutilisés.

**Vérifie ta saisie : « slug must be 2-63 lowercase letters, digits or dashes ».** Retire du slug les
majuscules, les espaces et les caractères spéciaux.

**Non autorisé à l’ouverture d’un locataire.** Le locataire est suspendu (voir [réactiver](#reactivate)),
ou le produit est archivé, ou il te manque `tenant:read` dans ce locataire.

**Introuvable à l’ouverture d’un locataire.** Le locataire a été supprimé, ou tu n’as aucun lien avec lui
(Axentra répond de la même façon pour que les ID de locataire ne puissent pas être sondés).

**Modifié entre-temps.** Une autre personne a modifié le locataire pendant que tu l’éditais. Recharge la
page et répète ta modification.

**Le bouton de suppression reste désactivé.** Saisis le slug exactement tel qu’il est affiché dans la boîte de dialogue, par exemple
`acme`, et non le nom affiché.

**Pas de bouton Nouveau locataire.** Il te manque `tenants:create`. Adresse-toi à un propriétaire ou à un administrateur du produit.
