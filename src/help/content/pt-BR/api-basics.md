---
title: Noções básicas da API para desenvolvedores
summary: Como chamar a API HTTP do Axentra a partir do seu próprio código - URL base, autenticação, erros, IDs de requisição, paginação, concorrência, limites de taxa, SDKs e versionamento.
keywords: API, REST, HTTP, desenvolvedor, integração, URL base, chave de API, bearer token, sessão, CSRF, erro, problem details, RFC 9457, ID da requisição, paginação, cursor, If-Match, ETag, 412, 429, limite de taxa, Retry-After, idempotência, SDK, Python, TypeScript, OpenAPI, versão
---

Tudo o que o Studio faz, ele faz pela API HTTP pública do Axentra, e os seus próprios serviços podem
fazer o mesmo. Este artigo explica as regras que valem para todos os endpoints. O contrato
completo, legível por máquina, é o documento OpenAPI do servidor (`openapi/axentra-v1.json` no
repositório do backend; em um servidor em execução, `/v1/openapi.json` e a referência interativa em
`/v1/docs`, se o operador os tiver habilitado; veja [Referência da API](#api-reference)).

> [!IMPORTANT]
> Para chamar a API a partir de um programa, você precisa de uma chave de API para o seu produto.
> Crie uma em **Acesso e chaves de API** › **Chaves de API** ([abrir](app:apiKeys)); veja
> [Chaves de API](help:api-keys).

## URL base e formato {#base-url}

- Todos os endpoints ficam em `/v1`, no endereço público do servidor, por exemplo
  `https://api.example.com/v1/...`. Peça o endereço ao seu operador (é o `public_url` na página
  [Configurações](help:settings#settings-tree)).
- Produto e tenant fazem parte do caminho:
  `/v1/products/{product_id}/tenants/{tenant_id}/...`. Os IDs são strings opacas com um prefixo
  (`prd_`, `ten_`, `usr_`, `key_`, `rec_`, ...); não tente interpretá-los.
- Requisições e respostas são em JSON (`application/json`, UTF-8) com campos em `snake_case`. Os
  carimbos de data e hora seguem a RFC 3339 em UTC, por exemplo `2026-11-02T09:30:00Z`.
- Os clientes devem ignorar campos de resposta que não conhecem: novos campos podem aparecer em
  qualquer versão minor.

```http
GET /v1/products/prd_01EXAMPLE/tenants?limit=20 HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01EXAMPLE_secretEXAMPLE
Accept: application/json
```

## Autenticar {#authentication}

| Quem chama                                                  | Como                                                                                                       | CSRF                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Um serviço, script ou job                                   | Chave de API: `Authorization: Bearer axk_<id>_<secret>` (o cabeçalho `X-API-Key: axk_...` também funciona) | Não é necessário                             |
| Um app de navegador em uma origem permitida (como o Studio) | Cookie de sessão do login, enviado pelo navegador                                                          | Obrigatório em requisições que alteram dados |
| Uma CLI ou ferramenta agindo como um usuário                | O token de sessão como `Authorization: Bearer <token>`                                                     | Não é necessário                             |

### Chaves de API {#api-keys}

Uma chave de API pertence a um produto, opcionalmente a um tenant, e tem uma lista explícita de
permissões. Ela é exibida apenas uma vez, ao ser criada ou rotacionada. Guarde-a em um cofre de
segredos, nunca em um navegador ou repositório. Requisições feitas com uma chave são registradas com
**Tipo de autor** `api_key` no [log de auditoria](help:audit#event-detail). Detalhes:
[Chaves de API](help:api-keys).

### Sessões de navegador e CSRF {#csrf}

O login (`POST /v1/auth/login/password` ou login único) define um cookie de sessão `HttpOnly`.
Quando uma requisição é autenticada por esse cookie e altera algo (`POST`, `PUT`, `PATCH`,
`DELETE`), ela também precisa enviar:

- `X-Axentra-CSRF: <csrf_token>`, em que o token vem de `GET /v1/auth/session` (ou da resposta do
  login); mantenha-o apenas na memória;
- um `Origin` que seja o `public_url` do servidor ou esteja listado em `security.allowed_origins`.

Caso contrário, o servidor responde `403` (`missing or invalid CSRF token` ou
`cross-origin request refused`). Requisições autenticadas com um bearer token não precisam de token
CSRF, porque os navegadores nunca as enviam automaticamente.

### 401, 403 e 404 {#auth-errors}

- `401 unauthenticated`: credenciais ausentes ou inválidas (chave errada, chave revogada, sessão
  expirada).
- `403 forbidden`: você está autenticado, mas não tem a permissão.
- `404 not_found`: também para recursos **fora do seu escopo**, por exemplo o tenant de outro
  produto. O servidor nunca revela se existe algo que você não pode ver.

## Erros {#errors}

Todo erro é um documento de problema da RFC 9457 com `Content-Type: application/problem+json`
([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "type": "https://axentra.dev/problems/validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "The request is invalid.",
  "request_id": "req_01EXAMPLE",
  "errors": [{ "loc": ["body", "slug"], "msg": "String should have at least 2 characters" }]
}
```

Use `code` no seu programa; ele é estável. `title` e `detail` são para pessoas e podem mudar.

| Status | `code`                                   | Significado                                                                       |
| ------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| 400    | `bad_request`                            | Requisição malformada                                                             |
| 401    | `unauthenticated`                        | Faça login ou envie uma chave válida                                              |
| 403    | `forbidden`, `reauthentication_required` | Falta permissão; ou a ação exige um login recente                                 |
| 404    | `not_found`, `module_disabled`           | Não existe, não é seu ou o módulo está desligado                                  |
| 409    | `conflict`, `mode_not_supported`         | Conflita com dados existentes; ou não é possível no modo de produto único         |
| 412    | `precondition_failed`                    | A versão em `If-Match` está desatualizada (veja [Concorrência](#concurrency))     |
| 413    | `payload_too_large`                      | Corpo maior que `max_body_bytes` (ou arquivo maior que o limite do armazenamento) |
| 415    | `unsupported_media_type`                 | Tipo de conteúdo não aceito                                                       |
| 422    | `validation_failed`                      | Entrada inválida; `errors` lista cada campo (`loc`) e o motivo (`msg`)            |
| 429    | `rate_limited`, `quota_exceeded`         | Requisições demais, ou uma cota de uso se esgotou                                 |
| 500    | `internal`                               | Erro do servidor; informe o ID da requisição                                      |

Os problem details nunca contêm segredos, tokens, SQL ou stack traces.

## IDs de requisição {#request-ids}

Toda resposta traz um cabeçalho `X-Request-ID`, e todo documento de problema traz o `request_id`.
Você pode enviar o seu próprio ID em `X-Request-ID` (1 a 64 caracteres entre `A-Z a-z 0-9 . _ -`);
caso contrário, o servidor cria um (`req_…`). O mesmo ID aparece nos logs do servidor, nos traces e
como **ID da requisição** nos [eventos de auditoria](help:audit#request-id). Registre-o em cada
chamada com falha e informe-o quando pedir ajuda. O Studio o mostra em **Detalhes técnicos** em
cada mensagem de erro.

## Paginar listas {#pagination}

As listas usam cursores:

```http
GET /v1/audit?limit=100 HTTP/1.1
```

```json
{ "items": [ ... ], "next_cursor": "eyJ..." }
```

- `limit` vai de 1 a 200, padrão 50.
- Quando `next_cursor` não for `null`, peça a próxima página com `?cursor=<next_cursor>` e os mesmos
  filtros. Quando for `null`, você já tem tudo.
- Os cursores são opacos; não os monte nem os altere. Os filtros são parâmetros de consulta comuns,
  documentados por endpoint.

## Evitar atualizações perdidas {#concurrency}

Recursos que têm um número de `version` (por exemplo produtos, tenants, registros, medidores de uso,
modelos de notificação) oferecem concorrência otimista:

1. Leia o recurso e anote a `version` dele (as respostas de registros e medidores também a enviam
   como `ETag`, por exemplo `"3"`).
2. Envie a alteração com `If-Match: 3`.
3. Se alguém o alterou nesse meio-tempo, o servidor responde `412 precondition_failed`. Leia de
   novo, reaplique a sua alteração e tente outra vez.

Sem `If-Match`, vale a última gravação. `If-Match` precisa ser o número da versão; qualquer outra
coisa resulta em `422`.

## Repetir com segurança: chaves de idempotência {#idempotency}

Endpoints que criam algo com efeitos colaterais aceitam um cabeçalho `Idempotency-Key` (até 200
caracteres), por exemplo registrar uso, enfileirar jobs, publicar eventos e enviar notificações.
Repetir uma requisição com a mesma chave retorna o resultado original em vez de fazer o trabalho
duas vezes. Use a sua própria chave de negócio (um ID de pedido, um ID de mensagem) e reutilize-a em
cada nova tentativa. Para registrar uso, a chave é obrigatória.

## Limites de taxa {#rate-limits}

Se o operador habilitou limites de taxa (`limits.rate_limit_per_minute`,
`rate_limit_ip_per_minute`, veja [Configurações](help:settings#settings-tree)), um cliente que envia
requisições demais recebe `429 rate_limited` com um cabeçalho `Retry-After` em segundos. Aguarde
esse tempo e tente de novo. Os limites contam por credencial (chave de API ou sessão), por IP do
cliente e por processo do servidor. Verificações de integridade e `/metrics` nunca são limitados.
Tentativas de login têm um limite próprio (`login_rate_per_minute`).

`429 quota_exceeded` é diferente: uma cota de uso do tenant ou do plano se esgotou (veja
[Uso](help:usage)). Esperar alguns segundos não adianta.

## Usar um SDK {#sdks}

O repositório do backend contém dois clientes oficiais, ambos em versão alfa e ainda não publicados
em um registro de pacotes. Os dois enviam os cabeçalhos certos, transformam documentos de problema
em exceções com `status`, `code`, `request_id` e `retry_after`, paginam por você e verificam a
versão do servidor. Nenhum deles repete requisições automaticamente: faça isso você mesmo, com uma
chave de idempotência.

### Python {#sdk-python}

Pacote `axentra-client` em `sdk/python` (Python 3.11+, clientes síncrono e assíncrono). Instale-o a
partir de um checkout com `pip install ./sdk/python`.

```python
from axentra_client import AxentraClient, AxentraApiError

with AxentraClient("https://api.example.com", api_key="axk_01EXAMPLE_secretEXAMPLE") as ax:
    ax.check_compatibility()
    pid = "prd_01EXAMPLE"
    for tenant in ax.tenants.iter(pid, page_size=100):
        print(tenant.slug)
    try:
        ax.tenants.create(pid, slug="acme", name="Acme")
    except AxentraApiError as e:
        print(e.status, e.code, e.request_id)
```

### TypeScript {#sdk-typescript}

Pacote `@axentra/sdk` em `sdk/typescript` (ESM, Node 20+ ou um navegador moderno). Os tipos são
gerados a partir do contrato OpenAPI, então todo caminho, parâmetro e corpo é tipado.

```ts
import { AxentraApiError, createAxentraClient } from '@axentra/sdk';

const ax = createAxentraClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.AXENTRA_KEY,
});
await ax.checkCompatibility();

const product_id = 'prd_01EXAMPLE';
for await (const t of ax.paginate((cursor) =>
  ax.GET('/v1/products/{product_id}/tenants', {
    params: { path: { product_id }, query: { cursor, limit: 100 } },
  }),
)) {
  console.log(t.slug);
}
```

Em um navegador sem chave, o cliente TypeScript usa o cookie de sessão e cuida do token CSRF
sozinho. O repositório do backend documenta os dois clientes em `docs/sdk/PYTHON.md` e
`docs/sdk/TYPESCRIPT.md`.

## Versões e compatibilidade {#versioning}

- A versão no caminho, `/v1`, só muda em alterações incompatíveis. Um novo `/v2` seria servido ao
  lado de `/v1` por pelo menos uma versão minor.
- A versão **minor** da API aumenta com alterações aditivas (novos endpoints, novos campos
  opcionais, novos valores). `GET /v1/meta` a retorna como `api_version: {"major": 1, "minor": 0}`,
  e toda resposta traz `Axentra-API-Version: 1.0`.
- Chame `GET /v1/meta` na inicialização e recuse-se a rodar quando a major for diferente ou quando a
  minor do servidor for menor que a necessária. Uma minor mais nova não é problema. Os dois SDKs
  fazem isso em `check_compatibility()` / `checkCompatibility()`, e o Studio faz o mesmo (veja
  [Verificação de compatibilidade](help:server-configuration#compatibility)).
- Opcionalmente, envie `Axentra-Client: <name>/<version>; api=<major.minor>` para que os logs do
  servidor mostrem qual cliente chamou.

## Referência da API {#api-reference}

O servidor pode servir o documento OpenAPI em `/v1/openapi.json` e uma referência interativa em
`/v1/docs`. O operador controla isso com `security.api_docs` (exibido como `limits.api_docs` em
[Configurações](help:settings#settings-tree)): `public`, `authenticated` (exige uma sessão ou chave
de API) ou `disabled` (o padrão em produção). O arquivo `openapi/axentra-v1.json` versionado no
repositório do backend sempre descreve o contrato atual.

## Solução de problemas {#troubleshooting}

- **`401 unauthenticated` com uma chave de API**: a chave está errada, revogada ou expirada, ou foi
  rotacionada e o período de carência terminou. Verifique o status da chave em **Chaves de API** e
  envie-a como `Authorization: Bearer axk_...`.
- **`403 forbidden` com “missing or invalid CSRF token”**: uma requisição de navegador autenticada
  por cookie sem `X-Axentra-CSRF`, ou com um token desatualizado. Leia `GET /v1/auth/session` de
  novo.
- **`403` com “cross-origin request refused”**: a origem do seu app não está em
  `security.allowed_origins`. Peça ao operador que a adicione.
- **`404` embora o ID esteja certo**: o recurso pertence a outro produto ou tenant que não o da sua
  chave, ou o módulo está desabilitado (`module_disabled`).
- **`412 precondition_failed`**: alguém alterou o recurso depois que você o leu. Leia de novo e
  tente outra vez com a nova versão.
- **`429 rate_limited`**: aguarde o número de segundos em `Retry-After` e depois reduza o ritmo.
- **`413 payload_too_large`**: o corpo ultrapassa `security.max_body_bytes` (padrão 10 MiB). Envie
  arquivos pelos endpoints de arquivos, que têm um limite próprio.
- **O seu cliente recusa a versão do servidor**: o servidor é mais antigo do que o seu cliente
  precisa, ou tem outra versão major. Use uma versão compatível do cliente.
