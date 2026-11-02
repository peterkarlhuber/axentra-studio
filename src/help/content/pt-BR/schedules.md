---
title: Agendamentos
summary: Execute um job regularmente, em um intervalo fixo ou em horários cron em UTC, e habilite, desabilite, edite ou exclua agendamentos.
keywords: agendamento, cron, crontab, job recorrente, tarefa agendada, temporizador, intervalo, periódico, UTC, fuso horário, próxima execução, todo dia, toda hora, diariamente
---

Um **agendamento** enfileira um [job](help:jobs) repetidamente: a cada 15 minutos, toda noite às
02:00, no primeiro dia de cada mês. Você dá ao agendamento um **Tipo** de job e um **Payload**, e o
agendamento coloca um novo job desse tipo na fila em cada horário programado. Um worker então
executa o job como qualquer outro. Use agendamentos para relatórios, limpezas, sincronizações e
lembretes.

> [!IMPORTANT]
> Os agendamentos exigem o módulo do servidor `events`. Visualizar exige `jobs:read`;
> **Novo agendamento**, editar, habilitar, desabilitar e excluir exigem `jobs:manage` (sem essa
> permissão, os botões e o menu da linha ficam ocultos). Os agendamentos só disparam enquanto um
> processo worker (`axentra worker`) está em execução, porque o worker também atua como
> agendador.

## Ler a lista de agendamentos {#schedules-list}

Abra [Agendamentos](app:schedules) (também acessível por **Agendamentos** na tela **Jobs**). Cada
linha mostra:

- **Nome** e o tipo de job que ele enfileira;
- **Frequência**: um intervalo como _A cada 15 minutos_ ou uma expressão cron marcada como
  _cron, UTC_;
- **Estado**: **Ativo** ou **Desabilitado**;
- **Próxima execução**: quando o agendamento dispara da próxima vez (aparece como
  **Desabilitado** para agendamentos desabilitados);
- **Última execução**: o último horário que disparou. Quando existe um job para ele, o horário é um
  link para esse job;
- **Tenant** ou **Nível do produto**.

## Criar um agendamento {#create}

1. Abra [Agendamentos](app:schedules) e escolha **Novo agendamento**.
2. Informe um **Nome** (de 1 a 200 caracteres) e o **Tipo** do job, por exemplo `reports.send`.
3. Em **Frequência**, escolha **Intervalo fixo** ou **Expressão cron** (veja abaixo).
4. Opcional: informe o **Payload** do job, escolha um **Tenant** e defina **Prioridade** e
   **Máx. de tentativas**.
5. Deixe **Habilitado** ativado se o agendamento deve começar a disparar imediatamente.
6. Escolha **Criar agendamento**.

O servidor calcula a **Próxima execução** quando você salva. O Studio não mostra uma prévia dos
horários futuros.

## Escolher a frequência {#timing}

Um agendamento usa exatamente um dos dois modos de frequência.

### Intervalo fixo {#interval}

Informe um número em **A cada** e escolha a **Unidade** (**Segundos**, **Minutos**, **Horas** ou
**Dias**). O intervalo precisa estar entre 10 segundos e 366 dias.

Os horários de intervalo são contados a partir da meia-noite UTC de 1º de janeiro de 1970, não a
partir do momento em que você salvou. Por isso todos os servidores calculam os mesmos horários, e
as execuções são previsíveis:

- _A cada 15 minutos_ dispara às :00, :15, :30 e :45 de cada hora (UTC).
- _A cada 1 dia_ dispara às 00:00 UTC.
- _A cada 7 dias_ dispara às quintas-feiras às 00:00 UTC (1º de janeiro de 1970 foi uma
  quinta-feira).

Se você precisar de um horário do dia ou de um dia da semana específico, use uma expressão cron.

### Expressão cron {#cron-syntax}

Uma expressão cron tem exatamente **5 campos**, separados por espaços:

```text
┌──────── minute        0-59
│ ┌────── hour          0-23
│ │ ┌──── day of month  1-31
│ │ │ ┌── month         1-12
│ │ │ │ ┌ day of week   0-7 (0 and 7 are Sunday)
* * * * *
```

Cada campo aceita:

