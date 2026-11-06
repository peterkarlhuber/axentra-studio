---
title: Conceitos principais
summary: Os blocos de construção do Axentra em palavras simples, da plataforma e do produto até tenant, função, permissão e chave de API.
keywords: termos, terminologia, conceitos básicos, modelo, hierarquia, plataforma, produto, tenant, cliente, organização, usuário, membro, operador, convite, função, permissão, módulo, chave de API, produto único, multiproduto, modo
---

Este artigo explica os termos que você encontra em todo o Studio e como eles se relacionam. Leia-o
uma vez antes de começar; o [glossário](help:glossary) traz definições curtas para consultar
depois.

```diagram
hierarchy
```

## Plataforma (instalação) {#platform}

A **plataforma** é um servidor Axentra com seu banco de dados. As contas de usuário existem uma
única vez por plataforma e podem pertencer a vários produtos. As páginas da plataforma inteira no
Studio são **Produtos**, **Log de auditoria**, **Integridade do sistema**, **Monitoramento** e
**Configurações**.

### Funções na plataforma {#platform-roles}

Um usuário pode ter uma função na plataforma, que vale para **todos os produtos** do servidor:

| Função na plataforma                           | O que ela permite                                                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Administrador da plataforma (`platform_admin`) | Controle total da instalação: criar e arquivar produtos, gerenciar todos os usuários e suas funções na plataforma, ler tudo. |
| Leitor da plataforma (`platform_viewer`)       | Acesso de leitura a toda a instalação.                                                                                       |

O primeiro administrador da plataforma é criado durante a
[configuração inicial](help:first-run-setup). Outras funções na plataforma são atribuídas na página
de um usuário (veja [usuários](help:users)). O último administrador da plataforma não pode ser
desabilitado nem perder a função.

## Produto {#product}

