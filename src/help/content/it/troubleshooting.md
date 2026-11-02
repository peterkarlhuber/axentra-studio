---
title: Risoluzione dei problemi
summary: Cosa significano i messaggi di errore di Studio, perché compaiono e cosa fare, dai problemi all'avvio alle azioni rifiutate.
keywords: errore, problema, non riuscito, non funziona, ID richiesta, request id, non consentito, vietato, forbidden, non trovato, conflitto, 401, 403, 404, 409, 412, 413, 415, 422, 429, 500, impossibile connettersi, versione incompatibile, sessione scaduta, modulo non abilitato
---

Quando il server Axentra rifiuta una richiesta o non riesce a completarla, Studio mostra un
messaggio tradotto che indica cosa è successo e cosa puoi fare. Questa pagina spiega ogni messaggio,
le schermate di avvio che potresti vedere prima che Studio si apra e alcune situazioni comuni. Ogni
sezione ha un proprio punto di collegamento, così le schermate possono portarti direttamente alla
spiegazione giusta.

## Com'è fatto un messaggio di errore {#error-message}

Ogni errore in Studio ha le stesse parti:

- **Titolo**: un nome breve per il problema, per esempio **Non consentito** o **Conflitto**. Viene
  scelto in base al _codice di errore_ stabile del server, quindi è lo stesso in ogni lingua.
- **Messaggio**: cosa è successo, la causa probabile e cosa fare dopo.
- **Errori dei campi**: quando il server rifiuta singoli valori, Studio li elenca sotto i campi del
  modulo interessati, oppure come elenco di nomi di campo e motivi.
- **Dettagli tecnici** (sezione espandibile): lo **Stato HTTP**, il **Codice di errore**, il
  **Messaggio del server** (la spiegazione del server stesso, sempre in inglese) e l'**ID
  richiesta**.

Le azioni non riuscite (salvataggio, eliminazione, invio) compaiono come notifica in un angolo dello
schermo con le stesse informazioni. Per **Non consentito** e **Conflitto**, la notifica aggiunge il
messaggio del server, perché di solito indica esattamente cosa manca, per esempio
`missing permission tenants:update` o `a tenant with this slug exists in the product`.

### L'ID richiesta {#request-id}

Ogni risposta del server contiene un ID richiesta come `req_01EXAMPLE…`. Il server scrive lo stesso
ID nei suoi log e nel [registro di audit](help:audit). Quando segnali un problema al tuo operatore
o all'assistenza, includi sempre l'ID richiesta: permette di trovare la richiesta esatta in pochi
secondi.

> [!TIP]
> Apri **Dettagli tecnici** e copia l'ID richiesta prima di chiudere il messaggio o di riprovare.

## Codici di errore {#error-codes}

La tabella offre una panoramica. Le sezioni seguenti spiegano ogni codice con cause e soluzioni.

