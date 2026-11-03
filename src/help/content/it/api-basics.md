---
title: Nozioni di base sull'API per sviluppatori
summary: Come chiamare l'API HTTP di Axentra dal tuo codice - URL di base, autenticazione, errori, ID richiesta, paginazione, concorrenza, limiti di frequenza, SDK e versioni.
keywords: API, REST, HTTP, sviluppatore, integrazione, URL di base, chiave API, bearer token, sessione, CSRF, errore, problem details, RFC 9457, request id, ID richiesta, paginazione, cursore, If-Match, ETag, 412, 429, limite di frequenza, rate limit, Retry-After, idempotenza, SDK, Python, TypeScript, OpenAPI, versione
---

Tutto ciò che fa Studio passa dall'API HTTP pubblica di Axentra, e i tuoi servizi possono fare lo
stesso. Questo articolo spiega le regole che valgono per ogni endpoint. Il contratto completo e
leggibile dalle macchine è il documento OpenAPI del server (`openapi/axentra-v1.json` nel
repository del backend; su un server in esecuzione `/v1/openapi.json` e il riferimento interattivo
in `/v1/docs`, se l'operatore li ha abilitati, vedi [Riferimento dell'API](#api-reference)).

> [!IMPORTANT]
> Per chiamare l'API da un programma ti serve una chiave API per il tuo prodotto. Creane una in
> **Accesso e chiavi API** › **Chiavi API** ([apri](app:apiKeys)); vedi [Chiavi API](help:api-keys).

## URL di base e formato {#base-url}

- Tutti gli endpoint si trovano sotto `/v1` all'indirizzo pubblico del server, per esempio
  `https://api.example.com/v1/...`. Chiedi l'indirizzo al tuo operatore (è `public_url` nella
  pagina [Impostazioni](help:settings#settings-tree)).
- Prodotto e tenant fanno parte del percorso:
  `/v1/products/{product_id}/tenants/{tenant_id}/...`. Gli ID sono stringhe opache con un prefisso
  (`prd_`, `ten_`, `usr_`, `key_`, `rec_`, ...); non analizzarli.
- Richieste e risposte sono in JSON (`application/json`, UTF-8) con campi in `snake_case`. I
  timestamp sono in formato RFC 3339 in UTC, per esempio `2026-11-02T09:30:00Z`.
- I client devono ignorare i campi della risposta che non conoscono: nuovi campi possono comparire
  in qualsiasi versione minor.

```http
GET /v1/products/prd_01EXAMPLE/tenants?limit=20 HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01EXAMPLE_secretEXAMPLE
Accept: application/json
```

## Autenticarsi {#authentication}

| Chiamante                                                 | Come                                                                                                 | CSRF                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Un servizio, uno script o un job                          | Chiave API: `Authorization: Bearer axk_<id>_<secret>` (funziona anche l'header `X-API-Key: axk_...`) | Non necessario                            |
| Un'app nel browser su un'origine consentita (come Studio) | Cookie di sessione dell'accesso, inviato dal browser                                                 | Obbligatorio per le richieste di modifica |
| Una CLI o uno strumento che agisce come utente            | Il token di sessione come `Authorization: Bearer <token>`                                            | Non necessario                            |

### Chiavi API {#api-keys}

Una chiave API appartiene a un prodotto, facoltativamente a un tenant, e ha un elenco esplicito di
autorizzazioni. Viene mostrata una sola volta, quando viene creata o ruotata. Conservala in un
archivio di segreti, mai in un browser o in un repository. Le richieste con una chiave vengono
registrate con **Tipo di autore** `api_key` nel [registro di audit](help:audit#event-detail).
Dettagli: [Chiavi API](help:api-keys).

### Sessioni del browser e CSRF {#csrf}

L'accesso (`POST /v1/auth/login/password` o single sign-on) imposta un cookie di sessione
`HttpOnly`. Quando una richiesta è autenticata da quel cookie e modifica qualcosa (`POST`, `PUT`,
`PATCH`, `DELETE`), deve inviare anche:

- `X-Axentra-CSRF: <csrf_token>`, dove il token proviene da `GET /v1/auth/session` (o dalla
  risposta dell'accesso); tienilo solo in memoria;
- un `Origin` che sia il `public_url` del server o sia elencato in `security.allowed_origins`.

Altrimenti il server risponde `403` (`missing or invalid CSRF token` o
`cross-origin request refused`). Le richieste autenticate con un bearer token non hanno bisogno di
un token CSRF, perché i browser non le inviano mai automaticamente.

### 401, 403 e 404 {#auth-errors}

- `401 unauthenticated`: credenziali assenti o non valide (chiave errata, chiave revocata, sessione
  scaduta).
- `403 forbidden`: sei autenticato ma ti manca l'autorizzazione.
- `404 not_found`: anche per le risorse **al di fuori del tuo ambito**, per esempio il tenant di un
  altro prodotto. Il server non rivela mai se esiste qualcosa che non puoi vedere.

## Errori {#errors}

Ogni errore è un documento problem secondo RFC 9457 con `Content-Type: application/problem+json`
([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "type": "urn:axentra:problem:validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "The request is invalid.",
  "request_id": "req_01EXAMPLE",
  "errors": [{ "loc": ["body", "slug"], "msg": "String should have at least 2 characters" }]
}
```

`type` è un URN (`urn:axentra:problem:<code>`), non un indirizzo web.
Nel tuo programma usa `code`; è stabile. `title` e `detail` sono pensati per le persone e possono
cambiare.

| Stato | `code`                                   | Significato                                                                          |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| 400   | `bad_request`                            | Richiesta malformata                                                                 |
| 401   | `unauthenticated`                        | Accedi o invia una chiave valida                                                     |
| 403   | `forbidden`, `reauthentication_required` | Autorizzazione mancante; oppure l'azione richiede un accesso recente                 |
| 404   | `not_found`, `module_disabled`           | Non esiste, non è tuo, oppure il modulo è disattivato                                |
| 409   | `conflict`, `mode_not_supported`         | In conflitto con dati esistenti; oppure non possibile in modalità a prodotto singolo |
| 412   | `precondition_failed`                    | La versione in `If-Match` è superata (vedi [Concorrenza](#concurrency))              |
| 413   | `payload_too_large`                      | Corpo più grande di `max_body_bytes` (o file più grande del limite di archiviazione) |
| 415   | `unsupported_media_type`                 | Tipo di contenuto non accettato                                                      |
| 422   | `validation_failed`                      | Input non valido; `errors` elenca ogni campo (`loc`) e il motivo (`msg`)             |
| 429   | `rate_limited`, `quota_exceeded`         | Troppe richieste, oppure una quota di utilizzo è esaurita                            |
| 500   | `internal`                               | Errore del server; segnala l'ID richiesta                                            |

I problem details non contengono mai segreti, token, SQL o stack trace.

## ID richiesta {#request-ids}

Ogni risposta contiene un header `X-Request-ID`, e ogni documento problem il suo `request_id`. Puoi
inviare un tuo ID in `X-Request-ID` (1-64 caratteri tra `A-Z a-z 0-9 . _ -`); altrimenti il server
ne crea uno (`req_…`). Lo stesso ID compare nei log del server, nelle tracce e come **ID richiesta**
negli [eventi di audit](help:audit#request-id). Registralo a ogni chiamata non riuscita e citalo
quando chiedi aiuto. Studio lo mostra in **Dettagli tecnici** in ogni messaggio di errore.

## Paginare gli elenchi {#pagination}

Gli elenchi usano cursori:

```http
GET /v1/audit?limit=100 HTTP/1.1
```

```json
{ "items": [ ... ], "next_cursor": "eyJ..." }
```

- `limit` va da 1 a 200, predefinito 50.
- Quando `next_cursor` non è `null`, richiedi la pagina successiva con `?cursor=<next_cursor>` e gli
  stessi filtri. Quando è `null`, hai ottenuto tutto.
- I cursori sono opachi; non costruirli né modificarli. I filtri sono normali parametri di query
  documentati per ogni endpoint.

## Evitare aggiornamenti persi {#concurrency}

Le risorse che hanno un numero di `version` (per esempio prodotti, tenant, record, contatori di
utilizzo, modelli di notifica) supportano la concorrenza ottimistica:

1. Leggi la risorsa e annota la sua `version` (le risposte di record e contatori la inviano anche
   come `ETag`, per esempio `"3"`).
2. Invia la modifica con `If-Match: 3`.
3. Se nel frattempo qualcuno l'ha modificata, il server risponde `412 precondition_failed`.
   Rileggila, riapplica la modifica e riprova.

Senza `If-Match` vince l'ultima scrittura. `If-Match` deve essere il numero di versione; qualsiasi
altro valore produce `422`.

## Riprovare in sicurezza: chiavi di idempotenza {#idempotency}

Gli endpoint che creano qualcosa con effetti collaterali accettano un header `Idempotency-Key`
(fino a 200 caratteri), per esempio la registrazione dell'utilizzo, l'accodamento di job, la
pubblicazione di eventi e l'invio di notifiche. Ripetere una richiesta con la stessa chiave
restituisce il risultato originale invece di eseguire il lavoro due volte. Usa una tua chiave di
business (un ID ordine, un ID messaggio) e riutilizzala a ogni nuovo tentativo. Per la
registrazione dell'utilizzo la chiave è obbligatoria.

## Limiti di frequenza {#rate-limits}

Se l'operatore ha attivato i limiti di frequenza (`limits.rate_limit_per_minute`,
`rate_limit_ip_per_minute`, vedi [Impostazioni](help:settings#settings-tree)), un client che invia
troppe richieste riceve `429 rate_limited` con un header `Retry-After` in secondi. Attendi quel
tempo e riprova. I limiti si contano per credenziale (chiave API o sessione), per IP del client e
per processo del server. I controlli di stato e `/metrics` non sono mai limitati. I tentativi di
accesso hanno un limite proprio (`login_rate_per_minute`).

`429 quota_exceeded` è diverso: una quota di utilizzo del tenant o del piano è esaurita (vedi
[Utilizzo](help:usage)). Attendere qualche secondo non serve.

## Usare un SDK {#sdks}

Il repository del backend contiene due client ufficiali, entrambi in alpha e non ancora pubblicati
in un registro di pacchetti. Entrambi inviano gli header corretti, trasformano i documenti problem
in eccezioni con `status`, `code`, `request_id` e `retry_after`, gestiscono la paginazione per te e
verificano la versione del server. Nessuno dei due riprova automaticamente: riprova tu, con una
chiave di idempotenza.

### Python {#sdk-python}

Pacchetto `axentra-client` in `sdk/python` (Python 3.11+, client sincroni e asincroni). Installalo
da un checkout con `pip install ./sdk/python`.

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

Pacchetto `@axentra/sdk` in `sdk/typescript` (ESM, Node 20+ o un browser moderno). I suoi tipi
sono generati dal contratto OpenAPI, quindi ogni percorso, parametro e corpo è tipizzato.

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

In un browser senza chiave, il client TypeScript usa il cookie di sessione e gestisce da solo il
token CSRF. Il repository del backend documenta entrambi i client in `docs/sdk/PYTHON.md` e
`docs/sdk/TYPESCRIPT.md`.

## Versioni e compatibilità {#versioning}

- La versione nel percorso `/v1` cambia solo per modifiche incompatibili. Un nuovo `/v2` verrebbe
  servito accanto a `/v1` per almeno una release minor.
- La versione **minor** dell'API cresce con le modifiche additive (nuovi endpoint, nuovi campi
  facoltativi, nuovi valori). `GET /v1/meta` la restituisce come
  `api_version: {"major": 1, "minor": 0}`, e ogni risposta contiene `Axentra-API-Version: 1.0`.
- Chiama `GET /v1/meta` all'avvio e rifiuta di funzionare quando la major è diversa o la minor del
  server è inferiore a quella che ti serve. Una minor più recente va bene. Entrambi gli SDK lo fanno
  in `check_compatibility()` / `checkCompatibility()`, e Studio fa lo stesso (vedi
  [Verifica di compatibilità](help:server-configuration#compatibility)).
- Facoltativamente invia `Axentra-Client: <name>/<version>; api=<major.minor>`, così i log del
  server mostrano quale client ha effettuato la chiamata.

## Riferimento dell'API {#api-reference}

Il server può servire il suo documento OpenAPI in `/v1/openapi.json` e un riferimento interattivo
in `/v1/docs`. L'operatore lo controlla con `security.api_docs` (mostrato come `limits.api_docs` in
[Impostazioni](help:settings#settings-tree)): `public`, `authenticated` (richiede una sessione o una
chiave API) o `disabled` (il valore predefinito in produzione). Il file `openapi/axentra-v1.json`
versionato nel repository del backend descrive sempre il contratto attuale.

## Risoluzione dei problemi {#troubleshooting}

- **`401 unauthenticated` con una chiave API**: la chiave è errata, revocata o scaduta, oppure è
  stata ruotata e il suo periodo di tolleranza è terminato. Controlla lo stato della chiave in
  **Chiavi API** e inviala come `Authorization: Bearer axk_...`.
- **`403 forbidden` con “missing or invalid CSRF token”**: una richiesta del browser autenticata
  tramite cookie senza `X-Axentra-CSRF`, o con un token non più valido. Rileggi
  `GET /v1/auth/session`.
- **`403` con “cross-origin request refused”**: l'origine della tua app non è in
  `security.allowed_origins`. Chiedi all'operatore di aggiungerla.
- **`404` anche se l'ID è corretto**: la risorsa appartiene a un prodotto o a un tenant diverso da
  quello della tua chiave, oppure il modulo è disattivato (`module_disabled`).
- **`412 precondition_failed`**: qualcuno ha modificato la risorsa dopo che l'hai letta. Rileggila e
  riprova con la nuova versione.
- **`429 rate_limited`**: attendi il numero di secondi indicato in `Retry-After`, poi rallenta.
- **`413 payload_too_large`**: il corpo supera `security.max_body_bytes` (predefinito 10 MiB). Carica
  i file tramite gli endpoint dei file, che hanno un limite proprio.
- **Il tuo client rifiuta la versione del server**: il server è più vecchio di quanto richieda il
  tuo client, oppure ha un'altra versione major. Usa una release del client compatibile.