| Sintaxe | Significado                                         | Exemplo                                             |
| ------- | --------------------------------------------------- | --------------------------------------------------- |
| `*`     | todos os valores                                    | `*` no campo de hora: toda hora                     |
| `n`     | um valor                                            | `30` no campo de minuto                             |
| `a-b`   | um intervalo                                        | `1-5` no campo de dia da semana: de segunda a sexta |
| `a,b,c` | uma lista (os itens podem ser intervalos ou passos) | `0,30` no campo de minuto                           |
| `*/n`   | cada _n_-ésimo valor a partir do início             | `*/10` no campo de minuto: 0, 10, 20 …              |
| `a-b/n` | cada _n_-ésimo valor dentro de um intervalo         | `8-18/2` no campo de hora: 8, 10 … 18               |
| `a/n`   | cada _n_-ésimo valor de _a_ até o fim               | `5/15` no campo de minuto: 5, 20, 35, 50            |

**Não suportado:** nomes de meses ou dias da semana (`JAN`, `MON`), `L`, `W`, `#`, `?`, um campo
de segundos e macros como `@daily` ou `@hourly`. Uma expressão pode ter no máximo 200 caracteres.

Quando **tanto** o dia do mês **quanto** o dia da semana estão restringidos (nenhum dos dois é
`*`), um dia corresponde se **qualquer um** deles corresponder. Por isso, `0 0 1 * 1` dispara no
dia 1º de cada mês _e_ em toda segunda-feira.

Uma expressão que nunca corresponde, como `0 0 31 2 *` (31 de fevereiro), é rejeitada ao salvar.

O Studio verifica a sintaxe enquanto você digita, com as mesmas regras do servidor, e mostra
mensagens como _Uma expressão cron tem 5 campos separados por espaços; esta tem 6._ Os botões em
**Expressões comuns** preenchem expressões prontas:

| Botão                        | Expressão     |
| ---------------------------- | ------------- |
| **A cada 5 minutos**         | `*/5 * * * *` |
| **De hora em hora**          | `0 * * * *`   |
| **Diariamente às 00:00**     | `0 0 * * *`   |
| **Dias úteis às 09:00**      | `0 9 * * 1-5` |
| **Segundas-feiras às 06:00** | `0 6 * * 1`   |
| **Dia 1º de cada mês**       | `0 0 1 * *`   |

### Fuso horário: sempre UTC {#timezone}

Todos os horários de agendamento estão em **UTC**. Não há configuração de fuso horário nem ajuste
automático de horário de verão. Converta os horários locais você mesmo: 09:00 em Berlim é
`0 8 * * *` no inverno (UTC+1) e `0 7 * * *` no verão (UTC+2); 09:00 em Brasília (UTC−3) é
`0 12 * * *`. Se a hora local exata importar o ano todo em um lugar com horário de verão, ajuste o
agendamento quando o relógio mudar ou deixe o handler verificar a hora local.

As colunas **Próxima execução** e **Última execução** são exibidas no seu próprio fuso horário,
como em todo o Studio.

## O que um agendamento enfileira {#what-it-enqueues}

Em cada horário, o agendamento enfileira um job com:

- o **Tipo**, o **Payload**, a **Prioridade**, o **Máx. de tentativas** e o **Tenant** do
  agendamento;
- um link de volta para o agendamento (os detalhes do job o mostram em **Agendamento**);
- **Criado por** `schedule:<schedule id>`;
- uma chave de idempotência formada pelo id do agendamento e pelo horário.