| Titolo in Studio                          | Codice di errore                  | Stato HTTP      | In breve                                                     |
| ----------------------------------------- | --------------------------------- | --------------- | ------------------------------------------------------------ |
| **Verifica i dati inseriti**              | `validation_failed`               | 422 (o 400)     | Alcuni valori sono stati rifiutati                           |
| **Richiesta non compresa**                | `bad_request`                     | 400             | Non è stato possibile leggere la richiesta                   |
| **Firma non valida**                      | `invalid_signature`               | 400             | Webhook del fornitore di pagamenti rifiutato                 |
| **Accedi**                                | `unauthenticated`                 | 401             | Nessuna sessione valida                                      |
| **Non consentito**                        | `forbidden`                       | 403             | Autorizzazione mancante, oppure prodotto o tenant non attivo |
| **Accedi di nuovo**                       | `reauthentication_required`       | 403             | Serve un accesso recente                                     |
| **Non trovato**                           | `not_found`                       | 404             | Non esiste, oppure non è visibile per te                     |
| **Modulo non abilitato**                  | `module_disabled`                 | 404             | Modulo del server disattivato                                |
| **Azione non supportata**                 | `method_not_allowed`              | 405             | Non offerta a questo indirizzo                               |
| **Conflitto**                             | `conflict`                        | 409             | In conflitto con dati o stato esistenti                      |
| **La configurazione è già completata**    | `setup_already_completed`         | 409             | Esiste già un amministratore                                 |
| **Indirizzo email già in uso**            | `email_taken`                     | 409             | Un altro account ha l’indirizzo                              |
| **Non disponibile in questa modalità**    | `mode_not_supported`              | 409             | Non possibile in questa modalità del server                  |
| **Provider di pagamento non configurato** | `payment_provider_not_configured` | 409             | La fatturazione richiede un provider                         |
| **Modificato nel frattempo**              | `precondition_failed`             | 412             | Qualcun altro ha salvato prima di te                         |
| **Dimensione eccessiva**                  | `payload_too_large`               | 413             | Richiesta o file troppo grande                               |
| **Tipo non accettato**                    | `unsupported_media_type`          | 415             | Tipo di contenuto bloccato o non supportato                  |
| **Troppe richieste**                      | `rate_limited`                    | 429             | Rallenta                                                     |
| **Quota superata**                        | `quota_exceeded`                  | 429             | Quota del tenant o limite del piano esaurito                 |
| **Errore del server**                     | `internal`                        | 500 e superiori | Errore lato server                                           |
| **Richiesta non riuscita**                | `error`                           | altro           | Errore HTTP senza codice specifico                           |
| **Server non raggiungibile**              | `network_error`                   | nessuno         | Nessuna risposta dal server                                  |
| **Errore imprevisto**                     | `unknown`                         | altro           | Non riconosciuto                                             |

### Verifica i dati inseriti {#validation-failed}

**Cosa è successo:** il server ha controllato i valori che hai inviato e ne ha rifiutato almeno uno
(`validation_failed`, HTTP 422).

**Cause tipiche:** un campo obbligatorio è vuoto, un valore è troppo lungo, una chiave o uno slug
contiene caratteri non consentiti, un campo JSON non è un oggetto JSON, il nome di
un'autorizzazione è sconosciuto o non consentito per questo tipo di ruolo, una password non
rispetta la policy delle password del server.

**Cosa fare:** leggi i messaggi sotto i campi o nell'elenco sotto il titolo. Se nessun campo è
contrassegnato, apri **Dettagli tecnici**: il **Messaggio del server** indica la regola, per esempio
`permissions not allowed for a tenant role: tenants:read`. Correggi il valore e invia di nuovo.

### Richiesta non compresa {#bad-request}

**Cosa è successo:** il server non è riuscito affatto a interpretare la richiesta (`bad_request`,
HTTP 400), per esempio perché un valore aveva un formato errato.

**Cosa fare:** ricarica la pagina e ripeti l'azione. Se succede di nuovo, segnalalo con l'ID
richiesta; normalmente Studio invia solo richieste ben formate.

### Firma non valida {#invalid-signature}

**Cosa è successo:** il server ha rifiutato un webhook del fornitore di pagamenti perché la firma
non corrispondeva (`invalid_signature`, HTTP 400). Solo il fornitore di pagamenti chiama quell'endpoint;
non vedi questo codice per le tue azioni in Studio.

**Cosa fare:** niente in Studio. Un operatore verifica che il segreto del webhook nella
configurazione del server corrisponda a quello del fornitore di pagamenti. Vedi
[Piani e abbonamenti](help:plans-subscriptions).

### Accedi {#unauthenticated}

**Cosa è successo:** non hai effettuato l'accesso, oppure la tua sessione è terminata
(`unauthenticated`, HTTP 401).

**Cause tipiche:** una sessione termina dopo una durata massima (predefinito 12 ore), dopo un
periodo di inattività (predefinito 120 minuti), quando esci, quando tu o un amministratore la
revocate, quando il tuo account viene disattivato e (per le tue altre sessioni) quando cambi la
password. I tempi esatti sono stabiliti dal tuo operatore.

