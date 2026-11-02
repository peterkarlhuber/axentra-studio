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

Les opérateurs d’un produit entier se gèrent quant à eux au niveau du produit, voir
[produits](help:products#members).

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

- **Module de notifications activé :** Axentra met en file d’attente un e-mail d’invitation vers l’adresse, avec le
  lien d’acceptation, et Studio affiche le même lien pour que tu puisses aussi l’envoyer toi-même. Le lien pointe vers
  le paramètre de produit `invitation_accept_url`, s’il est défini (voir les
  [paramètres du produit](help:products#settings)) ; sinon vers `/accept-invitation` sur l’URL publique du
  serveur. Pour envoyer les personnes directement vers la page d’acceptation de Studio, définis `invitation_accept_url` sur
  `https://<your Studio address>/invitations/accept?token={token}`.
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

## Accepter une invitation {#accept}

Voici ce que fait la personne invitée :

1. Se connecter à Studio avec le compte dont l’adresse e-mail est l’adresse invitée. Une personne
   sans compte peut en créer un en se connectant par authentification unique avec cette adresse
   (quand ton serveur propose l’authentification unique) ; il n’existe pas d’inscription libre avec mot de passe.
2. Ouvrir le lien d’invitation. Si elle n’a que le jeton, ouvrir **Accepter l’invitation** à l’adresse
   `/invitations/accept` et le coller dans **Jeton d’invitation**.
3. Choisir **Accepter l’invitation**.

Studio confirme **Invitation acceptée** et le locataire apparaît dans le produit. Si la personne était
déjà membre du locataire, son rôle existant reste inchangé.

> [!IMPORTANT]
> Une invitation ne peut être acceptée que par un utilisateur connecté dont le compte a exactement l’adresse e-mail
> invitée (la casse n’a pas d’importance). Les utilisateurs sans adresse e-mail ne peuvent pas accepter
> d’invitations ; ajoute-les plutôt directement.

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

**À l’acceptation : Introuvable, « the invitation is invalid or expired ».** Le jeton est erroné, ou
l’invitation a déjà été acceptée ou révoquée, ou elle a plus de 7 jours. Demande une nouvelle invitation.

**À l’acceptation : Non autorisé, « this invitation was sent to another email address ».** Tu es
connecté avec un compte associé à une autre adresse, ou sans adresse e-mail. Connecte-toi avec
l’adresse invitée, ou demande une invitation à ton adresse.

**La personne invitée ne peut pas se connecter.** Elle n’a pas encore de compte. Studio ne peut pas créer de comptes et
il n’existe pas d’inscription par mot de passe. Une personne invitée obtient un compte en se connectant par authentification
unique avec l’adresse e-mail invitée et vérifiée ; sans authentification unique, adresse-toi à un administrateur de la
plateforme. Consulte [se connecter](help:signing-in).

**La boîte de dialogue d’invitation n’affiche qu’un jeton.** Le module de notifications est désactivé, aucun lien n’a donc
été généré. Partage le jeton.
