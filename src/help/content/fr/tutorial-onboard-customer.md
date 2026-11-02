---
title: Intégrer une organisation cliente
summary: Configurer un nouveau client de bout en bout - locataire, administrateur et personnel avec les bons rôles, invitations acceptées, clé d’API pour son intégration et vérification dans l’audit.
keywords: onboarding, intégration d’un client, nouveau client, configuration client, configuration d’un locataire, inviter, invitation, accepter une invitation, propriétaire, owner, administrateur, admin, membre, member, lecteur, viewer, intégration, clé d’API, audit, liste de contrôle, départ d’un client, offboarding
---

Un nouveau client, « Acme Ltd », s’est inscrit à ton produit. Dans ce tutoriel, tu prépares tout ce
dont il a besoin : son propre locataire, son administrateur et son personnel avec des rôles adaptés,
une clé d’API pour son intégration, et une vérification dans le journal d’audit que tout s’est
déroulé comme prévu. Tu apprends aussi ce que le client doit faire de son côté pour accepter une
invitation.

Ce tutoriel s’appuie sur [Premiers pas](help:first-steps). Compte environ 30 minutes, plus le temps
dont le client a besoin pour accepter.

## Avant de commencer {#before-you-start}

> [!IMPORTANT]
> Tu as besoin de ces autorisations dans le produit (les rôles intégrés **Product owner** et
> **Product admin** les ont toutes ; un administrateur de la plateforme les a de toute façon) :
>
> | Tâche                                    | Autorisation                                                                                              |
> | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
> | Créer le locataire                       | `tenants:create`                                                                                          |
> | Inviter, ajouter et modifier des membres | `members:manage`                                                                                          |
> | Inviter l’**Owner** du client            | rang de propriétaire : opérateur du produit, propriétaire du locataire ou administrateur de la plateforme |
> | Créer la clé d’API                       | `api_keys:manage` et chaque autorisation que tu attribues à la clé                                        |
> | Consulter le journal d’audit             | `audit:read`                                                                                              |

Recueille au préalable auprès du client :

- l’adresse e-mail de son **administrateur** et de chaque membre du personnel,
- ce que chaque personne doit pouvoir faire,
- ce que son intégration doit faire via l’API.

## Étape 1 : planifier les rôles {#plan-roles}

Choisis les rôles avant d’inviter qui que ce soit ; il est possible de les changer plus tard, mais
on l’oublie plus facilement.

| Personne                                 | Rôle de locataire recommandé | Pourquoi                                                                                      |
| ---------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| Administrateur principal du client       | **Owner**                    | Contrôle total du locataire, peut gérer tous les membres, y compris les autres propriétaires. |
| Administrateur adjoint                   | **Admin**                    | Gère les membres et les données, mais ne peut ni attribuer ni retirer de propriétaires.       |
| Personnel qui travaille avec les données | **Member**                   | Lit et écrit les données, voit les membres ; ne peut pas gérer les membres.                   |
| Auditeurs, personnel en lecture seule    | **Viewer**                   | Lit uniquement les données.                                                                   |

Si aucun ne convient, un opérateur du produit disposant de `roles:manage` peut d’abord créer un rôle
de locataire personnalisé. Voir [Rôles et autorisations](help:roles-permissions).

> [!TIP]
> N’attribue **Owner** qu’à une ou deux personnes. Un second propriétaire évite un blocage lorsque le premier part.

## Étape 2 : créer le locataire {#create-tenant}

1. Ouvre [Locataires](app:tenants) et choisis **Nouveau locataire**.
2. **Nom** : `Acme Ltd`. Conserve le **Slug** dérivé `acme-ltd`, ou saisis le nom court du client.
   Le slug doit être unique dans le produit et ne peut pas être réutilisé tant que le locataire
   existe.
3. Choisis **Créer le locataire**.

**Résultat attendu :** le message _Locataire « Acme Ltd » créé_ s’affiche ; la page du locataire s’ouvre avec le statut
**Actif** et sans membres. Note l’**ID** du locataire (`ten_…`) dans l’onglet **Détails**.

## Étape 3 : inviter l’administrateur du client {#invite-admin}

1. Sur la page du locataire, ouvre **Invitations** et choisis **Inviter un membre**.
2. **Adresse e-mail** : l’adresse de l’administrateur, par exemple `admin@acme.example`.
3. **Rôle** : **Owner**.
4. Choisis **Envoyer l’invitation**.

**Résultat attendu :** **Invitation créée** avec le **Jeton d’invitation** et, si le module `notify`
est activé, un **Lien d’invitation**. Les deux ne sont affichés qu’une seule fois.

### Comment l’invitation parvient au client {#delivery}

- **Avec le module `notify`**, Axentra envoie l’invitation par e-mail à l’adresse, lien compris. Tu
  n’as rien à envoyer ; tu peux tout de même copier le lien par précaution.