**Cosa fare:** Studio ti porta automaticamente alla pagina di accesso e poi ti riporta alla pagina
in cui eri. I dati non salvati nei moduli vanno persi. Vedi [Sessione terminata](#session-ended).

### Non consentito {#forbidden}

**Cosa è successo:** il server conosce te e l'elemento, ma rifiuta l'azione (`forbidden`, HTTP 403).

**Cause tipiche:**

- **Manca un'autorizzazione.** Il messaggio del server indica quale, per esempio
  `missing permission records:write`. Vedi il [riferimento delle autorizzazioni](help:permissions-reference)
  per sapere cosa consente ogni autorizzazione e quali ruoli predefiniti la possiedono.
- **Il prodotto è archiviato o il tenant è sospeso.** In tal caso possono ancora lavorarci solo gli
  amministratori della piattaforma (accesso completo) e i visualizzatori della piattaforma (accesso
  in lettura); tutti gli altri, chiavi API comprese, ricevono `the product or tenant is not active`.
- **Il tetto dei ruoli.** Hai cercato di assegnare un ruolo con autorizzazioni che non possiedi,
  oppure un ruolo di proprietario senza essere proprietario. Vedi
  [tetto dei ruoli](help:security#role-ceiling).
- **Autorizzazioni delle chiavi API.** Hai cercato di dare a una nuova chiave un'autorizzazione che
  non possiedi (`you cannot grant permissions you do not hold`).
- **Verifica dell'origine.** Il server ha rifiutato una richiesta perché Studio gira a un indirizzo
  che non considera attendibile (`cross-origin request refused`) oppure mancava il token di
  sicurezza (`missing or invalid CSRF token`). Vedi
  [L'accesso o il salvataggio fallisce con Non consentito](#csrf-origin).

**Cosa fare:** chiedi a un proprietario o a un amministratore del prodotto o del tenant di darti un
ruolo con l'autorizzazione mancante, oppure di riattivare il prodotto o il tenant. Di solito Studio
nasconde i pulsanti delle azioni che non puoi eseguire, ma l'ultima parola spetta sempre al server.

### Accedi di nuovo {#reauthentication-required}

**Cosa è successo:** l'azione è consentita solo entro pochi minuti dall'accesso
(`reauthentication_required`, HTTP 403). Oggi questo vale per l'impostazione di una prima password
per un account che finora accede solo tramite single sign-on.

**Cosa fare:** scegli **Accedi di nuovo**. Studio ti disconnette, apre la pagina di accesso e ti
riporta allo stesso punto; ripeti subito l'azione (finestra predefinita: 5 minuti). Se il tuo
operatore ha disattivato le prime password, l'azione non è mai possibile. Vedi
[Profilo](help:profile).

### Non trovato {#not-found}

**Cosa è successo:** il server risponde come se l'elemento non esistesse (`not_found`, HTTP 404).

**Cause tipiche:** l'elemento è stato eliminato, l'indirizzo contiene un errore di battitura o
proviene da un'altra installazione, oppure non hai alcun legame con il prodotto o il tenant. In
quest'ultimo caso Axentra mostra di proposito **Non trovato** invece di **Non consentito**, così
nessuno può scoprire quali prodotti, tenant o account esistono.

Quando aggiungi un utente esistente come membro, **Utente non trovato** significa che nessun
account _visibile per te_ ha questo indirizzo. Invia invece un invito (vedi
[Membri e inviti](help:members-invitations)).

**Cosa fare:** controlla l'indirizzo, torna all'elenco, oppure chiedi a qualcuno con accesso al
prodotto o al tenant di aggiungerti.

### Modulo non abilitato {#module-disabled}

**Cosa è successo:** l'azione richiede un modulo del server che è disattivato (`module_disabled`).

**Cosa fare:** chiedi al tuo operatore di abilitare il modulo nella configurazione del server. Il
[riferimento dei moduli](help:modules-reference) elenca cosa rende possibile ogni modulo.

### Azione non supportata {#method-not-allowed}

**Cosa è successo:** il server non offre questa azione a questo indirizzo (`method_not_allowed`,
HTTP 405). Studio invia solo richieste descritte dall'API del server, quindi probabilmente Studio e
server hanno versioni diverse.

**Cosa fare:** ricarica la pagina. Se succede di nuovo, segnalalo con l'ID richiesta e la versione
del server mostrata in fondo alla barra laterale.

### Conflitto {#conflict}

**Cosa è successo:** la richiesta è in conflitto con dati esistenti o con lo stato attuale
dell'elemento (`conflict`, HTTP 409). Il messaggio del server spiega il conflitto; Studio lo mostra
dopo il testo tradotto.

**Cause tipiche e soluzioni:**

| Messaggio del server (esempi)                                                                                 | Cosa fare                                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `a tenant with this slug exists in the product`, `a role with this key exists`, `a plan with this key exists` | Scegli un altro slug o un'altra chiave. Slug e chiavi sono univoci.                                        |
| `an open invitation for this email exists`                                                                    | Usa prima l'invito aperto, oppure revocalo.                                                                |
| `the tenant needs at least one owner`, `the product needs at least one owner`                                 | Assegna il ruolo di proprietario a un'altra persona prima di declassare o rimuovere l'ultimo proprietario. |
| `the role is assigned 3 times; reassign those members first`                                                  | Assegna a quei membri un altro ruolo, poi elimina il ruolo.                                                |
| `subscriptions use this plan; deactivate it instead`, `the meter has recorded usage; deactivate it instead`   | Disattiva invece di eliminare.                                                                             |
| `only failed or dead jobs can be retried`, `the job is already succeeded`                                     | Il job non è più in uno stato che consente l'azione; ricarica.                                             |
| `the delivery is already queued or in progress`                                                               | Attendi che la consegna in corso termini.                                                                  |

### La configurazione è già completata {#setup-already-completed}

**Cosa è successo:** la configurazione iniziale è stata inviata anche se il server ha già un
amministratore della piattaforma (`setup_already_completed`, HTTP 409), ad esempio perché qualcuno
l'ha completata nel frattempo in un'altra scheda.

**Cosa fare:** accedi con l'account di amministratore. Vedi
[Configurazione iniziale](help:first-run-setup).

### Indirizzo email già in uso {#email-taken}

**Cosa è successo:** un altro account ha già questo indirizzo email (`email_taken`, HTTP 409). Gli
indirizzi email sono univoci, senza distinzione tra maiuscole e minuscole.

**Cosa fare:** usa un altro indirizzo oppure accedi con l'account esistente. Durante la
configurazione iniziale succede quando l'accesso unico ha creato un account con l'indirizzo prima
del primo amministratore.

### Già utilizzata per una richiesta diversa {#idempotency-conflict}

Alcune azioni (accodare un job, pubblicare un evento, inviare una notifica, registrare utilizzo)
portano con sé una _chiave di idempotenza_, così un invio ripetuto non viene eseguito due volte. Se
la stessa chiave è già stata usata con altri valori, o da un altro chiamante, il server risponde
`409`. Studio mostra **Già utilizzata per una richiesta diversa** e genera per te una nuova chiave
oppure propone **Usa una nuova chiave**. Invia di nuovo per creare un nuovo elemento. Vedi la voce
del glossario [chiave di idempotenza](help:glossary#idempotency-key).

### Non disponibile in questa modalità {#mode-not-supported}

**Cosa è successo:** il server è in una modalità che non supporta l'azione (`mode_not_supported`).

**Cause tipiche:** creare o archiviare prodotti su un server in modalità a prodotto singolo;
cambiare il piano di un abbonamento gestito da Stripe (appartiene a Stripe: modificalo in Stripe,
ad esempio nel portale clienti, e Stripe aggiorna Axentra); oppure aprire la casella di posta locale
delle notifiche quando il server non usa il provider di posta locale per i test. Il messaggio del
server indica il caso.

**Cosa fare:** un abbonamento Stripe si modifica in Stripe. Altrimenti niente in Studio; un
operatore dovrebbe cambiare la configurazione del server. Vedi [Prodotti](help:products),
[Piani e abbonamenti](help:plans-subscriptions) e
[configurazione del server](help:server-configuration).

### Provider di pagamento non configurato {#payment-provider-not-configured}

**Cosa è successo:** un'azione di fatturazione, come il checkout di un piano a pagamento, richiede
un provider di pagamento, e il server non ne ha configurato nessuno
(`payment_provider_not_configured`).

**Cosa fare:** chiedi al tuo operatore di configurare il provider di fatturazione. Vedi
[Piani e abbonamenti](help:plans-subscriptions).

### Modificato nel frattempo {#precondition-failed}

**Cosa è successo:** hai modificato un elemento che qualcun altro ha salvato dopo che lo avevi
aperto (`precondition_failed`, HTTP 412). Studio invia la versione da cui sei partito; il server si
rifiuta di sovrascrivere la versione più recente, così nessuna modifica va persa senza che nessuno
se ne accorga.

**Cosa fare:** ricarica l'elemento, controlla la modifica dell'altra persona e ripeti la tua.

### Dimensione eccessiva {#payload-too-large}

**Cosa è successo:** la richiesta o il file è più grande di quanto il server accetti
(`payload_too_large`, HTTP 413).

**Limiti tipici:** corpi delle richieste di 10 MiB per impostazione predefinita (stabiliti
dall'operatore), un record di al massimo 256 KiB di JSON e file fino alla dimensione massima
consentita dal server. Il messaggio del server indica il limite, per esempio
`files may be at most 10485760 bytes`. (I payload dei job e i dati degli eventi, al massimo 64 KB
ciascuno, vengono invece rifiutati con **Verifica i dati inseriti**.)

**Cosa fare:** usa un file più piccolo o meno dati, oppure chiedi al tuo operatore del limite. Vedi
[File](help:files) e [Record](help:records).

### Tipo non accettato {#unsupported-media-type}

**Cosa è successo:** il server non accetta il tipo di contenuto (`unsupported_media_type`, HTTP
415). Molto spesso è stato bloccato il caricamento di un file: eseguibili, HTML, SVG e file di
script vengono bloccati in base a tipo, estensione del nome del file e contenuto.

**Cosa fare:** carica un tipo di file diverso, oppure comprimi il file in un archivio se il tuo
prodotto lo consente. Un prodotto può essere configurato per conservare i file bloccati come
allegati inerti invece di rifiutarli. Vedi [File](help:files).

### Troppe richieste {#rate-limited}

**Cosa è successo:** troppe richieste in poco tempo (`rate_limited`, HTTP 429).

**Cause tipiche:** troppi tentativi di accesso non riusciti per un account o da un indirizzo di
rete (predefinito: 10 tentativi falliti per account al minuto), oppure un limite generale delle
richieste attivato dal tuo operatore.

**Cosa fare:** attendi circa un minuto, poi riprova. Se continui a raggiungere il limite durante
l'accesso, controlla l'indirizzo email e la password, oppure usa il single sign-on se disponibile.

### Quota superata {#quota-exceeded}

**Cosa è successo:** una quota o un limite del piano è esaurito (`quota_exceeded`, HTTP 429), per
esempio la quota di archiviazione del tenant (byte o numero di file) o una quota di utilizzo.

**Cosa fare:** elimina dei file o attendi il prossimo periodo di utilizzo, oppure chiedi a qualcuno
con `tenants:update` (quota di archiviazione), `usage:manage` (quote di utilizzo) o
`billing:manage` (piani) di alzare il limite. Vedi [Utilizzo](help:usage) e [File](help:files).

### Errore del server {#internal}

**Cosa è successo:** il server, o un servizio alle sue spalle, ha avuto un errore durante
l'elaborazione della richiesta (`internal`, HTTP 500 o superiore). Per motivi di sicurezza il
server non mostra mai dettagli interni; l'ID richiesta collega la tua segnalazione alla voce di log
del server. Anche un `502`, `503` o `504` di un reverse proxy davanti al server compare come
**Errore del server**.

**Cosa fare:** riprova dopo un momento. La modifica potrebbe non essere stata salvata, quindi
controlla prima di ripetere azioni distruttive. Se continua a non funzionare, segnalalo al tuo
operatore con l'ID richiesta e l'orario.

### Richiesta non riuscita {#error}

**Cosa è successo:** il server ha rifiutato la richiesta con un errore HTTP senza un codice più
specifico (`error`).

**Cosa fare:** controlla il **Messaggio del server** e lo **Stato HTTP** in **Dettagli tecnici** e
riprova. Se continua a succedere, segnalalo con l'ID richiesta.

### Server non raggiungibile {#network-error}

**Cosa è successo:** Studio non ha ricevuto alcuna risposta (`network_error`): la connessione non è
riuscita o si è interrotta.

**Cosa fare:** controlla la connessione di rete e la VPN. Se gli altri siti funzionano, il server
Axentra potrebbe essere inattivo o in riavvio; controlla [Stato del sistema](help:health-monitoring)
quando risponde di nuovo, oppure chiedi al tuo operatore.

### Errore imprevisto {#unknown}

**Cosa è successo:** il server ha risposto con un errore che Studio non riconosce (`unknown`).

**Cosa fare:** riprova. Se continua a succedere, segnalalo con l'ID richiesta, il **Codice di
errore** e il **Messaggio del server** presi da **Dettagli tecnici**.

## Messaggi all'avvio {#startup}

Prima di mostrare qualsiasi cosa, Studio carica le informazioni del server, verifica la versione
dell'API e poi la tua sessione. I problemi in questa fase occupano l'intero schermo.

### Connessione al server Axentra… {#connecting}

Questa è la normale schermata di avvio. Se resta a lungo, il server è lento a rispondere o non è
raggiungibile; Studio mostra allora [Impossibile connettersi ad Axentra](#api-unreachable).

### Impossibile connettersi ad Axentra {#api-unreachable}

Studio non è riuscito a caricare le informazioni del server (`GET /v1/meta`). Sotto la spiegazione
vedi il titolo dell'errore e, se il server ha risposto, l'ID richiesta.

- **Server non raggiungibile**: il server è inattivo, in riavvio o bloccato dalla rete.
- **Errore del server** o **Non trovato**: Studio raggiunge _qualcosa_, ma non l'API di Axentra, per
  esempio un reverse proxy che non inoltra `/v1`, oppure un indirizzo dell'API errato nel file di
  configurazione di Studio (`/config.json`, impostazione `apiBaseUrl`).

**Cosa fare:** scegli **Riprova**. Se il problema persiste, un operatore deve verificare che il
server sia in esecuzione e che Studio punti all'indirizzo API corretto (vedi
[configurazione del server](help:server-configuration)).

### Versione del server incompatibile {#incompatible-version}

Studio e il server usano versioni diverse dell'API di Axentra. La schermata mostra la **Versione API
del server**, la **Versione API richiesta**, la versione del **Server** e la **Versione di Studio**,
insieme a uno di questi motivi:

- **Versione major diversa**: Studio e server appartengono a generazioni diverse.
- **Server troppo vecchio**: il server è più vecchio di quanto richieda questo Studio. Aggiorna il
  server, oppure usa uno Studio meno recente.
- **Versione illeggibile**: il server ha riportato una versione che Studio non riesce a
  interpretare.

**Cosa fare:** usa una release di Studio corrispondente alla versione API del server, oppure
aggiorna il server. Studio verifica la versione solo al caricamento della pagina: dopo un
aggiornamento del server, ricarica la pagina.

### Configura Axentra {#setup-required}

Un server appena installato non ha ancora un amministratore della piattaforma. Studio apre allora
**Configura Axentra** invece della pagina di accesso. Ti serve un token di configurazione monouso
che un operatore stampa sul server. Vedi [Configurazione iniziale](help:first-run-setup).

### Impossibile verificare la sessione {#session-check-failed}

Studio ha chiesto al server se hai effettuato l'accesso e ha ricevuto un errore invece di una
risposta (per esempio **Errore del server** o **Server non raggiungibile**). Scegli **Riprova**.
Non è la stessa cosa di una sessione terminata.

### Sessione terminata {#session-ended}

Quando una richiesta restituisce **Accedi**, Studio apre la pagina di accesso con la nota **Accedi
per riprendere da dove avevi interrotto.** Dopo l'accesso torni alla stessa pagina. Vedi
[Accesso](help:signing-in).

### Modulo non abilitato su questo server {#module-not-enabled}

Hai aperto un'area il cui modulo del server è disattivato. La pagina indica l'id del modulo che un
operatore deve abilitare (per esempio `storage` o `billing`). Nella barra laterale queste aree
hanno l'etichetta **Off**. Vedi il [riferimento dei moduli](help:modules-reference).

### Non ancora disponibile in Studio {#not-in-studio}

Il modulo è abilitato sul server, ma questa release di Studio non ha schermate per esso. Usa
direttamente l'API o una release di Studio più recente.

### Pagina non trovata {#page-not-found}

L'indirizzo non corrisponde a nessuna pagina di Studio: potrebbe contenere un errore di battitura,
oppure l'elemento è stato spostato o eliminato. Scegli **Vai alla pagina iniziale**.

### Si è verificato un problema {#something-went-wrong}

Non è stato possibile visualizzare la pagina, spesso perché è stata distribuita una versione più
recente di Studio mentre la tua scheda era aperta. Scegli **Ricarica pagina**. Se il problema
persiste, segnalalo indicando l'indirizzo della pagina.

## Situazioni comuni {#situations}

### Un'area mostra Off nella barra laterale {#menu-item-off}

Il modulo del server che la gestisce è disattivato. L'area si apre comunque e ti dice quale modulo
abilitare. Le aree che richiedono un prodotto (la maggior parte) compaiono solo dopo che hai scelto
un prodotto.

### Manca un pulsante o una scheda {#action-missing}

Studio nasconde le azioni e le schede che le tue autorizzazioni non consentono, per esempio **Nuovo
tenant** senza `tenants:create` o la scheda **Membri** senza `members:read`. Cerca l'autorizzazione
nel [riferimento delle autorizzazioni](help:permissions-reference) e chiedi un ruolo adatto. Alcune
azioni sono nascoste anche a causa della modalità del server (per esempio **Nuovo prodotto** in
modalità a prodotto singolo).

### Una pagina mostra Non consentito anche se puoi aprirla {#page-forbidden}

La barra laterale mostra quasi tutte le aree (solo **Registro di audit** è nascosto senza
un'autorizzazione di audit); se puoi leggerne i dati viene deciso quando la pagina si carica.
Un'area senza l'autorizzazione di lettura mostra **Non consentito** con l'autorizzazione mancante
nel messaggio del server.

### L'accesso o il salvataggio fallisce con Non consentito {#csrf-origin}

Se l'accesso o ogni modifica falliscono con **Non consentito** e il messaggio del server riporta
`cross-origin request refused` o `missing or invalid CSRF token`, Studio gira a un indirizzo che il
server non considera attendibile, oppure il tuo browser blocca il cookie di sessione. Un operatore
deve aggiungere l'indirizzo di Studio alle origini consentite del server. Quando Studio e l'API si
trovano su indirizzi diversi, entrambi devono appartenere allo stesso sito (per esempio
`studio.example.com` e `api.example.com`). Vedi [Sicurezza](help:security#sessions-csrf).

### L'accesso non riesce {#sign-in-fails}

**Accesso non riuscito** con "L'indirizzo email o la password non sono corretti." compare sia per
una password errata _sia_ per un indirizzo sconosciuto; il server non rivela quale dei due. Dopo
troppi tentativi vedi [Troppe richieste](#rate-limited). Un account disattivato non può accedere in
alcun modo. Vedi [Accesso](help:signing-in).

### Un segreto mostrato una sola volta è andato perso {#secret-lost}

I segreti delle chiavi API, i segreti di firma dei webhook e i link di invito vengono mostrati una
sola volta e non possono essere visualizzati di nuovo. Ruota il segreto o crea un nuovo invito.
Vedi [Chiavi API](help:api-keys), [Webhook](help:webhooks) e
[Membri e inviti](help:members-invitations).

### Problemi specifici delle funzionalità {#feature-problems}

Ogni articolo dedicato a una funzionalità ha una propria sezione di risoluzione dei problemi, per
esempio per job che restano in attesa, consegne webhook che non riescono, caricamenti rifiutati o
inviti che non arrivano: [Job](help:jobs), [Pianificazioni](help:schedules),
[Webhook](help:webhooks), [File](help:files), [Notifiche](help:notifications),
[Piani e abbonamenti](help:plans-subscriptions).
