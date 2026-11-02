---
title: Offres et utilisation de bout en bout
summary: Définir un compteur et une offre avec une limite d’utilisation, abonner un locataire, enregistrer l’utilisation via l’API et suivre le quota dans le Studio.
keywords: tutoriel, pas à pas, exemple, mesure de l’utilisation, metering, quota, limite d’offre, droit, abonnement, clé d’API, enregistrer l’utilisation, 429, quota dépassé, quota_exceeded
---

Dans ce tutoriel, tu limites les appels d’API d’un client par le biais de son offre. Tu crées un
compteur `api_calls`, une offre gratuite **Starter** qui autorise 1 000 appels par mois et active
une fonctionnalité d’export, tu y abonnes le locataire `acme`, tu enregistres l’utilisation avec une
clé d’API et tu regardes le quota se remplir dans le Studio. À la fin, tu provoques volontairement
une requête refusée. Compte environ 15 minutes.

> [!IMPORTANT]
> Il te faut : les modules `usage` et `billing` sur le serveur ; un rôle de produit avec
> `usage:manage`, `billing:manage` et le droit de créer des clés d’API (par exemple **Product
> owner** ou **Product admin**) ; un locataire avec lequel travailler (ici `acme`, voir
> [Locataires](help:tenants)) ; et un terminal avec `curl`. Tous les identifiants, clés et adresses
> ci-dessous sont des exemples : utilise les tiens.

## Étape 1 : créer le compteur {#step-meter}

1. Ouvre [Utilisation](app:usage), onglet **Compteurs**, et choisis **Nouveau compteur**.
2. Saisis :

   | Champ                           | Valeur                     |
   | ------------------------------- | -------------------------- |
   | **Clé**                         | `api_calls`                |
   | **Nom**                         | Appels d’API               |
   | **Unité**                       | appels                     |
   | **Agrégation**                  | **Somme**                  |
   | **Période de réinitialisation** | **Période de facturation** |
   | **Limite par défaut**           | `100`                      |
   | **Application**                 | **Limite stricte**         |

3. Choisis **Créer le compteur**.

