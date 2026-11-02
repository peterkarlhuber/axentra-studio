---
title: Impostazioni
summary: Scegli la lingua e il tema, e consulta la configurazione effettiva del server Axentra.
keywords: impostazioni, preferenze, lingua, tema, modalità scura, tema scuro, modalità chiara, configurazione del server, impostazioni effettive, config, moduli, durata della sessione, limiti
---

La pagina **Impostazioni** ha due parti. Le **Preferenze** sono le tue scelte personali per Studio:
la lingua dell'interfaccia e il tema. **Configurazione del server** mostra come è configurato in
questo momento il server Axentra, per esempio quali moduli sono abilitati, quanto durano le sessioni
e quali limiti si applicano. In Studio la configurazione del server è di sola lettura: la modifica
l'operatore sul server.

Aprila con **Impostazioni** in fondo alla barra laterale ([apri](app:settings)).

## Cambiare lingua e tema {#preferences}

1. In **Preferenze**, scegli una **Lingua**. L'interfaccia cambia subito.
2. In **Tema**, scegli **Chiaro**, **Scuro** o **Sistema**. **Sistema** segue l'impostazione chiara
   o scura del tuo sistema operativo e cambia insieme a essa.

Le stesse scelte sono nel menu utente in alto a destra (**Lingua** e **Tema**).

| Impostazione | Cosa fa                                                               | Valori                                                                                                                                               |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lingua**   | Lingua dell'interfaccia di Studio e dei formati di data, ora e numeri | English, Deutsch, Español, Français, Português (Brasil), Italiano. Se non scegli nulla, Studio segue la lingua del tuo browser, altrimenti l'inglese |
| **Tema**     | Colori dell'interfaccia                                               | **Chiaro**, **Scuro**, **Sistema** (predefinito)                                                                                                     |

### Dove vengono salvate le preferenze {#stored}

La tua scelta vale subito e viene salvata due volte: in questo browser, così funziona anche prima
dell'accesso, e nel tuo account utente sul server, così ti segue negli altri browser. Quando accedi
da un browser che non ha ancora una scelta propria, Studio prende lingua e tema dal tuo account.
Una scelta fatta in un browser resta in quel browser finché non la cambi lì.

> [!NOTE]
> Alcuni testi provengono dal server e restano in inglese qualunque lingua tu scelga: i nomi e le
> descrizioni dei ruoli predefiniti, le descrizioni nel catalogo delle autorizzazioni e il messaggio
> del server nei dettagli tecnici di un errore.

## Consultare la configurazione del server {#server-configuration}

La scheda **Configurazione del server** mostra la configurazione effettiva e non segreta del server
(`GET /v1/settings`) sotto forma di albero: gruppi come `limits` o `storage` contengono i rispettivi
valori. Gli elenchi sono mostrati separati da virgole. Usala per rispondere a domande come "quali
moduli sono abilitati?", "quanto dura una sessione?" o "quanto può essere grande un file?" senza
chiedere all'operatore.

> [!IMPORTANT]
> La configurazione del server viene mostrata con `platform:settings` (ruoli nella piattaforma
> `platform_admin` e `platform_viewer`) o con `product:manage` in almeno un prodotto
> (**Product owner**, **Product admin**). Tutti gli altri vedono solo le
> preferenze.

### Cosa significano i valori {#settings-tree}

| Chiave                                                           | Significato                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                                                    | `development`, `test` o `production`. In produzione all'avvio vengono applicati controlli di sicurezza più severi                                                                                                                                       |
| `mode`                                                           | `single` (un prodotto) o `multi` (più prodotti); vedi [Modalità di distribuzione](help:server-configuration#deployment-modes)                                                                                                                           |
| `modules`                                                        | Moduli abilitati. Le sezioni di Studio degli altri moduli mostrano **Modulo non abilitato su questo server**                                                                                                                                            |
| `public_url`, `allowed_origins`                                  | L'indirizzo esterno del server e le origini del browser (come quella di Studio) autorizzate a inviare richieste con sessione attiva                                                                                                                     |
| `trusted_proxies`                                                | Proxy di cui il server considera attendibile l'indirizzo client inoltrato (influisce sull'IP nel registro di audit e sui limiti di frequenza)                                                                                                           |
| `session_ttl_hours`, `session_idle_minutes`                      | Durata massima della sessione (predefinito 12 ore) e timeout di inattività (predefinito 120 minuti)                                                                                                                                                     |
| `password_login`, `password_min_length`, `login_rate_per_minute` | Se l'accesso con password è attivo, la lunghezza minima della password (predefinito 12) e il numero di accessi non riusciti consentiti per account e minuto (predefinito 10)                                                                            |
| `limits`                                                         | `max_body_bytes` (corpo di richiesta più grande, predefinito 10 MiB), `rate_limit_per_minute`, `rate_limit_ip_per_minute`, `rate_limit_burst` (vuoto: nessun limite di frequenza) e `api_docs` (se `/v1/docs` è `public`, `authenticated` o `disabled`) |
| `oidc_providers`                                                 | Provider di single sign-on con le loro regole di registrazione (mai il client secret)                                                                                                                                                                   |
| `storage`                                                        | Backend di archiviazione dei file, dimensione massima dei file e tipi di contenuto consentiti                                                                                                                                                           |
| `notify`, `billing`                                              | Provider e mittente delle notifiche; provider di fatturazione e stato dei pagamenti reali                                                                                                                                                               |
| `observability`                                                  | Livello di log, tracing, conservazione di audit e job                                                                                                                                                                                                   |
| `encryption_key_ids`, `active_encryption_key`                    | ID delle chiavi di cifratura che il server possiede e di quella usata per i nuovi dati (mai il materiale delle chiavi)                                                                                                                                  |
| `features`                                                       | Feature flag liberi dell'installazione                                                                                                                                                                                                                  |

I segreti (password del database, chiavi di cifratura, client secret, chiavi API dei provider) non
fanno mai parte di questa risposta.

### Modificare la configurazione del server {#change}

Studio non può modificare questi valori. L'operatore modifica il file di configurazione o le
variabili d'ambiente del server e lo riavvia; la prossima volta che apri questa pagina vedi i nuovi
valori. Vedi [Configurazione del server](help:server-configuration) per sapere cosa modificano di
solito gli operatori per Studio.

## Buono a sapersi {#good-to-know}

- Le impostazioni specifiche di un prodotto (per esempio la policy di archiviazione di un prodotto)
  non sono qui; si trovano nella pagina del prodotto stesso.
- Dopo che l'operatore ha abilitato o disabilitato un modulo, ricarica Studio: legge l'elenco dei
  moduli una sola volta all'avvio.

## Risoluzione dei problemi {#troubleshooting}

- **La configurazione del server è visibile solo agli amministratori della piattaforma e ai
  proprietari e amministratori dei prodotti.**: non hai né `platform:settings` né `product:manage`.
  Le tue preferenze funzionano comunque.
- **Il server non ha restituito impostazioni.**: il server ha risposto con una configurazione vuota.
  Ricarica la pagina; se resta vuota, avvisa l'operatore.
- La lingua o il tema non ti seguono in un altro browser: quel browser ha già una scelta propria, e
  la scelta del browser prevale. Cambiala lì una volta.
- La lingua o il tema tornano indietro dopo l'accesso: questo browser non aveva una scelta propria,
  quindi Studio ha preso quella del tuo account. Scegli di nuovo; da quel momento questo browser la
  mantiene.
