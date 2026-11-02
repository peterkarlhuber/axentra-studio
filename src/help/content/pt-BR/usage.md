---
title: Uso e cotas
summary: Defina medidores, acompanhe o uso de cada tenant, defina substituições de cota e consulte reservas.
keywords: uso, medição, medidor, cota, limite, consumo, contador, reserva, limite rígido, limite flexível, excedente, chamadas de API, período de redefinição
---

A medição de uso conta quanto cada tenant consome de algo que o seu produto mede: chamadas de API,
bytes armazenados, relatórios gerados. Você define **Medidores** no Studio; o seu produto registra
**Eventos de uso** neles pela API. O Axentra soma os eventos por tenant e período, compara o
resultado com o **Limite** do tenant (de uma substituição de cota, do plano ou do padrão do
medidor) e recusa ou sinaliza o uso acima dele. Operadores do produto usam esta tela para definir
medidores e acompanhar o consumo; a equipe de suporte a usa para responder “por que minha
requisição foi recusada?”.

> [!IMPORTANT]
> A tela **Uso** precisa do módulo `usage` no servidor. Sem ele, **Uso** não aparece na navegação.
> Para ler, é preciso `usage:read`; para definir medidores e substituições de cota, a permissão de
> produto `usage:manage`; para confirmar ou liberar reservas, `usage:record` no tenant. Veja
> [Funções e permissões](help:roles-permissions).

## O que a tela mostra {#overview}

Abra [Uso](app:usage) (grupo **Uso e cobrança**). A página tem três guias:

| Guia              | Mostra                                                                         | Quem vê                                                                      |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Visão geral**   | Um gráfico diário de um medidor em todos os tenants e os **Totais por tenant** | `usage:read` no nível do produto (funções de produto, funções da plataforma) |
| **Medidores**     | As definições dos medidores                                                    | `usage:read` no nível do produto                                             |
| **Uso do tenant** | Limites, gráfico, eventos e reservas de um tenant                              | `usage:read` em pelo menos um tenant                                         |

Quem tem apenas uma função de tenant (por exemplo, a função de tenant **Member**) vê somente a guia
**Uso do tenant**, e apenas para os tenants em que tem `usage:read`.

### Ler a visão geral {#overview-chart}

1. Escolha um **Medidor** e um **Intervalo de tempo** (**Últimos 7 dias**, **Últimos 30 dias** ou **Últimos 90 dias**).
2. **Uso diário, todos os tenants** mostra uma barra por dia UTC. **Mostrar tabela de dados**, abaixo
   do gráfico, lista cada dia em uma tabela, que também funciona com leitores de tela.
3. **Totais por tenant** lista cada tenant com uso no intervalo, seu **Valor** e o número de
   **Eventos**. Selecione o nome de um tenant para abrir a guia **Uso do tenant** dele.

A forma de calcular o total depende da agregação do medidor: **Soma** adiciona os valores diários,
**Máximo** usa o maior valor diário e **Último valor** usa o valor do dia mais recente com uso.
Todos os dias são dias UTC, então um dia pode começar à noite ou de manhã no seu horário local.

O **Painel** do produto tem um cartão **Uso neste mês** com os totais por medidor desde o primeiro
dia do mês UTC atual.

## Criar um medidor {#create-meter}

Um medidor define _o que_ é medido. Ele não registra nada sozinho.

1. Abra a guia **Medidores** e escolha **Novo medidor**.
2. Informe uma **Chave**, por exemplo `api_calls`. O seu produto envia o uso com essa chave.
3. Opcional: **Nome**, **Unidade** (exibida ao lado dos valores, por exemplo `calls`) e **Descrição**.
4. Escolha a **Agregação** e o **Período de redefinição** (veja a tabela abaixo).
5. Opcional: um **Limite padrão** e a respectiva **Aplicação**.
6. Escolha **Criar medidor**.

> [!WARNING]
> **Chave**, **Agregação** e **Período de redefinição** não podem ser alterados depois da criação.
> Se você escolheu errado, crie um novo medidor com outra chave.

### Configurações do medidor {#meter-settings}

