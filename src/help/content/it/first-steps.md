---
title: Primi passi
summary: Una prima sessione guidata in Studio - crea un prodotto e un tenant, invita un membro, crea una chiave API e verifica che ogni passaggio abbia funzionato.
keywords: per iniziare, guida rapida, avvio rapido, tutorial, principiante, primo prodotto, primo tenant, prima chiave API, primo invito, hello world, procedura guidata
---

In questo tutorial configuri una struttura di lavoro piccola ma reale: un prodotto, un cliente
(tenant) in quel prodotto, un invito per una persona e una chiave API utilizzabile da una macchina.
Dopo ogni passaggio verifichi il risultato, così sai che ha funzionato. Ci vogliono circa 15 minuti.

Strada facendo impari i termini più importanti. Se uno è nuovo per te, consulta i
[concetti chiave](help:concepts).

## Prima di iniziare {#before-you-start}

> [!IMPORTANT]
>
> - Hai eseguito l'accesso a Studio, idealmente come **amministratore della piattaforma** (per
>   esempio con l'account creato nella [configurazione iniziale](help:first-run-setup)).
> - Per creare un prodotto ti servono l'autorizzazione di piattaforma `products:create` e un server
>   in **modalità multiprodotto**. In modalità a prodotto singolo il prodotto esiste già: salta il
>   [passaggio 1](help:first-steps#create-product).
> - Per il [passaggio 4](help:first-steps#create-api-key) e la relativa verifica ti serve una riga
>   di comando con `curl`.

Usa nomi di esempio. Questo tutorial usa il prodotto “Example CRM” e il tenant “Acme Ltd”.

## Passaggio 1: creare un prodotto {#create-product}

Un **prodotto** è la tua applicazione sul server Axentra. Tutto il resto di questo tutorial si trova
al suo interno.

1. Apri [Prodotti](app:products).
2. Scegli **Nuovo prodotto**.
3. Inserisci il **Nome** `Example CRM`. Studio ricava lo **Slug** `example-crm`; mantienilo.
4. Facoltativamente aggiungi una **Descrizione**.
5. Scegli **Crea prodotto**.

**Risultato atteso:** Studio segnala «Prodotto “Example CRM” creato» e apre la pagina del prodotto.

**Verifica:** apri la scheda **Membri**. Il tuo account è elencato con il ruolo **Product owner**
(proprietario del prodotto): chi crea un prodotto ne diventa il proprietario. Il prodotto compare anche nel selettore
di prodotto in alto.

Ora scegli **Apri dashboard**. Si apre la dashboard di “Example CRM”; tutti i contatori mostrano `0`
tranne **Utenti** (tu, come operatore del prodotto) ed **Eventi di audit (24 h)**.

## Passaggio 2: creare un tenant {#create-tenant}

Un **tenant** è un'organizzazione cliente del tuo prodotto. I suoi dati sono rigorosamente separati
da quelli di tutti gli altri tenant.

1. Apri [Tenant](app:tenants), oppure scegli **Nuovo tenant** nella dashboard.
2. Scegli **Nuovo tenant**.
3. Inserisci il **Nome** `Acme Ltd`. Studio ricava lo **Slug** `acme-ltd`.
4. Scegli **Crea tenant**.

**Risultato atteso:** Studio segnala «Tenant “Acme Ltd” creato» e apre la pagina del tenant con le
schede **Dettagli**, **Membri** e **Inviti**. Lo stato è **Attivo**.

**Verifica:** tornando alla dashboard, **Tenant** mostra ora `1`. Annota l'**ID** del tenant nella
scheda **Dettagli** (inizia con `ten_`); ti servirà nel passaggio 4.

> [!NOTE]
> Un nuovo tenant non ha membri. Li aggiungi nel passaggio successivo.

## Passaggio 3: invitare un membro {#invite-member}

Le persone entrano in un tenant tramite un **invito** (oppure vengono aggiunte direttamente se hanno
già un account che puoi vedere).

1. Nella pagina del tenant, apri la scheda **Inviti**.
2. Scegli **Invita membro**.
3. Inserisci l'**Indirizzo email** di un collega, per esempio `maria@example.com`.
4. Lascia **Ruolo** su **Member** oppure scegli un altro ruolo. I ruoli che superano le tue
   autorizzazioni non possono essere selezionati.
5. Scegli **Invia invito**.

**Risultato atteso:** la finestra **Invito creato** mostra il segreto dell'invito, contrassegnato
come **Mostrato una sola volta**: con il modulo `notify` abilitato un **Link di invito** (e Axentra
invia anche l'invito per email), altrimenti solo il **Token di invito**.

6. Copia il link o il token e invialo al tuo collega tramite un canale di cui ti fidi, poi scegli
   **Fatto**.

**Verifica:** la scheda **Inviti** elenca l'invito con stato **In attesa** e una data di scadenza di
sette giorni dopo.

> [!IMPORTANT]
> Il tuo collega accetta dopo aver eseguito l'accesso con un account che ha esattamente l'indirizzo
> email invitato. Come funziona, anche per chi non ha un account, è descritto in
> [Integrare un'organizzazione cliente](help:tutorial-onboard-customer#accept-invitation).

## Passaggio 4: creare una chiave API {#create-api-key}

Una **chiave API** consente a una macchina, per esempio l'integrazione di Acme, di chiamare l'API.
Ogni chiave ha un elenco esplicito di autorizzazioni; assegnale solo ciò che le serve.

1. Apri [Chiavi API](app:apiKeys), oppure scegli **Nuova chiave API** nella dashboard.
2. Scegli **Nuova chiave API**.
3. Inserisci il **Nome** `acme-integration test`.
4. In **Ambito tenant**, scegli **Acme Ltd**. La chiave potrà raggiungere solo i dati di questo
   tenant.
5. In **Autorizzazioni**, seleziona solo `tenant:read`.
6. Scegli **Crea chiave**.

**Risultato atteso:** la finestra **Segreto per “acme-integration test”** mostra il **Segreto della
chiave API**, che inizia con `axk_`. Copialo subito: viene mostrato solo questa volta.

7. Seleziona **Ho conservato il segreto in modo sicuro**, poi scegli **Fatto**.

**Verifica:** la chiave è elencata con stato **Attivo**, ambito **Tenant** e **1 autorizzazione**.

### Provare la chiave {#try-api-key}

Chiama l'API con la chiave. Sostituisci l'indirizzo, l'ID del prodotto (dal riquadro **Server** della
dashboard, **ID prodotto**) e l'ID del tenant:

```bash
curl -s https://axentra.example.com/v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE \
  -H "Authorization: Bearer axk_EXAMPLE_SECRET"
```

**Risultato atteso:** una descrizione JSON del tenant:

```json
{
  "id": "ten_01EXAMPLE",
  "product_id": "prd_01EXAMPLE",
  "slug": "acme-ltd",
  "name": "Acme Ltd",
  "status": "active"
}
```

La risposta reale contiene qualche campo in più. Tornando in Studio, ricarica **Chiavi API**:
**Ultimo utilizzo** mostra ora un orario.

Se la chiamata non riesce, vedi la [risoluzione dei problemi](help:first-steps#troubleshooting). Per
imparare a usare l'API, vedi le [nozioni di base sull'API](help:api-basics).

## Passaggio 5: consultare il registro di audit {#check-audit}

Tutto ciò che hai appena fatto è stato registrato.

1. Apri [Registro di audit](app:audit).
2. In **Prodotto**, scegli “Example CRM” e applica il filtro.

**Risultato atteso:** vedi, dal più recente, `access.api_key.create`, `tenancy.invitation.create`,
`tenancy.tenant.create` e (in modalità multiprodotto) `tenancy.product.create`, ciascuno con te come
autore ed esito **Riuscito**. Seleziona una voce per vederne i dettagli.

## Che cosa hai costruito {#summary}

```diagram
hierarchy
```

Hai un prodotto con un tenant, un invito aperto e una chiave API legata al tenant, e sai dove
verificare ciascuno di essi. Prossimi passi:

- Integra un cliente reale dall'inizio alla fine:
  [Integrare un'organizzazione cliente](help:tutorial-onboard-customer).
- Definisci i tuoi ruoli: [ruoli e autorizzazioni](help:roles-permissions).
- Elimina la chiave di prova: in **Chiavi API**, apri le azioni della chiave e scegli **Revoca
  chiave**.

## Risoluzione dei problemi {#troubleshooting}

| Problema                                                     | Causa e soluzione                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Manca **Nuovo prodotto**                                     | Non sei amministratore della piattaforma, oppure il server funziona in modalità a prodotto singolo. Usa il prodotto esistente. |
| **Conflitto** durante la creazione del prodotto o del tenant | Lo slug è già in uso (prodotti: sul server; tenant: nel prodotto). Scegli un altro slug.                                       |
| **Verifica i dati inseriti** per lo slug                     | Gli slug hanno da 2 a 63 caratteri: lettere minuscole, cifre e trattini, e iniziano con una lettera o una cifra.               |
| **Conflitto** durante l'invito                               | Nel tenant esiste già un invito aperto per questo indirizzo. Revocalo o usalo.                                                 |
| **Non consentito** durante la creazione della chiave         | Hai selezionato un'autorizzazione che non possiedi.                                                                            |
| `curl` risponde `401`                                        | Il segreto è incompleto o errato, oppure la chiave è stata revocata. Crea una nuova chiave.                                    |
| `curl` risponde `404`                                        | L'ID del prodotto o del tenant è errato, oppure la chiave è legata a un altro tenant.                                          |
| `curl` risponde `403`                                        | Alla chiave manca l'autorizzazione (`tenant:read`), oppure il tenant è sospeso.                                                |
| Il registro di audit non mostra nulla                        | Ti serve `audit:read` per il prodotto (o un ruolo nella piattaforma). Controlla il filtro **Prodotto**.                        |
