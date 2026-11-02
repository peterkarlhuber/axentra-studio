---
title: Entrar e sair
summary: Entre com senha ou login único, entenda quando uma sessão termina e resolva problemas de login.
keywords: login, logar, entrar, acessar, logout, deslogar, sair, senha, SSO, login único, OIDC, OpenID Connect, provedor de identidade, Keycloak, Entra ID, Google, sessão, expirada, tempo limite, idioma, voltar
---

O Studio trabalha com a sua conta pessoal no servidor Axentra. Quando você entra, o servidor inicia
uma **sessão** para o seu navegador; a partir daí o Studio age com as suas funções até a sessão
terminar. Dependendo da configuração do servidor, você entra com endereço de e-mail e senha, pelo
**login único** com o provedor de identidade da sua organização, ou das duas formas.

## Entrar com e-mail e senha {#password}

1. Abra o Studio. Se você não estiver conectado, a página **Entrar** aparece.
2. Informe seu **Endereço de e-mail** e sua **Senha**.
3. Escolha **Entrar**.

**Resultado esperado:** o Studio abre a página de onde você veio ou o painel do produto que você
usou por último. Se você ainda não tiver nenhum produto, chega em **Produtos**.

O formulário só aparece quando o servidor permite login por senha. Contas criadas pelo login único
não têm senha e não podem usar o formulário; você pode definir uma senha para uma conta assim no
seu [perfil](help:profile), se o servidor permitir.

## Entrar com login único {#sso}

Se o operador tiver conectado um provedor de identidade (OpenID Connect, por exemplo Keycloak,
Microsoft Entra ID, Google ou Auth0), a página de login mostra um botão **Continuar com …** para
cada provedor, abaixo do formulário de senha e da palavra **ou**.

1. Escolha **Continuar com** _seu provedor_.
2. Entre no seu provedor de identidade como de costume (incluindo qualquer etapa de autenticação
   multifator que ele exija).
3. O provedor envia você de volta ao Studio, já conectado.

Bom saber:

- A autenticação multifator é feita pelo seu provedor de identidade, não pelo Axentra.
- No seu primeiro login único, o Axentra vincula o login a uma conta existente com o mesmo
  endereço de e-mail **verificado**, ou cria uma nova conta se o provedor permitir cadastro ou se
  houver um [convite](help:members-invitations) em aberto para o seu endereço.
- Uma conta nova não recebe nenhum acesso por si só. Você só vê produtos e tenants depois que
  alguém lhe atribuir uma função ou depois que você aceitar um convite.

## Voltar para onde você parou {#return-to}

Quando sua sessão termina enquanto você trabalha, ou quando você abre um link para uma página do
Studio sem estar conectado, o Studio envia você para a página de login e memoriza a página. A
página de login então mostra **Entre novamente para continuar de onde parou.** Depois de entrar
(com senha ou login único), você volta para aquela página, incluindo os filtros contidos no
endereço.

Por segurança, o Studio só retorna para as próprias páginas; qualquer outro destino leva à página
inicial.

> [!WARNING]
> Dados não salvos em um formulário aberto são perdidos quando a sessão termina. Em edições longas,
> salve de tempos em tempos.

## Quando uma sessão termina {#session-end}

| A sessão termina …                                       | Padrão                                        |
| -------------------------------------------------------- | --------------------------------------------- |
| Ao atingir a duração máxima, mesmo que você esteja ativo | 12 horas (`security.session_ttl_hours`)       |
| Após um período sem nenhuma requisição                   | 120 minutos (`security.session_idle_minutes`) |
| Quando você sai                                          | Imediatamente                                 |
| Quando você ou um administrador a revoga                 | Na próxima requisição                         |
| Quando sua conta é desabilitada                          | Imediatamente, todas as sessões               |
| Quando você altera sua senha                             | Todas as suas **outras** sessões              |

Os valores são definidos pelo operador do servidor. Suas sessões ativas (navegadores e
dispositivos) aparecem no seu [perfil](help:profile), onde você também pode encerrá-las.

Algumas ações relevantes para a segurança exigem um login **recente**. Se o servidor responder
**Faça login novamente**, o Studio desconecta você e, depois que você entrar de novo, você volta à
mesma página para repetir a ação.

> [!NOTE]
> O login único apenas **inicia** uma sessão do Axentra. Sair do Studio não desconecta você do seu
> provedor de identidade, e ser desconectado ou bloqueado no provedor não encerra uma sessão do
> Axentra em andamento; ela termina na expiração normal ou quando um administrador desabilita a
> conta.

## Sair {#sign-out}

1. Abra o menu do usuário no canto superior direito (suas iniciais e seu nome).
2. Escolha **Sair**.

O Studio encerra a sessão no servidor, descarta todos os dados carregados e mostra a página de
login. Em um computador compartilhado, sempre saia.

## Escolher o idioma antes de entrar {#language}

