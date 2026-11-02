---
title: Chiavi API
summary: Crea chiavi API per i servizi che chiamano Axentra, inviale correttamente, ruotale senza interruzioni e revocale, comprese le chiavi derivate.
keywords: chiave API, chiave, token, segreto, credenziale, accesso macchina, account di servizio, integrazione, ruotare, rotazione, periodo di tolleranza, revocare, scadenza, axk, bearer, X-API-Key
---

Una **chiave API** consente a una macchina, come il backend del tuo prodotto, un worker o uno script
di importazione, di chiamare l'API di Axentra senza che una persona esegua l'accesso. Ogni chiave
appartiene esattamente a un prodotto, ha un elenco esplicito di autorizzazioni e può essere legata a
un tenant. Una chiave non possiede mai autorizzazioni di piattaforma.

Il segreto della chiave viene mostrato **una sola volta**, quando la chiave viene creata o ruotata.
Axentra ne conserva solo un hash, quindi nessuno, nemmeno un amministratore, può visualizzarlo di
nuovo.

> [!IMPORTANT]
> La schermata **Chiavi API** richiede il modulo degli accessi e `api_keys:read`. Creare, ruotare e
> revocare chiavi richiede `api_keys:manage` (proprietari e amministratori del prodotto). Puoi
> concedere a una chiave solo autorizzazioni che possiedi tu stesso a livello di prodotto.

## Creare una chiave API {#create}

1. Apri [Chiavi API](app:apiKeys) e scegli **Nuova chiave API**.
2. Inserisci un **Nome** che indichi dove viene usata la chiave, per esempio
   `billing-worker production`.
