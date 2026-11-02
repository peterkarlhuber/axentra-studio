---
title: Domande frequenti
summary: Risposte brevi alle domande più comuni su Studio, con i link ai dettagli.
keywords: FAQ, domande frequenti, domande, come faccio, perché, aiuto, risposte, domande comuni
---

Risposte brevi alle domande più comuni. Ogni risposta rimanda all'articolo con i dettagli.

## Posso creare account utente in Studio? {#create-users}

No. Gli account vengono creati durante la [configurazione iniziale](help:first-run-setup), quando
qualcuno accetta un invito, oppure al primo accesso tramite single sign-on. In Studio inviti persone
in un tenant o aggiungi account esistenti come membri. Vedi
[Membri e inviti](help:members-invitations).

## Come faccio a rendere qualcuno operatore di prodotto? {#add-operator}

Axentra non prevede inviti a livello di prodotto. La persona deve avere un account visibile per te:
invitala prima in uno dei tenant del prodotto; dopo che ha accettato, aggiungila nella pagina del
prodotto in **Membri**. Un amministratore della piattaforma può aggiungere direttamente qualsiasi
account esistente. Vedi [Prodotti](help:products).

## Che differenza c'è tra un ruolo di prodotto e un ruolo di tenant? {#product-vs-tenant-role}

Un ruolo di tenant (per esempio **Member**) vale solo in quel tenant. Un ruolo di prodotto (per
esempio **Product admin**) vale per il prodotto nel suo insieme _e_ per ogni tenant
al suo interno. Assegna i ruoli di prodotto solo a chi ha bisogno di questa portata. Vedi
[Ruoli e autorizzazioni](help:roles-permissions).

## Che differenza c'è tra Owner e Admin di un tenant? {#owner-vs-admin}

Hanno le stesse autorizzazioni. Solo un **Owner** (proprietario) (o qualcuno con autorità dal prodotto o
dalla piattaforma) può rendere qualcuno proprietario, oppure modificare o rimuovere un
proprietario. Ogni tenant conserva almeno un proprietario. Vedi
[tetto dei ruoli](help:security#role-ceiling).

## Perché non posso scegliere alcuni ruoli? {#roles-greyed-out}

Studio contrassegna i ruoli che non puoi assegnare con **"… (oltre le tue autorizzazioni)"**:
contengono autorizzazioni che non possiedi, oppure sono un ruolo di proprietario e tu non sei
proprietario. Nessuno può distribuire più diritti di quanti ne abbia. Vedi
[tetto dei ruoli](help:security#role-ceiling).

## Ho perso il segreto di una chiave API. Posso rivederlo? {#lost-secret}

No. I segreti vengono mostrati una sola volta e il server conserva solo un hash. Usa **Ruota
segreto** per ottenerne uno nuovo; un periodo di tolleranza mantiene valido il vecchio segreto
mentre aggiorni i tuoi servizi. Vedi [Chiavi API](help:api-keys).

## Cosa succede ai dati quando sospendo un tenant? {#suspend-data}

Non viene eliminato nulla. Membri e chiavi API perdono l'accesso finché il tenant non viene
riattivato; gli amministratori della piattaforma possono comunque esaminarlo. Eliminare un tenant,
invece, rimuove il tenant e tutti i suoi dati e non si può annullare. Vedi [Tenant](help:tenants).

## Perché vedo "Non trovato" per qualcosa che esiste? {#not-found-exists}

Se non hai alcun legame con un prodotto o un tenant, Axentra risponde esattamente come se non
esistesse, così nessuno può scoprire quali prodotti, tenant o account ci sono. Chiedi a qualcuno
con accesso di aggiungerti. Vedi [Non trovato](help:troubleshooting#not-found).

## Perché un'area nella barra laterale è contrassegnata con "Off"? {#area-off}

Il modulo del server che la gestisce è disattivato. Un operatore può abilitarlo nella
configurazione del server. Vedi il [riferimento dei moduli](help:modules-reference).

## Perché mi manca un pulsante? {#button-missing}

Studio nasconde le azioni che le tue autorizzazioni non consentono, e alcune azioni dipendono dalla
modalità del server (per esempio **Nuovo prodotto** esiste solo in modalità multiprodotto). Cerca
l'autorizzazione nel [riferimento delle autorizzazioni](help:permissions-reference).

## Perché sono stato disconnesso? {#signed-out}

Le sessioni terminano dopo una durata massima, dopo un periodo di inattività, quando vengono
revocate, quando il tuo account viene disattivato e quando la tua password è stata cambiata in
un'altra sessione. Accedi di nuovo; Studio ti riporta alla pagina in cui eri. Vedi
[Sicurezza](help:security#sessions).

## Posso pagare o salvare una carta di credito in Studio? {#payment}

No. Studio non chiede mai dati di carte o conti bancari. I piani a pagamento passano dalla pagina
di checkout ospitata dal provider di pagamento. Vedi [Piani e abbonamenti](help:plans-subscriptions).

## Posso modificare i record in Studio? {#edit-records}

Sì, con l'autorizzazione `records:write` in quel tenant. Il salvataggio sostituisce l'intero
oggetto JSON del record. Vedi [Record](help:records).

## Perché gli orari delle pianificazioni sono diversi da quelli che ho inserito? {#utc}

Le pianificazioni vengono eseguite in UTC (senza ora legale). Studio mostra l'esecuzione successiva
e l'ultima nel tuo fuso orario. Vedi [Pianificazioni](help:schedules).

## Dove modifico la configurazione del server? {#server-config}

Non in Studio. La pagina **Impostazioni** mostra la configurazione effettiva; le modifiche le fa un
operatore sul server. Vedi [Impostazioni](help:settings) e
[configurazione del server](help:server-configuration).

## Perché alcuni testi sono in inglese anche se uso un'altra lingua? {#english-texts}

Le descrizioni dei ruoli e delle autorizzazioni predefiniti e il **Messaggio del server** nei
dettagli degli errori provengono dal server e sono sempre in inglese. Tutto il resto in Studio è
tradotto.

## Come segnalo un problema? {#report-problem}

Apri **Dettagli tecnici** nel messaggio di errore e copia l'**ID richiesta** (`req_…`). Invialo al
tuo operatore insieme all'orario e a cosa stavi facendo. Vedi
[l'ID richiesta](help:troubleshooting#request-id).

## Studio funziona su un telefono? {#mobile}

Sì. Sugli schermi stretti la barra laterale diventa un pannello a scomparsa dietro **Apri
navigazione**, e le colonne meno importanti delle tabelle vengono nascoste. Vedi
[Tastiera e accessibilità](help:keyboard-accessibility#zoom).

## Posso usare Studio solo con la tastiera o con uno screen reader? {#accessibility}

Sì. Ogni funzione si può usare con la tastiera, e Studio è progettato per soddisfare le WCAG 2.1 AA.
Vedi [Tastiera e accessibilità](help:keyboard-accessibility).
