---
title: Riferimento delle autorizzazioni
summary: Ogni autorizzazione predefinita di Axentra, quali ruoli predefiniti la possiedono e cosa ti permette di fare in Studio.
keywords: autorizzazione, autorizzazioni, permessi, elenco autorizzazioni, catalogo, matrice dei ruoli, ambito, piattaforma, prodotto, tenant, lettura, gestione, diritti di accesso, ruoli predefiniti, proprietario, amministratore, visualizzatore, supporto, membro
---

Un'_autorizzazione_ è un singolo diritto scritto come `resource:action`, per esempio `files:write`.
L'accesso è negato a meno che un ruolo o una chiave API non conceda esplicitamente
l'autorizzazione. Questa pagina elenca ogni autorizzazione predefinita, mostra quale ruolo
predefinito la possiede e indica cosa sblocca in Studio. Per sapere come si creano e si assegnano i
ruoli, vedi [Ruoli e autorizzazioni](help:roles-permissions).

## Come funzionano le autorizzazioni {#how-permissions-work}

Ogni autorizzazione ha un **ambito**:

- **Piattaforma**: valida per l'intera installazione. Concessa solo dai ruoli nella piattaforma
  **Amministratore della piattaforma** e **Visualizzatore della piattaforma**, mai da ruoli di
  prodotto o di tenant e mai da chiavi API.
- **Prodotto**: riguarda un prodotto nel suo insieme (i suoi tenant, ruoli, chiavi, job, piani …).
- **Tenant**: riguarda i dati all'interno di un tenant (record, file, membri …).

Chi possiede cosa:

- Un **ruolo di tenant** concede autorizzazioni di tenant **solo in quel tenant**.
- Un **ruolo di prodotto** concede autorizzazioni di prodotto e autorizzazioni di tenant **in ogni
  tenant del prodotto**.
- Un **ruolo nella piattaforma** concede le sue autorizzazioni in ogni prodotto.
- Chi è solo membro di un tenant riceve comunque `product:read` per il prodotto, così può aprirlo e
  scegliere il proprio tenant, e nient'altro a livello di prodotto.
- Una **chiave API** possiede esattamente le autorizzazioni elencate su di essa, nel suo prodotto
  (e, se legata a un tenant, solo in quel tenant).

