---
title: Que sont Axentra et Studio ?
summary: Axentra est un backend pour les produits SaaS multi-locataires ; Axentra Studio est l’interface web facultative qui permet de l’administrer.
keywords: introduction, présentation, à propos, plateforme, backend, SaaS, console d’administration, interface d’administration, qu’est-ce que, architecture, multi-locataire, multitenant, serveur
---

**Axentra** est une plateforme backend pour les produits de logiciel en tant que service (SaaS). Elle
fournit les briques dont presque toute application multi-locataire a besoin, pour que tu n’aies pas
à les reconstruire dans chaque produit. **Axentra Studio** est l’interface web dans laquelle les
administrateurs, les opérateurs et l’équipe de support gèrent un serveur Axentra : ses produits,
ses clients, ses utilisateurs, ses rôles, ses clés d’API et ses données.

## Ce que fait Axentra {#what-is-axentra}

Axentra prend en charge la « tuyauterie » d’un produit SaaS :

- **Comptes et connexion** : utilisateurs, mots de passe, sessions de navigateur et authentification unique (OpenID Connect).
- **Clients (locataires)** : chaque organisation cliente de ton produit obtient son propre locataire,
  avec ses membres et ses invitations. Les données des différents locataires sont strictement séparées, y compris au niveau de la base de données.
- **Contrôle d’accès** : rôles, autorisations et clés d’API pour les machines.
- **Données** : enregistrements (documents JSON regroupés en collections) et fichiers.
- **Traitements en arrière-plan** : tâches, planifications, événements et webhooks.
- **Fonctions commerciales** : mesure de l’utilisation, quotas, offres et abonnements.
- **Notifications** : modèles d’e-mails et envoi.
- **Journal d’audit** : qui a fait quoi et quand, pour chaque modification.

Axentra est un unique paquet Python associé à une base de données PostgreSQL. Il peut fonctionner de deux façons :

- **Comme service HTTP** (`axentra serve`) : ton produit et les autres clients appellent l’API
  versionnée sous `/v1`.
- **Comme bibliothèque** intégrée à ta propre application Python : ton code appelle les mêmes
  services directement dans le processus.

