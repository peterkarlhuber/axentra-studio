---
title: Pianificazioni
summary: Esegui un job regolarmente, a intervalli fissi o in orari cron in UTC, e attiva, disattiva, modifica o elimina le pianificazioni.
keywords: pianificazione, schedulazione, cron, crontab, job ricorrente, timer, intervallo, periodico, UTC, fuso orario, prossima esecuzione, ogni giorno, ogni ora
---

Una **pianificazione** accoda un [job](help:jobs) più e più volte: ogni 15 minuti, ogni notte alle
02:00, il primo giorno di ogni mese. Assegni alla pianificazione un **Tipo** di job e un **Payload**,
e la pianificazione mette in coda un nuovo job di quel tipo a ogni orario previsto. Un worker esegue
poi il job come qualsiasi altro. Usa le pianificazioni per report, pulizie, sincronizzazioni e
promemoria.

> [!IMPORTANT]
> Le pianificazioni richiedono il modulo del server `events`. La visualizzazione richiede
> `jobs:read`; **Nuova pianificazione**, la modifica, l'attivazione, la disattivazione e
> l'eliminazione richiedono `jobs:manage` (senza questa autorizzazione i pulsanti e il menu della
> riga sono nascosti). Le pianificazioni scattano solo mentre è in esecuzione un processo worker
> (`axentra worker`), perché il worker funge anche da scheduler.

## Leggere l'elenco delle pianificazioni {#schedules-list}

Apri [Pianificazioni](app:schedules) (raggiungibile anche con **Pianificazioni** nella schermata
**Job**). Ogni riga mostra:

- il **Nome** e il tipo di job che accoda;
- la **Tempistica**: un intervallo come _Ogni 15 minuti_, oppure un'espressione cron contrassegnata
  con _cron, UTC_;
- lo **Stato**: **Attivo** o **Disattivato**;
- la **Prossima esecuzione**: quando la pianificazione scatterà la prossima volta (mostrata come
  **Disattivata** per le pianificazioni disattivate);
- l'**Ultima esecuzione**: lo slot temporale che è scattato per ultimo. Quando esiste un job per
  esso, l'orario rimanda a quel job;
- il **Tenant**, oppure **Livello prodotto**.

## Creare una pianificazione {#create}

1. Apri [Pianificazioni](app:schedules) e scegli **Nuova pianificazione**.
2. Inserisci un **Nome** (da 1 a 200 caratteri) e il **Tipo** di job, per esempio `reports.send`.
3. In **Tempistica**, scegli **Intervallo fisso** o **Espressione cron** (vedi sotto).
4. Facoltativo: inserisci il **Payload** per il job, scegli un **Tenant** e imposta **Priorità** e
   **Tentativi max.**.
5. Lascia attivo **Attivata** se la pianificazione deve iniziare a scattare subito.
6. Scegli **Crea pianificazione**.

Il server calcola la **Prossima esecuzione** quando salvi. Studio non mostra un'anteprima degli orari
di esecuzione futuri.

## Scegliere la tempistica {#timing}

Una pianificazione usa esattamente una delle due modalità di tempistica.

### Intervallo fisso {#interval}

Inserisci un numero in **Ogni** e scegli l'**Unità** (**Secondi**, **Minuti**, **Ore** o
**Giorni**). L'intervallo deve essere compreso tra 10 secondi e 366 giorni.

Gli intervalli vengono calcolati a partire dalla mezzanotte UTC del 1° gennaio 1970, non dal momento
in cui hai salvato. Tutti i server calcolano quindi gli stessi orari, e gli orari di esecuzione sono
prevedibili:

- _Ogni 15 minuti_ scatta ai minuti :00, :15, :30 e :45 di ogni ora (UTC).
- _Ogni 1 giorno_ scatta alle 00:00 UTC.
- _Ogni 7 giorni_ scatta il giovedì alle 00:00 UTC (il 1° gennaio 1970 era un giovedì).

Se ti serve un orario preciso del giorno o un giorno specifico della settimana, usa invece
un'espressione cron.

### Espressione cron {#cron-syntax}

Un'espressione cron ha esattamente **5 campi**, separati da spazi:

```text
┌──────── minute        0-59
│ ┌────── hour          0-23
│ │ ┌──── day of month  1-31
│ │ │ ┌── month         1-12
│ │ │ │ ┌ day of week   0-7 (0 and 7 are Sunday)
* * * * *
```

Ogni campo accetta:

| Sintassi | Significato                                                | Esempio                                                         |
| -------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| `*`      | ogni valore                                                | `*` nel campo dell'ora: ogni ora                                |
| `n`      | un valore                                                  | `30` nel campo dei minuti                                       |
| `a-b`    | un intervallo                                              | `1-5` nel campo del giorno della settimana: da lunedì a venerdì |
| `a,b,c`  | un elenco (gli elementi possono essere intervalli o passi) | `0,30` nel campo dei minuti                                     |
| `*/n`    | ogni _n_-esimo valore dall'inizio                          | `*/10` nel campo dei minuti: 0, 10, 20 …                        |
| `a-b/n`  | ogni _n_-esimo valore all'interno di un intervallo         | `8-18/2` nel campo dell'ora: 8, 10 … 18                         |
| `a/n`    | ogni _n_-esimo valore da _a_ fino alla fine                | `5/15` nel campo dei minuti: 5, 20, 35, 50                      |

**Non supportati:** nomi di mesi o giorni della settimana (`JAN`, `MON`), `L`, `W`, `#`, `?`, un
campo dei secondi e macro come `@daily` o `@hourly`. Un'espressione può avere al massimo 200
caratteri.

Quando sono limitati **sia** il giorno del mese sia il giorno della settimana (nessuno dei due è
`*`), un giorno corrisponde se corrisponde **uno qualsiasi** dei due. `0 0 1 * 1` scatta quindi il
1° di ogni mese _e_ ogni lunedì.

Un'espressione che non corrisponde mai, come `0 0 31 2 *` (31 febbraio), viene rifiutata al
salvataggio.

Studio verifica la sintassi mentre scrivi, con le stesse regole del server, e mostra messaggi come
_Un'espressione cron ha 5 campi separati da spazi; questa ne ha 6._ I pulsanti in **Espressioni
comuni** inseriscono espressioni già pronte:

| Pulsante                      | Espressione   |
| ----------------------------- | ------------- |
| **Ogni 5 minuti**             | `*/5 * * * *` |
| **Ogni ora**                  | `0 * * * *`   |
| **Ogni giorno alle 00:00**    | `0 0 * * *`   |
| **Giorni feriali alle 09:00** | `0 9 * * 1-5` |
| **Lunedì alle 06:00**         | `0 6 * * 1`   |
| **Il 1° del mese**            | `0 0 1 * *`   |

### Fuso orario: sempre UTC {#timezone}

Tutti gli orari delle pianificazioni sono in **UTC**. Non esiste un'impostazione del fuso orario né
un adeguamento automatico all'ora legale. Converti tu stesso gli orari locali: le 09:00 a Roma
corrispondono a `0 8 * * *` in inverno (UTC+1) e a `0 7 * * *` in estate (UTC+2). Se l'ora locale
esatta conta tutto l'anno, modifica la pianificazione al cambio dell'ora, oppure lascia che sia
l'handler a verificare l'ora locale.

Le colonne **Prossima esecuzione** e **Ultima esecuzione** vengono visualizzate nel tuo fuso orario,
come ovunque in Studio.

## Che cosa accoda una pianificazione {#what-it-enqueues}

A ogni slot temporale la pianificazione accoda un job con:

- il **Tipo**, il **Payload**, la **Priorità**, i **Tentativi max.** e il **Tenant** della
  pianificazione;
- un collegamento alla pianificazione (i dettagli del job lo mostrano in **Pianificazione**);
- **Creato da** `schedule:<schedule id>`;
- una chiave di idempotenza composta dall'id della pianificazione e dallo slot temporale.