| Configuração               | O que faz                                                                                                                                                                                  | Valores permitidos / padrão                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Chave**                  | Identificador usado pelas chamadas de API do seu produto e pelos direitos de plano (`limit.<key>`)                                                                                         | Letras minúsculas, dígitos, `_` e `.`, começando com uma letra, no máximo 63 caracteres |
| **Nome**                   | Nome de exibição                                                                                                                                                                           | No máximo 200 caracteres; opcional                                                      |
| **Unidade**                | Exibida depois dos valores                                                                                                                                                                 | Texto livre; opcional                                                                   |
| **Agregação**              | Como os eventos de um período se combinam: **Soma** adiciona as quantidades, **Máximo** mantém a maior, **Último valor** mantém o valor do evento com o horário de ocorrência mais recente | `sum` (padrão), `max`, `last`                                                           |
| **Período de redefinição** | Quando o contador recomeça: **Nunca é zerado**, **Diário (UTC)**, **Mensal (UTC)**, **Período de cobrança**                                                                                | Padrão **Mensal (UTC)**                                                                 |
| **Limite padrão**          | Limite para tenants sem substituição e sem limite de plano; vazio significa ilimitado                                                                                                      | Número igual ou maior que 0; vazio                                                      |
| **Aplicação**              | **Limite rígido** recusa o uso acima do limite; **Limite flexível** registra o uso e informa o excedente                                                                                   | Padrão **Limite rígido**                                                                |

Escolha a agregação de acordo com o que você mede: eventos que se somam (chamadas, mensagens) usam
**Soma**; um nível que você amostra (armazenamento em bytes, licenças ativas) usa **Máximo** ou
**Último valor**.

### Períodos de redefinição e o período de cobrança {#reset-period}

**Período de cobrança** acompanha o ciclo da assinatura do tenant: o período começa no dia em que a
assinatura começou (por exemplo, dia 15) e dura um mês ou um ano, conforme o intervalo do preço. Um
dia de início como o 31 passa para o último dia dos meses mais curtos. Se o módulo `billing` não
estiver habilitado, ou se o tenant não tiver uma assinatura **Em avaliação**, **Ativa** ou **Em
atraso**, o período é o mês civil (UTC). Veja [Planos e assinaturas](help:plans-subscriptions).

### Períodos fixos, não janelas deslizantes {#fixed-periods}

Os limites valem por período, e os períodos têm limites fixos: meia-noite UTC para medidores
diários, o primeiro dia do mês (UTC) para medidores mensais. Um tenant pode usar todo o limite
diário às 23:50 UTC e todo o limite de novo às 00:10 UTC. Não existem janelas de cota por hora nem
deslizantes. Se você precisar de uma janela mais curta, use um medidor `day` com um limite menor ou
um medidor adicional.

Cotas não são a mesma coisa que o limite de taxa de requisições do servidor (requisições por minuto
por chave ou IP). Esse limite é configurado pelo operador e vem desativado por padrão; veja
[Configuração do servidor](help:server-configuration).

## Editar, desativar ou excluir um medidor {#edit-meter}

No menu de ações da linha (**Ações do medidor …**):

- **Editar** altera **Nome**, **Unidade**, **Descrição**, **Limite padrão** e **Aplicação**.
- **Desativar** impede novos usos do medidor: o registro em um medidor inativo é recusado. Medidores
  inativos deixam de aparecer em **Uso no período** de um tenant. **Ativar** desfaz isso.
- **Excluir medidor** remove um medidor que nunca registrou uso. Você confirma digitando a chave. Um
  medidor com uso registrado não pode ser excluído; desative-o em vez disso.

## Verificar o uso e os limites de um tenant {#tenant-usage}

1. Abra a guia **Uso do tenant** e escolha o tenant (ou selecione um tenant em **Totais por tenant**).
2. **Uso no período** mostra um cartão para cada medidor ativo com:
   - o valor no período atual e, para medidores com limite, uma barra com
     “_usado_ de _limite_ usado (_n_ %), incluindo reservas”;
   - de onde vem o limite (veja abaixo) e **Limite rígido** ou **Limite flexível**;
   - **Acima do limite** quando um uso com limite flexível ultrapassou o limite;
   - **Período**, **Eventos**, **Reservado** (se houver) e **Restante**.
3. Para ver um período anterior, escolha uma data em **Período que contém**. Deixe vazio para o
   período atual.

Em seguida vêm **Uso diário** (um gráfico por medidor, com os mesmos intervalos da visão geral),
**Eventos de uso** (os mais recentes primeiro, com filtro por **Medidor**) e **Reservas**.

### De onde vem o limite efetivo {#limit-source}

