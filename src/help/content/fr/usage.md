---
title: Utilisation et quotas
summary: Définir des compteurs, suivre l’utilisation de chaque locataire, définir des dérogations de quota et consulter les réservations.
keywords: utilisation, consommation, mesure, compteur, quota, limite, réservation, limite stricte, limite souple, dépassement, appels API, période de réinitialisation, metering
---

La mesure de l’utilisation compte ce que chaque locataire consomme d’une ressource mesurée par ton
produit : appels d’API, octets stockés, rapports générés. Tu définis des **compteurs** dans le
Studio ; ton produit enregistre des **événements d’utilisation** sur ces compteurs via l’API.
Axentra additionne les événements par locataire et par période, compare le résultat à la
**limite** du locataire (issue d’une dérogation de quota, de l’offre ou de la valeur par défaut du
compteur) et refuse ou signale l’utilisation qui la dépasse. Les opérateurs du produit utilisent cet
écran pour définir des compteurs et suivre la consommation ; le support s’en sert pour répondre à la
question « pourquoi ma requête a-t-elle été refusée ? ».

> [!IMPORTANT]
> L’écran **Utilisation** nécessite le module `usage` sur le serveur. Sans lui, **Utilisation**
> n’apparaît pas dans la navigation. La lecture nécessite `usage:read` ; la définition de compteurs
> et de dérogations de quota nécessite l’autorisation de produit `usage:manage` ; la validation ou
> la libération de réservations nécessite `usage:record` dans le locataire. Voir
> [Rôles et autorisations](help:roles-permissions).

## Ce que l’écran affiche {#overview}

Ouvre [Utilisation](app:usage) (groupe **Utilisation et facturation**). La page comporte trois
onglets :

| Onglet                        | Affiche                                                                                       | Qui le voit                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Vue d’ensemble**            | Un graphique quotidien d’un compteur pour tous les locataires et les **Totaux par locataire** | `usage:read` au niveau du produit (rôles de produit, rôles sur la plateforme) |
| **Compteurs**                 | Les définitions des compteurs                                                                 | `usage:read` au niveau du produit                                             |
| **Utilisation par locataire** | Limites, graphique, événements et réservations d’un locataire                                 | `usage:read` dans au moins un locataire                                       |

Les personnes qui n’ont qu’un rôle de locataire (par exemple le rôle de locataire **Member**) ne
voient que l’onglet **Utilisation par locataire**, et seulement pour les locataires où elles
disposent de `usage:read`.

### Lire la vue d’ensemble {#overview-chart}

1. Choisis un **Compteur** et une **Plage de temps** (**7 derniers jours**, **30 derniers jours**
   ou **90 derniers jours**).
2. **Utilisation quotidienne, tous locataires confondus** affiche une barre par jour UTC.
   **Afficher le tableau de données** sous le graphique présente chaque jour sous forme de tableau,
   ce qui fonctionne aussi avec les lecteurs d’écran.
3. **Totaux par locataire** liste chaque locataire ayant une utilisation sur la plage, avec sa
   **Valeur** et le nombre d’**Événements**. Sélectionne le nom d’un locataire pour ouvrir son
   onglet **Utilisation par locataire**.

Le mode de calcul du total dépend de l’agrégation du compteur : **Somme** additionne les valeurs
quotidiennes, **Maximum** retient la valeur quotidienne la plus élevée, **Dernière valeur** retient
la valeur du dernier jour comportant une utilisation. Tous les jours sont des jours UTC : un jour
peut donc commencer le soir ou le matin selon ton heure locale.

Le **Tableau de bord** du produit comporte une carte **Utilisation ce mois-ci** avec les totaux par
compteur depuis le premier jour du mois UTC en cours.

## Créer un compteur {#create-meter}

Un compteur définit _ce qui_ est mesuré. Il n’enregistre rien par lui-même.