3. Facoltativamente scegli un **Ambito tenant** (vedi [chiavi legate a un tenant](#tenant-scope)).
   Lascia **Intero prodotto** per una chiave che funziona in ogni tenant.
4. Seleziona le **Autorizzazioni** di cui il servizio ha bisogno, e non di più. L'elenco di
   controllo funziona come descritto in [ruoli e autorizzazioni](help:roles-permissions#checklist).
5. Scegli **Crea chiave**.
6. Copia il segreto da **Segreto della chiave API** nel tuo gestore di segreti.
7. Seleziona **Ho conservato il segreto in modo sicuro** e scegli **Fatto**.

> [!CAUTION]
> La finestra del segreto non si chiude con Esc né facendo clic all'esterno, e il segreto non può
> essere mostrato di nuovo. Se va perso, [ruota la chiave](#rotate) per ottenere un nuovo segreto.

| Campo                   | Che cosa fa                                           | Valori consentiti / predefinito                                                                       |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Nome**                | Etichetta nell'elenco e nel registro di audit.        | Da 1 a 200 caratteri. Non univoco.                                                                    |
| **Ambito tenant**       | Lega la chiave a un tenant.                           | **Intero prodotto** (predefinito) oppure un tenant. Mostrato quando il modulo dei tenant è abilitato. |
| **Autorizzazioni**      | Che cosa può fare la chiave.                          | Da 1 a 100 autorizzazioni con ambito prodotto o tenant, comprese quelle attive definite dal prodotto. |
| Scadenza (`expires_at`) | Momento dopo il quale la chiave smette di funzionare. | Non impostabile in Studio: le chiavi create qui non scadono mai. Disponibile tramite l'API.           |

### Chiavi legate a un tenant {#tenant-scope}

Una chiave con un **Ambito tenant** funziona solo all'interno di quel tenant: lì può usare le sue
autorizzazioni di tenant, mentre le sue autorizzazioni di prodotto non hanno alcun effetto. Ogni
altro tenant risponde **Non trovato**. Quando il tenant viene eliminato, la chiave viene eliminata
con esso; finché il tenant è sospeso, la chiave viene rifiutata.

## Inviare la chiave con una richiesta {#use}

Una chiave ha la forma `axk_<26 characters>_<secret>`. L'elenco mostra solo la prima parte (il
**prefisso**, per esempio `axk_01jdk7x3m9q2w8v5r4t6y0z1ab_`), che identifica la chiave ma non può
essere usata per chiamare l'API. Invia la chiave completa in una di queste intestazioni:

```http
GET /v1/products/prd_01EXAMPLE/tenants HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01jdk7x3m9q2w8v5r4t6y0z1ab_EXAMPLEsecretEXAMPLEsecretEXAMPLEsec
```

```bash
curl -H "X-API-Key: $AXENTRA_API_KEY" https://api.example.com/v1/products/prd_01EXAMPLE/tenants
```

Le richieste con una chiave non richiedono né token CSRF né cookie. Tieni la chiave lontana dai
browser e dal codice sorgente; caricala da una variabile d'ambiente o da un gestore di segreti. Vedi
le [nozioni di base sull'API](help:api-basics).

## Leggere l'elenco delle chiavi {#list}

| Colonna                  | Significato                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nome**                 | Il nome e il prefisso della chiave.                                                                                                              |
| **Stato**                | **Attivo**, **Scaduto** (oltre la scadenza) o **Revocato** (revocata, oppure sostituita tramite rotazione al termine del periodo di tolleranza). |
| **Ambito**               | **Intero prodotto** oppure **Tenant** con l'ID del tenant.                                                                                       |
| **Autorizzazioni**       | Numero di autorizzazioni.                                                                                                                        |
| **Ultimo utilizzo**      | Ultima richiesta riuscita; aggiornato al massimo una volta al minuto.                                                                            |
| **Scadenza**, **Creata** | Data e ora.                                                                                                                                      |

Le chiavi attive sono elencate per prime, dalla più recente. Le chiavi scadute e revocate restano
nell'elenco come riferimento.

## Ruotare una chiave {#rotate}

La rotazione sostituisce una chiave con una nuova, per esempio a intervalli regolari o dopo che un
segreto è stato esposto.

1. Nella riga della chiave, apri il menu delle azioni (**…**) e scegli **Ruota segreto**.
2. Scegli un **Periodo di tolleranza per il segreto precedente**.
3. Scegli **Ruota segreto** e conserva il nuovo segreto, come durante la creazione di una chiave.

La sostituta è una **nuova chiave** con un nuovo ID e un nuovo prefisso, e con lo stesso nome, le
stesse autorizzazioni, lo stesso ambito tenant e la stessa scadenza. Le autorizzazioni di prodotto
dismesse vengono escluse. La vecchia chiave viene revocata al termine del periodo di tolleranza.

```diagram
key-rotation
```

### Periodo di tolleranza {#grace-period}

| Opzione                                                        | Effetto                                                                                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Nessuno: il segreto precedente smette subito di funzionare** | La vecchia chiave viene revocata subito. I servizi che la usano ancora falliscono finché non ricevono il nuovo segreto.                   |
| **1 ora**, **24 ore**, **7 giorni**                            | La vecchia e la nuova chiave funzionano entrambe fino al termine del periodo. Entrambe sono elencate come **Attivo**, con lo stesso nome. |

> [!TIP]
> Rotazione senza interruzioni: ruota con **24 ore**, distribuisci il nuovo segreto a tutti i
> servizi, verifica che l'**Ultimo utilizzo** della nuova chiave si aggiorni e quello della vecchia
> si fermi, poi revoca la vecchia chiave per terminare in anticipo il periodo di tolleranza.

Le chiavi che un servizio ha creato _con_ la vecchia chiave non vengono revocate dalla rotazione e
continuano a funzionare.

## Revocare una chiave {#revoke}

1. Apri il menu delle azioni della chiave (**…**) e scegli **Revoca chiave**.
2. Digita il nome della chiave per confermare e scegli **Revoca chiave**.

La chiave smette di funzionare immediatamente e in modo permanente. Revocare una chiave che si trova
nel periodo di tolleranza termina subito il periodo di tolleranza.

> [!CAUTION]
> La revoca revoca anche, all'istante, ogni chiave **creata con questa chiave** e le chiavi create
> con quelle. La conferma non le elenca; controlla la voce del [registro di audit](help:audit)
> relativa alla revoca per conoscere le chiavi derivate revocate.

## Chiavi derivate e scadenza {#derived-keys}

Un servizio la cui chiave possiede `api_keys:manage` può creare altre chiavi tramite l'API. Queste
**chiavi derivate**:

- possiedono al massimo le autorizzazioni della chiave che le crea;
- non le sopravvivono mai: senza una scadenza propria ereditano la scadenza della chiave che le
  crea, e una scadenza successiva viene rifiutata;
- vengono revocate insieme a essa (vedi [revocare](#revoke)), ma non in caso di rotazione.

Le chiavi create in Studio vengono create dal tuo account utente, non da una chiave, quindi queste
regole non si applicano. Le chiavi appartengono al prodotto, non alla persona che le ha create:
continuano a funzionare quando quella persona se ne va o viene disattivata.

## Buono a sapersi {#good-to-know}

- Un prodotto archiviato o un tenant sospeso fa fallire tutte le sue chiavi con **Non consentito**
  finché non viene ripristinato o riattivato.
- Rimuovere un'autorizzazione da un prodotto (dismetterla) ne elimina silenziosamente l'effetto da
  ogni chiave.
- Assegna a ogni servizio una chiave propria, così puoi ruotarne o revocarne una senza influire
  sulle altre.

## Risoluzione dei problemi {#troubleshooting}

**Non consentito: "you cannot grant permissions you do not hold: …".** Hai selezionato
un'autorizzazione che non possiedi. Rimuovila oppure chiedi a un proprietario del prodotto di creare
la chiave. Lo stesso vale per la rotazione: chi ruota la chiave deve possedere tutte le sue
autorizzazioni.

**Verifica i dati inseriti: "an API key needs at least one permission" / "unknown permissions".**
Seleziona almeno un'autorizzazione; nel frattempo un'autorizzazione di prodotto potrebbe essere stata
dismessa.

**Verifica i dati inseriti: "only active keys can be rotated".** La chiave è scaduta o revocata.
Crea invece una nuova chiave.

**Verifica i dati inseriti: "expires_at must not be later than the expiry of the creating key".**
Solo tramite l'API: una chiave derivata non può sopravvivere alla chiave madre.

**Accedi (401) quando il servizio chiama l'API.** La chiave è errata, incompleta, revocata o
scaduta. Verifica che venga inviata la chiave completa (non solo il prefisso) e che lo stato sia
**Attivo**.

**Non consentito (403) per una chiave valida.** Alla chiave manca l'autorizzazione per quella
richiesta, il prodotto è archiviato oppure il tenant è sospeso.

**Non trovato (404) per una chiave valida.** La chiave appartiene a un altro prodotto, oppure è
legata a un altro tenant.
