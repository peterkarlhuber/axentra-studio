---
title: Sicurezza
summary: Come Axentra e Studio proteggono gli accessi, separano i tenant, limitano ciò che le persone possono concedere e gestiscono i segreti, e cosa puoi fare per mantenere sicura la tua installazione.
keywords: sicurezza, sessione, cookie, CSRF, sicurezza a livello di riga, row-level security, RLS, isolamento dei tenant, tetto dei ruoli, segreto, chiave API, rotazione, firma webhook, HMAC, audit, privacy, GDPR, protezione dei dati, password
---

Axentra è costruito in modo che un errore in un punto non apra tutto: l'accesso è negato finché un
ruolo non lo concede, i dati di ogni tenant sono separati nel database, nessuno può distribuire più
diritti di quanti ne possieda, e i segreti vengono mostrati una volta sola e poi conservati solo in
una forma che non si può rileggere. Questa pagina spiega queste protezioni con parole semplici, cosa
ne vedi in Studio e le abitudini che mantengono sicura un'installazione.

> [!NOTE]
> Studio è solo una finestra sul server Axentra. Ogni decisione (chi può vedere o modificare cosa)
> la prende il server. Studio nasconde i pulsanti che non puoi usare, ma nasconderli è una comodità,
> non la protezione.

## Sessioni e protezione CSRF {#sessions-csrf}

### La tua sessione {#sessions}

Quando accedi, il server crea una _sessione_ e il tuo browser riceve un cookie di sessione. Il
cookie è contrassegnato in modo che gli script di una pagina non possano leggerlo e, su HTTPS,
viene inviato solo tramite connessioni cifrate. Il server conserva solo un'impronta (hash) del
token di sessione, mai il token stesso. A ogni accesso viene creato un nuovo token.

Una sessione termina:

- dopo la sua durata massima (predefinito 12 ore),
- dopo un periodo di inattività (predefinito 120 minuti),
- quando scegli **Esci** nel menu utente,
- quando la revochi in **Le tue sessioni** nel tuo [profilo](help:profile), oppure quando un
  amministratore usa **Disconnetti ovunque** nella tua pagina utente,
- quando il tuo account viene disattivato,
- per tutte le tue _altre_ sessioni, quando cambi la password.

