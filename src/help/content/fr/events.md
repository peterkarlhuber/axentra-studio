---
title: Événements
summary: Parcours le journal des événements, observe les événements en direct à mesure qu’ils se produisent, comprends l’indicateur de connexion et publie un événement de test.
keywords: événement, journal des événements, événement métier, en direct, flux, SSE, server-sent events, temps réel, publier, type d’événement, abonné, outbox, boîte d’envoi, Last-Event-ID
---

Un **événement** est un court message qui signale que « quelque chose s’est produit » dans ton produit, par exemple
`invoice.created` ou `user.invited`. Chaque événement possède un **type**, le moment où il est **survenu**, le
locataire auquel il appartient, la personne ou le système qui l’a provoqué (l’**auteur**) et un objet JSON avec les détails (les
**données**). D’autres parties du système réagissent aux événements : les abonnés internes au processus dans le code de ton produit,
et les [points de terminaison de webhooks](help:webhooks) dans d’autres systèmes. L’écran **Événements** te permet de revenir
sur ce qui s’est passé (**Journal des événements**) et d’observer l’arrivée des nouveaux événements (**En direct**).

Les événements ne sont pas la même chose que le [journal d’audit](help:audit) : le journal d’audit consigne qui a modifié quoi dans
Axentra à des fins de conformité, tandis que les événements sont des messages que ton produit publie pour que d’autres systèmes y
réagissent.

> [!IMPORTANT]
> Les événements exigent le module serveur `events`. Consulter le journal et la vue en direct exige `jobs:read`
> (l’autorisation couvre les tâches et les événements). **Publier un événement** exige `events:publish` dans au moins un
> locataire (les propriétaires, administrateurs et membres des locataires la détiennent) ; sans elle, le bouton est masqué.

## Types d’événements {#event-types}

Un type d’événement est un nom en minuscules, généralement de la forme _objet.action_ : `invoice.created`,
`order.shipped`, `crm.contact:merged`. Il commence par une lettre minuscule et peut contenir des lettres minuscules,
des chiffres et `_ . : -`, jusqu’à 150 caractères. Les types qui commencent par `axentra.` sont réservés à
Axentra lui-même (par exemple `axentra.ping`, le test de webhook).

Axentra ne tient aucune liste de types « autorisés » : ton produit les définit en publiant. Plusieurs écrans
acceptent des **motifs** dans lesquels `*` remplace n’importe quel texte : `invoice.*` correspond à `invoice.created` et
`invoice.paid`, et `*` seul correspond à tous les types.

## Parcourir le journal des événements {#event-log}

Ouvre [Événements](app:events). L’onglet **Journal des événements** liste les événements du plus récent au plus ancien, avec **Type**,
**Locataire** (ou **Niveau produit**), **Auteur** et **Survenu le**. L’auteur indique la nature de l’appelant
(`user`, `api_key` ou `system`) et son ID. Fais défiler vers le bas et charge plus d’entrées pour remonter plus loin.

### Filtrer par type et par locataire {#filter}

- **Type** : un type exact (`invoice.created`) ou un préfixe qui se termine par `*` (`invoice.*`, `crm.*`).
  Le filtre du journal n’accepte un `*` qu’à la fin.
- **Locataire** : uniquement les événements d’un locataire.

Choisis **Appliquer les filtres** ; **Réinitialiser les filtres** les efface. Les filtres sont conservés dans l’adresse de la page.

### Détails d’un événement {#event-detail}

Sélectionne l’icône de détails en fin de ligne. Le panneau affiche **ID de l’événement**, **Type**, **Survenu le**,
**Locataire**, **Auteur**, **ID de requête** (pour retrouver la requête d’API dans les journaux du serveur), **Clé d’idempotence**
(si l’émetteur en a fourni une) et les **Données** au format JSON.

## Observer les événements en direct {#live}

Ouvre l’onglet **En direct**. Studio ouvre une connexion au flux d’événements du serveur et affiche les événements
**publiés à partir de maintenant**, les plus récents en haut. Les événements plus anciens se trouvent dans le **Journal des événements**.

