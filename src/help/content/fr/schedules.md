---
title: Planifications
summary: Exécute une tâche régulièrement, à intervalle fixe ou selon des horaires cron en UTC, et active, désactive, modifie ou supprime des planifications.
keywords: planification, planifier, cron, crontab, tâche récurrente, minuteur, intervalle, périodique, UTC, fuseau horaire, prochaine exécution, tous les jours, toutes les heures
---

Une **planification** met une [tâche](help:jobs) en file d’attente encore et encore : toutes les 15 minutes, chaque nuit à 02:00,
le premier jour de chaque mois. Tu indiques à la planification un **Type** de tâche et une **Charge utile**, et la
planification place une nouvelle tâche de ce type dans la file d’attente à chaque horaire prévu. Un worker exécute ensuite la
tâche comme n’importe quelle autre. Utilise les planifications pour les rapports, les nettoyages, les synchronisations et les rappels.

> [!IMPORTANT]
> Les planifications exigent le module serveur `events`. La consultation exige `jobs:read` ; **Nouvelle planification**, la modification,
> l’activation, la désactivation et la suppression exigent `jobs:manage` (sans cette autorisation, les boutons et le menu des lignes sont
> masqués). Les planifications ne se déclenchent que tant qu’un processus worker (`axentra worker`) fonctionne, car le worker
> joue aussi le rôle de planificateur.

## Lire la liste des planifications {#schedules-list}

Ouvre [Planifications](app:schedules) (également accessible avec **Planifications** sur l’écran **Tâches**). Chaque ligne
affiche :

- le **Nom** et le type de tâche qu’elle met en file d’attente ;
- la **Fréquence** : un intervalle comme _Toutes les 15 minutes_, ou une expression cron marquée _cron, UTC_ ;
- l’**État** : **Actif** ou **Désactivé** ;
- la **Prochaine exécution** : le moment où la planification se déclenchera (affiché **Désactivée** pour les planifications désactivées) ;
- la **Dernière exécution** : le créneau qui s’est déclenché en dernier. Quand une tâche existe pour ce créneau, l’heure renvoie à cette
  tâche ;
- le **Locataire**, ou **Niveau produit**.

## Créer une planification {#create}

1. Ouvre [Planifications](app:schedules) et choisis **Nouvelle planification**.
2. Saisis un **Nom** (1 à 200 caractères) et le **Type** de tâche, par exemple `reports.send`.
3. Sous **Fréquence**, choisis **Intervalle fixe** ou **Expression cron** (voir ci-dessous).
4. Facultatif : saisis la **Charge utile** de la tâche, choisis un **Locataire**, et définis **Priorité** et
   **Tentatives max.**.
5. Laisse **Activée** cochée si la planification doit commencer à se déclencher immédiatement.
6. Choisis **Créer la planification**.

Le serveur calcule la **Prochaine exécution** lors de l’enregistrement. Studio n’affiche pas d’aperçu des exécutions futures.

## Choisir la fréquence {#timing}

Une planification utilise exactement l’un des deux modes de fréquence.

### Intervalle fixe {#interval}

Saisis un nombre sous **Intervalle** et choisis l’**Unité** (**Secondes**, **Minutes**, **Heures** ou
**Jours**). L’intervalle doit être compris entre 10 secondes et 366 jours.

Les horaires d’un intervalle sont comptés à partir du 1er janvier 1970 à minuit UTC, et non à partir du moment de l’enregistrement. Tous
les serveurs calculent donc les mêmes horaires, et les heures d’exécution sont prévisibles :

- _Toutes les 15 minutes_ se déclenche à :00, :15, :30 et :45 de chaque heure (UTC).
- _Tous les 1 jour_ se déclenche à 00:00 UTC.
- _Tous les 7 jours_ se déclenche le jeudi à 00:00 UTC (le 1er janvier 1970 était un jeudi).

Si tu as besoin d’une heure précise de la journée ou d’un jour de la semaine précis, utilise plutôt une expression cron.

### Expression cron {#cron-syntax}

Une expression cron comporte exactement **5 champs**, séparés par des espaces :

```text
┌──────── minute        0-59
│ ┌────── hour          0-23
│ │ ┌──── day of month  1-31
│ │ │ ┌── month         1-12
│ │ │ │ ┌ day of week   0-7 (0 and 7 are Sunday)
* * * * *
```

Chaque champ accepte :

