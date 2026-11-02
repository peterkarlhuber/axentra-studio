---
title: Registro di audit
summary: Scopri chi ha fatto cosa e quando sul server, filtra il registro, condividi una vista filtrata e leggi tutti i dettagli di un evento.
keywords: audit, registro di audit, traccia di audit, cronologia, registro attività, chi ha modificato, registro eventi, conformità, compliance, request id, ID richiesta, negato, tentativi di accesso
---

Il **Registro di audit** registra le azioni amministrative e rilevanti per la sicurezza sul server
Axentra: chi ha agito (un utente, una chiave API o il sistema), cosa ha fatto, su quale oggetto,
con quale esito e quando. Usalo per rispondere a domande come “chi ha revocato questa chiave API?”,
“perché questo utente non riesce più ad accedere?” o “cosa è successo durante la richiesta con
questo ID richiesta?”.

È il server stesso a scrivere gli eventi. Studio si limita a leggerli: nessuno può modificare o
eliminare un singolo evento di audit, nemmeno un amministratore della piattaforma.

> [!IMPORTANT]
> Il modulo di audit è sempre abilitato. Per leggere gli eventi di un prodotto ti serve
> l'autorizzazione `audit:read` in quel prodotto (ce l'hanno tutti i ruoli di prodotto
> predefiniti: **Product owner**, **Product admin**, **Support** e
> **Product viewer**). Gli eventi dell'intera installazione, compresi quelli che non
> appartengono a nessun prodotto, richiedono `platform:audit` (ruoli nella piattaforma
> `platform_admin` e `platform_viewer`). I ruoli di tenant non possono leggere il registro di audit.

## Chi vede quali eventi {#who-sees-what}

| Hai                                                 | Studio mostra                                                                                           | Filtro prodotto                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `platform:audit`                                    | Ogni evento dell'installazione, compresi accessi, configurazione iniziale e altri eventi senza prodotto | **Tutti i prodotti** (predefinito) o un prodotto           |
| `audit:read` in un prodotto, senza `platform:audit` | Solo gli eventi di un prodotto; Studio parte dal prodotto che hai usato per ultimo                      | Uno dei tuoi prodotti; **Tutti i prodotti** non è proposto |
| Nessuna delle due                                   | Un errore **Non consentito**                                                                            | –                                                          |

