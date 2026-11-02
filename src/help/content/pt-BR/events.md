---
title: Eventos
summary: Navegue pelo log de eventos, acompanhe os eventos ao vivo à medida que acontecem, entenda o indicador de conexão e publique um evento de teste.
keywords: evento, log de eventos, evento de domínio, ao vivo, stream, SSE, server-sent events, tempo real, publicar, tipo de evento, assinante, outbox, Last-Event-ID
---

Um **evento** é uma mensagem curta que diz “algo aconteceu” no seu produto, por exemplo
`invoice.created` ou `user.invited`. Cada evento tem um **tipo**, o momento em que **ocorreu**, o
tenant ao qual pertence, quem o causou (o **autor**) e um objeto JSON com os detalhes (os
**dados**). Outras partes do sistema reagem aos eventos: assinantes no mesmo processo, no código
do seu produto, e [endpoints de webhook](help:webhooks) em outros sistemas. A tela **Eventos**
permite olhar para trás e ver o que aconteceu (**Log de eventos**) e acompanhar a chegada de novos
eventos (**Ao vivo**).

Eventos não são a mesma coisa que o [log de auditoria](help:audit): o log de auditoria registra
quem alterou o quê no Axentra, para fins de conformidade, enquanto os eventos são mensagens que o
seu produto publica para que outros sistemas reajam a elas.

> [!IMPORTANT]
> Os eventos exigem o módulo do servidor `events`. Ver o log e a visualização ao vivo exige
> `jobs:read` (a permissão abrange jobs e eventos). **Publicar evento** exige `events:publish` em
> pelo menos um tenant (proprietários, administradores e membros de tenant a têm); sem ela, o botão
> fica oculto.

## Tipos de evento {#event-types}

Um tipo de evento é um nome em minúsculas, normalmente _objeto.ação_: `invoice.created`,
`order.shipped`, `crm.contact:merged`. Ele começa com uma letra minúscula e pode conter letras
minúsculas, dígitos e `_ . : -`, com até 150 caracteres. Tipos que começam com `axentra.` são
reservados para o próprio Axentra (por exemplo `axentra.ping`, o teste de webhook).

O Axentra não mantém uma lista de tipos “permitidos”: o seu produto os define ao publicar. Várias
telas aceitam **padrões** em que `*` representa qualquer texto: `invoice.*` corresponde a
`invoice.created` e `invoice.paid`, e `*` sozinho corresponde a todos os tipos.

## Navegar pelo log de eventos {#event-log}

Abra [Eventos](app:events). A guia **Log de eventos** lista os eventos do mais novo para o mais
antigo, com **Tipo**, **Tenant** (ou **Nível do produto**), **Autor** e **Ocorrido em**. O autor
mostra o tipo de chamador (`user`, `api_key` ou `system`) e o id dele. Role para baixo e carregue
mais para voltar no tempo.

### Filtrar por tipo e tenant {#filter}

- **Tipo**: um tipo exato (`invoice.created`) ou um prefixo que termina com `*` (`invoice.*`,
  `crm.*`). O filtro do log só aceita `*` no final.
- **Tenant**: apenas os eventos de um tenant.

Escolha **Aplicar filtros**; **Redefinir filtros** os limpa. Os filtros ficam no endereço da
página.

### Detalhes do evento {#event-detail}

Selecione o ícone de detalhes no fim de uma linha. O painel mostra **ID do evento**, **Tipo**,
**Ocorrido em**, **Tenant**, **Autor**, **ID da requisição** (para encontrar a requisição à API nos
logs do servidor), **Chave de idempotência** (se quem publicou informou uma) e os **Dados** como
JSON.

## Acompanhar eventos ao vivo {#live}

Abra a guia **Ao vivo**. O Studio abre uma conexão com o stream de eventos do servidor e mostra os
eventos **publicados a partir de agora**, com os mais novos no topo. Os eventos anteriores estão no
**Log de eventos**.

1. Opcional: informe **Tipos**, um ou mais padrões separados por vírgulas (por exemplo
   `invoice.*, user.created`), e escolha **Aplicar**. Deixe o campo vazio para ver todos os tipos.
   Aplicar um filtro limpa a lista e reconecta.
2. Acompanhe a chegada dos eventos. Selecione **Mostrar dados** em uma entrada para ver o evento
   completo e a posição dele no stream.

A visualização ao vivo mantém os 200 eventos mais recentes; os mais antigos saem da lista, mas
continuam no log.

### Status da conexão {#connection-status}

