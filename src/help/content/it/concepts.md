---
title: Concetti chiave
summary: I componenti di base di Axentra spiegati in parole semplici, dalla piattaforma e dal prodotto fino a tenant, ruolo, autorizzazione e chiave API.
keywords: termini, terminologia, nozioni di base, modello, gerarchia, piattaforma, prodotto, tenant, cliente, organizzazione, utente, membro, operatore, invito, ruolo, autorizzazione, permesso, modulo, chiave API, prodotto singolo, multiprodotto, modalità
---

Questo articolo spiega i termini che incontri ovunque in Studio e come si collegano tra loro.
Leggilo una volta prima di iniziare; il [glossario](help:glossary) contiene definizioni brevi da
consultare in seguito.

```diagram
hierarchy
```

## Piattaforma (installazione) {#platform}

La **piattaforma** è un server Axentra con il suo database. Gli account utente esistono una sola
volta per piattaforma e possono appartenere a più prodotti. Le pagine di Studio valide per
l'intera piattaforma sono **Prodotti**, **Registro di audit**, **Stato del sistema**,
**Monitoraggio** e **Impostazioni**.

### Ruoli nella piattaforma {#platform-roles}

Un utente può avere un solo ruolo nella piattaforma, che vale per **tutti i prodotti** del server:

| Ruolo nella piattaforma                              | Che cosa consente                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Amministratore della piattaforma (`platform_admin`)  | Controllo completo dell'installazione: creare e archiviare prodotti, gestire tutti gli utenti e i loro ruoli nella piattaforma, leggere tutto. |
| Visualizzatore della piattaforma (`platform_viewer`) | Accesso in lettura all'intera installazione.                                                                                                   |

Il primo amministratore della piattaforma viene creato durante la
[configurazione iniziale](help:first-run-setup). Gli altri ruoli nella piattaforma si assegnano
nella pagina di un utente (vedi [utenti](help:users)). L'ultimo amministratore della piattaforma
non può essere disattivato né perdere il ruolo.

## Prodotto {#product}

Un **prodotto** è un'applicazione che gira sulla piattaforma, per esempio “Example CRM”. Ogni
prodotto ha i propri tenant, ruoli, chiavi API, dati, piani e modelli, isolati da tutti gli altri
prodotti. La maggior parte delle pagine di Studio appartiene a un prodotto; l'indirizzo inizia
allora con `/p/<product id>/` e il [selettore di prodotto](help:interface#product-switcher) mostra
di quale si tratta.

Chi gestisce un prodotto nel suo insieme è un **operatore di prodotto** e ha un ruolo di prodotto:

| Ruolo di prodotto predefinito                | In breve                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Product owner (proprietario del prodotto)    | Controllo completo del prodotto. Chi crea un prodotto ne diventa il proprietario.                                           |
| Product admin (amministratore del prodotto)  | Gestisce tenant, ruoli, chiavi e dati; non può gestire gli operatori del prodotto né dichiarare autorizzazioni di prodotto. |
| Support (supporto)                           | Legge tutto nel prodotto e gestisce i membri dei tenant nei limiti delle proprie autorizzazioni.                            |
| Product viewer (visualizzatore del prodotto) | Accesso in sola lettura al prodotto.                                                                                        |

Un ruolo di prodotto che contiene autorizzazioni di tenant le concede in **ogni** tenant del
prodotto. Vedi [prodotti](help:products).

## Tenant {#tenant}

Un **tenant** è un cliente o un'organizzazione all'interno di un prodotto, per esempio “Acme Srl”.
I dati dei diversi tenant sono rigorosamente separati, anche all'interno del database (sicurezza a
livello di riga). Un tenant è **attivo** o **sospeso**; la sospensione blocca i suoi membri e le
chiavi API legate al tenant senza eliminare dati. Vedi [tenant](help:tenants).

## Utente {#user}

Un **utente** è una persona con un account sulla piattaforma, di solito identificata da un
indirizzo email. Lo stesso account può essere membro di più tenant e operatore di più prodotti. Un
utente può essere **attivo** o **disattivato**; la disattivazione termina subito tutte le sessioni.

Gli account non si creano in Studio. Provengono dalla
[configurazione iniziale](help:first-run-setup), da un accesso tramite
[single sign-on](help:signing-in#sso) o dal codice del tuo prodotto (con Axentra usato come
libreria). Vedi [utenti](help:users).

## Membro {#member}