A página de login e a página de configuração têm um seletor de idioma abaixo do formulário. Sua
escolha vale imediatamente e fica memorizada neste navegador. Depois de entrar, você pode alterar o
idioma no menu do usuário (**Idioma**) ou em **Configurações**; aí ele também é salvo na sua conta
e acompanha você em outros navegadores. Veja [a interface](help:interface#language).

## Configurações {#settings}

Estas configurações do servidor afetam o login. Somente o operador do servidor pode alterá-las; o
Studio mostra os valores efetivos em **Configurações**.

| Configuração                     | O que faz                                                                                | Padrão     |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| `security.password_login`        | Permite login com e-mail e senha. Quando desabilitada, apenas o login único é oferecido. | habilitado |
| `security.login_rate_per_minute` | Falhas de login permitidas por conta e por minuto (por endereço de rede: o triplo).      | 10         |
| `security.session_ttl_hours`     | Duração máxima da sessão.                                                                | 12         |
| `security.session_idle_minutes`  | Tempo limite de inatividade.                                                             | 120        |
| Provedores `[[oidc]]`            | Provedores de login único exibidos como **Continuar com …**.                             | nenhum     |

## Detalhes para administradores {#details}

- A sessão fica em um cookie `HttpOnly`; o Studio nunca guarda tokens no armazenamento do
  navegador. Requisições que alteram dados também precisam de um token CSRF, que o Studio mantém
  em memória.
- O endereço do Studio precisa ser o `security.public_url` do servidor ou estar listado em
  `security.allowed_origins`; caso contrário, o login e as requisições que alteram dados são
  recusados com `403`.
- Logins, falhas de login (`identity.login` com resultado `denied`) e saídas são gravados no
  [log de auditoria](help:audit).
- Falhas de login são limitadas por conta. Por isso, qualquer pessoa que conheça um endereço pode
  bloquear o login por senha dessa conta por até um minuto.
- O login único usa o fluxo de código de autorização com PKCE. O URI de redirecionamento a
  registrar no provedor é `<public URL of the API>/v1/auth/oidc/<provider id>/callback`.
  Configuração: [configuração do servidor](help:server-configuration).

## Erros de login único {#sso-errors}

Quando o login único falha, o servidor envia você de volta à página de login e o Studio mostra
**O login único não foi concluído** com o motivo:

| Motivo (código)                                                | O que significa                                                                                                                               | O que fazer                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Demorou demais ou começou em outro navegador (`login_expired`) | O login precisa terminar em até 10 minutos, no mesmo navegador.                                                                               | Comece de novo pela página de login.                                              |
| Cancelado ou recusado (`access_denied`)                        | Você cancelou no provedor ou o consentimento foi recusado.                                                                                    | Comece de novo e confirme no provedor.                                            |
| Provedor inacessível (`provider_unavailable`)                  | O Axentra não conseguiu acessar ou validar o provedor.                                                                                        | Tente mais tarde; o operador verifica a configuração do provedor.                 |
| Não foi possível verificar a resposta (`login_failed`)         | O token do provedor falhou em uma verificação.                                                                                                | Tente novamente; se persistir, o operador verifica o log do servidor.             |
| E-mail não verificado (`email_not_verified`)                   | O provedor não confirmou seu endereço como verificado. É comum com o Microsoft Entra ID, que muitas vezes não envia a claim `email_verified`. | O operador configura o provedor para enviá-la.                                    |
| Domínio não permitido (`domain_not_allowed`)                   | O domínio do seu e-mail não está na lista de permissões do provedor.                                                                          | Use uma conta de um domínio permitido.                                            |
| Sem conta (`signup_disabled`)                                  | Não existe conta para você e o cadastro está desabilitado.                                                                                    | Peça um [convite](help:members-invitations) a um administrador e entre novamente. |
| Conta desabilitada (`account_disabled`)                        | Sua conta está desabilitada.                                                                                                                  | Fale com um administrador.                                                        |
| Tentativas demais (`rate_limited`)                             | Logins demais iniciados a partir da sua rede.                                                                                                 | Aguarde um minuto.                                                                |

## Solução de problemas {#troubleshooting}

| Mensagem                                                                  | Causa                                                                                                                                        | O que fazer                                                                                                                 |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Falha ao entrar** – “O endereço de e-mail ou a senha estão incorretos.” | Endereço ou senha errados, conta desabilitada ou conta sem senha (criada pelo login único). Por segurança, o servidor não diz qual é o caso. | Verifique os dados; tente o login único; peça a um administrador que verifique a conta na página de [usuários](help:users). |
| **Muitas requisições**                                                    | Mais tentativas com falha do que o permitido em um minuto (10 por conta, por padrão).                                                        | Aguarde um minuto e tente novamente.                                                                                        |
| **Nenhum método de login disponível**                                     | O servidor não tem login por senha nem login único habilitado.                                                                               | O operador precisa configurar a autenticação.                                                                               |
| O login único volta com um erro                                           | Veja [erros de login único](help:signing-in#sso-errors).                                                                                     |                                                                                                                             |
| Você é enviado para a página de login repetidamente                       | O navegador bloqueia o cookie de sessão.                                                                                                     | Permita cookies para o endereço do Studio; peça ao operador que verifique a configuração.                                   |
| **Não permitido** logo ao entrar                                          | O endereço do Studio não é a URL pública do servidor nem está em `security.allowed_origins`.                                                 | O operador adiciona o endereço do Studio em `security.allowed_origins`.                                                     |
| **Não foi possível verificar sua sessão**                                 | Não foi possível consultar o servidor sobre a sua sessão (erro de rede ou do servidor).                                                      | Escolha **Tentar novamente**; verifique a **Integridade do sistema** quando entrar de novo.                                 |
| **Faça login novamente**                                                  | A ação exige um login recente.                                                                                                               | Entre novamente e repita a ação.                                                                                            |
| Depois de entrar, você não vê nenhum produto                              | Sua conta ainda não tem função.                                                                                                              | Peça a um administrador que adicione você ou envie um convite.                                                              |
