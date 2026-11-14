---
title: Se connecter et se déconnecter
summary: Connecte-toi avec un mot de passe ou par authentification unique, comprends quand une session prend fin et résous les problèmes de connexion.
keywords: connexion, se connecter, identifiant, login, déconnexion, se déconnecter, logout, mot de passe, SSO, authentification unique, OIDC, OpenID Connect, fournisseur d’identité, Keycloak, Entra ID, Google, session, expirée, délai d’inactivité, langue, retour, mot de passe oublié, réinitialiser le mot de passe
---

Studio fonctionne avec ton compte personnel sur le serveur Axentra. Quand tu te connectes, le serveur ouvre
une **session** pour ton navigateur ; Studio agit ensuite avec tes rôles jusqu’à la fin de la session. Selon la
configuration du serveur, tu te connectes avec une adresse e-mail et un mot de passe, par **authentification
unique** avec le fournisseur d’identité de ton organisation, ou des deux façons.

## Se connecter avec une adresse e-mail et un mot de passe {#password}

1. Ouvre Studio. Si tu n’es pas connecté, la page **Connexion** s’affiche.
2. Saisis ton **Adresse e-mail** et ton **Mot de passe**.
3. Choisis **Se connecter**.

**Résultat attendu :** Studio ouvre la page d’où tu venais, ou le tableau de bord du dernier produit que tu as
utilisé. Si tu n’as encore aucun produit, tu arrives sur **Produits**.

Le formulaire ne s’affiche que si le serveur autorise la connexion par mot de passe. Les comptes créés via
l’authentification unique n’ont pas de mot de passe et ne peuvent pas utiliser le formulaire ; tu peux définir un mot de passe pour un tel
compte dans ton [profil](help:profile), si le serveur le permet.

## Mot de passe oublié {#forgotten-password}

1. Sur la page **Se connecter**, choisis **Mot de passe oublié ?** sous le champ du mot de passe.
2. Saisis l’adresse e-mail de ton compte et choisis **Envoyer le lien de réinitialisation**.
3. Ouvre le lien de l’e-mail. Sur la page **Choisis un nouveau mot de passe**, saisis deux fois le
   nouveau mot de passe et choisis **Enregistrer le nouveau mot de passe**.

**Résultat attendu :** tu es déconnecté partout, y compris dans ce navigateur, et tu te connectes
avec le nouveau mot de passe. L’adresse compte désormais comme vérifiée, puisque le lien l’a atteinte.

