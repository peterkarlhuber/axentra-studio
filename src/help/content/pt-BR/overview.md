---
title: O que são o Axentra e o Studio?
summary: O Axentra é um backend para produtos SaaS multi-tenant; o Axentra Studio é a interface web opcional para administrá-lo.
keywords: introdução, sobre, plataforma, backend, SaaS, console de administração, interface de administração, painel admin, o que é, arquitetura, multi-tenant, multilocatário, servidor
---

O **Axentra** é uma plataforma de backend para produtos de software como serviço (SaaS). Ele
oferece os blocos de construção de que quase toda aplicação multi-tenant precisa, para que você não
tenha que construí-los de novo em cada produto. O **Axentra Studio** é a interface web na qual
administradores, operadores e equipes de suporte gerenciam um servidor Axentra: seus produtos,
clientes, usuários, funções, chaves de API e dados.

## O que o Axentra faz {#what-is-axentra}

O Axentra cuida da “infraestrutura invisível” de um produto SaaS:

- **Contas e login**: usuários, senhas, sessões do navegador e login único (OpenID Connect).
- **Clientes (tenants)**: cada organização cliente do seu produto recebe o próprio tenant, com
  membros e convites. Os dados de tenants diferentes ficam estritamente separados, inclusive no
  nível do banco de dados.
- **Controle de acesso**: funções, permissões e chaves de API para máquinas.
- **Dados**: registros (documentos JSON em coleções) e arquivos.
- **Trabalho em segundo plano**: jobs, agendamentos, eventos e webhooks.
- **Recursos comerciais**: medição de uso, cotas, planos e assinaturas.
- **Notificações**: modelos de e-mail e envio.
- **Log de auditoria**: quem fez o quê e quando, para cada alteração.

O Axentra é um único pacote Python com um banco de dados PostgreSQL. Ele pode ser executado de
duas formas:

- **Como serviço HTTP** (`axentra serve`): seu produto e outros clientes chamam a API versionada
  em `/v1`.
- **Como biblioteca** incorporada na sua própria aplicação Python: seu código chama os mesmos
  serviços no mesmo processo.

