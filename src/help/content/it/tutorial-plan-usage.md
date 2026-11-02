---
title: Piani e utilizzo dall'inizio alla fine
summary: Definisci un contatore e un piano con un limite di utilizzo, abbona un tenant, registra l'utilizzo tramite l'API e osserva la quota in Studio.
keywords: tutorial, guida passo passo, esempio, misurazione dell'utilizzo, metering, quota, limite del piano, diritto d'uso, abbonamento, chiave API, registrare utilizzo, 429, quota superata, quota_exceeded
---

In questo tutorial limiti le chiamate API di un cliente tramite il suo piano. Crei un contatore
`api_calls` e un piano gratuito **Starter** che consente 1.000 chiamate al mese e attiva una
funzionalità di esportazione, abboni il tenant `acme` a questo piano, registri l'utilizzo con una
chiave API e osservi in Studio come si riempie la quota. Alla fine provochi di proposito una
richiesta rifiutata. Richiede circa 15 minuti.

> [!IMPORTANT]
> Ti servono: i moduli `usage` e `billing` sul server; un ruolo di prodotto con `usage:manage`,
> `billing:manage` e il diritto di creare chiavi API (per esempio **Product owner** o
> **Product admin**); un tenant su cui lavorare (qui `acme`, vedi
> [Tenant](help:tenants)); e un terminale con `curl`. Tutti gli id, le chiavi e gli indirizzi
> seguenti sono esempi: usa i tuoi.

## Passo 1: creare il contatore {#step-meter}

1. Apri [Utilizzo](app:usage), scheda **Contatori**, e scegli **Nuovo contatore**.
2. Inserisci:

   | Campo                      | Valore                      |
   | -------------------------- | --------------------------- |
   | **Chiave**                 | `api_calls`                 |
   | **Nome**                   | Chiamate API                |
   | **Unità**                  | chiamate                    |
   | **Aggregazione**           | **Somma**                   |
   | **Periodo di azzeramento** | **Periodo di fatturazione** |
   | **Limite predefinito**     | `100`                       |
   | **Applicazione**           | **Limite rigido**           |

3. Scegli **Crea contatore**.

