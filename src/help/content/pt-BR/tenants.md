---
title: Tenants
summary: Crie tenants para seus clientes, renomeie, suspenda, reative e exclua-os, e entenda o que cada ação faz com o acesso e os dados.
keywords: tenant, cliente, organização, empresa, conta, workspace, espaço de trabalho, locatário, suspender, reativar, excluir tenant, slug
---

Um **tenant** é um cliente ou uma organização dentro de um produto. Os dados de cada tenant
(registros, arquivos, uso, assinaturas, notificações) ficam estritamente separados dos de todos os
outros tenants, inclusive no banco de dados. As pessoas obtêm acesso a um tenant por meio de uma
**associação** com uma função de tenant; veja [membros e convites](help:members-invitations).

Crie um tenant por cliente. Operadores de produto (usuários com uma função de produto) trabalham em
todos os tenants; membros de tenant veem apenas o próprio tenant.

```diagram
hierarchy
```

> [!IMPORTANT]
> A tela **Tenants** exige o módulo de tenants. Ver a lista exige `tenants:read`; sem essa
> permissão, você vê apenas os tenants dos quais é membro. Criar exige `tenants:create`; renomear,
> suspender e reativar, `tenants:update`; excluir, `tenants:delete`. Proprietários e
> administradores do produto têm todas elas.

## Encontrar um tenant {#find}

Abra [Tenants](app:tenants). Use **Pesquisar tenants** para filtrar por nome ou slug e o filtro
**Status** para mostrar apenas tenants **Ativo** ou **Suspenso**. A coluna **Membros** conta as
associações do tenant.

Para encontrar rápido os tenants suspensos, escolha **Suspenso** no filtro **Status**; o filtro
fica no endereço da página, então você pode salvar ou compartilhar a lista filtrada.

## Criar um tenant {#create}

1. Abra [Tenants](app:tenants) e escolha **Novo tenant**.
2. Informe o **Nome**, por exemplo a razão social do cliente.
3. Confira o **Slug**. O Studio o deriva do nome; você pode alterá-lo antes de criar o tenant.
4. Escolha **Criar tenant**.

O Studio abre o novo tenant. Ele ainda não tem membros: adicione a primeira pessoa do cliente na
guia **Membros** ou convide-a na guia **Convites**, normalmente com a função **Owner**
(proprietário). Veja [membros e convites](help:members-invitations).

| Campo      | O que faz                                                                              | Valores permitidos / padrão                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**   | Nome exibido no Studio e nos e-mails de convite.                                       | 1–200 caracteres. Pode ser alterado depois.                                                                                     |
| **Slug**   | Identificador estável e adequado para URLs, também digitado para confirmar a exclusão. | 2–63 letras minúsculas, dígitos e hifens, começando com uma letra ou um dígito; único dentro do produto. Não pode ser alterado. |
| **ID**     | Identificador gerado (`ten_…`) usado pela API.                                         | Atribuído pelo servidor.                                                                                                        |
| **Status** | **Ativo** ou **Suspenso**.                                                             | Tenants novos ficam **Ativo**.                                                                                                  |

> [!TIP]
> Pela API, um tenant pode ser criado já com um proprietário em uma única etapa (`owner_user_id`)
> e pode ter o próprio objeto `settings`. O Studio não mostra esses recursos.

## Renomear um tenant {#rename}

1. Abra o tenant e permaneça na guia **Detalhes**.
2. Altere o **Nome** em **Editar tenant**.
3. Escolha **Salvar alterações**.

O slug e o ID nunca mudam.

## Suspender um tenant {#suspend}

Suspender bloqueia todo o acesso a um tenant sem excluir nada, por exemplo quando um cliente não
pagou ou um contrato está pausado.

1. Abra o tenant.
2. Escolha **Suspender tenant** e confirme.

Enquanto um tenant está suspenso:

- os membros dele não conseguem acessá-lo; as requisições deles são recusadas com
  **Não permitido**;
- chaves de API vinculadas ao tenant, e chaves do produto inteiro que atuam nele, também são
  recusadas;
- os operadores de produto perdem acesso aos dados do tenant (membros, convites, registros,
  arquivos, uso, cobrança); eles ainda podem abrir a página do tenant, que mostra **Este tenant
  está suspenso**, e reativá-lo. O tenant continua na lista [Tenants](app:tenants) com o status
  **Suspenso**;
