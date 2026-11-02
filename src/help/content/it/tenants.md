---
title: Tenant
summary: Crea tenant per i tuoi clienti, rinominali, sospendili, riattivali ed eliminali, e scopri che effetto ha ogni azione su accessi e dati.
keywords: tenant, cliente, organizzazione, account, azienda, spazio di lavoro, workspace, sospendere, riattivare, eliminare tenant, slug
---

Un **tenant** è un cliente o un'organizzazione all'interno di un prodotto. I dati di ogni tenant
(record, file, utilizzo, abbonamenti, notifiche) sono rigorosamente separati da quelli di ogni altro
tenant, anche nel database. Le persone ottengono l'accesso a un tenant tramite un'**appartenenza**
con un ruolo di tenant, vedi [membri e inviti](help:members-invitations).

Crea un tenant per ogni cliente. Gli operatori di prodotto (utenti con un ruolo di prodotto)
lavorano su tutti i tenant; i membri di un tenant vedono solo il proprio tenant.

```diagram
hierarchy
```

> [!IMPORTANT]
> La schermata **Tenant** richiede il modulo dei tenant. Per vedere l'elenco serve `tenants:read`;
> senza questa autorizzazione vedi solo i tenant di cui sei membro. La creazione richiede
> `tenants:create`; rinomina, sospensione e riattivazione richiedono `tenants:update`;
> l'eliminazione richiede `tenants:delete`. Proprietari e amministratori del prodotto le possiedono
> tutte.

## Trovare un tenant {#find}

Apri [Tenant](app:tenants). Usa **Cerca tenant** per filtrare per nome o slug e il filtro **Stato**
per mostrare solo i tenant **Attivo** o **Sospeso**. La colonna **Membri** conta le appartenenze del
tenant.

Per trovare in fretta i tenant sospesi, scegli **Sospeso** nel filtro **Stato**; il filtro resta
nell'indirizzo della pagina, quindi puoi salvare o condividere l'elenco filtrato.

## Creare un tenant {#create}

1. Apri [Tenant](app:tenants) e scegli **Nuovo tenant**.
2. Inserisci il **Nome**, per esempio la ragione sociale del cliente.
3. Controlla lo **Slug**. Studio lo ricava dal nome; puoi modificarlo prima di creare il tenant.
4. Scegli **Crea tenant**.

Studio apre il nuovo tenant. Non ha ancora membri: aggiungi la prima persona del cliente nella scheda
**Membri**, oppure invitala nella scheda **Inviti**, di solito con il ruolo **Owner**. Vedi
[membri e inviti](help:members-invitations).

| Campo     | Che cosa fa                                                                              | Valori consentiti / predefinito                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**  | Nome visualizzato in Studio e nelle email di invito.                                     | Da 1 a 200 caratteri. Può essere modificato in seguito.                                                                                           |
| **Slug**  | Identificatore stabile adatto agli URL, da digitare anche per confermare l'eliminazione. | Da 2 a 63 lettere minuscole, cifre e trattini, con una lettera o una cifra iniziale; univoco all'interno del prodotto. Non può essere modificato. |
| **ID**    | Identificatore generato (`ten_…`) usato dall'API.                                        | Assegnato dal server.                                                                                                                             |
| **Stato** | **Attivo** o **Sospeso**.                                                                | I nuovi tenant sono **Attivo**.                                                                                                                   |

> [!TIP]
> Tramite l'API un tenant può essere creato insieme a un proprietario in un solo passaggio
> (`owner_user_id`) e può avere un proprio oggetto `settings`. Studio non mostra queste opzioni.

## Rinominare un tenant {#rename}

1. Apri il tenant e resta nella scheda **Dettagli**.
2. Modifica il **Nome** in **Modifica tenant**.
3. Scegli **Salva modifiche**.

Lo slug e l'ID non cambiano mai.

## Sospendere un tenant {#suspend}

La sospensione blocca ogni accesso a un tenant senza eliminare nulla, per esempio quando un cliente
non ha pagato o un contratto è in pausa.

1. Apri il tenant.
2. Scegli **Sospendi tenant** e conferma.

Finché un tenant è sospeso:

- i suoi membri non possono accedervi; le loro richieste vengono rifiutate con **Non consentito**;
- vengono rifiutate anche le chiavi API legate al tenant e le chiavi valide per l'intero prodotto
  che operano al suo interno;
- gli operatori di prodotto perdono l'accesso ai dati del tenant (membri, inviti, record, file,
  utilizzo, fatturazione); possono comunque aprire la sua pagina, che mostra **Questo tenant è
  sospeso**, e riattivarlo. Il tenant resta nell'elenco [Tenant](app:tenants) con lo stato
  **Sospeso**;
