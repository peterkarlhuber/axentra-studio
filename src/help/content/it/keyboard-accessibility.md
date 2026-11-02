---
title: Tastiera e accessibilità
summary: Come usare Studio con la tastiera, uno screen reader, lo zoom, il movimento ridotto e il tema chiaro o scuro, e quali lacune sono note.
keywords: accessibilità, a11y, tastiera, scorciatoie, tasti, tab, focus, screen reader, lettore di schermo, NVDA, JAWS, VoiceOver, zoom, ingrandimento, contrasto, modalità scura, tema scuro, modalità chiara, tema, movimento ridotto, WCAG
---

Studio è progettato per soddisfare le WCAG 2.1 di livello AA. Ogni funzione si può usare con la
tastiera, la struttura delle pagine viene annunciata correttamente dagli screen reader e Studio
segue le impostazioni di sistema per lo schema di colori e il movimento. Ogni release viene
verificata automaticamente con il motore di accessibilità axe-core su ogni pagina, nel tema chiaro e
in quello scuro, su uno schermo desktop e sullo schermo di un telefono largo 360 pixel.

## Uso della tastiera {#keyboard}

| Tasto                                           | Cosa fa                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Tab** / **Maiusc+Tab**                        | Passa al controllo successivo o precedente.                                                                |
| **Tab** subito dopo il caricamento della pagina | Raggiunge per primo **Vai al contenuto principale**; **Invio** salta la navigazione.                       |
| **Invio**                                       | Segue un link, preme un pulsante, invia un modulo.                                                         |
| **Spazio**                                      | Preme un pulsante, seleziona una casella di controllo, attiva o disattiva un interruttore.                 |
| **Tasti freccia**                               | Si spostano all'interno di menu, elenchi di selezione e schede; **Invio** o **Spazio** sceglie.            |
| **Esc**                                         | Chiude una finestra di dialogo, un pannello, un menu, un suggerimento informativo o la navigazione mobile. |
| **F8**                                          | Salta all'area delle notifiche (i messaggi nell'angolo dello schermo).                                     |
| **Invio** in un campo **Tipi di evento**        | Aggiunge all'elenco il tipo di evento digitato.                                                            |

Buono a sapersi:

- **Le finestre di dialogo mantengono il focus al loro interno** mentre sono aperte e, alla
  chiusura, lo restituiscono al pulsante che le ha aperte.
- **Le finestre di dialogo con segreti mostrati una sola volta non si chiudono con Esc.** I segreti
  delle chiavi API e dei webhook vengono mostrati una sola volta, quindi la finestra resta aperta
  finché non confermi **Ho conservato il segreto in modo sicuro**. Così eviti di perdere un segreto
  per sbaglio.
- **Le azioni pericolose** chiedono una conferma; alcune, come la revoca di una chiave API, ti
  chiedono anche di digitare un nome (**Digita … per confermare**). Questo protegge da pressioni
  accidentali dei tasti.
- **I suggerimenti informativi** (i piccoli pulsanti (i) accanto alle etichette) si aprono con
  **Invio** o **Spazio** e si chiudono con **Esc**. Funzionano con tastiera, touch e screen reader,
  non solo al passaggio del mouse.
- **Le tabelle** con molte colonne scorrono all'interno di un'area propria con un'etichetta. Porta
  il focus sull'area con **Tab** e scorrila con i tasti freccia.

## Focus {#focus}

Il controllo che ha il focus della tastiera mostra sempre un anello visibile (viola, con un
contrasto di almeno 3:1 rispetto allo sfondo). Quando apri un'altra pagina, Studio sposta il focus
sul titolo principale della pagina, così parti dal nuovo contenuto e gli screen reader annunciano la
nuova pagina.

## Screen reader {#screen-readers}

- **Punti di riferimento (landmark):** ogni pagina ha un'intestazione, la navigazione principale e
  il contenuto principale, e un solo titolo principale.
- **Il percorso di navigazione (breadcrumb)** e la **Navigazione principale** hanno un'etichetta.
  Le aree della barra laterale dei moduli disattivati vengono annunciate come “modulo non
  abilitato”.
- **Moduli:** ogni campo ha un'etichetta visibile; i campi obbligatori vengono annunciati; i
  messaggi di errore sono collegati al rispettivo campo.
- **Le tabelle** hanno didascalie e intestazioni di colonna, e le colonne ordinabili annunciano la
  direzione di ordinamento. Il conteggio “N voci visualizzate” viene annunciato quando si caricano
  altre righe.