| Syntaxe | Signification                                               | Exemple                                                       |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `*`     | toutes les valeurs                                          | `*` dans le champ heure : toutes les heures                   |
| `n`     | une valeur                                                  | `30` dans le champ minute                                     |
| `a-b`   | une plage                                                   | `1-5` dans le champ jour de la semaine : du lundi au vendredi |
| `a,b,c` | une liste (les éléments peuvent être des plages ou des pas) | `0,30` dans le champ minute                                   |
| `*/n`   | une valeur sur _n_ à partir du début                        | `*/10` dans le champ minute : 0, 10, 20 …                     |
| `a-b/n` | une valeur sur _n_ dans une plage                           | `8-18/2` dans le champ heure : 8, 10 … 18                     |
| `a/n`   | une valeur sur _n_ de _a_ jusqu’à la fin                    | `5/15` dans le champ minute : 5, 20, 35, 50                   |

**Non pris en charge :** les noms de mois ou de jours (`JAN`, `MON`), `L`, `W`, `#`, `?`, un champ des secondes,
et les macros comme `@daily` ou `@hourly`. Une expression peut compter au plus 200 caractères.

Quand le jour du mois **et** le jour de la semaine sont tous deux restreints (aucun des deux n’est `*`), un jour correspond si
**l’un ou l’autre** correspond. `0 0 1 * 1` se déclenche donc le 1er de chaque mois _et_ chaque lundi.

Une expression qui ne correspond jamais, comme `0 0 31 2 *` (31 février), est refusée à l’enregistrement.

Studio vérifie la syntaxe pendant la saisie, avec les mêmes règles que le serveur, et affiche des messages
comme _Une expression cron comporte 5 champs séparés par des espaces ; celle-ci en a 6._ Les boutons sous
**Expressions courantes** remplissent des expressions toutes faites :

| Bouton                     | Expression    |
| -------------------------- | ------------- |
| **Toutes les 5 minutes**   | `*/5 * * * *` |
| **Toutes les heures**      | `0 * * * *`   |
| **Tous les jours à 00:00** | `0 0 * * *`   |
| **En semaine à 09:00**     | `0 9 * * 1-5` |
| **Le lundi à 06:00**       | `0 6 * * 1`   |
| **Le 1er du mois**         | `0 0 1 * *`   |

### Fuseau horaire : toujours UTC {#timezone}

Tous les horaires des planifications sont en **UTC**. Il n’existe pas de réglage de fuseau horaire ni d’ajustement automatique à l’heure
d’été. Convertis toi-même les heures locales : 09:00 à Paris correspond à `0 8 * * *` en hiver (UTC+1)
et à `0 7 * * *` en été (UTC+2). Si l’heure locale exacte compte toute l’année, ajuste la planification
lors des changements d’heure, ou laisse le gestionnaire vérifier l’heure locale.

Les colonnes **Prochaine exécution** et **Dernière exécution** sont affichées dans ton propre fuseau horaire, comme partout dans
Studio.

## Ce qu’une planification met en file d’attente {#what-it-enqueues}

À chaque créneau, la planification met en file d’attente une tâche avec :

- le **Type**, la **Charge utile**, la **Priorité**, les **Tentatives max.** et le **Locataire** de la planification ;
- un lien vers la planification (les détails de la tâche l’affichent sous **Planification**) ;
- **Créée par** `schedule:<schedule id>` ;
- une clé d’idempotence composée de l’ID de la planification et du créneau.

