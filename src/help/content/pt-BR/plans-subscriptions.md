---
title: Planos e assinaturas
summary: Crie planos com preços e direitos, faça tenants assinarem, gerencie as assinaturas e entenda o provedor de pagamento.
keywords: cobrança, plano, preços, preço, faixa, assinatura, direito, feature flag, limite, avaliação, período de teste, cancelar, em atraso, Stripe, checkout, provedor de pagamento, cobrança manual
---

Um **Plano** descreve o que um tenant recebe: os preços, a duração da avaliação e os **Direitos**
(recursos ligados ou desligados e limites de uso por medidor). Uma **Assinatura** liga um tenant a
um plano e tem um status, como **Em avaliação**, **Ativa** ou **Em atraso**. O seu produto consulta
o Axentra sobre os direitos efetivos de um tenant para decidir o que o tenant pode fazer; o módulo
de uso obtém deles as cotas padrão. Operadores do produto usam estas telas para configurar planos e
para dar suporte aos clientes com as assinaturas.

> [!IMPORTANT]
> Estas telas precisam do módulo `billing` no servidor; sem ele, **Planos** e **Assinaturas** não
> aparecem. **Planos** e **Assinaturas** exigem `billing:read` por meio de uma função de produto; a
> página de cobrança de um tenant exige `billing:read` nesse tenant. Toda alteração exige
> `billing:manage`. Veja [Funções e permissões](help:roles-permissions).

> [!CAUTION]
> O Studio nunca pede dados de cartão ou bancários, e o Axentra não armazena nenhum. Os dados de
> pagamento são informados apenas na página de checkout hospedada do provedor de pagamento.
> Faturas, impostos, recibos e reembolsos são tratados pelo provedor e pelo operador, não pelo
> Axentra.

## Criar um plano {#create-plan}

1. Abra [Planos](app:plans) (grupo **Uso e cobrança**) e escolha **Novo plano**.
2. Informe um **Nome** e uma **Chave**, por exemplo `pro`. A chave não pode ser alterada depois; o
   seu produto e a API se referem ao plano por ela.
3. Opcional: **Descrição** e **Dias de avaliação** (de 0 a 365). Novas assinaturas de um plano com
   dias de avaliação começam **Em avaliação**.
