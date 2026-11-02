---
title: Che cosa sono Axentra e Studio?
summary: Axentra è un backend per prodotti SaaS multi-tenant; Axentra Studio è l'interfaccia web opzionale per amministrarlo.
keywords: introduzione, panoramica, piattaforma, backend, SaaS, console di amministrazione, interfaccia di amministrazione, che cos'è, architettura, multi-tenant, server
---

**Axentra** è una piattaforma backend per prodotti software-as-a-service (SaaS). Fornisce i
componenti di base di cui ha bisogno quasi ogni applicazione multi-tenant, così non devi
ricostruirli in ogni prodotto. **Axentra Studio** è l'interfaccia web con cui amministratori,
operatori e personale di supporto gestiscono un server Axentra: i suoi prodotti, i clienti, gli
utenti, i ruoli, le chiavi API e i dati.

## Che cosa fa Axentra {#what-is-axentra}

Axentra si occupa dell'“impiantistica” di un prodotto SaaS:

- **Account e accesso**: utenti, password, sessioni del browser e single sign-on (OpenID Connect).
- **Clienti (tenant)**: ogni organizzazione cliente del tuo prodotto riceve un proprio tenant, con
  membri e inviti. I dati dei diversi tenant sono rigorosamente separati, anche a livello di
  database.
- **Controllo degli accessi**: ruoli, autorizzazioni e chiavi API per le macchine.
- **Dati**: record (documenti JSON in raccolte) e file.
- **Lavoro in background**: job, pianificazioni, eventi e webhook.
- **Funzionalità commerciali**: misurazione dell'utilizzo, quote, piani e abbonamenti.
- **Notifiche**: modelli di email e invio.
- **Registro di audit**: chi ha fatto cosa e quando, per ogni modifica.

Axentra è un unico pacchetto Python con un database PostgreSQL. Può funzionare in due modi:

- **Come servizio HTTP** (`axentra serve`): il tuo prodotto e gli altri client chiamano l'API
  versionata sotto `/v1`.
- **Come libreria** integrata nella tua applicazione Python: il tuo codice chiama gli stessi
  servizi all'interno del processo.

