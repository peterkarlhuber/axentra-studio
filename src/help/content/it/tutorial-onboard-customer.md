---
title: Attivare una nuova organizzazione cliente
summary: Configura un nuovo cliente dall'inizio alla fine - tenant, amministratore e personale con i ruoli giusti, inviti accettati, una chiave API per la sua integrazione e una verifica nel registro di audit.
keywords: onboarding, attivazione cliente, nuovo cliente, configurazione cliente, configurazione tenant, invitare, invito, accettare invito, proprietario, amministratore, membro, visualizzatore, integrazione, chiave API, audit, checklist, offboarding, dismissione cliente
---

Un nuovo cliente, “Acme Ltd”, si è registrato al tuo prodotto. In questo tutorial prepari tutto ciò
di cui ha bisogno: un tenant tutto suo, il suo amministratore e il personale con ruoli adeguati, una
chiave API per la sua integrazione e una verifica nel registro di audit che tutto sia avvenuto come
previsto. Scopri anche cosa deve fare il cliente dal suo lato per accettare un invito.

Questo tutorial si basa sui [primi passi](help:first-steps). Prevedi circa 30 minuti, più il tempo
che serve al cliente per accettare.

## Prima di iniziare {#before-you-start}

> [!IMPORTANT]
> Ti servono queste autorizzazioni nel prodotto (i ruoli predefiniti **Product owner**
> e **Product admin** le hanno tutte; un amministratore della piattaforma le ha
> comunque):
>
> | Attività                                 | Autorizzazione                                                                                           |
> | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
> | Creare il tenant                         | `tenants:create`                                                                                         |
> | Invitare, aggiungere e modificare membri | `members:manage`                                                                                         |
> | Invitare l'**Owner** del cliente         | rango di proprietario: operatore di prodotto, proprietario del tenant o amministratore della piattaforma |
> | Creare la chiave API                     | `api_keys:manage` e ogni autorizzazione che assegni alla chiave                                          |
> | Controllare il registro di audit         | `audit:read`                                                                                             |

Raccogli in anticipo dal cliente:

- l'indirizzo email del suo **amministratore** e di ogni membro del personale,
- cosa deve poter fare ciascuna persona,
- cosa deve fare la sua integrazione tramite l'API.

## Passo 1: pianificare i ruoli {#plan-roles}

Scegli i ruoli prima di invitare qualcuno; cambiarli in seguito è possibile, ma è più facile
dimenticarsene.

| Persona                               | Ruolo di tenant consigliato | Perché                                                                                     |
| ------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| Amministratore principale del cliente | **Owner** (proprietario)    | Controllo completo del tenant, può gestire tutti i membri, compresi gli altri proprietari. |
| Amministratore vicario                | **Admin** (amministratore)  | Gestisce membri e dati, ma non può assegnare né rimuovere proprietari.                     |
| Personale che lavora con i dati       | **Member** (membro)         | Legge e scrive dati, vede i membri; non può gestire i membri.                              |
| Revisori, personale in sola lettura   | **Viewer** (visualizzatore) | Legge soltanto i dati.                                                                     |

Se nessuno è adatto, un operatore di prodotto con `roles:manage` può prima creare un ruolo di
tenant personalizzato. Vedi [ruoli e autorizzazioni](help:roles-permissions).

> [!TIP]
> Assegna **Owner** solo a una o due persone. Un secondo proprietario evita uno stallo quando il primo se ne va.

## Passo 2: creare il tenant {#create-tenant}

1. Apri [Tenant](app:tenants) e scegli **Nuovo tenant**.
2. **Nome**: `Acme Ltd`. Mantieni lo **Slug** derivato `acme-ltd`, oppure inserisci il nome breve
   del cliente. Lo slug deve essere univoco nel prodotto e non può essere riutilizzato finché il
   tenant esiste.
3. Scegli **Crea tenant**.

**Risultato atteso:** «Tenant “Acme Ltd” creato»; si apre la pagina del tenant con stato **Attivo**
e nessun membro. Annota l'**ID** del tenant (`ten_…`) dalla scheda **Dettagli**.

## Passo 3: invitare l'amministratore del cliente {#invite-admin}

1. Nella pagina del tenant, apri **Inviti** e scegli **Invita membro**.
2. **Indirizzo email**: l'indirizzo dell'amministratore, per esempio `admin@acme.example`.
3. **Ruolo**: **Owner**.
4. Scegli **Invia invito**.

**Risultato atteso:** **Invito creato** con il **Token di invito** e, se il modulo `notify` è
abilitato, un **Link di invito**. Entrambi vengono mostrati una sola volta.

### Come l'invito arriva al cliente {#delivery}

- **Con il modulo `notify`**, Axentra invia l'invito per email all'indirizzo, link compreso. Non
  devi inviare nulla; puoi comunque copiare il link come riserva.