1. Ouvre l’onglet **Compteurs** et choisis **Nouveau compteur**.
2. Saisis une **Clé**, par exemple `api_calls`. Ton produit envoie l’utilisation avec cette clé.
3. Facultatif : **Nom**, **Unité** (affichée à côté des valeurs, par exemple `calls`) et
   **Description**.
4. Choisis l’**Agrégation** et la **Période de réinitialisation** (voir le tableau ci-dessous).
5. Facultatif : une **Limite par défaut** et son **Application**.
6. Choisis **Créer le compteur**.

> [!WARNING]
> **Clé**, **Agrégation** et **Période de réinitialisation** ne peuvent plus être modifiées après
> la création. Si tu t’es trompé, crée un nouveau compteur avec une autre clé.

### Paramètres d’un compteur {#meter-settings}

| Paramètre                       | Effet                                                                                                                                                                                                                      | Valeurs autorisées / par défaut                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Clé**                         | Identifiant utilisé par les appels d’API de ton produit et par les droits des offres (`limit.<key>`)                                                                                                                       | Lettres minuscules, chiffres, `_` et `.`, commençant par une lettre, 63 caractères au maximum |
| **Nom**                         | Nom d’affichage                                                                                                                                                                                                            | 200 caractères au maximum ; facultatif                                                        |
| **Unité**                       | Affichée après les valeurs                                                                                                                                                                                                 | Texte libre ; facultatif                                                                      |
| **Agrégation**                  | Façon dont les événements d’une période se combinent : **Somme** additionne les quantités, **Maximum** conserve la plus élevée, **Dernière valeur** conserve la valeur de l’événement dont l’horodatage est le plus récent | `sum` (par défaut), `max`, `last`                                                             |
| **Période de réinitialisation** | Moment où le compteur repart de zéro : **Jamais réinitialisé**, **Quotidienne (UTC)**, **Mensuelle (UTC)**, **Période de facturation**                                                                                     | Par défaut **Mensuelle (UTC)**                                                                |
| **Limite par défaut**           | Limite des locataires sans dérogation et sans limite d’offre ; vide signifie illimité                                                                                                                                      | Nombre supérieur ou égal à 0 ; vide                                                           |
| **Application**                 | **Limite stricte** refuse l’utilisation au-delà de la limite ; **Limite souple** l’enregistre et signale le dépassement                                                                                                    | Par défaut **Limite stricte**                                                                 |

Choisis l’agrégation selon ce que tu mesures : les événements qui s’additionnent (appels, messages)
utilisent **Somme** ; un niveau que tu relèves ponctuellement (stockage en octets, sièges actifs)
utilise **Maximum** ou **Dernière valeur**.

### Périodes de réinitialisation et période de facturation {#reset-period}

**Période de facturation** suit le cycle d’abonnement du locataire : la période commence le jour où
l’abonnement a démarré (par exemple le 15) et dure un mois ou un an, selon la périodicité du prix.
Un jour de début comme le 31 est ramené au dernier jour des mois plus courts. Si le module
`billing` n’est pas activé, ou si le locataire n’a pas d’abonnement au statut **Essai**, **Actif**
ou **En retard de paiement**, la période correspond au mois calendaire (UTC). Voir
[Offres et abonnements](help:plans-subscriptions).

### Des périodes fixes, pas des fenêtres glissantes {#fixed-periods}

Les limites s’appliquent par période, et les périodes ont des bornes fixes : minuit UTC pour les
compteurs quotidiens, le premier du mois (UTC) pour les compteurs mensuels. Un locataire peut
consommer toute sa limite quotidienne à 23 h 50 UTC, puis à nouveau toute sa limite à 0 h 10 UTC.
Il n’existe pas de fenêtres de quota horaires ou glissantes. Si tu as besoin d’une fenêtre plus
serrée, utilise un compteur `day` avec une limite plus basse ou un compteur supplémentaire.

Les quotas ne sont pas la même chose que la limitation du débit des requêtes du serveur (requêtes
par minute par clé ou par adresse IP). Cette limitation est configurée par l’opérateur et
désactivée par défaut ; voir [Configuration du serveur](help:server-configuration).