Studio nasconde pulsanti, schede e finestre di dialogo che le tue autorizzazioni non consentono. Le
aree nella barra laterale restano visibili; se ti manca l'autorizzazione di lettura, la pagina
mostra **Non consentito** con l'autorizzazione mancante (vedi
[risoluzione dei problemi](help:troubleshooting#forbidden)).

> [!TIP]
> In Studio, apri [Autorizzazioni](app:permissions) per vedere il catalogo completo del tuo
> prodotto, comprese le autorizzazioni dichiarate dal prodotto stesso, con le descrizioni del server.

## Autorizzazioni della piattaforma {#platform-permissions}

| Autorizzazione      | Descrizione del server                               | Cosa abilita in Studio                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `products:create`   | Creare prodotti (modalità multiprodotto)             | **Nuovo prodotto** nella pagina Prodotti (solo in modalità multiprodotto)                                                                                                                                                                   |
| `products:archive`  | Archiviare e ripristinare prodotti                   | Archiviazione e ripristino nella pagina del prodotto (solo in modalità multiprodotto)                                                                                                                                                       |
| `users:read`        | Elencare tutti gli utenti dell'installazione         | Aprire la pagina di dettaglio di qualsiasi utente, anche al di fuori dei tuoi prodotti; elencare tutti gli utenti tramite l'API                                                                                                             |
| `users:manage`      | Disattivare utenti e revocare le loro sessioni       | **Disattiva utente** / **Attiva utente** e **Disconnetti ovunque** nella pagina di un utente, e il relativo elenco **Sessioni attive**. Per cambiare un **Ruolo nella piattaforma** occorre inoltre essere amministratore della piattaforma |
| `platform:settings` | Leggere le impostazioni dell'installazione           | La pagina [Impostazioni](app:settings); lo stato del provider di fatturazione e le impostazioni di archiviazione mostrati nelle pagine dei prodotti                                                                                         |
| `platform:audit`    | Leggere gli eventi di audit di tutta l'installazione | Il [Registro di audit](app:audit) su tutti i prodotti, compresi gli eventi della piattaforma come gli accessi                                                                                                                               |

## Autorizzazioni di prodotto {#product-permissions}

| Autorizzazione           | Descrizione del server                                                     | Cosa abilita in Studio                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product:read`           | Visualizzare il prodotto e la sua panoramica                               | Aprire il prodotto e la sua dashboard                                                                                                                                                                                 |
| `product:manage`         | Modificare dettagli e impostazioni del prodotto                            | Modificare nome, descrizione e impostazioni nella pagina del prodotto (compresa la policy di archiviazione); permette anche di leggere la pagina [Impostazioni](app:settings) e lo stato del provider di fatturazione |
| `product_members:read`   | Visualizzare gli operatori del prodotto                                    | La scheda **Membri** della pagina del prodotto                                                                                                                                                                        |
| `product_members:manage` | Aggiungere, modificare e rimuovere operatori del prodotto                  | Aggiungere, modificare e rimuovere membri del prodotto (entro il [tetto dei ruoli](help:security#role-ceiling))                                                                                                       |
| `permissions:manage`     | Dichiarare e ritirare tramite l'API le autorizzazioni proprie del prodotto | Nulla da cliccare in Studio (la pagina Autorizzazioni è di sola lettura); permette di leggere il catalogo delle autorizzazioni. La dichiarazione è disponibile tramite l'API                                          |
| `product_users:read`     | Visualizzare gli utenti che appartengono ai tenant del prodotto            | La pagina [Utenti](app:users) del prodotto e le pagine di dettaglio degli utenti                                                                                                                                      |
| `tenants:read`           | Elencare i tenant                                                          | L'elenco dei [Tenant](app:tenants) e le pagine dei tenant; i selettori di tenant nelle altre aree                                                                                                                     |
| `tenants:create`         | Creare tenant                                                              | **Nuovo tenant** (pagina Tenant e dashboard)                                                                                                                                                                          |
| `tenants:update`         | Modificare e sospendere tenant                                             | Modificare, sospendere e riattivare un tenant; impostare la quota di archiviazione di un tenant                                                                                                                       |
| `tenants:delete`         | Eliminare tenant e tutti i loro dati                                       | Eliminare un tenant (irreversibile)                                                                                                                                                                                   |
| `roles:read`             | Visualizzare i ruoli                                                       | La pagina [Ruoli](app:roles) e il catalogo delle autorizzazioni; permette a Studio di mostrare quali ruoli puoi assegnare                                                                                             |
| `roles:manage`           | Creare, modificare ed eliminare ruoli personalizzati                       | **Nuovo ruolo personalizzato**, modificare ed eliminare ruoli personalizzati                                                                                                                                          |
| `api_keys:read`          | Visualizzare le chiavi API (mai i loro segreti)                            | L'elenco delle [Chiavi API](app:apiKeys) e il catalogo delle autorizzazioni                                                                                                                                           |
| `api_keys:manage`        | Creare, ruotare e revocare chiavi API                                      | **Nuova chiave API**, **Ruota segreto**, **Revoca chiave**                                                                                                                                                            |
| `audit:read`             | Leggere gli eventi di audit del prodotto                                   | Il [Registro di audit](app:audit) di questo prodotto                                                                                                                                                                  |
| `collections:read`       | Visualizzare le statistiche delle raccolte di record                       | Le statistiche delle raccolte nella [Panoramica dati](app:dataOverview)                                                                                                                                               |
| `jobs:read`              | Visualizzare job in background ed eventi                                   | [Job](app:jobs), [Pianificazioni](app:schedules), [Eventi](app:events) compresa la vista in diretta                                                                                                                   |
| `jobs:manage`            | Accodare, riprovare e annullare job                                        | **Accoda job**, riprovare e annullare job; creare, modificare ed eliminare pianificazioni                                                                                                                             |
| `webhooks:read`          | Visualizzare webhook e consegne                                            | I [Webhook](app:webhooks) e le loro consegne                                                                                                                                                                          |
| `webhooks:manage`        | Creare, modificare ed eliminare webhook                                    | Creare, modificare, eliminare webhook; ruotare il segreto di firma, inviare un test, consegnare di nuovo                                                                                                              |
| `usage:manage`           | Definire contatori e quote                                                 | Creare e modificare contatori; impostare le quote di utilizzo dei tenant                                                                                                                                              |
| `billing:manage`         | Gestire piani, prezzi e abbonamenti                                        | Creare e modificare piani; creare e modificare gli abbonamenti dei tenant                                                                                                                                             |
| `notify:manage`          | Gestire i modelli di notifica e inviare test                               | [Notifiche](app:notifications): modelli, registro messaggi, statistiche, casella di posta locale                                                                                                                      |
| `notify:send_external`   | Inviare notifiche a indirizzi email che non sono membri del tenant         | Inviare un test a qualsiasi indirizzo email, non solo ai membri del tenant                                                                                                                                            |

## Autorizzazioni di tenant {#tenant-permissions}

Quando un ruolo di prodotto possiede un'autorizzazione di tenant, questa vale in ogni tenant del
prodotto.

| Autorizzazione       | Descrizione del server                                                         | Cosa abilita in Studio                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant:read`        | Visualizzare il tenant                                                         | Aprire il tenant a cui appartieni                                                                                                       |
| `members:read`       | Visualizzare membri e inviti del tenant                                        | Le schede **Membri** e **Inviti** di un tenant; la pagina [Inviti](app:invitations)                                                     |
| `members:manage`     | Invitare, modificare e rimuovere membri del tenant                             | Aggiungere membri, invitare, cambiare ruoli, rimuovere membri, revocare inviti (entro il [tetto dei ruoli](help:security#role-ceiling)) |
| `records:read`       | Leggere record                                                                 | I [Record](app:records) del tenant                                                                                                      |
| `records:write`      | Creare, modificare ed eliminare record                                         | Creare, modificare ed eliminare record                                                                                                  |
| `files:read`         | Elencare e scaricare file                                                      | I [File](app:files) del tenant, download                                                                                                |
| `files:write`        | Caricare ed eliminare file                                                     | Caricare, modificare ed eliminare file                                                                                                  |
| `events:publish`     | Pubblicare eventi e accodare job per il tenant                                 | **Pubblica evento** nella pagina Eventi                                                                                                 |
| `usage:read`         | Visualizzare utilizzo e quote                                                  | L'[Utilizzo](app:usage) del tenant, le quote, i widget di utilizzo nella dashboard                                                      |
| `usage:record`       | Registrare utilizzo                                                            | Registrare utilizzo e confermare o rilasciare prenotazioni per un tenant                                                                |
| `billing:read`       | Visualizzare abbonamento e diritti d'uso                                       | [Piani](app:plans), [Abbonamenti](app:subscriptions) e la fatturazione di un tenant                                                     |
| `notify:send`        | Inviare notifiche                                                              | Inviare notifiche di test ai membri del tenant; vedere i messaggi del tenant                                                            |
| `notify:preferences` | Gestire le preferenze di notifica                                              | Le tue preferenze di notifica per un tenant                                                                                             |
| `search:query`       | Cercare nell'indice di ricerca del tenant                                      | Ancora nulla in Studio; disponibile tramite l'API                                                                                       |
| `search:index`       | Aggiungere, sostituire e rimuovere documenti nell'indice di ricerca del tenant | Ancora nulla in Studio; disponibile tramite l'API                                                                                       |

## Ruoli predefiniti {#built-in-roles}

| Ruolo (chiave)                                           | Livello     | Scopo                                                                                                   |
| -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| **Amministratore della piattaforma** (`platform_admin`)  | Piattaforma | Ogni autorizzazione ovunque; esente dal tetto dei ruoli                                                 |
| **Visualizzatore della piattaforma** (`platform_viewer`) | Piattaforma | Ogni autorizzazione di lettura, più `platform:settings`, `platform:audit` e `search:query`              |
| **Product owner** (`product_owner`)                      | Prodotto    | Controllo completo del prodotto, compresi gli operatori e il rango di proprietario                      |
| **Product admin** (`product_admin`)                      | Prodotto    | Tutto tranne la gestione degli operatori del prodotto e la dichiarazione di autorizzazioni di prodotto  |
| **Support** (`product_support`)                          | Prodotto    | Legge tutto e gestisce i membri dei tenant entro le proprie autorizzazioni (in pratica: visualizzatori) |
| **Product viewer** (`product_viewer`)                    | Prodotto    | Accesso in sola lettura al prodotto                                                                     |
| **Owner** (`tenant_owner`)                               | Tenant      | Tutte le autorizzazioni di tenant, più il rango di proprietario                                         |
| **Admin** (`tenant_admin`)                               | Tenant      | Tutte le autorizzazioni di tenant, senza il rango di proprietario                                       |
| **Member** (`member`)                                    | Tenant      | Lavora con i dati del tenant                                                                            |
| **Viewer** (`viewer`)                                    | Tenant      | Accesso in sola lettura al tenant                                                                       |

## Matrice dei ruoli {#role-matrix}

✓ = il ruolo possiede l'autorizzazione. Abbreviazioni: **AP** Amministratore della piattaforma,
**VP** Visualizzatore della piattaforma, **PP** Product owner, **AmP** Product admin, **Sup** Support,
**ViP** Product viewer, **PT** Owner (del tenant), **AT** Admin (del tenant), **M** Member,
**V** Viewer.

| Autorizzazione           | AP  | VP  | PP  | AmP | Sup | ViP | PT  | AT  | M   | V   |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `products:create`        | ✓   |     |     |     |     |     |     |     |     |     |
| `products:archive`       | ✓   |     |     |     |     |     |     |     |     |     |
| `users:read`             | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `users:manage`           | ✓   |     |     |     |     |     |     |     |     |     |
| `platform:settings`      | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `platform:audit`         | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `product:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `product_members:read`   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product_members:manage` | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `permissions:manage`     | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `product_users:read`     | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:create`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:update`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:delete`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `roles:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `roles:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `api_keys:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `api_keys:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `audit:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `collections:read`       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:read`              | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:manage`            | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `webhooks:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `webhooks:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `usage:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `billing:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:manage`          | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:send_external`   | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenant:read`            | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:manage`         | ✓   |     | ✓   | ✓   | ✓   |     | ✓   | ✓   |     |     |
| `records:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `records:write`          | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `files:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `files:write`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `events:publish`         | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `usage:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `usage:record`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `billing:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `notify:send`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `notify:preferences`     | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `search:query`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `search:index`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   |     |     |

> [!NOTE]
> **Owner** e **Admin** di un tenant possiedono le stesse autorizzazioni. La
> differenza è il rango di proprietario: solo un proprietario (o un operatore di prodotto o un
> amministratore della piattaforma) può rendere qualcuno proprietario, oppure modificare o
> rimuovere un proprietario. Vedi [tetto dei ruoli](help:security#role-ceiling).

## Autorizzazioni dichiarate dal prodotto {#product-defined}

Oltre al catalogo predefinito, un prodotto può dichiarare autorizzazioni proprie, con nomi nella
forma `<namespace>.<resource>:<action>`, per esempio `crm.deals:approve`. Sono elencate nella
pagina [Autorizzazioni](app:permissions) in **Autorizzazioni del prodotto**, e puoi concederle in
ruoli personalizzati e chiavi API come quelle predefinite.

- **Product owner**, **Product admin** e **Amministratore della piattaforma** le possiedono
  tutte; **Owner** e **Admin** di un tenant possiedono
  quelle con ambito tenant.
- **Product viewer**, **Support** e **Visualizzatore della piattaforma** possiedono
  quelle di sola lettura.
- **Member** e **Viewer** possiedono solo quelle che il prodotto elenca per loro (colonna
  **Concessa anche a**).
- Un'autorizzazione _ritirata_ non ha più alcun effetto, anche dove è ancora elencata.

## Chiavi API e autorizzazioni {#api-keys}

Una [chiave API](help:api-keys) possiede solo le autorizzazioni selezionate al momento della
creazione, e solo nel suo prodotto (e nel suo tenant, se legata a uno). Puoi dare a una chiave solo
autorizzazioni che possiedi tu stesso a livello di prodotto. Le autorizzazioni della piattaforma non
sono mai disponibili per le chiavi.

## Risoluzione dei problemi {#troubleshooting}

| Situazione                                                             | Cosa fare                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Non consentito** con `missing permission …`                          | Trova l'autorizzazione qui sopra e chiedi un ruolo che la possieda.                                                                                                          |
| Un membro di un tenant vede il prodotto ma nessuna pagina del prodotto | È il comportamento previsto: i membri dei tenant ricevono solo `product:read` a livello di prodotto. Lavorano nel loro tenant.                                               |
| Un ruolo non è selezionabile (**"… (oltre le tue autorizzazioni)"**)   | Il ruolo contiene autorizzazioni che non hai, oppure è un ruolo di proprietario. Vedi [tetto dei ruoli](help:security#role-ceiling).                                         |
| Un'autorizzazione manca nell'editor dei ruoli                          | I ruoli di tenant offrono solo autorizzazioni di tenant; le autorizzazioni della piattaforma non vengono mai proposte; le autorizzazioni di prodotto ritirate sono nascoste. |
| Il campo del ruolo è una semplice casella di testo                     | Non puoi leggere i ruoli (`roles:read`); Studio non può elencarli. Digita la chiave del ruolo; il server la verifica.                                                        |
