---
title: Accesso e disconnessione
summary: Accedi con una password o con il single sign-on, scopri quando termina una sessione e risolvi i problemi di accesso.
keywords: login, accesso, accedere, entrare, logout, disconnessione, uscire, esci, password, SSO, single sign-on, OIDC, OpenID Connect, provider di identità, Keycloak, Entra ID, Google, sessione, scaduta, timeout, lingua, ritorno, password dimenticata, reimpostare la password
---

Studio lavora con il tuo account personale sul server Axentra. Quando accedi, il server avvia una
**sessione** per il tuo browser; da quel momento Studio agisce con i tuoi ruoli finché la sessione
non termina. A seconda della configurazione del server accedi con indirizzo email e password,
tramite **single sign-on** con il provider di identità della tua organizzazione, oppure in entrambi
i modi.

## Accedere con email e password {#password}

1. Apri Studio. Se non hai eseguito l'accesso, compare la pagina **Accedi**.
2. Inserisci **Indirizzo email** e **Password**.
3. Scegli **Accedi**.

**Risultato atteso:** Studio apre la pagina da cui provenivi oppure la dashboard del prodotto che
hai usato per ultimo. Se non hai ancora alcun prodotto, arrivi su **Prodotti**.

Il modulo viene mostrato solo se il server consente l'accesso con password. Gli account creati
tramite single sign-on non hanno una password e non possono usare il modulo; puoi impostare una
password per un account di questo tipo nel tuo [profilo](help:profile), se il server lo consente.

## Password dimenticata {#forgotten-password}

1. Nella pagina **Accedi**, scegli **Password dimenticata?** sotto il campo della password.
2. Inserisci l'indirizzo email del tuo account e scegli **Invia link di reimpostazione**.
3. Apri il link nell'email. Nella pagina **Scegli una nuova password**, inserisci due volte la nuova
   password e scegli **Salva la nuova password**.

**Risultato atteso:** vieni disconnesso ovunque, anche in questo browser, e accedi con la nuova
password. L'indirizzo ora risulta verificato, perché il link lo ha raggiunto.

La pagina dice sempre che un link è in arrivo: né Studio né il server rivelano se esiste un account
per un indirizzo. Nessuna email arriva se non c'è un account, se l'account è disattivato, se accede
solo con il single sign-on (non ha una password da reimpostare) o se hai chiesto un link meno di un
minuto fa. Il link funziona una volta, scade dopo poco tempo (30 minuti per impostazione predefinita)
e funziona solo il link più recente di un account. Un link non valido, scaduto o già usato mostra
**Questo link non è utilizzabile**; richiedine uno nuovo. Cambiare la password nel
[profilo](help:profile#password) invalida anche i link di reimpostazione aperti.

## Accedere con il single sign-on {#sso}

Se l'operatore ha collegato un provider di identità (OpenID Connect, per esempio Keycloak,
Microsoft Entra ID, Google o Auth0), la pagina di accesso mostra un pulsante **Continua con …** per
ogni provider, sotto il modulo della password e la parola **oppure**.

1. Scegli **Continua con** _il tuo provider_.
2. Accedi presso il tuo provider di identità come al solito (incluso l'eventuale passaggio di
   autenticazione a più fattori richiesto).
3. Il provider ti rimanda a Studio, con l'accesso già eseguito.

Buono a sapersi:

- L'autenticazione a più fattori è gestita dal tuo provider di identità, non da Axentra.
- Al tuo primo single sign-on, Axentra collega l'accesso a un account esistente con lo stesso
  indirizzo email **verificato**, oppure crea un nuovo account se il provider consente la
  registrazione o se esiste un [invito](help:members-invitations) aperto per il tuo indirizzo.
- Un nuovo account non riceve alcun accesso di per sé. Vedi prodotti e tenant solo dopo che
  qualcuno ti ha assegnato un ruolo o dopo che hai accettato un invito.

## Tornare da dove avevi interrotto {#return-to}

Quando la sessione termina mentre lavori, o quando apri il link a una pagina di Studio senza aver
eseguito l'accesso, Studio ti manda alla pagina di accesso e si ricorda della pagina. La pagina di
accesso mostra allora **Accedi per riprendere da dove avevi interrotto.** Dopo l'accesso (con
password o single sign-on) torni su quella pagina, compresi i filtri presenti nell'indirizzo.

Per sicurezza Studio torna solo alle proprie pagine; qualsiasi altra destinazione porta alla pagina
iniziale.