- **Sans ce module**, copie le **Jeton d’invitation** et envoie-le toi-même par un canal de
  confiance, avec les instructions de l’[étape 5](help:tutorial-onboard-customer#accept-invitation).

> [!NOTE]
> Le lien d’invitation est construit à partir du paramètre de produit `invitation_accept_url` (dans
> les **Paramètres (JSON)** du produit), par exemple
> `{"invitation_accept_url": "https://app.example.com/accept-invitation?token={token}"}`. Sans ce
> paramètre, le paramètre de serveur `notify.invitation_accept_url` s’applique ; sans lui, le lien
> pointe vers `/accept-invitation` sur l’adresse publique de l’API, que le Studio redirige vers sa
> page d’acceptation quand il tourne à cette adresse. Fais pointer le lien vers la page de ton
> produit qui accepte les invitations, ou vers la page du Studio
> `https://studio.example.com/invitations/accept?token={token}` si tes clients utilisent le Studio
> à sa propre adresse.

**Vérification :** l’onglet **Invitations** affiche l’invitation avec le statut **En attente** et
une date d’expiration 7 jours plus tard.

## Étape 4 : ajouter le personnel {#add-staff}

Pour chaque autre personne, choisis une méthode :

- **La personne a déjà un compte que tu peux voir** (par exemple un membre d’un autre locataire de
  ce produit) : ouvre **Membres**, choisis **Ajouter un membre**, saisis l’**Adresse e-mail**,
  choisis le **Rôle** et confirme. La personne a accès immédiatement.
- **Sinon** : invite-la comme à l’étape 3, avec le rôle défini à l’étape 1. Si **Ajouter un
  membre** répond **Utilisateur introuvable**, choisis **Envoyer plutôt une invitation** ; le
  Studio crée une invitation avec le même rôle.

Axentra ne révèle pas si une adresse possède un compte : l’invitation fonctionne de la même façon pour toutes les adresses.

## Étape 5 : le client accepte {#accept-invitation}

Voici ce que fait la personne invitée. Envoie-lui ces instructions.

1. **Ouvrir le lien d’invitation.** Si elle n’est pas connectée, elle arrive sur **Connexion**, qui
   mentionne l’invitation, puis revient à l’invitation après s’être connectée.
2. **Se connecter avec exactement l’adresse e-mail invitée.**
   - Si ton serveur propose l’**authentification unique**, la personne se connecte avec **Continuer
     avec …**. Un compte est créé automatiquement pour une adresse e-mail vérifiée qui a une
     invitation ouverte.
   - Avec **connexion par mot de passe uniquement**, le compte doit déjà exister. Axentra n’offre
     pas d’inscription libre par l’API : les comptes pour la connexion par mot de passe sont créés
     par le code de ton produit. Voir [utilisateurs](help:users).
3. **Confirmer.** La page affiche le compte sous **Connecté en tant que** ; la personne choisit
   **Accepter l’invitation**. Avec un jeton au lieu d’un lien, elle ouvre **Accepter l’invitation**
   (adresse `/invitations/accept`) après s’être connectée et colle le **Jeton d’invitation**.

**Résultat attendu :** **Invitation acceptée**, avec le locataire, le produit et le rôle. La personne
voit maintenant le locataire selon son rôle. L’accès peut mettre quelques instants à apparaître
partout.

**Vérification (de ton côté) :** dans l’onglet **Membres** du locataire, la personne apparaît avec
le rôle **Owner**. Dans **Invitations**, le statut est **Accepté**.

> [!WARNING]
> Les invitations sont liées à l’adresse. Si la personne se connecte avec une autre adresse, le
> Studio affiche **Invitation pour une autre adresse e-mail** et propose **Se déconnecter et
> utiliser l’adresse invitée**. Une invitation acceptée, révoquée ou expirée ne peut pas être
> réutilisée (**Cette invitation ne peut pas être utilisée**) : crées-en une nouvelle.

## Étape 6 : ajuster les rôles si nécessaire {#change-role}

Dans l’onglet **Membres**, choisis un nouveau rôle dans la liste **Rôle** du membre ; le Studio
confirme « Rôle mis à jour ». Pour retirer l’accès, choisis **Retirer le membre**. Tu ne peux ni
modifier ni retirer les membres dont le rôle est supérieur au tien (signalés par « Supérieur à ton
propre rôle »).

## Étape 7 : créer la clé d’API pour l’intégration {#integration-key}

L’intégration du client (par exemple la synchronisation avec son ERP) reçoit sa propre clé, liée à
son locataire.

1. Ouvre [Clés d’API](app:apiKeys) et choisis **Nouvelle clé d’API**.
2. **Nom** : indique qui l’utilise et où, par exemple `acme erp-sync production`.
3. **Portée locataire** : **Acme Ltd**. Une clé liée à un locataire ne peut ni voir ni modifier
   d’autres locataires.
4. **Autorisations** : uniquement ce dont l’intégration a besoin, par exemple `records:read` et
   `records:write` pour une synchronisation de données, plus `events:publish` si elle publie des
   événements.
5. Choisis **Créer la clé**, copie le **Secret de la clé d’API**, confirme **J’ai conservé le
   secret en lieu sûr** et choisis **Terminé**.

Transmets le secret au contact technique du client par un canal sécurisé (par exemple un
gestionnaire de secrets partagé), jamais par simple e-mail. L’intégration l’envoie sous la forme
`Authorization: Bearer axk_…`. Teste-la comme dans [Premiers pas](help:first-steps#try-api-key).

> [!CAUTION]
> Le secret ne peut plus être affiché. S’il est perdu ou a fuité, utilise **Renouveler le secret**
> (avec un délai de grâce pour une bascule sans interruption) ou **Révoquer la clé**. Voir
> [Clés d’API](help:api-keys).

## Étape 8 : consulter le journal d’audit {#check-audit}

1. Ouvre [Journal d’audit](app:audit).
2. Règle **Produit** sur ton produit. Tu peux saisir `tenancy.*` sous **Action** pour ne voir que
   les événements de locataires et de membres, ou saisir l’ID du locataire sous **ID du
   locataire** (sous **Plus de filtres** sur les petits écrans).
3. Choisis **Appliquer les filtres**.

**Résultat attendu**, les plus récents d’abord :

| Action                      | Auteur                     | Signification                                                             |
| --------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `access.api_key.create`     | toi                        | La clé d’intégration a été créée.                                         |
| `tenancy.invitation.accept` | l’administrateur du client | L’invitation a été acceptée.                                              |
| `tenancy.member.set`        | toi                        | Un membre a été ajouté ou un rôle modifié (si tu as fait l’étape 4 ou 6). |
| `tenancy.invitation.create` | toi                        | Un par invitation.                                                        |
| `tenancy.tenant.create`     | toi                        | Le locataire a été créé.                                                  |

Tous avec le résultat **Succès**. Une tentative d’acceptation avec le mauvais compte apparaît comme
`tenancy.invitation.accept` avec le résultat **Refusé**.

## Liste de contrôle de l’intégration {#checklist}

1. Locataire créé, ID noté.
1. Administrateur invité comme **Owner**, invitation acceptée, visible sous **Membres**.
1. Personnel ajouté ou invité avec les rôles prévus ; toutes les invitations au statut **Accepté**.
1. Clé d’intégration créée, liée au locataire, autorisations minimales, secret transmis de façon
   sécurisée.
1. Le journal d’audit affiche les événements attendus.
1. Facultatif : abonnement attribué (voir [Offres et abonnements](help:plans-subscriptions)).

## Lorsque le client s’en va {#offboarding}

- Commence par **Suspendre le locataire** : les membres et les clés liées au locataire perdent
  l’accès, aucune donnée n’est supprimée et tu peux le réactiver.
- **Révoque** la clé d’intégration.
- N’utilise **Supprimer le locataire** que lorsque les données doivent disparaître ; cette action
  supprime le locataire et toutes ses données et elle est irréversible. Voir
  [Locataires](help:tenants).

## Dépannage {#troubleshooting}

| Problème                                                             | Cause et solution                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner** ne peut pas être sélectionné                               | Tu n’as pas le rang de propriétaire ou certaines autorisations du rôle (plafond de rôle). Adresse-toi à un propriétaire du produit ou à un administrateur de la plateforme.                                                                                                                                       |
| **Conflit** lors de l’invitation                                     | Une invitation ouverte existe déjà pour cette adresse dans ce locataire. Utilise-la ou révoque-la.                                                                                                                                                                                                                |
| **Utilisateur introuvable** dans **Ajouter un membre**               | Aucun compte visible pour toi ne porte cette adresse. Utilise **Envoyer plutôt une invitation**.                                                                                                                                                                                                                  |
| Le client ne reçoit pas d’e-mail                                     | Le module `notify` est désactivé, ou la remise de l’e-mail a échoué. Envoie toi-même le lien ou le jeton ; consulte [Notifications](help:notifications).                                                                                                                                                          |
| Le lien ouvre une page « introuvable » ou une page de l’API          | Le Studio tourne à sa propre adresse, et ni le paramètre de serveur `notify.invitation_accept_url` ni le paramètre de produit `invitation_accept_url` ne pointe vers lui (voir [la remise](help:tutorial-onboard-customer#delivery)). En attendant, envoie le jeton et fais-le coller sous `/invitations/accept`. |
| L’acceptation affiche **Invitation pour une autre adresse e-mail**   | La personne est connectée avec un compte dont l’adresse e-mail diffère de l’adresse invitée. Choisis **Se déconnecter et utiliser l’adresse invitée**, ou invite la bonne adresse.                                                                                                                                |
| L’acceptation affiche **Cette invitation ne peut pas être utilisée** | L’invitation a déjà été acceptée, a été révoquée ou date de plus de 7 jours, ou le jeton est incomplet. Crée une nouvelle invitation.                                                                                                                                                                             |
| L’authentification unique échoue avec « aucun compte »               | Aucune invitation ouverte pour l’adresse vérifiée, et l’inscription est désactivée. Vérifie l’adresse invitée ; voir [Connexion](help:signing-in#sso-errors).                                                                                                                                                     |
| L’intégration reçoit `403`                                           | Il manque une autorisation à la clé, ou le locataire est suspendu.                                                                                                                                                                                                                                                |
| Aucun événement dans le journal d’audit                              | Vérifie le filtre **Produit** et que tu disposes de `audit:read`.                                                                                                                                                                                                                                                 |
