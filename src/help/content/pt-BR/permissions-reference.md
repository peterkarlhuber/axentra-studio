---
title: Referência de permissões
summary: Todas as permissões integradas do Axentra, quais funções integradas as têm e o que cada uma permite fazer no Studio.
keywords: permissão, lista de permissões, catálogo, matriz de funções, escopo, plataforma, produto, tenant, leitura, gerenciar, direitos de acesso, funções integradas, owner, proprietário, admin, viewer, leitor, support, suporte, member, membro
---

Uma _permissão_ é um direito individual escrito como `resource:action`, por exemplo `files:write`. O
acesso é negado a menos que uma função ou uma chave de API conceda a permissão explicitamente. Esta
página lista todas as permissões integradas, mostra quais funções integradas têm cada uma e diz o
que ela libera no Studio. Para saber como as funções são criadas e atribuídas, veja
[Funções e permissões](help:roles-permissions).

## Como as permissões funcionam {#how-permissions-work}

Toda permissão tem um **escopo**:

- **Plataforma**: vale para toda a instalação. Concedida apenas pelas funções da plataforma
  **Administrador da plataforma** e **Leitor da plataforma**, nunca por funções de produto ou de
  tenant e nunca por chaves de API.
- **Produto**: diz respeito a um produto como um todo (os tenants, funções, chaves, jobs, planos …).
- **Tenant**: diz respeito aos dados dentro de um tenant (registros, arquivos, membros …).

Quem tem o quê:

- Uma **função de tenant** concede permissões de tenant **somente naquele tenant**.
- Uma **função de produto** concede permissões de produto e permissões de tenant **em todos os
  tenants do produto**.
- Uma **função da plataforma** concede as suas permissões em todos os produtos.
- Quem é apenas membro de um tenant ainda recebe `product:read` para o produto, para poder abri-lo e
  escolher o próprio tenant, e nada mais no nível do produto.
- Uma **chave de API** tem exatamente as permissões listadas nela, no produto dela (e, se vinculada,
  apenas no tenant dela).

