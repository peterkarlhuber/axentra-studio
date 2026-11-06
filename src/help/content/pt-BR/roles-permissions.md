---
title: Funções e permissões
summary: Entenda as permissões e as funções integradas, crie funções personalizadas para o seu produto e consulte o catálogo de permissões do produto.
keywords: função, papel, permissão, função personalizada, função integrada, direitos de acesso, direitos, privilégios, escopo, permissão de produto, permissão declarada, permissão descontinuada, RBAC, controle de acesso
---

Uma **permissão** autoriza uma ação, por exemplo `records:write` (criar, alterar e excluir
registros). Uma **função** é um conjunto nomeado de permissões que você atribui a pessoas. O
Axentra nega tudo por padrão: uma pessoa ou chave de API só pode fazer o que uma função ou a lista
de permissões da chave concede explicitamente.

Toda permissão tem um **escopo**:

| Escopo         | Vale para                                                                | Concedida por                                                                                             |
| -------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **plataforma** | Toda a instalação, por exemplo `products:create`                         | Somente funções na plataforma; nunca funções personalizadas nem chaves de API                             |
| **produto**    | Um produto como um todo, por exemplo `tenants:create`, `api_keys:manage` | Funções de produto e chaves de API                                                                        |
| **tenant**     | Dados dentro de um tenant, por exemplo `records:read`                    | Funções de tenant nesse tenant; funções de produto e chaves de API do produto inteiro em todos os tenants |

A lista completa está na [referência de permissões](help:permissions-reference).

> [!IMPORTANT]
> As telas **Funções** e **Permissões** exigem o módulo de acesso e `roles:read` (a tela
> **Permissões** também abre com `api_keys:read`). Criar, editar e excluir funções personalizadas
> exige `roles:manage` (proprietários e administradores do produto).

## Funções integradas {#built-in-roles}

As funções integradas são fornecidas pelo Axentra e não podem ser alteradas. Abra
[Funções](app:roles) e escolha o ícone de olho para ver exatamente quais permissões uma função
integrada tem no seu produto. Os nomes delas vêm do servidor e aparecem em inglês.

| Função             | Escopo  | Finalidade                                                                                                  |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------- |
| **Product owner**  | produto | Controle total do produto, inclusive operadores e permissões de produto                                     |
| **Product admin**  | produto | Gerencia tenants, funções, chaves e dados; não pode gerenciar operadores nem declarar permissões de produto |
| **Support**        | produto | Lê tudo; gerencia membros de tenants até o limite das próprias permissões (na prática: leitores)            |
| **Product viewer** | produto | Acesso somente leitura ao produto e a todos os tenants dele                                                 |
| **Owner**          | tenant  | Controle total do tenant, inclusive de outros proprietários                                                 |
| **Admin**          | tenant  | As mesmas permissões do Owner, mas sem o nível de proprietário                                              |
| **Member**         | tenant  | Trabalha com os dados do tenant                                                                             |
| **Viewer**         | tenant  | Acesso somente leitura ao tenant                                                                            |

