---
title: Seu perfil
summary: Veja sua conta e suas associações, altere seu nome de exibição e sua senha e encerre a sessão em navegadores que você não usa mais.
keywords: perfil, conta, minha conta, nome de exibição, nome, senha, alterar senha, trocar senha, definir senha, sessões, dispositivos, sair, sair de todos os lugares, login único, SSO
---

O seu **Perfil** é onde você gerencia a sua própria conta: o nome que os outros veem, a sua senha e
os navegadores em que você está conectado. Ele também mostra a quais produtos você pertence e com
qual função. Todo usuário conectado tem um perfil; nenhuma permissão é necessária.

Abra-o pelo menu do usuário, no canto superior direito, com **Perfil** ([abrir](app:profile)).
Idioma e tema ficam na página [Configurações](help:settings#preferences) e no mesmo menu do usuário.

## Verificar sua conta {#account}

O cartão **Conta** mostra:

| Campo                    | Significado                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Endereço de e-mail**   | O endereço com que você entra. Você não pode alterá-lo sozinho                                           |
| **ID do usuário**        | O seu ID (`usr_…`), por exemplo para filtrar o [log de auditoria](help:audit#filter) por **ID do autor** |
| **Função na plataforma** | `platform_admin` ou `platform_viewer`, se você tiver uma; caso contrário, **Nenhuma**                    |
| **Produtos**             | Cada produto a que você pertence, com a sua função de produto (por exemplo **Acme CRM · product_admin**) |

As associações a tenants não aparecem aqui; elas estão nas páginas dos tenants. Para obter outra
função, peça a um proprietário do produto ou a um administrador da plataforma; veja
[Funções e permissões](help:roles-permissions).

## Alterar seu nome de exibição {#name}

1. Em **Nome de exibição**, altere o **Nome** (até 200 caracteres).
2. Escolha **Salvar alterações**. O botão só fica ativo quando o nome é diferente do salvo.

O nome aparece no menu do usuário, nas listas de membros e como **Autor** das suas ações no log de
auditoria. Eventos de auditoria anteriores mantêm o nome que você tinha quando foram registrados.

## Alterar sua senha {#password}

1. Em **Alterar senha**, informe a **Senha atual**.
2. Informe a **Nova senha** duas vezes (**Repita a nova senha**).
3. Escolha **Alterar senha**.

> [!WARNING]
> Alterar a senha **encerra a sua sessão em todos os outros navegadores e dispositivos** de uma vez.
> O navegador que você está usando continua conectado. Faça isso quando suspeitar que outra pessoa
> conhece a sua senha.

A nova senha precisa

- ter pelo menos o tamanho mínimo do servidor (padrão 12 caracteres, veja `password_min_length` em
  [Configurações](help:settings#settings-tree)) e no máximo 1024 caracteres,
- ser diferente do seu endereço de e-mail,
- conter pelo menos 4 caracteres diferentes.

### Definir uma primeira senha (usuários de login único) {#set-password}

Se você sempre entrou apenas por login único (SSO), o cartão se chama **Definir uma senha** e não
tem o campo **Senha atual**. Uma senha permite que você também entre com e-mail e senha.

Para a sua segurança, uma primeira senha só pode ser definida **logo depois do login** (padrão: em
até 5 minutos; o operador define isso com `security.fresh_login_minutes`). Se o seu login for mais
antigo, o Studio mostra **Faça login novamente**:

1. Escolha **Entrar novamente**. O Studio encerra a sua sessão e abre a página de login.
2. Entre. Você volta para o seu perfil.
3. Nos minutos seguintes, informe a **Nova senha** duas vezes e escolha **Definir senha**.

> [!NOTE]
> O operador pode desativar isso (`security.first_password = "disabled"`). Nesse caso, usuários que
> entram por login único não podem definir senha nenhuma, e o servidor recusa com
> **Não permitido**.

## Ver onde você está conectado {#sessions}

**Suas sessões** lista cada navegador ou dispositivo com uma sessão ativa:

| Coluna               | Significado                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dispositivo**      | Navegador e sistema operacional (a partir do user agent do navegador) e o endereço IP. **Esta sessão** marca o navegador que você está usando |
| **Método de login**  | `password`, ou `oidc:<provider>` para login único                                                                                             |
| **Última atividade** | A última requisição dessa sessão                                                                                                              |
| **Expira em**        | Quando a sessão termina, no máximo                                                                                                            |

Uma sessão termina quando atinge a duração máxima (padrão 12 horas), após um período sem atividade
(padrão 120 minutos), quando você sai, quando ela é revogada, quando você altera a sua senha (todas
as outras sessões) ou quando um administrador desabilita a sua conta.

### Encerrar a sessão de um navegador que você não usa mais {#revoke-session}

1. Encontre o navegador em **Suas sessões**.
2. Escolha **Revogar sessão** (o ícone de lixeira no fim da linha).

Esse navegador é desconectado na próxima requisição. A sua sessão atual não tem botão de revogar;
para ela, use **Sair** no menu do usuário.

### Sair de todos os outros lugares {#sign-out-elsewhere}

Para encerrar todas as sessões, exceto a que você está usando, escolha **Sair de todas as outras
sessões** no cabeçalho de **Suas sessões**. O botão aparece quando existe pelo menos uma outra
sessão.

> [!TIP]
> Entrou em um computador compartilhado ou perdido? Revogue essa sessão aqui. Se você acha que
> outra pessoa conhece a sua senha, altere-a: isso também encerra todas as outras sessões.

Administradores podem encerrar as sessões de outros usuários na página [Usuários](help:users).

## Solução de problemas {#troubleshooting}

- **Não permitido** após **Alterar senha**: a **Senha atual** está errada. O servidor registra a
  tentativa como **Negado** no log de auditoria.
- **Verifique os dados informados**: a nova senha viola uma das regras acima (curta demais, igual ao
  seu endereço de e-mail, simples demais). **Detalhes técnicos**, na mensagem, mostram o motivo do
  servidor, por exemplo “the password must have at least 12 characters”.
- **As novas senhas não coincidem.**: **Nova senha** e **Repita a nova senha** são diferentes.
- **Faça login novamente** ao definir uma primeira senha: o seu login é antigo demais. Siga os passos
  em [Definir uma primeira senha](#set-password).
- **Não permitido** ao definir uma primeira senha: o servidor não permite senhas para usuários de
  login único, ou a sua conta não tem endereço de e-mail. Continue entrando por login único.
- A sua sessão foi encerrada inesperadamente: ela expirou, ficou inativa por tempo demais ou foi
  revogada (por exemplo, porque você alterou a senha em outro lugar). Entre novamente; o Studio leva
  você de volta à página em que estava.