O indicador acima da lista (e ao lado de **Atualizações ao vivo** na tela
[Jobs](help:jobs#live-updates)) informa se você está realmente recebendo atualizações:

| Indicador            | Significado                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Conectando…**      | O Studio está abrindo a conexão.                                                                                              |
| **Ao vivo**          | A conexão está aberta; novos eventos aparecem em cerca de um segundo.                                                         |
| **Ao vivo, pausado** | Conectado, mas a exibição está pausada (veja abaixo).                                                                         |
| **Reconectando**     | A conexão caiu ou o servidor a encerrou. O Studio tenta de novo automaticamente e mostra quando (_próxima tentativa em … s_). |
| **Desconectado**     | O Studio parou de tentar, por exemplo porque sua sessão ou permissão mudou. O motivo aparece ao lado; escolha **Reconectar**. |
| **Não conectado**    | Você escolheu **Desconectar**.                                                                                                |

O servidor encerra cada stream após uma hora e verifica sua sessão e sua permissão a cada 15
segundos (configurações padrão). Depois de um encerramento normal ou de um problema de rede, o
Studio se reconecta e **continua de onde parou**, então nenhum evento se perde nesse intervalo. Se
o seu acesso foi revogado, o stream é fechado com _O acesso ao stream foi perdido (a sessão ou a
permissão mudou)._

### Pausar, retomar e limpar {#pause}

- **Pausar** congela a lista para que você possa lê-la. A conexão continua aberta e os novos
  eventos são acumulados. **Retomar** os mostra (o botão os conta, por exemplo
  **Retomar (3 eventos novos)**).
- **Desconectar** fecha a conexão. **Conectar** a abre de novo e continua após o último evento que
  você recebeu, então os eventos publicados nesse meio-tempo também aparecem.
- **Limpar** esvazia a lista na sua tela. Não exclui nenhum evento.

## Publicar um evento de teste {#publish}

Publicar um evento manualmente é útil para testar um endpoint de webhook ou um assinante.

1. Escolha **Publicar evento**.
2. Escolha o **Tenant**. Os eventos publicados aqui sempre pertencem a um tenant.
3. Informe o **Tipo**, por exemplo `invoice.created`.
4. Informe os **Dados** como objeto JSON, por exemplo `{"invoice_id": "inv_123"}`.
5. Escolha **Publicar**.

O evento aparece no log e é entregue a todos os endpoints de webhook habilitados cujos tipos de
evento correspondem, e aos assinantes do seu produto. É um evento real: os receptores não
conseguem distingui-lo de um publicado pelo seu produto, então use dados de teste e um tenant
destinado a testes.

| Configuração | O que faz                                                                  | Valores permitidos / padrão                                   |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Tenant**   | O tenant ao qual o evento pertence. Você precisa de `events:publish` nele. | Obrigatório.                                                  |
| **Tipo**     | O tipo de evento pelo qual os receptores filtram.                          | Veja [Tipos de evento](help:events#event-types). Obrigatório. |
| **Dados**    | Detalhes do evento.                                                        | Objeto JSON, no máximo 64 KB. Padrão `{}`.                    |

O Studio envia uma chave de idempotência em cada diálogo de publicação, então um clique duplo
publica apenas uma vez.

## Para desenvolvedores {#developers}

- **Outbox transacional.** O código do produto publica com `ax.events.publish_in_tx(...)` dentro da
  própria transação de banco de dados. O evento existe se, e somente se, a transação for
  confirmada; assim, nenhum evento é enviado para uma alteração que foi revertida.
- **A entrega a assinantes e webhooks** passa por [jobs](help:jobs#system-kinds)
  (`axentra.event.dispatch`, `axentra.event.handle`, `axentra.webhook.deliver`), cada um pelo menos
  uma vez. Não há garantia de ordem entre eventos.
- **API.** `GET /v1/products/{product_id}/events?type=&tenant_id=` lista eventos,
  `GET /events/{event_id}` retorna um, e `POST /tenants/{tenant_id}/events` publica (com um
  cabeçalho `Idempotency-Key` opcional).
- **Streams (SSE).** `GET /events/stream?types=invoice.*,user.created` e `GET /jobs/stream` enviam
  mensagens com `id:` (a posição no stream), `event:` (o tipo de evento, ou `job.<status>` no
  stream de jobs) e `data:` em JSON. Envie o último `id` de volta como `Last-Event-ID` para
  retomar; `Last-Event-ID: 0` reproduz tudo o que ainda está retido. Com `?tenant_id=`, a permissão
  é verificada nesse tenant, então chaves de API vinculadas a um tenant podem acompanhar o stream do
  tenant delas. O stream de jobs mostra o estado mais recente de cada job alterado, então estados
  intermediários podem ser pulados.
- **Retenção.** Os eventos são excluídos após o período de retenção de jobs (30 dias por padrão),
  desde que nenhuma entrega esteja pendente.

## Bom saber {#good-to-know}

- A visualização ao vivo mostra apenas os eventos que chegam enquanto ela está aberta. Para ver o
  que aconteceu antes, use o **Log de eventos**.
- As sugestões de tipo no formulário de webhook vêm dos eventos mais recentes deste log, porque não
  há um catálogo central de tipos.

## Solução de problemas {#troubleshooting}

**O log está vazio.** Seu produto ainda não publicou eventos ou os filtros os excluem. Escolha
**Redefinir filtros**. Publique um evento de teste para verificar a configuração.

**“Informe um tipo exato ou um prefixo terminado em \* (por exemplo invoice.\*).”** O filtro do
log aceita `invoice.created` ou `invoice.*`, mas não um `*` no meio. Na visualização ao vivo e nos
webhooks, padrões como `*.created` são permitidos.

**O indicador fica em Reconectando.** O Studio não consegue alcançar o stream do servidor. Verifique
sua rede e o status do servidor. Proxies que armazenam respostas em buffer também podem
interromper streams; avise os operadores.

**Desconectado com “O acesso ao stream foi perdido”.** Sua sessão terminou ou sua função mudou.
Entre novamente, se necessário, e escolha **Reconectar**.

**“Não permitido” ao abrir Eventos.** Você precisa de `jobs:read` neste produto. Peça a um
proprietário ou administrador do produto uma função que a inclua; veja
[Funções e permissões](help:roles-permissions).

**“Tipos que começam com “axentra.” são reservados”.** Escolha um tipo com um prefixo próprio, por
exemplo `invoice.created`.

**“Já usada para outra requisição” ao publicar.** Uma tentativa anterior do mesmo diálogo usou
outros valores. O Studio já criou uma nova chave: escolha **Publicar** novamente.

**Um evento publicado não chegou a um webhook.** Verifique se o endpoint está habilitado, se um dos
tipos de evento dele corresponde e se o filtro de tenant dele (se definido) é o tenant do evento.
Depois, consulte as [entregas](help:webhooks#deliveries) do endpoint. Se não houver nenhuma
entrega, talvez nenhum worker esteja rodando para despachar o evento.
