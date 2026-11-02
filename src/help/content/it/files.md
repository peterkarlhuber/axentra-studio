---
title: File
summary: Carica, trova, scarica, condividi ed elimina i file di un tenant, e gestisci la sua quota di spazio, i limiti di dimensione e la policy sui tipi di contenuto.
keywords: file, caricare, upload, scaricare, download, allegati, documenti, archiviazione, quota, spazio su disco, dimensione file, tipo di contenuto, tipo MIME, link di download, link di condivisione, URL firmato, URL prefirmato, S3, etichette, metadati, scadenza, inerte, tipi bloccati
---

La schermata **File** mostra i file che un tenant ha conservato tramite il modulo di archiviazione
di Axentra: documenti, immagini, esportazioni o qualsiasi altro allegato caricato dalla tua
applicazione. Puoi caricare file manualmente, trovarli per nome, tipo o etichetta, scaricarli, creare
un link di download temporaneo, rinominarli ed eliminarli. La schermata mostra anche quanta parte
della sua quota di spazio il tenant sta usando.

Un file appartiene sempre esattamente a un tenant. Il suo contenuto non può essere modificato dopo il
caricamento; per sostituire un file, caricane uno nuovo ed elimina quello vecchio. Il nome e le
etichette possono essere modificati.

> [!IMPORTANT]
> La schermata richiede il modulo del server `storage`. Visualizzare e scaricare richiede
> `files:read` nel tenant; caricare, modificare ed eliminare richiede `files:write`. I ruoli di
> tenant **Owner**, **Admin** e **Member** concedono entrambe, **Viewer** può solo leggere. Ruoli di
> prodotto: **Product owner** e **Product admin** possono scrivere in ogni tenant, **Support** e
> **Product viewer** possono leggere. Modificare la quota di un tenant richiede `tenants:update`
> (**Product owner**, **Product admin**). Vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Consultare i file di un tenant {#browse}

1. Apri **Dati e archiviazione** › **File** ([apri la schermata](app:files)).
2. Scegli un **Tenant**.

La pagina mostra l'**Utilizzo dello spazio** del tenant e l'elenco **File memorizzati**, dai più
recenti, 50 per pagina. Vengono elencati solo i file attivi e non scaduti. Seleziona le intestazioni
di colonna **Nome**, **Dimensione** o **Caricato** per ordinare. Seleziona il nome di un file per
aprirne i [dettagli](#details); il menu **…** di ogni riga offre **Dettagli**, **Scarica** ed
**Elimina file**.

### Filtrare i file {#filter}

| Filtro                                                              | Che cosa trova                                                                                                                                     |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Il nome contiene**                                                | Una parte del nome, senza distinzione tra maiuscole e minuscole.                                                                                   |
| **Tipo di contenuto**                                               | Un tipo esatto (`application/pdf`) o una famiglia (`image/*`).                                                                                     |
| **Caricato da**                                                     | L'ID dell'utente (`usr_…`) o della chiave API che ha caricato il file.                                                                             |
| **Etichetta** e **Uguale a**, poi **Aggiungi filtro per etichetta** | File le cui etichette contengono questa chiave con questo valore. `true`, `42` e `null` corrispondono in base al tipo, l'altro testo come stringa. |

Tutti i filtri devono corrispondere. Rimuovi un filtro per etichetta con la **×** sul suo chip.

## Caricare un file {#upload}

1. Scegli il tenant e seleziona **Carica file**.
2. In **File**, scegli il file. Studio ne mostra nome, dimensione e tipo, e le regole applicate dal
   server (dimensione massima, tipi consentiti e bloccati).
3. Campi facoltativi:
   - **Nome visualizzato**: il nome mostrato negli elenchi e usato per i download. Per impostazione
     predefinita è il nome del file.
   - **Etichette (metadati)**: un oggetto JSON piatto come `{"kind": "invoice", "year": 2026}` (vedi
     [Etichette](#labels)).
   - **Scade il**: dopo questo momento il file viene nascosto e in seguito rimosso (vedi
     [Scadenza](#expiry)).
4. Seleziona **Carica**. Una barra di avanzamento mostra il trasferimento; **Annulla caricamento** lo
   interrompe.

Il server verifica di nuovo tutto, indipendentemente da ciò che mostra Studio. I file vuoti vengono
rifiutati.

### Limite di dimensione {#size-limit}

Ogni file può essere grande al massimo quanto la **Dimensione massima dei file** del server
(predefinita 50 MiB, impostata dall'operatore in `storage.max_file_bytes`). Il server smette di
leggere non appena un caricamento la supera. Studio avvisa prima del caricamento se conosce il
limite; lo conosce solo se puoi leggere le impostazioni del server (`platform:settings` o
`product:manage`). Altrimenti la finestra indica che il server verifica dimensione, tipo e quota
durante il caricamento.

### Tipi consentiti e bloccati {#content-types}

Due regole stabiliscono se un tipo di file viene accettato:

- **Tipi bloccati.** Eseguibili, HTML, XHTML, SVG, JavaScript, script di shell e PHP e file simili
  sono bloccati, riconosciuti in base al tipo dichiarato, all'estensione del file e al contenuto
  (anche qualsiasi file che inizia con `#!`). A seconda della policy sui tipi di contenuto del
  prodotto, un file bloccato viene rifiutato oppure conservato come [allegato inerte](#inert). I
  responsabili del prodotto impostano la policy nella tab **File** del prodotto; vedi
  [Impostare la policy sui tipi di contenuto](help:data-overview#content-type-policy).
- **Tipi consentiti.** Se l'operatore ha configurato un elenco di tipi consentiti
  (`storage.allowed_content_types`), vengono accettati solo questi tipi, per esempio
  `image/*, application/pdf`. Senza un elenco, vengono accettati tutti i tipi tranne quelli bloccati.

Il tipo indicato dal browser è solo un'indicazione: il server esamina i primi byte e usa il tipo
rilevato quando quello dichiarato manca, è generico o è chiaramente errato.

### Allegati inerti {#inert}

Quando la policy conserva un file bloccato invece di rifiutarlo, il file viene memorizzato come
`application/octet-stream` e contrassegnato come **Memorizzato come inerte** nei suoi dettagli,
insieme al tipo con cui è stato caricato. Un file di questo tipo viene sempre e solo scaricato come
allegato, mai aperto nel browser. Rinominare un file con un'estensione bloccata (per esempio
`.html`) segue la stessa policy: la modifica viene rifiutata oppure il file diventa inerte.

### Etichette {#labels}

Le etichette sono coppie chiave/valore tue per trovare e raggruppare i file, come
`{"kind": "invoice"}`. Regole: un oggetto JSON piatto, al massimo 64 chiavi; chiavi da 1 a 64
caratteri composte da lettere, cifre e `_ . : -`; i valori sono testo (al massimo 1024 caratteri),
numeri, `true`/`false` o `null`; al massimo 8 KiB in totale. Non inserire segreti nei nomi o nelle
etichette: compaiono nel registro di audit.

## Quota di spazio {#quota}

La scheda **Utilizzo dello spazio** confronta i byte e il numero di file del tenant con la sua quota
effettiva. L'indicatore assume un colore di avviso all'80 % e un colore critico al 95 %. La riga
sottostante indica da dove proviene la quota: **Quota impostata per questo tenant**, **Quota
ereditata dal valore predefinito del prodotto o del server** oppure **Nessuna quota: illimitato**.
Come vengono determinati i valori predefiniti è spiegato in
[Panoramica dati](help:data-overview#quotas).

Quando una quota viene raggiunta, gli ulteriori caricamenti vengono rifiutati; i file esistenti
restano.

### Modificare la quota di un tenant {#edit-quota}

1. Nella scheda **Utilizzo dello spazio**, seleziona **Modifica quota**.
2. Inserisci un **Limite di spazio** con la sua **Unità** (MiB, GiB, TiB) e/o un **Limite di file**.
   Lascia vuoto un campo per ereditare il valore predefinito del prodotto o del server; `0` blocca
   tutti i caricamenti.
3. Seleziona **Salva**.

Un limite inferiore all'utilizzo attuale è consentito: i file esistenti restano, i nuovi caricamenti
vengono rifiutati. Se qualcuno ha modificato la quota dopo che hai aperto la finestra, il
salvataggio viene rifiutato con **Modificato nel frattempo**; ricarica e riprova. Le modifiche delle
quote vengono registrate nell'audit (`storage.quota.update`).

## Dettagli del file {#details}

Seleziona il nome di un file per aprirne i dettagli: **Nome**, **ID**, **Stato**, **Tipo di
contenuto**, **Memorizzato come inerte** (solo per i file inerti), **Dimensione**, checksum
**SHA-256**, **Versione**, **Caricato da**, **Caricato**, **Aggiornato**, **Scadenza** e le
etichette. Lo SHA-256 ti permette di verificare che una copia scaricata sia identica al file
conservato.

Lo **Stato** di un file elencato è sempre `active`. Internamente un file è `pending` mentre i suoi
byte vengono scritti e `deleted` dopo l'eliminazione; nessuno dei due compare nell'elenco.

## Scaricare un file {#download}

Seleziona **Scarica** nei dettagli o nel menu **…** della riga. Studio chiede al server un link di
download di breve durata e avvia il download con esso. I file vengono sempre scaricati come allegati,
mai aperti nel browser. I download non vengono registrati nel registro di audit.

## Condividere un link di download {#download-links}

1. Apri i dettagli del file e seleziona **Crea link di download**.
2. Copia il **Link di download** e inoltralo.

> [!CAUTION]
> Chiunque abbia il link può scaricare il file fino alla scadenza, senza eseguire l'accesso. Un link
> non può essere revocato singolarmente; eliminare il file lo rende inutilizzabile. Condividi i link
> solo con il destinatario previsto, tramite un canale di cui ti fidi.

### Per quanto tempo funziona un link {#link-expiry}

Il link scade al momento indicato in **Scadenza**. Studio richiede sempre la durata massima consentita
dal server: `storage.signed_url_ttl_seconds`, per impostazione predefinita 300 secondi (5 minuti),
configurabile tra 10 secondi e 24 ore. Un link non sopravvive mai alla scadenza propria del file.

Esistono due tipi di link, a seconda della configurazione del server:

| Tipo                                                                      | URL                                                                                          | Smette di funzionare quando                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Link Axentra firmato (predefinito)                                        | L'URL pubblico del server + `/v1/files/download/…`                                           | Scade, il file viene eliminato o scade, oppure il tenant o il prodotto viene sospeso o archiviato |
| Link S3 prefirmato (contrassegnato come **prefirmato dall'object store**) | Punta direttamente al bucket S3; solo con il backend S3 e `s3_presigned_downloads` abilitato | Scade oppure il file viene eliminato. La sospensione del tenant **non** lo rende inutilizzabile   |

## Rinominare un file o modificarne le etichette {#edit}

1. Apri i dettagli e seleziona **Modifica nome ed etichette**.
2. Modifica il **Nome** e/o il JSON delle **Etichette (metadati)**. Le etichette che salvi
   sostituiscono tutte quelle precedenti.
3. Seleziona **Salva**.

Il contenuto non può essere modificato. Se nel frattempo qualcun altro ha modificato il file, il
salvataggio viene rifiutato con **Modificato nel frattempo**.

## Eliminare un file {#delete}

1. Seleziona **Elimina file** nei dettagli o nel menu **…** della riga.
2. Conferma con **Elimina file**.

Il file scompare subito per tutti, la sua quota viene liberata e i link di download esistenti
smettono di funzionare. Il server elimina quindi l'oggetto conservato.

> [!CAUTION]
> L'eliminazione non può essere annullata. Si tratta di un'eliminazione logica a livello di
> archiviazione: a seconda del backend, i byte possono restare sul disco finché lo spazio non viene
> riutilizzato, oppure come versioni precedenti dell'oggetto in un bucket S3 con versioning. I backup
> del database e il registro di audit conservano nome, dimensione e checksum del file. Se i file
> eliminati devono essere irrecuperabili, gli operatori hanno bisogno della crittografia del disco o
> di regole di ciclo di vita del bucket; vedi [Sicurezza](help:security).

## Scadenza {#expiry}

Un file con **Scade il** impostato scompare da elenchi, dettagli e link di download nel momento in
cui quell'orario passa. La pulizia del server (`axentra storage purge`, pianificata dall'operatore)
lo rimuove in seguito; fino ad allora i suoi byte continuano a essere conteggiati nella quota.
L'orario di scadenza può essere impostato solo al caricamento e non può essere modificato in seguito
in Studio.

## Backend di archiviazione e scansione {#backends}

Dove risiedono i contenuti dei file è un'impostazione del server, mostrata nella
[Panoramica dati](help:data-overview#storage-configuration):

- `local`: una directory sul server (predefinita `./var/storage`).
- `s3`: Amazon S3 o un servizio compatibile con S3, facoltativamente con crittografia lato server.

Cambiare il backend non migra i file esistenti. Axentra calcola uno SHA-256 per ogni file, ma **non**
analizza i file alla ricerca di malware e non ispeziona gli archivi. Se ti serve una scansione,
eseguila nella tua applicazione o in un job dopo il caricamento.

## Risoluzione dei problemi {#troubleshooting}

**File troppo grande.** Il file supera la dimensione massima dei file del server. Comprimilo o
dividilo, oppure chiedi a un operatore di aumentare `storage.max_file_bytes`.

**Tipo di file non accettato.** Il file è di un tipo bloccato (eseguibile, HTML, SVG, script), la
sua estensione o il suo contenuto lo fanno sembrare tale, oppure non è nell'elenco dei tipi
consentiti del server. Controlla le regole nella finestra di caricamento. Un responsabile del
prodotto può conservare i file bloccati come allegati inerti
([policy sui tipi di contenuto](help:data-overview#content-type-policy)).

**Quota di spazio esaurita.** Il tenant ha raggiunto la sua quota di byte o di file. Elimina dei
file oppure chiedi a un proprietario o amministratore del prodotto di
[aumentare la quota](#edit-quota). I file scaduti vengono conteggiati fino alla pulizia successiva.

**Nessun accesso ai file di questo tenant.** I tuoi ruoli non concedono `files:read` in questo
tenant. Chiedi un ruolo a un proprietario del prodotto o al proprietario del tenant.

**Manca Carica file.** Non possiedi `files:write` in questo tenant, oppure non è selezionato alcun
tenant.

**Conflitto: il caricamento ha richiesto troppo tempo.** Il caricamento è rimasto incompleto più a
lungo del timeout del server (predefinito un'ora) ed è stato scartato. Caricalo di nuovo con una
connessione più veloce.

**Verifica i dati inseriti.** Le etichette non sono un oggetto JSON piatto o violano le
[regole delle etichette](#labels), oppure **Scade il** è nel passato.

**Modificato nel frattempo.** Qualcuno ha rinominato, rietichettato o eliminato il file, oppure ha
modificato la quota, dopo che lo hai aperto. Ricarica e ripeti.

**Un link di download restituisce "Non trovato".** È scaduto, il file è stato eliminato o è
scaduto, oppure il tenant o il prodotto è stato sospeso o archiviato. Crea un nuovo link. Il server
risponde di proposito allo stesso modo in tutti questi casi.

**Il link copiato punta all'host sbagliato.** I link firmati vengono costruiti a partire dall'URL
pubblico del server (`security.public_url`). Chiedi a un operatore di impostarlo sull'indirizzo che
i destinatari possono raggiungere.

**La finestra di caricamento non mostra il limite di dimensione o i tipi consentiti.** Non puoi
leggere le impostazioni del server. Il server le applica comunque; il suo messaggio di errore indica
quale regola non è stata rispettata.
