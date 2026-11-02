---
title: Produtos
summary: Crie, configure, arquive e restaure produtos, gerencie operadores de produto e entenda o modo de produto único.
keywords: produto, aplicação, aplicativo, app, projeto, operadores, membros do produto, arquivar, restaurar, configurações do produto, modo de produto único, modo multiproduto, slug
---

Um **produto** é uma aplicação que roda no seu servidor Axentra, por exemplo um CRM ou um serviço
de agendamento. Cada produto tem os próprios tenants, usuários, funções, chaves de API e dados, e
nada é compartilhado entre produtos. As pessoas que operam um produto (em vez de usá-lo como
clientes) são os **operadores** dele: elas têm uma função de produto como **Product owner**
(proprietário do produto) e aparecem na guia **Membros** do produto.

Abra a lista de produtos com [Produtos](app:products) na barra lateral. **Abrir painel** leva você
para dentro de um produto; todas as outras telas da barra lateral passam então a funcionar dentro
desse produto.

> [!IMPORTANT]
> Todos que pertencem a um produto o veem na lista. Administradores e leitores da plataforma veem
> todos os produtos, inclusive os arquivados. Criar, arquivar e restaurar produtos exige as
> permissões da plataforma `products:create` e `products:archive` (administradores da plataforma)
> e só é possível no modo multiproduto. Veja o [modo de produto único](#single-product-mode).

## Criar um produto {#create}

1. Abra [Produtos](app:products) e escolha **Novo produto**.
2. Informe um **Nome**.
3. Confira o **Slug**. O Studio o deriva do nome; você pode alterá-lo antes de criar o produto.
4. Se quiser, informe uma **Descrição**.
5. Escolha **Criar produto**.

O Studio abre a página do novo produto. Você se torna o **Product owner** dele e pode adicionar
outros operadores imediatamente na guia **Membros**.

> [!NOTE]
> O slug não pode ser alterado depois. Escolha um que você não se importe de ver em URLs, logs e
> arquivos de configuração.

### Campos do produto {#fields}

| Campo         | O que faz                                                                | Valores permitidos / padrão                                                                                               |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Nome**      | Nome exibido no Studio e em e-mails, por exemplo nos e-mails de convite. | 1–200 caracteres. Pode ser alterado depois.                                                                               |
| **Slug**      | Identificador estável e adequado para URLs.                              | 2–63 letras minúsculas, dígitos e hifens, começando com uma letra ou um dígito; único no servidor. Não pode ser alterado. |
| **Descrição** | Texto livre exibido na lista de produtos.                                | Até 2.000 caracteres. Opcional.                                                                                           |
| **ID**        | Identificador gerado (`prd_…`) usado pela API.                           | Atribuído pelo servidor.                                                                                                  |
| **Status**    | **Ativo** ou **Arquivado**.                                              | Veja [arquivar um produto](#archive).                                                                                     |

## Alterar as configurações do produto {#settings}

A guia **Configurações** de um produto contém o nome, a descrição e as **Configurações (JSON)**: um
objeto JSON com configurações específicas do produto. O código do seu próprio produto pode lê-lo, e
alguns módulos do Axentra usam chaves dele.

1. Abra o produto em [Produtos](app:products) e selecione a guia **Configurações**.
2. Altere **Nome**, **Descrição** ou **Configurações (JSON)**.
3. Escolha **Salvar alterações**.

As alterações valem imediatamente para todos os tenants do produto.

| Chave em Configurações (JSON) | Usada por    | O que faz                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invitation_accept_url`       | Notificações | Link usado nos e-mails de convite. `{token}` é substituído pelo token do convite; sem ele, `?token=…` é acrescentado. Precisa começar com `http://` ou `https://`. Veja [convites](help:members-invitations). Se a chave não estiver definida, vale a configuração do servidor `notify.invitation_accept_url`; caso contrário, `/accept-invitation` no endereço público da API. |
| `default_locale`              | Notificações | Idioma de reserva para os modelos de notificação, por exemplo `"en"`.                                                                                                                                                                                                                                                                                                           |
| `storage`                     | Arquivos     | Cotas de armazenamento e a política de tipos de conteúdo para envios. Prefira editar a política na guia **Arquivos**. Veja [arquivos](help:files).                                                                                                                                                                                                                              |

```json
{
  "invitation_accept_url": "https://studio.example.com/invitations/accept?token={token}",
  "default_locale": "en"
}
```

> [!WARNING]
> **Salvar alterações** substitui o objeto de configurações inteiro. Se você apagar uma chave do
> texto, ela é removida do produto. O objeto pode ter até cerca de 32.000 caracteres.

> [!IMPORTANT]
> Alterar configurações exige `product:manage` (proprietários e administradores do produto). Sem
> essa permissão, a guia mostra **Você pode ver estas configurações, mas não alterá-las.** Um
> produto arquivado não pode ser editado no Studio; restaure-o antes.

A guia **Arquivos** (somente quando o módulo de arquivos está habilitado) contém a política de
armazenamento do produto. Ela está descrita em [arquivos](help:files).

## Gerenciar operadores de produto {#members}

A guia **Membros** lista os operadores do produto: usuários com uma função de produto. As
permissões de tenant deles valem em **todos** os tenants do produto. Os membros de tenant são
gerenciados em cada tenant; veja [membros e convites](help:members-invitations).

| Função de produto integrada           | Pode fazer                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Product owner** (`product_owner`)   | Tudo no produto, inclusive gerenciar operadores e declarar permissões de produto.                  |
| **Product admin** (`product_admin`)   | Gerencia tenants, funções, chaves de API e dados; não pode gerenciar operadores.                   |
| **Support** (`product_support`)       | Lê tudo e gerencia membros de tenants até o limite das próprias permissões (na prática: leitores). |
| **Product viewer** (`product_viewer`) | Acesso somente leitura ao produto.                                                                 |

Funções de produto personalizadas também aparecem na lista. Veja
[funções e permissões](help:roles-permissions).

### Adicionar um operador {#add-operator}

1. Abra a guia **Membros** e escolha **Adicionar membro**.
2. Informe o **Endereço de e-mail** da pessoa e escolha uma **Função**.
3. Escolha **Adicionar membro**.

> [!IMPORTANT]
> A guia **Membros** exige `product_members:read`; adicionar, alterar e remover operadores exige
> `product_members:manage` (proprietários do produto e administradores da plataforma).

> [!NOTE]
> Não existem convites para operadores. A pessoa já precisa ter uma conta que você consiga ver:
> administradores da plataforma veem todas as contas; usuários com `product_users:read` veem os
> usuários deste produto (membros dos tenants dele e operadores). Para qualquer outra pessoa, o
> servidor responde **Usuário não encontrado**. Convide a pessoa para um dos tenants do produto
> primeiro ou peça a um administrador da plataforma que a adicione.

Para alterar a função de um operador, escolha uma nova na coluna **Função**. Para remover um
operador, escolha o ícone de lixeira na linha dele e confirme. Funções acima do seu nível aparecem,
mas não podem ser selecionadas (veja o [teto de funções](help:members-invitations#role-ceiling)).

## Arquivar um produto {#archive}

Arquivar tira um produto de operação sem excluir nada.

1. Abra o produto em [Produtos](app:products).
2. Escolha **Arquivar**.
3. Digite o nome do produto para confirmar e escolha **Arquivar**.

Enquanto um produto está arquivado:

- operadores e membros de tenants deixam de vê-lo na lista de produtos, e toda requisição que eles
  fazem nele é recusada;
- todas as chaves de API dele param de funcionar (as requisições falham com **Não permitido**);
- administradores da plataforma mantêm acesso total, e leitores da plataforma mantêm acesso de
  leitura;
- o Studio mostra **Este produto está arquivado. Restaure-o para fazer alterações.** e não oferece
  **Abrir painel**.

> [!NOTE]
> O Studio não consegue excluir um produto. Arquivar é a forma de tirá-lo de operação.

## Restaurar um produto {#restore}

1. Abra o produto arquivado (para um administrador da plataforma, ele continua listado com o status
   **Arquivado**).
2. Escolha **Restaurar** e confirme.

O produto, os membros e as chaves de API dele voltam a funcionar imediatamente. Chaves que
expiraram nesse meio-tempo continuam expiradas.

## Modo de produto único {#single-product-mode}

Um servidor Axentra roda em um de dois modos, definido pelo operador do servidor na configuração
do servidor:

|                                               | Modo de produto único (`single`)                                         | Modo multiproduto (`multi`)                        |
| --------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| Produtos                                      | Exatamente um, criado a partir da configuração na primeira inicialização | Qualquer quantidade, criados no Studio ou pela API |
| **Novo produto**, **Arquivar**, **Restaurar** | Não são oferecidos; a API os recusa com **Indisponível neste modo**      | Com `products:create` / `products:archive`         |
| Lista de produtos                             | Mostra o único produto e o aviso **Modo de produto único**               | Todos os produtos aos quais você tem acesso        |

No modo de produto único você continua alterando nome, descrição, configurações e membros do
produto na página dele. Para operar vários produtos, o operador do servidor define
`mode = "multi"` na configuração do servidor; não é necessária migração de dados. Veja a
[configuração do servidor](help:server-configuration).

## Bom saber {#good-to-know}

- As contas de usuário valem para toda a instalação: uma conta pode trabalhar em vários produtos.
- Produtos arquivados mantêm dados, eventos de auditoria e chaves; nada expira por causa do
  arquivamento.
- As configurações do produto não são um cofre de segredos. Não coloque senhas nem tokens em
  **Configurações (JSON)**.

## Solução de problemas {#troubleshooting}

**Conflito ao criar um produto.** Outro produto já usa o slug. Escolha um slug diferente.

**Verifique os dados informados: “slug must be 2-63 lowercase letters, digits or dashes”.**
Remova maiúsculas, espaços e caracteres especiais do slug.

**Este JSON não é válido. / As configurações devem ser um objeto JSON.** **Configurações (JSON)**
precisa ser um único objeto entre chaves, por exemplo `{"key": "value"}`. Arrays, strings simples e
vírgulas sobrando no final são recusados.

**Verifique os dados informados: “settings are too large”** ou uma mensagem sobre `storage`. O
objeto tem mais de cerca de 32.000 caracteres, ou a parte `storage` não é válida. Encurte-o ou
edite a política de armazenamento na guia **Arquivos**.

**Alterado nesse meio-tempo.** Outra pessoa salvou o produto enquanto você editava. Recarregue a
página e aplique sua alteração novamente.

**Indisponível neste modo.** O servidor roda no modo de produto único, no qual não é possível
criar, arquivar nem restaurar produtos.

**Usuário não encontrado ao adicionar um operador.** A pessoa não tem conta, ou não tem uma que
você consiga ver. Veja [adicionar um operador](#add-operator).

**Conflito: “the product needs at least one owner”.** Você tentou remover ou rebaixar o último
**Product owner**. Torne outra pessoa proprietária primeiro.

**Um produto não aparece na lista.** Ele está arquivado (somente administradores e leitores da
plataforma veem produtos arquivados) ou você não é membro dele. Fale com um administrador da
plataforma.
