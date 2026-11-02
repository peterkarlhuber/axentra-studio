---
title: Installation initiale
summary: Crée le premier administrateur de la plateforme d’un nouveau serveur Axentra avec un jeton d’installation à usage unique.
keywords: installation, installer, configuration initiale, premier démarrage, amorçage, bootstrap, jeton d’installation, premier administrateur, administrateur de la plateforme, mise en route, installer Axentra, setup
---

Un nouveau serveur Axentra n’a pas encore d’administrateur. Tant que c’est le cas, le serveur signale
« installation requise » et Studio affiche la page **Installer Axentra** à la place de la page de connexion. Tu y
crées le premier **administrateur de la plateforme** : le compte qui a le contrôle total de l’installation.
Il te faut pour cela un **jeton d’installation** fourni par la personne qui exploite le serveur.

## Avant de commencer {#before-you-start}

> [!IMPORTANT]
>
> - Le serveur Axentra fonctionne et Studio peut le joindre.
> - Personne n’a encore terminé l’installation. La page n’est disponible que tant que le premier administrateur
>   de la plateforme n’existe pas.
> - Une personne disposant d’un accès shell au serveur peut exécuter la commande `axentra`.

## Obtenir un jeton d’installation {#setup-token}

Le jeton d’installation prouve que tu as le droit de prendre possession du nouveau serveur. Il est créé sur le serveur
lui-même : seule une personne qui contrôle le serveur peut donc le remettre.

1. Sur le serveur (ou dans le conteneur du serveur), exécute :

   ```bash
   axentra admin setup-token
   ```

2. La commande affiche un jeton qui commence par `axsetup_`. Copie-le.

| Propriété     | Valeur                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validité      | 60 minutes par défaut (paramètre d’opérateur `security.setup_token_ttl_minutes`, au moins 5).                                                                                             |
| Utilisation   | Une seule fois. Un jeton utilisé cesse de fonctionner.                                                                                                                                    |
| Disponibilité | Uniquement tant qu’aucun administrateur de la plateforme n’existe. S’il en existe un, la commande affiche « setup is already complete (a platform admin exists) » et ne crée aucun jeton. |

Tu peux créer un nouveau jeton à tout moment tant que l’installation reste ouverte ; les anciens jetons non utilisés restent valables
jusqu’à leur expiration.

> [!CAUTION]
> Le jeton d’installation donne le contrôle total du serveur à la première personne qui l’utilise. Ne le remets qu’à la
> personne qui crée le premier administrateur, par un canal privé, et crée plutôt un nouveau jeton
> que de transférer un ancien par e-mail.

## Créer le premier administrateur {#create-admin}

