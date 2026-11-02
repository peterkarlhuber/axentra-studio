---
title: Jobs
summary: Acompanhe jobs em segundo plano, entenda os status e as novas tentativas, enfileire um job manualmente e tente novamente ou cancele um job.
keywords: job, job em segundo plano, tarefa, fila, worker, nova tentativa, tentar novamente, cancelar, dead letter, falha definitiva, falhou, tentativas, backoff, enfileirar, chave de idempotência, handler
---

Um **job** é uma tarefa executada em segundo plano, em vez de enquanto alguém espera uma tela
carregar: enviar um relatório mensal, importar um arquivo, entregar um webhook. Seu produto, um
agendamento ou o próprio Axentra coloca jobs em uma fila, e um processo separado, o **worker**,
os pega e executa o código (o **handler**) que pertence ao **tipo** do job. A tela **Jobs** mostra
o que está aguardando, o que está em execução, o que funcionou e o que falhou, e permite que os
operadores tentem novamente ou cancelem jobs.

> [!IMPORTANT]
> Os jobs exigem o módulo do servidor `events`; sem ele, **Jobs** não aparece na barra lateral.
> Visualizar exige a permissão `jobs:read` (proprietários, administradores, suporte e leitores do
> produto a têm). **Enfileirar job**, **Tentar novamente** e **Cancelar job** exigem
> `jobs:manage`; sem essa permissão, esses botões ficam ocultos. Os jobs só rodam enquanto houver
> pelo menos um processo worker (`axentra worker`) em execução. Isso é uma tarefa de operação;
> veja [Configuração do servidor](help:server-configuration).

## Ler a lista de jobs {#jobs-list}

Abra [Jobs](app:jobs). A lista mostra primeiro os jobs mais novos, com **Tipo**, **Status**,
**Tentativas** (por exemplo `2 of 5`), **Tenant** (ou **Nível do produto** para jobs que não
pertencem a um tenant), **Criado em** e **Atualizado em**. Selecione um tipo para abrir os detalhes
do job.

### Contadores da visão geral {#overview}

O cartão **Visão geral** conta os jobs por status. Selecione um contador para mostrar apenas esses
jobs. Abaixo dos contadores, você vê quantos jobs foram concluídos e quantos falharam nas últimas
24 horas (o número de falhas inclui os jobs com **Falha definitiva**) e quando foi criado o **Job
mais antigo na fila**. Se esse horário continuar ficando mais antigo, nenhum worker está pegando
jobs: verifique se há um worker em execução e se ele trata esse tipo.

### Filtrar jobs {#filter}

Filtre por **Status**, pelo **Tipo** exato (por exemplo `reports.send`) e por **Tenant** e escolha
**Aplicar filtros**. **Redefinir filtros** os limpa. Os filtros fazem parte do endereço da página,
então você pode salvar nos favoritos ou compartilhar uma visualização filtrada.

### Acompanhar alterações ao vivo {#live-updates}

