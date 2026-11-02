---
title: Panoramica dati
summary: Scopri quali raccolte di record e file conserva un prodotto, quanto spazio usa ogni tenant e quali impostazioni di archiviazione e conservazione applica il server.
keywords: dati, archiviazione, spazio, raccolte, statistiche, quota, spazio su disco, conservazione, backup, policy sui tipi di contenuto, tipi di file bloccati, backend di archiviazione, S3, archiviazione locale
---

La **Panoramica dati** mostra, per il prodotto corrente, che cosa è conservato e secondo quali
regole: le raccolte di record in cui scrivono i tenant, lo spazio per i file che ogni tenant usa
rispetto alla sua quota, la configurazione dell'archiviazione del server e i periodi di conservazione
riportati dal server. È una pagina di sola lettura: non modifica nulla. Le quote si modificano nella
schermata [File](help:files#quota) e la policy sui tipi di contenuto nella tab **File** del prodotto
(vedi [Impostare la policy sui tipi di contenuto](#content-type-policy)).

Gli operatori di prodotto la usano per rispondere a domande come "quale tenant è vicino alla sua
quota di spazio?", "quali raccolte esistono?" e "per quanto tempo il server conserva gli eventi di
audit?".

> [!IMPORTANT]
> La pagina richiede il modulo del server `data` (record). La scheda **Archiviazione file** richiede
> anche il modulo `storage`. Le statistiche richiedono l'autorizzazione `collections:read`, concessa
> dai ruoli di prodotto **Product owner**, **Product admin**, **Support** e **Product viewer**, oltre
> che dai ruoli nella piattaforma. Le schede **Configurazione dell'archiviazione** e
> **Conservazione** richiedono `platform:settings` o `product:manage`. Vedi
> [Ruoli e autorizzazioni](help:roles-permissions).

## Aprire la panoramica dati {#open}

1. Seleziona un prodotto.
2. Nella barra laterale, apri **Dati e archiviazione** e scegli **Panoramica dati**
   ([apri la schermata](app:dataOverview)).

Se la barra laterale contrassegna la voce con **Off**, il modulo `data` non è abilitato sul server.
Un operatore abilita i moduli nella [configurazione del server](help:server-configuration).

## Che cosa mostra la pagina {#what-you-see}

| Scheda                                | Contenuto                                                                              | Mostrata quando                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Raccolte di record**                | Numero di raccolte e di record, poi una riga per ogni raccolta                         | Possiedi `collections:read`                                                       |
| **Archiviazione file**                | Byte e file usati dall'intero prodotto, le quote predefinite, una riga per ogni tenant | Possiedi `collections:read` e il modulo `storage` è abilitato                     |
| **Configurazione dell'archiviazione** | Backend, dimensione massima dei file, tipi consentiti e bloccati                       | Possiedi `platform:settings` o `product:manage` e il modulo `storage` è abilitato |
| **Conservazione**                     | Per quanto tempo il server conserva gli eventi di audit e i job completati             | Possiedi `platform:settings` o `product:manage`                                   |

Senza `collections:read` la pagina mostra **Statistiche del prodotto non disponibili**. I membri dei
tenant (ruoli **Owner**, **Admin**, **Member**, **Viewer** di un tenant) non hanno questa
autorizzazione, perché rivelerebbe i dati di altri tenant. Lavorano con i dati del proprio tenant in
[Record](help:records) e [File](help:files).

## Raccolte di record {#collections}

Una _raccolta_ è un gruppo di record JSON con un nome, come `orders` o `contacts`. Le raccolte non
vengono create né configurate separatamente: una raccolta esiste non appena vi viene scritto un
record e scompare quando viene eliminato il suo ultimo record. Vedi [Record](help:records#collections).

La tabella elenca tutte le raccolte del prodotto, su tutti i tenant:

| Colonna             | Significato                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| **Raccolta**        | Nome della raccolta. Selezionala per aprirla nella schermata **Record**.     |
| **Record**          | Numero di record in questa raccolta, sommati su tutti i tenant.              |
| **Tenant**          | Numero di tenant che hanno almeno un record in questa raccolta.              |
| **Ultima modifica** | Momento della creazione o dell'aggiornamento più recente in questa raccolta. |

Se la tabella è vuota (**Ancora nessuna raccolta**), in questo prodotto non è ancora stato scritto
alcun record.

## Spazio per tenant {#storage-per-tenant}

La scheda **Archiviazione file** inizia con quattro valori: **Spazio utilizzato** e **File** per
l'intero prodotto (solo file attivi), e la **Quota di spazio predefinita** e la **Quota di file
predefinita** che valgono per ogni tenant senza una quota propria.

La tabella **Utilizzo dello spazio per tenant** ha una riga per tenant (50 per pagina, **Carica
altro** per il resto):

| Colonna                                 | Significato                                                                                                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**                              | Seleziona il nome per aprire i file del tenant.                                                                                                                                                                              |
| **Spazio** / **File**                   | Byte e numero dei file attivi del tenant.                                                                                                                                                                                    |
| **Quota di spazio** / **Quota di file** | Il limite effettivo e quanto ne è usato. **Illimitato** significa che non si applica alcun limite. Il badge **Tenant** contrassegna una quota impostata per questo tenant; senza badge il tenant eredita quella predefinita. |

### Come viene determinata la quota effettiva {#quotas}

Ciascuno dei due limiti (byte e file) viene determinato separatamente, in questo ordine:

1. La quota propria del tenant, impostata con **Modifica quota** nella schermata
   [File](help:files#quota).
2. Il valore predefinito del prodotto: `quota_bytes` / `quota_files` nella sezione `storage` delle
   impostazioni del prodotto (pagina del prodotto, tab **Impostazioni**, campo **Impostazioni
   (JSON)**).
3. Il valore predefinito dell'installazione: `storage.default_quota_bytes` /
   `storage.default_quota_files` nella configurazione del server.
4. Altrimenti: illimitato.

```json
{ "storage": { "quota_bytes": 10737418240, "quota_files": 10000 } }
```

L'esempio imposta come valore predefinito del prodotto 10 GiB (in byte) e 10.000 file.

> [!NOTE]
> L'utilizzo conta i file _attivi_. Un file la cui scadenza è passata scompare immediatamente, ma i
> suoi byte continuano a essere conteggiati finché non è stata eseguita la pulizia del server (un
> operatore pianifica `axentra storage purge`, per esempio ogni 15 minuti).

## Configurazione dell'archiviazione {#storage-configuration}

Questa scheda mostra le impostazioni effettive del server. Fanno parte della configurazione del
server e non possono essere modificate in Studio.

| Impostazione                    | Che cosa fa                                                                                                                                        | Predefinito |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Backend**                     | Dove vengono conservati i contenuti dei file: `local` (una directory sul server) o `s3` (Amazon S3 o un servizio compatibile con S3).              | `local`     |
| **Dimensione massima dei file** | Limite rigido per file, verificato durante il trasferimento del caricamento.                                                                       | 50 MiB      |
| **Tipi consentiti**             | Elenco dei tipi di contenuto consentiti (`image/png`, `image/*`). **Tutti i tipi tranne quelli bloccati** significa che l'elenco è vuoto.          | vuoto       |
| **Tipi bloccati**               | Che cosa succede a eseguibili, HTML, SVG e script in questo prodotto, e se è **Impostata per questo prodotto** o **Ereditata dall'installazione**. | rifiuto     |

Cambiare il backend non sposta i file esistenti. Per sviluppatori e operatori, tutte le chiavi della
sezione `[storage]` sono descritte in [Configurazione del server](help:server-configuration).

## Impostare la policy sui tipi di contenuto {#content-type-policy}

Alcuni tipi di file possono eseguire codice quando qualcuno li apre: eseguibili, HTML, XHTML, SVG,
JavaScript, script di shell e PHP. Axentra li _blocca_. La policy sui tipi di contenuto stabilisce,
per ogni prodotto, che cosa succede a un caricamento bloccato: viene rifiutato oppure conservato come
_allegato inerte_, cioè come `application/octet-stream` opaco che può essere solo scaricato, mai
visualizzato.

1. Apri il prodotto: **Prodotti**, poi il nome del prodotto.
2. Scegli la tab **File**. (La tab è nascosta quando il modulo `storage` non è abilitato.)
3. In **Policy sui tipi di contenuto dei file**, scegli il comportamento e gli elenchi (tabella
   sotto).
4. Scegli **Salva**.

| Impostazione                                  | Che cosa fa                                                                                                                                                                                                                                                                                                                                                       | Valori consentiti / predefinito                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Tipi di file bloccati**                     | **Rifiuta il caricamento** (chi carica riceve un errore) oppure **Memorizza come allegato inerte**. **Predefinito dell'installazione** segue l'impostazione del server `storage.store_blocked_as_inert`.                                                                                                                                                          | Predefinito: predefinito dell'installazione                       |
| **Estensioni accettate come allegati inerti** | Estensioni bloccate che vengono conservate come allegati inerti anche quando i caricamenti vengono altrimenti rifiutati. La decisione si basa sull'estensione del nome del file, anche quando a essere bloccato è il contenuto (uno script `#!` chiamato `run.sh`, con `sh` in elenco, viene conservato; lo stesso contenuto chiamato `run.txt` viene rifiutato). | Separate da virgole, senza punto: `html, sh`. Al massimo 100 voci |
| **Estensioni bloccate in aggiunta**           | Estensioni bloccate in aggiunta all'elenco predefinito.                                                                                                                                                                                                                                                                                                           | `py, rb`. Al massimo 100 voci                                     |
| **Tipi di contenuto bloccati in aggiunta**    | Tipi di contenuto bloccati in aggiunta all'elenco predefinito.                                                                                                                                                                                                                                                                                                    | `text/x-python`. Al massimo 100 voci                              |

La sezione **Sempre bloccati** elenca le estensioni e i tipi di contenuto predefiniti. Un prodotto
può bloccarne altri o conservare i file bloccati come allegati inerti, ma non può mai sbloccarli.

> [!IMPORTANT]
> Per visualizzare la policy serve `product:read`; per modificarla serve `product:manage` (ruoli
> **Product owner** e **Product admin**). I prodotti archiviati sono in sola lettura.

> [!NOTE]
> L'elenco **Tipi consentiti** dell'installazione continua ad applicarsi dopo la policy: se l'elenco
> dei tipi consentiti non contiene `application/octet-stream`, anche i file inerti vengono
> rifiutati.

La policy viene verificata in tre modi: in base al tipo di contenuto dichiarato, all'estensione del
nome del file e ai primi byte del contenuto (eseguibili, HTML, SVG e qualsiasi file che inizia con
`#!`). Rinominare un file con un'estensione bloccata segue la stessa policy. Le modifiche vengono
registrate nel registro di audit come `storage.policy.update`. Dettagli per chi carica file:
[File](help:files#content-types).

## Conservazione {#retention}

| Impostazione          | Che cosa significa                                                                                                                                                          | Predefinito |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Registro di audit** | Giorni per cui il server conserva gli eventi di audit (`observability.audit_retention_days`).                                                                               | 365 giorni  |
| **Job completati**    | Giorni per cui il server conserva i job completati (riusciti, non riusciti, esauriti o annullati) e le consegne di webhook completate (`observability.job_retention_days`). | 30 giorni   |

Record e file non hanno un periodo di conservazione: restano finché qualcuno non li elimina, finché
non passa la scadenza propria di un file o finché il tenant non viene eliminato (cosa che elimina
tutti i suoi dati).

## Backup {#backups}

La scheda **I backup non vengono riportati** è intenzionale: l'API non riporta né lo stato dei
backup né per quanto tempo vengono conservati i metadati dei file eliminati. Entrambi fanno parte
della gestione del server. Per impostazione predefinita la pulizia rimuove le righe di metadati dei
file eliminati dopo 30 giorni; i backup del database e il registro di audit conservano più a lungo
il nome, la dimensione e il checksum di un file eliminato.

## Risoluzione dei problemi {#troubleshooting}

**Statistiche del prodotto non disponibili.** I tuoi ruoli non concedono `collections:read`. Chiedi
a un proprietario del prodotto un ruolo di prodotto, oppure usa [Record](help:records) e
[File](help:files) per il tuo tenant.

**Modulo di archiviazione non abilitato.** Il server non esegue il modulo `storage`, quindi non è
possibile conservare file. Un operatore aggiunge `storage` ai moduli abilitati; vedi
[Riferimento dei moduli](help:modules-reference).

**Mancano le schede Configurazione dell'archiviazione e Conservazione.** Richiedono
`platform:settings` o `product:manage`. I visualizzatori del prodotto e il personale di supporto non
le vedono.

**Un tenant mostra un utilizzo maggiore della somma dei suoi file.** I file scaduti vengono
conteggiati fino alla pulizia successiva. Chiedi a un operatore se `axentra storage purge` viene
eseguito regolarmente.

**Il salvataggio della policy sui tipi di contenuto non riesce con "Modificato nel frattempo".**
Qualcuno ha modificato il prodotto (impostazioni, nome o policy) dopo che hai aperto la pagina.
Ricarica la pagina e applica di nuovo la modifica.

**Il salvataggio della policy non riesce con "Verifica i dati inseriti".** Una voce non è
un'estensione valida (lettere minuscole, cifre, `_`, `+` o `-`, al massimo 16 caratteri, senza
punto) né un tipo di contenuto valido (`type/subtype`), oppure un elenco ha più di 100 voci. Il
messaggio sotto il campo indica il problema.

**Non trovato all'apertura della pagina.** Il modulo `data` è disattivato, oppure il prodotto è
archiviato e non sei amministratore della piattaforma.
