---
title: Integridade do sistema e monitoramento
summary: Verifique se o servidor Axentra está no ar e pronto, leia as métricas e veja as configurações de retenção, rastreamento e logs que ele informa.
keywords: integridade, saúde, status, prontidão, atividade, disponibilidade, uptime, 503, monitoramento, métricas, Prometheus, scrape, coleta, OpenTelemetry, rastreamento, nível de log, retenção, limpeza, versão
---

Duas páginas mostram como o servidor Axentra está. **Integridade do sistema** responde "o servidor
está no ar e consegue atender requisições?" e mostra quais versões do servidor e do Studio estão em
execução. **Monitoramento** acrescenta as métricas do próprio servidor (contagem de requisições,
erros, tempos de resposta) e as configurações de manutenção, retenção, rastreamento e logs que ele
informa. Operadores as usam para uma olhada rápida; para alertas e histórico, conecte um sistema de
monitoramento de verdade (veja [Para operadores](#for-operators)).

> [!IMPORTANT]
> As duas páginas estão abertas a todo usuário conectado e não dependem de um módulo. Os cartões
> **Manutenção e retenção** e **Rastreamento e logs** exigem `platform:settings` (funções da
> plataforma) ou `product:manage` em pelo menos um produto (**Product owner**, **Product admin**).
> O cartão **Métricas** depende da configuração de métricas do servidor, não da sua função (veja
> [Métricas](#metrics)).

## Verificar se o servidor está íntegro {#check-health}

1. Abra **Auditoria e monitoramento** › **Integridade do sistema** ([abrir](app:health)).
2. Leia o cartão **Prontidão**: o status geral e uma linha por verificação.
3. Leia o cartão **Atividade**: **OK** significa que o processo do servidor responde.
4. Escolha **Atualizar** para verificar de novo na hora. Os dois cartões também se atualizam a cada
   30 segundos; **Atualizado …** informa quando o resultado da prontidão foi obtido.

### Prontidão {#readiness}

A prontidão pergunta ao servidor se ele consegue atender requisições agora (`GET /v1/health/ready`).
O servidor executa cada verificação e só responde **OK** quando todas passam; caso contrário,
responde com HTTP `503` e o status **Indisponível**, e o Studio ainda lista todas as verificações
para que você veja qual falha.

| Verificação       | Presente quando                                      | Passa quando                                                                                                                   |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `database`        | sempre                                               | O servidor alcança o banco de dados PostgreSQL                                                                                 |
| `notify_provider` | o módulo notify está habilitado                      | A configuração do provedor de e-mail está completa (endereço do remetente, configurações do provedor). Nenhum e-mail é enviado |
| `schema`          | o operador definiu `database.require_current_schema` | Não há migrações de banco de dados pendentes nem desconhecidas pelo servidor                                                   |

Backends de produtos construídos sobre o Axentra podem registrar outras verificações; elas aparecem
aqui com os próprios nomes.

### Atividade {#liveness}

A atividade (`GET /v1/health/live`) informa apenas que o processo do servidor responde. O Studio
mostra **Fora do ar** quando a requisição falha, por exemplo porque o servidor ou o proxy à frente
dele não está acessível. Um servidor pode estar ativo, mas não pronto: o processo roda, mas falta
uma dependência, como o banco de dados.

### Versões {#versions}

O cartão **Versões**, em **Integridade do sistema**, mostra o nome e a versão do **Servidor**, a
**Versão da API do servidor**, o **Ambiente** (`development`, `test` ou `production`), a **Versão do
Studio** e a **Versão da API exigida** por esta build do Studio. O Studio se recusa a iniciar com um
servidor cuja versão da API não seja compatível; veja
[Verificação de compatibilidade](help:server-configuration#compatibility).

## Usar a página Monitoramento {#monitoring}

Abra **Auditoria e monitoramento** › **Monitoramento** ([abrir](app:monitoring)). Ela mostra os
mesmos cartões **Prontidão** e **Atividade** de **Integridade do sistema**, além de:

- **Manutenção e retenção** e **Rastreamento e logs** (veja [abaixo](#retention)),
- **Métricas** do processo da API (veja [Métricas](#metrics)).

**Atualizar** recarrega tudo. As métricas também se atualizam a cada 30 segundos enquanto carregam
sem erro.

## Métricas {#metrics}

O cartão **Métricas** lê o endpoint Prometheus do servidor, `GET /metrics`, e o exibe como
indicadores e tabelas.

| Indicador                                                                             | Contado a partir de                                                                                       |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Requisições HTTP**                                                                  | Todas as requisições (`axentra_http_requests_total`)                                                      |
| **Erros do servidor (5xx)** / **Erros do cliente (4xx)**                              | Requisições com essa classe de status                                                                     |
| **Tempo médio de resposta**                                                           | Tempo total das requisições dividido pelo número de requisições (`axentra_http_request_duration_seconds`) |
| **Recusadas (401/403)**                                                               | Recusas de autenticação e de permissão (`axentra_auth_failures_total`)                                    |
| **Notificações enfileiradas** / **entregues** / **Entregas de notificação com falha** | Contadores de notificações (apenas os processos que tratam notificações os informam)                      |

Abaixo dos indicadores, as métricas são agrupadas em **HTTP**, **Autenticação**, **Pool do banco de
dados**, **Notificações**, **Jobs e eventos** e **Outras métricas**. Cada tabela mostra uma linha
por combinação de rótulos (por exemplo, por método, rota e status) com o valor; para histogramas, a
**Contagem** e a **Média**. Métricas grandes mostram as primeiras 50 linhas.

> [!WARNING]
> Os valores são contados **desde o início deste processo da API** e pertencem **ao único processo
> que respondeu à requisição do Studio**. Com vários processos ou réplicas da API, cada um mantém os
> próprios números, e o dispatcher de notificações e os workers de jobs também têm os seus. Um
> reinício zera os números. Para ter uma visão completa, deixe o Prometheus coletar de todos os
> processos.

### Token de métricas {#metrics-token}

Se `/metrics` responde ou não depende da configuração do servidor:

| Configuração do servidor                               | O que o Studio mostra                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `observability.metrics_enabled = false`                | **Métricas indisponíveis**                                                                  |
| `observability.metrics_token_ref` está definido        | **É necessário um token de métricas** e um formulário **Token de métricas**                 |
| Nenhum token configurado, `environment = "production"` | **Métricas indisponíveis** (as métricas ficam desligadas até que um token seja configurado) |
| Nenhum token configurado, desenvolvimento ou teste     | As métricas, sem token                                                                      |

Para ver métricas protegidas:

1. Peça o token de métricas ao seu operador (o segredo para o qual `observability.metrics_token_ref`
   aponta).
2. Informe-o em **Bearer token** e escolha **Carregar métricas**.

> [!NOTE]
> O Studio guarda o token apenas na página aberta. Ele nunca é armazenado e desaparece quando você
> sai da página ou a recarrega. Se o servidor não o aceitar, o Studio mostra
> **O servidor não aceitou este token.**

## Retenção, rastreamento e logs {#retention}

**Manutenção e retenção** lista por quanto tempo o servidor mantém os dados, conforme informado por
`GET /v1/settings`:

| Linha                                                        | Configuração do servidor                                          | Padrão                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Eventos de auditoria**                                     | `observability.audit_retention_days`                              | 365 dias                                                                     |
| **Jobs concluídos**                                          | `observability.job_retention_days`                                | 30 dias                                                                      |
| **Conteúdo das notificações** / **Mensagens de notificação** | `notify.content_retention_days` / `notify.message_retention_days` | não informado pela versão do servidor para a qual este Studio foi construído |

Um valor que o servidor não informa aparece como **não informado pelo servidor**; o Studio nunca
adivinha.

> [!IMPORTANT]
> A retenção não é executada sozinha. Os dados mais antigos que o período só são excluídos quando o
> operador executa `axentra maintenance purge` (normalmente uma vez por dia, via cron ou um
> agendador). O comando também remove sessões expiradas e tokens de configuração inicial.

**Rastreamento e logs** mostra se o **Rastreamento OpenTelemetry** está habilitado, o **Nível de
log**, o **Provedor de notificações** (`local` ou `smtp`) e o **Ambiente**. Esses valores são somente
leitura; eles são alterados na configuração do servidor.

## Para operadores {#for-operators}

- **Probes**: use `GET /v1/health/live` como probe de atividade (liveness) e `GET /v1/health/ready`
  como probe de prontidão (readiness) do seu orquestrador. Nenhum dos dois exige autenticação, e
  nenhum está sujeito a limite de taxa.
- **Prometheus**: colete `/metrics` de cada processo da API. Em produção, configure
  `observability.metrics_token_ref` (por exemplo `file:/run/secrets/axentra_metrics_token`) e dê ao
  Prometheus o mesmo token como credencial bearer.
- **Studio na mesma origem**: o contêiner do Studio encaminha `/metrics` para a API junto com `/v1`,
  então a página Monitoramento funciona atrás do mesmo endereço.
- **Logs** são em JSON por padrão e trazem o ID da requisição; os segredos são censurados.
- **Rastreamento**: `observability.otel_enabled = true` junto com o extra `otel` do pacote do servidor
  exporta um span por requisição via OTLP/HTTP.

O repositório do backend documenta tudo isso em `docs/operations/OBSERVABILITY.md`.

## Solução de problemas {#troubleshooting}

- **Prontidão: Indisponível** com `database` **Reprovado**: o servidor não consegue alcançar o
  PostgreSQL. Verifique o banco de dados e a URL do banco configurada no servidor; as requisições
  que precisam de dados falham até que ele volte.
- **`notify_provider` Reprovado**: a configuração de e-mail está incompleta, por exemplo um endereço
  de remetente ausente ou inválido ou configurações de SMTP. Corrija `[notify]` na configuração do
  servidor.
- **`schema` Reprovado**: há migrações pendentes. O operador executa `axentra migrate`.
- **Atividade: Fora do ar** ou **Servidor inacessível**: o servidor ou o proxy entre o Studio e o
  servidor não está acessível. Verifique se o servidor está rodando e se o endereço da API do Studio
  está correto (veja [Configuração do Studio](help:server-configuration#studio-config)).
- **Métricas indisponíveis**: as métricas estão desligadas, ou este é um servidor de produção sem
  token de métricas. Peça ao operador que defina `observability.metrics_token_ref`.
- **O servidor não aceitou este token.**: o token está errado ou foi rotacionado. Peça o token atual
  ao operador.
- **As configurações de retenção e rastreamento são exibidas apenas para administradores da
  plataforma e gerentes de produto**: você não tem `platform:settings` nem `product:manage`. O
  restante da página continua funcionando.
- **As métricas parecem baixas demais ou voltam a zero**: outro processo da API respondeu, ou o
  processo foi reiniciado (veja o aviso em [Métricas](#metrics)).