O Studio oculta botões, guias e diálogos que as suas permissões não permitem. As áreas da barra
lateral continuam visíveis; se você não tiver a permissão de leitura, a página mostra **Não
permitido** com a permissão que falta (veja [solução de problemas](help:troubleshooting#forbidden)).

> [!TIP]
> No Studio, abra [Permissões](app:permissions) para ver o catálogo completo do seu produto,
> incluindo as permissões que o próprio produto declarou, com as descrições do servidor.

## Permissões da plataforma {#platform-permissions}

| Permissão           | Descrição                                       | O que ela libera no Studio                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `products:create`   | Criar produtos (modo de vários produtos)        | **Novo produto** na página Produtos (somente no modo de vários produtos)                                                                                                                                                     |
| `products:archive`  | Arquivar e restaurar produtos                   | Arquivar e restaurar na página do produto (somente no modo de vários produtos)                                                                                                                                               |
| `users:read`        | Listar todos os usuários da instalação          | Abrir a página de detalhes de qualquer usuário, inclusive fora dos seus produtos; listar todos os usuários pela API                                                                                                          |
| `users:manage`      | Desabilitar usuários e revogar as sessões deles | **Desabilitar usuário** / **Habilitar usuário** e **Sair de todos os lugares** na página de um usuário, e a lista **Sessões ativas** dele. Alterar uma **Função na plataforma** também exige ser administrador da plataforma |
| `platform:settings` | Ler as configurações da instalação              | A página [Configurações](app:settings); o status do provedor de cobrança e as configurações de armazenamento exibidos nas páginas de produto                                                                                 |
| `platform:audit`    | Ler eventos de auditoria de toda a instalação   | O [Log de auditoria](app:audit) de todos os produtos, incluindo eventos da plataforma, como logins                                                                                                                           |

## Permissões de produto {#product-permissions}

| Permissão                | Descrição                                                                  | O que ela libera no Studio                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product:read`           | Ver o produto e a visão geral dele                                         | Abrir o produto e o painel dele                                                                                                                                                                   |
| `product:manage`         | Editar detalhes e configurações do produto                                 | Editar nome, descrição e configurações na página do produto (incluindo a política de armazenamento); também permite ler a página [Configurações](app:settings) e o status do provedor de cobrança |
| `product_members:read`   | Ver os operadores do produto                                               | A guia **Membros** da página do produto                                                                                                                                                           |
| `product_members:manage` | Adicionar, alterar e remover operadores do produto                         | Adicionar, alterar e remover membros do produto (dentro do [teto de funções](help:security#role-ceiling))                                                                                         |
| `permissions:manage`     | Declarar e aposentar as permissões próprias do produto pela API            | Nada para clicar no Studio (a página Permissões é somente leitura); permite ler o catálogo de permissões. A declaração está disponível pela API                                                   |
| `product_users:read`     | Ver os usuários que pertencem aos tenants do produto                       | A página [Usuários](app:users) do produto e as páginas de detalhes de usuários                                                                                                                    |
| `tenants:read`           | Listar tenants                                                             | A lista de [Tenants](app:tenants) e as páginas de tenants; os seletores de tenant em outras áreas                                                                                                 |
| `tenants:create`         | Criar tenants                                                              | **Novo tenant** (página Tenants e painel)                                                                                                                                                         |
| `tenants:update`         | Editar e suspender tenants                                                 | Editar, suspender e reativar um tenant; definir a cota de armazenamento de um tenant                                                                                                              |
| `tenants:delete`         | Excluir tenants e todos os dados deles                                     | Excluir um tenant (irreversível)                                                                                                                                                                  |
| `roles:read`             | Ver funções                                                                | A página [Funções](app:roles) e o catálogo de permissões; permite que o Studio mostre quais funções você pode atribuir                                                                            |
| `roles:manage`           | Criar, editar e excluir funções personalizadas                             | **Nova função personalizada**, editar e excluir funções personalizadas                                                                                                                            |
| `api_keys:read`          | Ver chaves de API (nunca os segredos)                                      | A lista de [Chaves de API](app:apiKeys) e o catálogo de permissões                                                                                                                                |
| `api_keys:manage`        | Criar, rotacionar e revogar chaves de API                                  | **Nova chave de API**, **Rotacionar segredo**, **Revogar chave**                                                                                                                                  |
| `audit:read`             | Ler os eventos de auditoria do produto                                     | O [Log de auditoria](app:audit) deste produto                                                                                                                                                     |
| `collections:read`       | Ver estatísticas das coleções de registros                                 | Estatísticas das coleções na [Visão geral dos dados](app:dataOverview)                                                                                                                            |
| `jobs:read`              | Ver jobs em segundo plano e eventos                                        | [Jobs](app:jobs), [Agendamentos](app:schedules), [Eventos](app:events), incluindo a visualização ao vivo                                                                                          |
| `jobs:manage`            | Enfileirar, repetir e cancelar jobs                                        | **Enfileirar job**, repetir e cancelar jobs; criar, editar e excluir agendamentos                                                                                                                 |
| `webhooks:read`          | Ver webhooks e entregas                                                    | [Webhooks](app:webhooks) e as entregas deles                                                                                                                                                      |
| `webhooks:manage`        | Criar, editar e excluir webhooks                                           | Criar, editar e excluir webhooks; rotacionar o segredo de assinatura, enviar um teste, reenviar                                                                                                   |
| `usage:manage`           | Definir medidores e cotas                                                  | Criar e editar medidores; definir cotas de uso dos tenants                                                                                                                                        |
| `billing:manage`         | Gerenciar planos, preços e assinaturas                                     | Criar e editar planos; criar e alterar assinaturas de tenants                                                                                                                                     |
| `notify:manage`          | Gerenciar modelos de notificação e enviar testes                           | [Notificações](app:notifications): modelos, log de mensagens, estatísticas, a caixa de correio local                                                                                              |
| `notify:send_external`   | Enviar notificações para endereços de e-mail que não são membros do tenant | Enviar um teste para qualquer endereço de e-mail, não apenas para membros do tenant                                                                                                               |

## Permissões de tenant {#tenant-permissions}

Quando uma função de produto tem uma permissão de tenant, ela vale em todos os tenants do produto.

| Permissão            | Descrição                                                                  | O que ela libera no Studio                                                                                                                |
| -------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant:read`        | Ver o tenant                                                               | Abrir o tenant ao qual você pertence                                                                                                      |
| `members:read`       | Ver membros e convites do tenant                                           | As guias **Membros** e **Convites** de um tenant; a página [Convites](app:invitations)                                                    |
| `members:manage`     | Convidar, alterar e remover membros do tenant                              | Adicionar membros, convidar, alterar funções, remover membros, revogar convites (dentro do [teto de funções](help:security#role-ceiling)) |
| `records:read`       | Ler registros                                                              | [Registros](app:records) do tenant                                                                                                        |
| `records:write`      | Criar, alterar e excluir registros                                         | Criar, editar e excluir registros                                                                                                         |
| `files:read`         | Listar e baixar arquivos                                                   | [Arquivos](app:files) do tenant, download                                                                                                 |
| `files:write`        | Enviar e excluir arquivos                                                  | Enviar, editar e excluir arquivos                                                                                                         |
| `events:publish`     | Publicar eventos e enfileirar jobs para o tenant                           | **Publicar evento** na página Eventos                                                                                                     |
| `usage:read`         | Ver uso e cotas                                                            | [Uso](app:usage) do tenant, cotas, widgets de uso no painel                                                                               |
| `usage:record`       | Registrar uso                                                              | Registrar uso e confirmar ou liberar reservas de um tenant                                                                                |
| `billing:read`       | Ver assinatura e direitos                                                  | [Planos](app:plans), [Assinaturas](app:subscriptions) e a cobrança de um tenant                                                           |
| `notify:send`        | Enviar notificações                                                        | Enviar notificações de teste para membros do tenant; ver as mensagens do tenant                                                           |
| `notify:preferences` | Gerenciar preferências de notificação                                      | As suas próprias preferências de notificação para um tenant                                                                               |
| `search:query`       | Pesquisar no índice de pesquisa do tenant                                  | [Pesquisa](app:search) no tenant                                                                                                          |
| `search:index`       | Adicionar, substituir e remover documentos no índice de pesquisa do tenant | **Remover do índice** na tela [Pesquisa](app:search)                                                                                      |

## Funções integradas {#built-in-roles}

| Função (chave)                                     | Nível      | Finalidade                                                                                        |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| **Administrador da plataforma** (`platform_admin`) | Plataforma | Todas as permissões em todo lugar; isento do teto de funções                                      |
| **Leitor da plataforma** (`platform_viewer`)       | Plataforma | Todas as permissões de leitura, mais `platform:settings`, `platform:audit` e `search:query`       |
| **Product owner** (`product_owner`)                | Produto    | Controle total do produto, incluindo operadores e nível de proprietário                           |
| **Product admin** (`product_admin`)                | Produto    | Tudo, exceto gerenciar operadores do produto e declarar permissões de produto                     |
| **Support** (`product_support`)                    | Produto    | Lê tudo e gerencia membros de tenants até o limite das próprias permissões (na prática: leitores) |
| **Product viewer** (`product_viewer`)              | Produto    | Acesso somente leitura ao produto                                                                 |
| **Owner** (`tenant_owner`)                         | Tenant     | Todas as permissões de tenant, mais o nível de proprietário                                       |
| **Admin** (`tenant_admin`)                         | Tenant     | Todas as permissões de tenant, sem o nível de proprietário                                        |
| **Member** (`member`)                              | Tenant     | Trabalha com os dados do tenant                                                                   |
| **Viewer** (`viewer`)                              | Tenant     | Acesso somente leitura ao tenant                                                                  |

## Matriz de funções {#role-matrix}

✓ = a função tem a permissão. Abreviações: **PA** Administrador da plataforma, **PV** Leitor da
plataforma, **PO** Product owner, **PAd** Product admin, **Sup** Support, **PVi** Product viewer,
**TO** Owner, **TA** Admin, **M** Member, **V** Viewer.

| Permissão                | PA  | PV  | PO  | PAd | Sup | PVi | TO  | TA  | M   | V   |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `products:create`        | ✓   |     |     |     |     |     |     |     |     |     |
| `products:archive`       | ✓   |     |     |     |     |     |     |     |     |     |
| `users:read`             | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `users:manage`           | ✓   |     |     |     |     |     |     |     |     |     |
| `platform:settings`      | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `platform:audit`         | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `product:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `product_members:read`   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product_members:manage` | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `permissions:manage`     | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `product_users:read`     | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:create`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:update`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:delete`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `roles:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `roles:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `api_keys:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `api_keys:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `audit:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `collections:read`       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:read`              | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:manage`            | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `webhooks:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `webhooks:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `usage:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `billing:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:manage`          | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:send_external`   | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenant:read`            | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:manage`         | ✓   |     | ✓   | ✓   | ✓   |     | ✓   | ✓   |     |     |
| `records:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `records:write`          | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `files:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `files:write`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `events:publish`         | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `usage:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `usage:record`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `billing:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `notify:send`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `notify:preferences`     | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `search:query`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `search:index`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   |     |     |

> [!NOTE]
> **Owner** e **Admin** de um tenant têm as mesmas permissões. A diferença é o nível de
> proprietário: apenas um proprietário (ou um operador do produto ou administrador da plataforma)
> pode tornar alguém proprietário, ou alterar ou remover um proprietário. Veja
> [teto de funções](help:security#role-ceiling).

## Permissões que um produto declara {#product-defined}

Além do catálogo integrado, um produto pode declarar permissões próprias, no formato
`<namespace>.<resource>:<action>`, por exemplo `crm.deals:approve`. Elas aparecem na página
[Permissões](app:permissions), em **Permissões do produto**, e você pode concedê-las em funções
personalizadas e chaves de API como as integradas.

- **Product owner**, **Product admin** e **Administrador da plataforma** têm todas elas; **Owner** e
  **Admin** de um tenant têm as de escopo de tenant.
- **Product viewer**, **Support** e **Leitor da plataforma** têm as somente leitura.
- **Member** e **Viewer** têm apenas as que o produto lista para eles (coluna **Também concedida
  a**).
- Uma permissão _aposentada_ não tem mais efeito nenhum, mesmo onde ainda aparece listada.

## Chaves de API e permissões {#api-keys}

Uma [chave de API](help:api-keys) tem apenas as permissões selecionadas na criação, e apenas no
produto dela (e no tenant, se vinculada). Você só pode dar a uma chave permissões que você mesmo tem
no nível do produto. Permissões da plataforma nunca estão disponíveis para chaves.

## Solução de problemas {#troubleshooting}

| Situação                                                                  | O que fazer                                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Não permitido** com `missing permission …`                              | Encontre a permissão acima e peça uma função que a tenha.                                                                                               |
| Um membro de tenant vê o produto, mas nenhuma página de produto           | Esperado: membros de tenant recebem apenas `product:read` no nível do produto. Eles trabalham no próprio tenant.                                        |
| Uma função não pode ser selecionada (**“… (acima das suas permissões)”**) | A função tem permissões que você não tem, ou é uma função de proprietário. Veja [teto de funções](help:security#role-ceiling).                          |
| Falta uma permissão no editor de funções                                  | Funções de tenant oferecem apenas permissões de tenant; permissões da plataforma nunca são oferecidas; permissões de produto aposentadas ficam ocultas. |
| O campo de função é uma caixa de texto simples                            | Você não pode ler funções (`roles:read`); o Studio não consegue listá-las. Digite a chave da função; o servidor a verifica.                             |
