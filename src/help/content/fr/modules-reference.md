---
title: Référence des modules
summary: Les modules du serveur Axentra, les sections du Studio que chacun fait fonctionner et ce que tu vois lorsqu’un module est désactivé.
keywords: module, modules, activé, désactivé, fonctionnalité, configuration du serveur, identity, tenancy, access, data, audit, storage, events, usage, billing, notify, search, realtime
---

Le serveur Axentra est composé de _modules_ : des briques comme le stockage de fichiers, les tâches
d’arrière-plan ou la facturation. Un opérateur décide dans la configuration du serveur quels
modules tournent. Le Studio lit la liste des modules activés au démarrage et s’y adapte : les
sections des modules désactivés restent dans la barre latérale avec la mention **Désactivé**, ce
qui te permet de voir ce qui existe et ce qu’un opérateur devrait activer.

## Quels modules sont activés ? {#check-modules}

- Le [Tableau de bord](app:dashboard) liste tous les modules sous **Modules** dans la carte du
  serveur ; les modules activés sont mis en évidence, les modules désactivés sont grisés.
- La page [Paramètres](app:settings) (avec `platform:settings` ou `product:manage`) affiche la
  configuration effective du serveur, y compris la liste des modules.
- Dans la barre latérale, une section d’un module désactivé porte la mention **Désactivé** ; les
  lecteurs d’écran annoncent « module non activé ».

Par défaut, tous les modules sont activés. Modifier la liste est un changement de configuration du
serveur (`modules`, voir [Configuration du serveur](help:server-configuration)) ; il prend effet au
redémarrage du serveur. Le Studio lit la liste une fois par chargement de page : recharge donc le
Studio ensuite.

## Vue d’ensemble des modules {#overview}

| ID du module | Peut être désactivé | Sections du Studio qu’il fait fonctionner                                                                                         |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `identity`   | Non                 | Connexion, déconnexion, [Profil](help:profile), [Utilisateurs](help:users), sessions                                              |
| `tenancy`    | Non                 | [Produits](help:products), [Locataires](help:tenants), [membres et invitations](help:members-invitations)                         |
| `access`     | Non                 | [Rôles](help:roles-permissions), [Autorisations](help:permissions-reference), [Clés d’API](help:api-keys)                         |
| `audit`      | Non                 | [Journal d’audit](help:audit)                                                                                                     |
| `data`       | Oui                 | [Aperçu des données](help:data-overview), [Enregistrements](help:records)                                                         |
| `storage`    | Oui                 | [Fichiers](help:files), quotas de stockage des locataires, politique de stockage du produit                                       |
| `events`     | Oui                 | [Tâches](help:jobs), [Planifications](help:schedules), [Événements](help:events) avec la vue en direct, [Webhooks](help:webhooks) |
| `usage`      | Oui                 | [Utilisation](help:usage) : compteurs, utilisation par locataire, quotas, réservations                                            |
| `billing`    | Oui                 | [Offres et abonnements](help:plans-subscriptions), facturation des locataires                                                     |
| `notify`     | Oui                 | [Notifications](help:notifications) : modèles, journal des messages, boîte de réception, préférences                              |
| `search`     | Oui                 | Pas encore d’écrans dans le Studio ; la recherche plein texte par locataire est disponible via l’API                              |
| `realtime`   | Oui                 | Accepté dans la configuration, mais sans effet dans cette version                                                                 |

[État du système](help:health-monitoring), Supervision et [Paramètres](help:settings)
n’appartiennent à aucun module et sont toujours disponibles.

## Ce qui se passe lorsqu’un module est désactivé {#when-disabled}

Lorsqu’un module est désactivé, le serveur ne propose plus du tout sa partie de l’API. Dans le
Studio :

- La page de la section affiche **Module non activé sur ce serveur** et nomme l’identifiant du
  module à activer, par exemple `storage`. Rien n’est supprimé : les données stockées pendant que
  le module était actif restent dans la base de données et réapparaissent lorsque le module est
  réactivé.
- Les raccourcis et widgets qui dépendent du module disparaissent, par exemple les widgets
  d’utilisation et de facturation du tableau de bord ou le bouton **Parcourir les enregistrements**
  sur la page d’un locataire.
- Une action qui atteint malgré tout un module désactivé reçoit la réponse
  [Module non activé](help:troubleshooting#module-disabled) ou **Introuvable**.

Remarques par module :

### data {#data}

**Aperçu des données** et **Enregistrements** affichent l’état « non activé ». Les produits qui
stockent leurs propres données dans leurs propres tables ne sont pas concernés.

### storage {#storage}

**Fichiers** affiche l’état « non activé » ; les quotas de stockage et la politique de stockage ne
peuvent être ni lus ni modifiés.

### events {#events}

**Tâches**, **Planifications**, **Événements** et **Webhooks** affichent l’état « non activé », et
il n’y a pas de vue des événements en direct. À l’intérieur du serveur, d’autres modules utilisent
toujours la file d’attente des tâches ; seuls les écrans et l’API correspondante disparaissent.

### usage et billing {#usage-billing}

Sans `usage`, **Utilisation** est désactivée et le tableau de bord n’affiche aucun widget
d’utilisation. Sans `billing`, **Offres** et **Abonnements** sont désactivés. Les limites des
offres n’alimentent les quotas d’utilisation que lorsque les **deux** modules sont activés.

### notify {#notify}

**Notifications** affiche l’état « non activé ». Les invitations fonctionnent toujours, mais le
serveur n’envoie pas d’e-mails d’invitation : partage le lien ou le jeton d’invitation que le
Studio affiche une seule fois après la création de l’invitation (voir
[Membres et invitations](help:members-invitations)).

### search et realtime {#search-realtime}

Le Studio n’a pas d’écrans pour ces modules. Les activer ou les désactiver ne change rien dans le
Studio.

## Pas encore disponible dans le Studio {#not-in-studio}

Si un module est activé sur le serveur mais que cette version du Studio n’a pas d’écrans pour lui,
la section affiche **Pas encore disponible dans le Studio**. Utilise directement l’API ou une
version plus récente du Studio.

## Dépannage {#troubleshooting}

| Situation                                                                        | Que faire                                                                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Une section affiche **Désactivé**                                                | Demande à un opérateur d’ajouter l’identifiant du module au paramètre `modules` du serveur et de redémarrer le serveur, puis recharge le Studio. |
| Un opérateur a activé un module, mais le Studio affiche toujours **Désactivé**   | Recharge la page ; le Studio ne lit la liste des modules qu’au chargement.                                                                       |
| La configuration refuse de désactiver `identity`, `tenancy`, `access` ou `audit` | Ces modules sont obligatoires et ne peuvent pas être désactivés.                                                                                 |
| Des invitations sont créées, mais aucun e-mail n’arrive                          | `notify` est-il activé et un prestataire d’e-mail est-il configuré ? Sinon, partage le lien manuellement.                                        |
