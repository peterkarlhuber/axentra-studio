---
title: Membri e inviti
summary: Dai alle persone l'accesso a un tenant aggiungendole come membri o invitandole via email, e comprendi il limite dei ruoli che stabilisce quali ruoli puoi assegnare.
keywords: membro, appartenenza, invitare, invito, link di invito, token di invito, accettare invito, limite dei ruoli, proprietario, owner, aggiungere utente, onboarding, team, squadra
---

Un **membro** è un utente con un ruolo in un tenant, per esempio **Owner**, **Admin**, **Member** o
**Viewer**. Il ruolo stabilisce che cosa la persona può fare in quel tenant. Puoi dare accesso a
qualcuno in due modi:

- **Aggiungi** direttamente un account esistente, quando puoi già vedere quell'account.
- **Invita** una persona via email. La persona accetta l'invito dopo aver eseguito l'accesso e
  diventa membro con il ruolo che hai scelto.

Gli operatori di un intero prodotto si gestiscono invece nel prodotto, vedi
[prodotti](help:products#members).

> [!IMPORTANT]
> Per vedere le schede **Membri** e **Inviti** di un tenant serve `members:read` nel tenant;
> aggiungere, invitare, cambiare ruoli, rimuovere e revocare richiede `members:manage`. I
> proprietari e gli amministratori del tenant possiedono entrambe; gli operatori **Support**
> possiedono `members:manage` ma possono assegnare solo ruoli che rientrano nelle proprie
> autorizzazioni (vedi [limite dei ruoli](#role-ceiling)). Entrambe le schermate richiedono il
> modulo dei tenant.

## Ruoli di tenant predefiniti {#tenant-roles}

| Ruolo                      | Che cosa può fare                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Owner** (`tenant_owner`) | Tutto nel tenant, compreso rendere proprietarie altre persone.                                                           |
| **Admin** (`tenant_admin`) | Le stesse autorizzazioni di Owner, ma non può assegnare, modificare o rimuovere i proprietari.                           |
| **Member** (`member`)      | Lavora con i dati: legge e scrive record e file, pubblica eventi, registra l'utilizzo, invia notifiche, esegue ricerche. |
| **Viewer** (`viewer`)      | Legge il tenant, i suoi membri, record, file, utilizzo e fatturazione, ed esegue ricerche.                               |

I ruoli di tenant personalizzati del tuo prodotto compaiono negli stessi elenchi, con la loro chiave
tra parentesi. Vedi [ruoli e autorizzazioni](help:roles-permissions).

## Aggiungere un utente esistente {#add}

1. Apri il tenant da [Tenant](app:tenants) e seleziona la scheda **Membri**.
2. Scegli **Aggiungi membro**.
3. Inserisci l'**Indirizzo email** e scegli un **Ruolo**.
4. Scegli **Aggiungi membro**.

Funziona solo con gli account che puoi vedere: gli amministratori della piattaforma vedono tutti gli
account; gli utenti con `product_users:read` (proprietari, amministratori, supporto e visualizzatori
del prodotto) vedono tutti coloro che appartengono già al prodotto; tutti gli altri vedono solo i
membri del tenant stesso. Per qualsiasi altro indirizzo la finestra mostra **Utente non trovato** e
offre **Invia invece un invito**, che crea un invito con la stessa email e lo stesso ruolo.

> [!NOTE]
> Axentra risponde “non trovato” allo stesso modo sia quando un account non esiste sia quando
> semplicemente non è visibile per te. Questo impedisce di sondare l'elenco degli account sul
> server.

## Cambiare un ruolo o rimuovere un membro {#change-role}

- Per cambiare un ruolo, scegline uno nuovo nella colonna **Ruolo** del membro. La modifica si
  applica immediatamente.
- Per rimuovere un membro, scegli l'icona del cestino nella riga e conferma **Rimuovere il
  membro?**. La persona perde tutti gli accessi concessi da questa appartenenza. Il suo account e le
  sue altre appartenenze restano.

Un tenant conserva sempre almeno un **Owner**: l'ultimo proprietario non può essere rimosso né
ricevere un altro ruolo. Prima rendi proprietario qualcun altro.

## Invitare qualcuno via email {#invite}

1. Apri il tenant e seleziona la scheda **Inviti**, oppure apri [Inviti](app:invitations) e scegli il
   tenant.
2. Scegli **Invita membro**.
3. Inserisci l'**Indirizzo email** e scegli un **Ruolo**. Studio preseleziona **Member**, oppure il
   primo ruolo che puoi assegnare.
4. Scegli **Invia invito**.

La finestra **Invito creato** mostra quindi il **Link di invito** (se disponibile) e il **Token di
invito**.

> [!CAUTION]
> Il link e il token vengono mostrati una sola volta. Axentra conserva solo un hash del token,
> quindi nessuno può visualizzarlo di nuovo. Chiunque abbia il token e acceda con l'indirizzo
> invitato può unirsi al tenant. Condividilo solo con la persona invitata. Se va perso, revoca
> l'invito e creane uno nuovo.

### Come l'invito raggiunge la persona {#delivery}

- **Modulo delle notifiche abilitato:** Axentra mette in coda un'email di invito all'indirizzo con
  il link di accettazione, e Studio mostra lo stesso link così puoi inviarlo anche tu. Il link punta
  all'impostazione di prodotto `invitation_accept_url`, se impostata (vedi
  [impostazioni del prodotto](help:products#settings)); altrimenti a `/accept-invitation`
  sull'URL pubblico del server. Per mandare le persone direttamente alla pagina di accettazione di
  Studio, imposta `invitation_accept_url` su
  `https://<your Studio address>/invitations/accept?token={token}`.
- **Modulo delle notifiche disattivato:** non viene inviata alcuna email e non c'è alcun link.
  Condividi il **Token di invito**; la persona lo inserisce nella pagina **Accetta invito** di
  Studio.

### Durata e stato degli inviti {#expiry}

| Stato         | Significato                                                 |
| ------------- | ----------------------------------------------------------- |
| **In attesa** | Aperto e valido; può essere accettato o revocato.           |
| **Accettato** | Usato; la persona è membro.                                 |
| **Revocato**  | Annullato con **Revoca invito**; il token non funziona più. |
| **Scaduto**   | Non accettato entro **7 giorni** dalla creazione.           |

La durata di 7 giorni è fissa. Per prolungarla, revoca l'invito (se ancora in attesa) e invita di
nuovo. Per ogni indirizzo email e tenant può esistere un solo invito aperto alla volta.

### Revocare un invito {#revoke}

Scegli l'icona del cestino accanto a un invito **In attesa** e conferma **Revocare l'invito?**. Il
link e il token smettono subito di funzionare.

## Accettare un invito {#accept}

Ecco che cosa fa la persona invitata:

1. Accedi a Studio con l'account il cui indirizzo email è quello invitato. Chi non ha un account può
   crearne uno accedendo tramite single sign-on con quell'indirizzo (se il tuo server offre il
   single sign-on); non esiste una registrazione autonoma con password.
2. Apri il link di invito. Se hai solo il token, apri **Accetta invito** in `/invitations/accept` e
   incollalo in **Token di invito**.
3. Scegli **Accetta invito**.

Studio conferma **Invito accettato** e il tenant compare nel tuo prodotto. Se eri già membro del
tenant, il tuo ruolo esistente resta invariato.

> [!IMPORTANT]
> Un invito può essere accettato solo da un utente che ha eseguito l'accesso e il cui account ha
> esattamente l'indirizzo email invitato (maiuscole e minuscole non contano). Gli utenti senza
> indirizzo email non possono accettare inviti; aggiungili invece direttamente.

## Limite dei ruoli: quali ruoli puoi assegnare {#role-ceiling}

Possedere `members:manage` non ti consente di concedere più di quanto possiedi tu stesso. Il server
applica queste regole e Studio le mostra in anticipo:

1. **Autorizzazioni.** Puoi assegnare un ruolo (aggiungere, invitare o passare a quel ruolo) solo se
   possiedi tutte le autorizzazioni di quel ruolo nello stesso tenant. Puoi modificare o rimuovere un
   membro solo se anche il suo ruolo _attuale_ rientra nelle tue autorizzazioni.
2. **Rango di proprietario.** Il ruolo **Owner** può essere assegnato, modificato o rimosso solo da
   un proprietario del tenant, da un operatore di prodotto, da una chiave API valida per l'intero
   prodotto o da un amministratore della piattaforma.
3. **Ultimo proprietario.** L'ultimo proprietario di un tenant (e l'ultimo **Product owner** di un
   prodotto) non può essere rimosso né declassato.

| Sei                                        | Puoi assegnare                                | Non puoi                                                                        |
| ------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------- |
| Amministratore della piattaforma           | Qualsiasi ruolo                               | Nessuna limitazione                                                             |
| Proprietario o amministratore del prodotto | Qualsiasi ruolo di tenant, compreso **Owner** | (Gli amministratori del prodotto non possono gestire gli operatori di prodotto) |
| Operatore **Support**                      | **Viewer**                                    | **Member**, **Admin**, **Owner**                                                |
| **Owner** del tenant                       | Qualsiasi ruolo del tenant                    | Rimuovere l'ultimo proprietario                                                 |
| **Admin** del tenant                       | **Admin**, **Member**, **Viewer**             | Assegnare, declassare o rimuovere un **Owner**                                  |
| Ruolo personalizzato con `members:manage`  | Ruoli di cui possiede le autorizzazioni       | Ruoli più forti                                                                 |

In Studio, i ruoli che non puoi assegnare compaiono come **“… (oltre le tue autorizzazioni)”** e
sono disattivati, e i membri che non puoi modificare mostrano **Superiore al tuo ruolo**, senza
selettore del ruolo né pulsante di rimozione.

> [!NOTE]
> Studio può calcolare il limite solo se puoi leggere i ruoli del prodotto (`roles:read`). Senza
> questa autorizzazione il ruolo è un campo di testo libero e il server spiega un rifiuto con **Non
> consentito**.

## Risoluzione dei problemi {#troubleshooting}

**Utente non trovato.** L'account non esiste, oppure non sei autorizzato a vederlo. Usa **Invia
invece un invito**.

**Conflitto: “an open invitation for this email exists”.** Nel tenant esiste già un invito in attesa
per questo indirizzo. Usalo, oppure revocalo e invita di nuovo.

**Non consentito: “you cannot assign the role …: it has permissions you do not hold”.** Il ruolo è
superiore al tuo livello. Scegli un ruolo più debole oppure chiedi a un proprietario. Vedi
[limite dei ruoli](#role-ceiling).

**Non consentito: “only owners can assign the role tenant_owner”.** Solo i proprietari, gli
operatori di prodotto e gli amministratori della piattaforma possono gestire i proprietari.

**Conflitto: “the tenant needs at least one owner”.** Hai tentato di rimuovere o declassare
l'ultimo proprietario.

**Verifica i dati inseriti: “unknown tenant role …”.** La chiave del ruolo non esiste in questo
prodotto (per esempio un errore di battitura nel campo di testo libero del ruolo), oppure è un ruolo
di prodotto.

**All'accettazione: Non trovato, “the invitation is invalid or expired”.** Il token è errato,
oppure l'invito è già stato accettato, revocato o ha più di 7 giorni. Chiedi un nuovo invito.

**All'accettazione: Non consentito, “this invitation was sent to another email address”.** Hai
eseguito l'accesso con un account di un altro indirizzo, oppure con uno senza indirizzo email.
Accedi con l'indirizzo invitato oppure chiedi un invito per il tuo indirizzo.

**La persona invitata non riesce ad accedere.** Non ha ancora un account. Studio non può creare
account e non esiste una registrazione con password. Una persona invitata ottiene un account
accedendo tramite single sign-on con l'indirizzo email invitato e verificato; senza single sign-on,
chiedi a un amministratore della piattaforma. Vedi [accesso](help:signing-in).

**La finestra dell'invito mostra solo un token.** Il modulo delle notifiche è disattivato, quindi
non è stato generato alcun link. Condividi il token.
