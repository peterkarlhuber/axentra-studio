---
title: Tutorial - crear un receptor de webhooks
summary: Crea un pequeño receptor en Python o TypeScript que verifique la firma de los webhooks de Axentra, pruébalo con un ping y un evento real y revisa las entregas.
keywords: receptor de webhooks, verificar firma, HMAC-SHA256, Axentra-Signature, tutorial, Python, TypeScript, Node.js, ejemplo, integración, ping de prueba, deduplicar, duplicados
---

En este tutorial creas un pequeño programa que recibe las solicitudes de webhook de Axentra,
comprueba que cada una sea auténtica, ignora los duplicados e imprime el evento. Después lo conectas
a un endpoint, lo pruebas con un ping y con un evento real y aprendes a leer las entregas cuando algo
falla. Lleva unos 30 minutos. El receptor está escrito dos veces, en Python y en TypeScript
(Node.js); elige uno.

## Qué necesitas {#prerequisites}

- Una cuenta de Studio con `webhooks:manage` (propietario o administrador del producto) y, para el
  paso 7, `events:publish` en un inquilino de prueba. Consulta [Webhooks](help:webhooks) para los
  permisos.
- El módulo de servidor `events` y un worker en marcha (pregunta a tus operadores).
- Python 3.10 o posterior, o Node.js 22 o posterior. No hacen falta bibliotecas adicionales.
- Una forma de hacer accesible tu receptor mediante HTTPS público (paso 1).

## Paso 1: Obtener una dirección HTTPS pública {#public-url}

