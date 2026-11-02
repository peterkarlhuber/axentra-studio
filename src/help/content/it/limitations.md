---
title: Limitazioni note
summary: Cosa Studio e il server Axentra non fanno ancora, o fanno con una restrizione nota, e come aggirare il problema.
keywords: limitazioni, limiti, problemi noti, non supportato, funzionalità mancante, restrizioni, soluzione alternativa, workaround, roadmap, non possibile
---

Questa pagina elenca le restrizioni che potresti notare lavorando con questa versione di Studio e
del server Axentra, ciascuna con una soluzione alternativa quando esiste. Alcune dipendono da
Studio, altre dal server; a volte l'API del server offre più di quanto offra Studio.

## Utenti e accesso {#users-sign-in}

- **In Studio non si creano account.** Gli account nascono dalla configurazione iniziale,
  dall'accettazione di un invito o dal primo accesso tramite single sign-on. Invita invece le
  persone in un tenant.
- **Nessun invito per gli operatori di prodotto.** Puoi aggiungere un membro del prodotto solo se
  ha già un account visibile per te. Soluzione alternativa: invita prima la persona in uno dei
  tenant del prodotto, oppure chiedi a un amministratore della piattaforma di aggiungerla.
- **Nessun ripristino della password, verifica dell'email o autenticazione a due fattori** in
  Axentra stesso. Se usi il single sign-on, il tuo provider di identità può imporre
  l'autenticazione a due fattori.
- **I provider di single sign-on si configurano solo nella configurazione del server.** Studio non
  può elencare, aggiungere o disattivare provider di identità.
- **Gli account senza indirizzo email** (possibili con alcune configurazioni di single sign-on) non
  possono essere creati o collegati in Studio.
- **Nessuna esportazione o cancellazione dei dati di una persona.** Le richieste relative alla
  protezione dei dati devono essere gestite dall'operatore su utenti, record, backup e log.
- **Il limite dei tentativi di accesso è per minuto.** Chiunque conosca un indirizzo email può
  bloccare gli accessi con password di quell'account per un massimo di un minuto inviando password
  errate; le sessioni già aperte e il single sign-on non sono interessati.

## Ruoli, autorizzazioni e chiavi API {#access}

- **Studio può mostrare quali ruoli puoi assegnare solo se puoi leggere i ruoli** (`roles:read`).
  Senza questa autorizzazione, il campo del ruolo è un semplice testo e il server spiega un
  eventuale rifiuto. Una modifica di ruolo fatta mentre una pagina è aperta viene notata solo
  quando Studio ricarica le tue autorizzazioni, oppure quando ricarichi la pagina.
- **Le autorizzazioni proprie di un prodotto non si possono dichiarare in Studio.** La pagina
  **Autorizzazioni** è di sola lettura; i prodotti le dichiarano nel codice o tramite l'API.
- **Il salvataggio di un ruolo personalizzato elimina le autorizzazioni di prodotto ritirate** che
  vi sono ancora elencate. Mentre erano ritirate non avevano effetto, ma sarebbero tornate valide se
  il prodotto le avesse dichiarate di nuovo.
- **Le chiavi API create da una persona non vengono revocate quando quella persona se ne va.**
  Controllale e revocale tu stesso.
- **La conferma di revoca non elenca le chiavi derivate.** Revocare una chiave revoca anche tutte
  le chiavi create con essa, ma Studio non mostra quali sono.

## Dati e file {#data-files}

- **Nessun conteggio totale.** Gli elenchi mostrano “N voci visualizzate” e caricano altre voci su
  richiesta; per scelta progettuale l'API non ha numeri di pagina né totali.
- **Record:** filtri solo sui valori JSON di primo livello, ordinamento solo per id, data di
  creazione o di modifica. Il salvataggio di un record sostituisce l'intero oggetto JSON. Un record
  contiene al massimo 256 KiB.
