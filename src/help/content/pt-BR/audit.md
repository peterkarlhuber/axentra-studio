---
title: Log de auditoria
summary: Descubra quem fez o quê e quando no servidor, filtre o log, compartilhe uma visualização filtrada e leia todos os detalhes de um evento.
keywords: auditoria, trilha de auditoria, histórico, log de atividades, quem alterou, log de eventos, conformidade, compliance, ID da requisição, negado, tentativas de login
---

O **Log de auditoria** registra ações administrativas e relevantes para a segurança no servidor
Axentra: quem agiu (um usuário, uma chave de API ou o sistema), o que fez, em qual objeto, com qual
resultado e quando. Use-o para responder perguntas como “quem revogou esta chave de API?”, “por que
este usuário não consegue mais entrar?” ou “o que aconteceu durante a requisição com este ID?”.

O próprio servidor grava os eventos. O Studio apenas os lê: ninguém pode editar ou excluir um evento
de auditoria, nem mesmo um administrador da plataforma.

> [!IMPORTANT]
> O módulo de auditoria está sempre habilitado. Para ler os eventos de um produto, você precisa da
> permissão `audit:read` nesse produto (todas as funções de produto integradas a têm: **Product
> owner**, **Product admin**, **Support** e **Product viewer**). Os eventos da instalação inteira,
> incluindo os que não pertencem a nenhum produto, exigem `platform:audit` (funções da plataforma
> `platform_admin` e `platform_viewer`). Funções de tenant não podem ler o log de auditoria.

## Quem vê quais eventos {#who-sees-what}

| Você tem                                         | O Studio mostra                                                                                     | Filtro de produto                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `platform:audit`                                 | Todos os eventos da instalação, incluindo logins, configuração inicial e outros eventos sem produto | **Todos os produtos** (padrão) ou um produto                |
| `audit:read` em um produto, sem `platform:audit` | Apenas os eventos de um produto; o Studio começa pelo produto que você usou por último              | Um dos seus produtos; **Todos os produtos** não é oferecido |
| Nenhuma das duas                                 | **Log de auditoria** não aparece na barra lateral; um link direto mostra **Não permitido**          | –                                                           |