- **Senza di esso**, copia il **Token di invito** e invialo tu stesso tramite un canale fidato,
  insieme alle istruzioni del [passo 5](help:tutorial-onboard-customer#accept-invitation).

> [!NOTE]
> Il link di invito viene costruito a partire dall'impostazione di prodotto `invitation_accept_url`
> (nelle **Impostazioni (JSON)** del prodotto), per esempio
> `{"invitation_accept_url": "https://app.example.com/accept-invitation?token={token}"}`. Senza
> questa impostazione, il link punta a `/accept-invitation` sull'indirizzo pubblico dell'API. Fallo
> puntare alla pagina del tuo prodotto che accetta gli inviti, oppure alla pagina di Studio
> `https://studio.example.com/invitations/accept?token={token}` se i tuoi clienti usano Studio.

**Verifica:** la scheda **Inviti** mostra l'invito con stato **In attesa** e una data di scadenza a
7 giorni.

## Passo 4: aggiungere il personale {#add-staff}

Per ogni altra persona, scegli una delle due strade:

- **La persona ha già un account che puoi vedere** (per esempio è membro di un altro tenant di
  questo prodotto): apri **Membri**, scegli **Aggiungi membro**, inserisci l'**Indirizzo email**,
  scegli il **Ruolo** e conferma. La persona ha accesso immediatamente.
- **Altrimenti**: invitala come nel passo 3, con il ruolo del passo 1. Se **Aggiungi membro**
  risponde **Utente non trovato**, scegli **Invia invece un invito**; Studio crea un invito con lo
  stesso ruolo.

Axentra non rivela se un indirizzo ha un account: l'invito funziona allo stesso modo per ogni
indirizzo.

## Passo 5: il cliente accetta {#accept-invitation}

Ecco cosa fa la persona invitata. Inviale queste istruzioni.

1. **Avere un account con esattamente l'indirizzo email invitato.**
   - Se il tuo server offre il **single sign-on**, la persona accede con **Continua con …**. Per un
     indirizzo email verificato con un invito aperto, l'account viene creato automaticamente.
   - Con il **solo accesso tramite password**, l'account deve già esistere. Axentra non prevede
     l'auto-registrazione tramite API: gli account per l'accesso con password vengono creati dal
     codice del tuo prodotto. Vedi [utenti](help:users).
2. **Aprire il link di invito.** Se non ha effettuato l'accesso, la persona viene portata ad
   **Accedi** e, dopo l'accesso, di nuovo all'invito. Con un token invece di un link, dopo l'accesso
   apre **Accetta invito** (indirizzo `/invitations/accept`) e incolla il **Token di invito**.
3. Scegliere **Accetta invito**.

**Risultato atteso:** “Invito accettato. Ora hai accesso.” La persona ora vede il prodotto e il
tenant in base al suo ruolo. Può volerci qualche istante prima che l'accesso sia visibile ovunque.

**Verifica (tu):** nella scheda **Membri** del tenant, la persona è elencata con il ruolo
**Owner**. In **Inviti**, lo stato è **Accettato**.

> [!WARNING]
> Gli inviti sono legati all'indirizzo. Se la persona accede con un altro indirizzo, l'accettazione
> fallisce con **Non consentito**. Un invito già accettato, revocato o scaduto non può essere
> riutilizzato: creane uno nuovo.

## Passo 6: modificare i ruoli se necessario {#change-role}

Nella scheda **Membri**, scegli un nuovo ruolo nell'elenco **Ruolo** del membro; Studio conferma
“Ruolo aggiornato”. Per revocare l'accesso, scegli **Rimuovi membro**. Non puoi modificare né
rimuovere membri il cui ruolo è superiore al tuo (contrassegnati con “Superiore al tuo ruolo”).

## Passo 7: creare la chiave API per l'integrazione {#integration-key}

L'integrazione del cliente (per esempio la sincronizzazione con il suo ERP) riceve una chiave
propria, legata al suo tenant.

1. Apri [Chiavi API](app:apiKeys) e scegli **Nuova chiave API**.
2. **Nome**: indica chi la usa e dove, per esempio `acme erp-sync production`.
3. **Ambito tenant**: **Acme Ltd**. Una chiave legata a un tenant non può vedere né modificare
   altri tenant.
4. **Autorizzazioni**: solo ciò che serve all'integrazione, per esempio `records:read` e
   `records:write` per una sincronizzazione di dati, più `events:publish` se pubblica eventi.
5. Scegli **Crea chiave**, copia il **Segreto della chiave API**, conferma **Ho conservato il
   segreto in modo sicuro** e scegli **Fatto**.

Consegna il segreto al referente tecnico del cliente tramite un canale sicuro (per esempio un secret
manager condiviso), mai tramite una semplice email. L'integrazione lo invia come
`Authorization: Bearer axk_…`. Provalo come nei [primi passi](help:first-steps#try-api-key).

> [!CAUTION]
> Il segreto non può essere mostrato di nuovo. Se va perso o viene divulgato, usa **Ruota segreto**
> (con un periodo di tolleranza per un passaggio senza interruzioni) o **Revoca chiave**. Vedi
> [Chiavi API](help:api-keys).

## Passo 8: controllare il registro di audit {#check-audit}

1. Apri il [Registro di audit](app:audit).
2. Imposta **Prodotto** sul tuo prodotto. Facoltativamente inserisci `tenancy.*` in **Azione** per
   vedere solo gli eventi di tenant e membri, oppure inserisci l'ID del tenant in **ID tenant** (in
   **Altri filtri** sugli schermi piccoli).
3. Scegli **Applica filtri**.

**Risultato atteso**, dal più recente:

| Azione                      | Autore                       | Significato                                                                        |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `access.api_key.create`     | tu                           | È stata creata la chiave dell'integrazione.                                        |
| `tenancy.invitation.accept` | l'amministratore del cliente | L'invito è stato accettato.                                                        |
| `tenancy.member.set`        | tu                           | È stato aggiunto un membro o modificato un ruolo (se hai eseguito il passo 4 o 6). |
| `tenancy.invitation.create` | tu                           | Uno per ogni invito.                                                               |
| `tenancy.tenant.create`     | tu                           | È stato creato il tenant.                                                          |

Tutti con l'esito **Riuscito**. Un tentativo di accettazione con l'account sbagliato compare come
`tenancy.invitation.accept` con l'esito **Negato**.

## Checklist di onboarding {#checklist}

1. Tenant creato, ID annotato.
1. Amministratore invitato come **Owner**, invito accettato, visibile in **Membri**.
1. Personale aggiunto o invitato con i ruoli previsti; tutti gli inviti **Accettato**.
1. Chiave dell'integrazione creata, legata al tenant, autorizzazioni minime, segreto consegnato in modo sicuro.
1. Il registro di audit mostra gli eventi attesi.
1. Facoltativo: abbonamento assegnato (vedi [piani e abbonamenti](help:plans-subscriptions)).

## Quando il cliente se ne va {#offboarding}

- Per prima cosa usa **Sospendi tenant**: i membri e le chiavi legate al tenant perdono l'accesso,
  nessun dato viene eliminato e puoi riattivarlo.
- **Revoca** la chiave dell'integrazione.
- Usa **Elimina tenant** solo quando i dati devono sparire; elimina il tenant e tutti i suoi dati e
  non si può annullare. Vedi [tenant](help:tenants).

## Risoluzione dei problemi {#troubleshooting}

| Problema                                        | Causa e soluzione                                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Owner** non è selezionabile                   | Non hai il rango di proprietario o alcune delle autorizzazioni del ruolo (tetto dei ruoli). Chiedi a un proprietario del prodotto o a un amministratore della piattaforma.                 |
| **Conflitto** durante l'invito                  | Esiste già un invito aperto per questo indirizzo in questo tenant. Usalo o revocalo.                                                                                                       |
| **Utente non trovato** in **Aggiungi membro**   | Nessun account visibile per te ha questo indirizzo. Usa **Invia invece un invito**.                                                                                                        |
| Il cliente non riceve nessuna email             | Il modulo `notify` è disattivato, oppure la consegna della posta non è riuscita. Invia tu il link o il token; controlla le [notifiche](help:notifications).                                |
| Il link apre una pagina “non trovata”           | L'impostazione di prodotto `invitation_accept_url` manca o è errata (vedi [consegna](help:tutorial-onboard-customer#delivery)). Invia il token e fallo incollare in `/invitations/accept`. |
| L'accettazione fallisce con **Non consentito**  | La persona ha effettuato l'accesso con un account la cui email è diversa dall'indirizzo invitato. Accedi con l'account giusto, oppure invita l'indirizzo effettivo.                        |
| L'accettazione fallisce con **Non trovato**     | L'invito è già stato accettato, è stato revocato o ha più di 7 giorni. Crea un nuovo invito.                                                                                               |
| Il single sign-on fallisce con “nessun account” | Non c'è un invito aperto per l'indirizzo verificato e la registrazione è disattivata. Controlla l'indirizzo invitato; vedi [accesso](help:signing-in#sso-errors).                          |
| L'integrazione riceve `403`                     | Alla chiave manca un'autorizzazione, oppure il tenant è sospeso.                                                                                                                           |
| Nessun evento nel registro di audit             | Controlla il filtro **Prodotto** e di avere `audit:read`.                                                                                                                                  |
