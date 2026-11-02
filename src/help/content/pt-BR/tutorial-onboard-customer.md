---
title: Integrar uma organização cliente
summary: Configure um novo cliente de ponta a ponta - tenant, administrador e equipe com as funções certas, convites aceitos, uma chave de API para a integração e uma verificação na auditoria.
keywords: onboarding, integração de cliente, novo cliente, configuração de cliente, configuração de tenant, convidar, convite, aceitar convite, proprietário, owner, admin, membro, leitor, integração, chave de API, auditoria, checklist, offboarding, desligamento
---

Um novo cliente, a "Acme Ltd", contratou o seu produto. Neste tutorial, você prepara tudo de que ele
precisa: um tenant próprio, o administrador e a equipe com funções adequadas, uma chave de API para
a integração e uma verificação no log de auditoria de que tudo aconteceu como planejado. Você também
aprende o que o cliente precisa fazer do lado dele para aceitar um convite.

Este tutorial parte dos [primeiros passos](help:first-steps). Reserve cerca de 30 minutos, mais o
tempo de que o cliente precisa para aceitar.

## Antes de começar {#before-you-start}

> [!IMPORTANT]
> Você precisa destas permissões no produto (as funções integradas **Product owner** e **Product
> admin** têm todas; um administrador da plataforma as tem de qualquer forma):
>
> | Tarefa                                | Permissão                                                                                         |
> | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
> | Criar o tenant                        | `tenants:create`                                                                                  |
> | Convidar, adicionar e alterar membros | `members:manage`                                                                                  |
> | Convidar o **Owner** do cliente       | nível de proprietário: operador do produto, proprietário do tenant ou administrador da plataforma |
> | Criar a chave de API                  | `api_keys:manage` e todas as permissões que você colocar na chave                                 |
> | Verificar o log de auditoria          | `audit:read`                                                                                      |

Obtenha do cliente com antecedência:

- o endereço de e-mail do **administrador** e de cada pessoa da equipe,
- o que cada pessoa deve poder fazer,
- o que a integração dele precisa fazer pela API.

## Passo 1: Planejar as funções {#plan-roles}

Escolha as funções antes de convidar alguém; é possível alterá-las depois, mas é mais fácil esquecer.

| Pessoa                             | Função de tenant recomendada | Por quê                                                                                    |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Administrador principal do cliente | **Owner**                    | Controle total do tenant, pode gerenciar todos os membros, inclusive outros proprietários. |
| Administrador substituto           | **Admin**                    | Gerencia membros e dados, mas não pode atribuir nem remover proprietários.                 |
| Equipe que trabalha com dados      | **Member**                   | Lê e grava dados, vê os membros; não pode gerenciar membros.                               |
| Auditores, equipe somente leitura  | **Viewer**                   | Apenas lê dados.                                                                           |

Se nenhuma servir, um operador do produto com `roles:manage` pode criar antes uma função de tenant
personalizada. Veja [funções e permissões](help:roles-permissions).

> [!TIP]
> Dê **Owner** a apenas uma ou duas pessoas. Um segundo proprietário evita um impasse quando o primeiro sai.

## Passo 2: Criar o tenant {#create-tenant}

1. Abra [Tenants](app:tenants) e escolha **Novo tenant**.
2. **Nome**: `Acme Ltd`. Mantenha o **Slug** derivado, `acme-ltd`, ou informe o nome curto do
   cliente. O slug precisa ser único no produto e não pode ser reutilizado enquanto o tenant existir.
3. Escolha **Criar tenant**.

**Resultado esperado:** "Tenant “Acme Ltd” criado"; a página do tenant se abre com o status **Ativo**
e sem membros. Anote o **ID** do tenant (`ten_…`) na guia **Detalhes**.

## Passo 3: Convidar o administrador do cliente {#invite-admin}

1. Na página do tenant, abra **Convites** e escolha **Convidar membro**.
2. **Endereço de e-mail**: o endereço do administrador, por exemplo `admin@acme.example`.
3. **Função**: **Owner**.
4. Escolha **Enviar convite**.

**Resultado esperado:** **Convite criado**, com o **Token do convite** e, se o módulo `notify` estiver
habilitado, um **Link do convite**. Os dois são exibidos apenas uma vez.

### Como o convite chega ao cliente {#delivery}

- **Com o módulo `notify`**, o Axentra envia o convite, incluindo o link, por e-mail para o endereço.
  Você não precisa enviar nada; ainda assim, pode copiar o link como reserva.