- **La ricerca full-text** esiste nel server (modulo `search`) ma non ha ancora una schermata in
  Studio; è disponibile tramite l'API.
- **Backup e archiviazione dei file:** Studio non mostra lo stato dei backup, e la procedura di
  backup del server copre il database; l'archiviazione dei file deve essere sottoposta a backup
  separatamente.

## Job, eventi e webhook {#events}

- **Accoda job è proposto solo con `jobs:manage`.** Alcuni tipi di job potrebbero essere accodati
  anche dagli utenti dei tenant, ma l'API non indica quali, quindi Studio non li propone.
- **La vista in diretta degli eventi interroga periodicamente il server.** I nuovi eventi
  compaiono con un breve ritardo, non istantaneamente; non ci sono WebSocket.
- **La prossima esecuzione di una pianificazione viene calcolata dal server al salvataggio**;
  Studio verifica la sintassi cron mentre scrivi, ma non mostra in anteprima la prossima esecuzione
  di un'espressione non salvata. Le pianificazioni vengono eseguite in UTC.

## Utilizzo e fatturazione {#usage-billing}

- **Le prenotazioni si possono cercare solo tramite id.** L'API non offre un elenco delle
  prenotazioni.
- **Nessun dato di carte o conti bancari in Studio**, per scelta progettuale. I piani a pagamento
  passano dal checkout ospitato dal provider di pagamento.
- **I provider di pagamento non sono stati testati con servizi reali** in questa versione; sono
  testati solo con provider simulati.

## Notifiche {#notifications}

- **Solo email.** Non esistono canali SMS o push.
- **Non esiste ancora un limite di invio per tenant** per le notifiche.

## Studio e il server {#studio-server}

- **La versione del server viene verificata solo quando Studio si carica.** Dopo un aggiornamento
  del server, ricarica la pagina. Anche l'elenco dei moduli abilitati viene letto solo al
  caricamento.
- **Indirizzi separati per Studio e per l'API** funzionano solo se entrambi appartengono allo
  stesso sito (per esempio `studio.example.com` e `api.example.com`). La configurazione consigliata
  e testata serve entrambi dallo stesso indirizzo.
- **Server a prodotto singolo con prodotti residui:** se un server in modalità a prodotto singolo
  contiene ancora altri prodotti, Studio nasconde il selettore di prodotto. Gli amministratori della
  piattaforma raggiungono gli altri prodotti solo tramite la pagina **Prodotti**, e lì non possono
  archiviarli.
- **Le impostazioni del server non si possono modificare in Studio.** La pagina **Impostazioni**
  mostra solo la configurazione effettiva; le modifiche si fanno sul server.
- **Il limite generale di frequenza delle richieste è disattivato per impostazione predefinita** e
  viene contato per processo del server.

## Browser, lingue e accessibilità {#browsers-languages}

- **Vengono testati automaticamente solo i browser basati su Chromium.** Firefox e Safari
  dovrebbero funzionare, ma non sono coperti dai test automatici.
- **I testi del server sono in inglese**: le descrizioni di ruoli e autorizzazioni e il
  **Messaggio del server** nei dettagli degli errori non sono tradotti.
- **I controlli di accessibilità coprono la prima visualizzazione di ogni pagina**; finestre di
  dialogo aperte, menu ed errori dei moduli vengono controllati solo in alcune aree. Vedi
  [Tastiera e accessibilità](help:keyboard-accessibility#known-gaps).

## Operatività {#operations}

- **Per questa versione non sono stati effettuati né un deployment in produzione né test di
  carico**; non ci sono ancora dati sulla capacità.
- **Le migrazioni del database vanno solo in avanti.** Tornare a una versione precedente significa
  ripristinare un backup.

## Pagine correlate {#related}

- [Risoluzione dei problemi](help:troubleshooting) per i messaggi di errore e le soluzioni.
- [Domande frequenti](help:faq) per le domande comuni.
- [Riferimento dei moduli](help:modules-reference) per capire cosa significa un modulo disattivato.
