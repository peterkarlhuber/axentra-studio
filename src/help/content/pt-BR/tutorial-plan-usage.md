---
title: Planos e uso de ponta a ponta
summary: Defina um medidor e um plano com limite de uso, faça um tenant assinar, registre uso pela API e acompanhe a cota no Studio.
keywords: tutorial, passo a passo, exemplo, medição, cota, limite do plano, direito, assinatura, chave de API, registrar uso, 429, cota excedida
---

Neste tutorial, você limita as chamadas de API de um cliente por meio do plano dele. Você cria um
medidor `api_calls`, um plano gratuito **Starter** que permite 1.000 chamadas por mês e habilita um
recurso de exportação, faz o tenant `acme` assiná-lo, registra uso com uma chave de API e acompanha a
cota se encher no Studio. No final, você provoca de propósito uma requisição recusada. Leva cerca de
15 minutos.

> [!IMPORTANT]
> Você precisa de: os módulos `usage` e `billing` no servidor; uma função de produto com
> `usage:manage`, `billing:manage` e o direito de criar chaves de API (por exemplo **Product owner**
> ou **Product admin**); um tenant para trabalhar (aqui, `acme`; veja [Tenants](help:tenants)); e um
> terminal com `curl`. Todos os IDs, chaves e endereços abaixo são exemplos: use os seus.

## Passo 1: Criar o medidor {#step-meter}

1. Abra [Uso](app:usage), guia **Medidores**, e escolha **Novo medidor**.
2. Informe:

   | Campo                      | Valor                   |
   | -------------------------- | ----------------------- |
   | **Chave**                  | `api_calls`             |
   | **Nome**                   | Chamadas de API         |
   | **Unidade**                | chamadas                |
   | **Agregação**              | **Soma**                |
   | **Período de redefinição** | **Período de cobrança** |
   | **Limite padrão**          | `100`                   |
   | **Aplicação**              | **Limite rígido**       |

3. Escolha **Criar medidor**.

