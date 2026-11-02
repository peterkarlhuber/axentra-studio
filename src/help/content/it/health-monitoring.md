---
title: Stato del sistema e monitoraggio
summary: Verifica se il server Axentra è attivo e pronto, leggi le sue metriche e consulta le impostazioni di conservazione, tracing e logging che riporta.
keywords: stato del sistema, salute, stato, readiness, liveness, disponibilità, uptime, 503, monitoraggio, metriche, Prometheus, scrape, OpenTelemetry, tracing, livello di log, conservazione, purge, versione
---

Due pagine mostrano come sta il server Axentra. **Stato del sistema** risponde alla domanda “il
server è attivo e in grado di servire le richieste?” e mostra quali versioni del server e di Studio
sono in esecuzione. **Monitoraggio** aggiunge le metriche del server (numero di richieste, errori,
tempi di risposta) e le impostazioni di manutenzione, conservazione, tracing e logging che il server
riporta. Gli operatori le usano per un rapido controllo; per avvisi e storico, collega un vero
sistema di monitoraggio (vedi [Per gli operatori](#for-operators)).

> [!IMPORTANT]
> Entrambe le pagine sono aperte a tutti gli utenti che hanno effettuato l'accesso e non dipendono
> da un modulo. I riquadri **Manutenzione e conservazione** e **Tracing e logging** richiedono
> `platform:settings` (ruoli nella piattaforma) o `product:manage` in almeno un prodotto
> (**Product owner**, **Product admin**). Il riquadro **Metriche** dipende
> dalla configurazione delle metriche del server, non dal tuo ruolo (vedi [Metriche](#metrics)).

## Verificare se il server è integro {#check-health}

1. Apri **Audit e monitoraggio** › **Stato del sistema** ([apri](app:health)).
2. Leggi il riquadro **Readiness**: lo stato complessivo e una riga per ogni controllo.
3. Leggi il riquadro **Liveness**: **OK** significa che il processo del server risponde.
4. Scegli **Aggiorna** per ripetere subito il controllo. Entrambi i riquadri si aggiornano anche ogni
   30 secondi; **Aggiornato …** indica quando è stato recuperato il risultato della readiness.

### Readiness {#readiness}

La readiness chiede al server se in questo momento è in grado di servire le richieste
(`GET /v1/health/ready`). Il server esegue ogni controllo e risponde **OK** solo se vengono superati
tutti; altrimenti risponde con HTTP `503` e lo stato **Non disponibile**, e Studio elenca comunque
ogni controllo, così vedi quale non viene superato.

| Controllo         | Presente quando                                            | Superato quando                                                                                                                 |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `database`        | sempre                                                     | Il server raggiunge il suo database PostgreSQL                                                                                  |
| `notify_provider` | il modulo notify è abilitato                               | La configurazione del provider email è completa (indirizzo mittente, impostazioni del provider). Non viene inviata alcuna email |
| `schema`          | l'operatore ha impostato `database.require_current_schema` | Non ci sono migrazioni del database in sospeso né migrazioni sconosciute al server                                              |

I backend di prodotto costruiti su Axentra possono registrare altri controlli; compaiono qui con i
loro nomi.

### Liveness {#liveness}

La liveness (`GET /v1/health/live`) ti dice solo che il processo del server risponde. Studio mostra
**Non disponibile** quando la richiesta fallisce, per esempio perché il server o il proxy davanti a
esso non è raggiungibile. Un server può essere live ma non pronto: il processo è in esecuzione, ma
manca una dipendenza come il database.

### Versioni {#versions}

Il riquadro **Versioni** in **Stato del sistema** mostra il nome e la versione del **Server**, la
**Versione API del server**, l'**Ambiente** (`development`, `test` o `production`), la **Versione
di Studio** e la **Versione API richiesta** da questa build di Studio. Studio si rifiuta di avviarsi
con un server la cui versione API non è compatibile; vedi
[Verifica di compatibilità](help:server-configuration#compatibility).

## Usare la pagina Monitoraggio {#monitoring}

Apri **Audit e monitoraggio** › **Monitoraggio** ([apri](app:monitoring)). Mostra gli stessi riquadri
**Readiness** e **Liveness** di **Stato del sistema**, più:

- **Manutenzione e conservazione** e **Tracing e logging** (vedi [più sotto](#retention)),
- **Metriche** del processo API (vedi [Metriche](#metrics)).

**Aggiorna** le ricarica tutte. Le metriche si aggiornano anche ogni 30 secondi, finché vengono
caricate senza errori.

## Metriche {#metrics}

Il riquadro **Metriche** legge l'endpoint Prometheus del server `GET /metrics` e lo mostra sotto
forma di indicatori chiave e tabelle.

| Indicatore chiave                                                                          | Calcolato da                                                                                             |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Richieste HTTP**                                                                         | Tutte le richieste (`axentra_http_requests_total`)                                                       |
| **Errori del server (5xx)** / **Errori del client (4xx)**                                  | Richieste con quella classe di stato                                                                     |
| **Tempo di risposta medio**                                                                | Tempo totale delle richieste diviso per il numero di richieste (`axentra_http_request_duration_seconds`) |
| **Rifiutate (401/403)**                                                                    | Rifiuti di autenticazione e di autorizzazione (`axentra_auth_failures_total`)                            |
| **Notifiche accodate** / **Notifiche consegnate** / **Consegne di notifiche non riuscite** | Contatori delle notifiche (li riportano solo i processi che gestiscono le notifiche)                     |

Sotto gli indicatori chiave le metriche sono raggruppate in **HTTP**, **Autenticazione**, **Pool
del database**, **Notifiche**, **Job ed eventi** e **Altre metriche**. Ogni tabella mostra una riga
per ogni combinazione di etichette (per esempio per metodo, route e stato) con il suo valore; per
gli istogrammi, **Conteggio** e **Media**. Le metriche molto grandi mostrano le prime 50 righe.

> [!WARNING]
> I valori sono contati **dall'avvio di questo processo API** e appartengono **all'unico processo
> che ha risposto alla richiesta di Studio**. Con più processi API o repliche, ognuno ha i propri
> numeri, e anche il dispatcher delle notifiche e i worker dei job hanno i loro. Un riavvio azzera
> i numeri. Per un quadro completo, fai raccogliere a Prometheus le metriche di ogni processo.

### Token per le metriche {#metrics-token}

Se `/metrics` risponde dipende dalla configurazione del server:

| Configurazione del server                              | Cosa mostra Studio                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `observability.metrics_enabled = false`                | **Metriche non disponibili**                                                                    |
| `observability.metrics_token_ref` è impostato          | **È necessario un token per le metriche** e un modulo **Token per le metriche**                 |
| Nessun token configurato, `environment = "production"` | **Metriche non disponibili** (le metriche restano disattivate finché non si configura un token) |
| Nessun token configurato, sviluppo o test              | Le metriche, senza token                                                                        |

Per visualizzare le metriche protette:

1. Chiedi al tuo operatore il token per le metriche (il segreto a cui punta
   `observability.metrics_token_ref`).
2. Inseriscilo in **Bearer token** e scegli **Carica metriche**.

> [!NOTE]
> Studio conserva il token solo nella pagina aperta. Non viene mai memorizzato e scompare quando
> lasci o ricarichi la pagina. Se il server non lo accetta, Studio mostra
> **Il server non ha accettato questo token.**

## Conservazione, tracing e logging {#retention}

**Manutenzione e conservazione** elenca per quanto tempo il server conserva i dati, come riportato
da `GET /v1/settings`:

| Riga                                                     | Impostazione del server                                           | Predefinito                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Eventi di audit**                                      | `observability.audit_retention_days`                              | 365 giorni                                                                      |
| **Job completati**                                       | `observability.job_retention_days`                                | 30 giorni                                                                       |
| **Contenuto delle notifiche** / **Messaggi di notifica** | `notify.content_retention_days` / `notify.message_retention_days` | non riportato dalla versione del server per cui è stato compilato questo Studio |

Un valore che il server non riporta viene mostrato come **non riportato dal server**; Studio non
tira mai a indovinare.

> [!IMPORTANT]
> La conservazione non si applica da sola. I dati più vecchi del periodo vengono eliminati solo
> quando l'operatore esegue `axentra maintenance purge` (di solito una volta al giorno da cron o da
> uno scheduler). Il comando rimuove anche le sessioni scadute e i token di configurazione.

**Tracing e logging** mostra se il **Tracing OpenTelemetry** è attivo, il **Livello di log**, il
**Provider delle notifiche** (`local` o `smtp`) e l'**Ambiente**. Sono valori di sola lettura; si
modificano nella configurazione del server.

## Per gli operatori {#for-operators}

- **Probe**: usa `GET /v1/health/live` come liveness probe e `GET /v1/health/ready` come readiness
  probe del tuo orchestratore. Nessuno dei due richiede autenticazione e non sono mai soggetti a
  limiti di frequenza.
- **Prometheus**: raccogli `/metrics` da ogni processo API. In produzione configura
  `observability.metrics_token_ref` (per esempio `file:/run/secrets/axentra_metrics_token`) e
  fornisci a Prometheus lo stesso token come credenziale bearer.
- **Studio sulla stessa origine**: il container di Studio inoltra `/metrics` all'API insieme a
  `/v1`, quindi la pagina Monitoraggio funziona dietro lo stesso indirizzo.
- I **log** sono in JSON per impostazione predefinita e riportano l'ID richiesta; i segreti vengono
  oscurati.
- **Tracing**: `observability.otel_enabled = true` insieme all'extra `otel` del pacchetto server
  esporta uno span per richiesta tramite OTLP/HTTP.

Il repository del backend documenta tutto questo in `docs/operations/OBSERVABILITY.md`.

## Risoluzione dei problemi {#troubleshooting}

- **Readiness: Non disponibile** con `database` **Non superato**: il server non raggiunge
  PostgreSQL. Controlla il database e l'URL del database del server; le richieste che hanno bisogno
  di dati falliscono finché non torna disponibile.
- **`notify_provider` Non superato**: la configurazione email è incompleta, per esempio manca
  l'indirizzo mittente o non è valido, oppure mancano le impostazioni SMTP. Correggi `[notify]`
  nella configurazione del server.
- **`schema` Non superato**: ci sono migrazioni in sospeso. L'operatore esegue `axentra migrate`.
- **Liveness: Non disponibile** o **Server non raggiungibile**: il server o il proxy tra Studio e
  il server non è raggiungibile. Controlla che il server sia in esecuzione e che l'indirizzo API di
  Studio sia corretto (vedi [Configurazione di Studio](help:server-configuration#studio-config)).
- **Metriche non disponibili**: le metriche sono disattivate, oppure si tratta di un server di
  produzione senza token per le metriche. Chiedi all'operatore di impostare
  `observability.metrics_token_ref`.
- **Il server non ha accettato questo token.**: il token è errato o è stato ruotato. Chiedi
  all'operatore quello attuale.
- **Le impostazioni di conservazione e tracing sono visibili solo agli amministratori della
  piattaforma e ai responsabili di prodotto**: non hai né `platform:settings` né `product:manage`.
  Il resto della pagina funziona comunque.
- **Le metriche sembrano troppo basse o tornano a zero**: ha risposto un altro processo API, oppure
  il processo è stato riavviato (vedi l'avviso in [Metriche](#metrics)).
