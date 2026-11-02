---
title: Glossário
summary: Explicações curtas dos termos usados no Axentra e no Studio, com links para os detalhes.
keywords: glossário, termos, definições, vocabulário, significado, o que é, dicionário
---

Definições curtas dos termos usados no Studio e nesta ajuda. Cada verbete leva ao artigo com os
detalhes. A ordem dos verbetes segue os termos originais em inglês.

## Chave de API {#api-key}

Credencial para máquinas (formato `axk_…`) que chamam a API do Axentra para um produto, com uma
lista explícita de permissões e, opcionalmente, vinculada a um tenant. Veja [Chaves de API](help:api-keys).

## Arquivar {#archive}

Tirar um produto de uso sem excluí-lo. Apenas administradores da plataforma ainda podem trabalhar em
um produto arquivado; ele pode ser restaurado. Veja [Produtos](help:products).

## Log de auditoria {#audit-log}

O registro, que só aceita inclusões, de quem alterou o quê e quando no servidor, com resultado, ID
da requisição e endereço IP. Veja [Log de auditoria](help:audit).

## Função integrada {#built-in-role}

Uma função que o Axentra oferece em todo produto, como **Product admin**, **Owner** ou **Viewer**.
Ela não pode ser alterada. Veja a [referência de permissões](help:permissions-reference#built-in-roles).

## Checkout {#checkout}

O pagamento de um plano na página hospedada do provedor de pagamento. O Studio nunca lida com dados
de cartão. Veja [Planos e assinaturas](help:plans-subscriptions).

## Coleção {#collection}

Um grupo nomeado de registros em um tenant, por exemplo `contacts`. Veja [Registros](help:records).

## Expressão cron {#cron-expression}

Cinco campos (minuto, hora, dia do mês, mês, dia da semana) que descrevem quando um agendamento
roda, sempre em UTC. Veja [Agendamentos](help:schedules).

## CSRF {#csrf}

Cross-site request forgery: um ataque em que outro site tenta enviar alterações pelo seu navegador
conectado. O Studio e o servidor o bloqueiam automaticamente. Veja
[Segurança](help:security#csrf).

## Função personalizada {#custom-role}

Uma função definida para um produto com um conjunto escolhido de permissões, para um produto ou um
tenant. Veja [Funções e permissões](help:roles-permissions).

## Entrega {#delivery}

Uma cadeia de tentativas de enviar um evento a um endpoint de webhook, com status, resposta e novas
tentativas. Veja [Webhooks](help:webhooks).

## Direito {#entitlement}

Um recurso (ligado ou desligado) ou um limite que um plano concede aos tenants que o assinam. Veja
[Planos e assinaturas](help:plans-subscriptions).

## Evento {#event}

Uma mensagem do seu produto avisando que algo aconteceu, por exemplo `invoice.created`. Eventos
podem disparar webhooks e handlers. Veja [Eventos](help:events).

## Período de carência {#grace-period}

O tempo após a rotação de um segredo durante o qual o segredo antigo ainda funciona (no máximo 7
dias), para que os serviços possam fazer a troca sem indisponibilidade. Veja
[Chaves de API](help:api-keys) e [Webhooks](help:webhooks).

## Chave de idempotência {#idempotency-key}

Um valor único enviado com uma requisição para que repetir a mesma requisição não a execute duas
vezes. Reutilizar uma chave com valores diferentes é recusado. Veja
[solução de problemas](help:troubleshooting#idempotency-conflict).

## Convite {#invitation}

Uma oferta para entrar em um tenant com uma determinada função, enviada a um endereço de e-mail. O
link e o token são exibidos uma única vez. Veja [Membros e convites](help:members-invitations).

## Job {#job}

Uma tarefa em segundo plano executada por um worker, com novas tentativas em caso de falha. Veja
[Jobs](help:jobs).

## Membro {#member}

Um usuário que pertence a um tenant com uma função de tenant. Também é o nome da função de tenant
integrada **Member**, que trabalha com os dados do tenant. Veja
[Membros e convites](help:members-invitations).

## Medidor {#meter}

Algo que um produto mede, como chamadas de API ou armazenamento, e como esse valor é combinado
(soma, máximo ou último valor) e redefinido. Veja [Uso](help:usage).

## Módulo {#module}

Um bloco funcional do servidor Axentra (por exemplo `storage` ou `billing`) que um operador pode
ligar ou desligar. Veja a [referência de módulos](help:modules-reference).

## Modo de vários produtos {#multi-product-mode}

Um modo do servidor em que uma instalação hospeda muitos produtos, criados por administradores da
plataforma. Veja [Conceitos](help:concepts).

## Nível de proprietário {#owner-rank}

O nível especial das funções **Owner** (tenant) e **Product owner**: apenas um proprietário do mesmo
escopo, ou alguém com autoridade em um nível superior, pode atribuí-lo ou removê-lo. Veja
[teto de funções](help:security#role-ceiling).

## Permissão {#permission}

Um direito individual escrito como `resource:action`, por exemplo `files:write`, com escopo de
plataforma, produto ou tenant. Veja a [referência de permissões](help:permissions-reference).

## Plano {#plan}

Uma oferta com preços e direitos que os tenants assinam. Veja
[Planos e assinaturas](help:plans-subscriptions).

## Função da plataforma {#platform-role}

Uma função que vale para toda a instalação: **Administrador da plataforma** (tudo) ou **Leitor da
plataforma** (acesso de leitura em todo lugar). Apenas administradores da plataforma podem
concedê-la. Veja [Usuários](help:users).

## Produto {#product}

Uma aplicação que roda no servidor Axentra, com os próprios tenants, funções, chaves e dados. Veja
[Produtos](help:products).

## Operador do produto {#product-operator}

Um usuário com uma função de produto, como **Product owner** ou **Support**, que trabalha no produto
como um todo. Veja [Produtos](help:products).

## Permissão de produto {#product-permission}

Uma permissão que o próprio produto declara, com um nome como `crm.deals:approve`. Veja a
[referência de permissões](help:permissions-reference#product-defined).

## Cota {#quota}

Um limite máximo para o uso ou o armazenamento de um tenant. Ultrapassá-lo resulta em
[Cota excedida](help:troubleshooting#quota-exceeded). Veja [Uso](help:usage).

## Registro {#record}

Um objeto JSON armazenado em uma coleção de um tenant. Veja [Registros](help:records).

## ID da requisição {#request-id}

O identificador `req_…` de cada requisição ao servidor, exibido nos detalhes de erro e no log de
auditoria; a chave para o suporte. Veja [solução de problemas](help:troubleshooting#request-id).

## Reserva {#reservation}

Uso registrado antecipadamente, que depois é confirmado com a quantidade real ou liberado. Veja
[Uso](help:usage).

## Função {#role}

Um pacote nomeado de permissões atribuído a pessoas (ou, como lista de permissões, a chaves de API).
Veja [Funções e permissões](help:roles-permissions).

## Teto de funções {#role-ceiling}

A regra de que ninguém pode atribuir uma função com permissões que não tem. Veja
[Segurança](help:security#role-ceiling).

## Rotação {#rotation}

Substituir um segredo por um novo, opcionalmente com um período de carência. Veja
[Chaves de API](help:api-keys).

## Segurança em nível de linha {#row-level-security}

Um recurso do banco de dados que limita cada transação às linhas de um produto ou tenant, como
segunda linha de defesa por trás das verificações de permissão. Veja
[Segurança](help:security#tenant-isolation).

## Agendamento {#schedule}

Uma regra que enfileira um job em intervalos fixos ou em horários cron. Veja
[Agendamentos](help:schedules).

## Sessão {#session}

O estado conectado de um navegador. Ela termina após a duração máxima, após inatividade, ao sair ou
quando é revogada. Veja [Segurança](help:security#sessions).

## Token de configuração inicial {#setup-token}

Um token de uso único, impresso no servidor, que cria o primeiro administrador da plataforma. Veja
[Configuração inicial](help:first-run-setup).

## Segredo de assinatura {#signing-secret}

O segredo (`whsec_…`) com o qual o Axentra assina as requisições de webhook (HMAC-SHA256), para que
os receptores possam verificá-las. Veja [Webhooks](help:webhooks) e
[Segurança](help:security#webhook-signing).

## Modo de produto único {#single-product-mode}

Um modo do servidor com exatamente um produto, criado a partir da configuração do servidor; não é
possível criar nem arquivar produtos. Veja [Conceitos](help:concepts).

## Slug {#slug}

Um identificador curto e adequado para URLs de um produto ou tenant, por exemplo `acme`. Ele é único
e não pode conter espaços. Veja [Tenants](help:tenants).

## Assinatura {#subscription}

A contratação de um plano por um tenant, com status (por exemplo em avaliação, ativa, em atraso) e
período. Veja [Planos e assinaturas](help:plans-subscriptions).

## Suspender {#suspend}

Bloquear o acesso a um tenant sem excluir os dados dele. Ele pode ser reativado. Veja
[Tenants](help:tenants).

## Modelo {#template}

Um e-mail de notificação com variantes por idioma e variáveis. Veja
[Notificações](help:notifications).

## Tenant {#tenant}

Um cliente ou uma organização dentro de um produto. Os dados de cada tenant ficam estritamente
separados. Veja [Tenants](help:tenants).

## UTC {#utc}

Tempo Universal Coordenado, a base de horário de todos os agendamentos. O Studio mostra os horários
no seu próprio fuso horário sempre que pode.

## Webhook {#webhook}

Uma requisição HTTP assinada que o Axentra envia a outro sistema quando um evento ocorre. Veja
[Webhooks](help:webhooks).

## Worker {#worker}

Um processo do servidor que executa jobs, agendamentos e entregas de webhooks. Sem um worker em
execução, os jobs ficam na fila. Veja [Jobs](help:jobs).