O servidor verifica a permissão em cada requisição. Selecionar um produto que você não pode ler
retorna **Não permitido**, e um evento que você não pode ler não pode ser aberto em detalhes (veja
[Solução de problemas](#troubleshooting)).

> [!NOTE]
> Eventos sem produto, como `identity.login`, `identity.logout` ou `identity.setup.complete`, só
> ficam visíveis com `platform:audit`.

## Abrir o log de auditoria {#open}

1. Na barra lateral, abra **Auditoria e monitoramento** › **Log de auditoria** ([abrir](app:audit)).
2. Os eventos mais recentes vêm primeiro. Role até o fim da tabela para carregar mais.

Cada linha mostra **Horário**, **Ação**, **Autor**, **Alvo** e **Resultado**. Em um celular, apenas
**Horário** e **Ação** são exibidos; abra os detalhes para ver o restante.

## Filtrar eventos {#filter}

1. Digite uma palavra em **Pesquisar**. Em uma tela estreita, escolha **Mais filtros** para ver os
   outros campos; o número entre parênteses indica quantos filtros estão ativos.
2. Preencha qualquer um dos outros filtros. Todos os filtros se combinam (um evento precisa
   corresponder a cada um deles).
3. Escolha **Aplicar filtros**. O Studio só carrega novos resultados quando você aplica.
4. Para recomeçar, escolha **Redefinir filtros**.

| Filtro           | O que corresponde                                                                                          | Exemplo                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Pesquisar**    | Parte da ação, do ID do alvo, do nome do autor ou do ID do autor (sem diferenciar maiúsculas e minúsculas) | `acme`, `api_key`                    |
| **Produto**      | Eventos de um produto                                                                                      | –                                    |
| **ID do tenant** | Eventos em um tenant (ID exato)                                                                            | `ten_01EXAMPLE`                      |
| **Ação**         | O nome exato da ação, ou um prefixo quando termina com `*`                                                 | `access.api_key.revoke`, `tenancy.*` |
| **ID do autor**  | Eventos de um usuário ou de uma chave de API (ID exato)                                                    | `usr_01EXAMPLE`, `key_01EXAMPLE`     |
| **Resultado**    | **Sucesso**, **Negado** ou **Falha**                                                                       | –                                    |
| **De** / **Até** | Intervalo de tempo no seu horário local. **De** é incluído, **Até** não                                    | –                                    |

O servidor aceita no máximo 100 caracteres em **Ação** e 200 em **Pesquisar**.

### Compartilhar uma visualização filtrada {#share}

Os filtros aplicados fazem parte do endereço da página, por exemplo
`/audit?actor_id=usr_01EXAMPLE&outcome=denied`. Copie o endereço do navegador para compartilhar ou
salvar nos favoritos exatamente esta visualização. Quem recebe vê apenas os eventos que as próprias
permissões permitem.

## Ler os detalhes de um evento {#event-detail}

1. Escolha o botão de detalhes no fim de uma linha (**Mostrar detalhes de …**).
2. Um painel se abre ao lado com todos os campos do evento e os **Detalhes** dele.

| Campo                                           | Significado                                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID do evento**                                | ID do evento de auditoria (`aud_…`)                                                                                                                                             |
| **Horário**                                     | Quando o servidor registrou o evento                                                                                                                                            |
| **Ação**                                        | O que aconteceu, no formato `module.object.verb`                                                                                                                                |
| **Autor** / **Tipo de autor** / **ID do autor** | Quem agiu. Tipos: `user`, `api_key`, `system` (o próprio servidor, por exemplo uma tarefa agendada) e `anonymous` (ninguém estava conectado, por exemplo em um login com falha) |
| **Produto** / **Tenant**                        | Onde aconteceu; vazio para eventos de toda a instalação                                                                                                                         |
| **Alvo**                                        | O objeto sobre o qual se agiu: tipo e ID (por exemplo `api_key · key_01EXAMPLE`)                                                                                                |
| **Resultado**                                   | Veja [Resultados](#outcomes)                                                                                                                                                    |
| **ID da requisição**                            | O `X-Request-ID` da requisição HTTP que causou o evento                                                                                                                         |
| **Endereço IP**                                 | O endereço do cliente como o servidor o vê (atrás de um proxy, somente se o proxy for confiável)                                                                                |
| **Detalhes**                                    | Dados adicionais em JSON, por exemplo os campos alterados ou o motivo de uma recusa                                                                                             |

> [!NOTE]
> O servidor remove segredos (senhas, tokens, chaves) dos detalhes antes de armazená-los. Você
> nunca encontra um segredo no log de auditoria.

### Resultados {#outcomes}

| Resultado   | Significado                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sucesso** | A ação foi executada.                                                                                                                                  |
| **Negado**  | O servidor recusou a ação, por exemplo um login com senha errada, uma troca de senha com a senha atual errada ou uma primeira senha sem login recente. |
| **Falha**   | A ação foi tentada, mas não teve êxito.                                                                                                                |

Uma requisição recusada por falta de permissões geralmente **não** é registrada: o cliente apenas
recebe `403`. Procure eventos **Negado** principalmente em torno de login e senhas.

## Rastrear uma requisição pelo ID {#request-id}

Toda mensagem de erro no Studio mostra um **ID da requisição** em **Detalhes técnicos**. Para
descobrir o que essa requisição alterou:

1. Copie o ID da requisição da mensagem de erro.
2. A pesquisa da auditoria não abrange IDs de requisição. Restrinja a lista com **De** / **Até** (e
   com o **ID do autor**, se você o souber), abra os eventos candidatos e compare o **ID da
   requisição** deles.
3. Se nenhum evento corresponder, a requisição não alterou nada que seja auditado. Passe o ID da
   requisição ao seu operador: os logs do servidor têm o mesmo ID.

Veja [IDs de requisição](help:api-basics#request-ids) para entender como os IDs de requisição funcionam.

## O que é registrado {#what-is-recorded}

As ações se chamam `module.object.verb`. Exemplos típicos:

| Área                        | Ações                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login e contas              | `identity.login`, `identity.logout`, `identity.password.change`, `identity.session.revoke`, `identity.session.revoke_all`, `identity.platform_role.set`, `identity.setup.complete` |
| Produtos, tenants, membros  | `tenancy.product.create`, `tenancy.tenant.create`, `tenancy.tenant.update`, `tenancy.member.set`, `tenancy.invitation.create`, `tenancy.invitation.accept`                         |
| Acesso                      | `access.role.create`, `access.api_key.create`, `access.api_key.rotate`, `access.api_key.revoke`                                                                                    |
| Dados e arquivos            | `data.record.delete`, `storage.file.upload`, `storage.file.delete`, `storage.policy.update`                                                                                        |
| Eventos e jobs              | `events.job.enqueue`, `events.job.cancel`, `events.schedule.update`, `events.webhook.rotate_secret`                                                                                |
| Uso, cobrança, notificações | `usage.quota.set`, `billing.plan.update`, `notify.template.update`, `notify.message.enqueue`                                                                                       |

Nem tudo é um evento de auditoria: leituras não são registradas, e criar ou alterar um registro não
é registrado (excluir, sim). Backends de produtos construídos sobre o Axentra podem adicionar ações
próprias.

## Retenção {#retention}

Os eventos de auditoria são mantidos por `observability.audit_retention_days` (padrão 365 dias).
Eles só são excluídos quando o operador executa a tarefa de manutenção `axentra maintenance purge`.
Até essa tarefa ser executada, os eventos mais antigos continuam visíveis. O valor configurado
aparece em **Manutenção e retenção**, na página [Monitoramento](help:health-monitoring#retention).

## Bom saber {#good-to-know}

- A lista é ordenada por horário, os mais recentes primeiro; não é possível mudar a ordem.
- Os horários são exibidos no fuso horário do seu navegador; a API armazena e filtra em UTC.
- Não há exportação no Studio. Desenvolvedores podem ler o log pela API
  (`GET /v1/audit`, paginação por cursor) ou pelos SDKs (`audit.list`, `audit.iter`); veja
  [Noções básicas da API](help:api-basics#pagination).

## Solução de problemas {#troubleshooting}

- **Não permitido** ao abrir a página: você não tem `audit:read` no produto selecionado. Escolha um produto em que você tenha uma função de produto, ou peça acesso a um proprietário do produto ou a um administrador da plataforma.
- **Nenhum evento correspondente**: os filtros estão restritivos demais. Verifique se **Ação** está escrita exatamente (as ações são `tenancy.tenant.create`, não `tenant.created`) ou termine-a com `*`, amplie **De** / **Até** ou escolha **Redefinir filtros**.
- **Nenhum evento de auditoria ainda**, embora coisas tenham mudado: você está olhando um produto, mas a alteração foi em toda a instalação (por exemplo, um login). Esses eventos exigem `platform:audit`. Verifique também se a ação é uma das registradas (veja [O que é registrado](#what-is-recorded)).
- **Não foi possível carregar o evento completo** (no painel de detalhes): o evento foi excluído pela tarefa de retenção, ou pertence a um produto (ou a nenhum produto) que você não pode ler. O servidor responde `404` nos dois casos, para não revelar se o evento existe. Nesse caso, o Studio mostra os valores da lista.
- **Verifique os dados informados**: um valor de filtro foi recusado, por exemplo uma **Ação** com mais de 100 caracteres ou um texto em **Pesquisar** com mais de 200 caracteres.