Chaque créneau se déclenche **au plus une fois**, même quand plusieurs workers fonctionnent. La tâche elle-même s’exécute ensuite au
moins une fois, avec les [nouvelles tentatives](help:jobs#retries) habituelles. Une planification n’attend pas la fin de la tâche
précédente : si une tâche dure plus longtemps que l’intervalle, la suivante démarre quand même.

## Exécutions manquées et prochaine exécution {#missed-runs}

Si aucun worker ne fonctionnait au moment où des créneaux étaient dus (par exemple pendant une maintenance), les créneaux manqués sont
**regroupés** : la planification se déclenche une fois pour le créneau en retard, puis continue avec le créneau suivant
après l’heure actuelle. Elle ne rattrape pas chaque exécution manquée.

La **Prochaine exécution** est recalculée à partir de l’heure actuelle chaque fois que tu modifies la fréquence ou que tu actives la
planification. Modifier uniquement le nom, la charge utile, la priorité ou les tentatives conserve la prochaine exécution.

## Modifier une planification {#edit}

1. Ouvre le menu d’actions de la ligne et choisis **Modifier**.
2. Modifie les valeurs et choisis **Enregistrer les modifications**.

Studio n’envoie que les champs que tu as modifiés. Le **Locataire** ne peut plus être modifié après la création ; supprime
plutôt la planification et crées-en une nouvelle. Les tâches déjà mises en file d’attente conservent leur ancienne charge utile.

## Activer ou désactiver une planification {#enable-disable}

Ouvre le menu d’actions de la ligne et choisis **Désactiver** ou **Activer**. Une planification désactivée conserve tous ses
paramètres mais ne se déclenche pas. Quand tu la réactives, elle reprend avec le créneau suivant l’heure actuelle ;
les créneaux manqués pendant la désactivation ne sont pas exécutés.

## Supprimer une planification {#delete}

Ouvre le menu d’actions de la ligne, choisis **Supprimer la planification** et confirme. La planification cesse de se déclencher.
Les tâches qu’elle a déjà mises en file d’attente restent et s’exécutent quand même. La suppression est irréversible ; pour arrêter une planification
temporairement, désactive-la plutôt.

## Paramètres {#settings}

| Paramètre           | Effet                                                                                              | Valeurs autorisées / par défaut                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Nom**             | Affiché dans la liste et dans les messages.                                                        | 1 à 200 caractères. Obligatoire.                                                  |
| **Type**            | Type de tâche à mettre en file d’attente ; un worker doit disposer d’un gestionnaire pour ce type. | Comme pour les [tâches](help:jobs#enqueue) ; `axentra.` est réservé. Obligatoire. |
| **Fréquence**       | **Intervalle fixe** ou **Expression cron**.                                                        | Intervalle de 10 s à 366 jours ; cron : 5 champs, UTC.                            |
| **Charge utile**    | Entrée de chaque tâche mise en file d’attente.                                                     | Objet JSON, 64 Ko au maximum. Par défaut `{}`.                                    |
| **Locataire**       | Met les tâches en file d’attente dans ce locataire.                                                | Un locataire ou **Niveau produit**. Uniquement à la création.                     |
| **Priorité**        | Priorité des tâches mises en file d’attente.                                                       | −100 à 100. Par défaut 0.                                                         |
| **Tentatives max.** | Nombre de tentatives de chaque tâche avant qu’elle ne devienne **Abandonnée**.                     | 1 à 100. Par défaut 5.                                                            |
| **Activée**         | Indique si la planification se déclenche.                                                          | Activée par défaut.                                                               |

## Pour les développeurs {#developers}

Les planifications sont aussi disponibles via l’API : `GET/POST /v1/products/{product_id}/schedules` et
`GET/PATCH/DELETE /schedules/{id}` (avec `If-Match` pour les mises à jour et les suppressions). Un seul worker joue
le rôle de planificateur à la fois ; il recherche les planifications dues toutes les 5 secondes par défaut
(`events.scheduler_interval_seconds`) : une tâche peut donc être mise en file d’attente quelques secondes après son créneau.

## Dépannage {#troubleshooting}

**La planification ne se déclenche pas.** Vérifie qu’elle est **Actif** et que la **Prochaine exécution** est dans le passé.
Si c’est le cas, aucun worker ne fonctionne ; demande à tes opérateurs d’en démarrer un. Si des tâches sont mises en file d’attente mais restent
**En file d’attente**, aucun worker ne gère ce type ; consulte les [tâches](help:jobs#troubleshooting).

**Elle se déclenche à la mauvaise heure.** Les horaires cron sont en UTC. Convertis ton heure locale, en tenant compte de l’heure
d’été (voir [Fuseau horaire](help:schedules#timezone)).

**« The cron expression never matches ».** Les champs décrivent une date qui n’existe pas, comme
le 30 février. Change le jour ou le mois.

**« Vérifie ta saisie » avec un message cron.** Le serveur désigne le champ, par exemple
`cron hour: values must be within 0-23` ou `cron day of week: invalid value 'MON'`. Utilise des nombres
plutôt que des noms et supprime les macros.

**« interval_seconds must be between 10 and 31622400 ».** L’intervalle est inférieur à 10 secondes ou
supérieur à 366 jours.

**« Modifié entre-temps » lors de l’enregistrement, de l’activation ou de la suppression.** Une autre personne a modifié la
planification après que tu l’as chargée. Ferme la boîte de dialogue, attends que la liste s’actualise (ou recharge la page),
puis répète ta modification sur la version actuelle.

**Après une interruption, la planification ne s’est exécutée qu’une fois, et non pour chaque créneau manqué.** C’est voulu : les créneaux
manqués sont regroupés en une seule exécution.