1. Facultatif : saisis des **Types**, un ou plusieurs motifs séparés par des virgules (par exemple
   `invoice.*, user.created`), et choisis **Appliquer**. Laisse le champ vide pour voir tous les types.
   Appliquer un filtre vide la liste et rétablit la connexion.
2. Observe l’arrivée des événements. Sélectionne **Afficher les données** sur une entrée pour voir l’événement complet et sa
   position dans le flux.

La vue en direct conserve les 200 derniers événements ; les plus anciens disparaissent de la liste mais restent dans le journal.

### État de la connexion {#connection-status}

L’indicateur au-dessus de la liste (et à côté de **Mises à jour en direct** sur l’écran [Tâches](help:jobs#live-updates))
t’indique si tu reçois réellement les mises à jour :

| Indicateur              | Signification                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Connexion…**          | Studio ouvre la connexion.                                                                                                                           |
| **En direct**           | La connexion est ouverte ; les nouveaux événements apparaissent en une seconde environ.                                                              |
| **En direct, en pause** | Connecté, mais l’affichage est en pause (voir ci-dessous).                                                                                           |
| **Reconnexion**         | La connexion a été coupée ou le serveur y a mis fin. Studio réessaie automatiquement et indique quand (_prochaine tentative dans … s_).              |
| **Déconnecté**          | Studio a cessé d’essayer, par exemple parce que ta session ou ton autorisation a changé. La raison est affichée à côté ; choisis **Se reconnecter**. |
| **Non connecté**        | Tu as choisi **Se déconnecter**.                                                                                                                     |

Le serveur met fin à chaque flux au bout d’une heure et vérifie ta session et ton autorisation toutes les 15
secondes (paramètres par défaut). Après une fin normale ou un problème de réseau, Studio se reconnecte et
**reprend là où il s’était arrêté**, si bien qu’aucun événement n’est perdu entre-temps. Si ton accès a été révoqué, le
flux se ferme avec _L’accès au flux a été perdu (session ou autorisation modifiée)._

### Mettre en pause, reprendre et effacer {#pause}

- **Pause** fige la liste pour que tu puisses la lire. La connexion reste ouverte et les nouveaux événements sont
  collectés. **Reprendre** les affiche (le bouton les compte, par exemple **Reprendre (3 nouveaux événements)**).
- **Se déconnecter** ferme la connexion. **Se connecter** la rouvre et reprend après le dernier
  événement reçu : les événements publiés entre-temps apparaissent donc aussi.
- **Effacer** vide la liste sur ton écran. Aucun événement n’est supprimé.

## Publier un événement de test {#publish}

Publier un événement à la main est utile pour tester un point de terminaison de webhook ou un abonné.

1. Choisis **Publier un événement**.
2. Choisis le **Locataire**. Les événements publiés ici appartiennent toujours à un locataire.
3. Saisis le **Type**, par exemple `invoice.created`.
4. Saisis les **Données** sous forme d’objet JSON, par exemple `{"invoice_id": "inv_123"}`.
5. Choisis **Publier**.

L’événement apparaît dans le journal et est livré à chaque point de terminaison de webhook activé dont les types d’événements
correspondent, ainsi qu’aux abonnés de ton produit. C’est un véritable événement : les destinataires ne peuvent pas le distinguer
d’un événement publié par ton produit ; utilise donc des données de test et un locataire prévu pour les tests.

| Paramètre     | Effet                                                                           | Valeurs autorisées / par défaut                                  |
| ------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Locataire** | Le locataire auquel l’événement appartient. Tu dois y détenir `events:publish`. | Obligatoire.                                                     |
| **Type**      | Le type d’événement sur lequel filtrent les destinataires.                      | Voir [Types d’événements](help:events#event-types). Obligatoire. |
| **Données**   | Détails de l’événement.                                                         | Objet JSON, 64 Ko au maximum. Par défaut `{}`.                   |

Studio envoie une clé d’idempotence avec chaque boîte de dialogue de publication : un double clic ne publie donc qu’une seule fois.

## Pour les développeurs {#developers}

- **Outbox transactionnelle.** Le code du produit publie avec `ax.events.publish_in_tx(...)` au sein de sa
  propre transaction de base de données. L’événement existe si et seulement si la transaction est validée : aucun événement n’est donc
  envoyé pour une modification annulée.
- **La livraison aux abonnés et aux webhooks** passe par des [tâches](help:jobs#system-kinds)
  (`axentra.event.dispatch`, `axentra.event.handle`, `axentra.webhook.deliver`), chacune au moins une fois.
  L’ordre entre les événements n’est pas garanti.
- **API.** `GET /v1/products/{product_id}/events?type=&tenant_id=` liste les événements,
  `GET /events/{event_id}` en renvoie un, et `POST /tenants/{tenant_id}/events` publie (avec un en-tête
  `Idempotency-Key` facultatif).
- **Flux (SSE).** `GET /events/stream?types=invoice.*,user.created` et `GET /jobs/stream` envoient
  des messages avec `id:` (la position dans le flux), `event:` (le type d’événement, ou `job.<status>` pour le flux
  des tâches) et des `data:` en JSON. Renvoie le dernier `id` dans `Last-Event-ID` pour reprendre ;
  `Last-Event-ID: 0` rejoue tout ce qui est encore conservé. Avec `?tenant_id=`, l’autorisation est vérifiée
  dans ce locataire : les clés d’API liées à un locataire peuvent donc suivre le flux de leur locataire. Le flux des tâches montre
  le dernier état de chaque tâche modifiée : des états intermédiaires peuvent donc être sautés.
- **Conservation.** Les événements sont supprimés après la durée de conservation des tâches (30 jours par défaut), dès qu’aucune
  livraison n’est plus en attente.

## Bon à savoir {#good-to-know}

- La vue en direct n’affiche que les événements qui arrivent pendant qu’elle est ouverte. Pour voir ce qui s’est passé avant, utilise
  le **Journal des événements**.
- Les suggestions de types dans le formulaire de webhook proviennent des derniers événements de ce journal, car il n’existe
  pas de catalogue central des types.

## Dépannage {#troubleshooting}

**Le journal est vide.** Ton produit n’a pas encore publié d’événements, ou les filtres les excluent. Choisis
**Réinitialiser les filtres**. Publie un événement de test pour vérifier la configuration.

**« Saisis un type exact ou un préfixe se terminant par `*` ».** Le filtre du journal accepte `invoice.created` ou
`invoice.*`, mais pas un `*` au milieu. Pour la vue en direct et les webhooks, les motifs comme `*.created`
sont autorisés.

**L’indicateur reste sur Reconnexion.** Studio ne parvient pas à joindre le flux du serveur. Vérifie ton réseau
et l’état du serveur. Les proxys qui mettent les réponses en mémoire tampon peuvent aussi interrompre les flux ; préviens tes opérateurs.

**Déconnecté avec « L’accès au flux a été perdu ».** Ta session a pris fin ou ton rôle a changé.
Reconnecte-toi si nécessaire, puis choisis **Se reconnecter**.

**« Non autorisé » à l’ouverture d’Événements.** Il te faut `jobs:read` dans ce produit. Demande à un propriétaire ou à un
administrateur du produit un rôle qui l’inclut, voir [rôles et autorisations](help:roles-permissions).

**Les types commençant par « axentra. » sont réservés à Axentra.** Choisis un type avec ton propre préfixe, par exemple
`invoice.created`.

**« Déjà utilisée pour une autre requête » lors de la publication.** Une tentative précédente depuis la même boîte de dialogue
a utilisé d’autres valeurs. Studio a déjà créé une nouvelle clé : choisis de nouveau **Publier**.

**Un événement publié n’a pas atteint un webhook.** Vérifie que le point de terminaison est activé, que l’un de ses
types d’événements correspond et que son filtre de locataire (s’il est défini) correspond au locataire de l’événement. Consulte ensuite les
[livraisons](help:webhooks#deliveries) du point de terminaison. S’il n’y a aucune livraison, il se peut qu’aucun worker ne
fonctionne pour distribuer l’événement.