Les deux modes utilisent les mêmes services, les mêmes contrôles d’autorisation et le même journal d’audit. C’est
l’opérateur du serveur qui décide quelles parties facultatives sont actives, au moyen des [modules](help:concepts#modules).

## Ce qu’est Studio {#what-is-studio}

Studio est une application web distincte qui s’exécute dans ton navigateur. Elle n’a **ni serveur propre
ni droits particuliers** : elle communique avec le serveur Axentra uniquement via la même API HTTP publique
que tous les autres clients. Ce que tu vois et ce que tu as le droit de faire dans Studio est décidé par le serveur Axentra,
en fonction de tes [rôles](help:roles-permissions).

Il en découle trois principes :

1. **Studio n’affiche que des données réelles.** Chaque chiffre et chaque liste viennent du serveur. Si un module n’est pas
   activé sur le serveur, Studio l’indique au lieu d’afficher des données fictives.
2. **Le serveur décide, Studio explique.** Studio propose les actions en fonction de tes autorisations.
   Si le serveur refuse malgré tout quelque chose, Studio explique le refus et affiche l’ID de requête à
   transmettre au support.
3. **Les actions irréversibles sont volontaires.** Supprimer, révoquer et suspendre demandent une confirmation,
   et les secrets comme les clés d’API ne sont affichés qu’une seule fois.

## Comment Axentra et Studio s’articulent {#how-they-relate}

```diagram
architecture
```

- Ton **produit** (par exemple un CRM ou une boutique en ligne) utilise Axentra via l’API HTTP ou comme bibliothèque.
  Ses utilisateurs finaux ne voient jamais Studio.
- **Studio** n’est qu’un client de plus de la même API, destiné aux personnes qui exploitent la plateforme.
- Les **machines** (le backend de ton produit, les tâches d’import, les intégrations) s’authentifient avec des
  [clés d’API](help:api-keys).
- Axentra communique avec l’extérieur par des **webhooks** et des **e-mails**, et peut aussi connecter les utilisateurs
  via un **fournisseur d’identité** externe.

Studio est **facultatif**. Tout ce que Studio sait faire, n’importe quel client de l’API peut le faire avec les mêmes
autorisations, et Axentra ne dépend jamais de Studio. La sécurité ne repose jamais sur l’interface : masquer un
bouton dans Studio est une simple commodité, c’est le serveur qui applique chaque règle.

> [!NOTE]
> Au chargement, Studio vérifie la version de l’API du serveur. Si le serveur utilise une autre version majeure,
> ou s’il est plus ancien que ce dont Studio a besoin, Studio s’arrête avec **Version du serveur incompatible**.
> Consulte le [dépannage](help:troubleshooting).

## Qui utilise Studio {#who-uses-studio}

| Qui                                                                        | Tâches typiques                                                                                                                          |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Administrateurs de la plateforme                                           | Exploitent toute l’installation : créent des produits, attribuent les rôles sur la plateforme, surveillent l’état du système et l’audit. |
| Opérateurs de produit (propriétaire du produit, administrateur du produit) | Gèrent un produit : locataires, rôles, clés d’API, offres, modèles, webhooks.                                                            |
| Équipe de support                                                          | Consulte les données et répond aux questions des clients, gère les membres dans la limite de ses propres autorisations.                  |
| Administrateurs de locataire                                               | Gèrent les membres et les invitations de leur propre organisation.                                                                       |

Tu n’as pas besoin de savoir programmer pour utiliser Studio. Quelques zones (enregistrements, charges utiles des tâches,
paramètres du produit) attendent du JSON ; les exemples des articles suffisent pour démarrer.

## Scénarios typiques {#scenarios}

- **Un nouveau serveur est mis en service.** L’opérateur affiche un jeton d’installation ; tu crées le premier
  administrateur de la plateforme, puis le premier produit. Consulte l’[installation initiale](help:first-run-setup) et
  les [premiers pas](help:first-steps).
- **Un nouveau client signe un contrat.** Tu crées un locataire, tu invites l’administrateur du client et
  tu crées une clé d’API pour son intégration. Consulte
  [Intégrer une organisation cliente](help:tutorial-onboard-customer).
- **Un client signale un « accès refusé ».** Tu vérifies le rôle du membre, les autorisations de la clé d’API
  et les événements refusés dans le [journal d’audit](help:audit).
- **Une intégration a besoin d’événements.** Tu enregistres un webhook et tu suis ses livraisons. Consulte
  [Créer un récepteur de webhooks](help:tutorial-webhook-receiver).
- **L’équipe commerciale lance une nouvelle grille tarifaire.** Tu définis des compteurs, des offres et des abonnements. Consulte
  [Offres et utilisation](help:tutorial-plan-usage).

## Ce que Studio ne fait pas {#what-studio-does-not-do}

- Studio n’installe pas et ne configure pas le serveur. Les paramètres du serveur (modules, méthodes de connexion,
  origines autorisées, mode) se trouvent dans la configuration du serveur ; Studio affiche seulement les valeurs effectives
  non secrètes sous **Paramètres**. Consulte la [configuration du serveur](help:server-configuration).
- Studio ne crée pas directement de comptes utilisateur. Les comptes proviennent de l’installation initiale, de l’authentification
  unique ou du code de ton propre produit. Consulte les [utilisateurs](help:users).
- Certaines fonctions ne sont disponibles que via l’API. Elles sont répertoriées dans les
  [limitations connues](help:limitations).

## Dépannage {#troubleshooting}

| Situation                                                        | Que faire                                                                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Impossible de se connecter à Axentra** à l’ouverture de Studio | Studio n’a pas pu charger `GET /v1/meta`. Vérifie que le serveur Axentra fonctionne et que Studio est configuré avec la bonne adresse d’API. |
| **Version du serveur incompatible**                              | Utilise une version de Studio qui correspond à la version de l’API du serveur, ou mets le serveur à jour.                                    |
| Une entrée de la barre latérale affiche **Désactivé**            | Le module du serveur correspondant n’est pas activé. Adresse-toi à l’opérateur du serveur. Consulte les [modules](help:concepts#modules).    |
| Une action que tu attends est absente                            | Il te manque probablement l’autorisation. Consulte les [rôles et autorisations](help:roles-permissions).                                     |
