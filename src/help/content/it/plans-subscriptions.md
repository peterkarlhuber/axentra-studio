---
title: Piani e abbonamenti
summary: Crea piani con prezzi e diritti d'uso, abbona i tenant, gestisci i loro abbonamenti e scopri come funziona il provider di pagamento.
keywords: fatturazione, piano, listino, prezzo, livello, abbonamento, diritto d'uso, funzionalità, feature flag, limite, prova, annullare, pagamento scaduto, Stripe, checkout, provider di pagamento, fatturazione manuale
---

Un **piano** descrive cosa ottiene un tenant: i suoi prezzi, la durata della prova e i suoi
**diritti d'uso** (funzionalità attive o disattive e limiti di utilizzo per contatore). Un
**abbonamento** collega un tenant a un piano e ha uno stato, per esempio **In prova**, **Attivo** o
**Pagamento scaduto**. Il tuo prodotto chiede ad Axentra i diritti d'uso effettivi di un tenant per
decidere cosa il tenant può fare; il modulo di utilizzo ne ricava le quote predefinite. Gli
operatori del prodotto usano queste schermate per configurare i piani e assistere i clienti con i
loro abbonamenti.

> [!IMPORTANT]
> Queste schermate richiedono il modulo `billing` sul server; senza di esso, **Piani** e
> **Abbonamenti** non vengono mostrati. **Piani** e **Abbonamenti** richiedono `billing:read`
> tramite un ruolo di prodotto; la pagina di fatturazione di un tenant richiede `billing:read` in
> quel tenant. Ogni modifica richiede `billing:manage`. Vedi [Ruoli e autorizzazioni](help:roles-permissions).

> [!CAUTION]
> Studio non chiede mai dati di carte o conti bancari, e Axentra non ne memorizza nessuno. I dati
> di pagamento si inseriscono solo nella pagina di checkout ospitata dal provider di pagamento.
> Fatture, imposte, ricevute e rimborsi sono gestiti dal provider e dall'operatore, non da Axentra.

## Creare un piano {#create-plan}

1. Apri [Piani](app:plans) (gruppo **Utilizzo e fatturazione**) e scegli **Nuovo piano**.
2. Inserisci un **Nome** e una **Chiave**, per esempio `pro`. La chiave non si può cambiare in
   seguito; il tuo prodotto e l'API fanno riferimento al piano tramite essa.
3. Facoltativo: **Descrizione** e **Giorni di prova** (da 0 a 365). I nuovi abbonamenti a un piano
   con giorni di prova iniziano in **In prova**.
