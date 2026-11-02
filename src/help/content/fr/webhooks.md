---
title: Webhooks
summary: Envoie des événements à d’autres systèmes sous forme de requêtes HTTP signées, gère le secret de signature, et vérifie, relance et relivre les livraisons.
keywords: webhook, point de terminaison, endpoint, rappel, callback, HTTP POST, secret de signature, signature, HMAC, whsec, renouveler le secret, livraison, relivrer, nouvelle tentative, ping de test, récepteur, intégration
---

Un **webhook** permet à un autre système d’être informé des [événements](help:events) de ton produit sans avoir à les
demander. Tu enregistres un **point de terminaison**, c’est-à-dire une URL dans l’autre système, et tu choisis les types
d’événements qui l’intéressent. Chaque fois qu’un événement correspondant est publié, Axentra envoie une requête HTTP `POST` avec
l’événement au format JSON à cette URL. Chaque requête est **signée** avec un secret que seuls Axentra et le
récepteur connaissent, pour que le récepteur puisse vérifier l’authenticité de la requête. Chaque tentative est enregistrée comme
une **livraison** que tu peux examiner et renvoyer.

> [!IMPORTANT]
> Les webhooks exigent le module serveur `events`. Consulter les points de terminaison et les livraisons exige `webhooks:read`
> (propriétaires, administrateurs, support et lecteurs du produit). Créer, modifier, tester, renouveler le secret,
> relivrer et supprimer exigent `webhooks:manage` (propriétaires et administrateurs du produit) ; sans cette autorisation, ces
> boutons sont masqués et **Paramètres** est en lecture seule. Un processus worker doit fonctionner pour que les livraisons soient
> envoyées.

## Fonctionnement de la livraison {#how-it-works}

```diagram
webhook-delivery
```

1. Ton produit publie un événement, par exemple `invoice.created` dans le locataire `acme`.
2. Un worker recherche les points de terminaison **activés** dont les **Types d’événements** correspondent au type et dont le
   **Filtre de locataire** est vide ou égal au locataire de l’événement. Pour chaque correspondance, il crée une livraison
   avec le statut **En attente**.
3. Le worker envoie la requête signée. Une réponse `2xx` fait passer la livraison à **Livrée**.
4. Toute autre réponse, un délai dépassé ou une erreur de connexion la fait passer à **Échouée, nouvelle tentative prévue** : elle est renvoyée
   après une attente croissante. Après la dernière tentative, elle est **Abandonnée**.
5. Tu peux **Relivrer** une livraison qui n’est pas en attente, par exemple après avoir corrigé le récepteur.

Les livraisons ont lieu **au moins une fois** : un récepteur peut recevoir deux fois le même événement (par exemple quand sa
réponse `200` a été perdue). Les récepteurs doivent mémoriser l’ID de l’événement et ignorer les doublons. L’ordre entre
les événements n’est pas garanti.

## Créer un point de terminaison {#create}

1. Ouvre [Webhooks](app:webhooks) et choisis **Nouveau point de terminaison**.
2. Saisis l’**URL** qui doit recevoir les requêtes.
3. Facultatif : une **Description** (jusqu’à 1000 caractères), par exemple le responsable du récepteur.
4. Ajoute les **Types d’événements** : saisis un type ou un motif et appuie sur Entrée ou choisis **Ajouter un type**. Studio
   suggère les types qu’il a vus dans les événements récents, ainsi que **\* (tous les types)**.
