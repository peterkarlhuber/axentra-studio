---
title: Orientarsi in Studio
summary: La struttura di Studio, la barra laterale, il selettore di prodotto, il menu utente, la dashboard e la guida integrata.
keywords: interfaccia, struttura, layout, navigazione, barra laterale, menu, cassetto, mobile, telefono, smartphone, percorso, breadcrumb, selettore di prodotto, menu utente, lingua, tema, modalità scura, modalità chiara, dashboard, guida, aiuto, suggerimento, ricerca, tastiera
---

Questo articolo mostra come è organizzato Studio, così trovi rapidamente ogni schermata. Tratta la
navigazione, il cambio di prodotto, le impostazioni personali come lingua e tema, la dashboard e la
guida integrata in ogni schermata.

## La struttura {#layout}

Dopo l'accesso, Studio apre la dashboard del prodotto che hai usato per ultimo, oppure l'elenco dei
prodotti se non ne hai ancora nessuno. Ogni schermata è composta da tre parti:

- **Barra laterale** (a sinistra): la navigazione, raggruppata per area.
- **Barra superiore**: a sinistra il **percorso di navigazione** (il percorso fino alla pagina
  corrente, ogni passaggio è cliccabile), a destra il **selettore di prodotto**, il pulsante della
  guida e il **menu utente**.
- **Area dei contenuti**: il titolo della pagina con una descrizione di una riga, l'azione
  principale della pagina a destra (per esempio **Nuovo tenant**) e, sotto, filtri, tabelle, riquadri
  e schede.

## La barra laterale {#sidebar}

La barra laterale elenca le aree in questo ordine:

| Gruppo                      | Voci                                                           |
| --------------------------- | -------------------------------------------------------------- |
| (in alto)                   | **Dashboard**, **Prodotti**                                    |
| **Identità e tenant**       | **Tenant**, **Utenti**, **Inviti**                             |
| **Accesso e chiavi API**    | **Ruoli**, **Autorizzazioni**, **Chiavi API**                  |
| **Dati e archiviazione**    | **Panoramica dati**, **Record**, **File**                      |
| **Eventi e job**            | **Job**, **Pianificazioni**, **Eventi**, **Webhook**           |
| **Utilizzo e fatturazione** | **Utilizzo**, **Piani**, **Abbonamenti**                       |
| (singola)                   | **Notifiche**                                                  |
| **Audit e monitoraggio**    | **Registro di audit**, **Stato del sistema**, **Monitoraggio** |
| (in fondo)                  | **Impostazioni**, **Centro assistenza**                        |

Le voci che appartengono a un prodotto (da **Dashboard** a **Notifiche**, tranne **Prodotti**)
vengono mostrate solo quando è selezionato un prodotto. **Prodotti**, **Registro di audit**,
**Stato del sistema**, **Monitoraggio** e **Impostazioni** valgono per l'intera piattaforma.

La barra laterale mostra le stesse voci a tutti. Se apri una pagina per cui non hai
l'autorizzazione, la pagina te lo segnala (**Non consentito**) e le azioni che non puoi eseguire
non vengono offerte.

### Voci contrassegnate con “Off” {#module-off}