> [!WARNING]
> I dati non salvati in un modulo aperto vanno persi quando la sessione termina. Per le modifiche
> lunghe, salva di tanto in tanto.

## Quando termina una sessione {#session-end}

| La sessione termina …                           | Predefinito                                  |
| ----------------------------------------------- | -------------------------------------------- |
| Dopo la sua durata massima, anche se sei attivo | 12 ore (`security.session_ttl_hours`)        |
| Dopo un periodo senza alcuna richiesta          | 120 minuti (`security.session_idle_minutes`) |
| Quando esci                                     | Immediatamente                               |
| Quando tu o un amministratore la revocate       | Alla richiesta successiva                    |
| Quando il tuo account viene disattivato         | Immediatamente, tutte le sessioni            |
| Quando cambi la password                        | Tutte le tue **altre** sessioni              |

I valori sono impostati dall'operatore del server. Le tue sessioni attive (browser e dispositivi)
sono elencate nel tuo [profilo](help:profile), dove puoi anche terminarle.

Alcune azioni rilevanti per la sicurezza richiedono un accesso **recente**. Se il server risponde
**Accedi di nuovo**, Studio ti disconnette e, dopo il nuovo accesso, torni sulla stessa pagina per
ripetere l'azione.

> [!NOTE]
> Il single sign-on si limita ad **avviare** una sessione Axentra. Uscire da Studio non ti
> disconnette dal tuo provider di identità, e la disconnessione o il blocco presso il provider non
> terminano una sessione Axentra in corso; questa termina alla sua normale scadenza o quando un
> amministratore disattiva l'account.

## Uscire {#sign-out}

1. Apri il menu utente in alto a destra (le tue iniziali e il tuo nome).
2. Scegli **Esci**.

Studio termina la sessione sul server, dimentica tutti i dati caricati e mostra la pagina di
accesso. Su un computer condiviso, esci sempre.

## Scegliere la lingua prima di accedere {#language}

