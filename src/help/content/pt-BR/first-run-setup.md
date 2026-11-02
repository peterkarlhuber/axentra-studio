---
title: Configuração inicial
summary: Crie o primeiro administrador da plataforma de um novo servidor Axentra com um token de configuração de uso único.
keywords: configuração, instalação, configuração inicial, primeira inicialização, bootstrap, token de configuração, primeiro administrador, administrador da plataforma, onboarding, configurar o Axentra
---

Um novo servidor Axentra ainda não tem administrador. Enquanto for assim, o servidor informa
“configuração necessária” e o Studio mostra a página **Configurar o Axentra** em vez da página de
login. Nela você cria o primeiro **administrador da plataforma**: a conta com controle total da
instalação. Você precisa de um **token de configuração** fornecido por quem opera o servidor.

## Antes de começar {#before-you-start}

> [!IMPORTANT]
>
> - O servidor Axentra está em execução e o Studio consegue acessá-lo.
> - Ninguém concluiu a configuração ainda. A página só fica disponível até existir o primeiro
>   administrador da plataforma.
> - Alguém com acesso ao shell do servidor pode executar o comando `axentra`.

## Obter um token de configuração {#setup-token}

O token de configuração comprova que você tem autorização para assumir o novo servidor. Ele é
criado no próprio servidor, então só quem controla o servidor pode entregá-lo.

1. No servidor (ou no contêiner do servidor), execute:

   ```bash
   axentra admin setup-token
   ```

2. O comando imprime um token que começa com `axsetup_`. Copie-o.

| Propriedade     | Valor                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validade        | 60 minutos por padrão (configuração do operador `security.setup_token_ttl_minutes`, no mínimo 5).                                                                     |
| Uso             | Uma única vez. Um token usado deixa de funcionar.                                                                                                                     |
| Disponibilidade | Somente enquanto não existir administrador da plataforma. Se já existir um, o comando imprime “setup is already complete (a platform admin exists)” e não cria token. |

Você pode criar um novo token a qualquer momento enquanto a configuração estiver aberta; tokens
anteriores não usados continuam válidos até expirarem.

> [!CAUTION]
> O token de configuração concede controle total do servidor a quem o usar primeiro. Entregue-o
> somente à pessoa que vai criar o primeiro administrador, por um canal privado, e gere um novo em
> vez de encaminhar um antigo por e-mail.

## Criar o primeiro administrador {#create-admin}

1. Abra o Studio no navegador. A página **Configurar o Axentra** aparece automaticamente.
2. Se quiser, escolha o idioma no seletor de idioma abaixo do formulário.
3. Preencha o formulário:

   | Campo                     | O que informar                                                                                 |
   | ------------------------- | ---------------------------------------------------------------------------------------------- |
   | **Token de configuração** | O token do servidor, por exemplo `axsetup_EXAMPLE…`.                                           |
   | **Nome completo**         | Seu nome como os outros administradores vão vê-lo.                                             |
   | **Endereço de e-mail**    | O endereço com o qual você vai entrar.                                                         |
   | **Senha**                 | Uma senha longa e exclusiva (veja as [regras de senha](help:first-run-setup#password-policy)). |
   | **Repita a senha**        | A mesma senha novamente.                                                                       |

4. Escolha **Criar administrador**.

**Resultado esperado:** o Studio informa **Configuração concluída** (“Você entrou como
administrador da plataforma.”) e abre o Studio. No modo multiproduto, ainda sem produto, você chega
em **Produtos** com a indicação para criar o primeiro produto; no modo de produto único, você chega
ao painel do único produto do servidor.

## Regras de senha {#password-policy}

O servidor verifica a senha e a recusa se ela violar uma destas regras:

| Regra                           | Padrão                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Comprimento mínimo              | 12 caracteres (configuração do operador `security.password_min_length`, no mínimo 8).       |
| Comprimento máximo              | 1024 caracteres.                                                                            |
| Diferente do endereço de e-mail | A senha não pode ser igual ao endereço de e-mail (sem diferenciar maiúsculas e minúsculas). |
| Não trivial                     | Pelo menos 4 caracteres diferentes.                                                         |

As senhas são armazenadas como hashes Argon2id; ninguém, nem mesmo o operador, consegue lê-las de
volta.

## Depois da configuração {#after-setup}

- A página de configuração deixa de estar acessível; abrir `/setup` leva à página de login.
- Sua conta tem a função **Administrador da plataforma**. O evento `identity.setup.complete` está
  no [log de auditoria](help:audit).
- Sua sessão funciona como qualquer outra sessão de login (veja
  [entrar e sair](help:signing-in#session-end)).

Próximos passos:

1. Crie seu primeiro produto e tenant: [primeiros passos](help:first-steps).
2. Dê a função de administrador da plataforma a uma segunda pessoa de confiança, para que a
   instalação não dependa de uma única conta (veja [usuários](help:users)). Ela precisa ter uma
   conta antes, por exemplo pelo [login único](help:signing-in#sso).
3. Se o servidor deve usar apenas login único, o operador pode desativar o login por senha depois
   (`security.password_login = false`).

## Solução de problemas {#troubleshooting}

| Mensagem                                                                                                                                                                                     | Causa                                                                                                              | O que fazer                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Token de configuração não aceito**                                                                                                                                                         | O token foi digitado errado, expirou (mais antigo que 60 minutos, por padrão) ou já foi usado.                     | Crie um novo token com `axentra admin setup-token` e cole-o sem espaços.                |
| **A configuração já foi concluída**                                                                                                                                                          | Alguém criou um administrador da plataforma nesse meio-tempo.                                                      | Entre com essa conta ou peça acesso ao dono dela. O Studio leva você à página de login. |
| **As senhas não coincidem.**                                                                                                                                                                 | **Senha** e **Repita a senha** são diferentes.                                                                     | Digite as duas novamente.                                                               |
| **Verifique os dados informados** com a mensagem do servidor “the password must have at least … characters”, “the password must not equal the email address” ou “the password is too simple” | As [regras de senha](help:first-run-setup#password-policy) não foram atendidas.                                    | Escolha uma senha mais longa, com mais caracteres diferentes.                           |
| **Verifique os dados informados** com “invalid email address”                                                                                                                                | O endereço de e-mail não é válido.                                                                                 | Corrija o endereço.                                                                     |
| **Conflito** com a mensagem do servidor “a user with this email address exists”                                                                                                              | Já existe uma conta com este endereço de e-mail (por exemplo, criada por código que usa a biblioteca).             | Use outro endereço ou fale com o operador.                                              |
| **Muitas requisições**                                                                                                                                                                       | Tentativas de configuração demais a partir da sua rede em um minuto (o limite de login, 10 por minuto por padrão). | Aguarde um minuto e tente novamente.                                                    |
| O Studio mostra a página de login em vez da página de configuração                                                                                                                           | Já existe um administrador da plataforma.                                                                          | Entre ou peça uma conta a um administrador existente.                                   |
| **Não foi possível conectar ao Axentra**                                                                                                                                                     | O Studio não consegue acessar o servidor.                                                                          | Verifique o servidor e o endereço da API do Studio com o operador.                      |
