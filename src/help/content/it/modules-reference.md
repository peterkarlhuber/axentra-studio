---
title: Riferimento dei moduli
summary: I moduli del server Axentra, quali aree di Studio rende disponibili ciascuno e cosa vedi quando un modulo è disattivato.
keywords: modulo, moduli, abilitato, disabilitato, disattivato, off, funzionalità, configurazione del server, identity, tenancy, access, data, audit, storage, events, usage, billing, notify, search, realtime
---

Il server Axentra è composto da _moduli_: blocchi funzionali come l'archiviazione dei file, i job
in background o la fatturazione. Un operatore decide nella configurazione del server quali moduli
sono in esecuzione. Studio legge l'elenco dei moduli abilitati all'avvio e si adatta: le aree dei
moduli disattivati restano nella barra laterale con l'etichetta **Off**, così vedi cosa esiste e
cosa dovrebbe abilitare un operatore.

## Quali moduli sono abilitati? {#check-modules}

- La [Dashboard](app:dashboard) elenca tutti i moduli in **Moduli** nella scheda del server; i
  moduli abilitati sono evidenziati, quelli disattivati sono grigi.
- La pagina [Impostazioni](app:settings) (con `platform:settings` o `product:manage`) mostra la
  configurazione effettiva del server, compreso l'elenco dei moduli.
- Nella barra laterale, un'area di un modulo disattivato ha l'etichetta **Off**; gli screen reader
  annunciano "modulo non abilitato".

Per impostazione predefinita tutti i moduli sono abilitati. Cambiare l'elenco è una modifica della
configurazione del server (`modules`, vedi [configurazione del server](help:server-configuration));
ha effetto al riavvio del server. Studio legge l'elenco una volta a ogni caricamento della pagina,
quindi ricarica Studio dopo la modifica.

## Panoramica dei moduli {#overview}

| Id del modulo | Disattivabile | Aree di Studio che rende disponibili                                                                                        |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `identity`    | No            | Accesso, uscita, [Profilo](help:profile), [Utenti](help:users), sessioni                                                    |
| `tenancy`     | No            | [Prodotti](help:products), [Tenant](help:tenants), [membri e inviti](help:members-invitations)                              |
| `access`      | No            | [Ruoli](help:roles-permissions), [Autorizzazioni](help:permissions-reference), [Chiavi API](help:api-keys)                  |
| `audit`       | No            | [Registro di audit](help:audit)                                                                                             |
| `data`        | Sì            | [Panoramica dati](help:data-overview), [Record](help:records)                                                               |
| `storage`     | Sì            | [File](help:files), quote di archiviazione dei tenant, policy di archiviazione del prodotto                                 |
| `events`      | Sì            | [Job](help:jobs), [Pianificazioni](help:schedules), [Eventi](help:events) con la vista in diretta, [Webhook](help:webhooks) |
| `usage`       | Sì            | [Utilizzo](help:usage): contatori, utilizzo per tenant, quote, prenotazioni                                                 |
| `billing`     | Sì            | [Piani e abbonamenti](help:plans-subscriptions), fatturazione dei tenant                                                    |
| `notify`      | Sì            | [Notifiche](help:notifications): modelli, registro messaggi, casella di posta, preferenze                                   |
| `search`      | Sì            | Ancora nessuna schermata in Studio; la ricerca full-text nei tenant è disponibile tramite API                               |
| `realtime`    | Sì            | Accettato nella configurazione, ma senza effetto in questa versione                                                         |

[Stato del sistema](help:health-monitoring), Monitoraggio e [Impostazioni](help:settings) non
appartengono a un modulo e sono sempre disponibili.

## Cosa succede quando un modulo è disattivato {#when-disabled}

Quando un modulo è disattivato, il server non offre affatto la sua parte di API. In Studio:

- La pagina dell'area mostra **Modulo non abilitato su questo server** e indica l'id del modulo da
  abilitare, per esempio `storage`. Non viene eliminato nulla: i dati salvati mentre il modulo era
  attivo restano nel database e ricompaiono quando il modulo viene riattivato.
- Scorciatoie e widget che dipendono dal modulo scompaiono, per esempio i widget di utilizzo e
  fatturazione nella dashboard o il pulsante **Consulta record** nella pagina di un tenant.
- Un'azione che raggiunge comunque un modulo disattivato risponde
  [Modulo non abilitato](help:troubleshooting#module-disabled) o **Non trovato**.

Note per ciascun modulo:

### data {#data}

**Panoramica dati** e **Record** mostrano lo stato "non abilitato". I prodotti che salvano i propri
dati in tabelle proprie non sono interessati.

### storage {#storage}

**File** mostra lo stato "non abilitato"; le quote di archiviazione e la policy di archiviazione non
si possono leggere né modificare.

### events {#events}

**Job**, **Pianificazioni**, **Eventi** e **Webhook** mostrano lo stato "non abilitato", e non c'è
la vista in diretta degli eventi. All'interno del server, gli altri moduli continuano a usare la
coda dei job; mancano solo le schermate e la relativa API.

### usage e billing {#usage-billing}

Senza `usage`, **Utilizzo** è disattivato e la dashboard non mostra widget di utilizzo. Senza
`billing`, **Piani** e **Abbonamenti** sono disattivati. I limiti dei piani alimentano le quote di
utilizzo solo quando sono abilitati **entrambi** i moduli.

### notify {#notify}

**Notifiche** mostra lo stato "non abilitato". Gli inviti funzionano comunque, ma il server non
invia email di invito: condividi il link o il token di invito che Studio mostra una sola volta dopo
la creazione dell'invito (vedi [Membri e inviti](help:members-invitations)).

### search e realtime {#search-realtime}

Studio non ha schermate per questi moduli. Attivarli o disattivarli non cambia nulla in Studio.

## Non ancora disponibile in Studio {#not-in-studio}

Se un modulo è abilitato sul server ma questa release di Studio non ha schermate per esso, l'area
mostra **Non ancora disponibile in Studio**. Usa direttamente l'API o una release di Studio più
recente.

## Risoluzione dei problemi {#troubleshooting}

| Situazione                                                                         | Cosa fare                                                                                                                                |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Un'area mostra **Off**                                                             | Chiedi a un operatore di aggiungere l'id del modulo all'impostazione `modules` del server e di riavviare il server, poi ricarica Studio. |
| Un operatore ha abilitato un modulo, ma Studio mostra ancora **Off**               | Ricarica la pagina; Studio legge l'elenco dei moduli solo al caricamento.                                                                |
| La configurazione rifiuta di disattivare `identity`, `tenancy`, `access` o `audit` | Questi moduli sono obbligatori e non possono essere disabilitati.                                                                        |
| Gli inviti vengono creati ma non arriva nessuna email                              | `notify` è abilitato ed è configurato un provider email? Altrimenti condividi il link manualmente.                                       |