## Modifier, désactiver ou supprimer un compteur {#edit-meter}

Dans le menu d’actions de la ligne (**Actions pour le compteur …**) :

- **Modifier** change **Nom**, **Unité**, **Description**, **Limite par défaut** et
  **Application**.
- **Désactiver** bloque toute nouvelle utilisation du compteur : l’enregistrement sur un compteur
  inactif est refusé. Les compteurs inactifs n’apparaissent plus dans l’**Utilisation sur la
  période** d’un locataire. **Activer** annule cette action.
- **Supprimer le compteur** supprime un compteur qui n’a jamais enregistré d’utilisation. Tu
  confirmes en saisissant la clé. Un compteur avec une utilisation enregistrée ne peut pas être
  supprimé ; désactive-le à la place.

## Vérifier l’utilisation et les limites d’un locataire {#tenant-usage}

1. Ouvre l’onglet **Utilisation par locataire** et choisis le locataire (ou sélectionne un
   locataire dans **Totaux par locataire**).
2. **Utilisation sur la période** affiche une carte pour chaque compteur actif avec :
   - la valeur de la période en cours et, pour les compteurs limités, une barre indiquant
     « _utilisé_ sur _limite_ utilisés (_n_ %), réservations comprises » ;
   - l’origine de la limite (voir ci-dessous) et **Limite stricte** ou **Limite souple** ;
   - **Limite dépassée** lorsqu’une utilisation soumise à une limite souple a dépassé la limite ;
   - **Période**, **Événements**, **Réservé** (le cas échéant) et **Restant**.
3. Pour consulter une période antérieure, choisis une date dans **Période contenant**. Laisse le
   champ vide pour la période en cours.

Viennent ensuite **Utilisation quotidienne** (un graphique par compteur, mêmes plages que la vue
d’ensemble), **Événements d’utilisation** (les plus récents d’abord, filtrables par **Compteur**)
et **Réservations**.

### D’où vient la limite effective {#limit-source}

La première correspondance l’emporte :

| Badge                             | Source                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Dérogation du locataire**       | Une dérogation de quota définie pour ce locataire sur cet écran                                                          |
| **Issue de l’offre**              | Le droit `limit.<meter key>` de l’offre du locataire, ou une dérogation de droit sur la page de facturation du locataire |
| **Valeur par défaut du compteur** | La **Limite par défaut** du compteur                                                                                     |
| **Aucune limite**                 | Aucun des cas ci-dessus : illimité                                                                                       |

Une limite d’offre ne s’applique que tant que l’abonnement est au statut **Essai**, **Actif** ou
**En retard de paiement**. Les limites d’offre utilisent l’**Application** du compteur ; seule une
dérogation de quota définit la sienne.

> [!NOTE]
> Il existe deux sortes de dérogations pour un locataire. Une **dérogation de quota** (cet écran)
> remplace la limite d’un compteur, y compris son application, et l’emporte toujours. Une
> **dérogation de droit** sur la page de facturation du locataire remplace un droit de l’offre et
> s’affiche comme **Issue de l’offre**. Utilise un seul mécanisme par compteur pour que cela reste
> facile à comprendre.

## Définir ou supprimer une dérogation de quota {#quota-override}

Nécessite l’autorisation de produit `usage:manage`.

1. Dans **Utilisation sur la période**, choisis **Définir une dérogation** sur la carte du
   compteur.
2. Saisis une **Limite**. Laisse le champ vide pour une dérogation illimitée (le locataire n’a
   alors aucune limite, même si son offre en prévoit une).
3. Choisis l’**Application** puis **Enregistrer la dérogation**.

Le badge passe à **Dérogation du locataire**. **Supprimer la dérogation** (affiché uniquement sur
les cartes avec une dérogation du locataire) rétablit la limite de l’offre ou la valeur par défaut
du compteur. Les dérogations prennent effet pour la prochaine utilisation enregistrée ;
l’utilisation déjà enregistrée reste inchangée. Les modifications de quota sont consignées dans le
journal d’audit.