La pagina di accesso e la pagina di configurazione hanno un selettore della lingua sotto il modulo.
La tua scelta si applica subito e viene ricordata in questo browser. Dopo l'accesso puoi cambiare la
lingua nel menu utente (**Lingua**) o in **Impostazioni**; in quel caso viene salvata anche nel tuo
account e ti segue negli altri browser. Vedi [l'interfaccia](help:interface#language).

## Impostazioni {#settings}

Queste impostazioni del server influiscono sull'accesso. Solo l'operatore del server può
modificarle; Studio mostra i valori effettivi in **Impostazioni**.

| Impostazione                     | Che cosa fa                                                                                    | Predefinito |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- |
| `security.password_login`        | Consente l'accesso con email e password. Se disattivato, viene offerto solo il single sign-on. | attivo      |
| `security.login_rate_per_minute` | Accessi non riusciti consentiti per account e per minuto (per indirizzo di rete: il triplo).   | 10          |
| `security.session_ttl_hours`     | Durata massima della sessione.                                                                 | 12          |
| `security.session_idle_minutes`  | Timeout di inattività.                                                                         | 120         |
| Provider `[[oidc]]`              | Provider di single sign-on mostrati come **Continua con …**.                                   | nessuno     |

## Dettagli per gli amministratori {#details}

- La sessione risiede in un cookie `HttpOnly`; Studio non salva mai token nella memoria del
  browser. Le richieste che modificano dati richiedono anche un token CSRF, che Studio tiene in
  memoria.
- L'indirizzo di Studio deve essere il `security.public_url` del server oppure essere elencato in
  `security.allowed_origins`; altrimenti l'accesso e le richieste che modificano dati vengono
  rifiutati con `403`.
- Gli accessi, gli accessi non riusciti (`identity.login` con esito `denied`) e le disconnessioni
  vengono scritti nel [registro di audit](help:audit).
- Gli accessi non riusciti vengono limitati per account. Chiunque conosca un indirizzo può quindi
  bloccare l'accesso con password per quell'account fino a un minuto.
- Il single sign-on usa il flusso authorization code con PKCE. L'URI di reindirizzamento da
  registrare presso il provider è `<public URL of the API>/v1/auth/oidc/<provider id>/callback`.
  Configurazione: [configurazione del server](help:server-configuration).

## Errori del single sign-on {#sso-errors}

Quando il single sign-on non riesce, il server ti rimanda alla pagina di accesso e Studio mostra
**Il single sign-on non è stato completato** con il motivo:

| Motivo (codice)                                               | Che cosa significa                                                                                                                                            | Che cosa fare                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Tempo scaduto o avviato in un altro browser (`login_expired`) | L'accesso deve concludersi entro 10 minuti nello stesso browser.                                                                                              | Ricomincia dalla pagina di accesso.                                                    |
| Annullato o rifiutato (`access_denied`)                       | Hai annullato presso il provider, oppure il consenso è stato rifiutato.                                                                                       | Ricomincia e conferma presso il provider.                                              |
| Provider non raggiungibile (`provider_unavailable`)           | Axentra non è riuscito a raggiungere o a convalidare il provider.                                                                                             | Riprova più tardi; l'operatore controlla la configurazione del provider.               |
| Risposta non verificabile (`login_failed`)                    | Il token del provider non ha superato un controllo.                                                                                                           | Riprova; se il problema persiste, l'operatore controlla il log del server.             |
| Email non verificata (`email_not_verified`)                   | Il provider non ha confermato che il tuo indirizzo è verificato. Succede spesso con Microsoft Entra ID, che di frequente non invia il claim `email_verified`. | L'operatore configura il provider in modo che lo invii.                                |
| Dominio non consentito (`domain_not_allowed`)                 | Il dominio della tua email non è nell'elenco dei domini consentiti del provider.                                                                              | Usa un account di un dominio consentito.                                               |
| Nessun account (`signup_disabled`)                            | Non esiste un account per te e la registrazione è disattivata.                                                                                                | Chiedi a un amministratore un [invito](help:members-invitations), poi accedi di nuovo. |
| Account disattivato (`account_disabled`)                      | Il tuo account è disattivato.                                                                                                                                 | Contatta un amministratore.                                                            |
| Troppi tentativi (`rate_limited`)                             | Troppi accessi avviati dalla tua rete.                                                                                                                        | Attendi un minuto.                                                                     |
| Invito non accettato qui (`invitation_requires_post`)         | Un link di single sign-on conteneva un token di invito nel suo indirizzo, che il server rifiuta.                                                              | Apri di nuovo il link di invito dalla tua email e accedi dalla pagina di accesso.      |

## Risoluzione dei problemi {#troubleshooting}

| Messaggio                                                                       | Causa                                                                                                                                                               | Che cosa fare                                                                                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Accesso non riuscito** – “L'indirizzo email o la password non sono corretti.” | Indirizzo o password errati, account disattivato oppure account senza password (creato tramite single sign-on). Per sicurezza il server non dice quale sia il caso. | Controlla i dati inseriti; prova il single sign-on; chiedi a un amministratore di controllare l'account nella pagina [utenti](help:users). |
| **Troppe richieste**                                                            | Più tentativi non riusciti di quelli consentiti entro un minuto (10 per account per impostazione predefinita).                                                      | Attendi un minuto e riprova.                                                                                                               |
| **Nessun metodo di accesso disponibile**                                        | Il server non ha abilitato né l'accesso con password né il single sign-on.                                                                                          | L'operatore deve configurare l'autenticazione.                                                                                             |
| Il single sign-on ritorna con un errore                                         | Vedi [errori del single sign-on](help:signing-in#sso-errors).                                                                                                       |                                                                                                                                            |
| Vieni rimandato più volte alla pagina di accesso                                | Il browser blocca il cookie di sessione.                                                                                                                            | Consenti i cookie per l'indirizzo di Studio; chiedi all'operatore di controllare la configurazione.                                        |
| **Non consentito** subito all'accesso                                           | L'indirizzo di Studio non è né l'URL pubblico del server né presente in `security.allowed_origins`.                                                                 | L'operatore aggiunge l'indirizzo di Studio a `security.allowed_origins`.                                                                   |
| **Impossibile verificare la sessione**                                          | Non è stato possibile interrogare il server sulla tua sessione (errore di rete o del server).                                                                       | Scegli **Riprova**; dopo il nuovo accesso controlla **Stato del sistema**.                                                                 |
| **Accedi di nuovo**                                                             | L'azione richiede un accesso recente.                                                                                                                               | Accedi di nuovo e ripeti l'azione.                                                                                                         |
| Dopo l'accesso non vedi alcun prodotto                                          | Il tuo account non ha ancora un ruolo.                                                                                                                              | Chiedi a un amministratore di aggiungerti o di inviarti un invito.                                                                         |
