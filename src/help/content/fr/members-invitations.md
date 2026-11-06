---
title: Membres et invitations
summary: Donne accès à un locataire en ajoutant des personnes comme membres ou en les invitant par e-mail, et comprends le plafond des rôles qui limite les rôles que tu peux attribuer.
keywords: membre, adhésion, inviter, invitation, lien d’invitation, jeton d’invitation, accepter une invitation, plafond des rôles, propriétaire, ajouter un utilisateur, intégration, équipe, collaborateur
---

Un **membre** est un utilisateur qui a un rôle dans un locataire, par exemple **Owner**, **Admin**, **Member** ou
**Viewer**. Le rôle détermine ce que la personne peut faire dans ce locataire. Tu donnes accès à quelqu’un de l’une
de ces deux façons :

- **Ajouter** directement un compte existant, quand ce compte est déjà visible pour toi.
- **Inviter** une personne par e-mail. Elle accepte l’invitation après s’être connectée et devient membre
  avec le rôle que tu as choisi.

Les opérateurs d’un produit entier se gèrent au niveau du produit et peuvent être invités dans
son équipe de la même façon, voir [invitations dans l’équipe du produit](#product-team).

> [!IMPORTANT]
> Voir les onglets **Membres** et **Invitations** d’un locataire exige `members:read` dans le locataire ;
> ajouter, inviter, changer de rôle, retirer et révoquer exige `members:manage`. Les propriétaires et
> administrateurs du locataire détiennent les deux ; les opérateurs **Support** détiennent `members:manage` mais ne peuvent attribuer que des rôles compris dans
> leurs propres autorisations (voir le [plafond des rôles](#role-ceiling)). Les deux écrans exigent le module des locataires.

## Rôles de locataire intégrés {#tenant-roles}

| Rôle                       | Peut                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner** (`tenant_owner`) | Tout faire dans le locataire, y compris désigner d’autres personnes comme propriétaires.                                                                                                  |
| **Admin** (`tenant_admin`) | Les mêmes autorisations qu’Owner, mais sans pouvoir attribuer, modifier ni retirer des propriétaires.                                                                                     |
| **Member** (`member`)      | Travailler avec les données : lire et écrire des enregistrements et des fichiers, publier des événements, enregistrer l’utilisation, envoyer des notifications, effectuer des recherches. |
| **Viewer** (`viewer`)      | Consulter le locataire, ses membres, ses enregistrements, ses fichiers, son utilisation et sa facturation, et effectuer des recherches.                                                   |

Les rôles de locataire personnalisés de ton produit apparaissent dans les mêmes listes, avec leur clé entre parenthèses. Consulte les
[rôles et autorisations](help:roles-permissions).

## Ajouter un utilisateur existant {#add}

1. Ouvre le locataire depuis [Locataires](app:tenants) et sélectionne l’onglet **Membres**.
2. Choisis **Ajouter un membre**.
3. Saisis l’**Adresse e-mail** et choisis un **Rôle**.
4. Choisis **Ajouter un membre**.

Cela ne fonctionne que pour les comptes visibles pour toi : les administrateurs de la plateforme voient tous les comptes ; les utilisateurs disposant de
`product_users:read` (propriétaires, administrateurs, support et lecteurs du produit) voient toutes les personnes qui appartiennent déjà
au produit ; toutes les autres personnes ne voient que les membres du locataire. Pour toute autre adresse,
la boîte de dialogue affiche **Utilisateur introuvable** et propose **Envoyer plutôt une invitation**, qui crée une
invitation avec la même adresse e-mail et le même rôle.

> [!NOTE]
> Axentra répond « introuvable » de la même façon, qu’un compte n’existe pas ou qu’il ne soit simplement pas
> visible pour toi. Cela empêche de sonder la liste des comptes du serveur.

## Changer un rôle ou retirer un membre {#change-role}

- Pour changer un rôle, choisis-en un nouveau dans la colonne **Rôle** du membre. La modification s’applique
  immédiatement.
- Pour retirer un membre, choisis l’icône de corbeille de la ligne et confirme **Retirer le membre ?**. La personne
  perd tous les accès accordés par cette adhésion. Son compte et ses autres adhésions sont conservés.

Un locataire garde toujours au moins un **Owner** : le dernier propriétaire ne peut ni être retiré ni recevoir un autre
rôle. Désigne d’abord une autre personne comme propriétaire.

## Inviter quelqu’un par e-mail {#invite}

1. Ouvre le locataire et sélectionne l’onglet **Invitations**, ou ouvre [Invitations](app:invitations)
   et choisis le locataire.
2. Choisis **Inviter un membre**.
3. Saisis l’**Adresse e-mail** et choisis un **Rôle**. Studio présélectionne **Member**, ou le premier
   rôle que tu as le droit d’attribuer.
4. Choisis **Envoyer l’invitation**.

La boîte de dialogue **Invitation créée** affiche alors le **Lien d’invitation** (lorsqu’il existe) et le
**Jeton d’invitation**.

> [!CAUTION]
> Le lien et le jeton ne sont affichés qu’une seule fois. Axentra ne conserve qu’une empreinte du jeton :
> personne ne peut donc l’afficher de nouveau. Toute personne qui possède le jeton et se connecte avec l’adresse invitée peut
> rejoindre le locataire. Ne le partage qu’avec la personne invitée. S’il est perdu, révoque l’invitation et
> crées-en une nouvelle.

### Comment l’invitation parvient à la personne {#delivery}

- **Module de notifications activé :** Axentra met en file d’attente un e-mail d’invitation vers
  l’adresse avec le lien d’acceptation, et le Studio affiche le même lien pour que tu puisses aussi
  l’envoyer toi-même. Le lien utilise le paramètre de produit `invitation_accept_url` s’il est
  défini (voir les [paramètres du produit](help:products#settings)), sinon le paramètre de serveur
  `notify.invitation_accept_url` (voir la
  [configuration du serveur](help:server-configuration#user-visible-settings)), sinon
  `/accept-invitation` sur l’URL publique du serveur. Le Studio sert `/accept-invitation` et le
  redirige vers sa page **Accepter l’invitation** : la valeur par défaut fonctionne donc quand le
  Studio tourne à l’adresse de l’API. Si le Studio a sa propre adresse (par exemple
  `https://studio.example.com` à côté de `https://api.example.com`), la valeur par défaut pointe
  vers l’API : règle `notify.invitation_accept_url` (ou le paramètre de produit) sur
  `https://<your Studio address>/invitations/accept`.
- **Module de notifications désactivé :** aucun e-mail n’est envoyé et il n’y a pas de lien. Partage le
  **Jeton d’invitation** ; la personne le saisit sur la page **Accepter l’invitation** de Studio.

### Durée de validité et statut d’une invitation {#expiry}

| Statut         | Signification                                                         |
| -------------- | --------------------------------------------------------------------- |
| **En attente** | Ouverte et valide ; peut être acceptée ou révoquée.                   |
| **Accepté**    | Utilisée ; la personne est membre.                                    |
| **Révoqué**    | Annulée avec **Révoquer l’invitation** ; le jeton ne fonctionne plus. |
| **Expiré**     | Non acceptée dans les **7 jours** qui suivent sa création.            |

La durée de validité de 7 jours est fixe. Pour la prolonger, révoque l’invitation (si elle est encore en attente) et invite
de nouveau la personne. Il ne peut exister qu’une seule invitation ouverte à la fois par adresse e-mail et par locataire.

### Révoquer une invitation {#revoke}

Choisis l’icône de corbeille à côté d’une invitation **En attente** et confirme **Révoquer l’invitation ?**. Le
lien et le jeton cessent immédiatement de fonctionner.

## Inviter des opérateurs dans l’équipe d’un produit {#product-team}

Tu peux aussi inviter des opérateurs (utilisateurs avec un rôle de produit, voir
[produits](help:products#members)) par e-mail. Ouvre le produit depuis [Produits](app:products) et
sélectionne l’onglet **Invitations**, ou choisis **Envoyer plutôt une invitation** quand **Ajouter
un membre** dans l’onglet **Membres** ne trouve pas l’adresse. Studio présélectionne **Product
viewer**, ou le premier rôle de produit que tu peux attribuer.

- L’onglet nécessite `product_members:read` ; inviter et révoquer nécessite
  `product_members:manage`.
- Le lien, le jeton, l’envoi, la validité de 7 jours et la révocation fonctionnent comme pour les
  invitations dans un locataire. Le jeton commence par `axpinv_`, et la page **Accepter
  l’invitation** le reconnaît.
- Après avoir accepté, la personne a le rôle de produit dans chaque locataire du produit. Un rôle
  de produit qu’elle a déjà reste inchangé.
- Personne ne peut rejoindre l’équipe d’un produit archivé. L’invitation reste inutilisée jusqu’à
  la restauration du produit.

## Accepter une invitation {#accept}

Voici ce que fait la personne invitée :

1. Ouvre le lien d’invitation. Si tu n’es pas connecté, **Connexion** indique que tu te connectes
   pour une invitation et te ramène ensuite vers elle, y compris après l’authentification unique.
2. Connecte-toi avec le compte dont l’adresse e-mail est l’adresse invitée. Pas encore de compte ?
   Si la page de connexion propose l’authentification unique, connecte-toi par ce biais avec
   l’adresse invitée : le serveur crée ton compte, car une invitation est ouverte pour elle. Il n’y
   a pas d’inscription avec mot de passe ; adresse-toi à la personne qui t’a invité ou à un
   administrateur.
3. Vérifie le compte affiché sous **Connecté en tant que** et choisis **Accepter l’invitation**.
   Après une connexion par mot de passe, rien ne se passe avant ta confirmation. Le Studio retire le
   jeton de la barre d’adresse dès que la page l’a lu, pour qu’il ne reste pas dans l’historique du
   navigateur ; le champ **Jeton d’invitation** est rempli. Si tu n’as que le jeton, ouvre
   **Accepter l’invitation** à l’adresse `/invitations/accept` et colle-le.

Avec l’authentification unique, le serveur accepte l’invitation dès que tu es connecté. Le Studio
vérifie que tu es désormais membre du locataire et affiche aussitôt **Invitation acceptée**, sans
seconde confirmation. Si le serveur n’a pas pu l’accepter (par exemple parce que tu t’es connecté
avec une autre adresse), la page te demande ta confirmation comme à l’étape 3 et explique ce qui n’a
pas fonctionné.

**Invitation acceptée** indique le locataire, le produit et ton rôle ; **Ouvrir le locataire** t’y
amène. Si tu étais déjà membre du locataire, ton rôle actuel reste inchangé.

> [!IMPORTANT]
> Seul un utilisateur connecté dont le compte a exactement l’adresse e-mail invitée peut accepter
> une invitation (la casse ne compte pas). Les utilisateurs sans adresse e-mail ne peuvent pas
> accepter d’invitation ; ajoute-les directement.

## Plafond des rôles : quels rôles tu peux attribuer {#role-ceiling}

Détenir `members:manage` ne te permet pas de donner plus que ce que tu possèdes toi-même. Le serveur
applique ces règles, et Studio les affiche à l’avance :

1. **Autorisations.** Tu ne peux attribuer un rôle (ajouter, inviter ou passer à ce rôle) que si tu détiens toutes
   les autorisations de ce rôle dans le même locataire. Tu ne peux modifier ou retirer un membre que si son rôle
   _actuel_ est lui aussi compris dans tes autorisations.
2. **Rang de propriétaire.** Le rôle **Owner** ne peut être attribué, modifié ou retiré que par un propriétaire du
   locataire, par un opérateur de produit, par une clé d’API valable pour tout le produit ou par un administrateur de la plateforme.
3. **Dernier propriétaire.** Le dernier propriétaire d’un locataire (et le dernier **Product owner** d’un produit) ne peut
   être ni retiré ni rétrogradé.

| Tu es                                     | Tu peux attribuer                                | Tu ne peux pas                                                                  |
| ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Administrateur de la plateforme           | Tous les rôles                                   | Aucune limite                                                                   |
| Propriétaire ou administrateur du produit | Tous les rôles de locataire, y compris **Owner** | (Les administrateurs du produit ne peuvent pas gérer les opérateurs du produit) |
| Opérateur **Support**                     | **Viewer**                                       | **Member**, **Admin**, **Owner**                                                |
| **Owner** du locataire                    | Tous les rôles du locataire                      | Retirer le dernier propriétaire                                                 |
| **Admin** du locataire                    | **Admin**, **Member**, **Viewer**                | Attribuer, rétrograder ou retirer un **Owner**                                  |
| Rôle personnalisé avec `members:manage`   | Les rôles dont il détient les autorisations      | Les rôles plus puissants                                                        |

Dans Studio, les rôles que tu ne peux pas attribuer apparaissent sous la forme **« … (au-delà de tes autorisations) »** et sont désactivés,
et les membres que tu ne peux pas modifier affichent **Supérieur à ton propre rôle**, sans sélecteur de rôle ni bouton
de retrait.

> [!NOTE]
> Studio ne peut calculer le plafond que si tu peux lire les rôles du produit (`roles:read`).
> Sans cette autorisation, le rôle est un champ de texte libre et le serveur explique un refus avec **Non
> autorisé**.

## Dépannage {#troubleshooting}

**Utilisateur introuvable.** Le compte n’existe pas, ou tu n’as pas le droit de le voir. Utilise **Envoyer
plutôt une invitation**.

**Conflit : « an open invitation for this email exists ».** Une invitation en attente existe déjà pour cette adresse
dans le locataire. Utilise-la, ou révoque-la et invite de nouveau.

**Non autorisé : « you cannot assign the role …: it has permissions you do not hold ».** Le rôle est
au-dessus de ton niveau. Choisis un rôle moins puissant ou adresse-toi à un propriétaire. Consulte le [plafond des rôles](#role-ceiling).

**Non autorisé : « only owners can assign the role tenant_owner ».** Seuls les propriétaires, les opérateurs de produit
et les administrateurs de la plateforme peuvent gérer les propriétaires.

**Conflit : « the tenant needs at least one owner ».** Tu as tenté de retirer ou de rétrograder le dernier propriétaire.

**Vérifie ta saisie : « unknown tenant role … ».** La clé de rôle n’existe pas dans ce
produit (par exemple une faute de frappe dans le champ de rôle en texte libre), ou il s’agit d’un rôle de produit.

**À l’acceptation : Cette invitation ne peut pas être utilisée.** Le serveur répond de la même
façon pour une invitation expirée (après 7 jours), déjà acceptée ou révoquée, et pour un lien ou un
jeton incomplet ou mal saisi, afin que personne ne puisse sonder les invitations. Demande une
nouvelle invitation à la personne qui t’a invité.

**À l’acceptation : Invitation pour une autre adresse e-mail.** Tu es connecté avec un compte pour
une autre adresse. Choisis **Se déconnecter et utiliser l’adresse invitée** : une fois connecté avec
l’adresse invitée, le Studio te ramène à l’invitation. Ou demande une invitation pour ta propre
adresse.

**À l’acceptation : Ton compte n’a pas d’adresse e-mail.** Ces comptes ne peuvent pas accepter
d’invitation. Connecte-toi avec l’adresse invitée ou demande à la personne qui t’a invité d’ajouter
directement ton compte au locataire.

**À l’acceptation : Le locataire n’est pas actif.** Le locataire auquel tu as été invité, ou son
produit, est suspendu ou fermé : personne ne peut le rejoindre pour l’instant. L’invitation reste
inutilisée. Quand le locataire est de nouveau actif, rouvre le lien. Le serveur refuse avec
« the invitation cannot be accepted: the tenant is not active ».

**À l’acceptation : L’invitation n’est plus valable.** La personne qui t’a invité ne peut plus
attribuer ce rôle, par exemple parce que son propre rôle ou son appartenance a changé après l’envoi.
Demande-lui, ou à une autre personne qui administre le locataire, une nouvelle invitation. Le
serveur refuse avec « the invitation is no longer valid: its sender can no longer grant this
role ».

**À l’acceptation : Le serveur est injoignable.** Rien n’a été modifié. Vérifie ta connexion et
choisis **Réessayer**.

**Le lien d’invitation ouvre « introuvable » ou une page de l’API.** Le lien pointe vers une adresse
où le Studio ne tourne pas. Règle le paramètre de serveur `notify.invitation_accept_url` (ou le
paramètre de produit `invitation_accept_url`) sur la page d’acceptation du Studio, voir
[la remise](#delivery). En attendant, envoie le jeton et fais-le coller sous `/invitations/accept`.

**La personne invitée ne peut pas se connecter.** Elle n’a pas encore de compte. Studio ne peut pas créer de comptes et
il n’existe pas d’inscription par mot de passe. Une personne invitée obtient un compte en se connectant par authentification
unique avec l’adresse e-mail invitée et vérifiée ; sans authentification unique, adresse-toi à un administrateur de la
plateforme. Consulte [se connecter](help:signing-in).

**La boîte de dialogue d’invitation n’affiche qu’un jeton.** Le module de notifications est désactivé, aucun lien n’a donc
été généré. Partage le jeton.