Vale a primeira correspondência:

| Selo                       | Origem                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Substituição do tenant** | Uma substituição de cota definida para este tenant nesta tela                                                    |
| **Do plano**               | O direito `limit.<meter key>` do plano do tenant, ou uma substituição de direito na página de cobrança do tenant |
| **Padrão do medidor**      | O **Limite padrão** do medidor                                                                                   |
| **Sem limite**             | Nenhum dos anteriores: ilimitado                                                                                 |

Um limite de plano só vale enquanto a assinatura está **Em avaliação**, **Ativa** ou **Em atraso**.
Limites de plano usam a **Aplicação** do medidor; só uma substituição de cota define a própria.

> [!NOTE]
> Existem dois tipos de substituição por tenant. Uma **substituição de cota** (nesta tela) substitui
> o limite de um medidor, incluindo a aplicação, e sempre prevalece. Uma **substituição de direito**,
> na página de cobrança do tenant, substitui um direito do plano e aparece como **Do plano**. Use um
> único mecanismo por medidor para facilitar o entendimento.

## Definir ou remover uma substituição de cota {#quota-override}

Exige a permissão de produto `usage:manage`.

1. Em **Uso no período**, escolha **Definir substituição** no cartão do medidor.
2. Informe um **Limite**. Deixe vazio para uma substituição ilimitada (o tenant fica sem limite
   mesmo que o plano tenha um).
3. Escolha a **Aplicação** e **Salvar substituição**.

O selo muda para **Substituição do tenant**. **Remover substituição** (exibido apenas em cartões com
substituição do tenant) faz o limite do plano ou o padrão do medidor voltar a valer. As
substituições valem a partir do próximo uso registrado; o uso já registrado permanece. Alterações
de cota são registradas no log de auditoria.

## Limites rígidos e flexíveis {#enforcement}

- **Limite rígido**: uma requisição que ultrapassaria o limite é recusada com HTTP `429` e o código
  de erro `quota_exceeded`, incluindo medidor, limite, quantidades usada, reservada e solicitada e
  quando o período termina. Para medidores de **Soma**, a verificação é
  _usado + reservado + solicitado > limite_; para medidores de **Máximo** e **Último valor**, é
  _solicitado > limite_.
- **Limite flexível**: o uso é sempre registrado. A resposta e o Studio informam **Acima do
  limite**, para que o seu produto possa avisar ou cobrar o excedente.

Um limite rígido nunca é ultrapassado por requisições simultâneas: o Axentra serializa as gravações
de um mesmo tenant, medidor e período.

## Registrar uso (API) {#record-usage}

O Studio não registra uso. O seu produto chama a API com uma chave que tenha `usage:record`
(veja [Chaves de API](help:api-keys)):

```http
POST /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/usage/events
Authorization: Bearer axk_EXAMPLE_secret
Idempotency-Key: req-7f3a9c
Content-Type: application/json

{"meter": "api_calls", "quantity": 1}
```

- O cabeçalho `Idempotency-Key` é obrigatório (de 1 a 200 caracteres ASCII imprimíveis). Repetir a
  mesma chave com o mesmo corpo retorna o evento original (`200`, `replayed: true`) e conta uma
  única vez. A mesma chave com um corpo diferente é recusada com `409`.
- `quantity`: um número de 0 a 10^15 com no máximo 6 casas decimais.
- `occurred_at` (opcional): no máximo 5 minutos no futuro e 400 dias no passado. Eventos
  retroativos contam no período a que pertencem, mesmo que ele já tenha terminado.
- `properties` (opcional): um objeto JSON de no máximo 4 KB, exibido em **Eventos de uso**.
- `"enforce": false` registra sem a verificação do limite rígido; isso exige a permissão de produto
  `usage:manage`, que chaves vinculadas a um tenant nunca têm.

O tutorial [Planos e uso de ponta a ponta](help:tutorial-plan-usage) mostra um exemplo completo.

## Reservas {#reservations}

Para trabalhos demorados, um produto pode **reservar** uma quantidade antes de começar (API:
`POST …/usage/reservations` com `meter`, `quantity` e `ttl_seconds` de 1 a 86 400, padrão 300). Uma
reserva ativa conta para o limite, de modo que jobs em paralelo não conseguem ultrapassá-lo juntos.
Quando o trabalho termina, o produto **confirma** a quantidade real, o que registra um evento de
uso, ou **libera** a reserva. Reservas existem apenas para medidores de **Soma**.

