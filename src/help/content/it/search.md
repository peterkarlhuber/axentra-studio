---
title: Ricerca
summary: Cercare nell'indice full-text di un tenant, restringere i risultati per tipo, consultare un documento indicizzato e rimuovere dall'indice una voce errata.
keywords: ricerca, cercare, full-text, indice, documento indicizzato, tipo, ID di riferimento, evidenziazione, frase, escludere, search:query, search:index
---

La schermata **Ricerca** cerca nell'indice full-text che il tuo prodotto mantiene per ogni tenant.
Il prodotto inserisce in questo indice il testo ricercabile dei propri oggetti (una fattura, un
contatto, un ticket); in Studio puoi interrogarlo come fanno i tuoi utenti, verificare che cosa è
indicizzato e rimuovere una voce che non dovrebbe esserci.

L'indice è una _copia_: lo scrive il tuo prodotto, che resta la fonte di riferimento. Axentra non
legge da solo record, file o tabelle del tuo prodotto, quindi un oggetto compare nella ricerca solo
dopo che il prodotto l'ha indicizzato.

> [!IMPORTANT]
> La schermata richiede il modulo del server `search`. Cercare richiede `search:query` nel tenant;
> rimuovere un documento dall'indice richiede `search:index` (vedi [Chi può fare cosa](#permissions)).

## Chi può fare cosa {#permissions}

| Ruolo                                              | Cercare (`search:query`) | Rimuovere dall'indice (`search:index`) |
| -------------------------------------------------- | ------------------------ | -------------------------------------- |
| Tenant **Owner**, **Admin**                        | sì                       | sì                                     |
| Tenant **Member**, **Viewer**                      | sì                       | no                                     |
| **Product owner**, **Product admin** (ogni tenant) | sì                       | sì                                     |
| **Support**, **Product viewer** (ogni tenant)      | sì                       | no                                     |
| **Amministratore della piattaforma**               | sì                       | sì                                     |
| **Visualizzatore della piattaforma**               | sì                       | no                                     |

