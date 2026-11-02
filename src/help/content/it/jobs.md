---
title: Job
summary: Segui i job in background, comprendi i loro stati e i nuovi tentativi, accoda un job manualmente e riprova o annulla un job.
keywords: job, job in background, attività, lavoro in background, coda, worker, nuovo tentativo, riprova, annullare, dead letter, esaurito, non riuscito, tentativi, backoff, accodare, chiave di idempotenza, handler
---

Un **job** è un'unità di lavoro eseguita in background invece che mentre qualcuno aspetta il
caricamento di una schermata: l'invio di un report mensile, l'importazione di un file, la consegna di
un webhook. Il tuo prodotto, una pianificazione o Axentra stesso mettono i job in una coda, e un
processo **worker** separato li preleva ed esegue il codice (l'**handler**) associato al **tipo** del
job. La schermata **Job** mostra che cosa è in attesa, che cosa è in esecuzione, che cosa ha
funzionato e che cosa non è riuscito, e consente agli operatori di riprovare o annullare i job.

> [!IMPORTANT]
> I job richiedono il modulo del server `events`; senza di esso, **Job** non compare nella barra
> laterale. La visualizzazione richiede l'autorizzazione `jobs:read` (la possiedono proprietari,
> amministratori, supporto e visualizzatori del prodotto). **Accoda job**, **Riprova** e **Annulla
> job** richiedono `jobs:manage`; senza questa autorizzazione i pulsanti sono nascosti. I job vengono
> eseguiti solo finché è attivo almeno un processo worker (`axentra worker`). Si tratta di un compito
> operativo, vedi [Configurazione del server](help:server-configuration).

## Leggere l'elenco dei job {#jobs-list}

Apri [Job](app:jobs). L'elenco mostra per primi i job più recenti con **Tipo**, **Stato**,
**Tentativi** (per esempio `2 di 5`), **Tenant** (oppure **Livello prodotto** per i job che non
appartengono a un tenant), **Creato** e **Aggiornato**. Seleziona un tipo per aprire i dettagli del
job.

### Contatori della panoramica {#overview}

La scheda **Panoramica** conta i job per stato. Seleziona un contatore per mostrare solo quei job.
Sotto i contatori vedi quanti job sono riusciti e quanti non sono riusciti nelle ultime 24 ore (il
numero dei non riusciti include i job **Esaurito**) e quando è stato creato il **Job in coda più
vecchio**. Se quel momento continua ad allontanarsi nel tempo, nessun worker sta prelevando i job:
verifica che un worker sia in esecuzione e che gestisca questo tipo.

### Filtrare i job {#filter}

Filtra per **Stato**, per **Tipo** esatto (per esempio `reports.send`) e per **Tenant**, poi scegli
**Applica filtri**. **Reimposta filtri** li cancella. I filtri fanno parte dell'indirizzo della
pagina, quindi puoi salvare tra i preferiti o condividere una vista filtrata.

### Seguire le modifiche in diretta {#live-updates}