O limite padrão de 100 vale para tenants sem limite de plano, por exemplo tenants sem assinatura.
**Período de cobrança** faz o contador acompanhar o ciclo da assinatura de cada tenant. Detalhes:
[Uso e cotas](help:usage#create-meter).

## Passo 2: Criar um plano com direitos {#step-plan}

1. Abra [Planos](app:plans) e escolha **Novo plano**.
2. **Nome**: Starter, **Chave**: `starter`, **Dias de avaliação**: `0`, **Ativo** ligado.
3. Deixe **Preços** vazio. O plano é gratuito, então a assinatura começa na hora com qualquer
   provedor de pagamento.
4. Em **Direitos**, escolha **Adicionar direito** duas vezes:
   - **Tipo** **Limite**, **Chave do medidor** `api_calls`, **Limite** `1000`;
   - **Tipo** **Recurso**, **Nome do recurso** `export`, **Ativado** ligado.
5. Escolha **Criar plano**.

Agora o plano tem `limit.api_calls: 1000` e `feature.export: true`. Detalhes:
[Direitos](help:plans-subscriptions#entitlements).

> [!NOTE]
> Um plano pago funciona da mesma forma, mas a assinatura exige um checkout no provedor de pagamento
> (a menos que o servidor use o provedor manual). Veja
> [Fazer um tenant assinar um plano](help:plans-subscriptions#subscribe).

## Passo 3: Fazer o tenant assinar {#step-subscribe}

1. Abra [Assinaturas](app:subscriptions). Em **Cobrança de um tenant**, escolha `acme` e selecione
   **Abrir**.
2. Em **Assinatura**, escolha **Assinar um plano**, depois **Starter (starter)**, e escolha
   **Assinar**.
3. A assinatura mostra **Ativa**. **Direitos efetivos** lista `export: on` em **Recursos** e
   `api_calls` 1.000 em **Limites**.

## Passo 4: Criar uma chave de API para registrar uso {#step-api-key}

1. Abra [Chaves de API](app:apiKeys) e escolha **Nova chave de API**.
2. **Nome**: `usage-demo`. Em **Escopo de tenant**, escolha `acme`, para que a chave só possa mexer
   nesse tenant.
3. Em **Permissões**, selecione `usage:record` e `usage:read`.
4. Crie a chave e copie o segredo. Ele é exibido apenas uma vez.

Guarde no terminal os valores de que você precisa (valores de exemplo):

```bash
export AX=https://axentra.example.com
export PID=prd_01EXAMPLE
export TID=ten_01EXAMPLE
export KEY=axk_EXAMPLE_secret
```

O ID do produto aparece na página do produto; o ID do tenant, na página do tenant e na página de
cobrança dele. Veja [Chaves de API](help:api-keys) e [Noções básicas da API](help:api-basics).

## Passo 5: Registrar uso {#step-record}

Registre uma chamada de API. Cada evento distinto precisa da própria `Idempotency-Key`; o seu produto
usaria o ID da requisição dele.

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0001" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 1, "properties": {"endpoint": "/reports"}}'
```

A resposta (`201 Created`, resumida) contém o evento e a cota depois dele:

```json
{
  "event": {
    "id": "uev_01EXAMPLE",
    "meter": "api_calls",
    "quantity": 1,
    "idempotency_key": "demo-0001"
  },
  "replayed": false,
  "quota": {
    "meter": "api_calls",
    "used": 1,
    "reserved": 0,
    "limit": 1000,
    "remaining": 999,
    "enforcement": "hard",
    "source": "plan",
    "over_limit": false
  }
}
```

Execute o mesmo comando de novo: a resposta é `200` com `"replayed": true`, e o uso continua contando
uma única vez. É isso que torna seguras as novas tentativas após um erro de rede.

Agora registre um lote maior com uma nova chave:

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0002" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 950}'
```

`remaining` agora é 49.

## Passo 6: Acompanhar a cota no Studio {#step-watch}

1. Abra [Uso](app:usage), guia **Uso do tenant**, e escolha `acme` (ou selecione **Uso** no
   cabeçalho da página de cobrança do tenant).
2. O cartão `api_calls` mostra 951 chamadas, uma barra em 95 %, os selos **Do plano** e **Limite
   rígido** e **Restante** de 49 chamadas.
3. **Eventos de uso** lista os dois eventos com as chaves de idempotência e a propriedade `endpoint`.
4. **Uso diário** mostra a barra de hoje, e a guia **Visão geral** mostra `acme` em **Totais por
   tenant**.

## Passo 7: Ultrapassar o limite {#step-exceed}

Tente registrar mais 50 chamadas (951 + 50 > 1.000):

```bash
curl -sS -i -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0003" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 50}'
```

O servidor responde `429` com um cabeçalho `Retry-After` e um corpo de problema como este (resumido):

```json
{
  "code": "quota_exceeded",
  "status": 429,
  "detail": "the api_calls limit of this period would be exceeded",
  "meter": "api_calls",
  "limit": 1000,
  "used": 951,
  "reserved": 0,
  "requested": 50,
  "period_end": "2026-12-02T00:00:00+00:00"
}
```

Nada foi registrado. Agora o seu produto recusaria a requisição do cliente ou ofereceria um upgrade.

## Passo 8: Dar mais margem ao tenant {#step-override}

Suponha que você combine dar à `acme` 2.000 chamadas neste período:

1. Em **Uso do tenant**, escolha **Definir substituição** no cartão `api_calls`.
2. Informe **Limite** `2000`, mantenha **Limite rígido** e escolha **Salvar substituição**.
3. O selo muda para **Substituição do tenant**. Repita a requisição do passo 7: ela é aceita com
   `"source": "quota"`.

Escolha **Remover substituição** para voltar ao limite do plano. Para alterar o limite de todos os
tenants do plano, edite o direito do plano. Detalhes: [De onde vem o limite
efetivo](help:usage#limit-source).

## O que o seu produto faz com isso {#in-your-product}

- Antes de uma ação que consome um recurso medido, registre o uso. Trate `429 quota_exceeded` como
  “limite atingido” e mostre ao cliente uma mensagem clara.
- Leia os recursos do tenant com
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements` e habilite a exportação
  apenas quando `features.export` for `true`.
- Para trabalhos demorados, reserve primeiro e confirme depois; veja
  [Reservas](help:usage#reservations).

## Limpeza {#clean-up}

- Revogue a chave `usage-demo` em [Chaves de API](app:apiKeys).
- Cancele a assinatura na página de cobrança do tenant com **Cancelar agora**, se você não precisar
  dela.
- O medidor não pode ser excluído porque tem uso. **Desative**-o se você não o quiser.
- O plano não pode ser excluído porque uma assinatura o usou. **Desative**-o.

## Solução de problemas {#troubleshooting}

| O que você vê                                      | Por quê                                                             | O que fazer                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `401`                                              | A chave está errada, revogada ou expirada                           | Verifique `$KEY`; crie uma nova chave                                                     |
| `403`                                              | A chave não tem `usage:record`, ou está vinculada a outro tenant    | Verifique as permissões e o **Escopo de tenant** da chave                                 |
| `404`                                              | ID de produto ou de tenant errado, ou a chave do medidor não existe | Compare os IDs com o Studio; verifique a chave do medidor                                 |
| `409` “the meter is inactive”                      | O medidor foi desativado                                            | **Ative**-o em **Medidores**                                                              |
| `409` para a chave de idempotência                 | A chave já foi usada com outro corpo                                | Use uma nova `Idempotency-Key`                                                            |
| `422`                                              | Falta a `Idempotency-Key`, ou a quantidade é inválida               | Envie o cabeçalho; use uma quantidade igual ou maior que 0 com no máximo 6 casas decimais |
| O cartão mostra **Padrão do medidor** e limite 100 | A assinatura não está ativa, ou o plano não tem `limit.api_calls`   | Verifique os passos 2 e 3                                                                 |
| `429` antes do esperado                            | Reservas ou outros eventos também contam                            | Veja **Reservado** e **Eventos de uso**                                                   |