Axentra solo envía webhooks a URL `https://` públicas. Rechaza `localhost`, las direcciones de red
privadas y `http://` sin cifrar (salvo que tus operadores los hayan permitido en un servidor de
desarrollo; consulta [Reglas de URL](help:webhooks#url-rules)). Para probar un receptor en tu propio
ordenador, usa un servicio de túnel (por ejemplo ngrok o Cloudflare Tunnel) que redirija una
dirección HTTPS pública a `http://localhost:8000`. Obtendrás una dirección como
`https://example-tunnel.example.com`.

En producción, ejecuta el receptor detrás de tu servidor web HTTPS o balanceador de carga habitual.

## Paso 2: Crear el endpoint y copiar el secreto {#create-endpoint}

1. Abre [Webhooks](app:webhooks) y elige **Nuevo endpoint**.
2. **URL**: tu dirección pública más una ruta, por ejemplo
   `https://example-tunnel.example.com/hooks/axentra`.
3. **Descripción**: `Tutorial receiver`.
4. **Tipos de evento**: añade `tutorial.*`, para que el receptor solo reciba los eventos que envíes
   en el paso 7.
5. **Filtro de inquilino**: elige tu inquilino de prueba.
6. Elige **Crear endpoint**.
7. Copia el **Secreto de firma** (empieza por `whsec_`). No podrás volver a verlo. Marca **He
   guardado el secreto de forma segura** y elige **Listo**.

Pon el secreto a disposición del receptor como variable de entorno, nunca en el código fuente:

```bash
export AXENTRA_WEBHOOK_SECRET='whsec_…'   # the value you copied
```

## Paso 3: Entender la firma {#verify-signature}

Cada solicitud lleva una cabecera como esta:

```http
Axentra-Signature: t=1767225600,v1=9c1e…
```

- `t` es el momento del envío, en segundos Unix.
- `v1` es un HMAC-SHA256 codificado en hexadecimal. Durante una rotación de secreto con período de
  gracia, la cabecera tiene **dos** valores `v1` (primero el del secreto nuevo, después el del
  anterior): acepta la solicitud si **cualquiera** de ellos coincide.

Para verificar una solicitud:

1. Lee el cuerpo de la solicitud **sin procesar**, como bytes. No analices ni vuelvas a serializar
   antes el JSON: cualquier cambio en los espacios o en el orden de las claves rompe la firma.
2. Divide la cabecera por las comas y cada parte por el primer `=`. Toma `t` y todos los valores
   `v1`. Si falta `t` o faltan todos los `v1`, rechaza la solicitud.
3. Rechaza la solicitud si `t` se aleja más de 300 segundos de tu hora actual. Así nadie puede
   reproducir una solicitud antigua que haya grabado.
4. Calcula `HMAC-SHA256(key = the secret, message = t + "." + raw body)`, codificado en hexadecimal
   en minúsculas. La clave es la cadena completa del secreto, **incluido** el prefijo `whsec_`, como
   bytes UTF-8. El mensaje son los dígitos de `t`, un punto y los bytes del cuerpo.
5. Compara tu resultado con cada valor `v1` mediante una comparación **en tiempo constante**, para
   que los atacantes no puedan adivinar la firma a partir de los tiempos de respuesta.

Axentra entrega **al menos una vez**, así que el mismo evento puede llegar más de una vez. Tras
comprobar la firma, mira `Axentra-Event-Id` (igual que el `id` del cuerpo): si ya has procesado
este ID, responde `200` y no hagas nada. Responde en menos de 10 segundos; Axentra trata una
respuesta más lenta como un fallo y reintenta. Si el procesamiento lleva tiempo, guarda el evento y
responde primero.

> [!TIP]
> Si tu receptor está escrito en Python y puede instalar el paquete `axentra`, su función auxiliar
> `axentra.events.verify_signature(secret, header, body)` hace por ti los pasos 2 a 5.

## Paso 4: Escribir el receptor en Python {#python}

Guarda esto como `receiver.py`. Solo usa la biblioteca estándar y escucha en el puerto 8000.

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

Inícialo:

```bash
python3 receiver.py
```

## Paso 5: O escribirlo en TypeScript {#typescript}

Guarda esto como `receiver.ts`. Solo usa módulos integrados de Node.js (`node:http`,
`node:crypto`). `timingSafeEqual` es la comparación en tiempo constante; exige que ambos valores
tengan la misma longitud, de ahí la comprobación de longitud.

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

Inícialo con Node.js 22 o posterior (o compílalo antes con `tsc`):

```bash
node --experimental-strip-types receiver.ts
```

> [!NOTE]
> Ambos ejemplos recuerdan en memoria los ID de eventos procesados, que se pierden al reiniciar. En
> un receptor real, guárdalos en una tabla de base de datos con un índice único sobre el ID del
> evento, en la misma transacción que el trabajo que desencadena el evento.

## Paso 6: Probar en local y después con un ping {#test}

Primero comprueba el receptor en tu propio ordenador con una solicitud firmada por ti (sustituye el
secreto por el tuyo):

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

La respuesta es `200` con `ok`; si la envías de nuevo, devuelve `duplicate, ignored`. Cambia un
carácter de `SIG` y obtendrás `401`.

Ahora deja que Axentra lo llame:

1. Abre tu endpoint en [Webhooks](app:webhooks) y elige **Enviar ping de prueba**.
2. Studio muestra **Ping de prueba entregado (HTTP 200)** y abre la entrega. Tu receptor imprime una
   línea que empieza por `axentra.ping`.

El ping se envía una vez, sin reintentos. Su `id` es el ID de la entrega, así que cada ping es nuevo
para tu deduplicación.

## Paso 7: Enviar un evento real {#real-event}

1. Abre [Eventos](app:events) y elige **Publicar evento**.
2. Elige tu **Inquilino** de prueba, introduce el **Tipo** `tutorial.hello` y los **Datos**
   `{"message": "Hello, receiver"}`.
3. Elige **Publicar**.

En pocos segundos, el receptor imprime `tutorial.hello evt_… tenant=… data=…`. En la pestaña
**Entregas** del endpoint, la entrega aparece como **Entregada** con **Respuesta** `200`.

## Paso 8: Observar un fallo y volver a entregar {#check-deliveries}

1. Detén el receptor.
2. Publica otro evento `tutorial.hello`.
3. Abre la pestaña **Entregas** del endpoint y elige **Actualizar**. La entrega muestra **Fallida,
   reintentando**; sus detalles muestran el **Último error** y el **Próximo intento**.
4. Vuelve a iniciar el receptor. Un intento automático posterior tiene éxito o, si se agotaron todos
   los intentos (unas 2 a 4¼ horas con la configuración predeterminada; el segundo intento llega 1 a
   2 minutos después del primero), la entrega queda **Fallida definitivamente**.
5. Para una entrega fallida definitivamente, abre sus detalles y elige **Volver a entregar**. Pasa a
   **Pendiente** y después a **Entregada**.

Cómo leer los detalles de la entrega:

| Ves                                                      | Causa probable                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Respuesta** `401`, cuerpo `invalid signature`          | Secreto incorrecto, cuerpo modificado antes de verificar o el reloj del receptor está desajustado. |
| **Respuesta** `404` o `405`                              | Ruta incorrecta, o el receptor no acepta `POST`.                                                   |
| **Respuesta** `301`/`302`                                | Una redirección; Axentra no las sigue. Usa la URL final.                                           |
| Sin código de respuesta, **Último error** con un timeout | El receptor tardó más de 10 segundos.                                                              |
| Sin código de respuesta, `unresolvable: …`               | El nombre de host no existe (por ejemplo, un túnel caducado).                                      |
| **Fallida definitivamente**, `refused: …`                | La URL se resuelve en una dirección privada o local.                                               |

## Paso 9: Rotar el secreto sin interrupciones {#rotate}

1. En la página del endpoint, elige **Rotar secreto**, selecciona el **Período de gracia**
   **24 horas** y confirma.
2. Copia el secreto nuevo. El receptor sigue funcionando: cada solicitud lleva ahora una firma con
   el secreto nuevo y otra con el antiguo, y el receptor acepta cualquiera de las dos.
3. Pon el secreto nuevo en `AXENTRA_WEBHOOK_SECRET` y reinicia el receptor.
4. Elige **Enviar ping de prueba** para confirmarlo. Tras el período de gracia, solo el secreto nuevo
   firma las solicitudes.

## Solución de problemas {#troubleshooting}

**Todas las solicitudes reciben 401, incluso la prueba local con curl.** Comprueba que
`AXENTRA_WEBHOOK_SECRET` contenga el secreto completo, incluido `whsec_`, sin comillas ni un salto
de línea al final.

**La prueba local funciona, pero el ping de Axentra recibe 401.** El receptor usa un secreto
distinto del del endpoint (por ejemplo, uno de antes de una rotación), un framework modificó el
cuerpo antes de que lo leyeras (usa el cuerpo sin procesar, no el JSON analizado) o el reloj del
receptor está desajustado más de 5 minutos: sincronízalo con NTP.

**«webhook urls must not point to local hosts» al crear el endpoint.** Introdujiste `localhost` o
una dirección privada. Usa la dirección HTTPS pública del túnel.

**El ping funciona, pero los eventos publicados no llegan.** Comprueba los **Tipos de evento** del
endpoint (`tutorial.*` coincide con `tutorial.hello`), el **Filtro de inquilino** (debe ser el
inquilino en el que publicaste) y que el endpoint esté **Activado**. Si el evento está en el
historial de eventos pero no aparece ninguna entrega, no hay ningún worker en marcha.

**El receptor imprime el mismo evento dos veces tras un reinicio.** Se perdió la lista en memoria de
ID procesados. Guarda los ID procesados de forma persistente, como se describe en la nota del
paso 5.
