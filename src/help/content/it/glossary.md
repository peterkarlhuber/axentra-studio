---
title: Glossario
summary: Brevi spiegazioni dei termini usati in Axentra e in Studio, con i link ai dettagli.
keywords: glossario, termini, definizioni, vocabolario, significato, cos'è, che cosa significa, dizionario
---

Brevi definizioni dei termini usati in Studio e in questa guida. Ogni voce rimanda all'articolo
con i dettagli. Le voci seguono l'ordine alfabetico dei termini originali inglesi.

## Chiave API {#api-key}

Credenziali per le macchine (formato `axk_…`) che chiamano l'API di Axentra per un prodotto, con un
elenco esplicito di autorizzazioni e, facoltativamente, legate a un tenant. Vedi
[Chiavi API](help:api-keys).

## Archiviare {#archive}

Mettere fuori uso un prodotto senza eliminarlo. In un prodotto archiviato possono ancora lavorare
solo gli amministratori della piattaforma; il prodotto può essere ripristinato. Vedi
[Prodotti](help:products).

## Registro di audit {#audit-log}

La registrazione in sola aggiunta di chi ha modificato cosa e quando sul server, con esito, ID
richiesta e indirizzo IP. Vedi [Registro di audit](help:audit).

## Ruolo predefinito {#built-in-role}

