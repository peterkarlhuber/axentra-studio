---
title: Configurazione iniziale
summary: Crea il primo amministratore della piattaforma di un nuovo server Axentra con un token di configurazione monouso.
keywords: configurazione, installazione, configurazione iniziale, primo avvio, bootstrap, token di configurazione, setup token, primo amministratore, amministratore della piattaforma, onboarding, configurare Axentra
---

Un nuovo server Axentra non ha ancora un amministratore. Finché è così, il server segnala "setup
required" e Studio mostra la pagina **Configura Axentra** al posto della pagina di accesso. Lì crei
il primo **amministratore della piattaforma**: l'account con il controllo completo
dell'installazione. Ti serve un **token di configurazione** fornito da chi gestisce il server.

## Prima di iniziare {#before-you-start}

> [!IMPORTANT]
>
> - Il server Axentra è in esecuzione e Studio riesce a raggiungerlo.
> - Nessuno ha ancora completato la configurazione. La pagina è disponibile solo finché non esiste
>   il primo amministratore della piattaforma.
> - Qualcuno con accesso alla shell del server può eseguire il comando `axentra`.

## Ottenere un token di configurazione {#setup-token}

Il token di configurazione dimostra che sei autorizzato a prendere possesso del nuovo server. Viene
creato sul server stesso, quindi solo chi controlla il server può consegnarlo.

1. Sul server (o nel container del server), esegui:

   ```bash
   axentra admin setup-token
   ```

2. Il comando stampa un token che inizia con `axsetup_`. Copialo.

| Proprietà     | Valore                                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validità      | 60 minuti per impostazione predefinita (impostazione dell'operatore `security.setup_token_ttl_minutes`, almeno 5).                                                            |
| Utilizzo      | Una sola volta. Un token usato smette di funzionare.                                                                                                                          |
| Disponibilità | Solo finché non esiste un amministratore della piattaforma. Se ne esiste uno, il comando stampa "setup is already complete (a platform admin exists)" e non crea alcun token. |

Puoi creare un nuovo token in qualsiasi momento finché la configurazione è ancora aperta; i token
precedenti non usati restano validi fino alla scadenza.

> [!CAUTION]
> Il token di configurazione concede il controllo completo del server a chi lo usa per primo.
> Consegnalo solo alla persona che crea il primo amministratore, tramite un canale privato, e crea
> un token nuovo invece di inoltrarne uno vecchio via email.

## Creare il primo amministratore {#create-admin}

1. Apri Studio nel browser. **Configura Axentra** compare automaticamente.
2. Facoltativamente scegli la lingua con il selettore della lingua sotto il modulo.
3. Compila il modulo:

   | Campo                       | Che cosa inserire                                                                                      |
   | --------------------------- | ------------------------------------------------------------------------------------------------------ |
   | **Token di configurazione** | Il token ottenuto dal server, per esempio `axsetup_EXAMPLE…`.                                          |
   | **Nome completo**           | Il tuo nome come lo vedranno gli altri amministratori.                                                 |
   | **Indirizzo email**         | L'indirizzo con cui accederai.                                                                         |
   | **Password**                | Una password lunga e univoca (vedi le [regole per le password](help:first-run-setup#password-policy)). |
   | **Ripeti password**         | Di nuovo la stessa password.                                                                           |

4. Scegli **Crea amministratore**.

**Risultato atteso:** Studio segnala **Configurazione completata** ("Ora hai effettuato l'accesso
come amministratore della piattaforma") e apre Studio. In modalità multiprodotto senza ancora alcun
prodotto arrivi su **Prodotti** con l'indicazione di creare il primo prodotto; in modalità a
prodotto singolo arrivi sulla dashboard dell'unico prodotto del server.

## Regole per le password {#password-policy}

Il server controlla la password e la rifiuta se viola una di queste regole:

| Regola                       | Predefinito                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Lunghezza minima             | 12 caratteri (impostazione dell'operatore `security.password_min_length`, almeno 8).                 |
| Lunghezza massima            | 1024 caratteri.                                                                                      |
| Diversa dall'indirizzo email | La password non deve coincidere con l'indirizzo email (senza distinzione tra maiuscole e minuscole). |
| Non banale                   | Almeno 4 caratteri diversi.                                                                          |

Le password sono conservate come hash Argon2id; nessuno, nemmeno l'operatore, può rileggerle.

## Dopo la configurazione {#after-setup}

- La pagina di configurazione non è più raggiungibile; aprendo `/setup` arrivi alla pagina di
  accesso.
- Il tuo account ha il ruolo **Amministratore della piattaforma**. L'evento
  `identity.setup.complete` si trova nel [registro di audit](help:audit).
- La tua sessione funziona come qualsiasi altra sessione di accesso (vedi
  [accesso](help:signing-in#session-end)).

Passi successivi:

1. Crea il tuo primo prodotto e il primo tenant: [primi passi](help:first-steps).
2. Assegna il ruolo di amministratore della piattaforma a una seconda persona di fiducia, così
   l'installazione non dipende da un solo account (vedi [utenti](help:users)). Prima le serve un
   account, per esempio tramite [single sign-on](help:signing-in#sso).
3. Se il server deve usare solo il single sign-on, l'operatore può disattivare in seguito l'accesso
   con password (`security.password_login = false`).

## Risoluzione dei problemi {#troubleshooting}

| Messaggio                                                                                                                                                                               | Causa                                                                                                                                | Che cosa fare                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Token di configurazione non accettato**                                                                                                                                               | Il token è stato digitato male, è scaduto (più vecchio di 60 minuti per impostazione predefinita) o è già stato usato.               | Crea un nuovo token con `axentra admin setup-token` e incollalo senza spazi.                              |
| **Configurazione già completata**                                                                                                                                                       | Nel frattempo qualcuno ha creato un amministratore della piattaforma.                                                                | Accedi con quell'account oppure chiedi l'accesso al suo titolare. Studio ti porta alla pagina di accesso. |
| **Le password non coincidono.**                                                                                                                                                         | **Password** e **Ripeti password** sono diverse.                                                                                     | Digitale di nuovo entrambe.                                                                               |
| **Verifica i dati inseriti** con il messaggio del server "the password must have at least … characters", "the password must not equal the email address" o "the password is too simple" | Le [regole per le password](help:first-run-setup#password-policy) non sono state rispettate.                                         | Scegli una password più lunga e con più caratteri diversi.                                                |
| **Verifica i dati inseriti** con "invalid email address"                                                                                                                                | L'indirizzo email non è valido.                                                                                                      | Correggi l'indirizzo.                                                                                     |
| **Conflitto** con il messaggio del server "a user with this email address exists"                                                                                                       | Esiste già un account con questo indirizzo email (per esempio uno creato dal codice di una libreria).                                | Usa un altro indirizzo oppure chiedi all'operatore.                                                       |
| **Troppe richieste**                                                                                                                                                                    | Troppi tentativi di configurazione dalla tua rete entro un minuto (il limite di accesso, 10 al minuto per impostazione predefinita). | Attendi un minuto e riprova.                                                                              |
| Studio mostra la pagina di accesso invece della pagina di configurazione                                                                                                                | Esiste già un amministratore della piattaforma.                                                                                      | Accedi oppure chiedi un account a un amministratore esistente.                                            |
| **Impossibile connettersi ad Axentra**                                                                                                                                                  | Studio non riesce a raggiungere il server.                                                                                           | Verifica con l'operatore il server e l'indirizzo API di Studio.                                           |