La limite par défaut de 100 s’applique aux locataires sans limite d’offre, par exemple les
locataires sans abonnement. **Période de facturation** fait suivre au compteur le cycle
d’abonnement de chaque locataire. Détails : [Utilisation et quotas](help:usage#create-meter).

## Étape 2 : créer une offre avec des droits {#step-plan}

1. Ouvre [Offres](app:plans) et choisis **Nouvelle offre**.
2. **Nom** : Starter, **Clé** : `starter`, **Jours d’essai** : `0`, **Active** activé.
3. Laisse **Prix** vide. L’offre est gratuite : l’abonnement démarre donc immédiatement, quel que
   soit le prestataire de paiement.
4. Sous **Droits**, choisis deux fois **Ajouter un droit** :
   - **Type** **Limite**, **Clé du compteur** `api_calls`, **Limite** `1000` ;
   - **Type** **Fonctionnalité**, **Nom de la fonctionnalité** `export`, **Activée** activé.
5. Choisis **Créer l’offre**.

L’offre porte désormais `limit.api_calls: 1000` et `feature.export: true`. Détails :
[Droits](help:plans-subscriptions#entitlements).

> [!NOTE]
> Une offre payante fonctionne de la même façon, mais l’abonnement nécessite un paiement chez le
> prestataire de paiement (sauf si le serveur utilise le prestataire manuel). Voir
> [Abonner un locataire](help:plans-subscriptions#subscribe).

## Étape 3 : abonner le locataire {#step-subscribe}

1. Ouvre [Abonnements](app:subscriptions). Dans **Facturation d’un locataire**, choisis `acme` et
   sélectionne **Ouvrir**.
2. Dans **Abonnement**, choisis **Abonner à une offre**, puis **Starter (starter)**, et choisis
   **Abonner**.
3. L’abonnement affiche **Actif**. **Droits effectifs** liste `export: on` sous
   **Fonctionnalités** et `api_calls` 1 000 sous **Limites**.

## Étape 4 : créer une clé d’API pour enregistrer l’utilisation {#step-api-key}

1. Ouvre [Clés d’API](app:apiKeys) et choisis **Nouvelle clé d’API**.
2. **Nom** : `usage-demo`. Dans **Portée locataire**, choisis `acme`, pour que la clé ne puisse
   agir que sur ce locataire.
3. Sous **Autorisations**, sélectionne `usage:record` et `usage:read`.
4. Crée la clé et copie le secret. Il n’est affiché qu’une seule fois.

Enregistre les valeurs dont tu as besoin dans ton terminal (valeurs d’exemple) :

```bash
export AX=https://axentra.example.com
export PID=prd_01EXAMPLE
export TID=ten_01EXAMPLE
export KEY=axk_EXAMPLE_secret
```

L’identifiant du produit est affiché sur la page du produit, celui du locataire sur la page du
locataire et sur sa page de facturation. Voir [Clés d’API](help:api-keys) et
[Bases de l’API](help:api-basics).

## Étape 5 : enregistrer l’utilisation {#step-record}

Enregistre un appel d’API. Chaque événement distinct a besoin de sa propre `Idempotency-Key` ; ton
produit utiliserait son ID de requête.

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0001" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 1, "properties": {"endpoint": "/reports"}}'
```

La réponse (`201 Created`, abrégée) contient l’événement et le quota après celui-ci :

```json
{
  "event": {
    "id": "uev_01EXAMPLE",
    "meter": "api_calls",
    "quantity": 1,
    "idempotency_key": "demo-0001"
  },
  "replayed": false,
  "quota": {
    "meter": "api_calls",
    "used": 1,
    "reserved": 0,
    "limit": 1000,
    "remaining": 999,
    "enforcement": "hard",
    "source": "plan",
    "over_limit": false
  }
}
```

Exécute à nouveau la même commande : la réponse est `200` avec `"replayed": true`, et l’utilisation
ne compte toujours qu’une fois. C’est ce qui rend les nouvelles tentatives sûres après une erreur
réseau.

Enregistre maintenant un lot plus important avec une nouvelle clé :

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0002" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 950}'
```

`remaining` vaut désormais 49.

## Étape 6 : suivre le quota dans le Studio {#step-watch}

1. Ouvre [Utilisation](app:usage), onglet **Utilisation par locataire**, et choisis `acme` (ou
   sélectionne **Utilisation** dans l’en-tête de la page de facturation du locataire).
2. La carte `api_calls` affiche 951 appels, une barre à 95 %, les badges **Issue de l’offre** et
   **Limite stricte**, et **Restant** 49 appels.
3. **Événements d’utilisation** liste les deux événements avec leurs clés d’idempotence et la
   propriété `endpoint`.
4. **Utilisation quotidienne** affiche la barre du jour, et l’onglet **Vue d’ensemble** affiche
   `acme` dans **Totaux par locataire**.

## Étape 7 : dépasser la limite {#step-exceed}

Essaie d’enregistrer 50 appels de plus (951 + 50 > 1 000) :

```bash
curl -sS -i -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0003" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 50}'
```

Le serveur répond `429` avec un en-tête `Retry-After` et un corps de problème comme celui-ci
(abrégé) :

```json
{
  "code": "quota_exceeded",
  "status": 429,
  "detail": "the api_calls limit of this period would be exceeded",
  "meter": "api_calls",
  "limit": 1000,
  "used": 951,
  "reserved": 0,
  "requested": 50,
  "period_end": "2026-12-02T00:00:00+00:00"
}
```

Rien n’a été enregistré. Ton produit refuserait maintenant la requête du client ou lui proposerait
une offre supérieure.

## Étape 8 : donner plus de marge au locataire {#step-override}

Imaginons que tu acceptes d’accorder à `acme` 2 000 appels pour cette période :

1. Dans **Utilisation par locataire**, choisis **Définir une dérogation** sur la carte
   `api_calls`.
2. Saisis **Limite** `2000`, conserve **Limite stricte** et choisis **Enregistrer la
   dérogation**.
3. Le badge passe à **Dérogation du locataire**. Répète la requête de l’étape 7 : elle est acceptée
   avec `"source": "quota"`.

Choisis **Supprimer la dérogation** pour revenir à la limite de l’offre. Pour modifier la limite de
tous les locataires de l’offre, modifie plutôt le droit de l’offre. Détails :
[D’où vient la limite effective](help:usage#limit-source).

## Ce que ton produit en fait {#in-your-product}

- Avant une action qui consomme une ressource mesurée, enregistre l’utilisation. Traite
  `429 quota_exceeded` comme « limite atteinte » et affiche un message clair au client.
- Lis les fonctionnalités du locataire avec
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements` et n’active l’export que
  lorsque `features.export` vaut `true`.
- Pour un travail de longue durée, réserve d’abord et valide ensuite ; voir
  [Réservations](help:usage#reservations).

## Faire le ménage {#clean-up}

- Révoque la clé `usage-demo` dans [Clés d’API](app:apiKeys).
- Résilie l’abonnement sur la page de facturation du locataire avec **Résilier maintenant** si tu
  n’en as pas besoin.
- Le compteur ne peut pas être supprimé, car il a une utilisation enregistrée. Utilise
  **Désactiver** si tu n’en veux plus.
- L’offre ne peut pas être supprimée, car un abonnement l’a utilisée. Utilise **Désactiver**.

## Dépannage {#troubleshooting}

| Ce que tu vois                                                      | Cause                                                                              | Que faire                                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `401`                                                               | La clé est erronée, révoquée ou expirée                                            | Vérifie `$KEY` ; crée une nouvelle clé                                                      |
| `403`                                                               | La clé n’a pas `usage:record`, ou elle est liée à un autre locataire               | Vérifie les autorisations de la clé et sa **Portée locataire**                              |
| `404`                                                               | Mauvais identifiant de produit ou de locataire, ou la clé de compteur n’existe pas | Compare les identifiants avec le Studio ; vérifie la clé du compteur                        |
| `409` « le compteur est inactif »                                   | Le compteur a été désactivé                                                        | Choisis **Activer** dans **Compteurs**                                                      |
| `409` pour la clé d’idempotence                                     | La clé a déjà été utilisée avec un autre corps                                     | Utilise une nouvelle `Idempotency-Key`                                                      |
| `422`                                                               | `Idempotency-Key` manquante, ou quantité invalide                                  | Envoie l’en-tête ; utilise une quantité supérieure ou égale à 0 avec 6 décimales au maximum |
| La carte affiche **Valeur par défaut du compteur** et la limite 100 | L’abonnement n’est pas actif, ou l’offre n’a pas de `limit.api_calls`              | Vérifie les étapes 2 et 3                                                                   |
| `429` plus tôt que prévu                                            | Les réservations ou d’autres événements comptent aussi                             | Regarde **Réservé** et **Événements d’utilisation**                                         |