Entrambe le modalità usano gli stessi servizi, gli stessi controlli delle autorizzazioni e lo
stesso registro di audit. Quali parti opzionali sono attive lo decide l'operatore del server
tramite i [moduli](help:concepts#modules).

## Che cos'è Studio {#what-is-studio}

Studio è un'applicazione web separata che gira nel tuo browser. **Non ha un proprio server né
diritti speciali**: comunica con il server Axentra solo tramite la stessa API HTTP pubblica usata
da ogni altro client. Che cosa vedi e che cosa puoi fare in Studio lo decide il server Axentra, in
base ai tuoi [ruoli](help:roles-permissions).

Ne derivano tre principi:

1. **Studio mostra solo dati reali.** Ogni numero e ogni elenco proviene dal server. Se un modulo
   non è abilitato sul server, Studio lo dice invece di mostrare dati segnaposto.
2. **Il server decide, Studio spiega.** Studio offre le azioni in base alle tue autorizzazioni. Se
   il server rifiuta comunque qualcosa, Studio spiega il rifiuto e mostra l'ID della richiesta per
   il supporto.
3. **Le azioni irreversibili sono intenzionali.** Eliminazione, revoca e sospensione chiedono una
   conferma, e i segreti come le chiavi API vengono mostrati una sola volta.

## Come si relazionano Axentra e Studio {#how-they-relate}

```diagram
architecture
```

- Il tuo **prodotto** (per esempio un CRM o un negozio online) usa Axentra tramite l'API HTTP o
  come libreria. I suoi utenti finali non vedono mai Studio.
- **Studio** è un ulteriore client della stessa API, destinato a chi gestisce la piattaforma.
- Le **macchine** (il backend del tuo prodotto, i job di importazione, le integrazioni) si
  autenticano con le [chiavi API](help:api-keys).
- Axentra comunica con l'esterno tramite **webhook** ed **email** e, facoltativamente, fa accedere
  gli utenti tramite un **provider di identità** esterno.

Studio è **opzionale**. Tutto ciò che Studio può fare, qualsiasi client API può farlo con le
stesse autorizzazioni, e Axentra non dipende mai da Studio. La sicurezza non si basa mai
sull'interfaccia: nascondere un pulsante in Studio è una comodità, è il server ad applicare ogni
regola.

> [!NOTE]
> Al caricamento Studio controlla la versione dell'API del server. Se il server usa una versione
> principale diversa, o è più vecchio di quanto richiesto da questo Studio, Studio si ferma con
> **Versione del server incompatibile**. Vedi la [risoluzione dei problemi](help:troubleshooting).

## Chi usa Studio {#who-uses-studio}

| Chi                                                  | Attività tipiche                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Amministratori della piattaforma                     | Gestiscono l'intera installazione: creano prodotti, assegnano i ruoli nella piattaforma, controllano lo stato del sistema e l'audit. |
| Operatori di prodotto (product owner, product admin) | Gestiscono un prodotto: tenant, ruoli, chiavi API, piani, modelli, webhook.                                                          |
| Personale di supporto                                | Legge i dati e risponde alle domande dei clienti, gestisce i membri nei limiti delle proprie autorizzazioni.                         |
| Amministratori dei tenant                            | Gestiscono i membri e gli inviti della propria organizzazione.                                                                       |

Per usare Studio non serve saper programmare. Alcune aree (record, payload dei job, impostazioni
del prodotto) accettano input JSON; gli esempi negli articoli bastano per iniziare.

## Scenari tipici {#scenarios}

- **Un nuovo server entra in produzione.** L'operatore stampa un token di configurazione; tu crei il
  primo amministratore della piattaforma e poi il primo prodotto. Vedi la
  [configurazione iniziale](help:first-run-setup) e i [primi passi](help:first-steps).
- **Un nuovo cliente firma un contratto.** Crei un tenant, inviti l'amministratore del cliente e
  crei una chiave API per la sua integrazione. Vedi
  [Integrare un'organizzazione cliente](help:tutorial-onboard-customer).
- **Un cliente segnala “accesso negato”.** Controlli il ruolo del membro, le autorizzazioni della
  chiave API e gli eventi negati nel [registro di audit](help:audit).
- **Un'integrazione ha bisogno di eventi.** Registri un webhook e ne osservi le consegne. Vedi
  [Creare un ricevitore di webhook](help:tutorial-webhook-receiver).
- **Il reparto vendite introduce un nuovo piano tariffario.** Definisci contatori, piani e
  abbonamenti. Vedi [Piani e utilizzo](help:tutorial-plan-usage).

## Che cosa Studio non fa {#what-studio-does-not-do}

- Studio non installa né configura il server. Le impostazioni del server (moduli, metodi di
  accesso, origini consentite, modalità) si trovano nella configurazione del server; Studio mostra
  solo i valori effettivi non segreti in **Impostazioni**. Vedi la
  [configurazione del server](help:server-configuration).
- Studio non crea direttamente gli account utente. Gli account provengono dalla configurazione
  iniziale, dal single sign-on o dal codice del tuo prodotto. Vedi [utenti](help:users).
- Alcune funzioni sono disponibili solo tramite l'API. Sono elencate nelle
  [limitazioni note](help:limitations).

## Risoluzione dei problemi {#troubleshooting}

| Situazione                                                    | Che cosa fare                                                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Impossibile connettersi ad Axentra** all'apertura di Studio | Studio non è riuscito a caricare `GET /v1/meta`. Verifica che il server Axentra sia in esecuzione e che Studio sia configurato con l'indirizzo API corretto. |
| **Versione del server incompatibile**                         | Usa una release di Studio corrispondente alla versione dell'API del server, oppure aggiorna il server.                                                       |
| Una voce della barra laterale mostra **Off**                  | Il modulo del server corrispondente non è abilitato. Chiedi all'operatore del server. Vedi [moduli](help:concepts#modules).                                  |
| Manca un'azione che ti aspetti                                | Probabilmente non hai l'autorizzazione necessaria. Vedi [ruoli e autorizzazioni](help:roles-permissions).                                                    |
