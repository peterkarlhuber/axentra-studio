---
title: Eventi
summary: Consulta il registro eventi, osserva gli eventi in diretta mentre accadono, interpreta l'indicatore di connessione e pubblica un evento di prova.
keywords: evento, registro eventi, evento di dominio, in diretta, live, flusso, stream, SSE, server-sent events, tempo reale, pubblicare, tipo di evento, sottoscrittore, outbox, Last-Event-ID
---

Un **evento** è un breve messaggio che dice "è successo qualcosa" nel tuo prodotto, per esempio
`invoice.created` o `user.invited`. Ogni evento ha un **tipo**, il momento in cui si è
**verificato**, il tenant a cui appartiene, chi lo ha causato (l'**autore**) e un oggetto JSON con i
dettagli (i **dati**). Altre parti del sistema reagiscono agli eventi: i sottoscrittori interni al
processo nel codice del tuo prodotto e gli [endpoint webhook](help:webhooks) in altri sistemi. La
schermata **Eventi** ti permette di ripercorrere ciò che è accaduto (**Registro eventi**) e di
osservare l'arrivo di nuovi eventi (**In diretta**).

Gli eventi non sono la stessa cosa del [registro di audit](help:audit): il registro di audit
registra chi ha modificato che cosa in Axentra a fini di conformità, mentre gli eventi sono messaggi
che il tuo prodotto pubblica affinché altri sistemi vi reagiscano.

> [!IMPORTANT]
> Gli eventi richiedono il modulo del server `events`. La visualizzazione del registro e della vista
> in diretta richiede `jobs:read` (l'autorizzazione copre job ed eventi). **Pubblica evento**
> richiede `events:publish` in almeno un tenant (la possiedono proprietari, amministratori e membri
> dei tenant); senza questa autorizzazione il pulsante è nascosto.

## Tipi di evento {#event-types}

Un tipo di evento è un nome in minuscolo, di solito _oggetto.azione_: `invoice.created`,
`order.shipped`, `crm.contact:merged`. Inizia con una lettera minuscola e può contenere lettere
minuscole, cifre e `_ . : -`, fino a 150 caratteri. I tipi che iniziano con `axentra.` sono riservati
ad Axentra stesso (per esempio `axentra.ping`, il test dei webhook).

Axentra non tiene un elenco di tipi "consentiti": è il tuo prodotto a definirli pubblicandoli.
Diverse schermate accettano **pattern** in cui `*` sta per un testo qualsiasi: `invoice.*`
corrisponde a `invoice.created` e `invoice.paid`, e `*` da solo corrisponde a ogni tipo.

## Consultare il registro eventi {#event-log}

Apri [Eventi](app:events). La tab **Registro eventi** elenca gli eventi dal più recente con **Tipo**,
**Tenant** (oppure **Livello prodotto**), **Autore** e **Verificatosi**. L'autore mostra il genere di
chiamante (`user`, `api_key` o `system`) e il suo id. Scorri verso il basso e carica altri elementi
per andare più indietro nel tempo.

### Filtrare per tipo e tenant {#filter}

- **Tipo**: un tipo esatto (`invoice.created`) o un prefisso che termina con `*` (`invoice.*`,
  `crm.*`). Il filtro del registro supporta un `*` solo alla fine.
- **Tenant**: solo gli eventi di un tenant.

Scegli **Applica filtri**; **Reimposta filtri** li cancella. I filtri vengono mantenuti
nell'indirizzo della pagina.

### Dettagli dell'evento {#event-detail}

Seleziona l'icona dei dettagli alla fine di una riga. Il pannello mostra **ID evento**, **Tipo**,
**Verificatosi**, **Tenant**, **Autore**, **ID richiesta** (per trovare la richiesta API nei log del
server), **Chiave di idempotenza** (se chi ha pubblicato ne ha fornita una) e i **Dati** come JSON.

## Osservare gli eventi in diretta {#live}

Apri la tab **In diretta**. Studio apre una connessione al flusso di eventi del server e mostra gli
eventi **pubblicati da ora in poi**, con i più recenti in alto. Gli eventi precedenti si trovano nel
**Registro eventi**.

1. Facoltativo: inserisci i **Tipi**, uno o più pattern separati da virgole (per esempio
   `invoice.*, user.created`), e scegli **Applica**. Lascia il campo vuoto per vedere tutti i tipi.
   Applicare un filtro svuota l'elenco e ristabilisce la connessione.
2. Osserva l'arrivo degli eventi. Seleziona **Mostra dati** su una voce per vedere l'evento completo e
   la sua posizione nel flusso.

La vista in diretta conserva gli ultimi 200 eventi; quelli più vecchi escono dall'elenco ma restano
nel registro.

### Stato della connessione {#connection-status}

L'indicatore sopra l'elenco (e accanto ad **Aggiornamenti in diretta** nella schermata
[Job](help:jobs#live-updates)) ti dice se stai davvero ricevendo aggiornamenti:

| Indicatore               | Significato                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Connessione…**         | Studio sta aprendo la connessione.                                                                                                                            |
| **In diretta**           | La connessione è aperta; i nuovi eventi compaiono entro circa un secondo.                                                                                     |
| **In diretta, in pausa** | Connesso, ma la visualizzazione è in pausa (vedi sotto).                                                                                                      |
| **Riconnessione**        | La connessione si è interrotta o il server l'ha chiusa. Studio riprova automaticamente e indica quando (_prossimo tentativo tra … s_).                        |
| **Disconnesso**          | Studio ha smesso di riprovare, per esempio perché la tua sessione o la tua autorizzazione sono cambiate. Il motivo è indicato accanto; scegli **Riconnetti**. |
| **Non connesso**         | Hai scelto **Disconnetti**.                                                                                                                                   |

Il server chiude ogni flusso dopo un'ora e controlla la tua sessione e la tua autorizzazione ogni 15
secondi (impostazioni predefinite). Dopo una chiusura normale o un problema di rete, Studio si
riconnette e **riprende da dove si era fermato**, quindi nel frattempo non va perso alcun evento. Se
il tuo accesso è stato revocato, il flusso si chiude con _L'accesso al flusso è stato perso
(sessione o autorizzazione modificata)._

### Mettere in pausa, riprendere e svuotare {#pause}

- **Pausa** blocca l'elenco così puoi leggerlo. La connessione resta aperta e i nuovi eventi vengono
  raccolti. **Riprendi** li mostra (il pulsante li conta, per esempio **Riprendi (3 nuovi
  eventi)**).
- **Disconnetti** chiude la connessione. **Connetti** la riapre e prosegue dopo l'ultimo evento
  ricevuto, quindi compaiono anche gli eventi pubblicati nel frattempo.
- **Svuota** svuota l'elenco sul tuo schermo. Non elimina alcun evento.

## Pubblicare un evento di prova {#publish}

Pubblicare un evento manualmente è utile per provare un endpoint webhook o un sottoscrittore.

1. Scegli **Pubblica evento**.
2. Scegli il **Tenant**. Gli eventi pubblicati qui appartengono sempre a un tenant.
3. Inserisci il **Tipo**, per esempio `invoice.created`.
4. Inserisci i **Dati** come oggetto JSON, per esempio `{"invoice_id": "inv_123"}`.
5. Scegli **Pubblica**.

L'evento compare nel registro e viene consegnato a ogni endpoint webhook attivato i cui tipi di
evento corrispondono, e ai sottoscrittori del tuo prodotto. È un evento reale: i destinatari non
possono distinguerlo da uno pubblicato dal tuo prodotto, quindi usa dati di prova e un tenant
destinato ai test.

| Impostazione | Che cosa fa                                                        | Valori consentiti / predefinito                               |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Tenant**   | Il tenant a cui appartiene l'evento. Lì ti serve `events:publish`. | Obbligatorio.                                                 |
| **Tipo**     | Il tipo di evento su cui filtrano i destinatari.                   | Vedi [Tipi di evento](help:events#event-types). Obbligatorio. |
| **Dati**     | Dettagli dell'evento.                                              | Oggetto JSON, al massimo 64 KB. Predefinito `{}`.             |

Studio invia una chiave di idempotenza con ogni finestra di pubblicazione, quindi un doppio clic
pubblica una sola volta.

## Per gli sviluppatori {#developers}

- **Outbox transazionale.** Il codice del prodotto pubblica con `ax.events.publish_in_tx(...)`
  all'interno della propria transazione di database. L'evento esiste se e solo se la transazione
  viene confermata, quindi non viene inviato alcun evento per una modifica annullata con un
  rollback.
- **La consegna a sottoscrittori e webhook** avviene tramite [job](help:jobs#system-kinds)
  (`axentra.event.dispatch`, `axentra.event.handle`, `axentra.webhook.deliver`), ciascuno almeno una
  volta. Non esiste alcuna garanzia di ordine tra gli eventi.
- **API.** `GET /v1/products/{product_id}/events?type=&tenant_id=` elenca gli eventi,
  `GET /events/{event_id}` ne restituisce uno e `POST /tenants/{tenant_id}/events` pubblica (con
  un'intestazione `Idempotency-Key` facoltativa).
- **Flussi (SSE).** `GET /events/stream?types=invoice.*,user.created` e `GET /jobs/stream` inviano
  messaggi con `id:` (la posizione nel flusso), `event:` (il tipo di evento, oppure `job.<status>`
  nel flusso dei job) e `data:` in JSON. Rimanda l'ultimo `id` come `Last-Event-ID` per riprendere;
  `Last-Event-ID: 0` riproduce tutto ciò che è ancora conservato. Con `?tenant_id=` l'autorizzazione
  viene verificata in quel tenant, quindi le chiavi API legate a un tenant possono ricevere il flusso
  del loro tenant. Il flusso dei job mostra lo stato più recente di ogni job modificato, quindi gli
  stati intermedi possono essere saltati.
- **Conservazione.** Gli eventi vengono eliminati dopo il periodo di conservazione dei job (30 giorni
  per impostazione predefinita), una volta che nessuna consegna è più in sospeso.

## Buono a sapersi {#good-to-know}

- La vista in diretta mostra solo gli eventi che arrivano mentre è aperta. Per vedere che cosa è
  accaduto prima, usa il **Registro eventi**.
- I suggerimenti di tipo nel modulo dei webhook provengono dagli eventi più recenti di questo
  registro, perché non esiste un catalogo centrale dei tipi.

## Risoluzione dei problemi {#troubleshooting}

**Il registro è vuoto.** Il tuo prodotto non ha ancora pubblicato eventi, oppure i filtri li
escludono. Scegli **Reimposta filtri**. Pubblica un evento di prova per verificare la
configurazione.

**"Inserisci un tipo esatto o un prefisso che termina con \* (ad esempio invoice.\*)".** Il filtro
del registro accetta `invoice.created` o `invoice.*`, non un `*` nel mezzo. Per la vista in diretta e
per i webhook sono consentiti pattern come `*.created`.

**L'indicatore resta su Riconnessione.** Studio non riesce a raggiungere il flusso del server.
Controlla la tua rete e lo stato del server. Anche i proxy che bufferizzano le risposte possono
interrompere i flussi; informa i tuoi operatori.

**Disconnesso con "L'accesso al flusso è stato perso".** La tua sessione è terminata o il tuo ruolo è
cambiato. Se necessario accedi di nuovo, poi scegli **Riconnetti**.

**"Non consentito" all'apertura di Eventi.** Ti serve `jobs:read` in questo prodotto. Chiedi a un
proprietario o a un amministratore del prodotto un ruolo che la includa, vedi
[Ruoli e autorizzazioni](help:roles-permissions).

**"I tipi che iniziano con “axentra.” sono riservati ad Axentra".** Scegli un tipo con un tuo
prefisso, per esempio `invoice.created`.

**"Già utilizzata per una richiesta diversa" durante la pubblicazione.** Un tentativo precedente
dalla stessa finestra ha usato altri valori. Studio ha già creato una nuova chiave: scegli di nuovo
**Pubblica**.

**Un evento pubblicato non ha raggiunto un webhook.** Verifica che l'endpoint sia attivato, che uno
dei suoi tipi di evento corrisponda e che il suo filtro per tenant (se impostato) corrisponda al
tenant dell'evento. Poi controlla le [consegne](help:webhooks#deliveries) dell'endpoint. Se non c'è
alcuna consegna, potrebbe non essere in esecuzione alcun worker che distribuisca l'evento.
