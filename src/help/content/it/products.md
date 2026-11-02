---
title: Prodotti
summary: Crea, configura, archivia e ripristina prodotti, gestisci gli operatori di prodotto e comprendi la modalità a prodotto singolo.
keywords: prodotto, applicazione, app, progetto, operatori, membri del prodotto, archiviare, ripristinare, impostazioni del prodotto, modalità a prodotto singolo, modalità multiprodotto, slug
---

Un **prodotto** è un'applicazione che gira sul tuo server Axentra, per esempio un CRM o un servizio
di prenotazione. Ogni prodotto ha i propri tenant, utenti, ruoli, chiavi API e dati, e nulla viene
condiviso tra i prodotti. Le persone che gestiscono un prodotto (invece di usarlo come clienti) ne
sono gli **operatori**: hanno un ruolo di prodotto come **Product owner** (proprietario del prodotto) e sono
elencate nella scheda **Membri** del prodotto.

Apri l'elenco dei prodotti con [Prodotti](app:products) nella barra laterale. **Apri dashboard** ti
porta all'interno di un prodotto; ogni altra schermata della barra laterale lavora poi all'interno di
quel prodotto.

> [!IMPORTANT]
> Chiunque appartenga a un prodotto lo vede nell'elenco. Gli amministratori e i visualizzatori della
> piattaforma vedono tutti i prodotti, compresi quelli archiviati. Creare, archiviare e ripristinare
> prodotti richiede le autorizzazioni di piattaforma `products:create` e `products:archive`
> (amministratori della piattaforma) ed è possibile solo in modalità multiprodotto. Vedi
> [modalità a prodotto singolo](#single-product-mode).

## Creare un prodotto {#create}

1. Apri [Prodotti](app:products) e scegli **Nuovo prodotto**.
2. Inserisci un **Nome**.
3. Controlla lo **Slug**. Studio lo ricava dal nome; puoi modificarlo prima di creare il prodotto.
4. Facoltativamente inserisci una **Descrizione**.
5. Scegli **Crea prodotto**.

Studio apre la pagina del nuovo prodotto. Ne diventi proprietario (**Product owner**), quindi puoi
aggiungere subito altri operatori nella scheda **Membri**.

> [!NOTE]
> Lo slug non può essere modificato in seguito. Scegline uno che ti vada bene vedere negli URL, nei
> log e nei file di configurazione.

### Campi del prodotto {#fields}

| Campo           | Che cosa fa                                                                   | Valori consentiti / predefinito                                                                                                     |
| --------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**        | Nome visualizzato in Studio e nelle email, per esempio nelle email di invito. | Da 1 a 200 caratteri. Può essere modificato in seguito.                                                                             |
| **Slug**        | Identificatore stabile adatto agli URL.                                       | Da 2 a 63 lettere minuscole, cifre e trattini, con una lettera o una cifra iniziale; univoco sul server. Non può essere modificato. |
| **Descrizione** | Testo libero mostrato nell'elenco dei prodotti.                               | Fino a 2.000 caratteri. Facoltativa.                                                                                                |
| **ID**          | Identificatore generato (`prd_…`) usato dall'API.                             | Assegnato dal server.                                                                                                               |
| **Stato**       | **Attivo** o **Archiviato**.                                                  | Vedi [archiviare un prodotto](#archive).                                                                                            |

## Modificare le impostazioni del prodotto {#settings}

La scheda **Impostazioni** di un prodotto contiene il nome, la descrizione e **Impostazioni (JSON)**: un
oggetto JSON con la configurazione specifica del prodotto. Il codice del tuo prodotto può leggerlo e
alcuni moduli di Axentra ne usano delle chiavi.

1. Apri il prodotto da [Prodotti](app:products) e seleziona la scheda **Impostazioni**.
2. Modifica **Nome**, **Descrizione** o **Impostazioni (JSON)**.
3. Scegli **Salva modifiche**.

Le modifiche si applicano immediatamente a tutti i tenant del prodotto.

| Chiave in Impostazioni (JSON) | Usata da  | Che cosa fa                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invitation_accept_url`       | Notifiche | Link usato nelle email di invito. `{token}` viene sostituito dal token di invito; se manca, viene aggiunto `?token=…`. Deve iniziare con `http://` o `https://`. Vedi [inviti](help:members-invitations). Se la chiave non è impostata, vale l'impostazione del server `notify.invitation_accept_url`, altrimenti `/accept-invitation` sull'indirizzo pubblico dell'API. |
| `default_locale`              | Notifiche | Lingua di riserva per i modelli di notifica, per esempio `"en"`.                                                                                                                                                                                                                                                                                                         |
| `storage`                     | File      | Quote di archiviazione e policy sui tipi di contenuto per i caricamenti. Modifica invece la policy nella scheda **File**. Vedi [file](help:files).                                                                                                                                                                                                                       |

```json
{
  "invitation_accept_url": "https://studio.example.com/invitations/accept?token={token}",
  "default_locale": "en"
}
```

> [!WARNING]
> **Salva modifiche** sostituisce l'intero oggetto delle impostazioni. Se elimini una chiave dal testo, viene
> rimossa dal prodotto. L'oggetto può essere lungo fino a circa 32.000 caratteri.

> [!IMPORTANT]
> Per modificare le impostazioni serve `product:manage` (proprietari e amministratori del prodotto).
> Senza questa autorizzazione la scheda mostra **Puoi visualizzare queste impostazioni, ma non
> modificarle.** Un prodotto archiviato non può essere modificato in Studio; prima ripristinalo.

La scheda **File** (solo quando il modulo dei file è abilitato) contiene la policy di archiviazione del
prodotto. È descritta in [file](help:files).

## Gestire gli operatori di prodotto {#members}

La scheda **Membri** elenca gli operatori del prodotto: gli utenti con un ruolo di prodotto. Le loro
autorizzazioni di tenant valgono in **ogni** tenant del prodotto. I membri dei tenant si gestiscono
invece in ciascun tenant, vedi [membri e inviti](help:members-invitations).

| Ruolo di prodotto predefinito         | Che cosa può fare                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Product owner** (`product_owner`)   | Tutto nel prodotto, compresa la gestione degli operatori e la dichiarazione delle autorizzazioni di prodotto.      |
| **Product admin** (`product_admin`)   | Gestisce tenant, ruoli, chiavi API e dati; non può gestire gli operatori.                                          |
| **Support** (`product_support`)       | Legge tutto e gestisce i membri dei tenant nei limiti delle proprie autorizzazioni (in pratica: i visualizzatori). |
| **Product viewer** (`product_viewer`) | Accesso in sola lettura al prodotto.                                                                               |

Nell'elenco compaiono anche i ruoli di prodotto personalizzati. Vedi
[ruoli e autorizzazioni](help:roles-permissions).

### Aggiungere un operatore {#add-operator}

1. Apri la scheda **Membri** e scegli **Aggiungi membro**.
2. Inserisci l'**Indirizzo email** della persona e scegli un **Ruolo**.
3. Scegli **Aggiungi membro**.

> [!IMPORTANT]
> La scheda **Membri** richiede `product_members:read`; aggiungere, modificare e rimuovere operatori
> richiede `product_members:manage` (proprietari del prodotto e amministratori della piattaforma).

> [!NOTE]
> Non esistono inviti per gli operatori. La persona deve avere già un account che puoi vedere: gli
> amministratori della piattaforma vedono tutti gli account, gli utenti con `product_users:read`
> vedono gli utenti di questo prodotto (membri dei suoi tenant e suoi operatori). Per chiunque altro
> il server risponde **Utente non trovato**. Invita prima la persona in uno dei tenant del prodotto,
> oppure chiedi a un amministratore della piattaforma di aggiungerla.

Per cambiare il ruolo di un operatore, scegline uno nuovo nella colonna **Ruolo**. Per rimuovere un
operatore, scegli l'icona del cestino nella sua riga e conferma. I ruoli superiori al tuo livello
vengono mostrati ma non possono essere selezionati (vedi
[limite dei ruoli](help:members-invitations#role-ceiling)).

## Archiviare un prodotto {#archive}

L'archiviazione mette un prodotto fuori servizio senza eliminare nulla.

1. Apri il prodotto da [Prodotti](app:products).
2. Scegli **Archivia**.
3. Digita il nome del prodotto per confermare e scegli **Archivia**.

Finché un prodotto è archiviato:

- gli operatori e i membri dei tenant non lo vedono più nell'elenco dei prodotti e ogni loro
  richiesta al suo interno viene rifiutata;
- tutte le sue chiavi API smettono di funzionare (le richieste falliscono con **Non consentito**);
- gli amministratori della piattaforma mantengono l'accesso completo, i visualizzatori della
  piattaforma mantengono l'accesso in lettura;
- Studio mostra **Questo prodotto è archiviato. Ripristinalo per apportare modifiche.** e non offre
  **Apri dashboard**.

> [!NOTE]
> Studio non può eliminare un prodotto. L'archiviazione è il modo per metterlo fuori servizio.

## Ripristinare un prodotto {#restore}

1. Apri il prodotto archiviato (come amministratore della piattaforma lo vedi ancora elencato con lo
   stato **Archiviato**).
2. Scegli **Ripristina** e conferma.

Il prodotto, i suoi membri e le sue chiavi API tornano subito a funzionare. Le chiavi scadute nel
frattempo restano scadute.

## Modalità a prodotto singolo {#single-product-mode}

Un server Axentra funziona in una di due modalità, impostata dall'operatore del server nella
configurazione del server:

|                                                  | Modalità a prodotto singolo (`single`)                                   | Modalità multiprodotto (`multi`)                      |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Prodotti                                         | Esattamente uno, creato dalla configurazione al primo avvio              | Un numero qualsiasi, creati in Studio o tramite l'API |
| **Nuovo prodotto**, **Archivia**, **Ripristina** | Non offerti; l'API li rifiuta con **Non disponibile in questa modalità** | Con `products:create` / `products:archive`            |
| Elenco dei prodotti                              | Mostra l'unico prodotto e l'avviso **Modalità prodotto singolo**         | Tutti i prodotti a cui hai accesso                    |

In modalità a prodotto singolo puoi comunque modificare il nome, la descrizione, le impostazioni e i
membri del prodotto nella sua pagina. Per gestire più prodotti, l'operatore del server imposta
`mode = "multi"` nella configurazione del server; non serve alcuna migrazione dei dati. Vedi
[configurazione del server](help:server-configuration).

## Buono a sapersi {#good-to-know}

- Gli account utente valgono per l'intera installazione: un account può lavorare in più prodotti.
- I prodotti archiviati conservano i loro dati, eventi di audit e chiavi; l'archiviazione non fa
  scadere nulla.
- Le impostazioni del prodotto non sono un archivio per segreti. Non inserire password o token in
  **Impostazioni (JSON)**.

## Risoluzione dei problemi {#troubleshooting}

**Conflitto durante la creazione di un prodotto.** Un altro prodotto usa già lo slug. Scegli uno
slug diverso.

**Verifica i dati inseriti: “slug must be 2-63 lowercase letters, digits or dashes”.** Rimuovi
dallo slug maiuscole, spazi e caratteri speciali.

**Questo non è un JSON valido. / Le impostazioni devono essere un oggetto JSON.** **Impostazioni
(JSON)** deve essere un unico oggetto tra parentesi graffe, per esempio `{"key": "value"}`. Array,
semplici stringhe e virgole finali vengono rifiutati.

**Verifica i dati inseriti: “settings are too large”** oppure un messaggio riguardante `storage`.
L'oggetto supera circa 32.000 caratteri, oppure la parte `storage` non è valida. Accorcialo, oppure
modifica la policy di archiviazione nella scheda **File**.

**Modificato nel frattempo.** Qualcun altro ha salvato il prodotto mentre lo stavi modificando.
Ricarica la pagina e applica di nuovo la tua modifica.

**Non disponibile in questa modalità.** Il server funziona in modalità a prodotto singolo, in cui i
prodotti non possono essere creati, archiviati o ripristinati.

**Utente non trovato durante l'aggiunta di un operatore.** La persona non ha un account, oppure non
ne ha uno che puoi vedere. Vedi [aggiungere un operatore](#add-operator).

**Conflitto: “the product needs at least one owner”.** Hai tentato di rimuovere o declassare
l'ultimo **Product owner**. Prima rendi proprietario qualcun altro.

**Un prodotto manca dall'elenco.** È archiviato (solo gli amministratori e i visualizzatori della
piattaforma vedono i prodotti archiviati), oppure non ne sei membro. Chiedi a un amministratore
della piattaforma.