Ogni slot temporale scatta **al massimo una volta**, anche quando sono in esecuzione più worker. Il
job stesso viene poi eseguito almeno una volta, con i consueti [nuovi tentativi](help:jobs#retries).
Una pianificazione non attende che il job precedente sia terminato: se un job dura più
dell'intervallo, il successivo parte comunque.

## Esecuzioni mancate e prossima esecuzione {#missed-runs}

Se nessun worker era in esecuzione quando gli slot erano previsti (per esempio durante una
manutenzione), gli slot mancati vengono **accorpati**: la pianificazione scatta una volta per lo slot
in ritardo e poi prosegue con lo slot successivo all'ora attuale. Non recupera ogni esecuzione
mancata.

La **Prossima esecuzione** viene ricalcolata a partire dall'ora attuale ogni volta che modifichi la
tempistica o attivi la pianificazione. Modificare solo il nome, il payload, la priorità o i
tentativi mantiene la prossima esecuzione.

## Modificare una pianificazione {#edit}

1. Apri il menu delle azioni della riga e scegli **Modifica**.
2. Modifica i valori e scegli **Salva modifiche**.

Studio invia solo i campi che hai modificato. Il **Tenant** non può essere cambiato dopo la
creazione; elimina invece la pianificazione e creane una nuova. I job già accodati mantengono il loro
vecchio payload.

## Attivare o disattivare una pianificazione {#enable-disable}

Apri il menu delle azioni della riga e scegli **Disattiva** o **Attiva**. Una pianificazione
disattivata mantiene tutte le sue impostazioni ma non scatta. Quando la riattivi, prosegue con lo
slot successivo all'ora attuale; gli slot mancati mentre era disattivata non vengono eseguiti.

## Eliminare una pianificazione {#delete}

Apri il menu delle azioni della riga, scegli **Elimina pianificazione** e conferma. La pianificazione
smette di scattare. I job che ha già accodato restano e vengono comunque eseguiti. L'eliminazione non
può essere annullata; per fermare temporaneamente una pianificazione, disattivala.

## Impostazioni {#settings}

| Impostazione       | Che cosa fa                                                        | Valori consentiti / predefinito                                            |
| ------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Nome**           | Mostrato nell'elenco e nei messaggi.                               | Da 1 a 200 caratteri. Obbligatorio.                                        |
| **Tipo**           | Tipo di job da accodare; un worker deve avere un handler per esso. | Come per i [job](help:jobs#enqueue); `axentra.` è riservato. Obbligatorio. |
| **Tempistica**     | **Intervallo fisso** o **Espressione cron**.                       | Intervallo da 10 s a 366 giorni; cron: 5 campi, UTC.                       |
| **Payload**        | Input di ogni job accodato.                                        | Oggetto JSON, al massimo 64 KB. Predefinito `{}`.                          |
| **Tenant**         | Accoda i job in questo tenant.                                     | Un tenant oppure **Livello prodotto**. Solo alla creazione.                |
| **Priorità**       | Priorità dei job accodati.                                         | Da −100 a 100. Predefinito 0.                                              |
| **Tentativi max.** | Tentativi di ogni job accodato prima che diventi **Esaurito**.     | Da 1 a 100. Predefinito 5.                                                 |
| **Attivata**       | Se la pianificazione scatta.                                       | Predefinito attivo.                                                        |

## Per gli sviluppatori {#developers}

Le pianificazioni sono disponibili anche tramite l'API: `GET/POST /v1/products/{product_id}/schedules`
e `GET/PATCH/DELETE /schedules/{id}` (con `If-Match` per aggiornamenti ed eliminazioni). Un solo
worker alla volta funge da scheduler; per impostazione predefinita controlla ogni 5 secondi se ci
sono pianificazioni da eseguire (`events.scheduler_interval_seconds`), quindi un job può essere
accodato qualche secondo dopo il suo slot.

## Risoluzione dei problemi {#troubleshooting}

**La pianificazione non scatta.** Verifica che sia **Attivo** e che la **Prossima esecuzione** sia
nel passato. Se è così, nessun worker è in esecuzione; chiedi ai tuoi operatori di avviarne uno. Se i
job vengono accodati ma restano **In coda**, nessun worker gestisce il tipo; vedi
[Job](help:jobs#troubleshooting).

**Scatta all'ora sbagliata.** Gli orari cron sono in UTC. Converti la tua ora locale, tenendo conto
dell'ora legale (vedi [Fuso orario](help:schedules#timezone)).

**“The cron expression never matches”.** I campi descrivono una data che non esiste, come il 30
febbraio. Modifica il giorno o il mese.

**“Verifica i dati inseriti” con un messaggio sul cron.** Il server indica il campo, per esempio
`cron hour: values must be within 0-23` o `cron day of week: invalid value 'MON'`. Usa numeri invece
di nomi e rimuovi le macro.

**“interval_seconds must be between 10 and 31622400”.** L'intervallo è più breve di 10 secondi o più
lungo di 366 giorni.

**“Modificato nel frattempo” durante il salvataggio, l'attivazione o l'eliminazione.** Qualcun altro
ha modificato la pianificazione dopo che l'hai caricata. Chiudi la finestra, attendi che l'elenco si
aggiorni (o ricarica la pagina), poi ripeti la modifica sulla versione attuale.

**Dopo un'interruzione la pianificazione è stata eseguita una sola volta, non per ogni slot
mancato.** È voluto: gli slot mancati vengono accorpati in un'unica esecuzione.