5. Facultatif : choisis un **Filtre de locataire** et désactive **Activé** si le récepteur n’est pas encore prêt.
6. Choisis **Créer le point de terminaison**.
7. Copie le **Secret de signature** qui s’affiche, conserve-le pour le récepteur, coche **J’ai conservé le
   secret en lieu sûr** et choisis **Terminé**. Consulte [Conserver le secret de signature](help:webhooks#signing-secret).

Studio ouvre ensuite la page du point de terminaison.

### Règles relatives aux URL {#url-rules}

Pour éviter que les webhooks ne servent à atteindre des systèmes internes, le serveur vérifie chaque URL lors de
l’enregistrement, puis de nouveau avant chaque livraison :

- Elle doit commencer par `https://`. Le simple `http://` n’est accepté que par les serveurs hors production
  dont les opérateurs ont activé `events.webhook_allow_http`.
- Elle ne doit contenir ni nom d’utilisateur ni mot de passe (`https://user:pass@…`), ni fragment (`#…`).
- `localhost` et les noms d’hôte se terminant par `.local`, `.localhost` ou `.internal` sont refusés.
- Le nom d’hôte est résolu, et **toutes** les adresses vers lesquelles il pointe doivent être publiques. Les réseaux privés
  (comme `10.x`, `192.168.x`), le loopback, le link-local et les autres adresses spéciales sont refusés,
  sauf si les opérateurs ont défini `events.webhook_allow_private_targets` (prévu pour le développement, et en
  production uniquement avec une dérogation supplémentaire).
- 2000 caractères au maximum.

Les redirections ne sont pas suivies : une réponse `301` ou `302` compte comme un échec. Utilise l’URL finale.

### Choisir les types d’événements {#event-types}

Chaque point de terminaison possède de 1 à 50 motifs de types d’événements. Utilise des types exacts (`invoice.created`), des motifs avec `*`
(`invoice.*`, `*.deleted`) ou `*` pour tous les types. Les motifs utilisent des lettres minuscules, des chiffres, `_ . : -`
et `*`. Les événements de types réservés (`axentra.…`) ne sont jamais envoyés aux points de terminaison, à l’exception du ping de test.

### Filtre de locataire {#tenant-filter}

Sans filtre de locataire, le point de terminaison reçoit les événements correspondants de **tous les locataires** ainsi que les événements
de niveau produit. Avec un filtre, il ne reçoit que les événements de ce locataire. Le filtre de locataire ne peut plus être modifié
ensuite ; crée plutôt un nouveau point de terminaison.

## Conserver le secret de signature {#signing-secret}

Lorsque tu crées un point de terminaison (et lorsque tu renouvelles son secret), Axentra génère un secret de signature
qui commence par `whsec_`. Il n’est affiché **qu’une seule fois**. Axentra le stocke chiffré et ne l’affiche plus
jamais.

> [!CAUTION]
> Conserve immédiatement le secret dans le coffre de secrets de ton récepteur. Toute personne qui le connaît peut envoyer des requêtes
> que ton récepteur acceptera comme authentiques. Si tu le perds ou s’il fuit,
> [renouvelle le secret](help:webhooks#rotate-secret).

Le récepteur utilise le secret pour vérifier l’en-tête `Axentra-Signature` de chaque requête. Le
[tutoriel sur le récepteur de webhooks](help:tutorial-webhook-receiver#verify-signature) présente l’algorithme exact
avec du code Python et TypeScript.

## Envoyer un ping de test {#test}

Sur la page du point de terminaison, choisis **Envoyer un ping de test**. Axentra envoie immédiatement une requête signée avec
le type `axentra.ping` et attend la réponse. Studio affiche **Ping de test livré (HTTP 200)**
ou **Échec du ping de test** avec le code de statut ou l’erreur, et ouvre la livraison enregistrée.

Un ping de test est envoyé une seule fois, sans nouvelle tentative, y compris à un point de terminaison désactivé : tu peux ainsi tester un
récepteur avant de l’activer. Son corps contient `"type": "axentra.ping"`, `"data": {"endpoint_id": "…"}`,
et l’ID de la livraison dans `id`.

## Vérifier les livraisons {#deliveries}

L’onglet **Livraisons** d’un point de terminaison liste ses livraisons de la plus récente à la plus ancienne : **Événement** (type et ID de la
livraison), **Statut**, **Réponse** (le code de statut HTTP), **Tentatives**, **Durée** et **Créée le**.
Filtre par **Statut** ; **Actualiser** charge l’état le plus récent.

### Statuts des livraisons {#delivery-statuses}

| Statut                                 | Signification                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **En attente**                         | En attente d’envoi, en cours d’envoi, ou remise en file d’attente par **Relivrer**.                                           |
| **Livrée**                             | Le récepteur a répondu avec un statut `2xx`.                                                                                  |
| **Échouée, nouvelle tentative prévue** | La dernière tentative a échoué ; une autre tentative est prévue (**Prochaine tentative**).                                    |
| **Abandonnée**                         | Plus aucune tentative automatique : toutes ont été utilisées, l’URL a été refusée ou le point de terminaison a été désactivé. |

### Détails d’une livraison {#delivery-detail}

Sélectionne l’icône de détails en fin de ligne. Le panneau affiche **ID de la livraison**, **Statut**,
**Réponse**, **Tentatives**, **Durée**, l’**ID de l’événement**, la **Tâche** qui l’envoie (un lien vers
la [tâche](help:jobs#job-detail)), **Créée le**, **Livrée le** et **Prochaine tentative**, ainsi que :

- **Dernière erreur** : par exemple `HTTP 500`, un délai dépassé, `unresolvable: …` ou `refused: …` ;
- **Corps de la réponse** : les 4096 premiers octets (par défaut) de la réponse du récepteur. Renvoyer un court
  texte d’erreur depuis ton récepteur facilite le diagnostic des problèmes ici.

## Nouvelles tentatives {#retries}

Les livraisons échouées sont relancées automatiquement via la file d’attente des tâches, jusqu’à **8
tentatives** avec les paramètres par défaut (`events.webhook_max_attempts`). Les webhooks ont leur
propre calendrier, plus lent que celui des autres tâches : l’attente avant la tentative _n + 1_ est
comprise entre la moitié et la totalité de `120 × 2^(n−1)` secondes, 6 heures au plus
(`events.webhook_backoff_base_seconds`, `events.webhook_backoff_max_seconds`). Avec les paramètres
par défaut, les attentes sont d’environ 2, 4, 8, 16, 32, 64 et 128 minutes : la dernière tentative a
donc lieu environ **2 à 4¼ heures** après la première, et une panne du récepteur d’environ deux
heures au plus est toujours couverte. Chaque tentative attend au plus 10 secondes pour la connexion
et pour chaque lecture de la réponse. (Les versions d’Axentra antérieures à ce calendrier
utilisaient l’attente courte des tâches et épuisaient toutes les tentatives en quelques minutes.)

Un récepteur indisponible plus longtemps ne perd aucun événement, mais ses livraisons finissent **Abandonnée** :
relivre-les une fois qu’il est de nouveau disponible. Axentra ne désactive pas les points de terminaison qui échouent de façon répétée, et n’applique
pas de limitation de débit par point de terminaison.

Deux cas mettent fin à une livraison sans nouvelle tentative : une URL que le serveur refuse (voir les
[règles relatives aux URL](help:webhooks#url-rules)), et un point de terminaison désactivé pendant que la livraison attendait. Un nom
d’hôte qui ne peut pas être résolu fait l’objet de nouvelles tentatives.

## Relivrer {#redeliver}

1. Ouvre les détails de la livraison.
2. Choisis **Relivrer**.

La livraison passe à **En attente** et est renvoyée avec une nouvelle série de tentatives. Le compteur **Tentatives**
continue de compter. **Relivrer** n’est pas proposé tant que la livraison est **En attente**. Le récepteur
reçoit de nouveau le même ID d’événement : un récepteur qui dédoublonne ignore donc les événements qu’il a déjà traités.

## Renouveler le secret de signature {#rotate-secret}

Renouvelle le secret quand il a pu fuiter, quand une personne qui le connaissait s’en va, ou régulièrement, par bonne
pratique.

1. Sur la page du point de terminaison, choisis **Renouveler le secret**.
2. Choisis un **Délai de grâce** : **Aucun (l’ancien secret cesse immédiatement de fonctionner)**, **1 heure**, **24 heures** ou
   **7 jours**.
3. Choisis **Renouveler le secret**, puis copie et conserve le nouveau secret comme lors de la création.

Pendant le délai de grâce, chaque requête porte **deux** signatures : l’une faite avec le nouveau secret et
l’autre avec le précédent. Un récepteur qui a encore l’ancien secret continue de fonctionner pendant que tu
le mets à jour. La page du point de terminaison affiche **Secret précédent encore valide** jusqu’à la fin du délai.

> [!TIP]
> Pour renouveler sans livraison échouée : choisis un délai de grâce, place le nouveau secret dans le récepteur,
> et vérifie que les livraisons réussissent toujours avant la fin du délai. Avec **Aucun**, le récepteur rejette
> chaque requête tant qu’il n’a pas le nouveau secret.

## Modifier ou désactiver un point de terminaison {#edit}

Ouvre l’onglet **Paramètres** du point de terminaison, modifie l’**URL**, la **Description**, les **Types d’événements** ou
**Activé**, puis choisis **Enregistrer les modifications**. **Annuler les modifications** rétablit les valeurs enregistrées.

Désactiver **Activé** arrête les nouvelles livraisons. Les livraisons qui attendaient encore une tentative se terminent
comme **Abandonnée** avec l’erreur `endpoint disabled` ; relivre-les après avoir réactivé le point de terminaison.
Les événements publiés pendant que le point de terminaison était désactivé ne sont pas livrés ultérieurement.

## Supprimer un point de terminaison {#delete}

Choisis **Supprimer le point de terminaison** et confirme. Le point de terminaison ne reçoit plus rien, et son historique de livraisons est
supprimé avec lui. Cette action est irréversible. Pour mettre un point de terminaison en pause, désactive-le plutôt.

## Format des requêtes {#request-format}

```http
POST /hooks/axentra HTTP/1.1
Host: example.com
Content-Type: application/json
User-Agent: Axentra-Webhooks/1
Axentra-Event: invoice.created
Axentra-Event-Id: evt_01EXAMPLE
Axentra-Delivery: dlv_01EXAMPLE
Axentra-Signature: t=1767225600,v1=9c1e…(64 hex characters)

{"data":{"invoice_id":"inv_123"},"id":"evt_01EXAMPLE","occurred_at":"2026-01-01T00:00:00+00:00","product_id":"prd_01EXAMPLE","tenant_id":"ten_01EXAMPLE","type":"invoice.created"}
```

| Champ                     | Contenu                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `id`                      | ID de l’événement, identique à l’en-tête `Axentra-Event-Id`. Utilise-le pour dédoublonner.    |
| `type`                    | Type d’événement.                                                                             |
| `product_id`, `tenant_id` | Où l’événement s’est produit ; `tenant_id` vaut `null` pour les événements de niveau produit. |
| `occurred_at`             | Moment où l’événement s’est produit (ISO 8601, UTC).                                          |
| `data`                    | L’objet de données de l’événement.                                                            |

`Axentra-Delivery` identifie la livraison et reste le même pour toutes ses tentatives et relivraisons.
Vérifie la signature sur les octets **bruts** du corps ; n’analyse pas puis ne resérialise pas le JSON au préalable.

## Paramètres {#settings}

| Paramètre                           | Effet                                                                 | Valeurs autorisées / par défaut                                          |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **URL**                             | Destination des requêtes.                                             | URL `https://`, hôte public, 2000 caractères au maximum. Obligatoire.    |
| **Description**                     | Note destinée aux personnes.                                          | Jusqu’à 1000 caractères.                                                 |
| **Types d’événements**              | Les événements envoyés.                                               | 1 à 50 types ou motifs avec `*`. Obligatoire.                            |
| **Filtre de locataire**             | Limite le point de terminaison à un locataire.                        | Un locataire ou **Tous les locataires**. Uniquement à la création.       |
| **Activé**                          | Indique si les nouvelles livraisons sont envoyées.                    | Activé par défaut.                                                       |
| **Délai de grâce** (renouvellement) | Durée pendant laquelle le secret précédent signe encore les requêtes. | Aucun, 1 heure, 24 heures, 7 jours (API : jusqu’à 7 jours, en secondes). |

Valeurs par défaut côté serveur (les opérateurs peuvent les modifier dans `[events]`) : 8 tentatives
réparties sur environ 2 à 4¼ heures, délai de 10 secondes, 4096 octets de corps de réponse
conservés.

## Bon à savoir {#good-to-know}

- Les points de terminaison, livraisons, tests et renouvellements sont aussi disponibles via l’API sous
  `/v1/products/{product_id}/webhooks` ; consulte les [bases de l’API](help:api-basics).
- Les créations, modifications, suppressions, tests, renouvellements et relivraisons sont consignés dans le
  [journal d’audit](help:audit).
- Les livraisons livrées et abandonnées sont supprimées après la durée de conservation (30 jours par défaut).

## Dépannage {#troubleshooting}

**« webhook urls must use https ».** Utilise une URL `https://`. `http://` ne fonctionne que sur les serveurs de développement
qui l’autorisent.

**« webhook urls must not point to local hosts » ou « … private, loopback or link-local addresses ».** L’URL
pointe vers ta propre machine ou vers un réseau interne. Utilise une adresse HTTPS publique, par exemple
via un service de tunnel pendant le développement (voir le
[tutoriel](help:tutorial-webhook-receiver#public-url)).

**« event_types needs 1-50 type patterns ».** Ajoute au moins un type d’événement, ou `*` pour tous.

**Échec du ping de test avec HTTP 401 ou 403.** Le récepteur a rejeté la signature. Vérifie qu’il utilise
le secret actuel (la valeur complète, `whsec_` compris), le corps brut de la requête et une horloge correcte
(les horodatages de plus de 5 minutes environ sont rejetés).

**Échec du ping de test avec HTTP 404 ou 405.** Le chemin est erroné, ou le récepteur n’accepte pas `POST`.

**Échec du ping de test sans code de statut.** Le récepteur n’a pas pu être joint : lis la **Dernière erreur**.
`unresolvable` signifie que le nom d’hôte n’existe pas dans le DNS ; un délai dépassé signifie que le récepteur n’a pas
répondu en 10 secondes. Réponds rapidement et effectue les traitements lents après avoir répondu.

**Des livraisons sont Abandonnée avec « refused: … ».** L’hôte se résout désormais en une adresse privée. Corrige l’entrée
DNS ou l’URL, puis relivre.

**Des livraisons sont Abandonnée avec « endpoint disabled ».** Le point de terminaison a été désactivé pendant qu’elles attendaient. Active-le
et relivre-les.

**Aucune livraison n’apparaît pour un événement.** Vérifie que le point de terminaison est activé, qu’un motif de type
d’événement correspond, ainsi que le filtre de locataire. Les événements publiés avant la création du point de terminaison ne sont pas
livrés. Si l’événement figure dans le [journal des événements](help:events#event-log) mais que rien ne se passe, il se peut qu’aucun worker
ne fonctionne.

**« Conflit » lors d’une relivraison.** La livraison est déjà en file d’attente ou en cours d’envoi. Patiente et choisis
**Actualiser**.

**« Modifié entre-temps » lors de l’enregistrement ou de la suppression.** Une autre personne a modifié le point de terminaison. Recharge la
page et répète ta modification.

**Le récepteur a traité un événement deux fois.** C’est attendu avec une livraison « au moins une fois ». Dédoublonne à l’aide de
`Axentra-Event-Id`.