Cada horário dispara **no máximo uma vez**, mesmo quando vários workers estão rodando. O job em si
roda então pelo menos uma vez, com as [novas tentativas](help:jobs#retries) habituais. Um
agendamento não espera o job anterior terminar: se um job demorar mais que o intervalo, o próximo
começa mesmo assim.

## Execuções perdidas e a próxima execução {#missed-runs}

Se nenhum worker estava rodando quando os horários venceram (por exemplo durante uma manutenção),
os horários perdidos são **combinados**: o agendamento dispara uma vez pelo horário atrasado e
depois continua com o próximo horário após o momento atual. Ele não recupera cada execução perdida.

A **Próxima execução** é recalculada a partir do momento atual sempre que você altera a frequência
ou habilita o agendamento. Alterar apenas o nome, o payload, a prioridade ou as tentativas mantém a
próxima execução.

## Editar um agendamento {#edit}

1. Abra o menu de ações da linha e escolha **Editar**.
2. Altere os valores e escolha **Salvar alterações**.

O Studio envia apenas os campos que você alterou. O **Tenant** não pode ser alterado depois da
criação; nesse caso, exclua o agendamento e crie um novo. Os jobs já enfileirados mantêm o payload
antigo.

## Habilitar ou desabilitar um agendamento {#enable-disable}

Abra o menu de ações da linha e escolha **Desabilitar** ou **Habilitar**. Um agendamento
desabilitado mantém todas as configurações, mas não dispara. Quando você o habilita de novo, ele
continua no próximo horário a partir de agora; os horários perdidos enquanto estava desabilitado
não são executados.

## Excluir um agendamento {#delete}

Abra o menu de ações da linha, escolha **Excluir agendamento** e confirme. O agendamento para de
disparar. Os jobs que ele já enfileirou permanecem e ainda rodam. A exclusão não pode ser desfeita;
para parar um agendamento temporariamente, desabilite-o.

## Configurações {#settings}

| Configuração           | O que faz                                                                     | Valores permitidos / padrão                                               |
| ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Nome**               | Exibido na lista e nas mensagens.                                             | De 1 a 200 caracteres. Obrigatório.                                       |
| **Tipo**               | Tipo de job a enfileirar; um worker precisa de um handler para ele.           | Como para [jobs](help:jobs#enqueue); `axentra.` é reservado. Obrigatório. |
| **Frequência**         | **Intervalo fixo** ou **Expressão cron**.                                     | Intervalo de 10 s a 366 dias; cron: 5 campos, UTC.                        |
| **Payload**            | Entrada de cada job enfileirado.                                              | Objeto JSON, no máximo 64 KB. Padrão `{}`.                                |
| **Tenant**             | Enfileira os jobs neste tenant.                                               | Um tenant ou **Nível do produto**. Somente na criação.                    |
| **Prioridade**         | Prioridade dos jobs enfileirados.                                             | −100 a 100. Padrão 0.                                                     |
| **Máx. de tentativas** | Tentativas de cada job enfileirado antes de passar para **Falha definitiva**. | 1 a 100. Padrão 5.                                                        |
| **Habilitado**         | Se o agendamento dispara.                                                     | Padrão: ativado.                                                          |

## Para desenvolvedores {#developers}

Os agendamentos também estão disponíveis pela API: `GET/POST /v1/products/{product_id}/schedules`
e `GET/PATCH/DELETE /schedules/{id}` (com `If-Match` para atualizações e exclusões). Apenas um
worker atua como agendador por vez; por padrão, ele verifica agendamentos vencidos a cada 5
segundos (`events.scheduler_interval_seconds`), então um job pode ser enfileirado alguns segundos
depois do horário.

## Solução de problemas {#troubleshooting}

**O agendamento não dispara.** Verifique se ele está **Ativo** e se a **Próxima execução** está no
passado. Se estiver, nenhum worker está rodando; peça aos operadores que iniciem um. Se os jobs são
enfileirados mas ficam **Na fila**, nenhum worker trata o tipo; veja
[Jobs](help:jobs#troubleshooting).

**Ele dispara na hora errada.** Os horários cron são em UTC. Converta seu horário local, levando em
conta o horário de verão (veja [Fuso horário](help:schedules#timezone)).

**“The cron expression never matches”.** Os campos descrevem uma data que não existe, como 30 de
fevereiro. Altere o dia ou o mês.

**“Verifique os dados informados” com uma mensagem de cron.** O servidor indica o campo, por
exemplo `cron hour: values must be within 0-23` ou `cron day of week: invalid value 'MON'`. Use
números em vez de nomes e remova macros.

**“interval_seconds must be between 10 and 31622400”.** O intervalo é menor que 10 segundos ou
maior que 366 dias.

**“Alterado nesse meio-tempo” ao salvar, habilitar ou excluir.** Outra pessoa alterou o
agendamento depois que você o carregou. Feche o diálogo, aguarde a lista ser atualizada (ou
recarregue a página) e repita sua alteração sobre a versão atual.

**O agendamento rodou uma vez depois de uma indisponibilidade, e não para cada horário perdido.**
Isso é intencional: os horários perdidos são combinados em uma única execução.