## Limites strictes et souples {#enforcement}

- **Limite stricte** : une requête qui dépasserait la limite est refusée avec le code HTTP `429`
  et le code d’erreur `quota_exceeded`, accompagné du compteur, de la limite, des quantités
  utilisée, réservée et demandée, ainsi que de la fin de la période. Pour les compteurs **Somme**,
  la vérification est _utilisé + réservé + demandé > limite_ ; pour les compteurs **Maximum** et
  **Dernière valeur**, elle est _demandé > limite_.
- **Limite souple** : l’utilisation est toujours enregistrée. La réponse et le Studio signalent
  **Limite dépassée**, pour que ton produit puisse avertir ou facturer le dépassement.

Une limite stricte n’est jamais dépassée par des requêtes concurrentes : Axentra sérialise les
écritures pour un même locataire, compteur et période.

## Enregistrer l’utilisation (API) {#record-usage}

Le Studio n’enregistre pas d’utilisation. Ton produit appelle l’API avec une clé qui dispose de
`usage:record` (voir [Clés d’API](help:api-keys)) :

```http
POST /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/usage/events
Authorization: Bearer axk_EXAMPLE_secret
Idempotency-Key: req-7f3a9c
Content-Type: application/json

{"meter": "api_calls", "quantity": 1}
```

- L’en-tête `Idempotency-Key` est obligatoire (1 à 200 caractères ASCII imprimables). Répéter la
  même clé avec le même corps renvoie l’événement d’origine (`200`, `replayed: true`) et ne compte
  qu’une fois. La même clé avec un corps différent est refusée avec `409`.
- `quantity` : un nombre de 0 à 10^15 avec 6 décimales au maximum.
- `occurred_at` (facultatif) : au plus 5 minutes dans le futur et 400 jours dans le passé. Les
  événements antidatés comptent dans la période à laquelle ils appartiennent, même si elle est
  terminée.
- `properties` (facultatif) : un objet JSON de 4 Ko au maximum, affiché dans **Événements
  d’utilisation**.
- `"enforce": false` enregistre sans vérifier la limite stricte ; cela nécessite l’autorisation de
  produit `usage:manage`, que les clés liées à un locataire n’ont jamais.

Le tutoriel [Offres et utilisation de bout en bout](help:tutorial-plan-usage) présente un exemple
complet.

## Réservations {#reservations}

Pour un travail de longue durée, un produit peut **réserver** une quantité avant de commencer
(API : `POST …/usage/reservations` avec `meter`, `quantity` et `ttl_seconds` de 1 à 86 400, par
défaut 300). Une réservation active compte dans la limite, de sorte que des tâches parallèles ne
peuvent pas la dépasser ensemble. Une fois le travail terminé, le produit **valide** la quantité
réelle, ce qui enregistre un événement d’utilisation, ou **libère** la réservation. Les réservations
n’existent que pour les compteurs **Somme**.

L’API ne fournit pas de liste des réservations ; le Studio recherche donc une réservation par son
identifiant :

1. Dans **Réservations**, colle l’**ID de la réservation** et choisis **Rechercher**.
2. Le Studio affiche **Statut**, compteur, **Quantité réservée**, **Expire le** et, une fois la
   réservation validée, la **Quantité validée** et l’**Événement d’utilisation**.
3. Avec `usage:record` dans le locataire, tu peux terminer ici une réservation **Active** :
   - **Valider** enregistre la **Quantité réelle** (laisse le champ vide pour valider la quantité
     réservée). Une validation n’est jamais refusée par la limite, car le travail est déjà fait.
   - **Libérer** rend la quantité sans enregistrer d’utilisation.

