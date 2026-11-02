---
title: Webhooks
summary: Envie eventos para outros sistemas como requisições HTTP assinadas, gerencie o segredo de assinatura e verifique, tente novamente e reenvie entregas.
keywords: webhook, endpoint, callback, retorno de chamada, HTTP POST, segredo de assinatura, assinatura, HMAC, whsec, rotacionar segredo, entrega, reenviar, nova tentativa, ping de teste, receptor, integração
---

Um **webhook** permite que outro sistema fique sabendo dos [eventos](help:events) do seu produto
sem precisar perguntar por eles. Você registra um **endpoint**, que é uma URL no outro sistema, e
escolhe quais tipos de evento ele quer receber. Sempre que um evento correspondente é publicado, o
Axentra envia uma requisição HTTP `POST` com o evento em JSON para essa URL. Cada requisição é
**assinada** com um segredo que só o Axentra e o receptor conhecem, para que o receptor possa
verificar se a requisição é legítima. Cada tentativa é registrada como uma **entrega**, que você
pode examinar e enviar de novo.

> [!IMPORTANT]
> Os webhooks exigem o módulo do servidor `events`. Ver endpoints e entregas exige
> `webhooks:read` (proprietários, administradores, suporte e leitores do produto). Criar, editar,
> testar, rotacionar o segredo, reenviar e excluir exigem `webhooks:manage` (proprietários e
> administradores do produto); sem essa permissão, esses botões ficam ocultos e **Configurações**
> fica somente leitura. Um processo worker precisa estar rodando para que as entregas sejam
> enviadas.

## Como funciona a entrega {#how-it-works}

```diagram
webhook-delivery
```

1. Seu produto publica um evento, por exemplo `invoice.created` no tenant `acme`.
2. Um worker procura endpoints **habilitados** cujos **Tipos de evento** correspondem ao tipo e
   cujo **Filtro de tenant** está vazio ou é igual ao tenant do evento. Para cada correspondência,
   ele cria uma entrega com o status **Pendente**.
3. O worker envia a requisição assinada. Uma resposta `2xx` deixa a entrega como **Entregue**.
4. Qualquer outra resposta, um tempo limite esgotado ou um erro de conexão a deixa como **Falhou,
   tentando novamente**: ela é enviada de novo após uma espera crescente. Depois da última
   tentativa, ela fica como **Falha definitiva**.
5. Você pode **Reenviar** uma entrega que não esteja pendente, por exemplo depois de corrigir o
   receptor.

As entregas acontecem **pelo menos uma vez**: um receptor pode receber o mesmo evento duas vezes
(por exemplo, quando a resposta `200` dele se perdeu). Os receptores devem guardar o id do evento e
ignorar duplicatas. Não há ordem garantida entre eventos.

## Criar um endpoint {#create}

1. Abra [Webhooks](app:webhooks) e escolha **Novo endpoint**.
2. Informe a **URL** que deve receber as requisições.
3. Opcional: uma **Descrição** (até 1000 caracteres), por exemplo quem é o responsável pelo
   receptor.
4. Adicione os **Tipos de evento**: digite um tipo ou padrão e pressione Enter ou escolha
   **Adicionar tipo**. O Studio sugere tipos que viu em eventos recentes, além de
   **\* (todos os tipos)**.
5. Opcional: escolha um **Filtro de tenant** e desative **Habilitado** se o receptor ainda não
   estiver pronto.
