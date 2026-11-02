---
title: Webhook
summary: Invia eventi ad altri sistemi come richieste HTTP firmate, gestisci il segreto di firma e controlla, riprova e consegna di nuovo le consegne.
keywords: webhook, endpoint, callback, HTTP POST, segreto di firma, firma, HMAC, whsec, ruotare segreto, consegna, consegnare di nuovo, nuovo tentativo, ping di test, ricevitore, integrazione
---

Un **webhook** consente a un altro sistema di venire a conoscenza degli [eventi](help:events) del
tuo prodotto senza doverli richiedere. Registri un **endpoint**, cioè un URL nell'altro sistema, e
scegli quali tipi di evento deve ricevere. Ogni volta che viene pubblicato un evento corrispondente,
Axentra invia a quell'URL una richiesta HTTP `POST` con l'evento in formato JSON. Ogni richiesta è
**firmata** con un segreto noto solo ad Axentra e al ricevitore, così il ricevitore può verificare
che la richiesta sia autentica. Ogni tentativo viene registrato come **consegna**, che puoi
esaminare e inviare di nuovo.

> [!IMPORTANT]
> I webhook richiedono il modulo del server `events`. Visualizzare endpoint e consegne richiede
> `webhooks:read` (proprietari, amministratori, supporto e visualizzatori del prodotto). Creare,
> modificare, provare, ruotare il segreto, consegnare di nuovo ed eliminare richiede
> `webhooks:manage` (proprietari e amministratori del prodotto); senza questa autorizzazione i
> pulsanti sono nascosti e **Impostazioni** è in sola lettura. Perché le consegne vengano inviate
> deve essere in esecuzione un processo worker.

## Come funziona la consegna {#how-it-works}

```diagram
webhook-delivery
```

1. Il tuo prodotto pubblica un evento, per esempio `invoice.created` nel tenant `acme`.
2. Un worker cerca gli endpoint **attivati** i cui **Tipi di evento** corrispondono al tipo e il cui
   **Filtro tenant** è vuoto o uguale al tenant dell'evento. Per ogni corrispondenza crea una
   consegna con lo stato **In attesa**.
3. Il worker invia la richiesta firmata. Una risposta `2xx` porta la consegna allo stato
   **Consegnata**.
4. Qualsiasi altra risposta, un timeout o un errore di connessione la portano allo stato **Non
   riuscita, nuovo tentativo**: viene inviata di nuovo dopo un'attesa crescente. Dopo l'ultimo
   tentativo diventa **Esaurita**.
5. Puoi usare **Consegna di nuovo** per una consegna che non è in attesa, per esempio dopo aver
   corretto il ricevitore.

Le consegne avvengono **almeno una volta**: un ricevitore può ricevere lo stesso evento due volte
(per esempio quando la sua risposta `200` è andata persa). I ricevitori dovrebbero ricordare l'id
dell'evento e ignorare i duplicati. Non esiste un ordine garantito tra gli eventi.

## Creare un endpoint {#create}

1. Apri [Webhook](app:webhooks) e scegli **Nuovo endpoint**.
2. Inserisci l'**URL** che deve ricevere le richieste.
3. Facoltativo: una **Descrizione** (fino a 1000 caratteri), per esempio chi è responsabile del
   ricevitore.
4. Aggiungi i **Tipi di evento**: digita un tipo o un pattern e premi Invio oppure scegli
   **Aggiungi tipo**. Studio suggerisce i tipi visti negli eventi recenti e **\* (tutti i tipi)**.
5. Facoltativo: scegli un **Filtro tenant** e disattiva **Attivato** se il ricevitore non è ancora
   pronto.
