---
title: Utenti
summary: Trova le persone che hanno accesso a un prodotto, controlla il loro profilo e le sessioni, disconnettile, disattiva gli account e assegna i ruoli nella piattaforma.
keywords: utente, account, persona, persone, disattivare utente, disabilitare, disconnetti ovunque, sessioni, ruolo nella piattaforma, amministratore della piattaforma, visualizzatore della piattaforma, senza email
---

Un **utente** è l'account di una persona sul server Axentra. Gli account valgono per l'intera
installazione: un account può essere operatore di un prodotto e membro di tenant in diversi altri.
Ciò che un utente può fare deriva da tre fonti:

- un **ruolo nella piattaforma** (valido per l'intera installazione, raro),
- un **ruolo di prodotto**, quando l'utente è operatore di un prodotto (vedi
  [prodotti](help:products#members)),
- un **ruolo di tenant** in ciascun tenant di cui l'utente è membro (vedi
  [membri e inviti](help:members-invitations)).

La schermata [Utenti](app:users) elenca gli utenti del prodotto corrente: i suoi operatori e i membri
dei suoi tenant.

> [!IMPORTANT]
> La schermata **Utenti** richiede `product_users:read` (proprietari, amministratori, supporto e
> visualizzatori del prodotto; amministratori e visualizzatori della piattaforma). Disattivare gli
> utenti, terminarne le sessioni e vederne le sessioni richiede l'autorizzazione di piattaforma
> `users:manage`, posseduta solo dagli amministratori della piattaforma. Solo gli amministratori
> della piattaforma modificano i ruoli nella piattaforma.

## Trovare un utente {#find}

Apri [Utenti](app:users). Usa **Cerca utenti** per filtrare per nome o indirizzo email e il filtro
**Stato** per mostrare gli utenti **Attivo** o **Disattivato**. Seleziona un nome per aprire la
pagina dell'utente.

Studio non crea account. Gli account vengono creati quando il primo amministratore completa la
configurazione iniziale, quando qualcuno accede per la prima volta tramite single sign-on (se le
impostazioni del provider di identità consentono la registrazione, o se è aperto un invito per
quell'indirizzo email), oppure dal codice di un prodotto che integra Axentra. Vedi
[accesso](help:signing-in).

## La pagina dell'utente {#profile}

Il riquadro **Profilo** mostra:

| Campo                          | Significato                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Nome**, **Indirizzo email**  | Dall'account. Gli utenti modificano il proprio nome nel loro profilo.                                            |
| **Stato**                      | **Attivo** o **Disattivato**.                                                                                    |
| **Lingua**                     | La lingua dell'interfaccia dell'utente.                                                                          |
| **Ruolo nella piattaforma**    | **Nessun ruolo nella piattaforma**, **Visualizzatore della piattaforma** o **Amministratore della piattaforma**. |
| **Accesso con password**       | **Password impostata** oppure **Nessuna password (solo single sign-on)**.                                        |
| **Ultimo accesso**, **Creato** | Data e ora.                                                                                                      |

La pagina dell'utente non elenca le sue appartenenze. Per vedere o modificare che cosa può fare un
utente in un tenant, apri la scheda **Membri** del tenant; per gli operatori, la scheda **Membri** del
prodotto.

### Utenti senza indirizzo email {#no-email}

Alcuni account non hanno un indirizzo email, per esempio quando un provider di identità non ne ha
confermato uno e il server consente questo tipo di registrazioni. Studio mostra allora l'ID
dell'utente al posto dell'indirizzo. Questi utenti:

- accedono solo tramite single sign-on, mai con una password;
- non possono accettare inviti, perché gli inviti sono legati a un indirizzo;
- possono comunque essere aggiunti direttamente ai tenant da qualcuno che li vede (per esempio un
  amministratore della piattaforma).

## Disconnettere un utente ovunque {#sign-out}

1. Apri la pagina dell'utente.
2. Scegli **Disconnetti ovunque** e conferma.

Tutte le sessioni dell'utente terminano immediatamente, su ogni dispositivo. L'utente può accedere di
nuovo. Usa questa funzione quando un dispositivo è andato perso o una sessione potrebbe essere
compromessa. **Sessioni attive** nella stessa pagina elenca ogni sessione con dispositivo, **Metodo
di accesso**, **Ultima attività** e **Scadenza**.

## Disattivare un utente {#disable}

1. Apri la pagina dell'utente.
2. Scegli **Disattiva utente**.
3. Digita l'indirizzo email dell'utente (o l'ID, per gli utenti che non ne hanno uno) per confermare
   e scegli **Disattiva utente**.

Un utente disattivato non può accedere, né con password né con single sign-on, e tutte le sue
sessioni terminano immediatamente. Appartenenze, ruolo nella piattaforma e cronologia di audit
restano, quindi **Attiva utente** ripristina l'accesso precedente.

> [!WARNING]
> Le chiavi API create da un utente appartengono al prodotto, non all'utente, e continuano a
> funzionare dopo la disattivazione dell'utente. Quando qualcuno se ne va, controlla e revoca anche
> le chiavi che ha configurato. Vedi [chiavi API](help:api-keys#revoke).

Non puoi disattivare te stesso, e l'ultimo amministratore della piattaforma attivo non può essere
disattivato.

## Cambiare un ruolo nella piattaforma {#platform-role}

I ruoli nella piattaforma valgono per **tutti i prodotti** del server, indipendentemente dalle
appartenenze.

| Ruolo nella piattaforma              | Significato                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nessun ruolo nella piattaforma**   | Accesso solo tramite appartenenze a prodotti e tenant.                                                                                                             |
| **Visualizzatore della piattaforma** | Accesso in sola lettura a tutti i prodotti, compresi i prodotti archiviati e i tenant sospesi, alle impostazioni e al registro di audit dell'intera installazione. |
| **Amministratore della piattaforma** | Controllo completo dell'intera installazione: tutti i prodotti e gli utenti, creazione e archiviazione di prodotti, nessun limite dei ruoli.                       |

1. Apri la pagina dell'utente. Il riquadro **Ruolo nella piattaforma** viene mostrato solo agli
   amministratori della piattaforma.
2. Scegli il nuovo **Ruolo nella piattaforma**.
3. Scegli **Cambia ruolo nella piattaforma** e conferma. Per concedere **Amministratore della
   piattaforma** devi digitare l'indirizzo email dell'utente (o l'ID).

> [!CAUTION]
> Un amministratore della piattaforma può fare tutto sul server, compreso eliminare tenant e creare
> chiavi in qualsiasi prodotto. Concedi questo ruolo al minor numero possibile di persone. L'ultimo
> amministratore della piattaforma non può perdere il ruolo.

## Risoluzione dei problemi {#troubleshooting}

**Non consentito nella schermata Utenti.** Non possiedi `product_users:read` in questo prodotto. I
proprietari e i membri dei tenant non hanno questa autorizzazione; vedono i loro colleghi nella scheda
**Membri** del tenant.

**Mancano i pulsanti Disattiva utente e Disconnetti ovunque.** Richiedono `users:manage`, posseduta
solo dagli amministratori della piattaforma.

**Conflitto: “you cannot disable yourself”.** Chiedi a un altro amministratore della piattaforma.

**Conflitto: “the last platform admin cannot be disabled” / “the last platform admin cannot lose
the role”.** Prima rendi amministratore della piattaforma un altro utente.

**Non consentito: “only platform admins can change platform roles”.** Chiedi a un amministratore
della piattaforma.

**Un utente manca dall'elenco.** L'utente non è né operatore di questo prodotto né membro di uno dei
suoi tenant. Aggiungilo o invitalo, vedi [membri e inviti](help:members-invitations).

**Un utente disattivato compare ancora nei tenant.** La disattivazione non rimuove le appartenenze.
Rimuovile nella scheda **Membri** del tenant se l'accesso non deve tornare quando l'utente viene
riattivato.
