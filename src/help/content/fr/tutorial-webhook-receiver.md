---
title: Tutoriel - créer un récepteur de webhooks
summary: Créer un petit récepteur en Python ou en TypeScript qui vérifie la signature des webhooks d’Axentra, le tester avec un ping et un vrai événement, et contrôler les livraisons.
keywords: récepteur de webhooks, webhook receiver, vérifier la signature, HMAC-SHA256, Axentra-Signature, tutoriel, Python, TypeScript, Node.js, exemple, intégration, ping de test, dédoublonnage, doublons
---

Dans ce tutoriel, tu crées un petit programme qui reçoit les requêtes de webhook d’Axentra, vérifie
que chacune est authentique, ignore les doublons et affiche l’événement. Tu le relies ensuite à un
point de terminaison, tu le testes avec un ping et un vrai événement, et tu apprends à lire les
livraisons lorsque quelque chose ne va pas. Compte environ 30 minutes. Le récepteur est écrit deux
fois, en Python et en TypeScript (Node.js) ; choisis l’un des deux.

## Ce qu’il te faut {#prerequisites}

- Un compte Studio avec `webhooks:manage` (propriétaire ou administrateur du produit) et, pour
  l’étape 7, `events:publish` dans un locataire de test. Voir [Webhooks](help:webhooks) pour les
  autorisations.
- Le module serveur `events` et un worker en service (renseigne-toi auprès de tes opérateurs).
- Python 3.10 ou plus récent, ou Node.js 22 ou plus récent. Aucune bibliothèque supplémentaire
  n’est nécessaire.
- Un moyen de rendre ton récepteur joignable via une adresse HTTPS publique (étape 1).

## Étape 1 : obtenir une adresse HTTPS publique {#public-url}

