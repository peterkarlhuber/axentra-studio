---
title: Notifiche
summary: Scrivi modelli email in più lingue, visualizzane l'anteprima e provali, segui la consegna nel registro messaggi e imposta le tue preferenze di notifica.
keywords: notifica, email, e-mail, posta, modello, messaggio, posta in uscita, consegna, SMTP, anteprima, invio di prova, casella di posta, disiscrizione, annullare iscrizione, preferenze, lingua, traduzione, localizzazione
---

Axentra invia email a partire da **modelli**. Un modello ha una chiave, una categoria e una
**variante** per lingua con oggetto, corpo testuale e un corpo HTML facoltativo. Il tuo prodotto (o
Axentra stesso, per gli inviti) invia un modello a un destinatario con i valori per i suoi
segnaposto; Axentra lo compone, salva il messaggio nella posta in uscita e lo consegna in
background. In Studio scrivi i modelli e ne vedi l'anteprima, invii messaggi di prova, controlli lo
stato di consegna e scegli quali notifiche ricevere tu stesso.

> [!IMPORTANT]
> La schermata **Notifiche** richiede il modulo `notify` sul server; senza di esso, la voce non
> compare nella navigazione (e gli inviti non inviano email). Modelli, registro messaggi, casella di
> posta e statistiche richiedono l'autorizzazione di prodotto `notify:manage`. Per inviare un test
> serve anche `notify:send` nel tenant. Chiunque appartenga al prodotto può impostare le proprie
> preferenze.

## La schermata Notifiche {#overview}

Apri [Notifiche](app:notifications). Con `notify:manage` vedi **Statistiche di consegna** e le
schede **Modelli**, **Registro messaggi**, **Casella di posta** e **Le mie preferenze**. Senza
questa autorizzazione vedi solo **Le mie preferenze**.

