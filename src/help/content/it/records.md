---
title: Record
summary: Consulta, filtra, crea, modifica ed elimina i record JSON che i tenant conservano nelle raccolte, e risolvi i conflitti "Modificato nel frattempo".
keywords: record, dati, JSON, documenti, raccolta, voci, righe, database, filtro, versione, conflitto, 412, If-Match, concorrenza ottimistica
---

I _record_ sono piccoli oggetti JSON che la tua applicazione conserva tramite l'API di Axentra, per
esempio ordini, note o impostazioni, senza bisogno di una propria tabella di database. Ogni record
appartiene esattamente a un tenant e a una _raccolta_ (un gruppo con un nome, come `orders`). La
schermata **Record** ti permette di esaminare questi dati, trovare i record in base al loro contenuto
e, con l'autorizzazione di scrittura, correggere o aggiungere record manualmente.

> [!IMPORTANT]
> La schermata richiede il modulo del server `data`. La lettura richiede `records:read` nel tenant;
> creare, modificare ed eliminare richiede `records:write`. I ruoli di tenant **Owner**, **Admin** e
> **Member** concedono entrambe; **Viewer** può solo leggere. I ruoli di prodotto **Product owner** e
> **Product admin** possono scrivere in ogni tenant; **Support** e **Product viewer** possono leggere
> in ogni tenant. L'elenco di tutte le raccolte richiede `collections:read` (solo ruoli di prodotto).
> Vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Raccolte e record {#collections}

- Una **raccolta** viene creata scrivendovi il primo record e scompare quando viene eliminato il suo
  ultimo record. Non c'è nulla da configurare. I nomi usano lettere minuscole, cifre e trattini
  bassi, iniziano con una lettera e hanno al massimo 63 caratteri (`orders`, `support_notes`).
- Un **record** ha un **ID** (`rec_…`), i suoi **Dati** (un oggetto JSON), una **Versione** (parte
  da 1 e aumenta a ogni modifica), gli orari **Creato**/**Aggiornato** e l'utente o la chiave API che
  lo ha creato e modificato per ultimo (**Creato da**, **Aggiornato da**).
- Lo stesso nome di raccolta in due tenant contiene due insiemi di record separati. Studio mostra
  sempre un tenant alla volta; il server garantisce la separazione.

## Consultare i record {#browse}

1. Apri **Dati e archiviazione** › **Record** ([apri la schermata](app:records)).
2. Scegli un **Tenant** in alto.
3. Scegli una raccolta nell'elenco **Raccolte** a sinistra. Il numero accanto conta i suoi record in
   tutti i tenant.

La tabella mostra **ID**, un'anteprima abbreviata dei **Dati**, **Versione**, **Creato** e
**Aggiornato**, dai più recenti, 50 per pagina; **Carica altro** recupera la pagina successiva.
Seleziona l'icona dell'occhio (**Visualizza record …**) per aprire il record con tutti i campi e il
JSON completo e formattato.

> [!TIP]
> Nella pagina di un tenant, **Consulta record** apre questa schermata con il tenant già
> selezionato. Nella [Panoramica dati](help:data-overview#collections), selezionando una raccolta la
> apri qui.

Se non hai un ruolo di prodotto, Studio non può elencare le raccolte del prodotto. Inserisci invece
il nome della raccolta in **Nome della raccolta** e scegli **Apri**.

### Ordinare {#sort}

Seleziona le intestazioni di colonna **ID**, **Creato** o **Aggiornato** per ordinare; selezionale di
nuovo per invertire l'ordine. Non è possibile ordinare per **Dati**.

## Filtrare in base al contenuto {#filter}

1. In **Campo**, inserisci il nome di un campo di primo livello del JSON, per esempio `status`.
2. In **Uguale a**, inserisci il valore, per esempio `open`.
3. Scegli **Aggiungi filtro**. Il filtro compare come chip; la **×** su un chip lo rimuove.

Più filtri devono corrispondere tutti. I valori vengono letti come JSON quando possibile: `true`,
`42`, `null`, `"42"` o `{"city": "Graz"}` corrispondono in base al loro tipo, tutto il resto
(`open`) corrisponde come testo. Quindi `total` = `12` trova `{"total": 12}` ma non
`{"total": "12"}`.

Un filtro è una verifica di _contenimento_: un valore oggetto corrisponde quando il campo del record
contiene almeno queste chiavi. `address` = `{"city": "Graz"}` trova
`{"address": {"city": "Graz", "zip": "8010"}}`. I nomi dei campi possono contenere solo lettere,
cifre e trattini bassi, quindi filtra i campi annidati tramite un valore oggetto come mostrato.

## Creare un record {#create}

1. Scegli il tenant (e, facoltativamente, la raccolta).
2. Scegli **Nuovo record**.
3. In **Raccolta**, mantieni o inserisci il nome della raccolta. Un nuovo nome crea la raccolta.
4. In **Dati**, inserisci un oggetto JSON, per esempio:

   ```json
   { "status": "open", "total": 12, "customer": { "name": "Acme" } }
   ```

5. Scegli **Crea record**. Studio passa alla raccolta del record.

ID, versione e orari sono impostati dal server; non inserirli nei dati.

## Modificare un record {#edit}

1. Apri il record (icona dell'occhio) e scegli **Modifica**.
2. Modifica il JSON in **Dati** e scegli **Salva**.

Il salvataggio **sostituisce l'intero oggetto**: i campi che rimuovi dal JSON vengono rimossi dal
record. La raccolta non può essere cambiata; per spostare un record, crealo nell'altra raccolta ed
elimina quello vecchio.

### Versioni e conflitti {#versions}

Studio comunica al server quale versione hai modificato (HTTP `If-Match`). Se qualcun altro, una
persona o la tua applicazione, ha modificato o eliminato il record dopo che lo hai aperto, il server
rifiuta la modifica con **Modificato nel frattempo** (HTTP 412) invece di sovrascrivere senza
avvisare l'altra modifica. Lo stesso vale per l'eliminazione.

Per risolvere: chiudi la finestra, ricarica l'elenco, riapri il record, applica la tua modifica ai
dati attuali e salva.

## Eliminare un record {#delete}

1. Apri il record e scegli **Elimina record**.
2. Conferma con **Elimina record**.

> [!CAUTION]
> L'eliminazione è definitiva; non esiste un cestino. Il registro di audit conserva il fatto che il
> record è stato eliminato (`data.record.delete`) ma non i suoi dati.

## Impostazioni e limiti {#limits}

| Elemento                | Regola                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Nome della raccolta     | `^[a-z][a-z0-9_]{0,62}$`: minuscole, cifre, trattini bassi, inizia con una lettera, al massimo 63 caratteri |
| Dati                    | Un oggetto JSON (non un array né un valore semplice), al massimo 256 KiB serializzato                       |
| Campo del filtro        | Lettere, cifre, trattino basso, inizia con una lettera o un trattino basso, al massimo 63 caratteri         |
| Ordinamento             | `id`, `created_at`, `updated_at`, crescente o decrescente                                                   |
| Dimensione della pagina | 50 in Studio; l'API accetta un `limit`                                                                      |

## Per gli sviluppatori {#api}

Studio usa la stessa API della tua applicazione.
`C = /v1/products/{product_id}/tenants/{tenant_id}/records/{collection}`:

| Metodo e percorso                           | Autorizzazione     | Scopo                                            |
| ------------------------------------------- | ------------------ | ------------------------------------------------ |
| `GET /v1/products/{product_id}/collections` | `collections:read` | Raccolte con i conteggi                          |
| `GET C?where=&sort=&limit=&cursor=`         | `records:read`     | Elenco; `where` è un oggetto JSON (contenimento) |
| `GET C/{record_id}`                         | `records:read`     | Un record, `ETag` è la versione                  |
| `POST C` (corpo: l'oggetto dei dati)        | `records:write`    | Creazione (201)                                  |
| `PUT C/{record_id}`, `If-Match`             | `records:write`    | Sostituzione dei dati                            |
| `DELETE C/{record_id}`, `If-Match`          | `records:write`    | Eliminazione (204)                               |

```http
PUT /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/records/orders/rec_01EXAMPLE
If-Match: "3"
Content-Type: application/json

{"status": "shipped", "total": 12}
```

Senza `If-Match` il server sovrascrive senza condizioni. Ogni creazione, sostituzione ed
eliminazione scrive un evento di audit (`data.record.create`, `data.record.replace`,
`data.record.delete`) con la raccolta e la versione, mai con i dati. Per dati relazionali con molte
righe o join, i prodotti usano tabelle proprie invece dei record; vedi le
[nozioni di base sull'API](help:api-basics).

## Risoluzione dei problemi {#troubleshooting}

**Modificato nel frattempo.** Qualcuno ha modificato o eliminato il record dopo che lo hai aperto.
Ricarica, riapri il record e ripeti la modifica. Vedi [Versioni e conflitti](#versions).

**Verifica i dati inseriti** durante il salvataggio. Il nome della raccolta o i dati non rispettano
i [limiti](#limits). Studio verifica già il nome e che i dati siano un oggetto JSON; il messaggio del
server indica il problema.

**Dimensione eccessiva.** I dati del record superano 256 KiB. Conserva i contenuti di grandi
dimensioni come [file](help:files) e mantieni nel record solo il suo ID.

**Verifica i dati inseriti** durante il filtraggio: un nome di campo contiene un punto o altri
caratteri non consentiti. Filtra i valori annidati con un valore oggetto (vedi
[Filtrare in base al contenuto](#filter)).

**L'elenco Raccolte mostra un errore o "Non consentito".** Per elencare le raccolte serve
`collections:read`, che hanno solo i ruoli di prodotto. Inserisci invece il nome della raccolta in
**Nome della raccolta**.

**Mancano Nuovo record, Modifica ed Elimina record.** Il tuo ruolo non concede `records:write` in
questo tenant, oppure non è ancora selezionato alcun tenant.

**Non trovato.** Il record è stato eliminato, il tenant è sospeso (solo gli amministratori della
piattaforma possono raggiungere i tenant sospesi) oppure non hai accesso a questo tenant.

**Nessun record corrisponde.** Rimuovi i filtri uno alla volta. Ricorda che `12` e `"12"` sono
valori diversi.
