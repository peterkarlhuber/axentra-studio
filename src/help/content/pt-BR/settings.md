---
title: Configurações
summary: Escolha o idioma e o tema e consulte a configuração efetiva do servidor Axentra.
keywords: configurações, preferências, idioma, tema, modo escuro, modo claro, configuração do servidor, configurações efetivas, config, módulos, duração da sessão, limites
---

A página **Configurações** tem duas partes. **Preferências** são as suas escolhas para o Studio: o
idioma da interface e o tema. **Configuração do servidor** mostra como o servidor Axentra está
configurado agora, por exemplo quais módulos estão habilitados, quanto tempo duram as sessões e
quais limites valem. A configuração do servidor é somente leitura no Studio: quem a altera é o
operador, no servidor.

Abra a página com **Configurações**, na parte de baixo da barra lateral ([abrir](app:settings)).

## Alterar idioma e tema {#preferences}

1. Em **Preferências**, escolha um **Idioma**. A interface muda na hora.
2. Em **Tema**, escolha **Claro**, **Escuro** ou **Sistema**. **Sistema** segue a configuração
   clara ou escura do seu sistema operacional e muda junto com ela.

As mesmas opções estão no menu do usuário, no canto superior direito (**Idioma** e **Tema**).

| Configuração | O que faz                                                           | Valores                                                                                                                                              |
| ------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Idioma**   | Idioma da interface do Studio e dos formatos de data, hora e número | English, Deutsch, Español, Français, Português (Brasil), Italiano. Sem uma escolha, o Studio segue o idioma do navegador; caso contrário, usa inglês |
| **Tema**     | Cores da interface                                                  | **Claro**, **Escuro**, **Sistema** (padrão)                                                                                                          |

### Onde as preferências são armazenadas {#stored}

A sua escolha vale na hora e é salva em dois lugares: neste navegador, para funcionar mesmo antes
do login, e na sua conta de usuário no servidor, para acompanhar você em outros navegadores. Quando
você entra em um navegador que ainda não tem uma escolha própria, o Studio usa o idioma e o tema da
sua conta. Uma escolha feita em um navegador permanece nele até você alterá-la ali.

> [!NOTE]
> Alguns textos vêm do servidor e continuam em inglês, seja qual for o idioma escolhido: os nomes e
> as descrições das funções integradas, as descrições do catálogo de permissões e a mensagem do
> servidor nos detalhes técnicos de um erro.

## Consultar a configuração do servidor {#server-configuration}

O cartão **Configuração do servidor** mostra a configuração efetiva e não secreta do servidor
(`GET /v1/settings`) em forma de árvore: grupos como `limits` ou `storage` contêm os seus valores.
Listas aparecem separadas por vírgulas. Use-o para responder perguntas como “quais módulos estão
habilitados?”, “quanto dura uma sessão?” ou “qual o tamanho máximo de um arquivo?” sem precisar
perguntar ao operador.

> [!IMPORTANT]
> A configuração do servidor é exibida com `platform:settings` (funções da plataforma
> `platform_admin` e `platform_viewer`) ou com `product:manage` em pelo menos um produto
> (**Product owner**, **Product admin**). Os demais veem apenas as preferências.

### O que os valores significam {#settings-tree}

| Chave                                                            | Significado                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                                                    | `development`, `test` ou `production`. Em produção, verificações de segurança mais rígidas são aplicadas na inicialização                                                                                                               |
| `mode`                                                           | `single` (um produto) ou `multi` (muitos produtos); veja [Modos de implantação](help:server-configuration#deployment-modes)                                                                                                             |
| `modules`                                                        | Módulos habilitados. Seções do Studio de outros módulos mostram **Módulo não habilitado neste servidor**                                                                                                                                |
| `public_url`, `allowed_origins`                                  | O endereço externo do servidor e as origens de navegador (como a do Studio) autorizadas a enviar requisições autenticadas                                                                                                               |
| `trusted_proxies`                                                | Proxies cujo endereço de cliente encaminhado o servidor considera confiável (afeta o IP no log de auditoria e os limites de taxa)                                                                                                       |
| `session_ttl_hours`, `session_idle_minutes`                      | Duração máxima da sessão (padrão 12 horas) e tempo limite de inatividade (padrão 120 minutos)                                                                                                                                           |
| `password_login`, `password_min_length`, `login_rate_per_minute` | Se o login por senha está habilitado, o tamanho mínimo da senha (padrão 12) e o número de logins com falha permitidos por conta e minuto (padrão 10)                                                                                    |
| `limits`                                                         | `max_body_bytes` (maior corpo de requisição, padrão 10 MiB), `rate_limit_per_minute`, `rate_limit_ip_per_minute`, `rate_limit_burst` (vazio: sem limite de taxa) e `api_docs` (se `/v1/docs` é `public`, `authenticated` ou `disabled`) |
| `oidc_providers`                                                 | Provedores de login único com as regras de cadastro (nunca o client secret)                                                                                                                                                             |
| `storage`                                                        | Backend de armazenamento de arquivos, tamanho máximo de arquivo e tipos de conteúdo permitidos                                                                                                                                          |
| `notify`, `billing`                                              | Provedor e remetente de notificações; provedor de cobrança e se pagamentos reais estão ativados                                                                                                                                         |
| `observability`                                                  | Nível de log, rastreamento, retenção de auditoria e de jobs                                                                                                                                                                             |
| `encryption_key_ids`, `active_encryption_key`                    | IDs das chaves de criptografia que o servidor possui e a usada para novos dados (nunca o material das chaves)                                                                                                                           |
| `features`                                                       | Feature flags livres da instalação                                                                                                                                                                                                      |

Segredos (senhas de banco de dados, chaves de criptografia, client secrets, chaves de API de
provedores) nunca fazem parte desta resposta.

### Alterar a configuração do servidor {#change}

O Studio não pode alterar esses valores. O operador altera o arquivo de configuração ou as
variáveis de ambiente do servidor e o reinicia; na próxima vez que você abrir esta página, verá os
novos valores. Veja [Configuração do servidor](help:server-configuration) para saber o que os
operadores costumam alterar para o Studio.

## Bom saber {#good-to-know}

- Configurações específicas de um produto (por exemplo, a política de armazenamento de um produto)
  não ficam aqui; elas estão na página do próprio produto.
- Depois que o operador habilitar ou desabilitar um módulo, recarregue o Studio: ele lê a lista de
  módulos uma vez, ao iniciar.

## Solução de problemas {#troubleshooting}

- **A configuração do servidor é exibida apenas para administradores da plataforma e para
  proprietários e administradores de produtos.**: você não tem `platform:settings` nem
  `product:manage`. As suas preferências continuam funcionando.
- **O servidor não retornou nenhuma configuração.**: o servidor respondeu com uma configuração
  vazia. Recarregue a página; se continuar vazia, avise o operador.
- O seu idioma ou tema não acompanha você em outro navegador: esse navegador já tem uma escolha
  própria, e a escolha do navegador prevalece. Altere-a ali uma vez.
- O idioma ou o tema volta ao anterior depois do login: este navegador não tinha uma escolha
  própria, então o Studio usou a da sua conta. Escolha de novo; a partir daí, este navegador a
  mantém.
