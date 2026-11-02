---
title: Bases de l’API pour les développeurs
summary: Comment appeler l’API HTTP d’Axentra depuis ton propre code - URL de base, authentification, erreurs, ID de requête, pagination, concurrence, limitation de débit, SDK et gestion des versions.
keywords: API, REST, HTTP, développeur, intégration, URL de base, clé d’API, jeton Bearer, session, CSRF, erreur, problem details, RFC 9457, ID de requête, request id, pagination, curseur, If-Match, ETag, 412, 429, limitation de débit, rate limit, Retry-After, idempotence, SDK, Python, TypeScript, OpenAPI, version
---

Tout ce que fait le Studio passe par l’API HTTP publique d’Axentra, et tes propres services
peuvent faire de même. Cet article explique les règles qui s’appliquent à chaque point de
terminaison. Le contrat complet et lisible par machine est le document OpenAPI du serveur
(`openapi/axentra-v1.json` dans le dépôt du backend ; sur un serveur en service, `/v1/openapi.json`
et la référence interactive sous `/v1/docs`, si l’opérateur les a activés, voir
[Référence de l’API](#api-reference)).

> [!IMPORTANT]
> Pour appeler l’API depuis un programme, tu as besoin d’une clé d’API pour ton produit. Crées-en
> une sous **Accès et clés d’API** › **Clés d’API** ([ouvrir](app:apiKeys)) ; voir
> [Clés d’API](help:api-keys).

## URL de base et format {#base-url}

- Tous les points de terminaison se trouvent sous `/v1` à l’adresse publique du serveur, par
  exemple `https://api.example.com/v1/...`. Demande l’adresse à ton opérateur (c’est `public_url`
  sur la page [Paramètres](help:settings#settings-tree)).
- Le produit et le locataire font partie du chemin :
  `/v1/products/{product_id}/tenants/{tenant_id}/...`. Les ID sont des chaînes opaques avec un
  préfixe (`prd_`, `ten_`, `usr_`, `key_`, `rec_`, ...) ; ne les analyse pas.
- Les requêtes et les réponses sont en JSON (`application/json`, UTF-8) avec des champs en
  `snake_case`. Les horodatages suivent la RFC 3339 en UTC, par exemple `2026-11-02T09:30:00Z`.
- Les clients doivent ignorer les champs de réponse qu’ils ne connaissent pas : de nouveaux champs
  peuvent apparaître dans n’importe quelle version mineure.

```http
GET /v1/products/prd_01EXAMPLE/tenants?limit=20 HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01EXAMPLE_secretEXAMPLE
Accept: application/json
```

## S’authentifier {#authentication}

| Appelant                                                               | Comment                                                                                                 | CSRF                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Un service, un script ou une tâche                                     | Clé d’API : `Authorization: Bearer axk_<id>_<secret>` (l’en-tête `X-API-Key: axk_...` fonctionne aussi) | Inutile                                       |
| Une application navigateur sur une origine autorisée (comme le Studio) | Cookie de session issu de la connexion, envoyé par le navigateur                                        | Obligatoire pour les requêtes de modification |
| Une CLI ou un outil agissant pour un utilisateur                       | Le jeton de session sous la forme `Authorization: Bearer <token>`                                       | Inutile                                       |

### Clés d’API {#api-keys}

Une clé d’API appartient à un produit, éventuellement à un locataire, et possède une liste
explicite d’autorisations. Elle n’est affichée qu’une seule fois, lors de sa création ou de son
renouvellement. Conserve-la dans un coffre à secrets, jamais dans un navigateur ni dans un dépôt.
Les requêtes effectuées avec une clé sont enregistrées avec le **Type d’auteur** `api_key` dans le
[journal d’audit](help:audit#event-detail). Détails : [Clés d’API](help:api-keys).

### Sessions de navigateur et CSRF {#csrf}

La connexion (`POST /v1/auth/login/password` ou authentification unique) définit un cookie de
session `HttpOnly`. Lorsqu’une requête est authentifiée par ce cookie et modifie quelque chose
(`POST`, `PUT`, `PATCH`, `DELETE`), elle doit aussi envoyer :

- `X-Axentra-CSRF: <csrf_token>`, où le jeton provient de `GET /v1/auth/session` (ou de la réponse
  de connexion) ; garde-le uniquement en mémoire ;
- un en-tête `Origin` égal à la `public_url` du serveur ou listé dans `security.allowed_origins`.

Sinon, le serveur répond `403` (`missing or invalid CSRF token` ou `cross-origin request refused`).
Les requêtes authentifiées par un jeton Bearer n’ont pas besoin de jeton CSRF, car les navigateurs
ne les envoient jamais automatiquement.

### 401, 403 et 404 {#auth-errors}

- `401 unauthenticated` : identifiants absents ou invalides (clé erronée, clé révoquée, session
  expirée).
- `403 forbidden` : tu es authentifié, mais il te manque l’autorisation.
- `404 not_found` : également pour les ressources **hors de ta portée**, par exemple le locataire
  d’un autre produit. Le serveur ne révèle jamais l’existence de quelque chose que tu n’as pas le
  droit de voir.

## Erreurs {#errors}

Chaque erreur est un document de problème RFC 9457 avec `Content-Type: application/problem+json`
([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)) :

```json
{
  "type": "https://axentra.dev/problems/validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "The request is invalid.",
  "request_id": "req_01EXAMPLE",
  "errors": [{ "loc": ["body", "slug"], "msg": "String should have at least 2 characters" }]
}
```

Utilise `code` dans ton programme ; il est stable. `title` et `detail` sont destinés aux humains et
peuvent changer.

| Statut | `code`                                   | Signification                                                                           |
| ------ | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| 400    | `bad_request`                            | Requête mal formée                                                                      |
| 401    | `unauthenticated`                        | Connecte-toi ou envoie une clé valide                                                   |
| 403    | `forbidden`, `reauthentication_required` | Autorisation manquante ; ou l’action nécessite une connexion récente                    |
| 404    | `not_found`, `module_disabled`           | Absent, pas à toi, ou le module est désactivé                                           |
| 409    | `conflict`, `mode_not_supported`         | Conflit avec des données existantes ; ou impossible en mode mono-produit                |
| 412    | `precondition_failed`                    | La version `If-Match` est périmée (voir [Concurrence](#concurrency))                    |
| 413    | `payload_too_large`                      | Corps plus grand que `max_body_bytes` (ou fichier plus grand que la limite de stockage) |
| 415    | `unsupported_media_type`                 | Type de contenu non accepté                                                             |
| 422    | `validation_failed`                      | Saisie invalide ; `errors` liste chaque champ (`loc`) et le motif (`msg`)               |
| 429    | `rate_limited`, `quota_exceeded`         | Trop de requêtes, ou un quota d’utilisation est épuisé                                  |
| 500    | `internal`                               | Erreur serveur ; signale l’ID de requête                                                |

Les détails d’un problème ne contiennent jamais de secrets, de jetons, de SQL ni de traces de pile.

## ID de requête {#request-ids}

Chaque réponse porte un en-tête `X-Request-ID`, et chaque document de problème son `request_id`.
Tu peux envoyer ton propre ID dans `X-Request-ID` (1 à 64 caractères parmi `A-Z a-z 0-9 . _ -`) ;
sinon, le serveur en crée un (`req_…`). Le même ID apparaît dans les journaux du serveur, dans les
traces et comme **ID de requête** dans les [événements d’audit](help:audit#request-id). Journalise-le
à chaque appel en échec et cite-le lorsque tu demandes de l’aide. Le Studio l’affiche sous
**Détails techniques** dans chaque message d’erreur.

## Paginer les listes {#pagination}

Les listes utilisent des curseurs :

```http
GET /v1/audit?limit=100 HTTP/1.1
```

```json
{ "items": [ ... ], "next_cursor": "eyJ..." }
```

- `limit` va de 1 à 200, par défaut 50.
- Lorsque `next_cursor` n’est pas `null`, demande la page suivante avec `?cursor=<next_cursor>` et
  les mêmes filtres. Lorsqu’il vaut `null`, tu as tout récupéré.
- Les curseurs sont opaques ; ne les construis pas et ne les modifie pas. Les filtres sont de
  simples paramètres de requête documentés pour chaque point de terminaison.

## Éviter les mises à jour perdues {#concurrency}

Les ressources qui ont un numéro de `version` (par exemple les produits, les locataires, les
enregistrements, les compteurs d’utilisation, les modèles de notification) prennent en charge la
concurrence optimiste :

1. Lis la ressource et note sa `version` (les réponses des enregistrements et des compteurs
   l’envoient aussi comme `ETag`, par exemple `"3"`).
2. Envoie la modification avec `If-Match: 3`.
3. Si quelqu’un l’a modifiée entre-temps, le serveur répond `412 precondition_failed`. Relis-la,
   applique à nouveau ta modification et réessaie.

Sans `If-Match`, la dernière écriture l’emporte. `If-Match` doit être le numéro de version ; toute
autre valeur donne `422`.

## Réessayer sans risque : clés d’idempotence {#idempotency}

Les points de terminaison qui créent quelque chose avec des effets de bord acceptent un en-tête
`Idempotency-Key` (200 caractères au maximum), par exemple l’enregistrement de l’utilisation, la
mise en file d’attente de tâches, la publication d’événements et l’envoi de notifications. Répéter
une requête avec la même clé renvoie le résultat d’origine au lieu d’effectuer le travail deux
fois. Utilise ta propre clé métier (un ID de commande, un ID de message) et réutilise-la à chaque
nouvelle tentative. Pour l’enregistrement de l’utilisation, la clé est obligatoire.

## Limitation de débit {#rate-limits}

Si l’opérateur a activé la limitation de débit (`limits.rate_limit_per_minute`,
`rate_limit_ip_per_minute`, voir [Paramètres](help:settings#settings-tree)), un client qui envoie
trop de requêtes reçoit `429 rate_limited` avec un en-tête `Retry-After` en secondes. Attends ce
délai et réessaie. Les limites sont comptées par identifiant (clé d’API ou session) et par adresse
IP du client, et par processus serveur. Les contrôles d’état et `/metrics` ne sont jamais limités.
Les tentatives de connexion ont leur propre limite (`login_rate_per_minute`).

`429 quota_exceeded` est différent : un quota d’utilisation du locataire ou de l’offre est épuisé
(voir [Utilisation](help:usage)). Attendre quelques secondes n’y change rien.

## Utiliser un SDK {#sdks}

Le dépôt du backend contient deux clients officiels, tous deux en version alpha et pas encore
publiés dans un registre de paquets. Tous deux envoient les bons en-têtes, transforment les
documents de problème en exceptions avec `status`, `code`, `request_id` et `retry_after`, gèrent la
pagination pour toi et vérifient la version du serveur. Aucun ne réessaie automatiquement :
réessaie toi-même, avec une clé d’idempotence.

### Python {#sdk-python}

Paquet `axentra-client` dans `sdk/python` (Python 3.11+, clients synchrone et asynchrone).
Installe-le depuis une copie locale du dépôt avec `pip install ./sdk/python`.

```python
from axentra_client import AxentraClient, AxentraApiError

with AxentraClient("https://api.example.com", api_key="axk_01EXAMPLE_secretEXAMPLE") as ax:
    ax.check_compatibility()
    pid = "prd_01EXAMPLE"
    for tenant in ax.tenants.iter(pid, page_size=100):
        print(tenant.slug)
    try:
        ax.tenants.create(pid, slug="acme", name="Acme")
    except AxentraApiError as e:
        print(e.status, e.code, e.request_id)
```

### TypeScript {#sdk-typescript}

Paquet `@axentra/sdk` dans `sdk/typescript` (ESM, Node 20+ ou un navigateur récent). Ses types
sont générés à partir du contrat OpenAPI : chaque chemin, paramètre et corps est donc typé.

```ts
import { AxentraApiError, createAxentraClient } from '@axentra/sdk';

const ax = createAxentraClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.AXENTRA_KEY,
});
await ax.checkCompatibility();

const product_id = 'prd_01EXAMPLE';
for await (const t of ax.paginate((cursor) =>
  ax.GET('/v1/products/{product_id}/tenants', {
    params: { path: { product_id }, query: { cursor, limit: 100 } },
  }),
)) {
  console.log(t.slug);
}
```

Dans un navigateur sans clé, le client TypeScript utilise le cookie de session et gère lui-même le
jeton CSRF. Le dépôt du backend documente les deux clients dans `docs/sdk/PYTHON.md` et
`docs/sdk/TYPESCRIPT.md`.

## Versions et compatibilité {#versioning}

- La version dans le chemin, `/v1`, ne change qu’en cas de rupture de compatibilité. Une nouvelle
  `/v2` serait servie à côté de `/v1` pendant au moins une version mineure.
- La version **mineure** de l’API augmente avec les ajouts (nouveaux points de terminaison,
  nouveaux champs facultatifs, nouvelles valeurs). `GET /v1/meta` la renvoie sous la forme
  `api_version: {"major": 1, "minor": 0}`, et chaque réponse porte `Axentra-API-Version: 1.0`.
- Appelle `GET /v1/meta` au démarrage et refuse de fonctionner si la version majeure diffère ou si
  la version mineure du serveur est inférieure à celle dont tu as besoin. Une version mineure plus
  récente ne pose pas de problème. Les deux SDK le font dans `check_compatibility()` /
  `checkCompatibility()`, et le Studio fait de même (voir
  [Vérification de compatibilité](help:server-configuration#compatibility)).
- Tu peux envoyer `Axentra-Client: <name>/<version>; api=<major.minor>` pour que les journaux du
  serveur indiquent quel client a appelé.

## Référence de l’API {#api-reference}

Le serveur peut servir son document OpenAPI sous `/v1/openapi.json` et une référence interactive
sous `/v1/docs`. L’opérateur contrôle cela avec `security.api_docs` (affiché comme
`limits.api_docs` dans [Paramètres](help:settings#settings-tree)) : `public`, `authenticated`
(nécessite une session ou une clé d’API) ou `disabled` (par défaut en production). Le fichier
`openapi/axentra-v1.json` versionné dans le dépôt du backend décrit toujours le contrat actuel.

## Dépannage {#troubleshooting}

- **`401 unauthenticated` avec une clé d’API** : la clé est erronée, révoquée ou expirée, ou elle a été renouvelée et son délai de grâce est écoulé.
  Vérifie le statut de la clé sous **Clés d’API** et envoie-la sous la forme `Authorization: Bearer axk_...`.
- **`403 forbidden` avec « missing or invalid CSRF token »** : une requête de navigateur
  authentifiée par cookie sans `X-Axentra-CSRF`, ou avec un jeton périmé. Relis
  `GET /v1/auth/session`.
- **`403` avec « cross-origin request refused »** : l’origine de ton application ne figure pas dans
  `security.allowed_origins`. Demande à l’opérateur de l’ajouter.
- **`404` alors que l’ID est correct** : la ressource appartient à un autre produit ou locataire
  que ta clé, ou le module est désactivé (`module_disabled`).
- **`412 precondition_failed`** : quelqu’un a modifié la ressource depuis que tu l’as lue. Relis-la
  et réessaie avec la nouvelle version.
- **`429 rate_limited`** : attends le nombre de secondes indiqué dans `Retry-After`, puis ralentis.
- **`413 payload_too_large`** : le corps dépasse `security.max_body_bytes` (par défaut 10 Mio).
  Téléverse les fichiers via les points de terminaison de fichiers, qui ont leur propre limite.
- **Ton client refuse la version du serveur** : le serveur est plus ancien que ce dont ton client a
  besoin, ou il a une autre version majeure. Utilise une version du client adaptée.