4. Deixe **Ativo** ligado para que o plano possa ser escolhido em novas assinaturas.
5. Em **Preços**, escolha **Adicionar preço** para cada preço (veja [Preços](help:plans-subscriptions#prices)).
   Sem preços, o plano é gratuito.
6. Em **Direitos**, adicione recursos e limites (veja
   [Direitos](help:plans-subscriptions#entitlements)).
7. Escolha **Criar plano**.

### Configurações do plano {#plan-settings}

| Configuração          | O que faz                                                                        | Valores permitidos / padrão                                                                                    |
| --------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Nome**              | Nome de exibição                                                                 | De 1 a 200 caracteres; obrigatório                                                                             |
| **Chave**             | Identificador do plano                                                           | Letras minúsculas, dígitos, `_` e `-`, começando com uma letra, no máximo 63 caracteres; não pode ser alterada |
| **Descrição**         | Texto livre                                                                      | No máximo 2000 caracteres                                                                                      |
| **Dias de avaliação** | Duração da avaliação de novas assinaturas                                        | De 0 a 365; padrão 0 (sem avaliação)                                                                           |
| **Ativo**             | Apenas planos ativos podem ser escolhidos em novas assinaturas e trocas de plano | Ligado por padrão                                                                                              |
| **Preços**            | Valor, moeda, intervalo e ID do preço no provedor                                | No máximo 20 por plano                                                                                         |
| **Direitos**          | Recursos e limites                                                               | No máximo 200 entradas                                                                                         |

### Preços {#prices}

Cada preço tem um **Valor**, uma **Moeda**, um **Intervalo** e um **ID do preço no provedor** opcional.

- Informe o valor em unidades normais da moeda, por exemplo `19.90`. O Axentra o armazena como um
  inteiro em unidades menores (centavos); o Studio mostra o valor armazenado abaixo do campo
  ("Armazenado como 1990 unidades menores"). Moedas sem unidades menores (como JPY) aceitam números
  inteiros.
- **Moeda** é um código ISO 4217 de três letras, como `EUR`, `USD` ou `BRL`.
- **Intervalo**: **mês** ou **ano**. Ele também define a duração do período de cobrança da
  assinatura.
- **ID do preço no provedor**: com o Stripe, o ID do preço que você criou no Stripe (letras, dígitos
  e `_`, por exemplo `price_1EXAMPLE`). O Axentra usa esse ID para associar as atualizações do
  Stripe ao plano.

Um plano sem preços, ou só com preços zerados, é **Gratuito**. Um plano pode ter vários preços (por
exemplo, mensal e anual); nesse caso, você escolhe um ao fazer o tenant assinar. As assinaturas
existentes guardam uma cópia do preço com que começaram, então alterações posteriores de preço não
as afetam.

### Direitos {#entitlements}

Direitos são uma lista simples de chaves. No editor, escolha o **Tipo** de cada linha:

| Tipo        | Armazenado como                                    | Valor                                                     |
| ----------- | -------------------------------------------------- | --------------------------------------------------------- |
| **Recurso** | `feature.<name>`, por exemplo `feature.sso`        | **Ativado** ligado ou desligado                           |
| **Limite**  | `limit.<meter key>`, por exemplo `limit.api_calls` | Um número igual ou maior que 0; vazio significa ilimitado |

Os nomes usam letras minúsculas, dígitos, `_` e `.`, começando com uma letra. Um **Limite** define a
cota do medidor de uso com essa chave por período de redefinição; quando o módulo `usage` pode ser
lido, o Studio sugere as chaves de medidor existentes. Um limite para uma chave sem medidor não tem
efeito. Limites de plano usam a aplicação do medidor (rígida ou flexível). Veja
[Uso e cotas](help:usage#limit-source).

O significado de um recurso como `feature.sso` cabe ao seu produto: o Axentra apenas o armazena e
o retorna.

## Editar, desativar ou excluir um plano {#edit-plan}

No menu de ações da linha (**Ações do plano …**):

- **Editar** altera tudo, exceto a chave. Direitos alterados valem imediatamente para todos os
  tenants do plano. Preços alterados valem apenas para novas assinaturas.
- **Desativar** oculta o plano de novas assinaturas e trocas de plano. As assinaturas existentes
  continuam. **Ativar** desfaz isso.
- **Excluir plano** remove um plano que nenhuma assinatura usa; você confirma digitando a chave do
  plano. Planos em uso (inclusive por assinaturas canceladas) não podem ser excluídos; desative-os
  em vez disso.

## Visão geral das assinaturas {#subscriptions}

[Assinaturas](app:subscriptions) lista as assinaturas de todos os tenants, as mais recentes
primeiro, com **Tenant**, **Plano**, **Status**, **Preço**, **Fim do período**, **Fim da avaliação**
e **Provedor**. Filtre por **Status** e **Plano**. Selecione um tenant para abrir a página de
cobrança dele.

Para abrir um tenant que ainda não tem assinatura, escolha-o em **Cobrança de um tenant** e
selecione **Abrir**.

### Status das assinaturas {#status}

| Status           | Significado                                       | Direitos valem |
| ---------------- | ------------------------------------------------- | -------------- |
| **Incompleta**   | Aguardando o checkout no provedor                 | Não            |
| **Em avaliação** | Os dias de avaliação estão correndo               | Sim            |
| **Ativa**        | Assinatura em andamento                           | Sim            |
| **Em atraso**    | O pagamento está atrasado; um período de carência | Sim            |
| **Cancelada**    | Encerrada; definitivo                             | Não            |

Alterações permitidas: Incompleta → Em avaliação, Ativa ou Cancelada; Em avaliação → Ativa, Em
atraso ou Cancelada; Ativa → Em atraso ou Cancelada; Em atraso → Ativa ou Cancelada. Uma assinatura
cancelada não pode ser reativada: faça o tenant assinar novamente.

## Fazer um tenant assinar um plano {#subscribe}

1. Abra a página de cobrança do tenant (em **Assinaturas** ou em **Cobrança de um tenant**).
2. Em **Assinatura**, escolha **Assinar um plano**.
3. Escolha o plano em **Escolha um plano** e o **Preço**, se o plano tiver vários.
4. Escolha **Assinar**.

O que acontece depende do plano e do provedor de pagamento:

- **Planos gratuitos**, e qualquer plano com o provedor **Manual**, começam imediatamente **Em
  avaliação** (se o plano tiver dias de avaliação) ou **Ativa**.
- **Planos pagos com o provedor de testes ou o Stripe** precisam de um checkout. O botão passa a ser
  **Iniciar checkout**. O Studio cria uma sessão de checkout e mostra **Abrir página de checkout**,
  que abre a página hospedada do provedor em uma nova guia. A assinatura fica **Incompleta** até que
  o provedor confirme o pagamento pelo webhook dele.
- Quando **Pagamentos reais** estão ativados, o Studio não inicia checkouts com dinheiro real. Use o
  fluxo de checkout do seu próprio produto.

Um tenant tem no máximo uma assinatura atual (não cancelada).

## Trocar o plano {#change-plan}

**Trocar plano** passa o tenant para outro plano ativo (ou para outro preço do mesmo plano). Não há
cálculo proporcional: o Axentra não calcula créditos nem cobranças extras. Os direitos do novo
plano valem imediatamente.

- Assinaturas do Stripe são alteradas no Stripe (por exemplo, no portal do cliente do Stripe); em
  seguida, o webhook atualiza o Axentra. O Studio oculta **Trocar plano** para elas.
- Uma assinatura criada sem pagamento (manual) não pode passar para um plano pago enquanto houver um
  provedor real configurado; cancele-a e faça o tenant assinar de novo com um checkout.
- Assinaturas **Incompleta** não podem trocar de plano; conclua ou reinicie o checkout.

## Cancelar ou retomar {#cancel}

- **Cancelar no fim do período**: a assinatura continua utilizável até o fim do período atual e
  então termina. **Retomar** retira o cancelamento agendado.
- **Cancelar agora**: a assinatura termina imediatamente e os direitos dela deixam de valer. Você
  confirma digitando a chave do plano. Isso não pode ser desfeito.

Para assinaturas do Stripe, o Axentra repassa o cancelamento primeiro ao Stripe.

> [!IMPORTANT]
> Com o provedor **Manual**, as avaliações terminam, os períodos avançam e o "cancelar no fim do
> período" só tem efeito quando o operador executa a tarefa agendada de cobrança (`advance_periods`,
> por exemplo de hora em hora). Se as avaliações nunca terminam, peça ao operador que a agende.

## Definir o status (provedor manual) {#set-status}

Com o provedor **Manual**, você recebe o pagamento fora do Axentra e registra o resultado. Escolha
**Definir status** e depois o **Novo status**: por exemplo **Em atraso** quando uma fatura não foi
paga, ou **Ativa** quando foi paga. Só as transições permitidas são oferecidas. Definir **Ativa**
durante uma avaliação encerra a avaliação na hora. Assinaturas de outros provedores recebem o status
pelos webhooks do provedor.

## Direitos efetivos e substituições {#overrides}

**Direitos efetivos**, na página de cobrança do tenant, mostra o que o tenant recebe agora: o
**Plano** (com o status), **Recursos**, **Limites** e **Substituições**. São os direitos do plano
enquanto a assinatura está **Em avaliação**, **Ativa** ou **Em atraso**, combinados com as
substituições do tenant. Sem uma assinatura assim, o tenant recebe apenas as substituições
(**Nenhuma assinatura com direitos**).

Para dar a um tenant algo diferente do plano, escolha **Editar substituições**, adicione ou altere
linhas no mesmo editor usado para planos e escolha **Salvar substituições**.

> [!WARNING]
> Salvar substitui todas as substituições do tenant. Uma linha que você remove da lista é removida
> do tenant. As substituições permanecem quando o plano muda ou a assinatura termina.

Para aumentar apenas um limite de uso, uma substituição de cota na tela **Uso** costuma ser mais
clara; veja [Uso e cotas](help:usage#quota-override). **Uso**, no cabeçalho da página, abre o uso do
tenant.

## Provedor de pagamento {#payment-provider}

O cartão **Provedor de pagamento**, em **Planos** e **Assinaturas**, mostra a configuração do servidor:

| Provedor                       | Comportamento                                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Manual**                     | O pagamento é recebido fora do Axentra. As assinaturas são criadas diretamente; um operador define o status.                            |
| **Simulador de testes (fake)** | Provedor de testes determinístico, sem acesso à rede; planos pagos passam por um checkout simulado. Recusado pelo servidor em produção. |
| **Stripe**                     | Planos pagos passam pelo Stripe Checkout; os webhooks do Stripe atualizam as assinaturas.                                               |

**Pagamentos reais** mostra se pagamentos com dinheiro real estão ativados (somente Stripe).
**Checkout pelo Studio** informa se o Studio pode iniciar um checkout hospedado: apenas para o
provedor de testes ou para o Stripe com pagamentos reais desativados.

O provedor é escolhido pelo operador na configuração do servidor (`billing.provider`); ele não pode
ser alterado no Studio. O cartão exige `platform:settings` ou `product:manage`; caso contrário, ele
informa que a configuração não está visível para você. Veja [Configurações](help:settings) e
[Configuração do servidor](help:server-configuration).

## Para desenvolvedores {#developers}

- Leia os direitos efetivos de um tenant com
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements`
  (`billing:read`). A resposta tem `features` (nome → true/false), `limits` (chave do medidor →
  número, ou `null` para ilimitado), `plan_key`, `subscription_status` e `overrides`.
- Compras de autoatendimento de tenants passam pelo backend do seu produto, com uma chave de API
  que tenha `billing:manage`; não existe permissão de tenant para checkout de autoatendimento.
- Os endereços de retorno do checkout (`success_url`, `cancel_url`) precisam começar com a URL
  pública do servidor ou com uma das origens permitidas. O Studio usa o endereço da própria página.
- Alterações de assinatura são auditadas (`billing.subscription.*`) e, quando o módulo de eventos
  está habilitado, publicadas como eventos com o mesmo nome, para que um webhook possa reagir a
  elas. Veja [Eventos](help:events).
- Os webhooks do Stripe são verificados por assinatura e processados uma vez por ID de evento;
  eventos desatualizados são ignorados.

## Bom saber {#good-to-know}

- Sem cálculo proporcional, cupons, impostos, faturas, quantidade de licenças ou preços baseados em uso.
- Sem endpoint de portal do cliente; trocas de plano do Stripe acontecem no Stripe.
- `past_due` mantém os direitos; decida no seu produto se algo deve ser restringido.
- Veja [Limitações conhecidas](help:limitations).

## Solução de problemas {#troubleshooting}

| O que você vê                                                                        | Por quê                                                                                   | O que fazer                                                                                           |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Sem acesso à cobrança**                                                            | Sua função não tem `billing:read` (no nível do produto para **Planos** e **Assinaturas**) | Peça a um administrador do produto uma função adequada                                                |
| **Conflito** ao excluir um plano                                                     | Há assinaturas usando o plano                                                             | **Desative**-o em vez disso                                                                           |
| **Conflito** "a plan with this key exists"                                           | As chaves de plano são únicas por produto                                                 | Escolha outra chave                                                                                   |
| Um plano não aparece em **Escolha um plano**                                         | Ele está inativo                                                                          | Ative-o em **Planos**                                                                                 |
| **Conflito** "paid plans need a checkout …"                                          | Assinatura de um plano pago com o provedor de testes ou o Stripe                          | Use **Iniciar checkout**, ou o checkout do próprio produto quando pagamentos reais estiverem ativados |
| "Este plano pago precisa de um checkout, que o servidor não oferece aqui"            | Pagamentos reais estão ativados, ou o provedor não é visível para você                    | Use o checkout do seu produto                                                                         |
| **Conflito** "the tenant already has a subscription"                                 | Já existe uma assinatura atual                                                            | Use **Trocar plano** ou cancele antes                                                                 |
| **Indisponível neste modo** ao trocar o plano                                        | A assinatura é gerenciada pelo Stripe                                                     | Altere-a no Stripe                                                                                    |
| **Verifique os dados informados**: "redirect URLs must start with an allowed origin" | O endereço do Studio não é a URL pública do servidor nem uma origem permitida             | Peça ao operador que adicione a origem do Studio a `security.allowed_origins`                         |
| A assinatura continua **Incompleta**                                                 | O checkout não foi concluído, ou o webhook não chega ao servidor                          | Abra o checkout de novo; peça ao operador que verifique o endpoint e o segredo do webhook             |
| A avaliação não termina (manual)                                                     | A tarefa de cobrança não está agendada                                                    | Peça ao operador que agende `advance_periods`                                                         |
| **Alterado nesse meio-tempo**                                                        | Outra pessoa alterou o plano ou a assinatura                                              | Recarregue e repita                                                                                   |
| Os limites não valem após o cancelamento                                             | Assinaturas canceladas não concedem direitos                                              | Comportamento esperado; vale o padrão do medidor ou a substituição de cota                            |
