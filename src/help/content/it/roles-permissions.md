---
title: Ruoli e autorizzazioni
summary: Comprendi le autorizzazioni e i ruoli predefiniti, crea ruoli personalizzati per il tuo prodotto e consulta il catalogo delle autorizzazioni del prodotto.
keywords: ruolo, autorizzazione, permesso, ruolo personalizzato, ruolo predefinito, diritti di accesso, diritti, privilegi, ambito, autorizzazione di prodotto, autorizzazione dichiarata, autorizzazione dismessa, RBAC
---

Un'**autorizzazione** consente un'azione, per esempio `records:write` (creare, modificare ed
eliminare record). Un **ruolo** è un insieme di autorizzazioni con un nome, che assegni alle persone.
Axentra nega tutto per impostazione predefinita: una persona o una chiave API può fare solo ciò che
un ruolo o l'elenco di autorizzazioni della chiave concede esplicitamente.

Ogni autorizzazione ha un **ambito**:

| Ambito          | Si applica a                                                                 | Concessa da                                                                                                |
| --------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **piattaforma** | L'intera installazione, per esempio `products:create`                        | Solo ruoli nella piattaforma; mai ruoli personalizzati o chiavi API                                        |
| **prodotto**    | Un prodotto nel suo insieme, per esempio `tenants:create`, `api_keys:manage` | Ruoli di prodotto e chiavi API                                                                             |
| **tenant**      | Dati all'interno di un tenant, per esempio `records:read`                    | Ruoli di tenant in quel tenant; ruoli di prodotto e chiavi API valide per l'intero prodotto in ogni tenant |

L'elenco completo si trova nel [riferimento delle autorizzazioni](help:permissions-reference).

> [!IMPORTANT]
> Le schermate **Ruoli** e **Autorizzazioni** richiedono il modulo degli accessi e `roles:read` (la
> schermata **Autorizzazioni** si apre anche con `api_keys:read`). Creare, modificare ed eliminare
> ruoli personalizzati richiede `roles:manage` (proprietari e amministratori del prodotto).

## Ruoli predefiniti {#built-in-roles}

I ruoli predefiniti sono forniti da Axentra e non possono essere modificati. Apri
[Ruoli](app:roles) e scegli l'icona dell'occhio per vedere esattamente quali autorizzazioni ha un
ruolo predefinito nel tuo prodotto.

| Ruolo              | Ambito   | Scopo                                                                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| **Product owner**  | prodotto | Controllo completo del prodotto, compresi gli operatori e le autorizzazioni di prodotto                          |
| **Product admin**  | prodotto | Gestisce tenant, ruoli, chiavi e dati; non può gestire gli operatori né dichiarare autorizzazioni di prodotto    |
| **Support**        | prodotto | Legge tutto; gestisce i membri dei tenant nei limiti delle proprie autorizzazioni (in pratica: i visualizzatori) |
| **Product viewer** | prodotto | Accesso in sola lettura al prodotto e a tutti i suoi tenant                                                      |
| **Owner**          | tenant   | Controllo completo del tenant, compresi gli altri proprietari                                                    |
| **Admin**          | tenant   | Le stesse autorizzazioni di Owner, ma senza il rango di proprietario                                             |
| **Member**         | tenant   | Lavora con i dati del tenant                                                                                     |
| **Viewer**         | tenant   | Accesso in sola lettura al tenant                                                                                |