Il server verifica l'autorizzazione a ogni richiesta. Se selezioni un prodotto che non puoi
leggere ricevi **Non consentito**, e un evento che non puoi leggere non si apre nel dettaglio (vedi
[Risoluzione dei problemi](#troubleshooting)).

> [!NOTE]
> Gli eventi senza prodotto, come `identity.login`, `identity.logout` o
> `identity.setup.complete`, sono visibili solo con `platform:audit`.

## Aprire il registro di audit {#open}

1. Nella barra laterale, apri **Audit e monitoraggio** › **Registro di audit** ([apri](app:audit)).
2. Gli eventi più recenti vengono per primi. Scorri fino alla fine della tabella per caricarne altri.

Ogni riga mostra **Ora**, **Azione**, **Autore**, **Destinazione** ed **Esito**. Su un telefono
vengono mostrate solo **Ora** e **Azione**; apri i dettagli per vedere il resto.

## Filtrare gli eventi {#filter}

1. Digita una parola in **Cerca**. Su uno schermo stretto, scegli **Altri filtri** per vedere gli
   altri campi; il numero tra parentesi indica quanti filtri sono attivi.
2. Compila uno qualsiasi degli altri filtri. Tutti i filtri si combinano (un evento deve
   soddisfarli tutti).
3. Scegli **Applica filtri**. Studio carica nuovi risultati solo quando applichi i filtri.
4. Per ricominciare, scegli **Reimposta filtri**.

| Filtro         | Cosa trova                                                                                                                       | Esempio                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Cerca**      | Parte dell'azione, l'ID della destinazione, il nome dell'autore o l'ID dell'autore (senza distinzione tra maiuscole e minuscole) | `acme`, `api_key`                    |
| **Prodotto**   | Eventi di un prodotto                                                                                                            | –                                    |
| **ID tenant**  | Eventi in un tenant (ID esatto)                                                                                                  | `ten_01EXAMPLE`                      |
| **Azione**     | Il nome esatto dell'azione, oppure un prefisso se termina con `*`                                                                | `access.api_key.revoke`, `tenancy.*` |
| **ID autore**  | Eventi di un utente o di una chiave API (ID esatto)                                                                              | `usr_01EXAMPLE`, `key_01EXAMPLE`     |
| **Esito**      | **Riuscito**, **Negato** o **Errore**                                                                                            | –                                    |
| **Da** / **A** | Intervallo di tempo nella tua ora locale. **Da** è incluso, **A** no                                                             | –                                    |

Il server accetta al massimo 100 caratteri per **Azione** e 200 per **Cerca**.

### Condividere una vista filtrata {#share}

I filtri applicati fanno parte dell'indirizzo della pagina, per esempio
`/audit?actor_id=usr_01EXAMPLE&outcome=denied`. Copia l'indirizzo dal browser per condividere o
salvare nei preferiti esattamente questa vista. Chi la riceve vede solo gli eventi consentiti dalle
proprie autorizzazioni.

## Leggere i dettagli di un evento {#event-detail}

1. Scegli il pulsante dei dettagli alla fine di una riga (**Mostra dettagli per …**).
2. Si apre un pannello laterale con tutti i campi dell'evento e i suoi **Dettagli**.

| Campo                                           | Significato                                                                                                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID evento**                                   | ID dell'evento di audit (`aud_…`)                                                                                                                                                               |
| **Ora**                                         | Quando il server ha registrato l'evento                                                                                                                                                         |
| **Azione**                                      | Cosa è successo, nella forma `module.object.verb`                                                                                                                                               |
| **Autore** / **Tipo di autore** / **ID autore** | Chi ha agito. Tipi: `user`, `api_key`, `system` (il server stesso, per esempio un'attività pianificata) e `anonymous` (nessuno aveva effettuato l'accesso, per esempio un accesso non riuscito) |
| **Prodotto** / **Tenant**                       | Dove è successo; vuoto per gli eventi a livello di installazione                                                                                                                                |
| **Destinazione**                                | L'oggetto su cui si è agito: tipo e ID (per esempio `api_key · key_01EXAMPLE`)                                                                                                                  |
| **Esito**                                       | Vedi [Esiti](#outcomes)                                                                                                                                                                         |
| **ID richiesta**                                | L'`X-Request-ID` della richiesta HTTP che ha causato l'evento                                                                                                                                   |
| **Indirizzo IP**                                | L'indirizzo del client visto dal server (dietro un proxy solo se il proxy è attendibile)                                                                                                        |
| **Dettagli**                                    | Dati aggiuntivi in JSON, per esempio i campi modificati o il motivo di un rifiuto                                                                                                               |

> [!NOTE]
> Il server rimuove i segreti (password, token, chiavi) dai dettagli prima di memorizzarli. Nel
> registro di audit non troverai mai un segreto.

### Esiti {#outcomes}

| Esito        | Significato                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Riuscito** | L'azione è stata eseguita.                                                                                                                                                    |
| **Negato**   | Il server ha rifiutato l'azione, per esempio un accesso con password errata, un cambio password con la password attuale errata o una prima password senza un accesso recente. |
| **Errore**   | L'azione è stata tentata ma non è andata a buon fine.                                                                                                                         |

Una richiesta rifiutata per mancanza di autorizzazioni di solito **non** viene registrata: il
client riceve soltanto `403`. Cerca gli eventi **Negato** soprattutto intorno ad accessi e password.

## Tracciare una richiesta tramite il suo ID richiesta {#request-id}

Ogni messaggio di errore in Studio mostra un **ID richiesta** in **Dettagli tecnici**. Per scoprire
cosa ha modificato quella richiesta:

1. Copia l'ID richiesta dal messaggio di errore.
2. La ricerca dell'audit non copre gli ID richiesta. Restringi l'elenco con **Da** / **A** (e con
   l'**ID autore**, se lo conosci), apri gli eventi candidati e confronta il loro **ID richiesta**.
3. Se nessun evento corrisponde, la richiesta non ha modificato nulla che venga sottoposto ad audit.
   Comunica l'ID richiesta al tuo operatore: i log del server riportano lo stesso ID.

Vedi [ID richiesta](help:api-basics#request-ids) per sapere come funzionano gli ID richiesta.

## Cosa viene registrato {#what-is-recorded}

Le azioni si chiamano `module.object.verb`. Esempi tipici:

| Ambito                            | Azioni                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso e account                 | `identity.login`, `identity.logout`, `identity.password.change`, `identity.session.revoke`, `identity.session.revoke_all`, `identity.platform_role.set`, `identity.setup.complete` |
| Prodotti, tenant, membri          | `tenancy.product.create`, `tenancy.tenant.create`, `tenancy.tenant.update`, `tenancy.member.set`, `tenancy.invitation.create`, `tenancy.invitation.accept`                         |
| Controllo accessi                 | `access.role.create`, `access.api_key.create`, `access.api_key.rotate`, `access.api_key.revoke`                                                                                    |
| Dati e file                       | `data.record.delete`, `storage.file.upload`, `storage.file.delete`, `storage.policy.update`                                                                                        |
| Eventi e job                      | `events.job.enqueue`, `events.job.cancel`, `events.schedule.update`, `events.webhook.rotate_secret`                                                                                |
| Utilizzo, fatturazione, notifiche | `usage.quota.set`, `billing.plan.update`, `notify.template.update`, `notify.message.enqueue`                                                                                       |

Non tutto è un evento di audit: le letture non vengono registrate, e nemmeno la creazione o la
modifica di un record (la sua eliminazione sì). I backend di prodotto costruiti su Axentra possono
aggiungere azioni proprie.

## Conservazione {#retention}

Gli eventi di audit vengono conservati per `observability.audit_retention_days` (predefinito 365
giorni). Vengono eliminati solo quando l'operatore esegue l'attività di manutenzione
`axentra maintenance purge`. Finché questa attività non viene eseguita, gli eventi più vecchi
restano visibili. Il valore configurato è indicato in **Manutenzione e conservazione** nella pagina
[Monitoraggio](help:health-monitoring#retention).

## Buono a sapersi {#good-to-know}

- L'elenco è ordinato per data, dal più recente; non puoi cambiare l'ordine.
- Gli orari sono mostrati nel fuso orario del tuo browser; l'API memorizza e filtra in UTC.
- In Studio non c'è un'esportazione. Gli sviluppatori possono leggere il registro con l'API
  (`GET /v1/audit`, paginazione a cursore) o con gli SDK (`audit.list`, `audit.iter`); vedi
  [Nozioni di base sull'API](help:api-basics#pagination).

## Risoluzione dei problemi {#troubleshooting}

- **Non consentito** all'apertura della pagina: non hai `audit:read` nel prodotto selezionato. Scegli un prodotto in cui hai un ruolo di prodotto, oppure chiedi l'accesso a un proprietario del prodotto o a un amministratore della piattaforma.
- **Nessun evento corrispondente**: i filtri sono troppo restrittivi. Controlla che **Azione** sia scritta esattamente (le azioni sono `tenancy.tenant.create`, non `tenant.created`) o terminala con `*`, allarga **Da** / **A**, oppure scegli **Reimposta filtri**.
- **Ancora nessun evento di audit** anche se qualcosa è cambiato: stai guardando un prodotto, ma la modifica riguardava l'intera installazione (per esempio un accesso). Questi eventi richiedono `platform:audit`. Controlla anche che l'azione sia tra quelle registrate (vedi [Cosa viene registrato](#what-is-recorded)).
- **Impossibile caricare l'evento completo** (nel pannello dei dettagli): l'evento è stato eliminato dall'attività di conservazione, oppure appartiene a un prodotto (o a nessun prodotto) che non puoi leggere. In entrambi i casi il server risponde `404`, così non rivela se l'evento esiste. Studio mostra invece i valori dell'elenco.
- **Verifica i dati inseriti**: un valore di filtro è stato rifiutato, per esempio un'**Azione** più lunga di 100 caratteri o una **Cerca** più lunga di 200 caratteri.