6. Scegli **Crea endpoint**.
7. Copia il **Segreto di firma** che compare, conservalo per il ricevitore, seleziona **Ho conservato
   il segreto in modo sicuro** e scegli **Fatto**. Vedi
   [Conservare il segreto di firma](help:webhooks#signing-secret).

Studio apre quindi la pagina dell'endpoint.

### Regole per gli URL {#url-rules}

Per evitare che i webhook vengano usati per raggiungere sistemi interni, il server verifica ogni URL
al salvataggio e di nuovo prima di ogni consegna:

- Deve iniziare con `https://`. Il semplice `http://` è accettato solo da server non di produzione i
  cui operatori hanno abilitato `events.webhook_allow_http`.
- Non deve contenere un nome utente o una password (`https://user:pass@…`) né un frammento (`#…`).
- `localhost` e i nomi host che terminano con `.local`, `.localhost` o `.internal` vengono
  rifiutati.
- Il nome host viene risolto, e **ogni** indirizzo a cui punta deve essere pubblico. Le reti private
  (come `10.x`, `192.168.x`), il loopback, gli indirizzi link-local e altri indirizzi speciali
  vengono rifiutati, a meno che gli operatori non impostino `events.webhook_allow_private_targets`
  (pensato per lo sviluppo e, in produzione, solo con un'ulteriore deroga).
- Al massimo 2000 caratteri.

I reindirizzamenti non vengono seguiti: una risposta `301` o `302` conta come errore. Usa l'URL
finale.

### Scegliere i tipi di evento {#event-types}

Ogni endpoint ha da 1 a 50 pattern di tipi di evento. Usa tipi esatti (`invoice.created`), pattern
con `*` (`invoice.*`, `*.deleted`) oppure `*` per tutti i tipi. I pattern usano lettere minuscole,
cifre, `_ . : -` e `*`. Gli eventi con tipi riservati (`axentra.…`) non vengono mai inviati agli
endpoint, tranne il ping di test.

### Filtro tenant {#tenant-filter}

Senza filtro tenant, l'endpoint riceve gli eventi corrispondenti di **tutti i tenant** e gli eventi
a livello di prodotto. Con un filtro, riceve solo gli eventi di quel tenant. Il filtro tenant non può
essere modificato in seguito; crea invece un nuovo endpoint.

## Conservare il segreto di firma {#signing-secret}

Quando crei un endpoint (e quando ne ruoti il segreto), Axentra genera un segreto di firma che inizia
con `whsec_`. Viene mostrato **una sola volta**. Axentra lo conserva crittografato e non lo mostra
mai più.

> [!CAUTION]
> Conserva subito il segreto nell'archivio dei segreti del tuo ricevitore. Chiunque lo conosca può
> inviare richieste che il tuo ricevitore accetta come autentiche. Se lo perdi o se trapela,
> [ruota il segreto](help:webhooks#rotate-secret).

Il ricevitore usa il segreto per verificare l'intestazione `Axentra-Signature` di ogni richiesta. Il
[tutorial sul ricevitore di webhook](help:tutorial-webhook-receiver#verify-signature) mostra
l'algoritmo esatto con codice Python e TypeScript.

## Inviare un ping di test {#test}

Nella pagina dell'endpoint, scegli **Invia ping di test**. Axentra invia immediatamente una
richiesta firmata con il tipo `axentra.ping` e attende la risposta. Studio segnala **Ping di test
consegnato (HTTP 200)** oppure **Ping di test non riuscito** con il codice di stato o l'errore, e
apre la consegna registrata.

Un ping di test viene inviato una sola volta, senza nuovi tentativi, anche a un endpoint
disattivato, così puoi provare un ricevitore prima di attivarlo. Il suo corpo contiene
`"type": "axentra.ping"`, `"data": {"endpoint_id": "…"}` e l'id della consegna come `id`.

## Controllare le consegne {#deliveries}

La scheda **Consegne** di un endpoint elenca le sue consegne dalla più recente: **Evento** (tipo e id
della consegna), **Stato**, **Risposta** (il codice di stato HTTP), **Tentativi**, **Durata** e
**Creato**. Filtra per **Stato**; **Aggiorna** carica lo stato più recente.

### Stati delle consegne {#delivery-statuses}

| Stato                             | Significato                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **In attesa**                     | In attesa di invio, in fase di invio oppure rimessa in coda da **Consegna di nuovo**.                                     |
| **Consegnata**                    | Il ricevitore ha risposto con uno stato `2xx`.                                                                            |
| **Non riuscita, nuovo tentativo** | L'ultimo tentativo non è riuscito; è previsto un altro tentativo (**Prossimo tentativo**).                                |
| **Esaurita**                      | Nessun altro tentativo automatico: sono stati usati tutti, l'URL è stato rifiutato oppure l'endpoint è stato disattivato. |

### Dettagli della consegna {#delivery-detail}

Seleziona l'icona dei dettagli alla fine di una riga. Il pannello mostra **ID consegna**, **Stato**,
**Risposta**, **Tentativi**, **Durata**, l'**ID evento**, il **Job** che la invia (un link al
[job](help:jobs#job-detail)), **Creato**, **Consegnato** e **Prossimo tentativo**, oltre a:

- **Ultimo errore**: per esempio `HTTP 500`, un timeout, `unresolvable: …` o `refused: …`;
- **Corpo della risposta**: i primi 4096 byte (valore predefinito) della risposta del ricevitore. Se
  il tuo ricevitore restituisce un breve testo di errore, qui è più facile diagnosticare i problemi.

## Nuovi tentativi {#retries}

Le consegne non riuscite vengono ritentate automaticamente tramite la coda dei job, fino a **8
tentativi** con le impostazioni predefinite (`events.webhook_max_attempts`). I webhook hanno un
calendario proprio, più lento di quello degli altri job: l'attesa prima del tentativo _n + 1_ è
compresa tra la metà e l'intero di `120 × 2^(n−1)` secondi, al massimo 6 ore
(`events.webhook_backoff_base_seconds`, `events.webhook_backoff_max_seconds`). Con le impostazioni
predefinite le attese sono di circa 2, 4, 8, 16, 32, 64 e 128 minuti, quindi l'ultimo tentativo
avviene circa **2-4¼ ore** dopo il primo, e un'interruzione del ricevitore fino a circa due ore
viene sempre coperta. Ogni tentativo attende al massimo 10 secondi per la connessione e per ogni
lettura della risposta. (Le versioni di Axentra precedenti a questo calendario usavano l'attesa
breve dei job ed esaurivano tutti i tentativi in pochi minuti.)

Un ricevitore che resta irraggiungibile più a lungo non perde eventi, ma le sue consegne terminano
come **Esaurita**: consegnale di nuovo quando torna disponibile. Axentra non disattiva gli endpoint
che continuano a fallire e non applica limiti di frequenza per endpoint.

Due casi terminano una consegna senza ulteriori tentativi: un URL che il server rifiuta (vedi
[Regole per gli URL](help:webhooks#url-rules)) e un endpoint che è stato disattivato mentre la
consegna era in attesa. Un nome host che non può essere risolto viene ritentato.

## Consegnare di nuovo {#redeliver}

1. Apri i dettagli della consegna.
2. Scegli **Consegna di nuovo**.

La consegna torna **In attesa** e viene inviata di nuovo con una nuova serie di tentativi. Il
contatore **Tentativi** continua a contare. **Consegna di nuovo** non viene offerto finché la
consegna è **In attesa**. Il ricevitore riceve di nuovo lo stesso id evento, quindi un ricevitore che
elimina i duplicati ignora gli eventi già elaborati.

## Ruotare il segreto di firma {#rotate-secret}

Ruota il segreto quando potrebbe essere trapelato, quando se ne va qualcuno che lo conosceva, oppure
regolarmente come buona pratica.

1. Nella pagina dell'endpoint, scegli **Ruota segreto**.
2. Scegli un **Periodo di tolleranza**: **Nessuno (il segreto precedente smette subito di
   funzionare)**, **1 ora**, **24 ore** o **7 giorni**.
3. Scegli **Ruota segreto**, poi copia e conserva il nuovo segreto come durante la creazione.

Durante il periodo di tolleranza ogni richiesta riporta **due** firme: una creata con il nuovo
segreto e una con il segreto precedente. Un ricevitore che ha ancora il vecchio segreto continua a
funzionare mentre lo aggiorni. La pagina dell'endpoint mostra **Segreto precedente ancora valido**
fino al termine del periodo.

> [!TIP]
> Per ruotare senza consegne non riuscite: scegli un periodo di tolleranza, inserisci il nuovo
> segreto nel ricevitore e verifica che le consegne continuino a riuscire prima che il periodo
> termini. Con **Nessuno**, il ricevitore rifiuta ogni richiesta finché non ha il nuovo segreto.

## Modificare o disattivare un endpoint {#edit}

Apri la scheda **Impostazioni** dell'endpoint, modifica **URL**, **Descrizione**, **Tipi di evento** o
**Attivato** e scegli **Salva modifiche**. **Annulla modifiche** ripristina i valori salvati.

Disattivando **Attivato** si interrompono le nuove consegne. Le consegne ancora in attesa di un
tentativo terminano come **Esaurita** con l'errore `endpoint disabled`; consegnale di nuovo dopo aver
riattivato l'endpoint. Gli eventi pubblicati mentre l'endpoint era disattivato non vengono consegnati
in seguito.

## Eliminare un endpoint {#delete}

Scegli **Elimina endpoint** e conferma. L'endpoint non riceve più nulla e la sua cronologia delle
consegne viene eliminata insieme a esso. L'operazione non può essere annullata. Per mettere in pausa
un endpoint, disattivalo.

## Formato della richiesta {#request-format}

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

| Campo                     | Contenuto                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                      | Id dell'evento, identico all'intestazione `Axentra-Event-Id`. Usalo per eliminare i duplicati. |
| `type`                    | Tipo di evento.                                                                                |
| `product_id`, `tenant_id` | Dove si è verificato l'evento; `tenant_id` è `null` per gli eventi a livello di prodotto.      |
| `occurred_at`             | Quando si è verificato l'evento (ISO 8601, UTC).                                               |
| `data`                    | L'oggetto dei dati dell'evento.                                                                |

`Axentra-Delivery` identifica la consegna ed è lo stesso per tutti i suoi tentativi e per tutte le
sue nuove consegne. Verifica la firma sui byte **grezzi** del corpo; non analizzare e
riserializzare prima il JSON.

## Impostazioni {#settings}

| Impostazione                          | Che cosa fa                                                             | Valori consentiti / predefinito                                         |
| ------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **URL**                               | Dove vengono inviate le richieste.                                      | URL `https://`, host pubblico, al massimo 2000 caratteri. Obbligatorio. |
| **Descrizione**                       | Nota per le persone.                                                    | Fino a 1000 caratteri.                                                  |
| **Tipi di evento**                    | Quali eventi vengono inviati.                                           | Da 1 a 50 tipi o pattern con `*`. Obbligatorio.                         |
| **Filtro tenant**                     | Limita l'endpoint a un tenant.                                          | Un tenant oppure **Tutti i tenant**. Solo alla creazione.               |
| **Attivato**                          | Se vengono inviate nuove consegne.                                      | Predefinito attivo.                                                     |
| **Periodo di tolleranza** (rotazione) | Per quanto tempo il segreto precedente continua a firmare le richieste. | Nessuno, 1 ora, 24 ore, 7 giorni (API: fino a 7 giorni in secondi).     |

Valori predefiniti lato server (gli operatori possono modificarli in `[events]`): 8 tentativi
distribuiti su circa 2-4¼ ore, timeout di 10 secondi, 4096 byte di corpo della risposta conservati.

## Buono a sapersi {#good-to-know}

- Endpoint, consegne, test e rotazioni sono disponibili anche tramite l'API in
  `/v1/products/{product_id}/webhooks`; vedi le [nozioni di base sull'API](help:api-basics).
- Creazione, modifica, eliminazione, test, rotazione e nuova consegna vengono registrati nel
  [registro di audit](help:audit).
- Le consegne riuscite ed esaurite vengono eliminate dopo il periodo di conservazione (30 giorni per
  impostazione predefinita).

## Risoluzione dei problemi {#troubleshooting}

**“webhook urls must use https”.** Usa un URL `https://`. `http://` funziona solo sui server di
sviluppo che lo consentono.

**“webhook urls must not point to local hosts” oppure “… private, loopback or link-local
addresses”.** L'URL punta alla tua macchina o a una rete interna. Usa un indirizzo HTTPS pubblico,
per esempio tramite un servizio di tunnel durante lo sviluppo (vedi il
[tutorial](help:tutorial-webhook-receiver#public-url)).

**“event_types needs 1-50 type patterns”.** Aggiungi almeno un tipo di evento, oppure `*` per tutti.

**Ping di test non riuscito con HTTP 401 o 403.** Il ricevitore ha rifiutato la firma. Verifica che
usi il segreto attuale (il valore completo, compreso `whsec_`), il corpo grezzo della richiesta e un
orologio corretto (i timestamp più vecchi di circa 5 minuti vengono rifiutati).

**Ping di test non riuscito con HTTP 404 o 405.** Il percorso è errato, oppure il ricevitore non
accetta `POST`.

**Ping di test non riuscito senza codice di stato.** Non è stato possibile raggiungere il
ricevitore: leggi **Ultimo errore**. `unresolvable` significa che il nome host non esiste nel DNS; un
timeout significa che il ricevitore non ha risposto entro 10 secondi. Rispondi rapidamente ed esegui
il lavoro lento dopo aver risposto.

**Consegne in stato Esaurita con “refused: …”.** L'host ora viene risolto in un indirizzo privato. Correggi la
voce DNS o l'URL, poi consegna di nuovo.

**Consegne in stato Esaurita con “endpoint disabled”.** L'endpoint è stato disattivato mentre le consegne
erano in attesa. Attivalo e consegna di nuovo.

**Per un evento non compare alcuna consegna.** Verifica che l'endpoint sia attivato, che un pattern
dei tipi di evento corrisponda e controlla il filtro tenant. Gli eventi pubblicati prima che
l'endpoint esistesse non vengono consegnati. Se l'evento è nel
[registro eventi](help:events#event-log) ma non succede nulla, potrebbe non essere in esecuzione
alcun worker.

**“Conflitto” su Consegna di nuovo.** La consegna è già in coda o in fase di invio. Attendi e scegli
**Aggiorna**.

**“Modificato nel frattempo” durante il salvataggio o l'eliminazione.** Qualcun altro ha modificato
l'endpoint. Ricarica la pagina e ripeti la modifica.

**Il ricevitore ha elaborato un evento due volte.** È previsto con la consegna almeno una volta.
Elimina i duplicati in base a `Axentra-Event-Id`.