Il limite predefinito di 100 vale per i tenant senza un limite del piano, per esempio i tenant senza
abbonamento. **Periodo di fatturazione** fa seguire al contatore il ciclo di abbonamento di ogni
tenant. Dettagli: [Utilizzo e quote](help:usage#create-meter).

## Passo 2: creare un piano con diritti d'uso {#step-plan}

1. Apri [Piani](app:plans) e scegli **Nuovo piano**.
2. **Nome**: Starter, **Chiave**: `starter`, **Giorni di prova**: `0`, **Attivo** attivato.
3. Lascia vuoto **Prezzi**. Il piano è gratuito, quindi l'abbonamento parte subito con qualsiasi
   provider di pagamento.
4. In **Diritti d'uso**, scegli due volte **Aggiungi diritto d'uso**:
   - **Tipo** **Limite**, **Chiave del contatore** `api_calls`, **Limite** `1000`;
   - **Tipo** **Funzionalità**, **Nome della funzionalità** `export`, **Attivata** sì.
5. Scegli **Crea piano**.

Ora il piano contiene `limit.api_calls: 1000` e `feature.export: true`. Dettagli:
[Diritti d'uso](help:plans-subscriptions#entitlements).

> [!NOTE]
> Un piano a pagamento funziona allo stesso modo, ma l'abbonamento richiede un checkout presso il
> provider di pagamento (a meno che il server non usi il provider manuale). Vedi
> [Abbonare un tenant](help:plans-subscriptions#subscribe).

## Passo 3: abbonare il tenant {#step-subscribe}

1. Apri [Abbonamenti](app:subscriptions). In **Fatturazione di un tenant**, scegli `acme` e
   seleziona **Apri**.
2. In **Abbonamento**, scegli **Abbona a un piano**, poi **Starter (starter)**, e scegli
   **Abbona**.
3. L'abbonamento risulta **Attivo**. **Diritti d'uso effettivi** elenca `export: on` in
   **Funzionalità** e `api_calls` 1.000 in **Limiti**.

## Passo 4: creare una chiave API per registrare l'utilizzo {#step-api-key}

1. Apri [Chiavi API](app:apiKeys) e scegli **Nuova chiave API**.
2. **Nome**: `usage-demo`. In **Ambito tenant**, scegli `acme`, così la chiave può agire solo su
   questo tenant.
3. In **Autorizzazioni**, seleziona `usage:record` e `usage:read`.
4. Crea la chiave e copia il segreto. Viene mostrato una sola volta.

Salva nel terminale i valori che ti servono (valori di esempio):

```bash
export AX=https://axentra.example.com
export PID=prd_01EXAMPLE
export TID=ten_01EXAMPLE
export KEY=axk_EXAMPLE_secret
```

L'id del prodotto è mostrato nella pagina del prodotto, l'id del tenant nella pagina del tenant e
nella sua pagina di fatturazione. Vedi [Chiavi API](help:api-keys) e
[Nozioni di base sull'API](help:api-basics).

## Passo 5: registrare l'utilizzo {#step-record}

Registra una chiamata API. Ogni evento distinto ha bisogno di una propria `Idempotency-Key`; il tuo
prodotto userebbe l'id della sua richiesta.

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0001" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 1, "properties": {"endpoint": "/reports"}}'
```

La risposta (`201 Created`, abbreviata) contiene l'evento e la quota dopo l'evento:

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

Esegui di nuovo lo stesso comando: la risposta è `200` con `"replayed": true` e l'utilizzo viene
comunque contato una sola volta. È questo che rende sicuri i nuovi tentativi dopo un errore di rete.

Ora registra un blocco più grande con una nuova chiave:

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0002" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 950}'
```

`remaining` ora vale 49.

## Passo 6: osservare la quota in Studio {#step-watch}

1. Apri [Utilizzo](app:usage), scheda **Utilizzo per tenant**, e scegli `acme` (oppure seleziona
   **Utilizzo** nell'intestazione della pagina di fatturazione del tenant).
2. La scheda `api_calls` mostra 951 chiamate, una barra al 95 %, i badge **Dal piano** e **Limite
   rigido**, e **Rimanente** 49 chiamate.
3. **Eventi di utilizzo** elenca entrambi gli eventi con le loro chiavi di idempotenza e la
   proprietà `endpoint`.
4. **Utilizzo giornaliero** mostra la barra di oggi, e la scheda **Panoramica** mostra `acme` in
   **Totali per tenant**.

## Passo 7: superare il limite {#step-exceed}

Prova a registrare altre 50 chiamate (951 + 50 > 1.000):

```bash
curl -sS -i -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0003" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 50}'
```

Il server risponde `429` con un header `Retry-After` e un corpo problem come questo (abbreviato):

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

Non è stato registrato nulla. A questo punto il tuo prodotto rifiuterebbe la richiesta del cliente o
proporrebbe un upgrade.

## Passo 8: dare più margine al tenant {#step-override}

Supponi di accordarti per concedere ad `acme` 2.000 chiamate in questo periodo:

1. In **Utilizzo per tenant**, scegli **Imposta override** sulla scheda `api_calls`.
2. Inserisci **Limite** `2000`, mantieni **Limite rigido** e scegli **Salva override**.
3. Il badge diventa **Override del tenant**. Ripeti la richiesta del passo 7: viene accettata con
   `"source": "quota"`.

Scegli **Rimuovi override** per tornare al limite del piano. Per cambiare il limite per tutti i
tenant del piano, modifica invece il diritto d'uso del piano. Dettagli:
[Da dove viene il limite effettivo](help:usage#limit-source).

## Cosa ne fa il tuo prodotto {#in-your-product}

- Prima di un'azione che consuma una risorsa misurata, registra l'utilizzo. Interpreta
  `429 quota_exceeded` come “limite raggiunto” e mostra al cliente un messaggio chiaro.
- Leggi le funzionalità del tenant con
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements` e attiva l'esportazione
  solo quando `features.export` è `true`.
- Per i lavori che richiedono tempo, prenota prima e conferma dopo; vedi
  [Prenotazioni](help:usage#reservations).

## Fare pulizia {#clean-up}

- Revoca la chiave `usage-demo` in [Chiavi API](app:apiKeys).
- Annulla l'abbonamento nella pagina di fatturazione del tenant con **Annulla ora**, se non ti serve.
- Il contatore non può essere eliminato perché ha utilizzo registrato. Usa **Disattiva** se non ti
  serve più.
- Il piano non può essere eliminato perché è stato usato da un abbonamento. Usa **Disattiva**.

## Risoluzione dei problemi {#troubleshooting}

| Cosa vedi                                                   | Perché                                                                         | Cosa fare                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `401`                                                       | La chiave è errata, revocata o scaduta                                         | Controlla `$KEY`; crea una nuova chiave                                          |
| `403`                                                       | Alla chiave manca `usage:record`, oppure è legata a un altro tenant            | Controlla le autorizzazioni della chiave e l'**Ambito tenant**                   |
| `404`                                                       | Id del prodotto o del tenant errato, oppure la chiave del contatore non esiste | Confronta gli id con Studio; controlla la chiave del contatore                   |
| `409` “the meter is inactive”                               | Il contatore è stato disattivato                                               | **Attiva** il contatore in **Contatori**                                         |
| `409` per la chiave di idempotenza                          | La chiave è stata già usata con un altro corpo                                 | Usa una nuova `Idempotency-Key`                                                  |
| `422`                                                       | Manca `Idempotency-Key`, oppure la quantità non è valida                       | Invia l'header; usa una quantità maggiore o uguale a 0 con al massimo 6 decimali |
| La scheda mostra **Predefinito del contatore** e limite 100 | L'abbonamento non è attivo, oppure il piano non ha `limit.api_calls`           | Controlla il passo 2 e il passo 3                                                |
| `429` prima del previsto                                    | Contano anche le prenotazioni o altri eventi                                   | Controlla **Prenotato** ed **Eventi di utilizzo**                                |
