---
title: Utilizzo e quote
summary: Definisci i contatori, segui l'utilizzo di ogni tenant, imposta override delle quote e consulta le prenotazioni.
keywords: utilizzo, consumo, misurazione, contatore, quota, limite, prenotazione, limite rigido, limite flessibile, eccedenza, chiamate API, periodo di azzeramento, metering
---

La misurazione dell'utilizzo conta quanto consuma ogni tenant di qualcosa che il tuo prodotto
misura: chiamate API, byte archiviati, report generati. In Studio definisci i **contatori**; il tuo
prodotto registra tramite l'API gli **eventi di utilizzo** relativi a questi contatori. Axentra
somma gli eventi per tenant e periodo, confronta il risultato con il **limite** del tenant (da un
override della quota, dal piano o dal valore predefinito del contatore) e rifiuta o segnala
l'utilizzo che lo supera. Gli operatori del prodotto usano questa schermata per definire i
contatori e tenere d'occhio i consumi; il personale di supporto la usa per rispondere alla domanda
“perché la mia richiesta è stata rifiutata?”.

> [!IMPORTANT]
> La schermata **Utilizzo** richiede il modulo `usage` sul server. Senza di esso, **Utilizzo** non
> compare nella navigazione. Per la lettura serve `usage:read`; per definire contatori e override
> delle quote serve l'autorizzazione di prodotto `usage:manage`; per confermare o rilasciare
> prenotazioni serve `usage:record` nel tenant. Vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Cosa mostra la schermata {#overview}

Apri [Utilizzo](app:usage) (gruppo **Utilizzo e fatturazione**). La pagina ha tre schede:

| Scheda                  | Mostra                                                                             | Chi la vede                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Panoramica**          | Un grafico giornaliero di un contatore su tutti i tenant e i **Totali per tenant** | `usage:read` a livello di prodotto (ruoli di prodotto, ruoli nella piattaforma) |
| **Contatori**           | Le definizioni dei contatori                                                       | `usage:read` a livello di prodotto                                              |
| **Utilizzo per tenant** | Limiti, grafico, eventi e prenotazioni di un tenant                                | `usage:read` in almeno un tenant                                                |

Chi ha solo un ruolo nel tenant (per esempio il ruolo di tenant **Member**) vede soltanto la scheda
**Utilizzo per tenant**, e solo per i tenant in cui ha `usage:read`.

### Leggere la panoramica {#overview-chart}

1. Scegli un **Contatore** e un **Intervallo di tempo** (**Ultimi 7 giorni**, **Ultimi 30 giorni** o **Ultimi 90 giorni**).
2. **Utilizzo giornaliero, tutti i tenant** mostra una barra per ogni giorno UTC. **Mostra tabella
   dati** sotto il grafico elenca ogni giorno in forma di tabella, utilizzabile anche con gli
   screen reader.
3. **Totali per tenant** elenca ogni tenant con utilizzo nell'intervallo, il suo **Valore** e il
   numero di **Eventi**. Seleziona il nome di un tenant per aprire la sua scheda **Utilizzo per tenant**.

Il modo in cui si forma il totale dipende dall'aggregazione del contatore: **Somma** addiziona i
valori giornalieri, **Massimo** prende il valore giornaliero più alto, **Ultimo valore** prende il
valore dell'ultimo giorno con utilizzo. Tutti i giorni sono giorni UTC, quindi un giorno può
iniziare la sera o la mattina secondo la tua ora locale.

La **Dashboard** del prodotto ha un riquadro **Utilizzo di questo mese** con i totali per contatore
dal primo giorno del mese UTC corrente.

## Creare un contatore {#create-meter}

Un contatore definisce _che cosa_ viene misurato. Da solo non registra nulla.

1. Apri la scheda **Contatori** e scegli **Nuovo contatore**.
2. Inserisci una **Chiave**, per esempio `api_calls`. Il tuo prodotto invia l'utilizzo con questa chiave.
3. Facoltativo: **Nome**, **Unità** (mostrata accanto ai valori, per esempio `calls`) e **Descrizione**.
4. Scegli l'**Aggregazione** e il **Periodo di azzeramento** (vedi la tabella sotto).
5. Facoltativo: un **Limite predefinito** e la sua **Applicazione**.
6. Scegli **Crea contatore**.

> [!WARNING]
> **Chiave**, **Aggregazione** e **Periodo di azzeramento** non si possono modificare dopo la
> creazione. Se hai sbagliato, crea un nuovo contatore con un'altra chiave.

### Impostazioni del contatore {#meter-settings}

| Impostazione               | Cosa fa                                                                                                                                                                                          | Valori consentiti / predefinito                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Chiave**                 | Identificatore usato dalle chiamate API del tuo prodotto e dai diritti d'uso del piano (`limit.<key>`)                                                                                           | Lettere minuscole, cifre, `_` e `.`, deve iniziare con una lettera, al massimo 63 caratteri |
| **Nome**                   | Nome visualizzato                                                                                                                                                                                | Al massimo 200 caratteri; facoltativo                                                       |
| **Unità**                  | Mostrata dopo i valori                                                                                                                                                                           | Testo libero; facoltativo                                                                   |
| **Aggregazione**           | Come si combinano gli eventi di un periodo: **Somma** addiziona le quantità, **Massimo** tiene la più alta, **Ultimo valore** tiene il valore dell'evento con l'orario di occorrenza più recente | `sum` (predefinito), `max`, `last`                                                          |
| **Periodo di azzeramento** | Quando il contatore riparte da zero: **Nessun azzeramento**, **Giornaliero (UTC)**, **Mensile (UTC)**, **Periodo di fatturazione**                                                               | Predefinito **Mensile (UTC)**                                                               |
| **Limite predefinito**     | Limite per i tenant senza override e senza limite del piano; vuoto significa illimitato                                                                                                          | Numero maggiore o uguale a 0; vuoto                                                         |
| **Applicazione**           | **Limite rigido** rifiuta l'utilizzo oltre il limite; **Limite flessibile** lo registra e segnala l'eccedenza                                                                                    | Predefinito **Limite rigido**                                                               |

Scegli l'aggregazione in base a ciò che misuri: gli eventi che si sommano (chiamate, messaggi) usano
**Somma**; un livello che campioni (spazio in byte, postazioni attive) usa **Massimo** o **Ultimo
valore**.

### Periodi di azzeramento e periodo di fatturazione {#reset-period}

**Periodo di fatturazione** segue il ciclo dell'abbonamento del tenant: il periodo inizia nel
giorno in cui è iniziato l'abbonamento (per esempio il 15) e dura un mese o un anno, a seconda
dell'intervallo del prezzo. Un giorno di inizio come il 31 viene spostato all'ultimo giorno dei
mesi più corti. Se il modulo `billing` non è abilitato, o il tenant non ha un abbonamento in
**In prova**, **Attivo** o **Pagamento scaduto**, il periodo è il mese di calendario (UTC). Vedi
[Piani e abbonamenti](help:plans-subscriptions).

### Periodi fissi, non finestre mobili {#fixed-periods}

I limiti si applicano per periodo, e i periodi hanno confini fissi: la mezzanotte UTC per i
contatori giornalieri, il primo del mese (UTC) per quelli mensili. Un tenant può consumare tutto il
suo limite giornaliero alle 23:50 UTC e di nuovo tutto il limite alle 00:10 UTC. Non esistono
finestre di quota orarie o mobili. Se ti serve una finestra più stretta, usa un contatore `day` con
un limite più basso o un contatore aggiuntivo.

Le quote non sono la stessa cosa del limite di frequenza delle richieste del server (richieste al
minuto per chiave o IP). Quel limite è configurato dall'operatore ed è disattivato per impostazione
predefinita; vedi [Configurazione del server](help:server-configuration).

## Modificare, disattivare o eliminare un contatore {#edit-meter}

Nel menu delle azioni della riga (**Azioni per il contatore …**):

- **Modifica** cambia **Nome**, **Unità**, **Descrizione**, **Limite predefinito** e **Applicazione**.
- **Disattiva** blocca il nuovo utilizzo per il contatore: la registrazione su un contatore inattivo
  viene rifiutata. I contatori inattivi non compaiono più in **Utilizzo nel periodo** di un tenant.
  **Attiva** annulla l'operazione.
- **Elimina contatore** rimuove un contatore che non ha mai registrato utilizzo. Confermi digitando
  la chiave. Un contatore con utilizzo registrato non può essere eliminato; disattivalo invece.

## Controllare utilizzo e limiti di un tenant {#tenant-usage}

1. Apri la scheda **Utilizzo per tenant** e scegli il tenant (oppure seleziona un tenant in **Totali per tenant**).
2. **Utilizzo nel periodo** mostra un riquadro per ogni contatore attivo con:
   - il valore nel periodo corrente e, per i contatori con limite, una barra con
     “_usato_ di _limite_ usato (_n_ %), prenotazioni incluse”;
   - la provenienza del limite (vedi sotto) e **Limite rigido** o **Limite flessibile**;
   - **Oltre il limite** quando l'utilizzo con limite flessibile ha superato il limite;
   - **Periodo**, **Eventi**, **Prenotato** (se presente) e **Rimanente**.
3. Per vedere un periodo precedente, scegli una data in **Periodo che include**. Lascialo vuoto per
   il periodo corrente.

Più sotto trovi **Utilizzo giornaliero** (un grafico per contatore, stessi intervalli della
panoramica), **Eventi di utilizzo** (dal più recente, filtrabili per **Contatore**) e **Prenotazioni**.

### Da dove viene il limite effettivo {#limit-source}

Vale la prima corrispondenza:

| Badge                         | Origine                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Override del tenant**       | Un override della quota impostato per questo tenant in questa schermata                                                                 |
| **Dal piano**                 | Il diritto d'uso `limit.<meter key>` del piano del tenant, oppure un override del diritto d'uso nella pagina di fatturazione del tenant |
| **Predefinito del contatore** | Il **Limite predefinito** del contatore                                                                                                 |
| **Nessun limite**             | Nessuno dei precedenti: illimitato                                                                                                      |

Un limite del piano si applica solo mentre l'abbonamento è **In prova**, **Attivo** o **Pagamento
scaduto**. I limiti del piano usano l'**Applicazione** del contatore; solo un override della quota
ne imposta una propria.

> [!NOTE]
> Esistono due tipi di override per il tenant. Un **override della quota** (questa schermata)
> sostituisce il limite di un contatore, compresa la sua applicazione, e prevale sempre. Un
> **override del diritto d'uso** nella pagina di fatturazione del tenant sostituisce un diritto
> d'uso del piano e compare come **Dal piano**. Usa un solo meccanismo per contatore, così resta
> facile da capire.

## Impostare o rimuovere un override della quota {#quota-override}

Richiede l'autorizzazione di prodotto `usage:manage`.

1. In **Utilizzo nel periodo**, scegli **Imposta override** sul riquadro del contatore.
2. Inserisci un **Limite**. Lascialo vuoto per un override illimitato (il tenant non ha quindi alcun
   limite, anche se il suo piano ne prevede uno).
3. Scegli l'**Applicazione** e **Salva override**.

Il badge diventa **Override del tenant**. **Rimuovi override** (visibile solo sui riquadri con un
override del tenant) fa tornare in vigore il limite del piano o il valore predefinito del
contatore. Gli override valgono dal successivo utilizzo registrato; l'utilizzo già registrato
resta. Le modifiche alle quote vengono registrate nel registro di audit.

## Limiti rigidi e flessibili {#enforcement}

- **Limite rigido**: una richiesta che supererebbe il limite viene rifiutata con HTTP `429` e il
  codice di errore `quota_exceeded`, con il contatore, il limite, le quantità usata, prenotata e
  richiesta e la fine del periodo. Per i contatori **Somma** la verifica è _usato + prenotato +
  richiesto > limite_; per i contatori **Massimo** e **Ultimo valore** è _richiesto > limite_.
- **Limite flessibile**: l'utilizzo viene sempre registrato. La risposta e Studio segnalano **Oltre
  il limite**, così il tuo prodotto può avvisare o fatturare l'eccedenza.

Un limite rigido non viene mai superato da richieste concorrenti: Axentra serializza le scritture
per lo stesso tenant, contatore e periodo.

## Registrare l'utilizzo (API) {#record-usage}

Studio non registra utilizzo. Il tuo prodotto chiama l'API con una chiave che ha `usage:record`
(vedi [Chiavi API](help:api-keys)):

```http
POST /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/usage/events
Authorization: Bearer axk_EXAMPLE_secret
Idempotency-Key: req-7f3a9c
Content-Type: application/json

{"meter": "api_calls", "quantity": 1}
```

- L'header `Idempotency-Key` è obbligatorio (da 1 a 200 caratteri ASCII stampabili). Ripetere la
  stessa chiave con lo stesso corpo restituisce l'evento originale (`200`, `replayed: true`) e
  conta una volta sola. La stessa chiave con un corpo diverso viene rifiutata con `409`.
- `quantity`: un numero da 0 a 10^15 con al massimo 6 cifre decimali.
- `occurred_at` (facoltativo): al massimo 5 minuti nel futuro e 400 giorni nel passato. Gli eventi
  retrodatati contano nel periodo a cui appartengono, anche se è già concluso.
- `properties` (facoltativo): un oggetto JSON di al massimo 4 KB, mostrato in **Eventi di utilizzo**.
- `"enforce": false` registra senza la verifica del limite rigido; serve l'autorizzazione di
  prodotto `usage:manage`, che le chiavi legate a un tenant non hanno mai.

Il tutorial [Piani e utilizzo dall'inizio alla fine](help:tutorial-plan-usage) illustra un esempio
completo.

## Prenotazioni {#reservations}

Per lavori di lunga durata, un prodotto può **prenotare** una quantità prima di iniziare (API:
`POST …/usage/reservations` con `meter`, `quantity` e `ttl_seconds` da 1 a 86 400, predefinito
300). Una prenotazione attiva conta per il limite, così job paralleli non possono superarlo
insieme. Quando il lavoro è finito, il prodotto **conferma** la quantità effettiva, il che registra
un evento di utilizzo, oppure **rilascia** la prenotazione. Le prenotazioni esistono solo per i
contatori **Somma**.

L'API non offre un elenco delle prenotazioni, quindi Studio ne cerca una tramite il suo id:

1. In **Prenotazioni**, incolla l'**ID prenotazione** e scegli **Cerca**.
2. Studio mostra **Stato**, contatore, **Quantità prenotata**, **Scadenza** e, dopo la conferma,
   la **Quantità confermata** e l'**Evento di utilizzo**.
3. Con `usage:record` nel tenant, puoi concludere qui una prenotazione **Attiva**:
   - **Conferma** registra la **Quantità effettiva** (lasciala vuota per confermare la quantità
     prenotata). Una conferma non viene mai rifiutata dal limite, perché il lavoro è già stato fatto.
   - **Rilascia** restituisce la quantità senza registrare utilizzo.

| Stato          | Significato                                                         |
| -------------- | ------------------------------------------------------------------- |
| **Attiva**     | Conta per il limite fino alla scadenza                              |
| **Confermata** | L'utilizzo è stato registrato                                       |
| **Rilasciata** | Restituita; nessun utilizzo registrato                              |
| **Scaduta**    | Non confermata prima di **Scadenza**; da quel momento non conta più |

## Buono a sapersi {#good-to-know}

- Gli eventi di utilizzo non si possono modificare né eliminare, e le quantità non possono essere
  negative, quindi l'utilizzo registrato non si può sottrarre. Per dare più margine a un tenant
  dopo un errore, imposta un [override della quota](help:usage#quota-override) per il resto del periodo.
- I singoli eventi di utilizzo non vengono sottoposti ad audit per via del loro volume; le modifiche
  a contatori e quote sì.
- I dati di un tenant sono isolati: l'id di un altro tenant restituisce “non trovato”.
- Studio mostra le quantità con un massimo di 6 cifre decimali, formattate per la tua lingua.
- Le serie temporali coprono al massimo 400 giorni.
- Altri limiti sono elencati in [Limitazioni note](help:limitations).

## Risoluzione dei problemi {#troubleshooting}

| Cosa vedi                                                          | Perché                                                                                  | Cosa fare                                                                                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nessun accesso all'utilizzo**                                    | Il tuo ruolo non ha `usage:read` per questo prodotto o tenant                           | Chiedi a un amministratore del prodotto un ruolo con `usage:read`                                                                                    |
| Solo la scheda **Utilizzo per tenant**                             | Hai `usage:read` solo tramite un ruolo nel tenant                                       | È il comportamento previsto; la panoramica richiede un ruolo di prodotto                                                                             |
| **Ancora nessun contatore**                                        | Nessun contatore definito                                                               | Creane uno in **Contatori** (serve `usage:manage`)                                                                                                   |
| **Conflitto** durante l'eliminazione di un contatore               | Il contatore ha utilizzo registrato                                                     | **Disattiva** il contatore invece di eliminarlo                                                                                                      |
| **Conflitto** “a meter with this key exists”                       | Le chiavi sono univoche per prodotto, anche per i contatori inattivi                    | Scegli un'altra chiave o riattiva il vecchio contatore                                                                                               |
| **Modificato nel frattempo**                                       | Qualcun altro ha modificato il contatore                                                | Ricarica e ripeti la modifica                                                                                                                        |
| Il tuo prodotto riceve `429 quota_exceeded`                        | Verrebbe superato un limite rigido                                                      | Controlla l'origine del limite sul riquadro; alza il limite del piano, imposta un override della quota o attendi la fine del periodo (`Retry-After`) |
| Il tuo prodotto riceve `409` “the meter is inactive”               | Il contatore è stato disattivato                                                        | **Attiva** il contatore in **Contatori**                                                                                                             |
| Il tuo prodotto riceve `409` per una chiave di idempotenza         | La chiave è stata riutilizzata con un corpo diverso                                     | Usa una nuova chiave per ogni evento di utilizzo distinto                                                                                            |
| **Verifica i dati inseriti** durante la registrazione              | Quantità, `occurred_at` o `properties` fuori dai limiti indicati sopra                  | Correggi il valore; invia `occurred_at` con un fuso orario                                                                                           |
| La conferma viene rifiutata: “the reservation is expired”          | Il TTL è scaduto prima della conferma                                                   | Registra l'utilizzo come evento normale; scegli un `ttl_seconds` più lungo                                                                           |
| L'utilizzo compare nel giorno sbagliato                            | I giorni sono UTC                                                                       | Confronta con gli orari UTC                                                                                                                          |
| Un contatore con **Periodo di fatturazione** si azzera il giorno 1 | Il tenant non ha un abbonamento con diritti d'uso, oppure la fatturazione è disattivata | Abbona il tenant a un piano (vedi [Piani e abbonamenti](help:plans-subscriptions#subscribe))                                                         |