**Statistiche di consegna** conta i messaggi di questo prodotto per stato, in totale e nelle
**Ultime 24 ore**, e mostra il **Provider di consegna**, i **Tentativi di consegna (24 h)** e il
**Messaggio in coda più vecchio**. Il riquadro si aggiorna ogni 30 secondi. Un messaggio in coda da
molto tempo di solito significa che nessun dispatcher è in esecuzione (vedi
[Risoluzione dei problemi](help:notifications#troubleshooting)).

## Modelli {#templates}

La scheda **Modelli** elenca i tuoi modelli e quelli **Predefinito** forniti di serie, con
categoria, lingue e versione. Badge:

- **Predefinito**: un modello fornito con Axentra (attualmente `invitation`, in inglese e tedesco).
  Aprilo e salvalo per creare una tua versione con la stessa chiave, che sostituisce quello
  predefinito per questo prodotto. Se elimini la tua versione, torna quello predefinito.
- **Sensibile**: il contenuto dei messaggi inviati non viene mai mostrato e viene cancellato dopo
  l'invio.
- **Solo sistema**: Axentra invia questo modello da solo (l'email di invito con il suo link di
  accettazione monouso). Puoi modificarne il contenuto, ma non puoi inviarlo manualmente né come test.

### Creare un modello {#create-template}

1. Scegli **Nuovo modello**.
2. In **Generale**, inserisci la **Chiave del modello**, per esempio `welcome`. Il tuo prodotto
   invia il modello tramite questa chiave; non si può cambiare in seguito.
3. Facoltativo: **Nome** e **Descrizione** per Studio.
4. Inserisci la **Categoria**, per esempio `onboarding` (vedi [Categorie](help:notifications#categories)).
5. Attiva **Sensibile** per contenuti come link o codici monouso.
6. In **Variabili e valori di esempio**, dichiara ogni segnaposto e indica un valore di esempio per
   l'anteprima (vedi [Segnaposto](help:notifications#placeholders)).
7. In **Contenuto per lingua**, compila **Oggetto** e **Testo** per `en` e, se vuoi, **HTML**.
8. Aggiungi altre lingue (vedi [Lingue](help:notifications#locale-variants)).
9. Scegli **Crea modello**.

Ogni salvataggio successivo incrementa la versione (**Salva nuova versione**). Le versioni
precedenti non vengono conservate: il registro messaggi memorizza il contenuto composto e il numero
di versione di ogni messaggio, non il vecchio modello.

### Impostazioni del modello {#template-settings}

| Impostazione             | Cosa fa                                                                                 | Valori consentiti / predefinito                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Chiave del modello**   | Identificatore usato per l'invio                                                        | Da 2 a 63 caratteri: lettere minuscole, cifre, `_`, `.` e `-`, deve iniziare con una lettera; non modificabile |
| **Categoria**            | Raggruppa i modelli per le disiscrizioni                                                | Da 2 a 41 tra lettere minuscole, cifre e `_`, deve iniziare con una lettera; predefinito `transactional`       |
| **Canale**               | Canale di consegna                                                                      | Solo **Email**                                                                                                 |
| **Sensibile**            | Il contenuto dei messaggi inviati non viene mai restituito ed è cancellato dopo l'invio | Disattivato                                                                                                    |
| **Variabili**            | Segnaposto che il modello può usare                                                     | Al massimo 50; lettere, cifre e `_`, senza iniziare con una cifra                                              |
| **Contenuto per lingua** | Oggetto, testo e HTML facoltativo per lingua                                            | Da 1 a 20 lingue; `en` è obbligatoria                                                                          |

### Segnaposto {#placeholders}

Scrivi i segnaposto come `{{ name }}` nell'oggetto, nel testo o nell'HTML. Sono supportati solo
segnaposto semplici: niente condizioni, cicli, filtri o espressioni, e qualsiasi altra cosa che
inizi con `{{` viene rifiutata al salvataggio. Ogni segnaposto deve essere dichiarato come
variabile; se il testo ne usa di non dichiarati, Studio propone **Dichiara i segnaposto usati**.

Quando un messaggio viene inviato, ogni segnaposto ha bisogno di un valore (stringa, numero o
true/false, al massimo 10 000 caratteri). Nel corpo testuale i valori vengono inseriti così come
sono; nel corpo HTML vengono sottoposti a escape HTML. Gli oggetti non contengono mai a capo.

> [!WARNING]
> Un valore usato all'interno di un link (`href`) determina la destinazione del link. Tieni i link
> nel modello o falli costruire dal tuo backend; non lasciare che siano gli utenti finali a fornirli.

### Categorie {#categories}

I destinatari possono disiscriversi da singole categorie nelle loro preferenze. `transactional` e
`security` vengono sempre consegnate e non consentono la disiscrizione. Usale solo per messaggi che
un utente deve ricevere, come il ripristino della password o le ricevute. Studio suggerisce
`transactional`, `security`, `onboarding` e `product`; puoi inserire qualsiasi categoria valida.

### Lingue e fallback {#locale-variants}

Ogni lingua è una **variante**. Per aggiungerne una, digita un codice di lingua come `de` o `de-at`
in **Aggiungi lingua** e scegli **Aggiungi**; **Rimuovi lingua …** la rimuove. L'inglese (`en`) è
obbligatorio.

Axentra sceglie la variante in quest'ordine: la lingua richiesta (per esempio `de-at`), poi la sua
lingua di base (`de`), poi `en`. La lingua richiesta è quella scelta al momento dell'invio,
altrimenti la lingua dell'utente destinatario, altrimenti (per gli inviti) la lingua predefinita
del prodotto, altrimenti l'inglese.

## Anteprima {#preview}

L'**Anteprima** accanto all'editor viene generata dal server a partire dallo stato attuale, non
salvato, con i tuoi valori di esempio, un attimo dopo che smetti di scrivere. Scegli la lingua nel
selettore dell'anteprima; “Generata nella lingua …” ti dice quale variante è stata usata.
L'anteprima compare quando ogni lingua ha un oggetto e un testo.

L'HTML viene mostrato in un riquadro isolato: gli script non vengono mai eseguiti e immagini,
font e stili remoti non vengono caricati. I programmi di posta dei destinatari possono mostrare il
messaggio in modo diverso.

## Inviare un test {#send-test}

**Invia test** (nell'editor, oppure l'icona di invio nell'elenco dei modelli) invia una notifica
**reale**:

1. Scegli il **Tenant**. Il messaggio appartiene a questo tenant; lì ti serve `notify:send`.
2. Scegli il destinatario:
   - **Un membro del tenant**: scegli il **Membro**. Viene usata la sua lingua, a meno che tu non ne scelga una.
   - **Un indirizzo email**: solo con l'autorizzazione di prodotto `notify:send_external`
     (proprietari e amministratori del prodotto). Senza di essa Studio spiega che puoi inviare solo
     ai membri.
3. Facoltativo: scegli una **Lingua**; se non la scegli viene usata la lingua del destinatario,
   altrimenti l'inglese.
4. Modifica i **Valori** (precompilati con i valori di esempio).
5. Facoltativo: **Anteprima** mostra il risultato con questi valori. Poi scegli **Invia**.

Studio conferma con **Notifica accettata**, l'id del messaggio e lo stato. La consegna avviene in
modo asincrono; seguila nel **Registro messaggi**. Ogni finestra di dialogo invia con una propria
chiave di idempotenza, quindi un clic ripetuto dopo un errore di rete non invia due volte.

Se il destinatario si è disiscritto dalla categoria del modello, il messaggio viene accettato con
lo stato **Soppresso** e non viene consegnato.

## Registro messaggi {#message-log}

Il **Registro messaggi** è la posta in uscita: ogni notifica del prodotto con orario, modello
(chiave, versione e lingua), **Destinatario**, **Stato**, **Tentativi** e **Ultimo errore**. Filtra
per **Stato**, **Chiave del modello**, **Destinatario** e **Tenant**, poi scegli **Applica**;
**Reimposta filtri** li azzera. L'icona dei dettagli apre tutti i campi e, se disponibile, il
contenuto.

| Stato            | Significato                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **In coda**      | In attesa del dispatcher; **Prossimo tentativo** indica quando                                      |
| **In invio**     | Un dispatcher lo sta consegnando                                                                    |
| **Inviato**      | Il provider lo ha accettato                                                                         |
| **Non riuscito** | Errore permanente, oppure tutti i tentativi esauriti                                                |
| **Soppresso**    | Non inviato: il destinatario si è disiscritto dalla categoria, o l'utente non ha un indirizzo email |

Una consegna non riuscita viene ritentata automaticamente con attese crescenti, per impostazione
predefinita fino a 5 tentativi. **Riprova consegna** rimette in coda un messaggio **Non riuscito**
con nuovi tentativi. Non è possibile dopo che il contenuto è stato cancellato dalla conservazione;
in quel caso invia di nuovo la notifica.

Il contenuto può mancare: i modelli sensibili non lo mostrano mai, la conservazione lo cancella
(per impostazione predefinita 30 giorni dopo la consegna) e i messaggi soppressi non ne memorizzano.
Studio indica quale caso si applica. Dall'ultimo errore il server rimuove token, chiavi e password.

> [!NOTE]
> La consegna è “almeno una volta”: dopo un crash un messaggio può essere consegnato due volte. I
> messaggi hanno un Message-ID stabile, così i server di posta possono riconoscere i duplicati.
> L'ordine dei messaggi non è garantito.

## Casella di posta {#mailbox}

La **Casella di posta** esiste solo quando il server usa il provider locale di sviluppo
(`notify.provider = "local"`). Quel provider non invia nulla; conserva qui ciò che ha “consegnato”,
così puoi controllare i modelli su server di sviluppo e di test. Filtra per **Destinatario** e apri
un messaggio per vederlo come è stato consegnato.

Con un provider reale (SMTP), la scheda indica **Nessuna casella di posta locale su questo
server**: i messaggi vanno a destinatari reali e li segui nel **Registro messaggi**.

## Le mie preferenze {#preferences}

In **Le mie preferenze** scegli quali categorie ricevere da questo prodotto:

1. In **Si applica a**, scegli **L'intero prodotto** o un tenant.
2. In **Ricevi queste categorie**, deseleziona le categorie che non vuoi. Le categorie bloccate
   (`transactional`, `security`) vengono sempre consegnate.
3. Scegli **Salva preferenze**.

Le preferenze valgono per i messaggi inviati da quel momento in poi, a te come utente e al tuo
indirizzo email. Una categoria che disattivi per l'intero prodotto resta disattivata in ogni
tenant; un'impostazione del tenant può disattivarne altre, ma non riattivarle. Le categorie
compaiono quando il prodotto ha modelli che le usano. Per impostare le preferenze di un tenant
serve `notify:preferences` in quel tenant (membri e amministratori ce l'hanno).

## Per amministratori e sviluppatori {#developers}

- **Invio dal tuo prodotto**: `POST /v1/products/{product_id}/tenants/{tenant_id}/notify/send`
  con `template_key`, `to` (`{"user_id": …}` o `{"email": …}`), `variables` e `locale`
  facoltativo, più un header `Idempotency-Key`. Serve `notify:send` nel tenant; gli indirizzi
  liberi al di fuori dei membri del tenant richiedono anche `notify:send_external`. Vedi
  [Nozioni di base sull'API](help:api-basics).
- **Dispatcher**: i messaggi vengono consegnati solo mentre è in esecuzione un dispatcher
  (`axentra notify-dispatch
--loop` o un worker). Senza dispatcher, i messaggi restano **In coda**.
- **Provider e impostazioni** (`[notify]`): `provider` (`local` o `smtp`), `sender`, host SMTP,
  porta, credenziali e STARTTLS, `max_attempts` (predefinito 5), backoff, `content_retention_days`
  (predefinito 30) e `message_retention_days` (predefinito 180). Vedi
  [Configurazione del server](help:server-configuration).
- **Privacy**: oggetti e corpi sono cifrati a riposo. Gli indirizzi dei destinatari sono dati
  personali e sono visibili a chi ha `notify:manage`; vengono eliminati insieme al messaggio alla
  scadenza della conservazione dei messaggi.
- **Inviti**: quando viene creato un invito a un tenant, Axentra invia il modello `invitation` con
  il link di accettazione. Vedi [Membri e inviti](help:members-invitations).

## Buono a sapersi {#good-to-know}

- Solo email: niente SMS né push, niente allegati, nessun indirizzo mittente per prodotto.
- Nessun link di disiscrizione né header `List-Unsubscribe`; le disiscrizioni funzionano solo
  tramite le preferenze e solo per indirizzi che appartengono a utenti.
- Non esiste ancora un limite di frequenza di invio per tenant.
- Vedi [Limitazioni note](help:limitations).

## Risoluzione dei problemi {#troubleshooting}

| Cosa vedi                                                                | Perché                                                                                                              | Cosa fare                                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Solo **Le mie preferenze**                                               | Non hai `notify:manage`                                                                                             | Chiedi a un amministratore del prodotto, se ti servono i modelli                                            |
| **Verifica i dati inseriti** al salvataggio                              | Chiave o categoria non valida, segnaposto non dichiarato, sintassi `{{ … }}` non supportata o nessuna variante `en` | Leggi il messaggio del server; correggi il campo o il segnaposto indicato                                   |
| L'anteprima segnala che manca un valore                                  | Una variabile dichiarata non ha un valore di esempio                                                                | Compila il **Valore di esempio**                                                                            |
| **Conflitto** “a template with this key exists”                          | Le chiavi sono univoche per prodotto                                                                                | Scegli un'altra chiave o modifica il modello esistente                                                      |
| **Modificato nel frattempo**                                             | Qualcun altro ha salvato il modello                                                                                 | Ricarica; le modifiche non salvate vanno perse, quindi copiale prima                                        |
| Nessuna icona di invio per un modello                                    | È **Solo sistema**, oppure non hai `notify:send`                                                                    | Normale per gli inviti; altrimenti chiedi un ruolo con `notify:send`                                        |
| “Non hai l'autorizzazione notify:send in questo tenant”                  | Il tuo ruolo non copre quel tenant                                                                                  | Scegli un altro tenant o chiedi un ruolo                                                                    |
| **Non consentito** durante l'invio a un indirizzo                        | L'indirizzo non è di un membro e non hai `notify:send_external`                                                     | Invia a un membro, oppure chiedi a un proprietario del prodotto                                             |
| **Non trovato** per un membro                                            | L'utente non è membro del tenant                                                                                    | Scegli un membro del tenant selezionato                                                                     |
| I messaggi restano **In coda**; **Messaggio in coda più vecchio** cresce | Nessun dispatcher è in esecuzione                                                                                   | Chiedi all'operatore di eseguire `axentra notify-dispatch --loop` o un worker                               |
| I messaggi finiscono in **Non riuscito**                                 | SMTP ha rifiutato il messaggio o non è raggiungibile                                                                | Leggi **Ultimo errore**; chiedi all'operatore di controllare le impostazioni SMTP, poi **Riprova consegna** |
| **Conflitto** su **Riprova consegna**                                    | Il messaggio non è in errore, oppure il suo contenuto è stato cancellato                                            | Invia di nuovo la notifica                                                                                  |
| **Soppresso**                                                            | Il destinatario si è disiscritto dalla categoria, o non ha un indirizzo email                                       | Usa `transactional` solo per messaggi che gli utenti devono ricevere                                        |
| **Nessuna casella di posta locale su questo server**                     | Il server usa SMTP                                                                                                  | Usa il **Registro messaggi**                                                                                |