- gli amministratori della piattaforma mantengono l'accesso completo e i visualizzatori della
  piattaforma l'accesso in lettura;
- nessun dato viene eliminato.

## Riattivare un tenant {#reactivate}

Per riattivare serve `tenants:update`, che hanno i proprietari e gli amministratori del prodotto;
non devi essere amministratore della piattaforma.

1. Apri il tenant sospeso, per esempio da [Tenant](app:tenants) con il filtro **Stato** su
   **Sospeso**. La pagina mostra l'avviso **Questo tenant è sospeso**.
2. Scegli **Riattiva tenant**. Nell'elenco la stessa azione si trova nel menu delle azioni (**⋯**)
   della riga di un tenant sospeso.
3. Leggi la conferma e scegli **Riattiva tenant**.

Membri e chiavi tornano subito a funzionare, con gli stessi ruoli e permessi di prima, e lo stato
diventa **Attivo** nella pagina del tenant e nell'elenco. Il registro di audit annota la modifica
come `tenancy.tenant.update` con lo stato precedente e quello nuovo.

Finché il tenant è sospeso, le schede **Membri** e **Inviti** mostrano **Non disponibile finché il
tenant è sospeso** al posto dei loro elenchi, perché il server tiene chiusi i dati del tenant. Chi
non ha `tenants:update` (per esempio i visualizzatori o il supporto del prodotto) vede l'avviso, ma
non l'azione **Riattiva tenant**.

## Eliminare un tenant {#delete}

> [!CAUTION]
> L'eliminazione di un tenant non può essere annullata. Il tenant viene rimosso insieme a record,
> file, appartenenze, inviti, chiavi API legate al tenant, dati di utilizzo, abbonamento, notifiche
> e ricerca. Se hai dubbi, [sospendi](#suspend) invece il tenant.

1. Apri il tenant.
2. Scegli **Elimina tenant**.
3. Digita lo **slug** del tenant (non il suo nome) per confermare, poi scegli **Elimina tenant**.

Studio torna all'elenco dei tenant. Il registro di audit conserva la traccia dell'eliminazione. I
contenuti dei file archiviati vengono rimossi dal backend di archiviazione durante la normale
manutenzione dell'archiviazione eseguita dal server.

## Consultare i dati di un tenant {#records}

**Consulta record** nella pagina del tenant apre [Record](app:records) filtrato su questo tenant.
Viene mostrato quando il modulo dei record è abilitato e possiedi `records:read` nel tenant. Vedi
[record](help:records).

## Buono a sapersi {#good-to-know}

- Un utente può essere membro di più tenant, nello stesso prodotto o in prodotti diversi, con un
  ruolo diverso in ciascuno.
- Gli operatori di prodotto non hanno bisogno di un'appartenenza: il loro ruolo di prodotto copre
  già ogni tenant.
- I selettori in altre schermate (per esempio **Ambito tenant** nelle chiavi API o la schermata
  **Inviti**) elencano i primi 200 tenant in ordine di nome.

## Risoluzione dei problemi {#troubleshooting}

**Conflitto: “a tenant with this slug exists in the product”.** Scegli uno slug diverso. Gli slug
dei tenant eliminati possono essere riutilizzati.

**Verifica i dati inseriti: “slug must be 2-63 lowercase letters, digits or dashes”.** Rimuovi
dallo slug maiuscole, spazi e caratteri speciali.

**Non consentito all'apertura di un tenant.** Il tenant è sospeso e tu sei uno dei suoi membri
(solo gli operatori di prodotto e gli amministratori della piattaforma possono aprire un tenant
sospeso; vedi [riattivare](#reactivate)), oppure il prodotto è archiviato, oppure non possiedi
`tenant:read` al suo interno.

**Non trovato all'apertura di un tenant.** Il tenant è stato eliminato, oppure non hai alcun legame
con esso (Axentra risponde allo stesso modo affinché non sia possibile sondare gli ID dei tenant).

**Modificato nel frattempo.** Qualcun altro ha modificato il tenant mentre lo stavi modificando tu.
Ricarica la pagina e ripeti la modifica.

**Il pulsante di eliminazione resta disattivato.** Digita lo slug esattamente come mostrato nella
finestra, per esempio `acme`, non il nome visualizzato.

**Manca il pulsante Nuovo tenant.** Non possiedi `tenants:create`. Chiedi a un proprietario o a un
amministratore del prodotto.

**Manca l'azione Riattiva tenant.** Non possiedi `tenants:update`. Chiedi a un proprietario o a un
amministratore del prodotto.

**Modificato nel frattempo durante la riattivazione.** Un'altra persona ha modificato il tenant
prima di te. Studio lo ricarica; controlla lo stato e scegli di nuovo **Riattiva tenant** se è
ancora sospeso.
