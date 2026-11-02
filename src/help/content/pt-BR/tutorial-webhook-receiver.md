---
title: Tutorial - criar um receptor de webhooks
summary: Crie um pequeno receptor em Python ou TypeScript que verifica a assinatura dos webhooks do Axentra, teste-o com um ping e um evento real e confira as entregas.
keywords: receptor de webhooks, verificar assinatura, HMAC-SHA256, Axentra-Signature, tutorial, Python, TypeScript, Node.js, exemplo, integração, ping de teste, desduplicar, duplicatas
---

Neste tutorial, você cria um pequeno programa que recebe as requisições de webhook do Axentra,
verifica se cada uma é autêntica, ignora duplicatas e imprime o evento. Depois, você o conecta a um
endpoint, testa com um ping e com um evento real e aprende a ler as entregas quando algo dá errado.
Leva cerca de 30 minutos. O receptor está escrito duas vezes, em Python e em TypeScript (Node.js);
escolha um.

## Do que você precisa {#prerequisites}

- Uma conta no Studio com `webhooks:manage` (proprietário ou administrador do produto) e, para o
  passo 7, `events:publish` em um tenant de teste. Veja [Webhooks](help:webhooks) para as permissões.
- O módulo de servidor `events` e um worker em execução (pergunte aos seus operadores).
- Python 3.10 ou mais recente, ou Node.js 22 ou mais recente. Nenhuma biblioteca extra é necessária.
- Uma forma de tornar o seu receptor acessível por HTTPS público (passo 1).

## Passo 1: Obter um endereço HTTPS público {#public-url}