A questi si aggiungono due ruoli nella piattaforma: **Amministratore della piattaforma** e
**Visualizzatore della piattaforma**. Si assegnano nella pagina di un utente, vedi
[utenti](help:users#platform-role).

## Creare un ruolo personalizzato {#create}

Crea un ruolo personalizzato quando nessun ruolo predefinito è adatto, per esempio per un addetto
al supporto che può leggere i record ma non i file.

1. Apri [Ruoli](app:roles) e scegli **Nuovo ruolo personalizzato**.
2. Inserisci un **Nome**.
3. Controlla la **Chiave**. Studio la ricava dal nome.
4. Scegli l'**Ambito**: **Tenant** per i ruoli da assegnare ai membri dei tenant, **Prodotto** per
   i ruoli da assegnare agli operatori di prodotto.
5. Facoltativamente inserisci una **Descrizione**.
6. Seleziona le **Autorizzazioni** (vedi [l'elenco di controllo delle autorizzazioni](#checklist)).
7. Scegli **Salva modifiche**.

Il ruolo viene ora offerto ovunque si aggiungano o invitino membri del suo ambito.

| Campo              | Che cosa fa                                                                                      | Valori consentiti / predefinito                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**           | Nome visualizzato negli elenchi dei ruoli.                                                       | Da 1 a 100 caratteri. Può essere modificato.                                                                                                    |
| **Chiave**         | Identificatore stabile salvato nelle appartenenze, per esempio `support_agent`.                  | Da 2 a 41 lettere minuscole, cifre o trattini bassi; univoca nel prodotto; non una chiave predefinita come `member`. Non può essere modificata. |
| **Ambito**         | **Tenant**: solo autorizzazioni di tenant. **Prodotto**: autorizzazioni di prodotto e di tenant. | Predefinito **Tenant**. Non può essere modificato.                                                                                              |
| **Descrizione**    | Spiega il ruolo agli altri amministratori.                                                       | Fino a 500 caratteri.                                                                                                                           |
| **Autorizzazioni** | Che cosa consente il ruolo.                                                                      | Fino a 100 autorizzazioni. Le autorizzazioni di piattaforma non vengono mai offerte.                                                            |

## Modificare un ruolo personalizzato {#edit}

Scegli l'icona della matita di un ruolo personalizzato, modifica nome, descrizione o autorizzazioni
e scegli **Salva modifiche**. Chiave e ambito restano fissi.

> [!WARNING]
> Le modifiche si applicano immediatamente a chiunque abbia il ruolo, in ogni tenant del prodotto.

## Eliminare un ruolo personalizzato {#delete}

1. Scegli l'icona del cestino del ruolo.
2. Digita il nome del ruolo per confermare e scegli **Elimina ruolo**.

Un ruolo ancora assegnato a un membro o a un operatore non può essere eliminato: il server risponde
**Conflitto** indicando il numero di assegnazioni. Prima assegna un altro ruolo a quelle persone.

## Usare l'elenco di controllo delle autorizzazioni {#checklist}

L'elenco di controllo compare nell'editor dei ruoli e quando crei una chiave API.

- Le autorizzazioni sono raggruppate per risorsa (la parte prima dei due punti, per esempio
  `records`). La casella di controllo del gruppo seleziona o deseleziona l'intero gruppo; il
  contatore mostra quante sono selezionate.
- **Filtra autorizzazioni…** cerca nei nomi e nelle descrizioni.
- I gruppi contrassegnati con **Prodotto** contengono autorizzazioni dichiarate dal tuo prodotto.
- Ogni autorizzazione mostra la sua descrizione e il suo ambito. A un ruolo di tenant vengono
  offerte solo autorizzazioni di tenant; le autorizzazioni di prodotto dismesse non vengono mai
  offerte.

> [!NOTE]
> Un ruolo personalizzato può contenere qualsiasi autorizzazione del suo ambito. Il [limite dei
> ruoli](help:members-invitations#role-ceiling) si applica quando il ruolo viene _assegnato_: solo
> chi possiede tutte le sue autorizzazioni può assegnarlo a qualcuno.

## Autorizzazioni definite dal prodotto {#product-permissions}

Oltre al catalogo predefinito, un prodotto può dichiarare autorizzazioni proprie per le sue
funzionalità, per esempio `crm.deals:approve`. I loro nomi contengono sempre un punto:
`<namespace>.<resource>:<action>`. Una volta dichiarate, possono essere concesse tramite ruoli
personalizzati e chiavi API come quelle predefinite, e il codice del tuo prodotto le verifica.

Apri [Autorizzazioni](app:permissions) per vedere il catalogo del prodotto. È in sola lettura.

| Colonna              | Significato                                                                                                                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autorizzazione**   | Nome e descrizione.                                                                                                                                                                                                                                                                       |
| **Ambito**           | **prodotto** o **tenant**.                                                                                                                                                                                                                                                                |
| **Concessa anche a** | Ruoli predefiniti che la possiedono oltre alle concessioni automatiche. **Ruoli di sola lettura** significa che la possiedono Support, Product viewer e Visualizzatore della piattaforma; **Solo proprietari e amministratori** significa che nessun altro ruolo predefinito la possiede. |
| **Dichiarata da**    | **Codice del prodotto** (registrata dal codice del prodotto all'avvio) oppure **API** (dichiarata tramite l'API HTTP).                                                                                                                                                                    |
| **Stato**            | **Attiva**, oppure **Dismessa** con la data. Attiva **Mostra dismesse** per elencare quelle dismesse.                                                                                                                                                                                     |

I proprietari e gli amministratori del prodotto e gli amministratori della piattaforma possiedono
sempre tutte le autorizzazioni di prodotto attive; i proprietari e gli amministratori dei tenant
tutte quelle con ambito tenant.

> [!NOTE]
> Studio non può dichiarare né dismettere autorizzazioni. Le registra il codice del prodotto, oppure
> qualcuno con `permissions:manage` (proprietari del prodotto) usa l'API: `PUT` e `DELETE`
> `/v1/products/{product_id}/permissions/{name}`. Un prodotto può dichiarare fino a 500
> autorizzazioni.

### Autorizzazioni dismesse {#retired}

Un'autorizzazione dismessa non concede nulla, anche dove è ancora salvata in un ruolo personalizzato
o in una chiave API. Dichiararla di nuovo ne ripristina l'effetto per chi la possiede. Salvando un
ruolo personalizzato in Studio, i nomi dismessi vengono rimossi dal ruolo, e la rotazione di una
chiave API li rimuove dalla chiave sostitutiva.

## Risoluzione dei problemi {#troubleshooting}

**Conflitto: “a role with this key exists” / “this key belongs to a built-in role”.** Scegli una
chiave diversa.

**Verifica i dati inseriti: “key must be 2-41 lowercase letters, digits or underscores”.** Rimuovi
dalla chiave maiuscole, trattini e spazi.

**Conflitto: “the role is assigned N times; reassign those members first”.** Cambia il ruolo di quei
membri (nelle tab **Membri** dei tenant e del prodotto) prima di eliminarlo.

**Verifica i dati inseriti: “permissions not allowed for a tenant role”.** Un ruolo di tenant può
contenere solo autorizzazioni di tenant.

**Impossibile caricare il catalogo delle autorizzazioni.** Non possiedi `roles:read` (o
`api_keys:read`), oppure il server non è raggiungibile. Ricarica oppure chiedi a un proprietario del
prodotto.

**Modificato nel frattempo.** Qualcun altro ha salvato il ruolo mentre lo stavi modificando. Chiudi
l'editor, riapri il ruolo e ripeti la modifica.

**Un'autorizzazione manca dall'elenco di controllo.** È un'autorizzazione di piattaforma (mai
concedibile qui), un'autorizzazione di prodotto dell'altro ambito oppure un'autorizzazione dismessa.