Un ruolo che Axentra fornisce in ogni prodotto, come **Product admin**,
**Owner** o **Viewer**. Non può essere modificato. Vedi il
[riferimento delle autorizzazioni](help:permissions-reference#built-in-roles).

## Checkout {#checkout}

Il pagamento di un piano nella pagina ospitata dal provider di pagamento. Studio non gestisce mai i
dati delle carte. Vedi [Piani e abbonamenti](help:plans-subscriptions).

## Raccolta {#collection}

Un gruppo di record con un nome all'interno di un tenant, per esempio `contacts`. Vedi
[Record](help:records).

## Espressione cron {#cron-expression}

Cinque campi (minuto, ora, giorno del mese, mese, giorno della settimana) che descrivono quando
viene eseguita una pianificazione, sempre in UTC. Vedi [Pianificazioni](help:schedules).

## CSRF {#csrf}

Cross-site request forgery: un attacco in cui un altro sito web cerca di inviare modifiche tramite
il tuo browser con sessione attiva. Studio e il server la bloccano automaticamente. Vedi
[Sicurezza](help:security#csrf).

## Ruolo personalizzato {#custom-role}

Un ruolo definito per un prodotto con un insieme di autorizzazioni a scelta, per un prodotto o per
un tenant. Vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Consegna {#delivery}

Una catena di tentativi per inviare un evento a un endpoint webhook, con stato, risposta e nuovi
tentativi. Vedi [Webhook](help:webhooks).

## Diritto d'uso {#entitlement}

Una funzionalità (attiva o disattiva) o un limite che un piano concede ai tenant abbonati. Vedi
[Piani e abbonamenti](help:plans-subscriptions).

## Evento {#event}

Un messaggio del tuo prodotto che segnala che è successo qualcosa, per esempio `invoice.created`.
Gli eventi possono attivare webhook e handler. Vedi [Eventi](help:events).

## Periodo di tolleranza {#grace-period}

Il tempo, dopo la rotazione di un segreto, durante il quale il vecchio segreto funziona ancora (al
massimo 7 giorni), così i servizi possono passare al nuovo senza interruzioni. Vedi
[Chiavi API](help:api-keys) e [Webhook](help:webhooks).

## Chiave di idempotenza {#idempotency-key}

Un valore univoco inviato con una richiesta, in modo che ripetere la stessa richiesta non la esegua
due volte. Il riutilizzo di una chiave con valori diversi viene rifiutato. Vedi
[risoluzione dei problemi](help:troubleshooting#idempotency-conflict).

## Invito {#invitation}

Una proposta di entrare in un tenant con un determinato ruolo, inviata a un indirizzo email. Il suo
link e il suo token vengono mostrati una sola volta. Vedi [Membri e inviti](help:members-invitations).

## Job {#job}

Un'attività in background eseguita da un worker, con nuovi tentativi in caso di errore. Vedi
[Job](help:jobs).

## Membro {#member}

Un utente che appartiene a un tenant con un ruolo di tenant. È anche il nome del ruolo di tenant
predefinito **Member**, che lavora con i dati del tenant. Vedi
[Membri e inviti](help:members-invitations).

## Contatore {#meter}

Qualcosa che un prodotto misura, come le chiamate API o lo spazio di archiviazione, e il modo in cui
viene combinato (somma, massimo o ultimo valore) e azzerato. Vedi [Utilizzo](help:usage).

## Modulo {#module}

Un blocco funzionale del server Axentra (per esempio `storage` o `billing`) che un operatore può
attivare o disattivare. Vedi il [riferimento dei moduli](help:modules-reference).

## Modalità multiprodotto {#multi-product-mode}

Una modalità del server in cui un'installazione ospita più prodotti, creati dagli amministratori
della piattaforma. Vedi [Concetti](help:concepts).

## Rango di proprietario {#owner-rank}

Il rango speciale dei ruoli **Owner** (tenant) e **Product owner**: solo un
proprietario dello stesso ambito, o qualcuno con autorità da un livello superiore, può assegnarlo o
rimuoverlo. Vedi [tetto dei ruoli](help:security#role-ceiling).

## Autorizzazione {#permission}

Un singolo diritto scritto come `resource:action`, per esempio `files:write`, con ambito di
piattaforma, di prodotto o di tenant. Vedi il
[riferimento delle autorizzazioni](help:permissions-reference).

## Piano {#plan}

Un'offerta con prezzi e diritti d'uso a cui i tenant si abbonano. Vedi
[Piani e abbonamenti](help:plans-subscriptions).

## Ruolo nella piattaforma {#platform-role}

Un ruolo valido per l'intera installazione: **Amministratore della piattaforma** (tutto) o
**Visualizzatore della piattaforma** (accesso in lettura ovunque). Solo gli amministratori della
piattaforma possono assegnarlo. Vedi [Utenti](help:users).

## Prodotto {#product}

Un'applicazione che gira sul server Axentra, con tenant, ruoli, chiavi e dati propri. Vedi
[Prodotti](help:products).

## Operatore di prodotto {#product-operator}

Un utente con un ruolo di prodotto, come **Product owner** o **Support**, che lavora
sul prodotto nel suo insieme. Vedi [Prodotti](help:products).

## Autorizzazione di prodotto {#product-permission}

Un'autorizzazione che un prodotto dichiara da sé, con un nome come `crm.deals:approve`. Vedi il
[riferimento delle autorizzazioni](help:permissions-reference#product-defined).

## Quota {#quota}

Un limite massimo all'utilizzo o allo spazio di archiviazione di un tenant. Superarlo produce
[Quota superata](help:troubleshooting#quota-exceeded). Vedi [Utilizzo](help:usage).

## Record {#record}

Un oggetto JSON memorizzato in una raccolta di un tenant. Vedi [Record](help:records).

## ID richiesta {#request-id}

L'identificatore `req_…` di ogni richiesta al server, mostrato nei dettagli degli errori e nel
registro di audit; è la chiave per l'assistenza. Vedi
[risoluzione dei problemi](help:troubleshooting#request-id).

## Prenotazione {#reservation}

Utilizzo prenotato in anticipo, che in seguito viene confermato con la quantità effettiva oppure
rilasciato. Vedi [Utilizzo](help:usage).

## Ruolo {#role}

Un insieme di autorizzazioni con un nome che viene assegnato alle persone (o, come elenco di
autorizzazioni, alle chiavi API). Vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Tetto dei ruoli {#role-ceiling}

La regola per cui nessuno può assegnare un ruolo con autorizzazioni che non possiede. Vedi
[Sicurezza](help:security#role-ceiling).

## Rotazione {#rotation}

La sostituzione di un segreto con uno nuovo, facoltativamente con un periodo di tolleranza. Vedi
[Chiavi API](help:api-keys).

## Sicurezza a livello di riga {#row-level-security}

Una funzionalità del database che limita ogni transazione alle righe di un prodotto o di un tenant,
come seconda linea di difesa dietro i controlli delle autorizzazioni. Vedi
[Sicurezza](help:security#tenant-isolation).

## Pianificazione {#schedule}

Una regola che accoda un job a intervalli fissi o agli orari di un'espressione cron. Vedi
[Pianificazioni](help:schedules).

## Sessione {#session}

Lo stato di accesso di un browser. Termina dopo una durata massima, dopo un periodo di inattività,
all'uscita o quando viene revocata. Vedi [Sicurezza](help:security#sessions).

## Token di configurazione {#setup-token}

Un token monouso, stampato sul server, che crea il primo amministratore della piattaforma. Vedi
[Configurazione iniziale](help:first-run-setup).

## Segreto di firma {#signing-secret}

Il segreto (`whsec_…`) con cui Axentra firma le richieste webhook (HMAC-SHA256), in modo che i
destinatari possano verificarle. Vedi [Webhook](help:webhooks) e
[Sicurezza](help:security#webhook-signing).

## Modalità a prodotto singolo {#single-product-mode}

Una modalità del server con esattamente un prodotto, creato dalla configurazione del server; non è
possibile creare né archiviare prodotti. Vedi [Concetti](help:concepts).

## Slug {#slug}

Un identificatore breve e adatto agli URL di un prodotto o di un tenant, per esempio `acme`. È
univoco e non può contenere spazi. Vedi [Tenant](help:tenants).

## Abbonamento {#subscription}

La sottoscrizione di un piano da parte di un tenant, con uno stato (per esempio in prova, attivo,
pagamento scaduto) e un periodo. Vedi [Piani e abbonamenti](help:plans-subscriptions).

## Sospendere {#suspend}

Bloccare l'accesso a un tenant senza eliminarne i dati. Il tenant può essere riattivato. Vedi
[Tenant](help:tenants).

## Modello {#template}

Un'email di notifica con varianti per lingua e variabili. Vedi [Notifiche](help:notifications).

## Tenant {#tenant}

Un cliente o un'organizzazione all'interno di un prodotto. I dati di ogni tenant sono rigorosamente
separati. Vedi [Tenant](help:tenants).

## UTC {#utc}

Il tempo coordinato universale, base temporale di tutte le pianificazioni. Dove possibile, Studio
mostra gli orari nel tuo fuso orario.

## Webhook {#webhook}

Una richiesta HTTP firmata che Axentra invia a un altro sistema quando si verifica un evento. Vedi
[Webhook](help:webhooks).

## Worker {#worker}

Un processo del server che esegue job, pianificazioni e consegne webhook. Senza un worker in
esecuzione, i job restano in coda. Vedi [Job](help:jobs).