A API não tem uma lista de reservas, por isso o Studio procura uma reserva pelo ID:

1. Em **Reservas**, cole o **ID da reserva** e escolha **Procurar**.
2. O Studio mostra **Status**, medidor, **Quantidade reservada**, **Expira em** e, depois da
   confirmação, a **Quantidade confirmada** e o **Evento de uso**.
3. Com `usage:record` no tenant, uma reserva **Ativa** pode ser finalizada aqui:
   - **Confirmar** registra a **Quantidade real** (deixe vazio para confirmar a quantidade
     reservada). Uma confirmação nunca é recusada pelo limite, porque o trabalho já foi feito.
   - **Liberar** devolve a quantidade sem registrar uso.

| Status         | Significado                                                               |
| -------------- | ------------------------------------------------------------------------- |
| **Ativa**      | Conta para o limite até expirar                                           |
| **Confirmada** | O uso foi registrado                                                      |
| **Liberada**   | Devolvida; nenhum uso registrado                                          |
| **Expirada**   | Não foi confirmada antes de **Expira em**; deixou de contar nesse momento |

## Bom saber {#good-to-know}

- Eventos de uso não podem ser alterados nem excluídos, e as quantidades não podem ser negativas,
  então o uso registrado não pode ser subtraído. Para dar mais margem a um tenant depois de um erro,
  defina uma [substituição de cota](help:usage#quota-override) para o restante do período.
- Eventos de uso individuais não são auditados por causa do volume; alterações de medidores e cotas são.
- Os dados de um tenant ficam isolados: o ID de um tenant alheio retorna “não encontrado”.
- O Studio mostra quantidades com até 6 casas decimais, formatadas para o seu idioma.
- As séries temporais cobrem no máximo 400 dias.
- Outros limites estão listados em [Limitações conhecidas](help:limitations).

## Solução de problemas {#troubleshooting}

| O que você vê                                             | Por quê                                                                       | O que fazer                                                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sem acesso ao uso**                                     | Sua função não tem `usage:read` para este produto ou tenant                   | Peça a um administrador do produto uma função com `usage:read`                                                                                 |
| Apenas a guia **Uso do tenant**                           | Você tem `usage:read` somente por meio de uma função de tenant                | Comportamento esperado; a visão geral exige uma função de produto                                                                              |
| **Nenhum medidor ainda**                                  | Nenhum medidor definido                                                       | Crie um em **Medidores** (exige `usage:manage`)                                                                                                |
| **Conflito** ao excluir um medidor                        | O medidor tem uso registrado                                                  | **Desative**-o em vez disso                                                                                                                    |
| **Conflito** “a meter with this key exists”               | As chaves são únicas por produto, inclusive para medidores inativos           | Escolha outra chave ou ative o medidor antigo                                                                                                  |
| **Alterado nesse meio-tempo**                             | Outra pessoa editou o medidor                                                 | Recarregue e repita a alteração                                                                                                                |
| O seu produto recebe `429 quota_exceeded`                 | Um limite rígido seria ultrapassado                                           | Verifique a origem do limite no cartão; aumente o limite do plano, defina uma substituição de cota ou aguarde o fim do período (`Retry-After`) |
| O seu produto recebe `409` “the meter is inactive”        | O medidor foi desativado                                                      | **Ative**-o em **Medidores**                                                                                                                   |
| O seu produto recebe `409` para uma chave de idempotência | A chave foi reutilizada com um corpo diferente                                | Use uma nova chave para cada evento de uso distinto                                                                                            |
| **Verifique os dados informados** ao registrar            | Quantidade, `occurred_at` ou `properties` fora dos limites acima              | Corrija o valor; envie `occurred_at` com fuso horário                                                                                          |
| A confirmação é recusada: “the reservation is expired”    | O TTL expirou antes da confirmação                                            | Registre o uso como um evento normal; escolha um `ttl_seconds` maior                                                                           |
| O uso aparece no dia errado                               | Os dias são UTC                                                               | Compare com horários UTC                                                                                                                       |
| Medidor de **Período de cobrança** é zerado no dia 1º     | O tenant não tem uma assinatura com direitos, ou a cobrança está desabilitada | Faça o tenant assinar um plano (veja [Planos e assinaturas](help:plans-subscriptions#subscribe))                                               |