As duas formas usam os mesmos serviços, verificações de permissão e log de auditoria. Quais partes
opcionais ficam ativas é decidido pelo operador do servidor por meio de
[módulos](help:concepts#modules).

## O que é o Studio {#what-is-studio}

O Studio é uma aplicação web separada que roda no seu navegador. Ele **não tem servidor próprio nem
direitos especiais**: ele se comunica com o servidor Axentra apenas pela mesma API HTTP pública que
qualquer outro cliente usa. O que você vê e pode fazer no Studio é decidido pelo servidor Axentra,
com base nas suas [funções](help:roles-permissions).

Daí resultam três princípios:

1. **O Studio mostra apenas dados reais.** Todo número e toda lista vêm do servidor. Se um módulo
   não estiver habilitado no servidor, o Studio informa isso em vez de exibir dados fictícios.
2. **O servidor decide, o Studio explica.** O Studio oferece ações de acordo com as suas
   permissões. Se mesmo assim o servidor recusar algo, o Studio explica a recusa e mostra o ID da
   requisição para o suporte.
3. **Ações irreversíveis são intencionais.** Excluir, revogar e suspender pedem confirmação, e
   segredos como chaves de API são mostrados exatamente uma vez.

## Como o Axentra e o Studio se relacionam {#how-they-relate}

```diagram
architecture
```

- Seu **produto** (por exemplo, um CRM ou uma loja) usa o Axentra pela API HTTP ou como
  biblioteca. Os usuários finais dele nunca veem o Studio.
- O **Studio** é mais um cliente da mesma API, para as pessoas que operam a plataforma.
- **Máquinas** (o backend do seu produto, jobs de importação, integrações) se autenticam com
  [chaves de API](help:api-keys).
- O Axentra se comunica com o mundo externo por **webhooks** e **e-mail** e, opcionalmente, faz o
  login dos usuários por um **provedor de identidade** externo.

O Studio é **opcional**. Tudo o que o Studio faz, qualquer cliente da API pode fazer com as mesmas
permissões, e o Axentra nunca depende do Studio. A segurança nunca depende da interface: ocultar um
botão no Studio é uma conveniência; o servidor aplica todas as regras.

> [!NOTE]
> O Studio verifica a versão da API do servidor ao carregar. Se o servidor usar outra versão
> principal, ou for mais antigo do que este Studio exige, o Studio para com
> **Versão do servidor incompatível**. Veja a [solução de problemas](help:troubleshooting).

## Quem usa o Studio {#who-uses-studio}

| Quem                                                                      | Tarefas típicas                                                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Administradores da plataforma                                             | Operam toda a instalação: criam produtos, atribuem funções na plataforma, verificam integridade e auditoria. |
| Operadores de produto (proprietário do produto, administrador do produto) | Gerenciam um produto: tenants, funções, chaves de API, planos, modelos, webhooks.                            |
| Equipe de suporte                                                         | Lê dados e responde a perguntas de clientes, gerencia membros até o limite das próprias permissões.          |
| Administradores de tenant                                                 | Gerenciam os membros e convites da própria organização.                                                      |

Você não precisa saber programar para usar o Studio. Algumas áreas (registros, payloads de jobs,
configurações do produto) recebem entradas em JSON; os exemplos dos artigos bastam para começar.

## Cenários típicos {#scenarios}

- **Um novo servidor entra em produção.** O operador gera um token de configuração; você cria o
  primeiro administrador da plataforma e depois o primeiro produto. Veja a
  [configuração inicial](help:first-run-setup) e os [primeiros passos](help:first-steps).
- **Um novo cliente assina um contrato.** Você cria um tenant, convida o administrador do cliente e
  cria uma chave de API para a integração dele. Veja
  [Integrar uma organização cliente](help:tutorial-onboard-customer).
- **Um cliente relata “acesso negado”.** Você verifica a função do membro, as permissões da chave
  de API e os eventos negados no [log de auditoria](help:audit).
- **Uma integração precisa de eventos.** Você registra um webhook e acompanha as entregas dele.
  Veja [Criar um receptor de webhooks](help:tutorial-webhook-receiver).
- **O time de vendas lança um novo plano de preços.** Você define medidores, planos e assinaturas.
  Veja [Planos e uso](help:tutorial-plan-usage).

## O que o Studio não faz {#what-studio-does-not-do}

- O Studio não instala nem configura o servidor. As configurações do servidor (módulos, métodos de
  login, origens permitidas, o modo) ficam na configuração do servidor; o Studio apenas mostra os
  valores efetivos e não secretos em **Configurações**. Veja a
  [configuração do servidor](help:server-configuration).
- O Studio não cria contas de usuário diretamente. As contas vêm da configuração inicial, do login
  único ou do próprio código do seu produto. Veja [usuários](help:users).
- Alguns recursos estão disponíveis apenas pela API. Eles estão listados em
  [limitações conhecidas](help:limitations).

## Solução de problemas {#troubleshooting}

| Situação                                                   | O que fazer                                                                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Não foi possível conectar ao Axentra** ao abrir o Studio | O Studio não conseguiu carregar `GET /v1/meta`. Verifique se o servidor Axentra está em execução e se o Studio está configurado com o endereço correto da API. |
| **Versão do servidor incompatível**                        | Use uma versão do Studio compatível com a versão da API do servidor ou atualize o servidor.                                                                    |
| Um item da barra lateral mostra **Desat.**                 | O módulo do servidor por trás dele não está habilitado. Fale com o operador do servidor. Veja [módulos](help:concepts#modules).                                |
| Uma ação que você esperava não aparece                     | Provavelmente falta a permissão. Veja [funções e permissões](help:roles-permissions).                                                                          |