O Axentra só envia webhooks para URLs `https://` públicas. Ele recusa `localhost`, endereços de rede
privada e `http://` simples (a menos que os seus operadores os tenham habilitado para um servidor de
desenvolvimento; veja [Regras de URL](help:webhooks#url-rules)). Para testar um receptor no seu
próprio computador, use um serviço de túnel (por exemplo ngrok ou Cloudflare Tunnel) que encaminhe
um endereço HTTPS público para `http://localhost:8000`. Você recebe um endereço como
`https://example-tunnel.example.com`.

Em produção, execute o receptor atrás do seu servidor web HTTPS ou balanceador de carga habitual.

## Passo 2: Criar o endpoint e copiar o segredo {#create-endpoint}

1. Abra [Webhooks](app:webhooks) e escolha **Novo endpoint**.
2. **URL**: o seu endereço público mais um caminho, por exemplo `https://example-tunnel.example.com/hooks/axentra`.
3. **Descrição**: `Tutorial receiver`.
4. **Tipos de evento**: adicione `tutorial.*`, para que o receptor receba apenas os eventos que você
   envia no passo 7.
5. **Filtro de tenant**: escolha o seu tenant de teste.
6. Escolha **Criar endpoint**.
7. Copie o **Segredo de assinatura** (ele começa com `whsec_`). Você não poderá vê-lo de novo. Marque
   **Guardei o segredo em local seguro** e escolha **Concluído**.

Disponibilize o segredo para o receptor como variável de ambiente, nunca no código-fonte:

```bash
export AXENTRA_WEBHOOK_SECRET='whsec_…'   # the value you copied
```

## Passo 3: Entender a assinatura {#verify-signature}

Toda requisição traz um cabeçalho como este:

```http
Axentra-Signature: t=1767225600,v1=9c1e…
```

- `t` é o momento do envio, em segundos Unix.
- `v1` é um HMAC-SHA256 codificado em hexadecimal. Durante uma rotação de segredo com período de
  carência, o cabeçalho tem **dois** valores `v1` (primeiro o do segredo novo, depois o do anterior):
  aceite a requisição se **qualquer** um deles corresponder.

Para verificar uma requisição:

1. Leia o corpo **bruto** da requisição como bytes. Não interprete e serialize o JSON de novo antes:
   qualquer mudança de espaçamento ou na ordem das chaves quebra a assinatura.
2. Divida o cabeçalho nas vírgulas e depois cada parte no primeiro `=`. Pegue `t` e todos os valores
   `v1`. Se `t` ou todos os `v1` estiverem ausentes, rejeite a requisição.
3. Rejeite a requisição se `t` estiver a mais de 300 segundos do seu horário atual. Isso impede que
   alguém reenvie uma requisição antiga que tenha gravado.
4. Calcule `HMAC-SHA256(key = the secret, message = t + "." + raw body)`, em hexadecimal minúsculo. A
   chave é a string completa do segredo, **incluindo** o prefixo `whsec_`, como bytes UTF-8. A
   mensagem é formada pelos dígitos de `t`, um ponto e os bytes do corpo.
5. Compare o seu resultado com cada valor `v1` usando uma comparação em **tempo constante**, para que
   atacantes não consigam deduzir a assinatura pelos tempos de resposta.

O Axentra entrega **pelo menos uma vez**, então o mesmo evento pode chegar mais de uma vez. Depois da
verificação da assinatura, olhe o `Axentra-Event-Id` (igual ao `id` do corpo): se você já processou
esse ID, responda `200` e não faça nada. Responda em até 10 segundos; o Axentra trata uma resposta
mais lenta como falha e tenta de novo. Se o processamento demorar, guarde o evento e responda
primeiro.

> [!TIP]
> Se o seu receptor é escrito em Python e pode instalar o pacote `axentra`, a função auxiliar
> `axentra.events.verify_signature(secret, header, body)` faz os passos 2 a 5 por você.

## Passo 4: Escrever o receptor em Python {#python}

Salve isto como `receiver.py`. Ele usa apenas a biblioteca padrão e escuta na porta 8000.

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

Inicie-o:

```bash
python3 receiver.py
```

## Passo 5: Ou escrevê-lo em TypeScript {#typescript}

Salve isto como `receiver.ts`. Ele usa apenas módulos nativos do Node.js (`node:http`,
`node:crypto`). `timingSafeEqual` é a comparação em tempo constante; ela exige que os dois valores
tenham o mesmo tamanho, daí a verificação de tamanho.

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

Inicie-o com o Node.js 22 ou mais recente (ou compile-o antes com `tsc`):

```bash
node --experimental-strip-types receiver.ts
```

> [!NOTE]
> Os dois exemplos guardam os IDs de eventos processados na memória, que se perde ao reiniciar. Em um
> receptor real, armazene-os em uma tabela de banco de dados com um índice único no ID do evento, na
> mesma transação do trabalho que o evento dispara.

## Passo 6: Testar localmente e depois com um ping {#test}

Primeiro, verifique o receptor no seu próprio computador com uma requisição assinada por você
(substitua o segredo pelo seu):

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

A resposta é `200` com `ok`; enviar de novo retorna `duplicate, ignored`. Altere um caractere de
`SIG` e você recebe `401`.

Agora deixe o Axentra chamá-lo:

1. Abra o seu endpoint em [Webhooks](app:webhooks) e escolha **Enviar ping de teste**.
2. O Studio mostra **Ping de teste entregue (HTTP 200)** e abre a entrega. O seu receptor imprime uma
   linha que começa com `axentra.ping`.

O ping é enviado uma vez, sem novas tentativas. O `id` dele é o ID da entrega, então cada ping é
novo para a sua desduplicação.

## Passo 7: Enviar um evento real {#real-event}

1. Abra [Eventos](app:events) e escolha **Publicar evento**.
2. Escolha o seu **Tenant** de teste, informe o **Tipo** `tutorial.hello` e os **Dados**
   `{"message": "Hello, receiver"}`.
3. Escolha **Publicar**.

Em poucos segundos, o receptor imprime `tutorial.hello evt_… tenant=… data=…`. Na guia **Entregas**
do endpoint, a entrega aparece como **Entregue**, com **Resposta** `200`.

## Passo 8: Observar uma falha e reenviar {#check-deliveries}

1. Pare o receptor.
2. Publique outro evento `tutorial.hello`.
3. Abra a guia **Entregas** do endpoint e escolha **Atualizar**. A entrega mostra **Falhou, tentando
   novamente**; os detalhes dela mostram o **Último erro** e a **Próxima tentativa**.
4. Inicie o receptor de novo. Uma tentativa automática posterior tem êxito ou, se todas as
   tentativas tiverem sido usadas (cerca de 2 a 4¼ horas com as configurações padrão; a segunda
   tentativa vem 1 a 2 minutos depois da primeira), a entrega fica como **Falha definitiva**.
5. Para uma entrega com falha definitiva, abra os detalhes dela e escolha **Reenviar**. Ela passa a
   **Pendente** e depois a **Entregue**.

Como ler os detalhes da entrega:

| Você vê                                             | Causa provável                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Resposta** `401`, corpo `invalid signature`       | Segredo errado, corpo alterado antes da verificação, ou o relógio do receptor está errado. |
| **Resposta** `404` ou `405`                         | Caminho errado, ou o receptor não aceita `POST`.                                           |
| **Resposta** `301`/`302`                            | Um redirecionamento; o Axentra não os segue. Use a URL final.                              |
| Sem código de resposta, **Último erro** com timeout | O receptor levou mais de 10 segundos.                                                      |
| Sem código de resposta, `unresolvable: …`           | O nome do host não existe (por exemplo, um túnel expirado).                                |
| **Falha definitiva**, `refused: …`                  | A URL resolve para um endereço privado ou local.                                           |

## Passo 9: Rotacionar o segredo sem indisponibilidade {#rotate}

1. Na página do endpoint, escolha **Rotacionar segredo**, selecione o **Período de carência** de
   **24 horas** e confirme.
2. Copie o novo segredo. O receptor continua funcionando: cada requisição agora traz uma assinatura
   com o segredo novo e outra com o antigo, e o receptor aceita qualquer uma.
3. Coloque o novo segredo em `AXENTRA_WEBHOOK_SECRET` e reinicie o receptor.
4. Escolha **Enviar ping de teste** para confirmar. Depois do período de carência, apenas o segredo
   novo assina as requisições.

## Solução de problemas {#troubleshooting}

**Toda requisição recebe 401, até o teste local com curl.** Verifique se `AXENTRA_WEBHOOK_SECRET`
contém o segredo completo, incluindo `whsec_`, sem aspas nem quebra de linha no final.

**O teste local funciona, mas o ping do Axentra recebe 401.** O receptor usa um segredo diferente do
endpoint (por exemplo, de antes de uma rotação), um framework alterou o corpo antes de você lê-lo (use
o corpo bruto, não o JSON interpretado), ou o relógio do receptor está mais de 5 minutos errado:
sincronize-o com NTP.

**“webhook urls must not point to local hosts” ao criar o endpoint.** Você informou `localhost` ou um
endereço privado. Use o endereço HTTPS público do túnel.

**O ping funciona, mas os eventos publicados não chegam.** Verifique os **Tipos de evento** do
endpoint (`tutorial.*` corresponde a `tutorial.hello`), o **Filtro de tenant** (precisa ser o tenant
em que você publicou) e se o endpoint está **Habilitado**. Se o evento está no log de eventos, mas
nenhuma entrega aparece, nenhum worker está em execução.

**O receptor imprime o mesmo evento duas vezes depois de reiniciar.** A lista em memória dos IDs
processados se perdeu. Armazene os IDs processados de forma persistente, como descrito na nota do
passo 5.