4. Lascia attivo **Attivo**, così il piano può essere scelto per nuovi abbonamenti.
5. In **Prezzi**, scegli **Aggiungi prezzo** per ogni prezzo (vedi [Prezzi](help:plans-subscriptions#prices)).
   Senza prezzi il piano è gratuito.
6. In **Diritti d'uso**, aggiungi funzionalità e limiti (vedi
   [Diritti d'uso](help:plans-subscriptions#entitlements)).
7. Scegli **Crea piano**.

### Impostazioni del piano {#plan-settings}

| Impostazione        | Cosa fa                                                                          | Valori consentiti / predefinito                                                                               |
| ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Nome**            | Nome visualizzato                                                                | Da 1 a 200 caratteri; obbligatorio                                                                            |
| **Chiave**          | Identificatore del piano                                                         | Lettere minuscole, cifre, `_` e `-`, deve iniziare con una lettera, al massimo 63 caratteri; non modificabile |
| **Descrizione**     | Testo libero                                                                     | Al massimo 2000 caratteri                                                                                     |
| **Giorni di prova** | Durata della prova dei nuovi abbonamenti                                         | Da 0 a 365; predefinito 0 (nessuna prova)                                                                     |
| **Attivo**          | Solo i piani attivi possono essere scelti per nuovi abbonamenti e cambi di piano | Attivo per impostazione predefinita                                                                           |
| **Prezzi**          | Importo, valuta, intervallo e ID prezzo del provider                             | Al massimo 20 per piano                                                                                       |
| **Diritti d'uso**   | Funzionalità e limiti                                                            | Al massimo 200 voci                                                                                           |

### Prezzi {#prices}

Ogni prezzo ha un **Importo**, una **Valuta**, un **Intervallo** e un **ID prezzo del provider**
facoltativo.

- Inserisci l'importo nella normale unità di valuta, per esempio `19.90`. Axentra lo memorizza come
  intero nelle unità minori (centesimi); Studio mostra il valore memorizzato sotto il campo
  ("Memorizzato come 1990 unità minori"). Le valute senza unità minori (come JPY) accettano numeri
  interi.
- **Valuta** è un codice ISO 4217 di tre lettere, come `EUR` o `USD`.
- **Intervallo**: **mese** o **anno**. Stabilisce anche la durata del periodo di fatturazione
  dell'abbonamento.
- **ID prezzo del provider**: con Stripe, l'id del prezzo che hai creato in Stripe (lettere, cifre
  e `_`, per esempio `price_1EXAMPLE`). Axentra lo usa per ricondurre al piano gli aggiornamenti di
  Stripe.

Un piano senza prezzi, o solo con prezzi pari a zero, è **Gratuito**. Un piano può avere più prezzi
(per esempio mensile e annuale); in quel caso ne scegli uno quando abboni un tenant. Gli abbonamenti
esistenti conservano una copia del prezzo con cui sono stati avviati, quindi le successive
modifiche ai prezzi non li riguardano.

### Diritti d'uso {#entitlements}

I diritti d'uso sono un elenco piatto di chiavi. Nell'editor, scegli il **Tipo** di ogni riga:

| Tipo             | Memorizzato come                                   | Valore                                                      |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| **Funzionalità** | `feature.<name>`, per esempio `feature.sso`        | **Attivata** sì o no                                        |
| **Limite**       | `limit.<meter key>`, per esempio `limit.api_calls` | Un numero maggiore o uguale a 0; vuoto significa illimitato |

I nomi usano lettere minuscole, cifre, `_` e `.`, e devono iniziare con una lettera. Un **Limite**
imposta la quota del contatore di utilizzo con quella chiave per ogni periodo di azzeramento;
quando il modulo `usage` è leggibile, Studio suggerisce le chiavi dei contatori esistenti. Un
limite per una chiave senza contatore non ha effetto. I limiti del piano usano l'applicazione del
contatore (rigida o flessibile). Vedi [Utilizzo e quote](help:usage#limit-source).

Il significato di una funzionalità come `feature.sso` lo decide il tuo prodotto: Axentra si limita a
memorizzarla e restituirla.

## Modificare, disattivare o eliminare un piano {#edit-plan}

Nel menu delle azioni della riga (**Azioni per il piano …**):

- **Modifica** cambia tutto tranne la chiave. I diritti d'uso modificati valgono subito per ogni
  tenant del piano. I prezzi modificati valgono solo per i nuovi abbonamenti.
- **Disattiva** nasconde il piano per i nuovi abbonamenti e i cambi di piano. Gli abbonamenti
  esistenti continuano. **Attiva** annulla l'operazione.
- **Elimina piano** rimuove un piano che nessun abbonamento usa; confermi digitando la chiave del
  piano. I piani in uso (anche da abbonamenti annullati) non si possono eliminare; disattivali invece.

## Panoramica degli abbonamenti {#subscriptions}

[Abbonamenti](app:subscriptions) elenca gli abbonamenti di tutti i tenant, dal più recente, con
**Tenant**, **Piano**, **Stato**, **Prezzo**, **Fine periodo**, **Fine prova** e **Provider**.
Filtra per **Stato** e **Piano**. Seleziona un tenant per aprire la sua pagina di fatturazione.

Per aprire un tenant che non ha ancora un abbonamento, sceglilo in **Fatturazione di un tenant** e
seleziona **Apri**.

### Stati dell'abbonamento {#status}

| Stato                 | Significato                                      | Diritti d'uso validi |
| --------------------- | ------------------------------------------------ | -------------------- |
| **Incompleto**        | In attesa del checkout presso il provider        | No                   |
| **In prova**          | I giorni di prova sono in corso                  | Sì                   |
| **Attivo**            | Abbonamento in corso                             | Sì                   |
| **Pagamento scaduto** | Il pagamento è in ritardo; periodo di tolleranza | Sì                   |
| **Annullato**         | Concluso; definitivo                             | No                   |

Transizioni consentite: Incompleto → In prova, Attivo o Annullato; In prova → Attivo, Pagamento
scaduto o Annullato; Attivo → Pagamento scaduto o Annullato; Pagamento scaduto → Attivo o
Annullato. Un abbonamento annullato non può essere riattivato: abbona di nuovo il tenant.

## Abbonare un tenant {#subscribe}

1. Apri la pagina di fatturazione del tenant (da **Abbonamenti** o da **Fatturazione di un tenant**).
2. In **Abbonamento**, scegli **Abbona a un piano**.
3. Scegli il piano in **Scegli un piano** e il **Prezzo**, se il piano ne ha più di uno.
4. Scegli **Abbona**.

Cosa succede dipende dal piano e dal provider di pagamento:

- I **piani gratuiti**, e qualsiasi piano con il provider **Manuale**, partono subito in **In
  prova** (se il piano ha giorni di prova) o **Attivo**.
- I **piani a pagamento con il provider di test o con Stripe** richiedono un checkout. Il pulsante
  diventa **Avvia checkout**. Studio crea una sessione di checkout e mostra **Apri pagina di
  checkout**, che apre la pagina ospitata dal provider in una nuova scheda. L'abbonamento resta
  **Incompleto** finché il provider non conferma il pagamento tramite il suo webhook.
- Quando i **Pagamenti reali** sono attivi, Studio non avvia checkout con denaro reale. Usa il
  flusso di checkout del tuo prodotto.

Un tenant ha al massimo un abbonamento corrente (non annullato).

## Cambiare il piano {#change-plan}

**Cambia piano** passa il tenant a un altro piano attivo (o a un altro prezzo dello stesso piano).
Non c'è calcolo pro rata: Axentra non calcola crediti né addebiti aggiuntivi. I diritti d'uso del
nuovo piano valgono subito.

- Gli abbonamenti Stripe si cambiano in Stripe (per esempio nel portale clienti di Stripe); il
  webhook aggiorna poi Axentra. Per questi abbonamenti Studio nasconde **Cambia piano**.
- Un abbonamento creato senza pagamento (manuale) non può passare a un piano a pagamento mentre è
  configurato un provider reale; annullalo e abbona di nuovo il tenant con un checkout.
- Gli abbonamenti **Incompleto** non possono cambiare piano; completa o riavvia il checkout.

## Annullare o riprendere {#cancel}

- **Annulla a fine periodo**: l'abbonamento resta utilizzabile fino alla fine del periodo corrente,
  poi termina. **Riprendi** ritira l'annullamento programmato.
- **Annulla ora**: l'abbonamento termina subito e i suoi diritti d'uso cessano. Confermi digitando
  la chiave del piano. L'operazione è irreversibile.

Per gli abbonamenti Stripe, Axentra trasmette prima l'annullamento a Stripe.

> [!IMPORTANT]
> Con il provider **Manuale**, le prove terminano, i periodi avanzano e l'annullamento a fine
> periodo ha effetto solo quando l'operatore esegue l'attività di fatturazione pianificata
> (`advance_periods`, per esempio ogni ora). Se le prove non terminano mai, chiedi al tuo operatore
> di pianificarla.

## Impostare lo stato (provider manuale) {#set-status}

Con il provider **Manuale** riscuoti il pagamento al di fuori di Axentra e registri il risultato.
Scegli **Imposta stato**, poi il **Nuovo stato**: per esempio **Pagamento scaduto** quando una
fattura non è pagata, oppure **Attivo** quando è stata pagata. Vengono proposte solo le transizioni
consentite. Impostare **Attivo** durante una prova termina subito la prova. Gli abbonamenti di altri
provider ricevono il loro stato dai webhook del provider.

## Diritti d'uso effettivi e override {#overrides}

**Diritti d'uso effettivi** nella pagina di fatturazione del tenant mostra cosa ottiene ora il
tenant: il **Piano** (con il suo stato), **Funzionalità**, **Limiti** e **Override**. Sono i
diritti d'uso del piano mentre l'abbonamento è **In prova**, **Attivo** o **Pagamento scaduto**,
uniti agli override del tenant. Senza un abbonamento di questo tipo il tenant ottiene solo i suoi
override (**Nessun abbonamento con diritti d'uso**).

Per dare a un tenant qualcosa di diverso dal suo piano, scegli **Modifica override**, aggiungi o
modifica righe nello stesso editor usato per i piani e scegli **Salva override**.

> [!WARNING]
> Il salvataggio sostituisce tutti gli override del tenant. Una riga che rimuovi dall'elenco viene
> rimossa dal tenant. Gli override restano quando cambia il piano o termina l'abbonamento.

Per alzare un solo limite di utilizzo, un override della quota nella schermata **Utilizzo** è
spesso più chiaro; vedi [Utilizzo e quote](help:usage#quota-override). **Utilizzo**
nell'intestazione della pagina apre l'utilizzo del tenant.

## Provider di pagamento {#payment-provider}

La scheda **Provider di pagamento** in **Piani** e **Abbonamenti** mostra la configurazione del server:

| Provider            | Comportamento                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manuale**         | Il pagamento viene riscosso al di fuori di Axentra. Gli abbonamenti vengono creati direttamente; un operatore ne imposta lo stato.                |
| **Simulato (fake)** | Provider di test deterministico senza accesso alla rete; i piani a pagamento passano da un checkout simulato. Il server lo rifiuta in produzione. |
| **Stripe**          | I piani a pagamento passano da Stripe Checkout; i webhook di Stripe aggiornano gli abbonamenti.                                                   |

**Pagamenti reali** indica se i pagamenti con denaro reale sono attivi (solo Stripe). **Checkout
da Studio** indica se Studio può avviare un checkout ospitato: solo con il provider di test o con
Stripe con i pagamenti reali disattivati.

Il provider viene scelto dall'operatore nella configurazione del server (`billing.provider`); non
si può cambiare in Studio. La scheda richiede `platform:settings` o `product:manage`; altrimenti
indica che la configurazione non è visibile per te. Vedi [Impostazioni](help:settings) e
[Configurazione del server](help:server-configuration).

## Per sviluppatori {#developers}

- Leggi i diritti d'uso effettivi di un tenant con
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements`
  (`billing:read`). La risposta contiene `features` (nome → true/false), `limits` (chiave del
  contatore → numero, oppure `null` per illimitato), `plan_key`, `subscription_status` e `overrides`.
- Gli acquisti self-service dei tenant passano dal backend del tuo prodotto con una chiave API che
  ha `billing:manage`; non esiste un'autorizzazione di tenant per il checkout self-service.
- Gli indirizzi di ritorno del checkout (`success_url`, `cancel_url`) devono iniziare con l'URL
  pubblico del server o con una delle sue origini consentite. Studio usa l'indirizzo della propria
  pagina.
- Le modifiche agli abbonamenti vengono registrate nell'audit (`billing.subscription.*`) e, quando
  il modulo eventi è abilitato, pubblicate come eventi con lo stesso nome, così un webhook può
  reagire. Vedi [Eventi](help:events).
- I webhook di Stripe vengono verificati tramite firma ed elaborati una sola volta per id evento;
  gli eventi obsoleti vengono ignorati.

## Buono a sapersi {#good-to-know}

- Niente pro rata, coupon, imposte, fatture, quantità di postazioni o prezzi basati sull'utilizzo.
- Nessun endpoint per il portale clienti; i cambi di piano Stripe avvengono in Stripe.
- `past_due` mantiene i diritti d'uso; decidi nel tuo prodotto se limitare qualcosa.
- Vedi [Limitazioni note](help:limitations).

## Risoluzione dei problemi {#troubleshooting}

| Cosa vedi                                                                                             | Perché                                                                                     | Cosa fare                                                                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Nessun accesso alla fatturazione**                                                                  | Il tuo ruolo non ha `billing:read` (a livello di prodotto per **Piani** e **Abbonamenti**) | Chiedi a un amministratore del prodotto un ruolo adatto                                        |
| **Conflitto** durante l'eliminazione di un piano                                                      | Ci sono abbonamenti che usano il piano                                                     | **Disattiva** il piano invece di eliminarlo                                                    |
| **Conflitto** "esiste già un piano con questa chiave"                                                 | Le chiavi dei piani sono univoche per prodotto                                             | Scegli un'altra chiave                                                                         |
| Un piano manca in **Scegli un piano**                                                                 | Il piano è inattivo                                                                        | Attivalo in **Piani**                                                                          |
| **Conflitto** "i piani a pagamento richiedono un checkout …"                                          | Abbonamento a un piano a pagamento con il provider di test o Stripe                        | Usa **Avvia checkout**, oppure il checkout del prodotto quando i pagamenti reali sono attivi   |
| "Questo piano a pagamento richiede un checkout, che qui il server non offre."                         | I pagamenti reali sono attivi, oppure il provider non ti è noto                            | Usa il checkout del tuo prodotto                                                               |
| **Conflitto** "il tenant ha già un abbonamento"                                                       | Esiste già un abbonamento corrente                                                         | Usa **Cambia piano**, oppure annulla prima l'abbonamento                                       |
| **Non disponibile in questa modalità** quando cambi il piano                                          | L'abbonamento è gestito da Stripe                                                          | Cambialo in Stripe                                                                             |
| **Verifica i dati inseriti**: "gli URL di reindirizzamento devono iniziare con un'origine consentita" | L'indirizzo di Studio non è l'URL pubblico del server né un'origine consentita             | Chiedi all'operatore di aggiungere l'origine di Studio a `security.allowed_origins`            |
| L'abbonamento resta **Incompleto**                                                                    | Il checkout non è stato completato, oppure il webhook non raggiunge il server              | Riapri il checkout; chiedi all'operatore di controllare endpoint e segreto del webhook         |
| La prova non termina (manuale)                                                                        | L'attività di fatturazione non è pianificata                                               | Chiedi all'operatore di pianificare `advance_periods`                                          |
| **Modificato nel frattempo**                                                                          | Qualcun altro ha modificato il piano o l'abbonamento                                       | Ricarica e ripeti                                                                              |
| I limiti non valgono dopo l'annullamento                                                              | Gli abbonamenti annullati non concedono diritti d'uso                                      | È il comportamento previsto; vale il valore predefinito del contatore o l'override della quota |
