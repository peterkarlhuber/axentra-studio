---
title: Configuração do servidor para o Studio
summary: O que os operadores configuram para o Studio funcionar - o endereço da API no config.json, origens permitidas, módulos, modo de um ou vários produtos e a verificação de versão.
keywords: operador, administrador, implantação, deploy, instalação, configuração, config.json, apiBaseUrl, proxy reverso, CORS, origens permitidas, mesmo site, módulos, habilitar módulo, produto único, vários produtos, modo, compatibilidade, versão, Docker, backup, restauração, observabilidade
---

Este artigo é para quem opera o Axentra e o Studio. Ele trata apenas do que importa para o Studio:
como o Studio encontra a API, o que a API precisa permitir, como os módulos e o modo de implantação
mudam o que o Studio mostra e como o Studio verifica se é compatível com a versão do servidor. A
configuração completa do servidor está documentada no repositório do backend (veja
[Leitura complementar](#further-reading)).

O Studio é um app web estático. Ele não tem servidor, banco de dados nem segredos próprios; tudo o
que mostra vem da API do Axentra, e toda decisão de permissão é tomada pela API.

```diagram
architecture
```

## Informar ao Studio onde está a API: config.json {#studio-config}

Quando o Studio inicia, ele carrega `/config.json` do próprio endereço, antes de qualquer outra
coisa. Assim, uma mesma build funciona em todos os ambientes.

```json
{ "apiBaseUrl": "" }
```

| `apiBaseUrl`                | Significado                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `""` (padrão)               | **Mesma origem** (recomendado): um proxy reverso serve o Studio e encaminha `/v1` (e `/metrics`) para a API no mesmo endereço |
| `"https://api.example.com"` | A API roda em outro endereço. Informe apenas a origem; uma `/` final ou `/v1` é removida                                      |

Se `/config.json` estiver ausente ou for inválido, o Studio usa a mesma origem.

Com a imagem de contêiner do Studio, você não escreve o arquivo à mão:

| Variável                  | Efeito                                                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AXENTRA_API_URL`         | O contêiner encaminha `/v1` e `/metrics` para este endereço da API (configuração de mesma origem)                                                                                              |
| `AXENTRA_PUBLIC_API_URL`  | Gravado no `config.json` como `apiBaseUrl` e permitido na Content-Security-Policy (endereço de API separado)                                                                                   |
| `AXENTRA_CSP_CONNECT_SRC` | Origens `https://` adicionais às quais o Studio pode se conectar, separadas por espaços (`https://host` ou `https://host:porta`); qualquer outro valor interrompe a inicialização do contêiner |
| `AXENTRA_TLS_TERMINATED`  | `true` quando os usuários acessam o Studio por HTTPS (TLS encerrado antes do contêiner): adiciona `Strict-Transport-Security`. Padrão `false`                                                  |

## Fazer a API aceitar o Studio {#allowed-origins}

A API recusa requisições autenticadas de navegador vindas de origens desconhecidas. Configure no
servidor Axentra:

- `security.allowed_origins`: adicione o endereço público do Studio, por exemplo
  `["https://studio.example.com"]`, a menos que o Studio rode no próprio `public_url` da API. Em
  produção, apenas origens `https://` explícitas são aceitas; `*` nunca é permitido.
- `security.public_url`: o endereço externo `https://` da API. Ele habilita cookies seguros.
- `security.trusted_proxies`: os proxies à frente da API, para que o IP do cliente no log de
  auditoria e nos limites de taxa seja o do usuário, não o do proxy.

> [!WARNING]
> Com um endereço de API separado, o Studio e a API precisam estar no **mesmo site** (por exemplo
> `studio.example.com` e `api.example.com`). O cookie de sessão é `SameSite=Lax`, então uma
> configuração entre sites diferentes não consegue fazer login. A mesma origem é a configuração
> testada e recomendada.

Para login único, o provedor de identidade retorna para um endereço absoluto do Studio, que a API
precisa aceitar como destino de redirecionamento.

## Habilitar módulos {#modules}

A configuração `modules` do servidor decide quais partes do Axentra rodam. Os módulos `identity`,
`tenancy`, `access` e `audit` estão sempre ligados. Os outros são opcionais:

| Módulo               | Seções do Studio                                      |
| -------------------- | ----------------------------------------------------- |
| `data`               | **Visão geral dos dados**, **Registros**              |
| `storage`            | **Arquivos**                                          |
| `events`             | **Jobs**, **Agendamentos**, **Eventos**, **Webhooks** |
| `usage`              | **Uso**                                               |
| `billing`            | **Planos**, **Assinaturas**                           |
| `notify`             | **Notificações**                                      |
| `search`, `realtime` | Sem telas no Studio; disponíveis apenas pela API      |

O Studio lê a lista de módulos de `GET /v1/meta` uma vez, ao carregar:

- Uma seção cujo módulo está desligado continua na barra lateral, marcada como **Desat.**, e abre
  **Módulo não habilitado neste servidor**.
- Um módulo ligado, mas sem telas nesta versão do Studio, mostra **Ainda não disponível no Studio**.

Para alterar os módulos, edite a configuração do servidor (por exemplo
`modules = ["identity", "tenancy", "access", "audit", "data", "storage", "events"]` ou a variável de
ambiente `AXENTRA__MODULES`), reinicie a API e recarregue o Studio. A lista ativa aparece em
`modules` na página [Configurações](help:settings#settings-tree). Veja
[Referência de módulos](help:modules-reference).

> [!NOTE]
> Desligar um módulo remove os endpoints dele; os dados continuam no banco de dados e voltam quando
> você liga o módulo de novo.

## Implantação com um ou vários produtos {#deployment-modes}

O `mode` do servidor decide quantos produtos ele atende. O Studio o lê de `GET /v1/meta`.

|                                        | `single` (padrão do servidor)                                                                  | `multi`                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Produtos                               | Exatamente um, criado na primeira inicialização a partir da seção `[product]` (`slug`, `name`) | Qualquer quantidade, criados por administradores da plataforma |
| Página inicial                         | O painel do produto                                                                            | O último produto usado; caso contrário, a lista de produtos    |
| Barra superior                         | O nome do produto, sem seletor                                                                 | Seletor de produtos                                            |
| **Novo produto**, arquivar, restaurar  | Não oferecidos (a API responde `409 mode_not_supported`)                                       | Com `products:create` / `products:archive`                     |
| ID de produto desconhecido no endereço | Redirecionamento para a mesma seção do único produto                                           | **Não encontrado**                                             |

Todo o resto (tenants, usuários, funções, dados, auditoria) funciona igual nos dois modos. As
contas de usuário pertencem à instalação nos dois modos. Passar uma instalação de `single` para
`multi` é uma alteração de configuração, sem migração de dados.

## Verificação de compatibilidade entre o Studio e a API {#compatibility}

Cada build do Studio declara a versão da API de que precisa (**Versão da API exigida**, atualmente
`1.0`). Na inicialização, o Studio lê `api_version` de `GET /v1/meta`:

| Versão da API do servidor                                         | Resultado                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Mesma major, minor igual ou maior (por exemplo `1.0`, `1.3`)      | O Studio inicia                                                                       |
| Minor menor (por exemplo servidor `1.0`, Studio precisa de `1.2`) | **Versão do servidor incompatível**: atualize o servidor ou use um Studio mais antigo |
| Major diferente (por exemplo `2.0`)                               | **Versão do servidor incompatível**: use uma versão do Studio para essa major         |
| Ilegível                                                          | **Versão do servidor incompatível** com o valor bruto                                 |

Em caso de recusa, nada mais é carregado, de modo que um servidor inadequado nunca recebe gravações
do Studio. As duas versões aparecem em [Integridade do sistema](help:health-monitoring#versions). As
combinações testadas em conjunto estão listadas no `docs/COMPATIBILITY.md` do Studio.

> [!TIP]
> Depois de atualizar o servidor, recarregue as guias do Studio abertas: a verificação só é
> executada quando o Studio carrega.

Se o Studio mostrar **Não foi possível conectar ao Axentra**, ele não conseguiu carregar
`GET /v1/meta`; veja [Solução de problemas](#troubleshooting).

## Configurações do servidor que mudam o que os usuários veem {#user-visible-settings}

| Configuração do servidor                              | Efeito no Studio                                                                                                                                                                                         | Padrão                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `security.password_login`                             | Formulário de login por senha na página de login                                                                                                                                                         | ligado                                        |
| Provedores `[[oidc]]`                                 | Botões de login único na página de login                                                                                                                                                                 | nenhum                                        |
| `security.session_ttl_hours` / `session_idle_minutes` | Quando os usuários precisam entrar de novo                                                                                                                                                               | 12 h / 120 min                                |
| `security.password_min_length`                        | Tamanho mínimo de novas senhas                                                                                                                                                                           | 12                                            |
| `security.first_password` / `fresh_login_minutes`     | Se e com que rapidez usuários de login único podem definir uma senha no [perfil](help:profile#set-password)                                                                                              | permitido em até 5 min                        |
| `security.max_body_bytes`, `storage.max_file_bytes`   | Maior requisição e maior envio de arquivo                                                                                                                                                                | 10 MiB / 50 MiB                               |
| `observability.metrics_enabled` / `metrics_token_ref` | Se **Métricas**, em Monitoramento, mostra dados ou pede um token                                                                                                                                         | ligado; desligado em produção sem token       |
| `observability.audit_retention_days`                  | Até quando o log de auditoria retrocede após `axentra maintenance purge`                                                                                                                                 | 365                                           |
| `notify.invitation_accept_url`                        | Para onde os links de convite levam (a `invitation_accept_url` própria do produto tem prioridade). Defina como `https://<your Studio address>/invitations/accept` quando o Studio tiver endereço próprio | `/accept-invitation` em `security.public_url` |

Altere esses valores no arquivo TOML do servidor ou como variáveis de ambiente
`AXENTRA__<SECTION>__<KEY>` (por exemplo `AXENTRA__SECURITY__SESSION_TTL_HOURS=8`) e reinicie a
API. Segredos são sempre informados como referências (`env:NAME` ou `file:/path`), nunca
diretamente em produção.

## Leitura complementar {#further-reading}

No repositório do backend do Axentra:

- `docs/operations/CONFIGURATION.md`: todas as configurações com padrão e variável de ambiente.
- `docs/operations/DEPLOYMENT.md`: imagem de contêiner, stacks compose e a checklist de produção.
- `docs/architecture/DEPLOYMENT_MODELS.md`: os modos de um e de vários produtos em detalhes.
- `docs/operations/BACKUP_RESTORE.md`: backup e restauração do banco de dados e como verificar uma
  restauração. O Studio não guarda dados, então fazer backup do banco de dados é suficiente.
- `docs/operations/OBSERVABILITY.md`: métricas, rastreamento, logs, verificações de integridade e
  retenção.
- `docs/architecture/VERSIONING.md`: números de versão e regras de compatibilidade.

No repositório do Studio: `README.md` (configuração e imagem de contêiner) e
`docs/COMPATIBILITY.md` (combinações testadas).

## Solução de problemas {#troubleshooting}

- **Não foi possível conectar ao Axentra**: o Studio não conseguiu carregar `GET /v1/meta`.
  Verifique se a API está rodando, se `apiBaseUrl` em `/config.json` está correto (ou se o proxy
  encaminha `/v1`) e, com um endereço de API separado, se a Content-Security-Policy o permite.
- O login falha com **Não permitido**, ou toda alteração falha com **Não permitido**: a API recusa a
  origem do Studio. Adicione o endereço do Studio a `security.allowed_origins` e reinicie a API.
- O login parece funcionar, mas a sessão é encerrada logo em seguida: o Studio e a API estão em
  sites diferentes, ou o `public_url` da API é `https://` enquanto os usuários a acessam por
  `http://`. Use a mesma origem ou uma configuração no mesmo site via HTTPS.
- **Versão do servidor incompatível**: veja [Verificação de compatibilidade](#compatibility).
- **Módulo não habilitado neste servidor**: habilite no servidor o módulo indicado na mensagem e
  recarregue o Studio.
- **Indisponível neste modo**: a ação exige o modo `multi`; o servidor roda no modo `single`.
- O log de auditoria mostra o endereço do proxy como **Endereço IP**: adicione o proxy a
  `security.trusted_proxies`.
- Links de convite abrem uma página da API ou **Página não encontrada**: o Studio tem endereço
  próprio. Defina `notify.invitation_accept_url` como
  `https://<your Studio address>/invitations/accept` e reinicie a API. Links já enviados continuam
  apontando para a API; envie a essas pessoas o token ou um novo convite. Veja
  [Membros e convites](help:members-invitations#delivery).