Per impostazione predefinita i membri non possono scrivere nell'indice, perché ogni voce viene
mostrata a tutti quelli che possono cercare nel tenant. Un ruolo personalizzato può concedere
entrambe le autorizzazioni; vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Cercare in un tenant {#query}

1. Apri **Dati e archiviazione** › **Ricerca** ([apri la schermata](app:search)).
2. Scegli un **Tenant**. Ogni tenant ha il proprio indice; non esiste una ricerca su più tenant.
3. In **Testo da cercare**, inserisci la tua ricerca e scegli **Avvia ricerca** (o premi Invio).

| Inserisci          | La ricerca trova                                                    |
| ------------------ | ------------------------------------------------------------------- |
| `invoice acme`     | i documenti che contengono entrambe le parole (in qualsiasi ordine) |
| `"late payment"`   | i documenti che contengono esattamente questa frase                 |
| `invoice or offer` | i documenti che contengono almeno una delle parole                  |
| `invoice -draft`   | i documenti con `invoice` che non contengono `draft`                |

La ricerca trova parole intere e non distingue tra maiuscole e minuscole. Non trova parti di parole
(`inv` non trova `invoice`, tranne con [Trova inizi di parola](#prefix)) e non corregge l'ortografia. Se `invoices` trova anche `invoice` dipende
dalla lingua con cui il server indicizza (vedi [Buono a sapersi](#limits)).

La ricerca e il tenant fanno parte dell'indirizzo, quindi puoi salvare una ricerca nei preferiti o
inviare il link a chi ha accesso allo stesso tenant.

### Trova inizi di parola {#prefix}

Scegli **Trova inizi di parola** per la ricerca durante la digitazione: ogni parola inserita deve
corrispondere, e le parole di due o più caratteri trovano anche parole più lunghe che iniziano così
(`inv` trova `invoice`, `inv acme` trova i documenti con una parola che inizia con `inv` e la parola
`acme`). In questa modalità virgolette, `or` e `-parola` non hanno un significato speciale, e
contano solo le prime otto parole. La scelta fa parte dell'indirizzo, come la ricerca stessa.

### Restringere per tipo {#kinds}

Ogni documento indicizzato ha un **tipo** scelto dal tuo prodotto, per esempio `invoice` o `note`.
In **Tipi**, inserisci uno o più tipi separati da virgole per vedere solo quelli. I tipi usano lettere
minuscole, cifre, punti, trattini e trattini bassi e iniziano con una lettera; al massimo 20 alla
volta. Lascia il campo vuoto per cercare in tutti i tipi.

Sotto il campo, **Tipi indicizzati** elenca i tipi presenti nell'indice del tenant con il numero
di documenti. Selezionane uno per aggiungerlo al campo, oppure selezionalo di nuovo per toglierlo.

## Leggere i risultati {#results}

I risultati sono ordinati per pertinenza: le corrispondenze nel titolo contano più di quelle nel
testo, più corrispondenze contano di più e, a parità, viene prima il risultato aggiornato più di
recente. Ogni risultato mostra:

- il **titolo** con le parole trovate evidenziate (o l'ID di riferimento, se il documento non ha un
  titolo),
- il **tipo** e l'**ID di riferimento**, cioè l'ID dell'oggetto nel tuo prodotto,
- quando il documento è stato **aggiornato** l'ultima volta nell'indice,
- fino a due brevi passaggi del testo con le corrispondenze evidenziate.

All'inizio vengono mostrati venti risultati; **Carica altro** recupera i successivi. Il contatore
sotto l'elenco indica quanti sono visualizzati e se ce ne sono altri.

> [!NOTE]
> I risultati non sono un'istantanea. Se il prodotto modifica l'indice mentre sfogli le pagine, un
> documento può spostarsi e comparire due volte o per niente. Una paginazione molto profonda (oltre
> la posizione 1000, per impostazione predefinita) viene rifiutata; affina invece la ricerca.

## Consultare un documento indicizzato {#document}

Scegli il titolo di un risultato. Un pannello laterale mostra che cosa contiene l'indice: **Tipo**,
**ID di riferimento**, **ID del documento** (`sdoc_…`), **Versione** (aumenta a ogni nuova
indicizzazione), **Lingua**, chi l'ha indicizzato (**Indicizzato da**, **Ultima indicizzazione da**)
e quando, il **Testo** completo e i **Metadati** che il tuo prodotto ha salvato con esso. I metadati
vengono mostrati, ma non sono ricercabili.

## Rimuovere un documento dall'indice {#remove}

Se un documento non deve comparire nella ricerca (per esempio perché è stato indicizzato per errore o
appartiene a un oggetto eliminato), puoi rimuoverlo:

1. Apri il documento dai risultati.
2. Scegli **Rimuovi dall'indice** e conferma.

> [!WARNING]
> Così rimuovi solo la voce dell'indice. L'oggetto originale nel tuo prodotto non cambia, e il
> prodotto aggiunge di nuovo la voce la prossima volta che indicizza quell'oggetto. Per rimuovere
> qualcosa in modo definitivo, eliminalo o modificalo nel tuo prodotto.

## Come i documenti arrivano nell'indice {#index}

Il tuo prodotto indicizza i propri oggetti tramite l'API (`PUT …/search/documents/{kind}/{ref_id}`
con `search:index`), di solito subito dopo aver salvato un oggetto o in un [job](help:jobs) che
riprova. Indicizzare di nuovo lo stesso tipo e ID di riferimento sostituisce il documento. Studio non
aggiunge documenti da solo. Chi ha indicizzato un documento è registrato nel documento e, a meno che
il server non lo disattivi, nel [log di audit](help:audit) (`search.document.upsert`,
`search.document.delete`), senza il testo.

## Buono a sapersi {#limits}

| Voce                | Regola                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ambito              | Un tenant alla volta. Chiunque abbia `search:query` nel tenant vede ogni documento di quel tenant.                                                 |
| Testo della ricerca | Da 1 a 500 caratteri. Una ricerca fatta solo di punteggiatura o di parole molto comuni non trova nulla.                                            |
| Tipi                | `^[a-z][a-z0-9_.-]{0,62}$`, al massimo 20 per ricerca                                                                                              |
| Corrispondenza      | Parole intere, o inizi di parola con **Trova inizi di parola**; niente ricerca approssimata o insensibilità agli accenti (`café` non trova `cafe`) |
| Lingua              | Una per installazione (impostazione del server `search.language`, predefinita `simple`: senza radici né parole vuote)                              |
| Paginazione         | 20 per pagina in Studio, al massimo fino alla posizione `search.max_offset` (predefinita 1000)                                                     |

## Risoluzione dei problemi {#troubleshooting}

### Nessun risultato {#no-results}

Controlla l'ortografia, usa parole intere e meno parole e rimuovi il filtro dei tipi. Se l'oggetto
dovrebbe esserci, il tuo prodotto non l'ha (ancora) indicizzato per questo tenant: l'indice contiene
solo ciò che il prodotto vi inserisce.

### Altri messaggi {#messages}

**Non puoi cercare in questo tenant.** Il tuo ruolo in questo tenant non include `search:query`.
Chiedi a un owner o admin del tenant.

**La ricerca compare come "modulo non abilitato".** Il server funziona senza il modulo `search`.
Vedi [Moduli](help:modules-reference#search-realtime).

**Verifica i dati inseriti.** La ricerca supera i 500 caratteri, un tipo non è valido oppure hai
sfogliato oltre quanto consente il server. Accorcia o affina la ricerca.

**Non trovato** all'apertura di un documento. Il prodotto l'ha rimosso dall'indice dopo il
caricamento dei risultati. Cerca di nuovo.

**Rimuovi dall'indice non c'è.** Il tuo ruolo non include `search:index` in questo tenant.