| Statut      | Signification                                                       |
| ----------- | ------------------------------------------------------------------- |
| **Active**  | Compte dans la limite jusqu’à son expiration                        |
| **Validée** | L’utilisation a été enregistrée                                     |
| **Libérée** | Rendue ; aucune utilisation enregistrée                             |
| **Expirée** | Non validée avant **Expire le** ; a cessé de compter à ce moment-là |

## Bon à savoir {#good-to-know}

- Les événements d’utilisation ne peuvent être ni modifiés ni supprimés, et les quantités ne
  peuvent pas être négatives : une utilisation enregistrée ne peut donc pas être soustraite. Pour
  laisser plus de marge à un locataire après une erreur, définis une
  [dérogation de quota](help:usage#quota-override) pour le reste de la période.
- Les événements d’utilisation individuels ne sont pas audités en raison de leur volume ; les
  modifications de compteurs et de quotas le sont.
- Les données d’un locataire sont isolées : un identifiant de locataire étranger renvoie
  « introuvable ».
- Le Studio affiche les quantités avec jusqu’à 6 décimales, formatées selon ta langue.
- Les séries temporelles couvrent 400 jours au maximum.
- D’autres limites sont décrites dans [Limitations connues](help:limitations).

## Dépannage {#troubleshooting}

| Ce que tu vois                                                 | Cause                                                                                  | Que faire                                                                                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Aucun accès à l’utilisation**                                | Ton rôle n’a pas `usage:read` pour ce produit ou ce locataire                          | Demande à un administrateur du produit un rôle avec `usage:read`                                                                                             |
| Seulement l’onglet **Utilisation par locataire**               | Tu disposes de `usage:read` uniquement via un rôle de locataire                        | Comportement normal ; la vue d’ensemble nécessite un rôle de produit                                                                                         |
| **Aucun compteur pour l’instant**                              | Aucun compteur n’est défini                                                            | Crée-en un dans **Compteurs** (nécessite `usage:manage`)                                                                                                     |
| **Conflit** lors de la suppression d’un compteur               | Le compteur a une utilisation enregistrée                                              | Utilise **Désactiver** à la place                                                                                                                            |
| **Conflit** « un compteur avec cette clé existe »              | Les clés sont uniques par produit, y compris pour les compteurs inactifs               | Choisis une autre clé ou active l’ancien compteur                                                                                                            |
| **Modifié entre-temps**                                        | Quelqu’un d’autre a modifié le compteur                                                | Recharge la page et refais ta modification                                                                                                                   |
| Ton produit reçoit `429 quota_exceeded`                        | Une limite stricte serait dépassée                                                     | Vérifie l’origine de la limite sur la carte ; augmente la limite de l’offre, définis une dérogation de quota ou attends la fin de la période (`Retry-After`) |
| Ton produit reçoit `409` « le compteur est inactif »           | Le compteur a été désactivé                                                            | Choisis **Activer** dans **Compteurs**                                                                                                                       |
| Ton produit reçoit `409` pour une clé d’idempotence            | La clé a été réutilisée avec un corps différent                                        | Utilise une nouvelle clé pour chaque événement d’utilisation distinct                                                                                        |
| **Vérifie ta saisie** lors de l’enregistrement                 | Quantité, `occurred_at` ou `properties` hors des limites ci-dessus                     | Corrige la valeur ; envoie `occurred_at` avec un fuseau horaire                                                                                              |
| La validation est refusée : « la réservation a expiré »        | La durée de vie (TTL) a expiré avant la validation                                     | Enregistre l’utilisation comme un événement normal ; choisis un `ttl_seconds` plus long                                                                      |
| L’utilisation apparaît le mauvais jour                         | Les jours sont en UTC                                                                  | Compare avec les heures UTC                                                                                                                                  |
| Un compteur **Période de facturation** est réinitialisé le 1er | Le locataire n’a pas d’abonnement ouvrant des droits, ou la facturation est désactivée | Abonne le locataire (voir [Offres et abonnements](help:plans-subscriptions#subscribe))                                                                       |
