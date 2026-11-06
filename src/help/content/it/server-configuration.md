---
title: Configurazione del server per Studio
summary: Cosa configurano gli operatori perché Studio funzioni - l'indirizzo dell'API in config.json, le origini consentite, i moduli, la modalità a prodotto singolo o multiprodotto e la verifica della versione.
keywords: operatore, amministratore, distribuzione, deployment, installazione, configurazione, config.json, apiBaseUrl, reverse proxy, CORS, origini consentite, stesso sito, same-site, moduli, abilitare modulo, prodotto singolo, multiprodotto, modalità, compatibilità, versione, Docker, backup, ripristino, osservabilità
---

Questo articolo è rivolto a chi gestisce Axentra e Studio. Tratta solo ciò che conta per Studio:
come Studio trova l'API, cosa deve consentire l'API, come i moduli e la modalità di distribuzione
cambiano ciò che Studio mostra, e come Studio verifica di essere compatibile con la versione del
server. La configurazione completa del server è documentata nel repository del backend (vedi
[Per approfondire](#further-reading)).

Studio è un'app web statica. Non ha server, database o segreti propri; tutto ciò che mostra
proviene dall'API di Axentra, e ogni decisione sulle autorizzazioni la prende l'API.

```diagram
architecture
```

## Indicare a Studio dove si trova l'API: config.json {#studio-config}

All'avvio, Studio carica `/config.json` dal proprio indirizzo, prima di ogni altra cosa. Per questo
una stessa build funziona in ogni ambiente.

```json
{ "apiBaseUrl": "" }
```

| `apiBaseUrl`                | Significato                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `""` (predefinito)          | **Stessa origine** (consigliato): un reverse proxy serve Studio e inoltra `/v1` (e `/metrics`) all'API sullo stesso indirizzo |
| `"https://api.example.com"` | L'API si trova su un altro indirizzo. Indica solo l'origine; una `/` o un `/v1` finali vengono rimossi                        |

Se `/config.json` manca o non è valido, Studio usa la stessa origine.

Con l'immagine container di Studio non devi scrivere il file da solo:

| Variabile                 | Effetto                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AXENTRA_API_URL`         | Il container inoltra `/v1` e `/metrics` a questo indirizzo dell'API (configurazione a stessa origine)                                                                          |
| `AXENTRA_PUBLIC_API_URL`  | Scritto in `config.json` come `apiBaseUrl` e consentito nella Content-Security-Policy (indirizzo dell'API separato)                                                            |
| `AXENTRA_CSP_CONNECT_SRC` | Origini `https://` aggiuntive a cui Studio può connettersi, separate da spazi (`https://host` o `https://host:porta`); qualsiasi altro valore interrompe l'avvio del container |
| `AXENTRA_TLS_TERMINATED`  | `true` quando gli utenti raggiungono Studio tramite HTTPS (TLS terminato davanti al container): aggiunge `Strict-Transport-Security`. Predefinito `false`                      |

## Fare in modo che l'API accetti Studio {#allowed-origins}

L'API rifiuta le richieste del browser con sessione attiva provenienti da origini sconosciute.
Configura sul server Axentra:

- `security.allowed_origins`: aggiungi l'indirizzo pubblico di Studio, per esempio
  `["https://studio.example.com"]`, a meno che Studio non giri sul `public_url` dell'API stessa. In
  produzione vengono accettate solo origini `https://` esplicite; `*` non è mai consentito.
- `security.public_url`: l'indirizzo esterno `https://` dell'API. Abilita i cookie sicuri.
- `security.trusted_proxies`: i proxy davanti all'API, in modo che l'IP del client nel registro di
  audit e nei limiti di frequenza sia quello dell'utente e non quello del proxy.

> [!WARNING]
> Con un indirizzo dell'API separato, Studio e l'API devono trovarsi sullo **stesso sito** (per
> esempio `studio.example.com` e `api.example.com`). Il cookie di sessione è `SameSite=Lax`, quindi
> con una configurazione cross-site non è possibile accedere. La stessa origine è la configurazione
> testata e consigliata.

Per il single sign-on, il provider di identità torna a un indirizzo assoluto di Studio, che l'API
deve accettare come destinazione di reindirizzamento.

## Abilitare i moduli {#modules}

L'impostazione del server `modules` decide quali parti di Axentra sono in esecuzione. I moduli
`identity`, `tenancy`, `access` e `audit` sono sempre attivi. Gli altri sono facoltativi:

| Modulo               | Sezioni di Studio                                         |
| -------------------- | --------------------------------------------------------- |
| `data`               | **Panoramica dati**, **Record**                           |
| `storage`            | **File**                                                  |
| `events`             | **Job**, **Pianificazioni**, **Eventi**, **Webhook**      |
| `usage`              | **Utilizzo**                                              |
| `billing`            | **Piani**, **Abbonamenti**                                |
| `notify`             | **Notifiche**                                             |
| `search`, `realtime` | Nessuna schermata in Studio; disponibili solo tramite API |

Studio legge l'elenco dei moduli da `GET /v1/meta` una sola volta, al caricamento:

- Una sezione il cui modulo è disattivato resta nella barra laterale, contrassegnata con **Off**, e
  apre **Modulo non abilitato su questo server**.
- Un modulo attivo ma senza schermate in questa release di Studio mostra **Non ancora disponibile
  in Studio**.

Per cambiare i moduli, modifica la configurazione del server (per esempio
`modules = ["identity", "tenancy", "access", "audit", "data", "storage", "events"]` o la variabile
d'ambiente `AXENTRA__MODULES`), riavvia l'API, poi ricarica Studio. L'elenco attivo è mostrato
sotto `modules` nella pagina [Impostazioni](help:settings#settings-tree). Vedi
[Riferimento dei moduli](help:modules-reference).

> [!NOTE]
> Disattivare un modulo ne smonta gli endpoint; i suoi dati restano nel database e tornano
> disponibili quando riattivi il modulo.

## Distribuzione a prodotto singolo o multiprodotto {#deployment-modes}

Il `mode` del server decide quanti prodotti serve. Studio lo legge da `GET /v1/meta`.

|                                               | `single` (predefinito del server)                                                 | `multi`                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Prodotti                                      | Esattamente uno, creato al primo avvio dalla sezione `[product]` (`slug`, `name`) | Un numero qualsiasi, creati dagli amministratori della piattaforma |
| Pagina iniziale                               | La dashboard del prodotto                                                         | L'ultimo prodotto usato, altrimenti l'elenco dei prodotti          |
| Barra superiore                               | Il nome del prodotto, senza selettore                                             | Selettore di prodotto                                              |
| **Nuovo prodotto**, archiviazione, ripristino | Non proposti (l'API risponde `409 mode_not_supported`)                            | Con `products:create` / `products:archive`                         |
| ID prodotto sconosciuto nell'indirizzo        | Reindirizzamento alla stessa sezione dell'unico prodotto                          | **Non trovato**                                                    |

Tutto il resto (tenant, utenti, ruoli, dati, audit) funziona allo stesso modo in entrambe le
modalità. Gli account utente appartengono all'installazione in entrambe le modalità. Passare
un'installazione da `single` a `multi` è una modifica della configurazione, senza migrazione dei
dati.

## Verifica di compatibilità tra Studio e l'API {#compatibility}

Ogni build di Studio dichiara la versione dell'API di cui ha bisogno (**Versione API richiesta**,
attualmente `1.0`). All'avvio, Studio legge `api_version` da `GET /v1/meta`:

| Versione API del server                                           | Risultato                                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Stessa major, minor uguale o superiore (per esempio `1.0`, `1.3`) | Studio si avvia                                                                         |
| Minor inferiore (per esempio server `1.0`, Studio richiede `1.2`) | **Versione del server incompatibile**: aggiorna il server o usa uno Studio meno recente |
| Major diversa (per esempio `2.0`)                                 | **Versione del server incompatibile**: usa una release di Studio per quella major       |
| Non leggibile                                                     | **Versione del server incompatibile** con il valore grezzo                              |

In caso di rifiuto non viene caricato nient'altro, così un server non adatto non riceve mai
scritture da Studio. Entrambe le versioni sono mostrate in
[Stato del sistema](help:health-monitoring#versions). Le combinazioni testate insieme sono elencate
nel file `docs/COMPATIBILITY.md` di Studio.

> [!TIP]
> Dopo aver aggiornato il server, ricarica le schede di Studio aperte: la verifica viene eseguita
> solo quando Studio si carica.

Se invece Studio mostra **Impossibile connettersi ad Axentra**, non è riuscito a caricare
`GET /v1/meta`; vedi [Risoluzione dei problemi](#troubleshooting).

## Impostazioni del server che cambiano ciò che vedono gli utenti {#user-visible-settings}

| Impostazione del server                               | Effetto in Studio                                                                                                                                                                     | Predefinito                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `security.password_login`                             | Modulo di accesso con password nella pagina di accesso                                                                                                                                | attivo                                        |
| Provider `[[oidc]]`                                   | Pulsanti di single sign-on nella pagina di accesso                                                                                                                                    | nessuno                                       |
| `security.session_ttl_hours` / `session_idle_minutes` | Quando gli utenti devono accedere di nuovo                                                                                                                                            | 12 h / 120 min                                |
| `security.password_min_length`                        | Lunghezza minima delle nuove password                                                                                                                                                 | 12                                            |
| `security.first_password` / `fresh_login_minutes`     | Se e con quanta rapidità gli utenti single sign-on possono impostare una password nel loro [profilo](help:profile#set-password)                                                       | consentito entro 5 min                        |
| `security.max_body_bytes`, `storage.max_file_bytes`   | Richiesta e caricamento di file più grandi consentiti                                                                                                                                 | 10 MiB / 50 MiB                               |
| `observability.metrics_enabled` / `metrics_token_ref` | Se **Metriche** in Monitoraggio mostra dati o chiede un token                                                                                                                         | attivo; disattivato in produzione senza token |
| `observability.audit_retention_days`                  | Fino a quando risale il registro di audit dopo `axentra maintenance purge`                                                                                                            | 365                                           |
| `notify.invitation_accept_url`                        | Dove portano i link di invito (prevale l'`invitation_accept_url` del prodotto). Impostalo su `https://<your Studio address>/invitations/accept` quando Studio ha un indirizzo proprio | `/accept-invitation` su `security.public_url` |

Modificali nel file TOML del server o come variabili d'ambiente `AXENTRA__<SECTION>__<KEY>` (per
esempio `AXENTRA__SECURITY__SESSION_TTL_HOURS=8`) e riavvia l'API. In produzione i segreti si
indicano sempre come riferimenti (`env:NAME` o `file:/path`), mai direttamente nel file.

## Per approfondire {#further-reading}

Nel repository del backend di Axentra:

- `docs/operations/CONFIGURATION.md`: ogni impostazione con il suo valore predefinito e la sua
  variabile d'ambiente.
- `docs/operations/DEPLOYMENT.md`: immagine container, stack compose e checklist per la produzione.
- `docs/architecture/DEPLOYMENT_MODELS.md`: la modalità a prodotto singolo e quella multiprodotto
  nel dettaglio.
- `docs/operations/BACKUP_RESTORE.md`: backup del database, ripristino e come verificare un
  ripristino. Studio non contiene dati, quindi basta il backup del database.
- `docs/operations/OBSERVABILITY.md`: metriche, tracing, log, controlli di stato e conservazione.
- `docs/architecture/VERSIONING.md`: numeri di versione e regole di compatibilità.

Nel repository di Studio: `README.md` (configurazione e immagine container) e
`docs/COMPATIBILITY.md` (combinazioni testate).

## Risoluzione dei problemi {#troubleshooting}

- **Impossibile connettersi ad Axentra**: Studio non è riuscito a caricare `GET /v1/meta`.
  Controlla che l'API sia in esecuzione, che `apiBaseUrl` in `/config.json` sia corretto (o che il
  proxy inoltri `/v1`) e, con un indirizzo dell'API separato, che la Content-Security-Policy lo
  consenta.
- L'accesso fallisce con **Non consentito**, oppure ogni modifica fallisce con **Non consentito**:
  l'API rifiuta l'origine di Studio. Aggiungi l'indirizzo di Studio a `security.allowed_origins` e
  riavvia l'API.
- L'accesso sembra funzionare ma vieni subito disconnesso: Studio e l'API si trovano su siti
  diversi, oppure il `public_url` dell'API è `https://` mentre gli utenti la raggiungono tramite
  `http://`. Usa la stessa origine o una configurazione sullo stesso sito tramite HTTPS.
- **Versione del server incompatibile**: vedi [Verifica di compatibilità](#compatibility).
- **Modulo non abilitato su questo server**: abilita sul server il modulo indicato nel messaggio e
  ricarica Studio.
- **Non disponibile in questa modalità**: l'azione richiede la modalità `multi`; il server è in
  modalità `single`.
- Il registro di audit mostra l'indirizzo del proxy come **Indirizzo IP**: aggiungi il proxy a
  `security.trusted_proxies`.
- I link di invito aprono una pagina dell'API o **Pagina non trovata**: Studio ha un indirizzo
  proprio. Imposta `notify.invitation_accept_url` su
  `https://<your Studio address>/invitations/accept` e riavvia l'API. I link già inviati puntano
  ancora all'API; invia a quelle persone il token o un nuovo invito. Vedi
  [Membri e inviti](help:members-invitations#delivery).
