---
title: Ton profil
summary: Voir ton compte et tes adhésions, modifier ton nom d’affichage et ton mot de passe, et déconnecter les navigateurs que tu n’utilises plus.
keywords: profil, compte, mon compte, nom d’affichage, nom, mot de passe, changer le mot de passe, définir un mot de passe, sessions, appareils, se déconnecter, déconnexion partout, authentification unique, SSO, vérifier l’e-mail, vérification, vérifiée
---

Ton **Profil** est l’endroit où tu gères ton propre compte : le nom que voient les autres, ton mot
de passe et les navigateurs sur lesquels tu es connecté. Il indique aussi à quels produits tu
appartiens et avec quel rôle. Chaque utilisateur connecté a un profil ; aucune autorisation n’est
nécessaire.

Ouvre-le depuis le menu utilisateur en haut à droite avec **Profil** ([ouvrir](app:profile)). La
langue et le thème se trouvent sur la page [Paramètres](help:settings#preferences) et dans ce même
menu utilisateur.

## Vérifier ton compte {#account}

La carte **Compte** affiche :

| Champ                      | Signification                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Adresse e-mail**         | L’adresse avec laquelle tu te connectes. Tu ne peux pas la modifier toi-même                              |
| **ID utilisateur**         | Ton ID (`usr_…`), par exemple pour filtrer le [journal d’audit](help:audit#filter) par **ID de l’auteur** |
| **Rôle sur la plateforme** | `platform_admin` ou `platform_viewer` si tu en as un, sinon **Aucun**                                     |
| **Produits**               | Chaque produit auquel tu appartiens, avec ton rôle de produit (par exemple **Acme CRM · product_admin**)  |

Les adhésions aux locataires ne sont pas listées ici ; elles figurent sur les pages des locataires.
Pour obtenir un autre rôle, adresse-toi à un propriétaire du produit ou à un administrateur de la
plateforme ; voir [Rôles et autorisations](help:roles-permissions).

## Confirmer ton adresse e-mail {#email-verification}

À côté de ton **Adresse e-mail**, la carte **Compte** affiche **Vérifiée** ou **Non vérifiée**. Une
adresse est vérifiée quand tu as ouvert un lien de vérification ou de réinitialisation du mot de
passe envoyé à cette adresse, ou quand ton fournisseur d’identité l’a confirmée lors de ta première
authentification unique.

1. Choisis **Envoyer l’e-mail de vérification** à côté de **Non vérifiée**.
2. Ouvre le lien de l’e-mail (dans n’importe quel navigateur ; tu n’as pas besoin d’y être
   connecté) et choisis **Confirmer l’adresse e-mail**.

**Résultat attendu :** la page affiche **Adresse e-mail confirmée** et ton profil affiche
**Vérifiée**. Tu peux envoyer un nouvel e-mail une fois par minute ; seul le lien le plus récent
fonctionne, et il expire après 48 heures par défaut. L’e-mail est envoyé par l’un de tes produits ;
si tu n’appartiens à aucun, le serveur répond qu’il ne peut pas l’envoyer.

## Modifier ton nom d’affichage {#name}

1. Dans **Nom d’affichage**, modifie le **Nom** (200 caractères au maximum).
2. Choisis **Enregistrer les modifications**. Le bouton n’est actif que si le nom diffère de celui
   enregistré.

Le nom apparaît dans le menu utilisateur, dans les listes de membres et comme **Auteur** de tes
actions dans le journal d’audit. Les événements d’audit passés conservent le nom que tu avais au
moment de leur enregistrement.

## Changer ton mot de passe {#password}

1. Dans **Changer le mot de passe**, saisis ton **Mot de passe actuel**.
2. Saisis deux fois le **Nouveau mot de passe** (**Confirmer le nouveau mot de passe**).
3. Choisis **Changer le mot de passe**.

> [!WARNING]
> Changer le mot de passe **te déconnecte immédiatement de tous les autres navigateurs et
> appareils**. Le navigateur que tu utilises reste connecté. Fais-le si tu soupçonnes que quelqu’un
> d’autre connaît ton mot de passe.

Le nouveau mot de passe doit

- être au moins aussi long que le minimum du serveur (par défaut 12 caractères, voir
  `password_min_length` dans [Paramètres](help:settings#settings-tree)) et compter au plus
  1 024 caractères,
- ne pas être ton adresse e-mail,
- contenir au moins 4 caractères différents.

### Définir un premier mot de passe (utilisateurs de l’authentification unique) {#set-password}

Si tu ne t’es jamais connecté que par authentification unique, la carte s’intitule **Définir un mot
de passe** et ne comporte pas de champ **Mot de passe actuel**. Un mot de passe te permet de te
connecter aussi avec ton adresse e-mail et ton mot de passe.

Pour ta sécurité, un premier mot de passe ne peut être défini que **peu de temps après ta
connexion** (par défaut : dans les 5 minutes ; l’opérateur règle cette durée avec
`security.fresh_login_minutes`). Si ta connexion est plus ancienne, le Studio affiche
**Reconnecte-toi** :

1. Choisis **Se reconnecter**. Le Studio te déconnecte et ouvre la page de connexion.
2. Connecte-toi. Tu reviens sur ton profil.
3. Dans les minutes qui suivent, saisis deux fois le **Nouveau mot de passe** et choisis **Définir
   le mot de passe**.

> [!NOTE]
> L’opérateur peut désactiver cette possibilité (`security.first_password = "disabled"`). Les
> utilisateurs qui se connectent par authentification unique ne peuvent alors pas du tout définir
> de mot de passe, et le serveur refuse avec **Non autorisé**.

## Voir où tu es connecté {#sessions}

**Tes sessions** liste chaque navigateur ou appareil ayant une session active :

| Colonne                  | Signification                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Appareil**             | Navigateur et système d’exploitation (d’après l’agent utilisateur du navigateur) et adresse IP. **Cette session** signale le navigateur que tu utilises |
| **Méthode de connexion** | `password`, ou `oidc:<provider>` pour l’authentification unique                                                                                         |
| **Dernière activité**    | La dernière requête de cette session                                                                                                                    |
| **Expire le**            | Moment où la session prend fin au plus tard                                                                                                             |

Une session prend fin lorsqu’elle atteint sa durée de vie maximale (par défaut 12 heures), après
une période sans activité (par défaut 120 minutes), lorsque tu te déconnectes, lorsqu’elle est
révoquée, lorsque tu changes ton mot de passe (toutes les autres sessions) ou lorsqu’un
administrateur désactive ton compte.

### Déconnecter un navigateur que tu n’utilises plus {#revoke-session}

1. Repère le navigateur dans **Tes sessions**.
2. Choisis **Révoquer la session** (l’icône de corbeille en fin de ligne).
3. Confirme **Révoquer cette session ?** avec **Révoquer la session**.

Ce navigateur est déconnecté à sa prochaine requête. Ta session actuelle n’a pas de bouton de
révocation ; utilise pour elle **Se déconnecter** dans le menu utilisateur.

### Te déconnecter partout ailleurs {#sign-out-elsewhere}

Pour mettre fin à toutes les sessions sauf celle que tu utilises, choisis **Déconnecter toutes les
autres sessions** dans l’en-tête de **Tes sessions**. Le bouton apparaît dès qu’il existe au moins
une autre session. Studio demande d’abord une confirmation qui indique combien de sessions prennent
fin.

Ta session actuelle n’est jamais déconnectée. Chaque autre session est déconnectée séparément ; si
certaines ne peuvent pas l’être (par exemple à cause de la limite de requêtes), Studio t’indique
combien, la liste affiche celles qui sont encore actives, et tu peux choisir à nouveau le bouton.

> [!TIP]
> Tu t’es connecté sur un ordinateur partagé ou perdu ? Révoque cette session ici. Si tu penses que
> quelqu’un d’autre connaît ton mot de passe, change-le : cela déconnecte aussi toutes les autres
> sessions.

Les administrateurs peuvent mettre fin aux sessions d’autres utilisateurs sur la page
[Utilisateurs](help:users).

## Dépannage {#troubleshooting}

- **Non autorisé** après **Changer le mot de passe** : le **Mot de passe actuel** est erroné. Le
  serveur enregistre la tentative comme **Refusé** dans le journal d’audit.
- **Vérifie ta saisie** : le nouveau mot de passe enfreint l’une des règles ci-dessus (trop court,
  identique à ton adresse e-mail, trop simple). Les **Détails techniques** du message indiquent le
  motif donné par le serveur, par exemple « the password must have at least 12 characters ».
- **Les nouveaux mots de passe ne correspondent pas.** : **Nouveau mot de passe** et **Confirmer le
  nouveau mot de passe** diffèrent.
- **Reconnecte-toi** lors de la définition d’un premier mot de passe : ta connexion est trop
  ancienne. Suis les étapes de [Définir un premier mot de passe](#set-password).
- **Non autorisé** lors de la définition d’un premier mot de passe : le serveur n’autorise pas les
  mots de passe pour les utilisateurs de l’authentification unique, ou ton compte n’a pas
  d’adresse e-mail. Continue à te connecter par authentification unique.
- Tu as été déconnecté de façon inattendue : ta session a expiré, est restée inactive trop
  longtemps ou a été révoquée (par exemple parce que tu as changé ton mot de passe ailleurs).
  Reconnecte-toi ; le Studio te ramène à la page où tu étais.