Il tuo operatore può modificare le durate. Quando una sessione termina, Studio ti porta alla pagina
di accesso e poi di nuovo dove eri (vedi [Sessione terminata](help:troubleshooting#session-ended)).

### Protezione CSRF {#csrf}

La _cross-site request forgery_ (CSRF) è un attacco in cui un altro sito web cerca di far inviare
al tuo browser una modifica ad Axentra mentre hai effettuato l'accesso. Axentra la blocca in tre
modi, e tu non devi fare nulla:

1. Il cookie di sessione non viene inviato con le richieste che altri siti attivano in background
   (`SameSite=Lax`).
2. Ogni modifica inviata da Studio contiene un token di sicurezza che appartiene alla tua sessione.
   Studio conserva questo token solo in memoria, mai nello storage del browser.
3. Il server verifica che la richiesta provenga da un indirizzo attendibile (l'indirizzo di Studio
   deve essere nell'elenco delle origini consentite del server).

Se Studio gira a un indirizzo che il server non considera attendibile, l'accesso e ogni modifica
falliscono con **Non consentito**; vedi
[L'accesso o il salvataggio non riesce](help:troubleshooting#csrf-origin).

### Password e tentativi di accesso {#passwords}

Le password sono memorizzate con Argon2id, un hash unidirezionale lento. Per impostazione
predefinita la policy del server richiede almeno 12 caratteri. Un accesso non riuscito indica
sempre che l'indirizzo email _o_ la password sono errati, così nessuno può scoprire quali account
esistono. Dopo circa 10 tentativi falliti per un account entro un minuto (di più da uno stesso
indirizzo di rete), gli ulteriori tentativi vengono rifiutati per un massimo di un minuto.

Impostare una _prima_ password su un account che accede solo tramite single sign-on è consentito
solo entro pochi minuti dall'accesso, così una sessione rubata non può essere trasformata in un
accesso permanente con password (vedi
[Accedi di nuovo](help:troubleshooting#reauthentication-required)).

## Isolamento dei tenant {#tenant-isolation}

Ogni cliente o organizzazione di un prodotto è un [tenant](help:tenants). Axentra tiene separati i
tenant su due livelli indipendenti:

1. **Controlli delle autorizzazioni.** Prima di leggere o scrivere qualsiasi dato, il server
   verifica che tu (o la chiave API) abbia l'autorizzazione necessaria esattamente per questo
   prodotto e questo tenant.
2. **Sicurezza a livello di riga nel database.** Ogni transazione del database è limitata a un
   prodotto o a un tenant. Anche se una query dimenticasse un filtro, il database stesso
   restituirebbe solo le righe di quel prodotto o tenant e si rifiuterebbe di scrivere righe per un
   altro.

Cosa significa per te:

- Un membro di un tenant vede solo i dati del proprio tenant. Chi non ha legami con un prodotto o
  un tenant riceve **Non trovato**, esattamente come se non esistesse.
- Un ruolo a livello di prodotto (per esempio **Product admin**) vale in _ogni_
  tenant del prodotto. Assegna i ruoli di prodotto solo a chi ha davvero bisogno di questa portata.
- Una chiave API appartiene a un prodotto e può essere limitata a un tenant.
- Gli account utente sono globali: un account può lavorare in più prodotti e tenant. Gli
  amministratori del prodotto vedono solo gli utenti legati al loro prodotto.

> [!NOTE]
> Gli amministratori del database, e i backup del database, possono vedere tutti i dati. Proteggere
> il server del database e i suoi backup è compito dell'operatore.

## Tetto dei ruoli: nessuno può concedere più di quanto possiede {#role-ceiling}

Poter gestire i membri (`members:manage`, oppure `product_members:manage` per gli operatori di
prodotto) non significa poter rendere chiunque amministratore. Il server applica un _tetto dei
ruoli_:

- Puoi assegnare un ruolo (aggiungere, invitare o modificare un membro) solo se **possiedi ogni
  autorizzazione di quel ruolo** nello stesso ambito.
- Puoi modificare o rimuovere un membro solo se anche il suo ruolo _attuale_ rientra nelle tue
  autorizzazioni.
- I ruoli di proprietario (**Owner** di un tenant, **Product owner** di un
  prodotto) possono essere assegnati, modificati o rimossi solo da un proprietario dello stesso
  ambito, o da qualcuno con autorità dall'alto: gli operatori di prodotto per i tenant, gli
  amministratori della piattaforma ovunque.
- L'ultimo proprietario di un prodotto o di un tenant non può essere rimosso né declassato, e
  l'ultimo amministratore della piattaforma non può essere disattivato né declassato.

In Studio, i ruoli che non puoi assegnare compaiono come **"… (oltre le tue autorizzazioni)"** e
non sono selezionabili; i membri al di sopra del tuo livello mostrano **Superiore al tuo ruolo:
solo chi possiede le autorizzazioni di questo ruolo può modificarlo**. Lo stesso principio vale per
le chiavi API: una nuova chiave può avere solo autorizzazioni che il suo creatore possiede. Le
autorizzazioni della piattaforma non vengono mai concesse alle chiavi API.

Dettagli ed esempi: [Ruoli e autorizzazioni](help:roles-permissions) e il
[riferimento delle autorizzazioni](help:permissions-reference).

## Segreti mostrati una sola volta {#one-time-secrets}

Alcuni valori sono segreti che permettono a una macchina o a una persona di agire per tuo conto.
Axentra mostra ciascuno di essi **una sola volta**:

| Segreto                                  | Quando viene mostrato                                      | Come lo conserva il server                     |
| ---------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| Segreto della chiave API (`axk_…`)       | Dopo la creazione o la rotazione di una chiave             | Solo un hash; non può essere mostrato di nuovo |
| Segreto di firma del webhook (`whsec_…`) | Dopo la creazione di un webhook o la rotazione del segreto | Cifrato (AES-256-GCM), usato solo per firmare  |
| Link e token di invito                   | Dopo la creazione di un invito                             | Solo un hash del token                         |
| Token di configurazione                  | Stampato sul server per il primo amministratore            | Solo un hash; valido per un tempo limitato     |

In Studio, i segreti delle chiavi API e dei webhook compaiono in una finestra di dialogo con un
avviso, un campo mascherato e pulsanti per copiarli. La finestra non si chiude con Esc né facendo
clic all'esterno; confermi con **Ho conservato il segreto in modo sicuro**. I link e i token di
invito vengono mostrati in un riquadro contrassegnato **Mostrato una sola volta**.

Se un segreto va perso, non si può recuperare: [ruota la chiave API](help:api-keys), ruota il
[segreto del webhook](help:webhooks) oppure crea un nuovo invito.

## Buone pratiche per le chiavi API {#api-key-hygiene}

Le [chiavi API](help:api-keys) permettono ad altri sistemi di chiamare l'API di Axentra. Buone
pratiche:

- **Una chiave per servizio e ambiente**, con un nome che indichi dove viene usata (per esempio
  "billing-worker production"), così puoi revocarne una senza compromettere le altre.
- **Privilegio minimo:** concedi solo le autorizzazioni di cui il servizio ha bisogno, e limita la
  chiave a un tenant quando il servizio lavora per un solo tenant.
- **Conserva i segreti in un secret manager**, mai nel codice sorgente, nei ticket o in chat.
- **Ruota regolarmente** con **Ruota segreto**. Un periodo di tolleranza (fino a 7 giorni) mantiene
  valido il vecchio segreto mentre aggiorni i servizi.
- **Revoca le chiavi che non ti servono più.** Revocare una chiave revoca anche tutte le chiavi
  create con essa. Le chiavi create da una persona appartengono al prodotto, non alla persona:
  quando qualcuno se ne va, controlla e revoca le chiavi che ha configurato.
- Tieni d'occhio la colonna **Ultimo utilizzo**: una chiave mai usata si può eliminare; una chiave
  usata in modo inatteso merita un controllo nel [registro di audit](help:audit).

## Firme dei webhook {#webhook-signing}

Axentra firma ogni richiesta [webhook](help:webhooks), così il sistema che la riceve può verificare
che provenga davvero dal tuo server Axentra e che non sia stata modificata o riprodotta. Ogni
richiesta contiene un header `Axentra-Signature`:

```text
Axentra-Signature: t=1767225600,v1=5f2b…
```

`t` è l'ora della firma (secondi Unix); `v1` è un HMAC-SHA256 di `<t>.<raw request body>` calcolato
con il segreto di firma del webhook. Durante una rotazione del segreto con periodo di tolleranza,
l'header contiene due valori `v1`, uno per segreto. Il ricevitore dovrebbe:

1. calcolare l'HMAC su timestamp, un punto e il corpo grezzo,
2. confrontarlo con ogni valore `v1` in tempo costante,
3. rifiutare le richieste con un timestamp più vecchio di circa 5 minuti,
4. ignorare gli eventi il cui id (`Axentra-Event-Id`) è già stato elaborato.

Il [tutorial sul ricevitore di webhook](help:tutorial-webhook-receiver) illustra un esempio completo.

## Traccia di audit {#audit-trail}

Il server registra le modifiche rilevanti per la sicurezza in un [registro di audit](help:audit) in
sola aggiunta: chi (utente o chiave API), cosa (per esempio `access.role.create`), quando, su quale
prodotto e tenant, l'esito, l'ID richiesta, l'indirizzo IP e il browser o client. I segreti vengono
rimossi dai dettagli registrati prima della memorizzazione.

Gli operatori di prodotto con `audit:read` vedono gli eventi del loro prodotto; gli amministratori e
i visualizzatori della piattaforma (`platform:audit`) vedono gli eventi a livello di installazione,
come accessi e modifiche agli utenti. Gli eventi di audit vengono conservati per un periodo
stabilito dal tuo operatore (predefinito 365 giorni).

## Cosa Studio non memorizza mai {#what-studio-never-stores}

- **Nessun segreto nel browser.** Il token CSRF e un eventuale token di monitoraggio che inserisci
  vengono tenuti solo in memoria e scompaiono quando chiudi o ricarichi la scheda. I segreti
  mostrati una sola volta vengono visualizzati, mai salvati.
- **Nello storage del browser solo preferenze innocue:** lingua, tema, barra laterale compressa e
  ultimo prodotto usato.
- **Nessun dato di carte o conti bancari.** Studio non chiede mai dati di pagamento; i pagamenti
  avvengono solo nella pagina ospitata dal provider di pagamento (vedi
  [Piani e abbonamenti](help:plans-subscriptions)).
- **Nessuno script di terze parti.** Studio carica il proprio codice solo dal proprio indirizzo. Le
  anteprime delle email vengono mostrate in una sandbox che non può eseguire script.

Il server rimuove inoltre password, token e chiavi dai suoi log, dai messaggi di errore e dai
dettagli di audit.

## Buone pratiche {#good-practice}

- Assegna i ruoli nella piattaforma con parsimonia; preferisci ruoli di prodotto e di tenant.
- Usa i ruoli predefiniti quando sono adatti, e ruoli personalizzati con le sole autorizzazioni
  necessarie.
- Disattiva gli account di chi se ne va (**Disattiva utente** termina subito tutte le sue sessioni)
  e controlla le chiavi API che ha creato.
- Controlla regolarmente il [registro di audit](help:audit), in particolare le modifiche a ruoli,
  chiavi e membri.
- Esci dai computer condivisi e revoca nel tuo [profilo](help:profile) le sessioni che non
  riconosci.

> [!IMPORTANT]
> Axentra fornisce misure tecniche (separazione dei tenant, cifratura dei segreti memorizzati,
> traccia di audit, minimizzazione dei dati nei log), ma da solo non rende un'installazione
> conforme alle leggi sulla protezione dei dati come il GDPR. Hosting, backup, conservazione e
> richieste degli interessati sono responsabilità dell'operatore. Non esistono ancora
> un'esportazione o una cancellazione integrate dei dati di una persona (vedi
> [limitazioni](help:limitations)).

## Risoluzione dei problemi {#troubleshooting}

| Situazione                                                                                                                         | Causa e soluzione                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L'accesso e tutte le modifiche falliscono con **Non consentito** (`cross-origin request refused`, `missing or invalid CSRF token`) | L'indirizzo di Studio non è tra le origini consentite del server, oppure il cookie è bloccato. Vedi [la voce nella risoluzione dei problemi](help:troubleshooting#csrf-origin). |
| Vieni disconnesso inaspettatamente                                                                                                 | La sessione è scaduta, è stata revocata, oppure la password è stata cambiata in un'altra sessione. Accedi di nuovo.                                                             |
| **Non consentito** durante l'assegnazione di un ruolo                                                                              | Tetto dei ruoli: il ruolo contiene autorizzazioni che non possiedi, oppure è un ruolo di proprietario. Chiedi a un proprietario.                                                |
| **Non consentito** durante la creazione di una chiave API                                                                          | Hai cercato di concedere un'autorizzazione che non possiedi. Rimuovila dalla selezione.                                                                                         |
| **Accedi di nuovo** durante l'impostazione di una password                                                                         | Consentito solo poco dopo l'accesso. Scegli **Accedi di nuovo**, poi ripeti subito.                                                                                             |
| Un ricevitore rifiuta le firme dei webhook                                                                                         | Deve firmare il corpo _grezzo_, accettare qualsiasi valore `v1` e usare il segreto attuale. Vedi [Webhook](help:webhooks).                                                      |
| Hai perso un segreto                                                                                                               | Non può essere mostrato di nuovo; ruotalo o crea un nuovo invito.                                                                                                               |