Una voce il cui modulo del server non è abilitato resta visibile e mostra **Off**. Aprendola compare
**Modulo non abilitato su questo server** con l'id del modulo (per esempio `storage`) che
l'operatore del server deve abilitare. In questo modo vedi che cosa esiste e che cosa manca. Vedi
[moduli](help:concepts#modules).

### Comprimere la barra laterale {#collapse-sidebar}

In fondo alla barra laterale, **Comprimi barra laterale** la riduce alle sole icone; **Espandi barra
laterale** riporta le etichette. Nella barra laterale compressa, passa sopra un'icona con il mouse o
portaci il focus per vederne il nome. Studio ricorda la scelta in questo browser. La versione del
server è indicata in fondo alla barra laterale espansa.

### Su telefoni e schermi piccoli {#mobile}

Studio funziona a partire da 360 pixel di larghezza. Sugli schermi stretti la barra laterale diventa
un cassetto: aprilo con **Apri navigazione** (il pulsante del menu in alto a sinistra). Si chiude
quando scegli una pagina, con **Chiudi navigazione** o con Esc. Le tabelle larghe scorrono
all'interno della propria area e le colonne meno importanti possono essere nascoste.

## Cambiare prodotto {#product-switcher}

La maggior parte delle aree appartiene a un prodotto; l'indirizzo contiene allora
`/p/<product id>/`. Il **selettore di prodotto** nella barra superiore mostra il prodotto corrente
(**Prodotto** e il suo nome).

1. Seleziona il selettore di prodotto.
2. Scegli un altro prodotto dall'elenco, oppure **Tutti i prodotti** per aprire l'elenco dei
   prodotti.

Quando cambi prodotto, Studio resta nella stessa area: se stai guardando i tenant del prodotto A,
arrivi ai tenant del prodotto B. Studio ricorda l'ultimo prodotto per ogni browser. I prodotti
archiviati non compaiono nel selettore; aprili da **Prodotti**.

Nelle pagine valide per l'intera piattaforma (per esempio **Registro di audit** o **Impostazioni**)
il selettore può mostrare **Nessun prodotto selezionato**.

In **modalità a prodotto singolo** non c'è alcun menu: la barra superiore mostra un'etichetta fissa
**Prodotto** con il nome dell'unico prodotto del server. Vedi
[modalità a prodotto singolo e multiprodotto](help:concepts#single-multi-product).

## Percorso di navigazione {#breadcrumbs}

Il percorso di navigazione mostra dove ti trovi, per esempio _Tenant › ten_01EXAMPLE_. Scegli un
passaggio precedente per risalire.

## Il menu utente {#user-menu}

Apri il menu utente con le tue iniziali e il tuo nome in alto a destra. Contiene:

| Voce        | Che cosa fa                                                                     |
| ----------- | ------------------------------------------------------------------------------- |
| **Profilo** | Il tuo account: nome, password, sessioni attive. Vedi [profilo](help:profile).  |
| **Lingua**  | La lingua dell'interfaccia. Vedi [sotto](help:interface#language).              |
| **Tema**    | **Chiaro**, **Scuro** o **Sistema**. Vedi [sotto](help:interface#theme).        |
| **Esci**    | Termina la sessione. Vedi [accesso e disconnessione](help:signing-in#sign-out). |

### Lingua {#language}

Scegli **Lingua** nel menu utente e seleziona una lingua. La modifica si applica subito. Viene
salvata in questo browser e nel tuo account, quindi ti segue negli altri browser. Puoi cambiarla
anche in **Impostazioni** oppure, prima dell'accesso, nella pagina di accesso. Se non hai fatto una
scelta, Studio segue la lingua del browser. Date, orari e numeri vengono formattati secondo la lingua
scelta.

> [!NOTE]
> Alcuni testi provengono dal server e sono sempre in inglese: i nomi e le descrizioni dei ruoli
> predefiniti (per esempio “Product admin”, “Owner”), le descrizioni nel catalogo delle
> autorizzazioni e il messaggio del server nei dettagli tecnici di un errore.

### Tema {#theme}

Scegli **Tema** nel menu utente: **Chiaro**, **Scuro** o **Sistema** (segue il tuo sistema
operativo). Come la lingua, il tema viene salvato in questo browser e nel tuo account.

## La dashboard {#dashboard}

La **Dashboard** è la pagina iniziale di un prodotto. Mostra:

- **Contatori**: **Tenant**, **Utenti**, **Chiavi API**, **Eventi di audit (24 h)**, **Record** e
  **Richieste negate (24 h)**. Ogni contatore rimanda alla pagina corrispondente; il suo
  suggerimento (i) spiega esattamente che cosa viene contato. Se il server non restituisce
  contatori, vedi “Il server non ha restituito contatori per questo prodotto.”
- Riquadri di **Utilizzo e fatturazione**, quando questi moduli sono abilitati e puoi leggerli.
- **Stato del sistema**: il risultato del controllo di readiness del server, con **Dettagli**.
- **Server**: **Versione del server**, **Versione API**, **Ambiente**, **Modalità**, **ID prodotto**
  e i **Moduli** con il loro stato (verde: abilitato, grigio: non abilitato).

Azioni rapide in alto a destra: **Nuovo tenant** (con `tenants:create`, modulo `tenancy`) e **Nuova
chiave API** (con `api_keys:manage`).

| Contatore                   | Che cosa viene contato                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| **Tenant**                  | Tutti i tenant del prodotto, attivi e sospesi.                                                   |
| **Utenti**                  | Membri dei tenant e operatori del prodotto, ogni persona una sola volta.                         |
| **Chiavi API**              | Chiavi non revocate, comprese quelle scadute.                                                    |
| **Record**                  | Record in tutte le raccolte e in tutti i tenant.                                                 |
| **Eventi di audit (24 h)**  | Eventi di audit di questo prodotto nelle ultime 24 ore.                                          |
| **Richieste negate (24 h)** | Tentativi rifiutati nelle ultime 24 ore; apre il registro di audit filtrato sugli eventi negati. |

> [!TIP]
> Il riquadro **Server** risponde alla domanda più frequente del supporto: “Quale versione è in
> esecuzione, e il modulo è almeno abilitato?”

## Elenchi e moduli {#lists-forms}

- Gli **elenchi** si caricano pagina per pagina: sotto una tabella, **Carica altro** recupera le voci
  successive e **Tutte le voci caricate** ne segna la fine. Non ci sono numeri di pagina.
- Le **finestre di creazione** aggiungono `?new=1` all'indirizzo, così la finestra sopravvive a un
  ricaricamento e il pulsante Indietro del browser la chiude.
- Gli **slug** (nomi brevi adatti agli URL) vengono ricavati dal nome finché non modifichi tu stesso
  lo slug.
- **Salva modifiche** diventa attivo solo quando qualcosa è cambiato.
- Le **azioni distruttive** chiedono una conferma; per eliminare un tenant devi digitarne lo slug.
- I **segreti** (chiavi API, token di invito) vengono mostrati una sola volta. Una finestra con un
  segreto non si chiude con Esc né facendo clic all'esterno; prima conferma di aver conservato il
  segreto.

## La guida in Studio {#help-center}

Il **Centro assistenza** contiene tutti gli articoli, i tutorial e le pagine di riferimento. Aprilo
dalla barra laterale (**Centro assistenza**), con il pulsante della guida (?) nella barra superiore
(**Guida e documentazione**) oppure dal link nelle pagine di accesso e di configurazione; funziona
anche senza aver eseguito l'accesso.

- **Cerca**: digita nella casella di ricerca («Cerca nella guida, ad esempio “chiave API”»). Studio
  cerca in tutti gli articoli nella tua lingua e ogni risultato apre la sezione corrispondente.
- **Inizia da qui**: gli articoli per i nuovi utenti.
- Gli **articoli** hanno un sommario (**In questa pagina**), **Precedente** e **Successivo**,
  **Argomenti correlati** e un pulsante per copiare un link all'articolo. I link funzionano in ogni
  lingua, e cambiando lingua l'articolo resta aperto.

### La guida in ogni schermata {#contextual-help}

- **Guida della pagina**: il pulsante (?) accanto al titolo di una pagina (**Guida per questa
  pagina**) apre l'articolo di quella pagina in un pannello laterale. Mantieni la tua posizione e un
  modulo che stai compilando resta com'è. I link all'interno del pannello aprono altri articoli
  (**Indietro** torna indietro), **Apri nel centro assistenza** mostra l'articolo completo e
  **Chiudi la guida** chiude il pannello.
- **Suggerimenti informativi**: il pulsante (i) accanto a un campo, a una colonna o a uno stato
  spiega effetti, valori predefiniti e limiti. Si apre con un clic, un tocco, Invio o Spazio e si
  chiude con Esc. **Scopri di più** nel suggerimento apre l'articolo correlato nel pannello
  laterale.
- I link **Scopri di più** nei messaggi, nelle pagine vuote e nelle finestre di conferma portano
  alla sezione che spiega la situazione.

## Nozioni di base sulla tastiera {#keyboard}

Tutto in Studio funziona con la tastiera:

| Tasto                          | Effetto                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Tab / Maiusc+Tab               | Controllo successivo / precedente. Il focus è sempre visibile.                                                   |
| Tab subito dopo il caricamento | Raggiunge **Vai al contenuto principale**; Invio salta la navigazione.                                           |
| Invio / Spazio                 | Attiva pulsanti, link, caselle di controllo, interruttori e suggerimenti informativi.                            |
| Tasti freccia                  | Spostano la selezione nei menu, negli elenchi e tra le schede.                                                   |
| Esc                            | Chiude un menu, una finestra, un suggerimento informativo o la navigazione mobile (non le finestre con segreti). |
| F8                             | Salta all'area delle notifiche (messaggi brevi).                                                                 |

Quando apri un'altra pagina, il focus si sposta sul suo titolo, così gli screen reader annunciano la
nuova pagina. Maggiori dettagli in [tastiera e accessibilità](help:keyboard-accessibility).

## Risoluzione dei problemi {#troubleshooting}

| Situazione                                                         | Causa e soluzione                                                                                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| La barra laterale mostra solo poche voci                           | Nessun prodotto è selezionato. Scegline uno con il selettore di prodotto o in **Prodotti**.                                                     |
| Una voce mostra **Off**                                            | Il modulo del server non è abilitato. Chiedi all'operatore; vedi [moduli](help:concepts#modules).                                               |
| Una pagina indica **Non consentito**                               | I tuoi ruoli non includono l'autorizzazione. Vedi [ruoli e autorizzazioni](help:roles-permissions).                                             |
| **Non ancora disponibile in Studio**                               | Il server ha il modulo, ma questa release di Studio non ha schermate per esso. Usa l'API o una versione più recente di Studio.                  |
| Il selettore di prodotto non elenca un prodotto                    | Il prodotto è archiviato oppure non hai alcun ruolo al suo interno. Apri **Prodotti**.                                                          |
| Lingua o tema diversi tra i browser                                | Una scelta fatta in un browser viene ricordata lì e prevale su quella salvata nel tuo account. Scegli di nuovo nel menu utente di quel browser. |
| Dopo un aggiornamento del server Studio si comporta in modo strano | Ricarica la pagina; Studio controlla la versione del server solo al caricamento.                                                                |
