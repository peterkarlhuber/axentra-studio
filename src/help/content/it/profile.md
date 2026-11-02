---
title: Il tuo profilo
summary: Visualizza il tuo account e le tue appartenenze, cambia il nome visualizzato e la password, e disconnetti i browser che non usi più.
keywords: profilo, account, il mio account, nome visualizzato, nome, password, cambiare password, impostare password, sessioni, dispositivi, esci, disconnetti, disconnetti ovunque, logout, single sign-on, SSO
---

Il tuo **Profilo** è il punto in cui gestisci il tuo account: il nome che vedono gli altri, la tua
password e i browser in cui hai effettuato l'accesso. Mostra anche a quali prodotti appartieni e con
quale ruolo. Ogni utente che ha effettuato l'accesso ha un profilo; non serve alcuna autorizzazione.

Aprilo dal menu utente in alto a destra con **Profilo** ([apri](app:profile)). Lingua e tema si
trovano nella pagina [Impostazioni](help:settings#preferences) e nello stesso menu utente.

## Controllare il tuo account {#account}

Il riquadro **Account** mostra:

| Campo                       | Significato                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Indirizzo email**         | L'indirizzo con cui accedi. Non puoi cambiarlo da solo                                                    |
| **ID utente**               | Il tuo ID (`usr_…`), per esempio per filtrare il [registro di audit](help:audit#filter) per **ID autore** |
| **Ruolo nella piattaforma** | `platform_admin` o `platform_viewer`, se ne hai uno, altrimenti **Nessuno**                               |
| **Prodotti**                | Ogni prodotto a cui appartieni, con il tuo ruolo di prodotto (per esempio **Acme CRM · product_admin**)   |

Le appartenenze ai tenant non sono elencate qui; si trovano nelle pagine dei tenant. Per ottenere un
ruolo diverso, chiedi a un proprietario del prodotto o a un amministratore della piattaforma; vedi
[Ruoli e autorizzazioni](help:roles-permissions).

## Cambiare il nome visualizzato {#name}

1. In **Nome visualizzato**, modifica **Nome** (fino a 200 caratteri).
2. Scegli **Salva modifiche**. Il pulsante è attivo solo quando il nome è diverso da quello salvato.

Il nome compare nel menu utente, negli elenchi dei membri e come **Autore** delle tue azioni nel
registro di audit. Gli eventi di audit passati mantengono il nome che avevi quando sono stati
registrati.

## Cambiare la password {#password}

1. In **Cambia password**, inserisci la **Password attuale**.
2. Inserisci due volte la **Nuova password** (**Ripeti nuova password**).
3. Scegli **Cambia password**.

> [!WARNING]
> Cambiare la password **ti disconnette subito da tutti gli altri browser e dispositivi**. Il
> browser che stai usando resta connesso. Usa questa funzione quando sospetti che qualcun altro
> conosca la tua password.

La nuova password deve

- essere lunga almeno quanto il minimo del server (predefinito 12 caratteri, vedi
  `password_min_length` in [Impostazioni](help:settings#settings-tree)) e al massimo 1024 caratteri,
- essere diversa dal tuo indirizzo email,
- contenere almeno 4 caratteri diversi.

### Impostare una prima password (utenti single sign-on) {#set-password}

Se hai sempre effettuato l'accesso solo tramite single sign-on, il riquadro si chiama **Imposta una
password** e non ha il campo **Password attuale**. Una password ti permette di accedere anche con
email e password.

Per la tua sicurezza, una prima password si può impostare solo **poco dopo l'accesso**
(predefinito: entro 5 minuti; l'operatore lo stabilisce con `security.fresh_login_minutes`). Se il
tuo accesso è meno recente, Studio mostra **Accedi di nuovo**:

1. Scegli **Accedi di nuovo**. Studio ti disconnette e apre la pagina di accesso.
2. Accedi. Torni al tuo profilo.
3. Entro pochi minuti, inserisci due volte la **Nuova password** e scegli **Imposta password**.

> [!NOTE]
> L'operatore può disattivare questa possibilità (`security.first_password = "disabled"`). In tal
> caso gli utenti che accedono tramite single sign-on non possono impostare alcuna password, e il
> server rifiuta con **Non consentito**.

## Vedere dove hai effettuato l'accesso {#sessions}

**Le tue sessioni** elenca ogni browser o dispositivo con una sessione attiva:

| Colonna               | Significato                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Dispositivo**       | Browser e sistema operativo (dallo user agent del browser) e indirizzo IP. **Questa sessione** contrassegna il browser che stai usando |
| **Metodo di accesso** | `password`, oppure `oidc:<provider>` per il single sign-on                                                                             |
| **Ultima attività**   | L'ultima richiesta di quella sessione                                                                                                  |
| **Scadenza**          | Quando termina la sessione al più tardi                                                                                                |

Una sessione termina quando raggiunge la durata massima (predefinito 12 ore), dopo un periodo di
inattività (predefinito 120 minuti), quando esci, quando viene revocata, quando cambi la password
(tutte le altre sessioni) o quando un amministratore disattiva il tuo account.

### Disconnettere un browser che non usi più {#revoke-session}

1. Trova il browser in **Le tue sessioni**.
2. Scegli **Revoca sessione** (l'icona del cestino alla fine della riga).

Quel browser viene disconnesso alla sua richiesta successiva. La sessione corrente non ha un
pulsante di revoca; per quella usa **Esci** nel menu utente.

### Disconnettere tutte le altre sessioni {#sign-out-elsewhere}

Per terminare tutte le sessioni tranne quella che stai usando, scegli **Disconnetti tutte le altre
sessioni** nell'intestazione di **Le tue sessioni**. Il pulsante compare quando esiste almeno
un'altra sessione.

La tua sessione attuale non viene mai disconnessa. Ogni altra sessione viene disconnessa
separatamente; se alcune non possono esserlo (ad esempio per il limite di richieste), Studio ti dice
quante, l'elenco mostra quelle ancora attive e puoi scegliere di nuovo il pulsante.

> [!TIP]
> Hai effettuato l'accesso su un computer condiviso o smarrito? Revoca qui quella sessione. Se
> pensi che qualcun altro conosca la tua password, cambiala: in questo modo disconnetti anche tutte
> le altre sessioni.

Gli amministratori possono terminare le sessioni di altri utenti nella pagina [Utenti](help:users).

## Risoluzione dei problemi {#troubleshooting}

- **Non consentito** dopo **Cambia password**: la **Password attuale** è errata. Il server registra
  il tentativo come **Negato** nel registro di audit.
- **Verifica i dati inseriti**: la nuova password viola una delle regole indicate sopra (troppo
  corta, uguale al tuo indirizzo email, troppo semplice). I **Dettagli tecnici** del messaggio
  riportano il motivo indicato dal server, per esempio “the password must have at least 12 characters”.
- **Le nuove password non coincidono.**: **Nuova password** e **Ripeti nuova password** sono diverse.
- **Accedi di nuovo** durante l'impostazione di una prima password: il tuo accesso è troppo vecchio.
  Segui i passaggi in [Impostare una prima password](#set-password).
- **Non consentito** durante l'impostazione di una prima password: il server non consente password
  per gli utenti single sign-on, oppure il tuo account non ha un indirizzo email. Continua ad
  accedere tramite single sign-on.
- Sei stato disconnesso inaspettatamente: la sessione è scaduta, è rimasta inattiva troppo a lungo o
  è stata revocata (per esempio perché hai cambiato la password altrove). Accedi di nuovo; Studio ti
  riporta alla pagina in cui eri.