La page indique toujours qu’un lien est en route : ni Studio ni le serveur ne révèlent si un compte
existe pour une adresse. Aucun e-mail n’arrive s’il n’y a pas de compte, si le compte est désactivé,
s’il se connecte uniquement par authentification unique (il n’a pas de mot de passe à réinitialiser)
ou si tu as demandé un lien il y a moins d’une minute. Le lien fonctionne une seule fois, expire
rapidement (30 minutes par défaut) et seul le lien le plus récent d’un compte fonctionne. Un lien
invalide, expiré ou déjà utilisé affiche **Ce lien n’est pas utilisable** ; demandes-en un nouveau.
Changer ton mot de passe dans le [profil](help:profile#password) invalide aussi les liens de
réinitialisation ouverts.

## Se connecter par authentification unique {#sso}

Si l’opérateur a raccordé un fournisseur d’identité (OpenID Connect, par exemple Keycloak,
Microsoft Entra ID, Google ou Auth0), la page de connexion affiche un bouton **Continuer avec …** pour chaque
fournisseur, sous le formulaire de mot de passe et le mot **ou**.

1. Choisis **Continuer avec** _ton fournisseur_.
2. Connecte-toi comme d’habitude auprès de ton fournisseur d’identité (y compris l’éventuelle étape d’authentification multifacteur qu’il exige).
3. Le fournisseur te renvoie vers Studio, connecté.

Bon à savoir :

- L’authentification multifacteur est gérée par ton fournisseur d’identité, pas par Axentra.
- Lors de ta première authentification unique, Axentra associe la connexion à un compte existant ayant la même adresse e-mail
  **vérifiée**, ou crée un nouveau compte si le fournisseur autorise l’inscription ou si une
  [invitation](help:members-invitations) ouverte existe pour ton adresse.
- Un nouveau compte n’obtient aucun accès par lui-même. Tu ne vois des produits et des locataires qu’après qu’une personne t’a
  attribué un rôle ou que tu as accepté une invitation.

## Reprendre là où tu t’étais arrêté {#return-to}

Quand ta session prend fin pendant que tu travailles, ou quand tu ouvres un lien vers une page de Studio sans être connecté,
Studio t’envoie vers la page de connexion et mémorise la page. La page de connexion affiche alors **Connecte-toi pour
reprendre là où tu t’étais arrêté.** Après la connexion (par mot de passe ou par authentification unique), tu te
retrouves sur cette page, y compris avec les filtres présents dans l’adresse.

Par sécurité, Studio ne renvoie que vers ses propres pages ; toute autre cible mène à la page d’accueil.

> [!WARNING]
> Les saisies non enregistrées d’un formulaire ouvert sont perdues quand la session prend fin. Pour les longues modifications, enregistre régulièrement.

## Quand une session prend fin {#session-end}

| La session prend fin …                                     | Valeur par défaut                             |
| ---------------------------------------------------------- | --------------------------------------------- |
| À l’issue de sa durée de vie maximale, même si tu es actif | 12 heures (`security.session_ttl_hours`)      |
| Après une période sans aucune requête                      | 120 minutes (`security.session_idle_minutes`) |
| Quand tu te déconnectes                                    | Immédiatement                                 |
| Quand toi ou un administrateur la révoquez                 | À la requête suivante                         |
| Quand ton compte est désactivé                             | Immédiatement, toutes les sessions            |
| Quand tu changes ton mot de passe                          | Toutes tes **autres** sessions                |

Ces valeurs sont définies par l’opérateur du serveur. Tes sessions actives (navigateurs et appareils) sont listées dans
ton [profil](help:profile), où tu peux aussi y mettre fin.

Certaines actions sensibles pour la sécurité exigent une connexion **récente**. Si le serveur répond **Reconnecte-toi**,
Studio te déconnecte, et après une nouvelle connexion tu te retrouves sur la même page pour répéter
l’action.

> [!NOTE]
> L’authentification unique ne fait que **démarrer** une session Axentra. Te déconnecter de Studio ne te déconnecte pas
> de ton fournisseur d’identité, et être déconnecté ou bloqué chez le fournisseur ne met pas fin à une session
> Axentra en cours ; celle-ci prend fin à son expiration normale ou quand un administrateur désactive le compte.

## Se déconnecter {#sign-out}

1. Ouvre le menu utilisateur en haut à droite (tes initiales et ton nom).
2. Choisis **Se déconnecter**.

Studio met fin à la session sur le serveur, oublie toutes les données chargées et affiche la page de connexion. Sur un
ordinateur partagé, déconnecte-toi toujours.

## Choisir la langue avant de se connecter {#language}

La page de connexion et la page d’installation comportent un sélecteur de langue sous le formulaire. Ton choix s’applique
immédiatement et est mémorisé dans ce navigateur. Une fois connecté, tu peux changer la langue dans le
menu utilisateur (**Langue**) ou sous **Paramètres** ; elle est alors aussi enregistrée dans ton compte et te suit
dans les autres navigateurs. Consulte [l’interface](help:interface#language).

## Paramètres {#settings}

Ces paramètres du serveur influent sur la connexion. Seul l’opérateur du serveur peut les modifier ; Studio affiche les
valeurs effectives sous **Paramètres**.

| Paramètre                        | Effet                                                                                                              | Valeur par défaut |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `security.password_login`        | Autorise la connexion par adresse e-mail et mot de passe. Désactivé, seule l’authentification unique est proposée. | activé            |
| `security.login_rate_per_minute` | Nombre d’échecs de connexion autorisés par compte et par minute (par adresse réseau : trois fois plus).            | 10                |
| `security.session_ttl_hours`     | Durée de vie maximale d’une session.                                                                               | 12                |
| `security.session_idle_minutes`  | Délai d’inactivité.                                                                                                | 120               |
| Fournisseurs `[[oidc]]`          | Fournisseurs d’authentification unique affichés sous la forme **Continuer avec …**.                                | aucun             |

## Détails pour les administrateurs {#details}

- La session est conservée dans un cookie `HttpOnly` ; Studio ne stocke jamais de jetons dans le stockage du navigateur. Les
  requêtes de modification exigent en plus un jeton CSRF, que Studio garde en mémoire.
- L’adresse de Studio doit être l’URL `security.public_url` du serveur ou figurer dans
  `security.allowed_origins` ; sinon la connexion et les requêtes de modification sont refusées avec `403`.
- Les connexions, les échecs de connexion (`identity.login` avec le résultat `denied`) et les déconnexions sont inscrits dans le
  [journal d’audit](help:audit).
- Les échecs de connexion sont limités par compte. Toute personne qui connaît une adresse peut donc bloquer la connexion
  par mot de passe de ce compte pendant une minute au plus.
- L’authentification unique utilise le flux par code d’autorisation avec PKCE. L’URI de redirection à enregistrer auprès du
  fournisseur est `<public URL of the API>/v1/auth/oidc/<provider id>/callback`. Configuration :
  [configuration du serveur](help:server-configuration).

## Erreurs d’authentification unique {#sso-errors}

Quand l’authentification unique échoue, le serveur te renvoie vers la page de connexion et Studio affiche
**L’authentification unique n’a pas abouti** avec le motif :

| Motif (code)                                                  | Signification                                                                                                                                              | Que faire                                                                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Trop long ou lancé dans un autre navigateur (`login_expired`) | La connexion doit aboutir en 10 minutes dans le même navigateur.                                                                                           | Recommence depuis la page de connexion.                                                                         |
| Annulée ou refusée (`access_denied`)                          | Tu as annulé chez le fournisseur, ou le consentement a été refusé.                                                                                         | Recommence et confirme chez le fournisseur.                                                                     |
| Fournisseur injoignable (`provider_unavailable`)              | Axentra n’a pas pu joindre ou valider le fournisseur.                                                                                                      | Réessaie plus tard ; l’opérateur vérifie la configuration du fournisseur.                                       |
| Réponse non vérifiable (`login_failed`)                       | Le jeton du fournisseur a échoué à une vérification.                                                                                                       | Réessaie ; si le problème persiste, l’opérateur consulte le journal du serveur.                                 |
| Adresse e-mail non vérifiée (`email_not_verified`)            | Le fournisseur n’a pas confirmé que ton adresse est vérifiée. Fréquent avec Microsoft Entra ID, qui n’envoie souvent pas de claim `email_verified`.        | L’opérateur configure le fournisseur pour qu’il l’envoie.                                                       |
| Domaine non autorisé (`domain_not_allowed`)                   | Le domaine de ton adresse e-mail ne figure pas dans la liste autorisée du fournisseur.                                                                     | Utilise un compte d’un domaine autorisé.                                                                        |
| Aucun compte (`signup_disabled`)                              | Aucun compte n’existe pour toi et l’inscription est désactivée.                                                                                            | Demande une [invitation](help:members-invitations) à un administrateur, puis reconnecte-toi.                    |
| Méthode de connexion non liée (`explicit_link_required`)      | Ton adresse e-mail appartient à un compte disposant de droits de plateforme, que le serveur ne lie jamais de lui-même à une nouvelle méthode de connexion. | Demande à un administrateur de la plateforme de lier ta méthode de connexion à ton compte, puis reconnecte-toi. |
| Compte désactivé (`account_disabled`)                         | Ton compte est désactivé.                                                                                                                                  | Contacte un administrateur.                                                                                     |
| Trop de tentatives (`rate_limited`)                           | Trop de connexions lancées depuis ton réseau.                                                                                                              | Patiente une minute.                                                                                            |
| Invitation non acceptée ici (`invitation_requires_post`)      | Un lien d’authentification unique contenait un jeton d’invitation dans son adresse, ce que le serveur refuse.                                              | Ouvre à nouveau le lien d’invitation de ton e-mail et connecte-toi depuis la page de connexion.                 |

## Dépannage {#troubleshooting}

| Message                                                                            | Cause                                                                                                                                                                | Que faire                                                                                                                                        |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Échec de la connexion** – « L’adresse e-mail ou le mot de passe est incorrect. » | Adresse ou mot de passe erronés, compte désactivé, ou compte sans mot de passe (créé via l’authentification unique). Par sécurité, le serveur ne précise pas lequel. | Vérifie ta saisie ; essaie l’authentification unique ; demande à un administrateur de vérifier le compte sur la page [utilisateurs](help:users). |
| **Trop de requêtes**                                                               | Plus d’échecs que le nombre autorisé en une minute (10 par compte par défaut).                                                                                       | Patiente une minute et réessaie.                                                                                                                 |
| **Aucune méthode de connexion disponible**                                         | Le serveur n’a activé ni la connexion par mot de passe ni l’authentification unique.                                                                                 | L’opérateur doit configurer l’authentification.                                                                                                  |
| L’authentification unique revient avec une erreur                                  | Consulte les [erreurs d’authentification unique](help:signing-in#sso-errors).                                                                                        |                                                                                                                                                  |
| Tu es renvoyé sans cesse vers la page de connexion                                 | Le navigateur bloque le cookie de session.                                                                                                                           | Autorise les cookies pour l’adresse de Studio ; demande à l’opérateur de vérifier la configuration.                                              |
| **Non autorisé** dès la connexion                                                  | L’adresse de Studio n’est ni l’URL publique du serveur ni présente dans `security.allowed_origins`.                                                                  | L’opérateur ajoute l’adresse de Studio à `security.allowed_origins`.                                                                             |
| **Ta session n’a pas pu être vérifiée**                                            | Le serveur n’a pas pu être interrogé sur ta session (erreur réseau ou serveur).                                                                                      | Choisis **Réessayer** ; consulte **État du système** une fois reconnecté.                                                                        |
| **Reconnecte-toi**                                                                 | L’action exige une connexion récente.                                                                                                                                | Reconnecte-toi et répète l’action.                                                                                                               |
| Après la connexion, tu ne vois aucun produit                                       | Ton compte n’a pas encore de rôle.                                                                                                                                   | Demande à un administrateur de t’ajouter ou de t’envoyer une invitation.                                                                         |
