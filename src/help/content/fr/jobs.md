---
title: Tâches
summary: Suis les tâches en arrière-plan, comprends leurs statuts et leurs nouvelles tentatives, mets une tâche en file d’attente à la main, et relance ou annule une tâche.
keywords: tâche, job, tâche en arrière-plan, traitement, file d’attente, worker, nouvelle tentative, relancer, annuler, lettre morte, abandonnée, échouée, tentatives, backoff, temporisation, mettre en file d’attente, clé d’idempotence, gestionnaire, handler
---

Une **tâche** est un travail qui s’exécute en arrière-plan plutôt que pendant que quelqu’un attend le chargement
d’un écran : envoyer un rapport mensuel, importer un fichier, livrer un webhook. Ton produit, une
planification ou Axentra lui-même place des tâches dans une file d’attente, et un processus **worker** distinct les récupère
et exécute le code (le **gestionnaire**) associé au **type** de la tâche. L’écran **Tâches** montre
ce qui attend, ce qui s’exécute, ce qui a réussi et ce qui a échoué, et permet aux opérateurs de relancer ou d’annuler
des tâches.

> [!IMPORTANT]
> Les tâches exigent le module serveur `events` ; sans lui, **Tâches** n’apparaît pas dans la barre
> latérale. La consultation exige l’autorisation `jobs:read` (les propriétaires, administrateurs,
> support et lecteurs du produit la détiennent). **Relancer** et **Annuler la tâche** exigent
> `jobs:manage` ; sans elle, ces boutons sont masqués. **Mettre une tâche en file d’attente** exige
> aussi `jobs:manage`, sauf pour les types ouverts aux membres d’un locataire (voir [qui peut mettre
> quel type en file d’attente](#kind-permissions)). Les tâches ne s’exécutent que tant qu’au moins
> un processus worker (`axentra worker`) fonctionne. Cela relève de l’exploitation, voir la
> [configuration du serveur](help:server-configuration).

## Lire la liste des tâches {#jobs-list}

Ouvre [Tâches](app:jobs). La liste affiche les tâches les plus récentes en premier, avec **Type**, **Statut**,
**Tentatives** (par exemple `2 of 5`), **Locataire** (ou **Niveau produit** pour les tâches qui n’appartiennent pas
à un locataire), **Créée le** et **Modifiée le**. Sélectionne un type pour ouvrir les détails de la tâche.

### Compteurs de la vue d’ensemble {#overview}

La carte **Vue d’ensemble** compte les tâches par statut. Sélectionne un compteur pour n’afficher que ces tâches. Sous
les compteurs, tu vois combien de tâches ont réussi et échoué au cours des dernières 24 heures (le nombre d’échecs
inclut les tâches **Abandonnée**) et quand la **Plus ancienne tâche en file d’attente** a été créée. Si cette date ne cesse de
reculer, aucun worker ne prend de tâches : vérifie qu’un worker fonctionne et qu’il gère ce type.

### Filtrer les tâches {#filter}

Filtre par **Statut**, par **Type** exact (par exemple `reports.send`) et par **Locataire**, puis choisis
**Appliquer les filtres**. **Réinitialiser les filtres** les efface. Les filtres font partie de l’adresse de la page :
tu peux donc enregistrer une vue filtrée dans tes favoris ou la partager.

### Suivre les changements en direct {#live-updates}

Active **Mises à jour en direct** pour suivre le flux des tâches du serveur. Studio actualise alors la liste et
les compteurs (au plus une fois par seconde) chaque fois qu’une tâche change. L’indicateur à côté de l’interrupteur
montre l’état de la connexion ; consulte [État de la connexion](help:events#connection-status). Sans mises à jour
en direct, la liste ne change que lorsque tu la recharges.

## Statuts des tâches {#statuses}

```diagram
job-lifecycle
```

| Statut                | Signification                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **En file d’attente** | En attente d’un worker. Une tâche différée ou qui attend sa prochaine tentative est aussi en file d’attente.                      |
| **En cours**          | Un worker a pris la tâche et détient sur elle un bail limité dans le temps.                                                       |
| **Réussie**           | Le gestionnaire a terminé. Sa valeur de retour est enregistrée comme **Résultat**.                                                |
| **Échouée**           | Le gestionnaire a signalé une erreur définitive (il a levé `PermanentJobError`). Il n’y a plus de tentative automatique.          |
| **Abandonnée**        | Toutes les tentatives sont épuisées. La tâche est conservée comme « lettre morte » pour que tu puisses l’examiner et la relancer. |
| **Annulée**           | Annulée avant son démarrage, ou le gestionnaire s’est arrêté après une demande d’annulation.                                      |

**Échouée** et **Abandonnée** sont tous deux des états finaux, mais pour des raisons différentes : **Échouée** signifie que le gestionnaire
a jugé qu’une nouvelle tentative ne servirait à rien ; **Abandonnée** signifie que chaque tentative s’est terminée par une erreur.

**Tâches ignorées.** Une tâche dont le produit est archivé ou dont le locataire est suspendu (ou
n’existe plus) n’est pas exécutée. Le worker la termine comme **Échouée** avec une dernière erreur
qui commence par `skipped:`, par exemple `skipped: the product or tenant is not active`. Studio la
signale par **Non exécuté : produit ou locataire inactif**. Les tâches déclenchées par une
planification se terminent ainsi tant que le locataire est suspendu. La tâche est conservée : quand
le produit et le locataire sont de nouveau actifs, relance-la si elle est encore utile.

## Tentatives, nouvelles tentatives et backoff {#retries}

Chaque fois qu’un worker prend une tâche, son compteur de tentatives augmente d’une unité. Quand une tentative se termine par une
erreur ordinaire, la tâche repasse **En file d’attente** et attend avant la tentative suivante. L’attente croît
de façon exponentielle : elle est comprise entre la moitié et la totalité de `2 × 2^(n−1)` secondes après la tentative _n_ (2, 4, 8, 16 …
secondes avec les paramètres par défaut, jamais plus d’une heure). Ce « backoff » (temporisation progressive) laisse à un problème
temporaire, comme un service externe surchargé, le temps de se résorber. La part aléatoire évite que de nombreuses tâches en échec
ne soient relancées au même moment.

Quand la dernière tentative autorisée échoue, la tâche devient **Abandonnée**. La valeur par défaut est de **5** tentatives : avec
les paramètres par défaut, une tâche qui échoue systématiquement est donc abandonnée au bout d’environ une demi-minute. Tu peux définir
**Tentatives max.** entre 1 et 100 lorsque tu mets une tâche en file d’attente ou que tu crées une planification.

Un worker qui plante cesse de renouveler son bail. À l’expiration du bail (60 secondes par défaut),
un autre worker remet la tâche dans la file d’attente. L’exécution perdue compte comme une tentative.

> [!WARNING]
> Les tâches s’exécutent **au moins une fois**, et non exactement une fois. Une tâche peut s’exécuter deux fois, par exemple après un plantage
> de worker ou quand le résultat n’a pas pu être enregistré. Les gestionnaires doivent être idempotents : les exécuter deux fois doit
> avoir le même effet que les exécuter une seule fois.

## Ouvrir les détails d’une tâche {#job-detail}

Sélectionne le type d’une tâche dans la liste. La page de détails affiche :

- **Détails** : **ID de la tâche**, **Type**, **Statut**, **Locataire**, **Tentatives**, **Priorité**,
  **Clé d’idempotence**, la **Planification** qui a créé la tâche (un lien), le **Worker** qui l’exécute ou
  l’a exécutée, si **Annulation demandée** est positionné, et **Créée par** (l’ID d’un utilisateur ou d’une clé d’API, ou
  `schedule:<id>` pour les tâches planifiées).
- **Chronologie** : **Créée le**, **Exécuter après** (l’heure de démarrage au plus tôt, délais et backoff compris),
  **Démarrée le**, **Bail jusqu’au**, **Terminée le** et **Modifiée le**.
- **Dernière erreur** : le message d’erreur de la dernière tentative échouée, 2000 caractères au maximum.
  Le serveur retire les jetons, les clés d’API et les chaînes de connexion avant d’enregistrer le message.
- **Charge utile** et **Résultat** au format JSON. Les valeurs placées sous des clés comme `password`, `secret`, `token` ou
  `api_key` sont affichées sous la forme `[redacted]`.

Tant qu’une tâche est **En file d’attente** ou **En cours**, la page s’actualise toute seule toutes les 3 secondes.

## Mettre une tâche en file d’attente {#enqueue}

En général, tu ne mets pas de tâches en file d’attente à la main : le code de ton produit et les planifications s’en chargent. La mise en file
d’attente depuis Studio est utile pour lancer une exécution ponctuelle ou pour tester un gestionnaire.

1. Ouvre [Tâches](app:jobs) et choisis **Mettre une tâche en file d’attente**.
2. Saisis le **Type**, par exemple `reports.send`. Il doit correspondre à un gestionnaire exécuté par un worker.
3. Facultatif : saisis la **Charge utile** sous forme d’objet JSON (l’entrée du gestionnaire), choisis un
   **Locataire**, et définis **Priorité**, **Délai (secondes)** et **Tentatives max.**.
4. Choisis **Mettre en file d’attente**. Studio ouvre la page de détails de la nouvelle tâche.

| Paramètre             | Effet                                                                                                                     | Valeurs autorisées / par défaut                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**              | Sélectionne le gestionnaire qui exécute la tâche.                                                                         | Commence par une lettre minuscule, suivie de lettres minuscules, de chiffres et de `_ . : -`, 100 caractères au maximum. `axentra.` est réservé. Obligatoire. |
| **Charge utile**      | Entrée du gestionnaire.                                                                                                   | Objet JSON, 64 Ko au maximum. Par défaut `{}`.                                                                                                                |
| **Locataire**         | Exécute la tâche dans la portée d’un locataire ; le gestionnaire ne peut alors atteindre que les données de ce locataire. | Un locataire du produit, ou **Niveau produit**.                                                                                                               |
| **Priorité**          | Les valeurs les plus élevées sont prises en premier quand plusieurs tâches sont dues.                                     | −100 à 100. Par défaut 0.                                                                                                                                     |
| **Délai (secondes)**  | La tâche ne démarre pas avant que ce nombre de secondes se soit écoulé.                                                   | 0 à un an. Par défaut 0.                                                                                                                                      |
| **Tentatives max.**   | Nombre d’essais de la tâche avant qu’elle ne devienne **Abandonnée**.                                                     | 1 à 100. Vide : valeur par défaut du serveur (5).                                                                                                             |
| **Clé d’idempotence** | Évite de créer deux fois la même tâche.                                                                                   | 1 à 200 caractères imprimables. Studio remplit une clé aléatoire.                                                                                             |

> [!CAUTION]
> Ne mets pas de secrets (mots de passe, clés d’API) dans une charge utile. Les charges utiles sont stockées telles quelles et sont
> lisibles par toute personne disposant de `jobs:read` (les noms de champs secrets courants sont seulement masqués à
> l’affichage). Transmets des ID et laisse le gestionnaire lire le secret.

### Clé d’idempotence {#idempotency-key}

Studio génère une nouvelle clé à chaque ouverture de la boîte de dialogue. Si tu envoies deux fois (un double clic, ou
une nouvelle tentative après un délai dépassé), le serveur renvoie la tâche créée par le premier envoi au lieu d’en créer
une seconde. La clé est unique par produit, locataire et type tant que la tâche existe.

Si la même clé a déjà été utilisée avec une autre charge utile ou une autre priorité, ou par un autre appelant qui
ne peut pas lire les tâches, le serveur refuse la requête. Studio affiche alors **Déjà utilisée pour une autre
requête** et propose **Utiliser une nouvelle clé**.

## Relancer une tâche échouée ou abandonnée {#retry}

1. Ouvre la tâche, ou ouvre le menu d’actions de sa ligne dans la liste.
2. Choisis **Relancer** et confirme.

La tâche repasse **En file d’attente** avec son compteur de tentatives remis à 0 : elle dispose donc de nouveau de toutes ses
tentatives. **Relancer** n’est proposé que pour les tâches **Échouée** et **Abandonnée**. Corrige d’abord la cause
(voir **Dernière erreur**), sinon la tâche échouera de nouveau.

## Annuler une tâche {#cancel}

1. Ouvre la tâche, ou ouvre le menu d’actions de sa ligne.
2. Choisis **Annuler la tâche** et confirme.

Ce qui se passe dépend du statut :

- Une tâche **En file d’attente** est annulée sur-le-champ et ne s’exécute jamais.
- Pour une tâche **En cours**, l’annulation est _demandée_. La liste affiche **Annulation demandée**.
  Le gestionnaire voit la demande lors de sa prochaine vérification (les gestionnaires vérifient entre deux étapes) et s’arrête ;
  la tâche se termine alors comme **Annulée**. Si le gestionnaire termine son travail avant, la tâche se termine comme
  **Réussie**, puisque le travail a été fait.

Les tâches déjà terminées ne peuvent pas être annulées.

## Pour les développeurs et les opérateurs {#developers}

### Gestionnaires et workers {#workers}

Les gestionnaires sont enregistrés en Python avec `ax.jobs.register("reports.send", handler)` et exécutés par
`axentra worker`. Un worker ne prend que les types pour lesquels il a un gestionnaire. Une tâche dont aucun worker en cours
ne gère le type reste **En file d’attente** indéfiniment ; elle n’échoue pas. Les gestionnaires peuvent :

- renvoyer une valeur JSON, qui devient le **Résultat** (au-delà de 64 Ko : remplacée par une note de
  troncature) ;
- lever `PermanentJobError` pour se terminer immédiatement comme **Échouée** ;
- lever `RetryJob(delay_seconds=…)` pour une nouvelle tentative après un délai de leur choix ;
- appeler `ctx.heartbeat()` pendant un long travail pour renouveler le bail, et `ctx.cancel_requested()` pour
  détecter une annulation.

La liste des tâches et les statistiques sont aussi disponibles via l’API : `GET /v1/products/{product_id}/jobs`,
`/jobs/stats` et le flux SSE `/jobs/stream`. Consulte les [bases de l’API](help:api-basics).

### Qui peut mettre quel type en file d’attente {#kind-permissions}

Les détenteurs de `jobs:manage` peuvent mettre en file d’attente tout type qui ne commence pas par
`axentra.`. Via l’API, les membres d’un locataire qui n’ont que `events:publish` ne peuvent mettre
un type en file d’attente que si le produit leur a explicitement ouvert ce type ; sinon le serveur
répond « not permitted ». Studio propose aussi **Mettre une tâche en file d’attente** aux membres
d’un locataire sans `jobs:manage` : ils choisissent d’abord un **Locataire**, puis l’un des types
qui leur y sont ouverts. Si aucun type ne leur est ouvert dans ce locataire, la boîte de dialogue
l’indique.

### Types de tâches intégrés {#system-kinds}

Axentra utilise la file d’attente pour son propre travail : tu verras donc ces types dans la liste :

| Type                      | Rôle                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `axentra.event.dispatch`  | Distribue un événement publié aux abonnés et aux points de terminaison de webhooks. |
| `axentra.event.handle`    | Exécute un abonné interne au processus pour un événement.                           |
| `axentra.webhook.deliver` | Envoie une livraison de webhook ; consulte les [webhooks](help:webhooks#retries).   |

Tu ne peux pas mettre toi-même en file d’attente des types `axentra.`, mais tu peux les relancer et les annuler comme les autres tâches.

### Conservation {#retention}

Les tâches terminées (**Réussie**, **Échouée**, **Abandonnée**, **Annulée**) sont supprimées au bout de 30 jours par
défaut (`observability.job_retention_days`). Les tâches en file d’attente et en cours ne sont jamais purgées.

## Bon à savoir {#good-to-know}

- Aucun ordre n’est garanti. La priorité la plus élevée passe d’abord, puis l’heure de démarrage la plus proche, mais les nouvelles tentatives et
  les workers en parallèle modifient l’ordre des tâches.
- Chaque tâche est confiée à un seul worker par tentative.
- Chaque mise en file d’attente, relance et annulation est consignée dans le [journal d’audit](help:audit)
  (`events.job.enqueue`, `events.job.retry`, `events.job.cancel`).
- Le contrôle de disponibilité du serveur n’inclut pas les workers. Surveille plutôt la **Plus ancienne tâche en file d’attente**.

## Dépannage {#troubleshooting}

**Les tâches restent En file d’attente et ne démarrent jamais.** Aucun worker ne fonctionne, ou aucun des workers en cours n’a de
gestionnaire pour ce type. Vérifie l’heure de la **Plus ancienne tâche en file d’attente**, demande à tes opérateurs de démarrer
`axentra worker` (avec `--load` pour les gestionnaires de ton produit), et vérifie l’orthographe du type.
Vérifie aussi **Exécuter après** : une tâche différée ou qui attend une nouvelle tentative est volontairement en file d’attente.

**Une tâche est Abandonnée.** Toutes les tentatives ont échoué. Lis la **Dernière erreur** sur la page de détails, corrige la cause (par
exemple un enregistrement manquant ou un service injoignable) et choisis **Relancer**.

**Une tâche est Échouée après une seule tentative.** Le gestionnaire a signalé une erreur définitive : Axentra n’a donc pas fait de
nouvelle tentative. Lis la **Dernière erreur**. Ne relance qu’après avoir corrigé la cause.

**« Vérifie ta saisie » lors de la mise en file d’attente.** Le serveur a rejeté une valeur ; le message sous le
titre la désigne, par exemple `kind must be 1-100 characters…`, `payload is larger than 64000
bytes`, `priority must be between -100 and 100` ou `job kinds starting with ’axentra.’ are
reserved`. Corrige le champ et envoie de nouveau.

**« Non autorisé » lors de la mise en file d’attente.** Il te faut `jobs:manage`. Un message comme `job kind … is not
open to tenant callers` signifie que ce type ne peut être mis en file d’attente que par des opérateurs.

**« Déjà utilisée pour une autre requête ».** La clé d’idempotence appartient à une autre demande de tâche.
Choisis **Utiliser une nouvelle clé** pour créer une nouvelle tâche, ou répète la requête d’origine sans modification.

**« Conflit » lors d’une relance ou d’une annulation.** Le statut de la tâche a changé entre-temps (par exemple elle s’est
terminée pendant que tu confirmais). Recharge la page ; **Relancer** ne fonctionne que pour les tâches **Échouée** et
**Abandonnée**, **Annuler la tâche** uniquement pour les tâches **En file d’attente** et **En cours**.

**Annulation demandée, mais la tâche continue de s’exécuter.** Le gestionnaire ne s’arrête que lorsqu’il vérifie
l’annulation. Les gestionnaires qui ne vérifient jamais s’exécutent jusqu’au bout et comptent alors comme **Réussie**. Si le
worker est bloqué, la tâche est remise en file d’attente à l’expiration de son bail.

**Une tâche s’est exécutée deux fois.** C’est attendu avec une exécution « au moins une fois ». Rends le gestionnaire idempotent,
par exemple en vérifiant si le travail a déjà été fait.