Un **membro** è un utente con un **ruolo di tenant** in un tenant. È l'appartenenza a dare a una
persona l'accesso ai dati di un tenant. Ruoli di tenant predefiniti:

| Ruolo di tenant predefinito | In breve                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| Owner (proprietario)        | Controllo completo del tenant.                                       |
| Admin (amministratore)      | Gestisce i membri e i dati del tenant.                               |
| Member (membro)             | Lavora con i dati del tenant. È il ruolo predefinito per gli inviti. |
| Viewer (visualizzatore)     | Accesso in sola lettura al tenant.                                   |

Non confondere i membri dei tenant con gli **operatori di prodotto** (membri del prodotto), che
hanno un ruolo di prodotto. Vedi [membri e inviti](help:members-invitations).

## Invito {#invitation}

Un **invito** chiede a una persona, tramite indirizzo email, di unirsi a un tenant con un
determinato ruolo. Contiene un token monouso, è valido 7 giorni e può essere revocato. La persona
invitata lo accetta dopo aver eseguito l'accesso con un account che ha **lo stesso indirizzo
email**. Non esistono inviti per gli operatori di prodotto. Vedi
[membri e inviti](help:members-invitations).

## Ruolo {#role}

Un **ruolo** è un insieme di autorizzazioni con un nome. Axentra fornisce ruoli predefiniti
(quelli sopra) che non possono essere modificati. Un prodotto può aggiungere **ruoli
personalizzati** con un **ambito**:

- Ambito **Tenant**: assegnato ai membri dei tenant, contiene solo autorizzazioni di tenant.
- Ambito **Prodotto**: assegnato agli operatori di prodotto, può contenere autorizzazioni di
  prodotto e di tenant.

Vedi [ruoli e autorizzazioni](help:roles-permissions).

## Autorizzazione {#permission}

Un'**autorizzazione** è un singolo diritto scritto come `resource:action`, per esempio
`tenants:create` o `records:write`. L'accesso è negato a meno che un ruolo o una chiave API non
conceda esplicitamente l'autorizzazione. Ogni autorizzazione ha un ambito:

| Ambito      | Significato                                                                                      | Esempi                                              |
| ----------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Piattaforma | Vale per l'intera installazione; la concedono solo i ruoli nella piattaforma, mai le chiavi API. | `products:create`, `users:manage`                   |
| Prodotto    | Riguarda un prodotto nel suo insieme.                                                            | `tenants:create`, `api_keys:manage`, `roles:manage` |
| Tenant      | Riguarda i dati all'interno di un tenant.                                                        | `members:manage`, `records:read`, `files:write`     |

I prodotti possono anche dichiarare **autorizzazioni proprie**, con uno spazio dei nomi e un punto,
per esempio `crm.deals:approve`. L'elenco completo si trova nel
[riferimento delle autorizzazioni](help:permissions-reference).

### Limite dei ruoli {#role-ceiling}

Poter gestire i membri non significa poter assegnare qualsiasi ruolo. Puoi assegnare un ruolo solo
se possiedi tu stesso **tutte le autorizzazioni di quel ruolo**; i ruoli di proprietario
richiedono inoltre il rango di proprietario. Gli amministratori della piattaforma sono esenti.
Studio contrassegna come non selezionabili i ruoli superiori al tuo livello. La stessa regola vale
per le chiavi API: una chiave può ricevere solo autorizzazioni che possiedi.

## Modulo {#modules}

Un **modulo** è un blocco funzionale del server che l'operatore attiva o disattiva nella
configurazione del server. `identity`, `tenancy`, `access`, `data` e `audit` sono sempre abilitati.
Tra i moduli opzionali ci sono `storage` (file), `events` (job, pianificazioni, eventi, webhook),
`usage`, `billing` e `notify` (notifiche).

In Studio, una voce della barra laterale il cui modulo non è abilitato resta visibile e mostra
**Off**. Aprendola compare **Modulo non abilitato su questo server**, con l'id del modulo che
l'operatore deve abilitare. Il riquadro **Server** della dashboard elenca tutti i moduli e il loro
stato. Vedi il [riferimento dei moduli](help:modules-reference).

## Chiave API {#api-key}

Una **chiave API** consente a una macchina (il backend del tuo prodotto, un'integrazione, uno
script) di chiamare l'API senza un utente. Ogni chiave appartiene esattamente a un prodotto, ha un
elenco esplicito di autorizzazioni e può facoltativamente essere legata a un tenant. Il suo segreto
viene mostrato **una sola volta**; Axentra ne conserva solo un hash. Vedi
[chiavi API](help:api-keys).