Além delas, existem duas funções na plataforma: **Administrador da plataforma** e **Leitor da
plataforma**. Elas são atribuídas na página de um usuário; veja
[usuários](help:users#platform-role).

## Criar uma função personalizada {#create}

Crie uma função personalizada quando nenhuma função integrada servir, por exemplo para um agente de
suporte que pode ler registros, mas não arquivos.

1. Abra [Funções](app:roles) e escolha **Nova função personalizada**.
2. Informe um **Nome**.
3. Confira a **Chave**. O Studio a deriva do nome.
4. Escolha o **Escopo**: **Tenant** para funções que você atribui a membros de tenant, **Produto**
   para funções que você atribui a operadores de produto.
5. Se quiser, informe uma **Descrição**.
6. Selecione as **Permissões** (veja [a lista de permissões](#checklist)).
7. Escolha **Salvar alterações**.

A função passa a ser oferecida onde quer que membros do escopo dela sejam adicionados ou
convidados.

| Campo          | O que faz                                                                                | Valores permitidos / padrão                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**       | Nome exibido nas listas de funções.                                                      | 1–100 caracteres. Pode ser alterado.                                                                                                     |
| **Chave**      | Identificador estável armazenado nas associações, por exemplo `support_agent`.           | 2–41 letras minúsculas, dígitos ou sublinhados; única no produto; não pode ser uma chave integrada como `member`. Não pode ser alterada. |
| **Escopo**     | **Tenant**: apenas permissões de tenant. **Produto**: permissões de produto e de tenant. | Padrão **Tenant**. Não pode ser alterado.                                                                                                |
| **Descrição**  | Explica a função para outros administradores.                                            | Até 500 caracteres.                                                                                                                      |
| **Permissões** | O que a função permite.                                                                  | Até 100 permissões. Permissões da plataforma nunca são oferecidas.                                                                       |

## Editar uma função personalizada {#edit}

Escolha o ícone de lápis de uma função personalizada, altere nome, descrição ou permissões e
escolha **Salvar alterações**. A chave e o escopo permanecem fixos.

> [!WARNING]
> As alterações valem imediatamente para todos que têm a função, em todos os tenants do produto.

## Excluir uma função personalizada {#delete}

1. Escolha o ícone de lixeira da função.
2. Digite o nome da função para confirmar e escolha **Excluir função**.

Uma função que ainda está atribuída a um membro ou operador não pode ser excluída: o servidor
responde **Conflito** com o número de atribuições. Dê outra função a essas pessoas primeiro.

## Usar a lista de permissões {#checklist}

A lista de permissões aparece no editor de funções e ao criar uma chave de API.

- As permissões são agrupadas por recurso (a parte antes dos dois-pontos, por exemplo `records`). A
  caixa de seleção do grupo marca ou desmarca o grupo inteiro; o contador mostra quantas estão
  selecionadas.
- **Filtrar permissões…** pesquisa em nomes e descrições.
- Grupos marcados como **Produto** contêm permissões que o seu próprio produto declarou.
- Cada permissão mostra sua descrição e seu escopo. Uma função de tenant recebe apenas permissões
  de tenant; permissões de produto descontinuadas nunca são oferecidas.

> [!NOTE]
> Uma função personalizada pode conter qualquer permissão do seu escopo. O [teto de
> funções](help:members-invitations#role-ceiling) se aplica quando a função é _atribuída_: só
> pessoas que têm todas as permissões dela podem atribuí-la a alguém.

## Permissões definidas pelo produto {#product-permissions}

Além do catálogo integrado, um produto pode declarar permissões próprias para os próprios
recursos, por exemplo `crm.deals:approve`. Os nomes delas sempre contêm um ponto:
`<namespace>.<resource>:<action>`. Depois de declaradas, podem ser concedidas por funções
personalizadas e chaves de API como as integradas, e o código do seu produto as verifica.

Abra [Permissões](app:permissions) para ver o catálogo do produto. Com `permissions:manage` (proprietários do produto) você também pode declarar permissões lá.

| Coluna                 | Significado                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Permissão**          | Nome e descrição.                                                                                                                                                                                                                                             |
| **Escopo**             | **produto** ou **tenant**.                                                                                                                                                                                                                                    |
| **Também concedida a** | Funções integradas que a têm além das concessões automáticas. **Funções somente leitura** significa que Support, Product viewer e Leitor da plataforma a têm; **Somente proprietários e administradores** significa que nenhuma outra função integrada a tem. |
| **Declarada por**      | **Código do produto** (registrada pelo código do produto na inicialização) ou **API** (declarada pela API HTTP).                                                                                                                                              |
| **Status**             | **Ativa** ou **Descontinuada** com a data. Ative **Mostrar descontinuadas** para listar as descontinuadas.                                                                                                                                                    |

Proprietários do produto, administradores do produto e administradores da plataforma sempre têm
todas as permissões de produto ativas; proprietários e administradores de tenant, todas as de
escopo de tenant.

> [!NOTE]
> Escolha **Declarar permissão** para declarar uma pela API. Nas permissões declaradas assim, o
> lápis altera uma (ou reativa uma descontinuada) e a lixeira a descontinua depois que você digitar
> o nome dela. As permissões registradas pelo código do produto são alteradas no código; o Studio
> não oferece ações para elas. Um produto pode declarar até 500 permissões.

### Permissões descontinuadas {#retired}

Uma permissão descontinuada não concede nada, mesmo onde ainda está armazenada em uma função
personalizada ou chave de API. Declará-la de novo restaura o efeito para quem a tem. Salvar uma
função personalizada no Studio mantém os nomes descontinuados que ela tem (o editor os mostra abaixo
da lista) e não permite adicionar novos, e rotacionar uma chave de API os remove da chave
substituta.

## Solução de problemas {#troubleshooting}

**Conflito: “a role with this key exists” / “this key belongs to a built-in role”.** Escolha uma
chave diferente.

**Verifique os dados informados: “key must be 2-41 lowercase letters, digits or underscores”.**
Remova maiúsculas, hifens e espaços da chave.

**Conflito: “the role is assigned N times; reassign those members first”.** Altere a função desses
membros (nas guias **Membros** dos tenants e do produto) antes de excluí-la.

**Verifique os dados informados: “permissions not allowed for a tenant role”.** Uma função de
tenant só pode conter permissões de tenant.

**Não foi possível carregar o catálogo de permissões.** Falta a você `roles:read` (ou
`api_keys:read`) ou o servidor está inacessível. Recarregue ou fale com um proprietário do produto.

**Alterado nesse meio-tempo.** Outra pessoa salvou a função enquanto você a editava. Feche o
editor, abra a função de novo e repita sua alteração.

**Uma permissão não aparece na lista.** É uma permissão da plataforma (nunca pode ser concedida
aqui), uma permissão de produto do outro escopo ou uma permissão descontinuada.