Ative **Atualizações ao vivo** para acompanhar o stream de jobs do servidor. O Studio então
atualiza a lista e os contadores (no máximo uma vez por segundo) sempre que um job muda. O
indicador ao lado da chave mostra o estado da conexão; veja
[Status da conexão](help:events#connection-status). Sem atualizações ao vivo, a lista só muda
quando você a recarrega.

## Status dos jobs {#statuses}

```diagram
job-lifecycle
```

| Status               | Significado                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Na fila**          | Aguardando um worker. Um job com atraso ou aguardando a próxima tentativa também está na fila.                          |
| **Em execução**      | Um worker pegou o job e mantém uma reserva com tempo limitado sobre ele.                                                |
| **Concluído**        | O handler terminou. O valor retornado é armazenado como **Resultado**.                                                  |
| **Falhou**           | O handler informou um erro permanente (lançou `PermanentJobError`). Não há mais tentativas automáticas.                 |
| **Falha definitiva** | Todas as tentativas foram usadas. O job é mantido como “dead letter” para que você possa examiná-lo e tentar novamente. |
| **Cancelado**        | Cancelado antes de começar, ou o handler parou depois de um pedido de cancelamento.                                     |

**Falhou** e **Falha definitiva** são ambos finais, mas por motivos diferentes: **Falhou**
significa que o handler decidiu que tentar de novo não adianta; **Falha definitiva** significa que
todas as tentativas terminaram com erro.

## Tentativas, novas tentativas e backoff {#retries}

Toda vez que um worker pega um job, o contador de tentativas dele aumenta em um. Quando uma
tentativa termina com um erro comum, o job volta para **Na fila** e aguarda antes da próxima
tentativa. A espera cresce exponencialmente: fica entre metade e o total de `2 × 2^(n−1)` segundos
após a tentativa _n_ (2, 4, 8, 16 … segundos com as configurações padrão, nunca mais de uma hora).
Esse “backoff” dá a um problema temporário, como um serviço externo sobrecarregado, tempo para se
recuperar. A parte aleatória evita que muitos jobs com falha tentem de novo no mesmo instante.

Quando a última tentativa permitida falha, o job passa para **Falha definitiva**. O padrão é **5**
tentativas; então, com as configurações padrão, um job que sempre falha chega à falha definitiva
depois de cerca de meio minuto. Você pode definir **Máx. de tentativas** entre 1 e 100 ao
enfileirar um job ou criar um agendamento.

Um worker que trava deixa de renovar a reserva. Depois que a reserva expira (60 segundos por
padrão), outro worker devolve o job à fila. A execução perdida conta como tentativa.

> [!WARNING]
> Os jobs rodam **pelo menos uma vez**, não exatamente uma vez. Um job pode rodar duas vezes, por
> exemplo depois de um travamento do worker ou quando o resultado não pôde ser salvo. Os handlers
> precisam ser idempotentes: executá-los duas vezes deve ter o mesmo efeito que executá-los uma
> vez.

## Abrir os detalhes de um job {#job-detail}

Selecione o tipo de um job na lista. A página de detalhes mostra:

- **Detalhes**: **ID do job**, **Tipo**, **Status**, **Tenant**, **Tentativas**, **Prioridade**,
  **Chave de idempotência**, o **Agendamento** que criou o job (um link), o **Worker** que o
  executa ou executou, se **Cancelamento solicitado** está marcado, e **Criado por** (o id de um
  usuário ou de uma chave de API, ou `schedule:<id>` para jobs agendados).
- **Linha do tempo**: **Criado em**, **Executar após** (o horário de início mais cedo possível,
  incluindo atrasos e backoff), **Iniciado em**, **Reservado até**, **Finalizado em** e
  **Atualizado em**.
- **Último erro**: a mensagem de erro da tentativa com falha mais recente, no máximo 2000
  caracteres. O servidor remove tokens, chaves de API e strings de conexão antes de armazenar a
  mensagem.
- **Payload** e **Resultado** como JSON. Valores em chaves como `password`, `secret`, `token` ou
  `api_key` aparecem como `[redacted]`.

Enquanto um job está **Na fila** ou **Em execução**, a página se atualiza sozinha a cada 3
segundos.

## Enfileirar um job {#enqueue}

Normalmente você não enfileira jobs manualmente: o código do seu produto e os agendamentos fazem
isso. Enfileirar no Studio é útil para iniciar uma execução avulsa ou testar um handler.

1. Abra [Jobs](app:jobs) e escolha **Enfileirar job**.
2. Informe o **Tipo**, por exemplo `reports.send`. Ele precisa corresponder a um handler que um
   worker executa.
3. Opcional: informe o **Payload** como objeto JSON (a entrada do handler), escolha um **Tenant**
   e defina **Prioridade**, **Atraso (segundos)** e **Máx. de tentativas**.
4. Escolha **Enfileirar**. O Studio abre a página de detalhes do novo job.

| Configuração              | O que faz                                                                               | Valores permitidos / padrão                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**                  | Seleciona o handler que executa o job.                                                  | Começa com uma letra minúscula, seguida de letras minúsculas, dígitos e `_ . : -`, no máximo 100 caracteres. `axentra.` é reservado. Obrigatório. |
| **Payload**               | Entrada para o handler.                                                                 | Objeto JSON, no máximo 64 KB. Padrão `{}`.                                                                                                        |
| **Tenant**                | Executa o job no escopo de um tenant; o handler então só alcança os dados desse tenant. | Um tenant do produto ou **Nível do produto**.                                                                                                     |
| **Prioridade**            | Valores mais altos são pegos primeiro quando vários jobs estão prontos.                 | −100 a 100. Padrão 0.                                                                                                                             |
| **Atraso (segundos)**     | O job não começa antes de passar essa quantidade de segundos.                           | 0 a um ano. Padrão 0.                                                                                                                             |
| **Máx. de tentativas**    | Quantas vezes o job é tentado antes de passar para **Falha definitiva**.                | 1 a 100. Vazio: padrão do servidor (5).                                                                                                           |
| **Chave de idempotência** | Protege contra a criação do mesmo job duas vezes.                                       | 1 a 200 caracteres imprimíveis. O Studio preenche uma chave aleatória.                                                                            |

> [!CAUTION]
> Não coloque segredos (senhas, chaves de API) em um payload. Os payloads são armazenados como
> foram enviados e podem ser lidos por todos que têm `jobs:read` (nomes comuns de campos secretos
> só são ocultados na exibição). Passe ids e deixe o handler ler o segredo.

### Chave de idempotência {#idempotency-key}

O Studio gera uma nova chave toda vez que você abre o diálogo. Se você enviar duas vezes (um
clique duplo ou uma nova tentativa após um tempo limite), o servidor devolve o job criado pelo
primeiro envio em vez de criar um segundo. A chave é única por produto, tenant e tipo enquanto o
job existir.

Se a mesma chave já foi usada com outro payload ou outra prioridade, ou por outro chamador que não
pode ler jobs, o servidor recusa a requisição. O Studio então mostra **Já usada para outra
requisição** e oferece **Usar nova chave**.

## Tentar novamente um job com falha {#retry}

1. Abra o job ou abra o menu de ações da linha dele na lista.
2. Escolha **Tentar novamente** e confirme.

O job volta para **Na fila** com o contador de tentativas zerado, então recebe de novo o número
total de tentativas. **Tentar novamente** só é oferecido para jobs com **Falhou** e **Falha
definitiva**. Corrija a causa primeiro (veja **Último erro**); caso contrário, o job falha de novo.

## Cancelar um job {#cancel}

1. Abra o job ou abra o menu de ações da linha dele.
2. Escolha **Cancelar job** e confirme.

O que acontece depende do status:

- Um job **Na fila** é cancelado na hora e nunca roda.
- Para um job **Em execução**, o cancelamento é _solicitado_. A lista mostra **Cancelamento
  solicitado**. O handler percebe o pedido na próxima vez que verificar (os handlers verificam
  entre etapas) e para; o job termina então como **Cancelado**. Se o handler terminar o trabalho
  antes, o job termina como **Concluído**, porque o trabalho foi feito.

Jobs que já terminaram não podem ser cancelados.

## Para desenvolvedores e operadores {#developers}

### Handlers e workers {#workers}

Os handlers são registrados em Python com `ax.jobs.register("reports.send", handler)` e executados
por `axentra worker`. Um worker só pega os tipos para os quais tem um handler. Um job cujo tipo
nenhum worker em execução trata permanece **Na fila** indefinidamente; ele não falha. Os handlers
podem:

- retornar um valor JSON, que se torna o **Resultado** (maior que 64 KB: substituído por um aviso
  de truncamento);
- lançar `PermanentJobError` para terminar imediatamente como **Falhou**;
- lançar `RetryJob(delay_seconds=…)` para tentar de novo após um atraso escolhido por eles;
- chamar `ctx.heartbeat()` durante trabalhos longos para renovar a reserva, e
  `ctx.cancel_requested()` para perceber um cancelamento.

A lista de jobs e as estatísticas também estão disponíveis pela API:
`GET /v1/products/{product_id}/jobs`, `/jobs/stats` e o stream SSE `/jobs/stream`. Veja
[noções básicas da API](help:api-basics).

### Quem pode enfileirar cada tipo {#kind-permissions}

Quem tem `jobs:manage` pode enfileirar qualquer tipo que não comece com `axentra.`. Pela API,
membros de tenant que têm apenas `events:publish` só podem enfileirar um tipo quando o produto o
liberou explicitamente para eles; caso contrário, o servidor responde “não permitido”. O Studio só
oferece **Enfileirar job** a quem tem `jobs:manage`.

### Tipos de job integrados {#system-kinds}

O Axentra usa a fila para o próprio trabalho, então você verá estes tipos na lista:

| Tipo                      | Finalidade                                                            |
| ------------------------- | --------------------------------------------------------------------- |
| `axentra.event.dispatch`  | Distribui um evento publicado para assinantes e endpoints de webhook. |
| `axentra.event.handle`    | Executa um assinante no mesmo processo para um evento.                |
| `axentra.webhook.deliver` | Envia uma entrega de webhook; veja [Webhooks](help:webhooks#retries). |

Você não pode enfileirar tipos `axentra.` por conta própria, mas pode tentar novamente e cancelar
esses jobs como os outros.

### Retenção {#retention}

Jobs finalizados (**Concluído**, **Falhou**, **Falha definitiva**, **Cancelado**) são excluídos
após 30 dias por padrão (`observability.job_retention_days`). Jobs na fila e em execução nunca são
removidos.

## Bom saber {#good-to-know}

- Não há ordem garantida. Prioridade mais alta primeiro, depois horário de início mais cedo, mas
  novas tentativas e workers em paralelo alteram a ordem dos jobs.
- Cada job é entregue a exatamente um worker por tentativa.
- Todo enfileiramento, nova tentativa e cancelamento é registrado no
  [log de auditoria](help:audit) (`events.job.enqueue`, `events.job.retry`, `events.job.cancel`).
- A verificação de prontidão do servidor não inclui os workers. Acompanhe o **Job mais antigo na
  fila**.

## Solução de problemas {#troubleshooting}

**Os jobs ficam Na fila e nunca começam.** Nenhum worker está em execução, ou nenhum dos workers em
execução tem um handler para esse tipo. Verifique o horário do **Job mais antigo na fila**, peça
aos operadores que iniciem `axentra worker` (com `--load` para os handlers do seu produto) e
confira a grafia do tipo. Verifique também **Executar após**: um job com atraso ou aguardando nova
tentativa fica na fila de propósito.

**Um job está com Falha definitiva.** Todas as tentativas falharam. Leia o **Último erro** na
página de detalhes, corrija a causa (por exemplo um registro ausente ou um serviço inacessível) e
escolha **Tentar novamente**.

**Um job ficou como Falhou após uma tentativa.** O handler informou um erro permanente, então o
Axentra não tentou de novo. Leia o **Último erro**. Tente novamente só depois de corrigir a causa.

**“Verifique os dados informados” ao enfileirar.** O servidor rejeitou um valor; a mensagem abaixo
do título o indica, por exemplo `kind must be 1-100 characters…`, `payload is larger than 64000
bytes`, `priority must be between -100 and 100` ou `job kinds starting with 'axentra.' are
reserved`. Corrija o campo e envie novamente.

**“Não permitido” ao enfileirar.** Você precisa de `jobs:manage`. Uma mensagem como `job kind … is
not open to tenant callers` significa que o tipo só pode ser enfileirado por operadores.

**“Já usada para outra requisição”.** A chave de idempotência pertence a outra requisição de job.
Escolha **Usar nova chave** para criar um novo job ou repita a requisição original sem alterações.

**“Conflito” ao tentar novamente ou cancelar.** O status do job mudou nesse meio-tempo (por
exemplo, ele terminou enquanto você confirmava). Recarregue a página; **Tentar novamente** só
funciona para jobs com **Falhou** e **Falha definitiva**, e **Cancelar job** só para jobs
**Na fila** e **Em execução**.

**Cancelamento solicitado, mas o job continua rodando.** O handler só para quando verifica se houve
cancelamento. Handlers que nunca verificam rodam até o fim e então contam como **Concluído**. Se o
worker travar, o job volta para a fila depois que a reserva expirar.

**Um job rodou duas vezes.** Isso é esperado na execução “pelo menos uma vez”. Torne o handler
idempotente, por exemplo verificando se o trabalho já foi feito.