## Record e file {#records-files}

- I **record** sono documenti JSON conservati in raccolte con un nome all'interno di un tenant, per
  esempio una raccolta `contacts`. Vedi [record](help:records) e la
  [panoramica dei dati](help:data-overview).
- I **file** sono oggetti binari caricati (documenti, immagini) con metadati, conservati per tenant
  (modulo `storage`). Vedi [file](help:files).

## Eventi e job {#events-jobs}

Con il modulo `events`, Axentra esegue lavoro in background e informa gli altri sistemi di ciò che
è accaduto:

- **Job**: unità di lavoro in background con stato, nuovi tentativi e risultati. Vedi
  [job](help:jobs).
- **Pianificazioni**: job eseguiti secondo una pianificazione cron. Vedi
  [pianificazioni](help:schedules).
- **Eventi**: registrazioni di fatti accaduti, per esempio “è stato creato un contatto”. Vedi
  [eventi](help:events).
- **Webhook**: chiamate HTTP che consegnano gli eventi ai tuoi endpoint, firmate con un segreto.
  Vedi [webhook](help:webhooks).

## Utilizzo e fatturazione {#usage-billing}

- L'**utilizzo** (modulo `usage`) conta il consumo per tenant con i **contatori**, per esempio
  chiamate API o spazio, e può applicare delle **quote**. Vedi [utilizzo](help:usage).
- La **fatturazione** (modulo `billing`) definisce **piani** con prezzi e diritti d'uso e li assegna
  ai tenant come **abbonamenti**. Studio non tratta mai i dati delle carte. Vedi
  [piani e abbonamenti](help:plans-subscriptions).

## Registro di audit {#audit-log}

Ogni modifica, e ogni tentativo rifiutato, viene scritto nel **registro di audit** nella stessa
transazione della modifica: chi (autore), che cosa (azione, per esempio `tenancy.tenant.create`), su
che cosa (destinazione), quando e con quale esito (consentito o negato). Vedi
[registro di audit](help:audit).

## Modalità a prodotto singolo e multiprodotto {#single-multi-product}

Il server funziona in una di due **modalità**, impostata dall'operatore:

|                              | Prodotto singolo                                                        | Multiprodotto                                                       |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Prodotti                     | Esattamente uno, creato dalla configurazione del server al primo avvio. | Un numero qualsiasi, creati dagli amministratori della piattaforma. |
| Creare o archiviare prodotti | Non possibile (`mode_not_supported`).                                   | Con `products:create` e `products:archive`.                         |
| Selettore di prodotto        | Un'etichetta fissa **Prodotto** con il nome del prodotto.               | Un menu che elenca i tuoi prodotti.                                 |

Tutto il resto (tenant, ruoli, percorsi API, autorizzazioni) funziona allo stesso modo in entrambe
le modalità. Il passaggio da prodotto singolo a multiprodotto è una modifica di configurazione
senza migrazione dei dati. Il riquadro **Server** della dashboard mostra la **Modalità** attuale.

## ID della richiesta {#request-id}

Ogni richiesta API riceve un **ID della richiesta** univoco. Studio lo mostra insieme ai messaggi
di errore; comunicalo al tuo operatore, che potrà trovare la voce di log corrispondente e gli
eventi di audit.

## Risoluzione dei problemi {#troubleshooting}

| Vedi                                                         | Significato e soluzione                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Non consentito**                                           | Ai tuoi ruoli manca l'autorizzazione. Chiedi a qualcuno con un ruolo superiore oppure consulta [ruoli e autorizzazioni](help:roles-permissions).                |
| Un ruolo viene mostrato come “(oltre le tue autorizzazioni)” | Lo blocca il [limite dei ruoli](help:concepts#role-ceiling). Deve assegnarlo qualcuno che possiede tutte le autorizzazioni di quel ruolo.                       |
| **Non trovato** per qualcosa che esiste                      | Axentra risponde “non trovato” quando non hai alcun accesso, per non rivelare che cosa esiste. Verifica di trovarti nel prodotto giusto e di avere un ruolo lì. |
| **Non disponibile in questa modalità**                       | Il server funziona in modalità a prodotto singolo; i prodotti non possono essere creati né archiviati.                                                          |