Axentra n’envoie des webhooks qu’à des URL `https://` publiques. Il refuse `localhost`, les adresses
de réseau privé et le simple `http://` (sauf si tes opérateurs les ont autorisés pour un serveur de
développement, voir [Règles d’URL](help:webhooks#url-rules)). Pour tester un récepteur sur ton
propre ordinateur, utilise un service de tunnel (par exemple ngrok ou Cloudflare Tunnel) qui
redirige une adresse HTTPS publique vers `http://localhost:8000`. Tu obtiens une adresse comme
`https://example-tunnel.example.com`.

En production, fais tourner le récepteur derrière ton serveur web HTTPS ou ton répartiteur de
charge habituel.

## Étape 2 : créer le point de terminaison et copier le secret {#create-endpoint}

1. Ouvre [Webhooks](app:webhooks) et choisis **Nouveau point de terminaison**.
2. **URL** : ton adresse publique suivie d’un chemin, par exemple `https://example-tunnel.example.com/hooks/axentra`.
3. **Description** : `Tutorial receiver`.
4. **Types d’événements** : ajoute `tutorial.*`, pour que le récepteur ne reçoive que les
   événements que tu envoies à l’étape 7.
5. **Filtre de locataire** : choisis ton locataire de test.
6. Choisis **Créer le point de terminaison**.
7. Copie le **Secret de signature** (il commence par `whsec_`). Tu ne pourras plus le voir. Coche
   **J’ai conservé le secret en lieu sûr** et choisis **Terminé**.

Mets le secret à la disposition du récepteur sous forme de variable d’environnement, jamais dans le
code source :

```bash
export AXENTRA_WEBHOOK_SECRET='whsec_…'   # the value you copied
```

## Étape 3 : comprendre la signature {#verify-signature}

Chaque requête porte un en-tête de ce type :

```http
Axentra-Signature: t=1767225600,v1=9c1e…
```

- `t` est l’heure d’envoi, en secondes Unix.
- `v1` est un HMAC-SHA256 encodé en hexadécimal. Pendant un renouvellement de secret avec délai de
  grâce, l’en-tête contient **deux** valeurs `v1` (le nouveau secret d’abord, l’ancien ensuite) :
  accepte la requête si **l’une quelconque** d’entre elles correspond.

Pour vérifier une requête :

1. Lis le corps **brut** de la requête sous forme d’octets. N’analyse pas le JSON pour le
   resérialiser avant : le moindre changement d’espacement ou d’ordre des clés casse la signature.
2. Découpe l’en-tête aux virgules, puis chaque partie au premier `=`. Récupère `t` et toutes les
   valeurs `v1`. Si `t` manque ou si toutes les valeurs `v1` manquent, rejette la requête.
3. Rejette la requête si `t` s’écarte de plus de 300 secondes de ton heure actuelle. Cela empêche
   quelqu’un de rejouer une ancienne requête qu’il aurait enregistrée.
4. Calcule `HMAC-SHA256(key = the secret, message = t + "." + raw body)`, encodé en hexadécimal en
   minuscules. La clé est la chaîne complète du secret, préfixe `whsec_` **compris**, en octets
   UTF-8. Le message se compose des chiffres de `t`, d’un point et des octets du corps.
5. Compare ton résultat à chaque valeur `v1` avec une comparaison **en temps constant**, pour que
   des attaquants ne puissent pas deviner la signature à partir des temps de réponse.

Axentra livre **au moins une fois** : le même événement peut donc arriver plusieurs fois. Après la
vérification de la signature, regarde `Axentra-Event-Id` (identique à l’`id` du corps) : si tu as
déjà traité cet identifiant, réponds `200` et ne fais rien. Réponds en moins de 10 secondes ;
Axentra considère une réponse plus lente comme un échec et réessaie. Si le traitement est long,
stocke l’événement et réponds d’abord.

> [!TIP]
> Si ton récepteur est écrit en Python et peut installer le paquet `axentra`, sa fonction
> `axentra.events.verify_signature(secret, header, body)` effectue les étapes 2 à 5 pour toi.

## Étape 4 : écrire le récepteur en Python {#python}

Enregistre ceci sous `receiver.py`. Le programme n’utilise que la bibliothèque standard et écoute
sur le port 8000.

```python
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ["AXENTRA_WEBHOOK_SECRET"]  # the complete value, including "whsec_"
TOLERANCE_SECONDS = 300
seen_event_ids: set[str] = set()  # use a database table in production


def verify_signature(secret: str, header: str, body: bytes) -> bool:
    timestamp = None
    signatures = []
    for part in header.split(","):
        key, _, value = part.strip().partition("=")
        if key == "t" and value.isdigit():
            timestamp = int(value)
        elif key == "v1":
            signatures.append(value)
    if timestamp is None or not signatures:
        return False
    if abs(time.time() - timestamp) > TOLERANCE_SECONDS:
        return False
    message = f"{timestamp}.".encode() + body
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, signature) for signature in signatures)


class Receiver(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if not verify_signature(SECRET, self.headers.get("Axentra-Signature", ""), body):
            self.reply(401, "invalid signature")
            return
        event_id = self.headers.get("Axentra-Event-Id", "")
        if event_id in seen_event_ids:
            self.reply(200, "duplicate, ignored")
            return
        event = json.loads(body)
        print(f"{event['type']} {event['id']} tenant={event['tenant_id']} data={event['data']}")
        seen_event_ids.add(event_id)
        self.reply(200, "ok")

    def reply(self, status: int, text: str) -> None:
        data = text.encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Receiver).serve_forever()
```

Démarre-le :

```bash
python3 receiver.py
```

## Étape 5 : ou l’écrire en TypeScript {#typescript}

Enregistre ceci sous `receiver.ts`. Le programme n’utilise que des modules intégrés de Node.js
(`node:http`, `node:crypto`). `timingSafeEqual` est la comparaison en temps constant ; elle exige
que les deux valeurs aient la même longueur, d’où la vérification de longueur.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';

const SECRET = process.env.AXENTRA_WEBHOOK_SECRET ?? ''; // the complete value, including "whsec_"
const TOLERANCE_SECONDS = 300;
const seenEventIds = new Set<string>(); // use a database table in production

export function verifySignature(secret: string, header: string, body: Buffer): boolean {
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key = '', ...rest] = part.trim().split('=');
    const value = rest.join('=');
    if (key === 't' && /^\d+$/.test(value)) timestamp = Number(value);
    else if (key === 'v1') signatures.push(value);
  }
  if (timestamp === null || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest('hex'),
  );
  return signatures.some((signature) => {
    const candidate = Buffer.from(signature);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

function reply(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain' }).end(text);
}

createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks); // the raw bytes, exactly as received
    const header = req.headers['axentra-signature'];
    if (
      req.method !== 'POST' ||
      typeof header !== 'string' ||
      !verifySignature(SECRET, header, body)
    ) {
      reply(res, 401, 'invalid signature');
      return;
    }
    const eventId = String(req.headers['axentra-event-id'] ?? '');
    if (seenEventIds.has(eventId)) {
      reply(res, 200, 'duplicate, ignored');
      return;
    }
    const event = JSON.parse(body.toString('utf8')) as {
      id: string;
      type: string;
      tenant_id: string | null;
      data: Record<string, unknown>;
    };
    console.log(
      `${event.type} ${event.id} tenant=${event.tenant_id} data=${JSON.stringify(event.data)}`,
    );
    seenEventIds.add(eventId);
    reply(res, 200, 'ok');
  });
}).listen(8000);
```

Démarre-le avec Node.js 22 ou plus récent (ou compile-le d’abord avec `tsc`) :

```bash
node --experimental-strip-types receiver.ts
```

> [!NOTE]
> Les deux exemples mémorisent les identifiants d’événements traités en mémoire, ce qui est perdu
> au redémarrage. Dans un vrai récepteur, stocke-les dans une table de base de données avec un
> index unique sur l’identifiant d’événement, dans la même transaction que le travail déclenché par
> l’événement.

## Étape 6 : tester en local, puis avec un ping {#test}

Vérifie d’abord le récepteur sur ton propre ordinateur avec une requête que tu signes toi-même
(remplace le secret par le tien) :

```bash
SECRET='whsec_…'
BODY='{"id":"evt_local_1","type":"tutorial.hello","tenant_id":null,"data":{}}'
T=$(date +%s)
SIG=$(printf '%s' "$T.$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.*= //')
curl -i -X POST http://localhost:8000/hooks/axentra \
  -H 'Content-Type: application/json' \
  -H 'Axentra-Event-Id: evt_local_1' \
  -H "Axentra-Signature: t=$T,v1=$SIG" \
  --data "$BODY"
```

La réponse est `200` avec `ok` ; un nouvel envoi renvoie `duplicate, ignored`. Modifie un caractère
de `SIG` et tu obtiens `401`.

Laisse maintenant Axentra l’appeler :

1. Ouvre ton point de terminaison dans [Webhooks](app:webhooks) et choisis **Envoyer un ping de
   test**.
2. Le Studio affiche **Ping de test livré (HTTP 200)** et ouvre la livraison. Ton récepteur affiche
   une ligne commençant par `axentra.ping`.

Le ping est envoyé une seule fois, sans nouvelle tentative. Son `id` est l’identifiant de la
livraison : chaque ping est donc nouveau pour ton dédoublonnage.

## Étape 7 : envoyer un vrai événement {#real-event}

1. Ouvre [Événements](app:events) et choisis **Publier un événement**.
2. Choisis ton **Locataire** de test, saisis le **Type** `tutorial.hello` et les **Données**
   `{"message": "Hello, receiver"}`.
3. Choisis **Publier**.

En quelques secondes, le récepteur affiche `tutorial.hello evt_… tenant=… data=…`. Dans l’onglet
**Livraisons** du point de terminaison, la livraison est **Livrée** avec la **Réponse** `200`.

## Étape 8 : observer un échec et relivrer {#check-deliveries}

1. Arrête le récepteur.
2. Publie un autre événement `tutorial.hello`.
3. Ouvre l’onglet **Livraisons** du point de terminaison et choisis **Actualiser**. La livraison
   affiche **Échouée, nouvelle tentative prévue** ; ses détails indiquent la **Dernière erreur** et
   la **Prochaine tentative**.
4. Redémarre le récepteur. Une tentative automatique ultérieure réussit ou, si toutes les tentatives
   ont été utilisées (environ 2 à 4¼ heures avec les paramètres par défaut ; la deuxième tentative
   suit 1 à 2 minutes après la première), la livraison passe à **Abandonnée**.
5. Pour une livraison abandonnée, ouvre ses détails et choisis **Relivrer**. Elle passe à **En
   attente**, puis à **Livrée**.

Lire les détails d’une livraison :

| Ce que tu vois                                                    | Cause probable                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Réponse** `401`, corps `invalid signature`                      | Mauvais secret, corps modifié avant la vérification, ou horloge du récepteur décalée. |
| **Réponse** `404` ou `405`                                        | Mauvais chemin, ou le récepteur n’accepte pas `POST`.                                 |
| **Réponse** `301`/`302`                                           | Une redirection ; Axentra ne les suit pas. Utilise l’URL finale.                      |
| Pas de code de réponse, **Dernière erreur** avec un délai dépassé | Le récepteur a mis plus de 10 secondes à répondre.                                    |
| Pas de code de réponse, `unresolvable: …`                         | Le nom d’hôte n’existe pas (par exemple un tunnel expiré).                            |
| **Abandonnée**, `refused: …`                                      | L’URL pointe vers une adresse privée ou locale.                                       |

## Étape 9 : renouveler le secret sans interruption {#rotate}

1. Sur la page du point de terminaison, choisis **Renouveler le secret**, sélectionne le **Délai de
   grâce** **24 heures** et confirme.
2. Copie le nouveau secret. Le récepteur continue de fonctionner : chaque requête porte désormais
   une signature avec le nouveau secret et une avec l’ancien, et le récepteur accepte l’une ou
   l’autre.
3. Place le nouveau secret dans `AXENTRA_WEBHOOK_SECRET` et redémarre le récepteur.
4. Choisis **Envoyer un ping de test** pour confirmer. Après le délai de grâce, seul le nouveau
   secret signe les requêtes.

## Dépannage {#troubleshooting}

**Chaque requête reçoit 401, même le test local avec curl.** Vérifie que `AXENTRA_WEBHOOK_SECRET`
contient le secret complet, `whsec_` compris, sans guillemets ni saut de ligne final.

**Le test local fonctionne, le ping d’Axentra reçoit 401.** Le récepteur utilise un autre secret que
le point de terminaison (par exemple celui d’avant un renouvellement), un framework a modifié le
corps avant que tu le lises (utilise le corps brut, pas le JSON analysé), ou l’horloge du récepteur
est décalée de plus de 5 minutes : synchronise-la avec NTP.

**« webhook urls must not point to local hosts » lors de la création du point de terminaison.** Tu
as saisi une adresse `localhost` ou privée. Utilise l’adresse HTTPS publique du tunnel.

**Le ping fonctionne, mais les événements publiés n’arrivent pas.** Vérifie les **Types
d’événements** du point de terminaison (`tutorial.*` correspond à `tutorial.hello`), le **Filtre de
locataire** (ce doit être le locataire dans lequel tu as publié) et que le point de terminaison est
**Activé**. Si l’événement figure dans le journal des événements mais qu’aucune livraison
n’apparaît, aucun worker ne tourne.

**Le récepteur affiche le même événement deux fois après un redémarrage.** La liste en mémoire des
identifiants traités a été perdue. Stocke les identifiants traités de façon persistante, comme
indiqué dans la note de l’étape 5.