Um **produto** é uma aplicação que roda na plataforma, por exemplo “Example CRM”. Cada produto tem
os próprios tenants, funções, chaves de API, dados, planos e modelos, isolados de todos os outros
produtos. A maioria das páginas do Studio pertence a um produto; o endereço então começa com
`/p/<product id>/` e o [seletor de produto](help:interface#product-switcher) mostra qual é.

Quem gerencia um produto como um todo são os **operadores de produto**. Eles têm uma função de
produto:

| Função de produto integrada              | Em resumo                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Product owner (proprietário do produto)  | Controle total do produto. Quem cria um produto se torna o proprietário dele.                                           |
| Product admin (administrador do produto) | Gerencia tenants, funções, chaves e dados; não pode gerenciar operadores de produto nem declarar permissões de produto. |
| Support (suporte)                        | Lê tudo no produto e gerencia membros de tenants até o limite das próprias permissões.                                  |
| Product viewer (leitor do produto)       | Acesso somente leitura ao produto.                                                                                      |

Uma função de produto que contém permissões de tenant as concede em **todos** os tenants do
produto. Veja [produtos](help:products).

## Tenant {#tenant}

Um **tenant** é um cliente ou uma organização dentro de um produto, por exemplo “Acme Ltd”. Os
dados de tenants diferentes ficam estritamente separados, inclusive dentro do banco de dados
(segurança em nível de linha). Um tenant está **ativo** ou **suspenso**; suspender bloqueia os
membros dele e as chaves de API vinculadas a ele sem excluir dados. Veja [tenants](help:tenants).

## Usuário {#user}

Um **usuário** é uma pessoa com uma conta na plataforma, normalmente identificada por um endereço
de e-mail. A mesma conta pode ser membro de vários tenants e operadora de vários produtos. Um
usuário pode estar **ativo** ou **desabilitado**; desabilitar encerra todas as sessões
imediatamente.

As contas não são criadas no Studio. Elas vêm da [configuração inicial](help:first-run-setup), de
um login por [login único](help:signing-in#sso) ou do próprio código do seu produto (Axentra usado
como biblioteca). Veja [usuários](help:users).

## Membro {#member}

Um **membro** é um usuário com uma **função de tenant** em um tenant. É a associação que dá a uma
pessoa acesso aos dados de um tenant. Funções de tenant integradas:

| Função de tenant integrada | Em resumo                                                      |
| -------------------------- | -------------------------------------------------------------- |
| Owner (proprietário)       | Controle total do tenant.                                      |
| Admin (administrador)      | Gerencia membros e dados do tenant.                            |
| Member (membro)            | Trabalha com os dados do tenant. A função padrão dos convites. |
| Viewer (leitor)            | Acesso somente leitura ao tenant.                              |

Não confunda membros de tenant com **operadores de produto** (membros do produto), que têm uma
função de produto. Veja [membros e convites](help:members-invitations).

## Convite {#invitation}

Um **convite** pede a uma pessoa, pelo endereço de e-mail, que entre em um tenant com uma
determinada função. Ele contém um token de uso único, vale por 7 dias e pode ser revogado. A pessoa
convidada o aceita enquanto está conectada com uma conta que tem **o mesmo endereço de e-mail**.
Operadores de produto podem ser convidados para a equipe de um produto da mesma forma. Veja [membros
e convites](help:members-invitations).

## Função {#role}

Uma **função** é um conjunto nomeado de permissões. O Axentra traz funções integradas (acima) que
não podem ser alteradas. Um produto pode adicionar **funções personalizadas** com um **escopo**:

- Escopo **Tenant**: atribuídas a membros de tenant, contêm apenas permissões de tenant.
- Escopo **Produto**: atribuídas a operadores de produto, podem conter permissões de produto e de
  tenant.

Veja [funções e permissões](help:roles-permissions).

## Permissão {#permission}

Uma **permissão** é um direito individual escrito como `resource:action`, por exemplo
`tenants:create` ou `records:write`. O acesso é negado, a menos que uma função ou chave de API
conceda a permissão explicitamente. Toda permissão tem um escopo:

| Escopo     | Significado                                                                                  | Exemplos                                            |
| ---------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Plataforma | Vale para toda a instalação; somente funções na plataforma as concedem, nunca chaves de API. | `products:create`, `users:manage`                   |
| Produto    | Sobre um produto como um todo.                                                               | `tenants:create`, `api_keys:manage`, `roles:manage` |
| Tenant     | Sobre dados dentro de um tenant.                                                             | `members:manage`, `records:read`, `files:write`     |

Os produtos também podem declarar **permissões próprias**, com um namespace e um ponto, por exemplo
`crm.deals:approve`. A lista completa está na
[referência de permissões](help:permissions-reference).

### Teto de funções {#role-ceiling}

Poder gerenciar membros não significa poder atribuir qualquer função. Você só pode atribuir uma
função se tiver **todas as permissões dessa função**; funções de proprietário exigem, além disso,
nível de proprietário. Administradores da plataforma estão isentos. O Studio marca as funções acima
do seu nível como não selecionáveis. A mesma regra vale para chaves de API: uma chave só pode
receber permissões que você tem.

## Módulo {#modules}

Um **módulo** é um bloco funcional do servidor que o operador ativa ou desativa na configuração do
servidor. `identity`, `tenancy`, `access`, `data` e `audit` estão sempre habilitados. Os módulos
opcionais incluem `storage` (arquivos), `events` (jobs, agendamentos, eventos, webhooks), `usage`,
`billing` e `notify` (notificações).

No Studio, um item da barra lateral cujo módulo não está habilitado continua visível e mostra
**Desat.**. Ao abri-lo, aparece **Módulo não habilitado neste servidor** com o ID do módulo que o
operador precisa habilitar. O cartão **Servidor** do painel lista todos os módulos e o estado de
cada um. Veja a [referência de módulos](help:modules-reference).

## Chave de API {#api-key}

Uma **chave de API** permite que uma máquina (o backend do seu produto, uma integração, um script)
chame a API sem um usuário. Cada chave pertence a exatamente um produto, tem uma lista explícita de
permissões e pode, opcionalmente, ser vinculada a um tenant. O segredo dela é mostrado **uma única
vez**; o Axentra armazena apenas um hash. Veja [chaves de API](help:api-keys).

## Registros e arquivos {#records-files}

- **Registros** são documentos JSON armazenados em coleções nomeadas dentro de um tenant, por
  exemplo uma coleção `contacts`. Veja [registros](help:records) e a
  [visão geral dos dados](help:data-overview).
- **Arquivos** são objetos binários enviados (documentos, imagens) com metadados, armazenados por
  tenant (módulo `storage`). Veja [arquivos](help:files).

## Eventos e jobs {#events-jobs}

Com o módulo `events`, o Axentra executa trabalho em segundo plano e informa outros sistemas sobre
o que aconteceu:

- **Jobs**: unidades de trabalho em segundo plano com status, novas tentativas e resultados. Veja
  [jobs](help:jobs).
- **Agendamentos**: jobs executados segundo uma programação cron. Veja
  [agendamentos](help:schedules).
- **Eventos**: registros de coisas que aconteceram, por exemplo “um contato foi criado”. Veja
  [eventos](help:events).
- **Webhooks**: chamadas HTTP que entregam eventos aos seus endpoints, assinadas com um segredo.
  Veja [webhooks](help:webhooks).

## Uso e cobrança {#usage-billing}

- **Uso** (módulo `usage`) contabiliza o consumo por tenant com **medidores**, por exemplo chamadas
  de API ou armazenamento, e pode impor **cotas**. Veja [uso](help:usage).
- **Cobrança** (módulo `billing`) define **planos** com preços e direitos e os atribui aos tenants
  como **assinaturas**. O Studio nunca lida com dados de cartão. Veja
  [planos e assinaturas](help:plans-subscriptions).

## Log de auditoria {#audit-log}

Toda alteração, e toda tentativa recusada, é gravada no **log de auditoria** na mesma transação da
alteração: quem (autor), o quê (ação, por exemplo `tenancy.tenant.create`), sobre o quê (alvo),
quando e com qual resultado (permitido ou negado). Veja [log de auditoria](help:audit).

## Modo de produto único e multiproduto {#single-multi-product}

O servidor roda em um de dois **modos**, definido pelo operador:

|                            | Produto único                                                                         | Multiproduto                                                    |
| -------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Produtos                   | Exatamente um, criado a partir da configuração do servidor na primeira inicialização. | Qualquer quantidade, criados por administradores da plataforma. |
| Criar ou arquivar produtos | Não é possível (`mode_not_supported`).                                                | Com `products:create` e `products:archive`.                     |
| Seletor de produto         | Um rótulo fixo **Produto** com o nome do produto.                                     | Um menu que lista os seus produtos.                             |

Todo o resto (tenants, funções, caminhos da API, permissões) funciona da mesma forma nos dois
modos. Passar de produto único para multiproduto é uma mudança de configuração sem migração de
dados. O cartão **Servidor** do painel mostra o **Modo** atual.

## ID da requisição {#request-id}

Toda requisição à API recebe um **ID da requisição** único. O Studio o mostra junto com as
mensagens de erro; informe-o ao seu operador, que poderá encontrar a entrada de log e os eventos de
auditoria correspondentes.

## Solução de problemas {#troubleshooting}

| Você vê                                               | Significado e solução                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Não permitido**                                     | Suas funções não têm a permissão. Peça a alguém com uma função mais alta ou consulte [funções e permissões](help:roles-permissions).                                 |
| Uma função aparece como “(acima das suas permissões)” | O [teto de funções](help:concepts#role-ceiling) a bloqueia. Alguém que tenha todas as permissões dessa função precisa atribuí-la.                                    |
| **Não encontrado** para algo que existe               | O Axentra responde “não encontrado” quando você não tem nenhum acesso, para não revelar o que existe. Verifique se você está no produto certo e tem uma função nele. |
| **Indisponível neste modo**                           | O servidor roda no modo de produto único; não é possível criar nem arquivar produtos.                                                                                |