6. Escolha **Criar endpoint**.
7. Copie o **Segredo de assinatura** que aparece, guarde-o para o receptor, marque **Guardei o
   segredo em local seguro** e escolha **Concluído**. Veja
   [Guardar o segredo de assinatura](help:webhooks#signing-secret).

O Studio então abre a página do endpoint.

### Regras de URL {#url-rules}

Para evitar que webhooks sejam usados para alcançar sistemas internos, o servidor verifica cada URL
ao salvá-la e novamente antes de cada entrega:

- Ela precisa começar com `https://`. `http://` simples só é aceito por servidores fora de produção
  cujos operadores habilitaram `events.webhook_allow_http`.
- Ela não pode conter nome de usuário nem senha (`https://user:pass@…`) nem um fragmento (`#…`).
- `localhost` e nomes de host terminados em `.local`, `.localhost` ou `.internal` são recusados.
- O nome de host é resolvido, e **todos** os endereços para os quais ele aponta precisam ser
  públicos. Redes privadas (como `10.x`, `192.168.x`), loopback, link-local e outros endereços
  especiais são recusados, a menos que os operadores definam
  `events.webhook_allow_private_targets` (pensado para desenvolvimento; em produção, só com uma
  substituição adicional).
- No máximo 2000 caracteres.

Redirecionamentos não são seguidos: uma resposta `301` ou `302` conta como falha. Use a URL final.

### Escolher tipos de evento {#event-types}

Cada endpoint tem de 1 a 50 padrões de tipo de evento. Use tipos exatos (`invoice.created`),
padrões com `*` (`invoice.*`, `*.deleted`) ou `*` para todos os tipos. Os padrões usam letras
minúsculas, dígitos, `_ . : -` e `*`. Eventos com tipos reservados (`axentra.…`) nunca são enviados
aos endpoints, exceto o ping de teste.

### Filtro de tenant {#tenant-filter}

Sem filtro de tenant, o endpoint recebe os eventos correspondentes de **todos os tenants** e os
eventos no nível do produto. Com um filtro, ele recebe apenas os eventos desse tenant. O filtro de
tenant não pode ser alterado depois; nesse caso, crie um novo endpoint.

## Guardar o segredo de assinatura {#signing-secret}

Quando você cria um endpoint (e quando rotaciona o segredo dele), o Axentra gera um segredo de
assinatura que começa com `whsec_`. Ele é mostrado **apenas uma vez**. O Axentra o armazena
criptografado e nunca o exibe de novo.

> [!CAUTION]
> Guarde o segredo no cofre de segredos do seu receptor imediatamente. Qualquer pessoa que o
> conheça pode enviar requisições que o seu receptor aceitará como legítimas. Se você o perder ou
> ele vazar, [rotacione o segredo](help:webhooks#rotate-secret).

O receptor usa o segredo para verificar o cabeçalho `Axentra-Signature` de cada requisição. O
[tutorial do receptor de webhooks](help:tutorial-webhook-receiver#verify-signature) mostra o
algoritmo exato com código em Python e TypeScript.

## Enviar um ping de teste {#test}

Na página do endpoint, escolha **Enviar ping de teste**. O Axentra envia imediatamente uma
requisição assinada com o tipo `axentra.ping` e aguarda a resposta. O Studio informa **Ping de
teste entregue (HTTP 200)** ou **Falha no ping de teste** com o código de status ou o erro, e abre a
entrega registrada.

Um ping de teste é enviado uma única vez, sem novas tentativas, e também para um endpoint
desabilitado, para que você possa testar um receptor antes de habilitá-lo. O corpo dele tem
`"type": "axentra.ping"`, `"data": {"endpoint_id": "…"}` e o id da entrega como `id`.

## Verificar entregas {#deliveries}

A guia **Entregas** de um endpoint lista as entregas dele da mais nova para a mais antiga:
**Evento** (tipo e id da entrega), **Status**, **Resposta** (o código de status HTTP),
**Tentativas**, **Duração** e **Criado em**. Filtre por **Status**; **Atualizar** carrega o estado
mais recente.

### Status das entregas {#delivery-statuses}

| Status                         | Significado                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Pendente**                   | Aguardando envio, sendo enviada ou novamente na fila por causa de **Reenviar**.                            |
| **Entregue**                   | O receptor respondeu com um status `2xx`.                                                                  |
| **Falhou, tentando novamente** | A última tentativa falhou; outra tentativa está planejada (**Próxima tentativa**).                         |
| **Falha definitiva**           | Não há mais tentativas automáticas: todas foram usadas, a URL foi recusada ou o endpoint foi desabilitado. |

### Detalhes da entrega {#delivery-detail}

Selecione o ícone de detalhes no fim de uma linha. O painel mostra **ID da entrega**, **Status**,
**Resposta**, **Tentativas**, **Duração**, o **ID do evento**, o **Job** que faz o envio (um link
para o [job](help:jobs#job-detail)), **Criado em**, **Entregue em** e **Próxima tentativa**, além
de:

- **Último erro**: por exemplo `HTTP 500`, um tempo limite esgotado, `unresolvable: …` ou
  `refused: …`;
- **Corpo da resposta**: os primeiros 4096 bytes (padrão) do que o receptor respondeu. Retornar um
  texto de erro curto no seu receptor facilita o diagnóstico de problemas aqui.

## Novas tentativas {#retries}

Entregas com falha são tentadas de novo automaticamente pela fila de jobs, até **8 tentativas** com
as configurações padrão (`events.webhook_max_attempts`). Webhooks têm um cronograma próprio, mais
lento que o de outros jobs: a espera antes da tentativa _n + 1_ fica entre metade e o total de `120
× 2^(n−1)` segundos, no máximo 6 horas (`events.webhook_backoff_base_seconds`,
`events.webhook_backoff_max_seconds`). Com as configurações padrão, as esperas são de cerca de 2, 4,
8, 16, 32, 64 e 128 minutos; assim, a última tentativa ocorre cerca de **2 a 4¼ horas** depois da
primeira, e uma queda do receptor de até cerca de duas horas é sempre coberta. Cada tentativa
aguarda no máximo 10 segundos pela conexão e por cada leitura da resposta. (Versões do Axentra
anteriores a esse cronograma usavam a espera curta dos jobs e esgotavam todas as tentativas em
poucos minutos.)

Um receptor que fica fora do ar por mais tempo que isso não perde eventos, mas as entregas dele
terminam como **Falha definitiva**: reenvie-as quando ele voltar. O Axentra não desabilita
endpoints que falham repetidamente e não tem limite de taxa por endpoint.

Dois casos encerram uma entrega sem novas tentativas: uma URL que o servidor recusa (veja as
[regras de URL](help:webhooks#url-rules)) e um endpoint que foi desabilitado enquanto a entrega
aguardava. Um nome de host que não pode ser resolvido é tentado de novo.

## Reenviar {#redeliver}

1. Abra os detalhes da entrega.
2. Escolha **Reenviar**.

A entrega passa para **Pendente** e é enviada de novo com um novo conjunto de tentativas. O
contador **Tentativas** continua contando. **Reenviar** não é oferecido enquanto a entrega está
**Pendente**. O receptor recebe o mesmo id de evento de novo, então um receptor que elimina
duplicatas ignora os eventos que já processou.

## Rotacionar o segredo de assinatura {#rotate-secret}

Rotacione o segredo quando ele puder ter vazado, quando alguém que o conhecia sair ou regularmente,
como boa prática.

1. Na página do endpoint, escolha **Rotacionar segredo**.
2. Escolha um **Período de carência**: **Nenhum (o segredo antigo para imediatamente)**,
   **1 hora**, **24 horas** ou **7 dias**.
3. Escolha **Rotacionar segredo** e depois copie e guarde o novo segredo, como na criação.

Durante o período de carência, cada requisição leva **duas** assinaturas: uma feita com o novo
segredo e outra com o segredo anterior. Um receptor que ainda tem o segredo antigo continua
funcionando enquanto você o atualiza. A página do endpoint mostra **Segredo anterior ainda válido**
até o fim do período.

> [!TIP]
> Para rotacionar sem entregas com falha: escolha um período de carência, coloque o novo segredo no
> receptor e confira se as entregas continuam funcionando antes do fim do período. Com **Nenhum**, o
> receptor rejeita todas as requisições até ter o novo segredo.

## Editar ou desabilitar um endpoint {#edit}

Abra a guia **Configurações** do endpoint, altere **URL**, **Descrição**, **Tipos de evento** ou
**Habilitado** e escolha **Salvar alterações**. **Descartar alterações** restaura os valores
salvos.

Desativar **Habilitado** interrompe novas entregas. As entregas que ainda aguardavam uma tentativa
terminam como **Falha definitiva** com o erro `endpoint disabled`; reenvie-as depois de habilitar o
endpoint de novo. Eventos publicados enquanto o endpoint estava desabilitado não são entregues
depois.

## Excluir um endpoint {#delete}

Escolha **Excluir endpoint** e confirme. O endpoint não recebe mais nada, e o histórico de entregas
dele é excluído junto. Isso não pode ser desfeito. Para pausar um endpoint, desabilite-o.

## Formato da requisição {#request-format}

```http
POST /hooks/axentra HTTP/1.1
Host: example.com
Content-Type: application/json
User-Agent: Axentra-Webhooks/1
Axentra-Event: invoice.created
Axentra-Event-Id: evt_01EXAMPLE
Axentra-Delivery: dlv_01EXAMPLE
Axentra-Signature: t=1767225600,v1=9c1e…(64 hex characters)

{"data":{"invoice_id":"inv_123"},"id":"evt_01EXAMPLE","occurred_at":"2026-01-01T00:00:00+00:00","product_id":"prd_01EXAMPLE","tenant_id":"ten_01EXAMPLE","type":"invoice.created"}
```

| Campo                     | Conteúdo                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `id`                      | Id do evento, idêntico ao cabeçalho `Axentra-Event-Id`. Use-o para eliminar duplicatas. |
| `type`                    | Tipo de evento.                                                                         |
| `product_id`, `tenant_id` | Onde o evento aconteceu; `tenant_id` é `null` para eventos no nível do produto.         |
| `occurred_at`             | Quando o evento aconteceu (ISO 8601, UTC).                                              |
| `data`                    | O objeto de dados do evento.                                                            |

`Axentra-Delivery` identifica a entrega e é o mesmo em todas as tentativas e reenvios dela.
Verifique a assinatura sobre os bytes **brutos** do corpo; não faça o parse do JSON e o serialize
de novo antes.

## Configurações {#settings}

| Configuração                      | O que faz                                                     | Valores permitidos / padrão                                           |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| **URL**                           | Para onde as requisições são enviadas.                        | URL `https://`, host público, no máximo 2000 caracteres. Obrigatória. |
| **Descrição**                     | Observação para pessoas.                                      | Até 1000 caracteres.                                                  |
| **Tipos de evento**               | Quais eventos são enviados.                                   | De 1 a 50 tipos ou padrões com `*`. Obrigatório.                      |
| **Filtro de tenant**              | Limita o endpoint a um tenant.                                | Um tenant ou **Todos os tenants**. Somente na criação.                |
| **Habilitado**                    | Se novas entregas são enviadas.                               | Padrão: ativado.                                                      |
| **Período de carência** (rotação) | Por quanto tempo o segredo anterior ainda assina requisições. | Nenhum, 1 hora, 24 horas, 7 dias (API: até 7 dias, em segundos).      |

Padrões do servidor (os operadores podem alterá-los em `[events]`): 8 tentativas distribuídas em
cerca de 2 a 4¼ horas, tempo limite de 10 segundos, 4096 bytes de corpo de resposta armazenado.

## Bom saber {#good-to-know}

- Endpoints, entregas, testes e rotações também estão disponíveis pela API em
  `/v1/products/{product_id}/webhooks`; veja [noções básicas da API](help:api-basics).
- Criar, alterar, excluir, testar, rotacionar e reenviar ficam registrados no
  [log de auditoria](help:audit).
- Entregas concluídas e com falha definitiva são excluídas após o período de retenção (30 dias por
  padrão).

## Solução de problemas {#troubleshooting}

**“webhook urls must use https”.** Use uma URL `https://`. `http://` só funciona em servidores de
desenvolvimento que o permitem.

**“webhook urls must not point to local hosts” ou “… private, loopback or link-local addresses”.** A
URL aponta para a sua própria máquina ou para uma rede interna. Use um endereço HTTPS público, por
exemplo por meio de um serviço de túnel durante o desenvolvimento (veja o
[tutorial](help:tutorial-webhook-receiver#public-url)).

**“event_types needs 1-50 type patterns”.** Adicione pelo menos um tipo de evento, ou `*` para
todos.

**Falha no ping de teste com HTTP 401 ou 403.** O receptor rejeitou a assinatura. Confira se ele usa
o segredo atual (o valor completo, incluindo `whsec_`), o corpo bruto da requisição e um relógio
correto (timestamps com mais de cerca de 5 minutos são rejeitados).

**Falha no ping de teste com HTTP 404 ou 405.** O caminho está errado ou o receptor não aceita
`POST`.

**Falha no ping de teste sem código de status.** Não foi possível alcançar o receptor: leia o
**Último erro**. `unresolvable` significa que o nome de host não existe no DNS; um tempo limite
esgotado significa que o receptor não respondeu em 10 segundos. Responda rapidamente e faça o
trabalho demorado depois de responder.

**Entregas com Falha definitiva e “refused: …”.** O host agora resolve para um endereço privado.
Corrija a entrada de DNS ou a URL e reenvie.

**Entregas com Falha definitiva e “endpoint disabled”.** O endpoint foi desabilitado enquanto elas
aguardavam. Habilite-o e reenvie.

**Nenhuma entrega aparece para um evento.** Verifique se o endpoint está habilitado, se um padrão de
tipo de evento corresponde e qual é o filtro de tenant. Eventos publicados antes de o endpoint
existir não são entregues. Se o evento está no [log de eventos](help:events#event-log), mas nada
acontece, talvez nenhum worker esteja rodando.

**“Conflito” ao reenviar.** A entrega já está na fila ou sendo enviada. Aguarde e escolha
**Atualizar**.

**“Alterado nesse meio-tempo” ao salvar ou excluir.** Outra pessoa alterou o endpoint. Recarregue a
página e repita sua alteração.

**O receptor processou um evento duas vezes.** Isso é esperado na entrega “pelo menos uma vez”.
Elimine duplicatas pelo `Axentra-Event-Id`.