1. Ouvre Studio dans ton navigateur. La page **Installer Axentra** s’affiche automatiquement.
2. Si tu le souhaites, choisis ta langue avec le sélecteur de langue situé sous le formulaire.
3. Remplis le formulaire :

   | Champ                         | Ce qu’il faut saisir                                                                                      |
   | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
   | **Jeton d’installation**      | Le jeton obtenu sur le serveur, par exemple `axsetup_EXAMPLE…`.                                           |
   | **Nom complet**               | Ton nom tel que les autres administrateurs le verront.                                                    |
   | **Adresse e-mail**            | L’adresse avec laquelle tu te connecteras.                                                                |
   | **Mot de passe**              | Un mot de passe long et unique (voir les [règles de mot de passe](help:first-run-setup#password-policy)). |
   | **Confirmer le mot de passe** | Le même mot de passe une seconde fois.                                                                    |

4. Choisis **Créer l’administrateur**.

**Résultat attendu :** Studio affiche **Installation terminée** (« Tu es maintenant connecté en tant qu’administrateur
de la plateforme ») et ouvre Studio. En mode multi-produit, sans produit existant, tu arrives sur
**Produits** avec une indication pour créer le premier produit ; en mode produit unique, tu arrives sur le
tableau de bord de l’unique produit du serveur.

## Règles de mot de passe {#password-policy}

Le serveur vérifie le mot de passe et le refuse s’il enfreint l’une de ces règles :

| Règle                         | Valeur par défaut                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Longueur minimale             | 12 caractères (paramètre d’opérateur `security.password_min_length`, au moins 8).              |
| Longueur maximale             | 1 024 caractères.                                                                              |
| Différent de l’adresse e-mail | Le mot de passe ne doit pas être identique à l’adresse e-mail (sans tenir compte de la casse). |
| Pas trivial                   | Au moins 4 caractères différents.                                                              |

Les mots de passe sont stockés sous forme d’empreintes Argon2id ; personne, pas même l’opérateur, ne peut les relire.

## Après l’installation {#after-setup}

- La page d’installation n’est plus accessible ; ouvrir `/setup` mène à la page de connexion.
- Ton compte détient le rôle **Administrateur de la plateforme**. L’événement `identity.setup.complete` figure dans
  le [journal d’audit](help:audit).
- Ta session fonctionne comme n’importe quelle autre session de connexion (voir [se connecter](help:signing-in#session-end)).

Étapes suivantes :

1. Crée ton premier produit et ton premier locataire : [premiers pas](help:first-steps).
2. Attribue le rôle d’administrateur de la plateforme à une deuxième personne de confiance, pour que l’installation ne dépende pas
   d’un seul compte (voir [utilisateurs](help:users)). Cette personne a d’abord besoin d’un compte, par exemple via
   l’[authentification unique](help:signing-in#sso).
3. Si le serveur doit utiliser uniquement l’authentification unique, l’opérateur peut désactiver plus tard la connexion par mot de passe
   (`security.password_login = false`).

## Dépannage {#troubleshooting}

| Message                                                                                                                                                                                | Cause                                                                                                                 | Que faire                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Jeton d’installation refusé**                                                                                                                                                        | Le jeton est mal saisi, expiré (plus de 60 minutes par défaut) ou déjà utilisé.                                       | Crée un nouveau jeton avec `axentra admin setup-token` et colle-le sans espaces.                               |
| **L’installation est déjà terminée**                                                                                                                                                   | Quelqu’un a créé un administrateur de la plateforme entre-temps.                                                      | Connecte-toi avec ce compte, ou demande l’accès à son titulaire. Studio te redirige vers la page de connexion. |
| **Les mots de passe ne correspondent pas.**                                                                                                                                            | **Mot de passe** et **Confirmer le mot de passe** diffèrent.                                                          | Saisis à nouveau les deux.                                                                                     |
| **Vérifie ta saisie** avec le message du serveur « the password must have at least … characters », « the password must not equal the email address » ou « the password is too simple » | Les [règles de mot de passe](help:first-run-setup#password-policy) ne sont pas respectées.                            | Choisis un mot de passe plus long, avec davantage de caractères différents.                                    |
| **Vérifie ta saisie** avec « invalid email address »                                                                                                                                   | L’adresse e-mail n’est pas valide.                                                                                    | Corrige l’adresse.                                                                                             |
| **Conflit** avec le message du serveur « a user with this email address exists »                                                                                                       | Un compte avec cette adresse e-mail existe déjà (par exemple créé par du code utilisant la bibliothèque).             | Utilise une autre adresse, ou adresse-toi à l’opérateur.                                                       |
| **Trop de requêtes**                                                                                                                                                                   | Trop de tentatives d’installation depuis ton réseau en une minute (la limite de connexion, 10 par minute par défaut). | Patiente une minute et réessaie.                                                                               |
| Studio affiche la page de connexion au lieu de la page d’installation                                                                                                                  | Un administrateur de la plateforme existe déjà.                                                                       | Connecte-toi, ou demande un compte à un administrateur existant.                                               |
| **Impossible de se connecter à Axentra**                                                                                                                                               | Studio ne parvient pas à joindre le serveur.                                                                          | Vérifie le serveur et l’adresse d’API de Studio avec l’opérateur.                                              |