- **Sem ele**, copie o **Token do convite** e envie-o você mesmo por um canal confiável, com a
  instrução do [passo 5](help:tutorial-onboard-customer#accept-invitation).

> [!NOTE]
> O link do convite é montado a partir da configuração de produto `invitation_accept_url` (nas
> **Configurações (JSON)** do produto), por exemplo
> `{"invitation_accept_url": "https://app.example.com/accept-invitation?token={token}"}`. Sem essa
> configuração, o link aponta para `/accept-invitation` no endereço público da API. Aponte-o para a
> página do seu produto que aceita convites, ou para a própria página do Studio,
> `https://studio.example.com/invitations/accept?token={token}`, se os seus clientes usam o Studio.

**Confira:** a guia **Convites** mostra o convite com o status **Pendente** e uma data de expiração 7
dias à frente.

## Passo 4: Adicionar a equipe {#add-staff}

Para cada pessoa adicional, escolha um caminho:

- **A pessoa já tem uma conta que você consegue ver** (por exemplo, membro de outro tenant deste
  produto): abra **Membros**, escolha **Adicionar membro**, informe o **Endereço de e-mail**, escolha
  a **Função** e confirme. A pessoa tem acesso na hora.
- **Caso contrário**: convide-a como no passo 3, com a função do passo 1. Se **Adicionar membro**
  responder **Usuário não encontrado**, escolha **Enviar convite**; o Studio cria um convite com a
  mesma função.

O Axentra não revela se um endereço tem conta: o convite funciona da mesma forma para qualquer endereço.

## Passo 5: O cliente aceita {#accept-invitation}

Isto é o que a pessoa convidada faz. Envie estas instruções a ela.

1. **Ter uma conta com exatamente o endereço de e-mail convidado.**
   - Se o seu servidor oferece **login único**, a pessoa entra com **Continuar com …**. Uma conta é
     criada automaticamente para um endereço de e-mail verificado que tenha um convite em aberto.
   - **Apenas com login por senha**, a conta já precisa existir. O Axentra não tem autocadastro pela
     API: contas para login por senha são criadas pelo código do seu próprio produto. Veja
     [usuários](help:users).
2. **Abrir o link do convite.** Se não estiver conectada, a pessoa é levada para **Entrar** e, depois
   do login, de volta ao convite. Com um token em vez de um link, ela abre **Aceitar convite**
   (endereço `/invitations/accept`) depois de entrar e cola o **Token do convite**.
3. Escolher **Aceitar convite**.

**Resultado esperado:** "Convite aceito. Agora você tem acesso." A pessoa passa a ver o produto e o
tenant de acordo com a função dela. Pode levar um momento até que o acesso apareça em todos os
lugares.

**Confira (você):** na guia **Membros** do tenant, a pessoa aparece com a função **Owner**. Em
**Convites**, o status é **Aceito**.

> [!WARNING]
> Os convites são vinculados ao endereço. Se a pessoa entrar com outro endereço, o aceite falha com
> **Não permitido**. Um convite aceito, revogado ou expirado não pode ser usado de novo: crie um
> novo.

## Passo 6: Ajustar funções, se necessário {#change-role}

Na guia **Membros**, escolha uma nova função na lista **Função** do membro; o Studio confirma
"Função atualizada". Para retirar o acesso, escolha **Remover membro**. Você não pode alterar nem
remover membros cuja função esteja acima da sua (marcados com "Acima da sua própria função").

## Passo 7: Criar a chave de API para a integração {#integration-key}

A integração do cliente (por exemplo, a sincronização com o ERP dele) recebe uma chave própria,
vinculada ao tenant dele.

1. Abra [Chaves de API](app:apiKeys) e escolha **Nova chave de API**.
2. **Nome**: diga quem a usa e onde, por exemplo `acme erp-sync production`.
3. **Escopo de tenant**: **Acme Ltd**. Uma chave vinculada a um tenant não pode ver nem alterar
   outros tenants.
4. **Permissões**: apenas o que a integração precisa, por exemplo `records:read` e `records:write`
   para uma sincronização de dados, mais `events:publish` se ela publicar eventos.
5. Escolha **Criar chave**, copie o **Segredo da chave de API**, confirme **Guardei o segredo em local
   seguro** e escolha **Concluído**.

Entregue o segredo ao contato técnico do cliente por um canal seguro (por exemplo, um gerenciador de
segredos compartilhado), nunca por e-mail comum. A integração o envia como
`Authorization: Bearer axk_…`. Teste-o como nos [primeiros passos](help:first-steps#try-api-key).

> [!CAUTION]
> O segredo não pode ser exibido de novo. Se for perdido ou vazar, use **Rotacionar segredo** (com
> um período de carência para trocar sem indisponibilidade) ou **Revogar chave**. Veja
> [Chaves de API](help:api-keys).

## Passo 8: Verificar o log de auditoria {#check-audit}

1. Abra o [Log de auditoria](app:audit).
2. Defina **Produto** como o seu produto. Opcionalmente, informe `tenancy.*` em **Ação** para ver
   apenas eventos de tenants e membros, ou informe o ID do tenant em **ID do tenant** (em **Mais
   filtros**, em telas pequenas).
3. Escolha **Aplicar filtros**.

**Resultado esperado**, do mais recente para o mais antigo:

| Ação                        | Autor                      | Significado                                                                       |
| --------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `access.api_key.create`     | você                       | A chave da integração foi criada.                                                 |
| `tenancy.invitation.accept` | o administrador do cliente | O convite foi aceito.                                                             |
| `tenancy.member.set`        | você                       | Um membro foi adicionado ou uma função foi alterada (se você fez o passo 4 ou 6). |
| `tenancy.invitation.create` | você                       | Um por convite.                                                                   |
| `tenancy.tenant.create`     | você                       | O tenant foi criado.                                                              |

Todos com o resultado **Sucesso**. Uma tentativa de aceite com a conta errada aparece como
`tenancy.invitation.accept` com o resultado **Negado**.

## Checklist de integração {#checklist}

1. Tenant criado, ID anotado.
1. Administrador convidado como **Owner**, convite aceito, visível em **Membros**.
1. Equipe adicionada ou convidada com as funções planejadas; todos os convites **Aceito**.
1. Chave de integração criada, vinculada ao tenant, com permissões mínimas, segredo entregue com segurança.
1. O log de auditoria mostra os eventos esperados.
1. Opcional: assinatura atribuída (veja [planos e assinaturas](help:plans-subscriptions)).

## Quando o cliente sai {#offboarding}

- Primeiro, **Suspender tenant**: os membros e as chaves vinculadas ao tenant perdem o acesso, nenhum
  dado é excluído e você pode reativá-lo.
- **Revogue** a chave da integração.
- Use **Excluir tenant** somente quando os dados precisarem ser eliminados; isso exclui o tenant e
  todos os dados dele e não pode ser desfeito. Veja [tenants](help:tenants).

## Solução de problemas {#troubleshooting}

| Problema                                           | Causa e solução                                                                                                                                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner** não pode ser selecionado                 | Você não tem nível de proprietário ou algumas das permissões da função (teto de funções). Peça a um proprietário do produto ou a um administrador da plataforma.                                   |
| **Conflito** ao convidar                           | Já existe um convite em aberto para este endereço neste tenant. Use-o ou revogue-o.                                                                                                                |
| **Usuário não encontrado** em **Adicionar membro** | Nenhuma conta que você consegue ver tem este endereço. Use **Enviar convite**.                                                                                                                     |
| O cliente não recebe e-mail                        | O módulo `notify` está desligado, ou a entrega do e-mail falhou. Envie você mesmo o link ou o token; verifique as [notificações](help:notifications).                                              |
| O link abre uma página "não encontrada"            | A configuração de produto `invitation_accept_url` está ausente ou errada (veja [entrega](help:tutorial-onboard-customer#delivery)). Envie o token e peça que seja colado em `/invitations/accept`. |
| O aceite falha com **Não permitido**               | A pessoa está conectada com uma conta cujo e-mail é diferente do endereço convidado. Entre com a conta certa ou convide o endereço correto.                                                        |
| O aceite falha com **Não encontrado**              | O convite já foi aceito, revogado ou tem mais de 7 dias. Crie um novo convite.                                                                                                                     |
| O login único falha com "no account"               | Não há convite em aberto para o endereço verificado, e o cadastro está desligado. Verifique o endereço convidado; veja [como entrar](help:signing-in#sso-errors).                                  |
| A integração recebe `403`                          | Falta uma permissão à chave, ou o tenant está suspenso.                                                                                                                                            |
| Nenhum evento no log de auditoria                  | Verifique o filtro **Produto** e se você tem `audit:read`.                                                                                                                                         |