- **I messaggi di stato** (copiato negli appunti, caricamento, notifiche) vengono annunciati tramite
  aree live. Le notifiche di errore vengono annunciate immediatamente.
- **I grafici** hanno un riepilogo testuale, e **Mostra tabella dati** visualizza gli stessi valori
  come tabella.
- **Le anteprime delle email** vengono mostrate in un riquadro isolato (sandbox); il loro contenuto
  testuale si legge normalmente.

## Zoom e dimensione del testo {#zoom}

Puoi ingrandire il browser fino al 200 % senza perdere contenuti o funzioni. Nelle finestre strette
(e quando ingrandisci) il layout si adatta:

| Larghezza della finestra | Layout                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 1200 px e oltre          | Barra laterale completa, pagine a più colonne                                                                  |
| Da 960 a 1199 px         | Barra laterale completa o compressa                                                                            |
| Sotto 960 px             | La barra laterale diventa un pannello a scomparsa che si apre con **Apri navigazione**                         |
| Sotto 640 px             | Le colonne meno importanti delle tabelle vengono nascoste, le azioni della pagina vanno a capo sotto il titolo |

I pulsanti standard sono alti almeno 36 pixel e quelli grandi 44 pixel; alcuni pulsanti compatti in
tabelle e barre degli strumenti sono più piccoli. Su desktop puoi ridurre la barra laterale alle
sole icone con **Comprimi barra laterale**; Studio ricorda questa scelta per ogni browser.

## Movimento ridotto {#reduced-motion}

Se il tuo sistema operativo chiede alle app di ridurre il movimento, Studio disattiva animazioni e
transizioni (per esempio per finestre di dialogo, menu e indicatori di caricamento).

## Tema chiaro, scuro e di sistema {#themes}

Apri il menu utente (il tuo nome nella barra superiore) e scegli **Tema**: **Chiaro**, **Scuro** o
**Sistema** (segue il tuo sistema operativo). Entrambi i temi sono verificati per un contrasto
sufficiente. La tua scelta viene salvata nel browser e nel tuo profilo; un browser in cui non hai
ancora scelto un tema adotta quello del tuo profilo dopo l'accesso.

## Lingua {#language}

Scegli la lingua nel menu utente in **Lingua**, oppure nella pagina di accesso. Quando hai
effettuato l'accesso, la scelta viene salvata nel tuo profilo. Date, orari e numeri seguono la
lingua selezionata. Alcuni testi provengono dal server e restano in inglese, per esempio le
descrizioni dei ruoli e delle autorizzazioni predefiniti e il **Messaggio del server** nei dettagli
degli errori.

## Lacune note {#known-gaps}

- **I controlli automatici coprono la prima visualizzazione di ogni pagina.** Finestre di dialogo
  aperte, menu, pannelli, notifiche ed errori dei moduli vengono controllati solo in alcune aree.
- **Viene testato automaticamente solo Chromium.** Firefox e Safari (WebKit) non sono coperti dai
  test automatici.
- **La modalità a contrasto elevato di Windows** (colori forzati) non viene testata in modo
  specifico.
- **I grafici sono pensati per il puntatore.** Passando sopra un punto ne vedi i dettagli; chi usa
  la tastiera o uno screen reader ottiene gli stessi valori tramite **Mostra tabella dati**.
- **I testi del server**, come le descrizioni delle autorizzazioni e i messaggi del server, sono
  solo in inglese.

Se trovi una barriera, segnalala al tuo operatore indicando l'indirizzo della pagina e i passaggi
che ti hanno portato al problema.

## Risoluzione dei problemi {#troubleshooting}

| Situazione                                       | Cosa fare                                                                                                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L'anello del focus non è visibile                | Usa **Tab** (l'anello compare con il focus da tastiera, non con i clic del mouse). Controlla che nessuna estensione del browser sovrascriva gli stili della pagina.                          |
| Una finestra di dialogo non si chiude con Esc    | Mostra un segreto visibile una sola volta. Copialo e conservalo, poi conferma **Ho conservato il segreto in modo sicuro**.                                                                   |
| Le animazioni continuano a essere riprodotte     | Attiva “riduci movimento” nelle impostazioni di accessibilità del tuo sistema operativo e ricarica Studio.                                                                                   |
| Il tema torna indietro                           | Lo storage del browser potrebbe essere bloccato (per esempio in modalità privata), quindi la scelta non viene memorizzata localmente; Studio ricorre allora al tema salvato nel tuo profilo. |
| Il contenuto viene tagliato con uno zoom elevato | Le tabelle larghe scorrono all'interno della propria area; porta il focus su di essa con **Tab** e usa i tasti freccia.                                                                      |
