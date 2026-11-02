---
title: Referência de módulos
summary: Os módulos do servidor Axentra, quais áreas do Studio cada um alimenta e o que você vê quando um módulo está desligado.
keywords: módulo, módulos, habilitado, desabilitado, desligado, desativado, recurso, configuração do servidor, identity, tenancy, access, data, audit, storage, events, usage, billing, notify, search, realtime
---

O servidor Axentra é formado por _módulos_: blocos funcionais como armazenamento de arquivos, jobs
em segundo plano ou cobrança. Um operador decide, na configuração do servidor, quais módulos rodam.
O Studio lê a lista de módulos habilitados ao iniciar e se adapta: as áreas de módulos desligados
continuam na barra lateral com o rótulo **Desat.**, para que você veja o que existe e o que um
operador teria de habilitar.

## Quais módulos estão habilitados? {#check-modules}

- O [Painel](app:dashboard) lista todos os módulos em **Módulos**, no cartão do servidor; os módulos
  habilitados aparecem destacados, e os desligados, em cinza.
- A página [Configurações](app:settings) (com `platform:settings` ou `product:manage`) mostra a
  configuração efetiva do servidor, incluindo a lista de módulos.
- Na barra lateral, a área de um módulo desligado leva o rótulo **Desat.**; leitores de tela anunciam
  "módulo não habilitado".

Por padrão, todos os módulos estão habilitados. Alterar a lista é uma alteração na configuração do
servidor (`modules`, veja [configuração do servidor](help:server-configuration)); ela vale quando o
servidor reinicia. O Studio lê a lista uma vez a cada carregamento da página, então recarregue o
Studio depois.

## Visão geral dos módulos {#overview}

| ID do módulo | Pode ser desligado | Áreas do Studio que ele alimenta                                                                                                |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `identity`   | Não                | Login, logout, [Perfil](help:profile), [Usuários](help:users), sessões                                                          |
| `tenancy`    | Não                | [Produtos](help:products), [Tenants](help:tenants), [membros e convites](help:members-invitations)                              |
| `access`     | Não                | [Funções](help:roles-permissions), [Permissões](help:permissions-reference), [Chaves de API](help:api-keys)                     |
| `audit`      | Não                | [Log de auditoria](help:audit)                                                                                                  |
| `data`       | Sim                | [Visão geral dos dados](help:data-overview), [Registros](help:records)                                                          |
| `storage`    | Sim                | [Arquivos](help:files), cotas de armazenamento dos tenants, a política de armazenamento do produto                              |
| `events`     | Sim                | [Jobs](help:jobs), [Agendamentos](help:schedules), [Eventos](help:events) com a visualização ao vivo, [Webhooks](help:webhooks) |
| `usage`      | Sim                | [Uso](help:usage): medidores, uso dos tenants, cotas, reservas                                                                  |
| `billing`    | Sim                | [Planos e assinaturas](help:plans-subscriptions), cobrança dos tenants                                                          |
| `notify`     | Sim                | [Notificações](help:notifications): modelos, log de mensagens, caixa de correio, preferências                                   |
| `search`     | Sim                | Ainda sem telas no Studio; a pesquisa de texto completo por tenant está disponível pela API                                     |
| `realtime`   | Sim                | Aceito na configuração, mas sem efeito nesta versão                                                                             |

[Integridade do sistema](help:health-monitoring), Monitoramento e [Configurações](help:settings) não
pertencem a nenhum módulo e estão sempre disponíveis.

## O que acontece quando um módulo está desligado {#when-disabled}

Quando um módulo é desligado, o servidor simplesmente não oferece a parte da API correspondente. No
Studio:

- A página da área mostra **Módulo não habilitado neste servidor** e indica o ID do módulo a
  habilitar, por exemplo `storage`. Nada é excluído: os dados armazenados enquanto o módulo estava
  ligado continuam no banco de dados e reaparecem quando o módulo é ligado de novo.
- Atalhos e widgets que dependem do módulo desaparecem, por exemplo os widgets de uso e cobrança do
  painel ou o botão **Ver registros** na página de um tenant.
- Uma ação que ainda chegue a um módulo desligado responde
  [Módulo não habilitado](help:troubleshooting#module-disabled) ou **Não encontrado**.

Observações por módulo:

### data {#data}

**Visão geral dos dados** e **Registros** mostram o estado "não habilitado". Produtos que armazenam
os próprios dados nas próprias tabelas não são afetados.

### storage {#storage}

**Arquivos** mostra o estado "não habilitado"; as cotas de armazenamento e a política de
armazenamento não podem ser lidas nem alteradas.

### events {#events}

**Jobs**, **Agendamentos**, **Eventos** e **Webhooks** mostram o estado "não habilitado", e não há
visualização de eventos ao vivo. Dentro do servidor, outros módulos continuam usando a fila de jobs;
só as telas e a API dela deixam de existir.

### usage e billing {#usage-billing}

Sem `usage`, **Uso** fica desligado e o painel não mostra widgets de uso. Sem `billing`, **Planos** e
**Assinaturas** ficam desligados. Os limites dos planos só alimentam as cotas de uso quando **os
dois** módulos estão habilitados.

### notify {#notify}

**Notificações** mostra o estado "não habilitado". Os convites continuam funcionando, mas o servidor
não envia e-mails de convite: compartilhe o link ou o token do convite que o Studio exibe uma única
vez após a criação do convite (veja [Membros e convites](help:members-invitations)).

### search e realtime {#search-realtime}

O Studio não tem telas para esses módulos. Ligá-los ou desligá-los não muda nada no Studio.

## Ainda não disponível no Studio {#not-in-studio}

Se um módulo está habilitado no servidor, mas esta versão do Studio não tem telas para ele, a área
mostra **Ainda não disponível no Studio**. Use a API diretamente ou uma versão mais nova do Studio.

## Solução de problemas {#troubleshooting}

| Situação                                                                       | O que fazer                                                                                                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Uma área mostra **Desat.**                                                     | Peça a um operador que adicione o ID do módulo à configuração `modules` do servidor e reinicie o servidor; depois, recarregue o Studio. |
| Um operador habilitou um módulo, mas o Studio ainda mostra **Desat.**          | Recarregue a página; o Studio só lê a lista de módulos ao carregar.                                                                     |
| A configuração se recusa a desligar `identity`, `tenancy`, `access` ou `audit` | Esses módulos são obrigatórios e não podem ser desabilitados.                                                                           |
| Os convites são criados, mas nenhum e-mail chega                               | O `notify` está habilitado e há um provedor de e-mail configurado? Caso contrário, compartilhe o link manualmente.                      |