- administradores da plataforma mantêm acesso total, e leitores da plataforma mantêm acesso de
  leitura;
- nenhum dado é excluído.

## Reativar um tenant {#reactivate}

Reativar exige `tenants:update`, que proprietários e administradores do produto têm; você não
precisa ser administrador da plataforma.

1. Abra o tenant suspenso, por exemplo em [Tenants](app:tenants) com o filtro **Status** em
   **Suspenso**. A página mostra o aviso **Este tenant está suspenso**.
2. Escolha **Reativar tenant**. Na lista, a mesma ação fica no menu de ações (**⋯**) da linha de um
   tenant suspenso.
3. Leia a confirmação e escolha **Reativar tenant**.

Membros e chaves voltam a funcionar imediatamente, com os mesmos papéis e permissões de antes, e o
status muda para **Ativo** na página do tenant e na lista. O log de auditoria registra a alteração
como `tenancy.tenant.update` com o status anterior e o novo.

Enquanto o tenant está suspenso, as abas **Membros** e **Convites** mostram **Indisponível enquanto
o tenant estiver suspenso** em vez das listas, porque o servidor mantém os dados do tenant
fechados. Quem não tem `tenants:update` (por exemplo, leitores ou suporte do produto) vê o aviso,
mas não a ação **Reativar tenant**.

## Excluir um tenant {#delete}

> [!CAUTION]
> Excluir um tenant não pode ser desfeito. O tenant é removido junto com os registros, arquivos,
> associações, convites, chaves de API vinculadas a ele, dados de uso, assinatura, notificações e
> pesquisa. Se tiver dúvida, [suspenda](#suspend) o tenant.

1. Abra o tenant.
2. Escolha **Excluir tenant**.
3. Digite o **slug** do tenant (não o nome) para confirmar e escolha **Excluir tenant**.

O Studio volta para a lista de tenants. O log de auditoria mantém o registro da exclusão. O
conteúdo dos arquivos armazenados é removido do backend de armazenamento pela manutenção regular de
armazenamento do servidor.

## Navegar pelos dados de um tenant {#records}

**Ver registros** na página do tenant abre [Registros](app:records) filtrado por este tenant. Esse
botão aparece quando o módulo de registros está habilitado e você tem `records:read` no tenant.
Veja [registros](help:records).

## Bom saber {#good-to-know}

- Um usuário pode ser membro de vários tenants, no mesmo produto ou em produtos diferentes, com uma
  função diferente em cada um.
- Operadores de produto não precisam de associação: a função de produto deles já abrange todos os
  tenants.
- Os seletores em outras telas (por exemplo **Escopo de tenant** nas chaves de API ou a tela
  **Convites**) listam os 200 tenants mais antigos, ordenados por nome.

## Solução de problemas {#troubleshooting}

**Conflito: “a tenant with this slug exists in the product”.** Escolha um slug diferente. Slugs de
tenants excluídos podem ser reutilizados.

**Verifique os dados informados: “slug must be 2-63 lowercase letters, digits or dashes”.**
Remova maiúsculas, espaços e caracteres especiais do slug.

**Não permitido ao abrir um tenant.** O tenant está suspenso e você é membro dele (só operadores
de produto e administradores da plataforma podem abrir um tenant suspenso; veja
[reativar](#reactivate)), o produto está arquivado ou falta a você `tenant:read` nele.

**Não encontrado ao abrir um tenant.** O tenant foi excluído ou você não tem nenhuma relação com
ele (o Axentra responde da mesma forma para que IDs de tenants não possam ser sondados).

**Alterado nesse meio-tempo.** Outra pessoa alterou o tenant enquanto você editava. Recarregue a
página e repita sua alteração.

**O botão de exclusão continua desabilitado.** Digite o slug exatamente como aparece no diálogo,
por exemplo `acme`, não o nome de exibição.

**Não há botão Novo tenant.** Falta a você `tenants:create`. Peça a um proprietário ou
administrador do produto.

**Não há a ação Reativar tenant.** Falta a você `tenants:update`. Peça a um proprietário ou
administrador do produto.

**Alterado nesse meio-tempo ao reativar.** Outra pessoa alterou o tenant antes. O Studio o recarrega;
confira o status e escolha **Reativar tenant** de novo se ele ainda estiver suspenso.
