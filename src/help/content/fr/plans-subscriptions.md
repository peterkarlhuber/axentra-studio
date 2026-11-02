---
title: Offres et abonnements
summary: Créer des offres avec prix et droits, abonner des locataires, gérer leurs abonnements et comprendre le prestataire de paiement.
keywords: facturation, offre, forfait, tarif, prix, niveau, abonnement, droit, fonctionnalité, feature flag, limite, essai, résilier, résiliation, en retard de paiement, Stripe, paiement, checkout, prestataire de paiement, facturation manuelle
---

Une **offre** décrit ce qu’obtient un locataire : ses prix, une durée d’essai et ses **droits**
(fonctionnalités activées ou non, et limites d’utilisation par compteur). Un **abonnement** relie un
locataire à une offre et possède un statut, comme **Essai**, **Actif** ou **En retard de
paiement**. Ton produit demande à Axentra les droits effectifs d’un locataire pour décider de ce
qu’il peut faire ; le module d’utilisation en tire ses quotas par défaut. Les opérateurs du produit
utilisent ces écrans pour configurer les offres et accompagner les clients dans leurs abonnements.

> [!IMPORTANT]
> Ces écrans nécessitent le module `billing` sur le serveur ; sans lui, **Offres** et
> **Abonnements** ne sont pas affichés. **Offres** et **Abonnements** nécessitent `billing:read` via
> un rôle de produit ; la page de facturation d’un locataire nécessite `billing:read` dans ce
> locataire. Toute modification nécessite `billing:manage`. Voir
> [Rôles et autorisations](help:roles-permissions).

> [!CAUTION]
> Le Studio ne demande jamais de coordonnées bancaires ni de données de carte, et Axentra n’en
> stocke aucune. Les données de paiement sont saisies uniquement sur la page de paiement hébergée
> par le prestataire de paiement. Les factures, taxes, reçus et remboursements sont gérés par le
> prestataire et l’opérateur, pas par Axentra.

## Créer une offre {#create-plan}

1. Ouvre [Offres](app:plans) (groupe **Utilisation et facturation**) et choisis **Nouvelle offre**.
2. Saisis un **Nom** et une **Clé**, par exemple `pro`. La clé ne peut plus être modifiée
   ensuite ; ton produit et l’API désignent l’offre par cette clé.
3. Facultatif : **Description** et **Jours d’essai** (0 à 365). Les nouveaux abonnements à une
   offre avec des jours d’essai commencent au statut **Essai**.