Attiva **Aggiornamenti in diretta** per seguire il flusso dei job del server. Studio aggiorna allora
l'elenco e i contatori (al massimo una volta al secondo) ogni volta che un job cambia. L'indicatore
accanto all'interruttore mostra lo stato della connessione; vedi
[Stato della connessione](help:events#connection-status). Senza aggiornamenti in diretta l'elenco
cambia solo quando lo ricarichi.

## Stati dei job {#statuses}

```diagram
job-lifecycle
```

| Stato             | Significato                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **In coda**       | In attesa di un worker. Anche un job con un ritardo o in attesa del prossimo tentativo è in coda.                       |
| **In esecuzione** | Un worker ha preso in carico il job e ne detiene un lease a tempo limitato.                                             |
| **Riuscito**      | L'handler ha terminato. Il suo valore di ritorno viene conservato come **Risultato**.                                   |
| **Non riuscito**  | L'handler ha segnalato un errore permanente (ha sollevato `PermanentJobError`). Non ci sono altri tentativi automatici. |
| **Esaurito**      | Tutti i tentativi sono stati usati. Il job viene conservato come "dead letter" per poterlo esaminare e riprovare.       |
| **Annullato**     | Annullato prima dell'avvio, oppure l'handler si è fermato dopo una richiesta di annullamento.                           |

**Non riuscito** ed **Esaurito** sono entrambi stati finali, ma per motivi diversi: **Non riuscito**
significa che l'handler ha deciso che riprovare non può servire; **Esaurito** significa che ogni
tentativo si è concluso con un errore.

## Tentativi, nuovi tentativi e backoff {#retries}

Ogni volta che un worker prende in carico un job, il suo contatore dei tentativi aumenta di uno.
Quando un tentativo termina con un errore ordinario, il job torna **In coda** e attende prima del
tentativo successivo. L'attesa cresce in modo esponenziale: dopo il tentativo _n_ è compresa tra la
metà e l'intero di `2 × 2^(n−1)` secondi (2, 4, 8, 16 … secondi con le impostazioni predefinite, mai
più di un'ora). Questo "backoff" dà a un problema temporaneo, come un servizio esterno sovraccarico,
il tempo di risolversi. La componente casuale evita che molti job non riusciti riprovino nello stesso
istante.

Quando l'ultimo tentativo consentito fallisce, il job diventa **Esaurito**. Il valore predefinito è
**5** tentativi, quindi con le impostazioni predefinite un job che fallisce sempre è esaurito dopo
circa mezzo minuto. Puoi impostare **Tentativi max.** tra 1 e 100 quando accodi un job o crei una
pianificazione.

Un worker che si blocca smette di rinnovare il proprio lease. Alla scadenza del lease (60 secondi per
impostazione predefinita), un altro worker rimette il job in coda. L'esecuzione persa conta come un
tentativo.

> [!WARNING]
> I job vengono eseguiti **almeno una volta**, non esattamente una volta. Un job può essere eseguito
> due volte, per esempio dopo il blocco di un worker o quando non è stato possibile salvare il
> risultato. Gli handler devono essere idempotenti: eseguirli due volte deve avere lo stesso effetto
> che eseguirli una volta.

## Aprire i dettagli di un job {#job-detail}

Seleziona il tipo di un job nell'elenco. La pagina dei dettagli mostra:

- **Dettagli**: **ID job**, **Tipo**, **Stato**, **Tenant**, **Tentativi**, **Priorità**, **Chiave di
  idempotenza**, la **Pianificazione** che ha creato il job (un link), il **Worker** che lo esegue o
  lo ha eseguito, se è impostato **Annullamento richiesto** e **Creato da** (l'id di un utente o di
  una chiave API, oppure `schedule:<id>` per i job pianificati).
- **Cronologia**: **Creato**, **Esegui dopo** (il primo momento di avvio possibile, inclusi ritardi e
  backoff), **Avviato**, **Lease fino a**, **Terminato** e **Aggiornato**.
- **Ultimo errore**: il messaggio di errore del tentativo non riuscito più recente, al massimo 2000
  caratteri. Il server rimuove token, chiavi API e stringhe di connessione prima di salvare il
  messaggio.
- **Payload** e **Risultato** come JSON. I valori sotto chiavi come `password`, `secret`, `token` o
  `api_key` vengono mostrati come `[redacted]`.

Finché un job è **In coda** o **In esecuzione**, la pagina si aggiorna da sola ogni 3 secondi.

## Accodare un job {#enqueue}

Di solito non accodi i job manualmente: lo fanno il codice del tuo prodotto e le pianificazioni.
Accodare un job in Studio è utile per avviare un'esecuzione singola o per provare un handler.

1. Apri [Job](app:jobs) e scegli **Accoda job**.
2. Inserisci il **Tipo**, per esempio `reports.send`. Deve corrispondere a un handler eseguito da un
   worker.
3. Facoltativo: inserisci il **Payload** come oggetto JSON (l'input per l'handler), scegli un
   **Tenant** e imposta **Priorità**, **Ritardo (secondi)** e **Tentativi max.**.
4. Scegli **Accoda**. Studio apre la pagina dei dettagli del nuovo job.

| Impostazione              | Che cosa fa                                                                                   | Valori consentiti / predefinito                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**                  | Seleziona l'handler che esegue il job.                                                        | Inizia con una lettera minuscola, poi lettere minuscole, cifre e `_ . : -`, al massimo 100 caratteri. `axentra.` è riservato. Obbligatorio. |
| **Payload**               | Input per l'handler.                                                                          | Oggetto JSON, al massimo 64 KB. Predefinito `{}`.                                                                                           |
| **Tenant**                | Esegue il job nell'ambito di un tenant; l'handler può raggiungere solo i dati di quel tenant. | Un tenant del prodotto, oppure **Livello prodotto**.                                                                                        |
| **Priorità**              | I valori più alti vengono presi in carico per primi quando più job sono pronti.               | Da −100 a 100. Predefinito 0.                                                                                                               |
| **Ritardo (secondi)**     | Il job non inizia prima che sia trascorso questo numero di secondi.                           | Da 0 a un anno. Predefinito 0.                                                                                                              |
| **Tentativi max.**        | Quante volte il job viene tentato prima di diventare **Esaurito**.                            | Da 1 a 100. Vuoto: valore predefinito del server (5).                                                                                       |
| **Chiave di idempotenza** | Protegge dalla creazione dello stesso job due volte.                                          | Da 1 a 200 caratteri stampabili. Studio inserisce una chiave casuale.                                                                       |

> [!CAUTION]
> Non inserire segreti (password, chiavi API) in un payload. I payload vengono conservati così come
> sono e sono leggibili da chiunque possieda `jobs:read` (i nomi di campo comuni per i segreti
> vengono solo nascosti nella visualizzazione). Passa degli id e lascia che sia l'handler a leggere
> il segreto.

### Chiave di idempotenza {#idempotency-key}

Studio genera una nuova chiave ogni volta che apri la finestra. Se invii due volte (un doppio clic,
o un nuovo tentativo dopo un timeout), il server restituisce il job creato dal primo invio invece di
crearne un secondo. La chiave è univoca per prodotto, tenant e tipo finché il job esiste.

Se la stessa chiave è già stata usata con un payload o una priorità diversi, o da un altro chiamante
che non può leggere i job, il server rifiuta la richiesta. Studio mostra allora **Già utilizzata per
una richiesta diversa** e offre **Usa una nuova chiave**.

## Riprovare un job non riuscito o esaurito {#retry}

1. Apri il job, oppure apri il menu delle azioni della sua riga nell'elenco.
2. Scegli **Riprova** e conferma.

Il job torna **In coda** con il contatore dei tentativi azzerato, quindi riottiene il numero completo
di tentativi. **Riprova** viene offerto solo per i job **Non riuscito** ed **Esaurito**. Prima
risolvi la causa (vedi **Ultimo errore**), altrimenti il job fallisce di nuovo.

## Annullare un job {#cancel}

1. Apri il job, oppure apri il menu delle azioni della sua riga.
2. Scegli **Annulla job** e conferma.

Che cosa succede dipende dallo stato:

- Un job **In coda** viene annullato subito e non viene mai eseguito.
- Per un job **In esecuzione**, l'annullamento viene _richiesto_. L'elenco mostra **Annullamento
  richiesto**. L'handler vede la richiesta al controllo successivo (gli handler controllano tra un
  passaggio e l'altro) e si ferma; il job termina quindi come **Annullato**. Se l'handler completa
  prima il proprio lavoro, il job termina come **Riuscito**, perché il lavoro è stato svolto.

I job già terminati non possono essere annullati.

## Per sviluppatori e operatori {#developers}

### Handler e worker {#workers}

Gli handler vengono registrati in Python con `ax.jobs.register("reports.send", handler)` ed eseguiti
da `axentra worker`. Un worker prende in carico solo i tipi per cui ha un handler. Un job il cui tipo
non è gestito da alcun worker in esecuzione resta **In coda** a tempo indeterminato; non fallisce.
Gli handler possono:

- restituire un valore JSON, che diventa il **Risultato** (oltre 64 KB: sostituito da una nota di
  troncamento);
- sollevare `PermanentJobError` per terminare subito come **Non riuscito**;
- sollevare `RetryJob(delay_seconds=…)` per riprovare dopo un ritardo a loro scelta;
- chiamare `ctx.heartbeat()` durante i lavori lunghi per rinnovare il lease, e
  `ctx.cancel_requested()` per accorgersi di un annullamento.

L'elenco dei job e le statistiche sono disponibili anche tramite l'API:
`GET /v1/products/{product_id}/jobs`, `/jobs/stats` e il flusso SSE `/jobs/stream`. Vedi le
[nozioni di base sull'API](help:api-basics).

### Chi può accodare quale tipo {#kind-permissions}

Chi possiede `jobs:manage` può accodare qualsiasi tipo che non inizi con `axentra.`. Tramite l'API, i
membri dei tenant che hanno solo `events:publish` possono accodare un tipo solo se il prodotto lo ha
esplicitamente aperto a loro; altrimenti il server risponde "not permitted". Studio offre **Accoda
job** solo a chi possiede `jobs:manage`.

### Tipi di job predefiniti {#system-kinds}

Axentra usa la coda per il proprio lavoro, quindi nell'elenco vedrai questi tipi:

| Tipo                      | Scopo                                                                        |
| ------------------------- | ---------------------------------------------------------------------------- |
| `axentra.event.dispatch`  | Distribuisce un evento pubblicato ai sottoscrittori e agli endpoint webhook. |
| `axentra.event.handle`    | Esegue un sottoscrittore interno al processo per un evento.                  |
| `axentra.webhook.deliver` | Invia una consegna di webhook; vedi [Webhook](help:webhooks#retries).        |

Non puoi accodare tu stesso i tipi `axentra.`, ma puoi riprovarli e annullarli come gli altri job.

### Conservazione {#retention}

I job terminati (**Riuscito**, **Non riuscito**, **Esaurito**, **Annullato**) vengono eliminati dopo
30 giorni per impostazione predefinita (`observability.job_retention_days`). I job in coda e in
esecuzione non vengono mai eliminati.

## Buono a sapersi {#good-to-know}

- Non esiste un ordine garantito. Prima la priorità più alta, poi il momento di avvio più vicino, ma
  i nuovi tentativi e i worker paralleli cambiano l'ordine dei job.
- Ogni job viene affidato a esattamente un worker per tentativo.
- Ogni accodamento, nuovo tentativo e annullamento viene registrato nel
  [registro di audit](help:audit) (`events.job.enqueue`, `events.job.retry`, `events.job.cancel`).
- Il controllo di readiness del server non include i worker. Tieni d'occhio invece il **Job in coda
  più vecchio**.

## Risoluzione dei problemi {#troubleshooting}

**I job restano In coda e non partono mai.** Nessun worker è in esecuzione, oppure nessuno dei worker
in esecuzione ha un handler per questo tipo. Controlla l'orario del **Job in coda più vecchio**, chiedi
ai tuoi operatori di avviare `axentra worker` (con `--load` per gli handler del tuo prodotto) e
controlla come è scritto il tipo. Controlla anche **Esegui dopo**: un job ritardato o in attesa di un
nuovo tentativo è in coda di proposito.

**Un job è Esaurito.** Tutti i tentativi sono falliti. Leggi **Ultimo errore** nella pagina dei
dettagli, risolvi la causa (per esempio un record mancante o un servizio non raggiungibile) e scegli
**Riprova**.

**Un job è Non riuscito dopo un solo tentativo.** L'handler ha segnalato un errore permanente, quindi
Axentra non ha riprovato. Leggi **Ultimo errore**. Riprova solo dopo aver risolto la causa.

**"Verifica i dati inseriti" durante l'accodamento.** Il server ha rifiutato un valore; il messaggio
sotto il titolo lo indica, per esempio `kind must be 1-100 characters…`,
`payload is larger than 64000 bytes`, `priority must be between -100 and 100` o
`job kinds starting with 'axentra.' are reserved`. Correggi il campo e invia di nuovo.

**"Non consentito" durante l'accodamento.** Ti serve `jobs:manage`. Un messaggio come
`job kind … is not open to tenant callers` significa che il tipo può essere accodato solo dagli
operatori.

**"Già utilizzata per una richiesta diversa".** La chiave di idempotenza appartiene a un'altra
richiesta di job. Scegli **Usa una nuova chiave** per creare un nuovo job, oppure ripeti invariata la
richiesta originale.

**"Conflitto" su Riprova o Annulla job.** Lo stato del job è cambiato nel frattempo (per esempio è
terminato mentre stavi confermando). Ricarica la pagina; **Riprova** funziona solo per i job **Non
riuscito** ed **Esaurito**, **Annulla job** solo per quelli **In coda** e **In esecuzione**.

**Annullamento richiesto, ma il job continua a essere eseguito.** L'handler si ferma solo quando
verifica l'annullamento. Gli handler che non lo verificano mai vengono eseguiti fino alla fine e
risultano poi **Riuscito**. Se il worker si blocca, il job viene rimesso in coda alla scadenza del
suo lease.

**Un job è stato eseguito due volte.** È previsto con l'esecuzione almeno una volta. Rendi l'handler
idempotente, per esempio verificando se il lavoro è già stato svolto.
