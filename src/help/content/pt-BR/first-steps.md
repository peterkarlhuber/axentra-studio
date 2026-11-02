---
title: Primeiros passos
summary: Uma primeira sessão guiada no Studio - crie um produto e um tenant, convide um membro, crie uma chave de API e confirme que cada etapa funcionou.
keywords: começar, primeiros passos, início rápido, tutorial, iniciante, primeiro produto, primeiro tenant, primeira chave de API, primeiro convite, hello world, passo a passo
---

Neste tutorial você monta uma estrutura pequena, mas real e funcional: um produto, um cliente
(tenant) nesse produto, um convite para uma pessoa e uma chave de API que uma máquina pode usar.
Depois de cada etapa você confere o resultado, para ter certeza de que funcionou. Leva cerca de
15 minutos.

Você aprende os termos mais importantes no caminho. Se algum for novo para você, veja os
[conceitos principais](help:concepts).

## Antes de começar {#before-you-start}

> [!IMPORTANT]
>
> - Você está conectado ao Studio, de preferência como **administrador da plataforma** (por
>   exemplo, a conta da [configuração inicial](help:first-run-setup)).
> - Para criar um produto, você precisa da permissão da plataforma `products:create` e de um
>   servidor no **modo multiproduto**. No modo de produto único o produto já existe: pule a
>   [etapa 1](help:first-steps#create-product).
> - Para a [etapa 4](help:first-steps#create-api-key) e a verificação dela, você precisa de uma
>   linha de comando com `curl`.

Use nomes de exemplo. Este tutorial usa o produto “Example CRM” e o tenant “Acme Ltd”.

## Etapa 1: Criar um produto {#create-product}

Um **produto** é a sua aplicação no servidor Axentra. Todo o resto deste tutorial fica dentro dele.

1. Abra [Produtos](app:products).
2. Escolha **Novo produto**.
3. Informe o **Nome** `Example CRM`. O Studio deriva o **Slug** `example-crm`; mantenha-o.
4. Se quiser, adicione uma **Descrição**.
5. Escolha **Criar produto**.

**Resultado esperado:** o Studio exibe a mensagem _Produto “Example CRM” criado_ e abre a página do produto.

**Confira:** abra a guia **Membros**. Sua conta aparece com a função **Product owner**
(proprietário do produto): quem cria um produto se torna o proprietário dele. O produto também
aparece no seletor de produto, no topo.

Agora escolha **Abrir painel**. O painel do “Example CRM” abre; todos os contadores mostram `0`,
exceto **Usuários** (você, como operador do produto) e **Eventos de auditoria (24 h)**.

## Etapa 2: Criar um tenant {#create-tenant}

Um **tenant** é uma organização cliente do seu produto. Os dados dele ficam estritamente separados
de todos os outros tenants.

1. Abra [Tenants](app:tenants) ou escolha **Novo tenant** no painel.
2. Escolha **Novo tenant**.
3. Informe o **Nome** `Acme Ltd`. O Studio deriva o **Slug** `acme-ltd`.
4. Escolha **Criar tenant**.

**Resultado esperado:** o Studio exibe a mensagem _Tenant “Acme Ltd” criado_ e abre a página do tenant
com as guias **Detalhes**, **Membros** e **Convites**. O status é **Ativo**.

**Confira:** de volta ao painel, **Tenants** agora mostra `1`. Anote o **ID** do tenant na guia
**Detalhes** (ele começa com `ten_`); você vai precisar dele na etapa 4.

> [!NOTE]
> Um tenant novo não tem membros. Você os adiciona na próxima etapa.

## Etapa 3: Convidar um membro {#invite-member}

As pessoas entram em um tenant por meio de um **convite** (ou são adicionadas diretamente, se já
tiverem uma conta que você consegue ver).

1. Na página do tenant, abra a guia **Convites**.
2. Escolha **Convidar membro**.
3. Informe o **Endereço de e-mail** de um colega, por exemplo `maria@example.com`.
4. Deixe **Função** em **Member** ou escolha outra função. Funções acima das suas próprias
   permissões não podem ser selecionadas.
5. Escolha **Enviar convite**.

**Resultado esperado:** o diálogo **Convite criado** mostra o segredo do convite, marcado como
**Exibido apenas uma vez**: com o módulo `notify` habilitado, um **Link do convite** (e o Axentra
também envia o convite por e-mail); caso contrário, apenas o **Token do convite**.

6. Copie o link ou o token e envie-o ao seu colega por um canal de confiança; depois escolha
   **Concluído**.

**Confira:** a guia **Convites** lista o convite com o status **Pendente** e uma data de expiração
sete dias à frente.

> [!IMPORTANT]
> Seu colega aceita o convite estando conectado com uma conta que tenha exatamente o endereço de
> e-mail convidado. Como isso funciona, inclusive para pessoas sem conta, está descrito em
> [Integrar uma organização cliente](help:tutorial-onboard-customer#accept-invitation).

## Etapa 4: Criar uma chave de API {#create-api-key}

Uma **chave de API** permite que uma máquina, por exemplo a integração da Acme, chame a API. Cada
chave tem uma lista explícita de permissões; dê a ela apenas o que for necessário.

1. Abra [Chaves de API](app:apiKeys) ou escolha **Nova chave de API** no painel.
2. Escolha **Nova chave de API**.
3. Informe o **Nome** `acme-integration test`.
4. Em **Escopo de tenant**, escolha **Acme Ltd**. A chave então só alcança os dados deste tenant.
5. Em **Permissões**, selecione apenas `tenant:read`.
6. Escolha **Criar chave**.

**Resultado esperado:** o diálogo **Segredo de “acme-integration test”** mostra o **Segredo da
chave de API**, que começa com `axk_`. Copie-o agora: ele só é mostrado desta vez.

7. Marque **Guardei o segredo em local seguro** e escolha **Concluído**.

**Confira:** a chave aparece na lista com o status **Ativo**, escopo **Tenant** e **1 permissão**.

### Testar a chave {#try-api-key}

Chame a API com a chave. Substitua o endereço, o ID do produto (do cartão **Servidor** do painel,
**ID do produto**) e o ID do tenant:

```bash
curl -s https://axentra.example.com/v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE \
  -H "Authorization: Bearer axk_EXAMPLE_SECRET"
```

**Resultado esperado:** uma descrição do tenant em JSON:

```json
{
  "id": "ten_01EXAMPLE",
  "product_id": "prd_01EXAMPLE",
  "slug": "acme-ltd",
  "name": "Acme Ltd",
  "status": "active"
}
```

A resposta real contém mais alguns campos. De volta ao Studio, recarregue **Chaves de API**:
**Último uso** agora mostra um horário.

Se a chamada falhar, veja a [solução de problemas](help:first-steps#troubleshooting). Para
aprender a API, veja [noções básicas da API](help:api-basics).

## Etapa 5: Consultar o log de auditoria {#check-audit}

Tudo o que você acabou de fazer foi registrado.

1. Abra [Log de auditoria](app:audit).
2. Em **Produto**, escolha “Example CRM” e aplique o filtro.

**Resultado esperado:** você vê, do mais recente para o mais antigo, `access.api_key.create`,
`tenancy.invitation.create`, `tenancy.tenant.create` e (no modo multiproduto)
`tenancy.product.create`, cada um com você como autor e o resultado **Sucesso**. Selecione uma
entrada para ver os detalhes.

## O que você construiu {#summary}

```diagram
hierarchy
```

Você tem um produto com um tenant, um convite em aberto e uma chave de API vinculada ao tenant, e
sabe onde verificar cada um deles. Próximos passos:

- Integre um cliente real do início ao fim:
  [Integrar uma organização cliente](help:tutorial-onboard-customer).
- Defina suas próprias funções: [funções e permissões](help:roles-permissions).
- Remova a chave de teste: em **Chaves de API**, abra as ações da chave e escolha
  **Revogar chave**.

## Solução de problemas {#troubleshooting}

| Problema                                      | Causa e solução                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Novo produto** não aparece                  | Você não é administrador da plataforma ou o servidor roda no modo de produto único. Use o produto existente.  |
| **Conflito** ao criar o produto ou o tenant   | O slug já está em uso (produtos: no servidor; tenants: no produto). Escolha outro slug.                       |
| **Verifique os dados informados** para o slug | Slugs têm de 2 a 63 caracteres: letras minúsculas, dígitos e hifens, começando com uma letra ou um dígito.    |
| **Conflito** ao convidar                      | Já existe um convite em aberto para este endereço no tenant. Revogue-o ou use-o.                              |
| **Não permitido** ao criar a chave            | Você selecionou uma permissão que você mesmo não tem.                                                         |
| `curl` responde `401`                         | O segredo está incompleto ou errado, ou a chave foi revogada. Crie uma nova chave.                            |
| `curl` responde `404`                         | O ID do produto ou do tenant está errado, ou a chave está vinculada a outro tenant.                           |
| `curl` responde `403`                         | Falta a permissão à chave (`tenant:read`) ou o tenant está suspenso.                                          |
| O log de auditoria não mostra nada            | Você precisa de `audit:read` para o produto (ou de uma função na plataforma). Verifique o filtro **Produto**. |