4. Laisse **Active** activé pour que l’offre puisse être choisie pour de nouveaux abonnements.
5. Sous **Prix**, choisis **Ajouter un prix** pour chaque prix (voir
   [Prix](help:plans-subscriptions#prices)). Sans prix, l’offre est gratuite.
6. Sous **Droits**, ajoute des fonctionnalités et des limites (voir
   [Droits](help:plans-subscriptions#entitlements)).
7. Choisis **Créer l’offre**.

### Paramètres d’une offre {#plan-settings}

| Paramètre         | Effet                                                                                                   | Valeurs autorisées / par défaut                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Nom**           | Nom d’affichage                                                                                         | 1 à 200 caractères ; obligatoire                                                                               |
| **Clé**           | Identifiant de l’offre                                                                                  | Lettres minuscules, chiffres, `_` et `-`, commençant par une lettre, 63 caractères au maximum ; non modifiable |
| **Description**   | Texte libre                                                                                             | 2000 caractères au maximum                                                                                     |
| **Jours d’essai** | Durée de l’essai des nouveaux abonnements                                                               | 0 à 365 ; par défaut 0 (pas d’essai)                                                                           |
| **Active**        | Seules les offres actives peuvent être choisies pour de nouveaux abonnements et des changements d’offre | Activé par défaut                                                                                              |
| **Prix**          | Montant, devise, périodicité et ID de prix chez le prestataire                                          | 20 au maximum par offre                                                                                        |
| **Droits**        | Fonctionnalités et limites                                                                              | 200 entrées au maximum                                                                                         |

### Prix {#prices}

Chaque prix a un **Montant**, une **Devise**, une **Périodicité** et un **ID de prix chez le
prestataire** facultatif.

- Saisis le montant en unités monétaires normales, par exemple `19.90`. Axentra le stocke sous
  forme d’entier en unités mineures (centimes) ; le Studio affiche la valeur stockée sous le champ
  (« Stocké sous la forme 1990 unités mineures »). Les devises sans unités mineures (comme le JPY)
  acceptent des nombres entiers.
- **Devise** est un code ISO 4217 à trois lettres comme `EUR` ou `USD`.
- **Périodicité** : **mois** ou **an**. Elle détermine aussi la durée de la période de facturation
  de l’abonnement.
- **ID de prix chez le prestataire** : avec Stripe, l’identifiant du prix que tu as créé dans
  Stripe (lettres, chiffres et `_`, par exemple `price_1EXAMPLE`). Axentra s’en sert pour rattacher
  les mises à jour de Stripe à l’offre.

Une offre sans prix, ou uniquement avec des prix à zéro, est **Gratuite**. Une offre peut avoir
plusieurs prix (par exemple mensuel et annuel) ; tu en choisis alors un lorsque tu abonnes un
locataire. Les abonnements existants conservent une copie du prix avec lequel ils ont démarré : les
modifications de prix ultérieures ne les affectent donc pas.

### Droits {#entitlements}

Les droits sont une liste plate de clés. Dans l’éditeur, choisis le **Type** de chaque ligne :

| Type               | Stocké sous la forme                               | Valeur                                                   |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| **Fonctionnalité** | `feature.<name>`, par exemple `feature.sso`        | **Activée** ou non                                       |
| **Limite**         | `limit.<meter key>`, par exemple `limit.api_calls` | Un nombre supérieur ou égal à 0 ; vide signifie illimité |

Les noms utilisent des lettres minuscules, des chiffres, `_` et `.`, et commencent par une lettre.
Une **Limite** définit le quota du compteur d’utilisation portant cette clé, par période de
réinitialisation ; lorsque le module `usage` est lisible, le Studio propose les clés de compteurs
existantes. Une limite pour une clé sans compteur n’a aucun effet. Les limites d’offre utilisent
l’application du compteur (stricte ou souple). Voir [Utilisation et quotas](help:usage#limit-source).

La signification d’une fonctionnalité comme `feature.sso` dépend de ton produit : Axentra se
contente de la stocker et de la renvoyer.

## Modifier, désactiver ou supprimer une offre {#edit-plan}

Dans le menu d’actions de la ligne (**Actions pour l’offre …**) :

- **Modifier** change tout sauf la clé. Les droits modifiés s’appliquent immédiatement à tous les
  locataires de l’offre. Les prix modifiés ne s’appliquent qu’aux nouveaux abonnements.
- **Désactiver** masque l’offre pour les nouveaux abonnements et les changements d’offre. Les
  abonnements existants continuent. **Activer** annule cette action.
- **Supprimer l’offre** supprime une offre qu’aucun abonnement n’utilise ; tu confirmes en
  saisissant la clé de l’offre. Les offres utilisées (y compris par des abonnements résiliés) ne
  peuvent pas être supprimées ; désactive-les à la place.

## Vue d’ensemble des abonnements {#subscriptions}

[Abonnements](app:subscriptions) liste les abonnements de tous les locataires, les plus récents
d’abord, avec **Locataire**, **Offre**, **Statut**, **Prix**, **Fin de période**, **Fin de
l’essai** et **Prestataire**. Filtre par **Statut** et par **Offre**. Sélectionne un locataire pour
ouvrir sa page de facturation.

Pour ouvrir un locataire qui n’a pas encore d’abonnement, choisis-le dans **Facturation d’un
locataire** et sélectionne **Ouvrir**.

### Statuts d’abonnement {#status}

| Statut                    | Signification                              | Droits appliqués |
| ------------------------- | ------------------------------------------ | ---------------- |
| **Incomplet**             | En attente du paiement chez le prestataire | Non              |
| **Essai**                 | Les jours d’essai sont en cours            | Oui              |
| **Actif**                 | Abonnement en cours                        | Oui              |
| **En retard de paiement** | Le paiement est en retard ; délai de grâce | Oui              |
| **Résilié**               | Terminé ; définitif                        | Non              |

Changements autorisés : Incomplet → Essai, Actif ou Résilié ; Essai → Actif, En retard de paiement
ou Résilié ; Actif → En retard de paiement ou Résilié ; En retard de paiement → Actif ou Résilié.
Un abonnement résilié ne peut pas être réactivé : abonne à nouveau le locataire.

## Abonner un locataire {#subscribe}

1. Ouvre la page de facturation du locataire (depuis **Abonnements** ou **Facturation d’un
   locataire**).
2. Dans **Abonnement**, choisis **Abonner à une offre**.
3. Choisis l’offre dans **Choisir une offre**, et le **Prix** si l’offre en a plusieurs.
4. Choisis **Abonner**.

Ce qui se passe dépend de l’offre et du prestataire de paiement :

- Les **offres gratuites**, ainsi que toute offre avec le prestataire **Manuel**, démarrent
  immédiatement au statut **Essai** (si l’offre a des jours d’essai) ou **Actif**.
- Les **offres payantes avec le prestataire de test ou Stripe** nécessitent un paiement. Le bouton
  s’intitule **Démarrer le paiement**. Le Studio crée une session de paiement et affiche **Ouvrir
  la page de paiement**, qui ouvre la page hébergée du prestataire dans un nouvel onglet.
  L’abonnement reste **Incomplet** jusqu’à ce que le prestataire confirme le paiement via son
  webhook.
- Lorsque les **Paiements réels** sont activés, le Studio ne lance pas de paiement avec de l’argent
  réel. Utilise le parcours de paiement de ton propre produit.

Un locataire a au plus un abonnement en cours (non résilié).

## Changer d’offre {#change-plan}

**Changer d’offre** fait passer le locataire à une autre offre active (ou à un autre prix de la
même offre). Il n’y a pas de prorata : Axentra ne calcule ni avoirs ni frais supplémentaires. Les
droits de la nouvelle offre s’appliquent immédiatement.

- Les abonnements Stripe se modifient dans Stripe (par exemple dans le portail client de Stripe) ;
  le webhook met ensuite Axentra à jour. Le Studio masque **Changer d’offre** pour ces abonnements.
- Un abonnement créé sans paiement (manuel) ne peut pas passer à une offre payante tant qu’un
  véritable prestataire est configuré ; résilie-le et abonne à nouveau le locataire avec un
  paiement.
- Les abonnements **Incomplet** ne peuvent pas changer d’offre ; termine ou relance le paiement.

## Résilier ou reprendre {#cancel}

- **Résilier en fin de période** : l’abonnement reste utilisable jusqu’à la fin de la période en
  cours, puis prend fin. **Reprendre** annule la résiliation programmée.
- **Résilier maintenant** : l’abonnement prend fin immédiatement et ses droits cessent. Tu
  confirmes en saisissant la clé de l’offre. Cette action est irréversible.

Pour les abonnements Stripe, Axentra transmet d’abord la résiliation à Stripe.

> [!IMPORTANT]
> Avec le prestataire **Manuel**, les essais se terminent, les périodes avancent et la
> « résiliation en fin de période » prend effet uniquement lorsque l’opérateur exécute la tâche de
> facturation planifiée (`advance_periods`, par exemple toutes les heures). Si les essais ne se
> terminent jamais, demande à ton opérateur de la planifier.

## Définir le statut (prestataire manuel) {#set-status}

Avec le prestataire **Manuel**, tu encaisses le paiement en dehors d’Axentra et tu en enregistres
le résultat. Choisis **Définir le statut**, puis le **Nouveau statut** : par exemple **En retard de
paiement** lorsqu’une facture est impayée, ou **Actif** lorsqu’elle est payée. Seules les
transitions autorisées sont proposées. Passer à **Actif** pendant un essai met fin à l’essai
immédiatement. Les abonnements des autres prestataires reçoivent leur statut via les webhooks du
prestataire.

## Droits effectifs et dérogations {#overrides}

**Droits effectifs** sur la page de facturation du locataire montre ce que le locataire obtient
actuellement : l’**Offre** (avec son statut), les **Fonctionnalités**, les **Limites** et les
**Dérogations**. Il s’agit des droits de l’offre tant que l’abonnement est au statut **Essai**,
**Actif** ou **En retard de paiement**, fusionnés avec les dérogations du locataire. Sans un tel
abonnement, le locataire n’obtient que ses dérogations (**Aucun abonnement ouvrant des droits**).

Pour accorder à un locataire autre chose que ce que prévoit son offre, choisis **Modifier les
dérogations**, ajoute ou modifie des lignes dans le même éditeur que pour les offres et choisis
**Enregistrer les dérogations**.

> [!WARNING]
> L’enregistrement remplace toutes les dérogations du locataire. Une ligne que tu retires de la
> liste est retirée du locataire. Les dérogations sont conservées lorsque l’offre change ou que
> l’abonnement prend fin.

Pour augmenter une seule limite d’utilisation, une dérogation de quota sur l’écran **Utilisation**
est souvent plus claire ; voir [Utilisation et quotas](help:usage#quota-override). **Utilisation**
dans l’en-tête de la page ouvre l’utilisation du locataire.

## Prestataire de paiement {#payment-provider}

La carte **Prestataire de paiement** dans **Offres** et **Abonnements** affiche la configuration
du serveur :

| Prestataire                   | Comportement                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manuel**                    | Le paiement est encaissé en dehors d’Axentra. Les abonnements sont créés directement ; un opérateur définit leur statut.                      |
| **Simulation de test (fake)** | Prestataire de test déterministe sans accès réseau ; les offres payantes passent par un paiement simulé. Refusé par le serveur en production. |
| **Stripe**                    | Les offres payantes passent par Stripe Checkout ; les webhooks Stripe mettent à jour les abonnements.                                         |

**Paiements réels** indique si les paiements avec de l’argent réel sont activés (Stripe
uniquement). **Paiement depuis le Studio** indique si le Studio peut lancer un paiement hébergé :
uniquement avec le prestataire de test, ou avec Stripe lorsque les paiements réels sont désactivés.

Le prestataire est choisi par l’opérateur dans la configuration du serveur (`billing.provider`) ;
il ne peut pas être modifié dans le Studio. La carte nécessite `platform:settings` ou
`product:manage` ; sinon, elle indique que la configuration ne t’est pas visible. Voir
[Paramètres](help:settings) et [Configuration du serveur](help:server-configuration).

## Pour les développeurs {#developers}

- Lis les droits effectifs d’un locataire avec
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements`
  (`billing:read`). La réponse contient `features` (nom → true/false), `limits` (clé de compteur →
  nombre, ou `null` pour illimité), `plan_key`, `subscription_status` et `overrides`.
- Les achats en libre-service des locataires passent par le backend de ton produit avec une clé
  d’API disposant de `billing:manage` ; il n’existe pas d’autorisation de locataire pour un
  paiement en libre-service.
- Les adresses de retour du paiement (`success_url`, `cancel_url`) doivent commencer par l’URL
  publique du serveur ou par l’une de ses origines autorisées. Le Studio utilise l’adresse de sa
  propre page.
- Les modifications d’abonnement sont auditées (`billing.subscription.*`) et, lorsque le module
  d’événements est activé, publiées sous forme d’événements du même nom, afin qu’un webhook puisse
  y réagir. Voir [Événements](help:events).
- Les webhooks Stripe sont vérifiés par signature et traités une seule fois par identifiant
  d’événement ; les événements obsolètes sont ignorés.

## Bon à savoir {#good-to-know}

- Pas de prorata, de coupons, de taxes, de factures, de quantités de sièges ni de prix basés sur
  l’utilisation.
- Pas de point de terminaison pour un portail client ; les changements d’offre Stripe se font dans
  Stripe.
- `past_due` conserve les droits ; c’est à ton produit de décider s’il restreint quelque chose.
- Voir [Limitations connues](help:limitations).

## Dépannage {#troubleshooting}

| Ce que tu vois                                                                   | Cause                                                                                     | Que faire                                                                                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Aucun accès à la facturation**                                                 | Ton rôle n’a pas `billing:read` (au niveau du produit pour **Offres** et **Abonnements**) | Demande un rôle adapté à un administrateur du produit                                                            |
| **Conflit** lors de la suppression d’une offre                                   | Des abonnements utilisent l’offre                                                         | Utilise **Désactiver** à la place                                                                                |
| **Conflit** « a plan with this key exists »                                      | Les clés d’offre sont uniques par produit                                                 | Choisis une autre clé                                                                                            |
| Une offre manque dans **Choisir une offre**                                      | Elle est inactive                                                                         | Active-la dans **Offres**                                                                                        |
| **Conflit** « paid plans need a checkout … »                                     | Abonnement à une offre payante avec le prestataire de test ou Stripe                      | Utilise **Démarrer le paiement**, ou le parcours de paiement du produit lorsque les paiements réels sont activés |
| « Cette offre payante nécessite un paiement, que le serveur ne propose pas ici » | Les paiements réels sont activés, ou le prestataire ne t’est pas connu                    | Utilise le parcours de paiement de ton produit                                                                   |
| **Conflit** « the tenant already has a subscription »                            | Un abonnement en cours existe                                                             | Utilise **Changer d’offre**, ou résilie d’abord                                                                  |
| **Indisponible dans ce mode** lors d’un changement d’offre                       | L’abonnement est géré par Stripe                                                          | Modifie-le dans Stripe                                                                                           |
| **Vérifie ta saisie** : « redirect URLs must start with an allowed origin »      | L’adresse du Studio n’est ni l’URL publique du serveur ni une origine autorisée           | Demande à l’opérateur d’ajouter l’origine du Studio à `security.allowed_origins`                                 |
| L’abonnement reste **Incomplet**                                                 | Le paiement n’a pas été finalisé, ou le webhook n’atteint pas le serveur                  | Rouvre le paiement ; demande à l’opérateur de vérifier le point de terminaison et le secret du webhook           |
| L’essai ne se termine pas (manuel)                                               | La tâche de facturation n’est pas planifiée                                               | Demande à l’opérateur de planifier `advance_periods`                                                             |
| **Modifié entre-temps**                                                          | Quelqu’un d’autre a modifié l’offre ou l’abonnement                                       | Recharge la page et recommence                                                                                   |
| Les limites ne s’appliquent plus après la résiliation                            | Les abonnements résiliés n’accordent aucun droit                                          | Comportement normal ; la valeur par défaut du compteur ou la dérogation de quota s’applique                      |
