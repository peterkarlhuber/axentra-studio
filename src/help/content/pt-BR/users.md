---
title: Usuários
summary: Encontre as pessoas que têm acesso a um produto, consulte o perfil e as sessões delas, desconecte-as, desabilite contas e conceda funções na plataforma.
keywords: usuário, conta, pessoa, pessoas, desabilitar usuário, desativar, bloquear, sair de todos os lugares, sessões, função na plataforma, administrador da plataforma, leitor da plataforma, sem e-mail
---

Um **usuário** é a conta de uma pessoa no servidor Axentra. As contas valem para toda a
instalação: uma conta pode ser operadora de um produto e membro de tenants em vários outros. O que
um usuário pode fazer vem de três fontes:

- uma **função na plataforma** (vale para toda a instalação, rara),
- uma **função de produto**, quando o usuário é operador de um produto (veja
  [produtos](help:products#members)),
- uma **função de tenant** em cada tenant do qual o usuário é membro (veja
  [membros e convites](help:members-invitations)).

A tela [Usuários](app:users) lista os usuários do produto atual: os operadores dele e os membros
dos tenants dele.

> [!IMPORTANT]
> A tela **Usuários** exige `product_users:read` (proprietários, administradores, suporte e
> leitores do produto; administradores e leitores da plataforma). Desabilitar usuários, encerrar as
> sessões deles e ver essas sessões exige a permissão da plataforma `users:manage`, que só os
> administradores da plataforma têm. Somente administradores da plataforma alteram funções na
> plataforma.

## Encontrar um usuário {#find}

Abra [Usuários](app:users). Use **Pesquisar usuários** para filtrar por nome ou endereço de e-mail
e o filtro **Status** para mostrar usuários **Ativo** ou **Desabilitado**. Selecione um nome para
abrir a página do usuário.

Exceto os [usuários de login único](help:users#external-user), o Studio não cria contas. Elas são criadas quando o primeiro administrador conclui a configuração
inicial, quando alguém entra pelo login único pela primeira vez (se as configurações do provedor de
identidade permitirem cadastro ou se houver um convite em aberto para esse endereço de e-mail) ou
pelo código de um produto que incorpora o Axentra. Veja [entrar e sair](help:signing-in).

## Adicionar um usuário de login único {#external-user}

Para migrações e importações, administradores da plataforma criam contas que entram apenas por um
provedor de identidade, com ou sem endereço de e-mail.

1. Abra [Usuários](app:users) e escolha **Adicionar usuário de login único**.
2. Digite o **Provedor (emissor)**: a URL do emissor do provedor de identidade, exatamente como
   aparece nas configurações de login único do servidor. O Studio sugere os provedores configurados.
3. Digite o **Sujeito**: o ID do usuário no provedor (a claim `sub`), não o endereço de e-mail.
4. Se quiser, preencha **Nome** e **Endereço de e-mail (opcional)**. Marque **O provedor verificou
   este endereço** apenas se o provedor confirmou que o endereço pertence ao usuário.
5. Escolha **Adicionar usuário**. O Studio abre a página do novo usuário.

O endereço de e-mail só se torna o do usuário se estiver verificado; caso contrário, o usuário fica
sem endereço (veja [usuários sem endereço de e-mail](help:users#no-email)). O novo usuário não tem
senha nem associações: adicione-o aos tenants na guia **Membros** do tenant.

## A página do usuário {#profile}

O cartão **Perfil** mostra:

| Campo                            | Significado                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Nome**, **Endereço de e-mail** | Vêm da conta. Os usuários editam o próprio nome no perfil.                                     |
| **Status**                       | **Ativo** ou **Desabilitado**.                                                                 |
| **Idioma**                       | O idioma da interface do usuário.                                                              |
| **Função na plataforma**         | **Nenhuma função na plataforma**, **Leitor da plataforma** ou **Administrador da plataforma**. |
| **Login por senha**              | **Senha definida** ou **Sem senha (somente login único)**.                                     |
| **Último login**, **Criado em**  | Data e hora.                                                                                   |

### Associações {#memberships}

O cartão **Associações** mostra a que o usuário pertence, até onde você pode ver:

- **Funções de produto**: produtos em que o usuário é operador, com a função. Administradores e
  observadores da plataforma veem todos; os demais veem os produtos em que têm
  `product_members:read`.
- **Associações em tenants**: tenants em que o usuário é membro, com o produto, a função e o
  status do tenant. Os demais veem os tenants em que têm `members:read`.

O cartão é somente leitura. Para alterar o que um usuário pode fazer, abra a guia **Membros** do
tenant (pelo nome dele) ou, para operadores, a guia **Membros** do produto.

### Usuários sem endereço de e-mail {#no-email}

Algumas contas não têm endereço de e-mail, por exemplo quando um provedor de identidade não
confirmou nenhum e o servidor permite esse tipo de cadastro. O Studio então mostra o ID do usuário
no lugar do endereço. Esses usuários:

- entram apenas pelo login único, nunca com senha;
- não podem aceitar convites, porque os convites são vinculados a um endereço;
- ainda podem ser adicionados diretamente a tenants por alguém que consiga vê-los (por exemplo, um
  administrador da plataforma).

## Identidades de login único {#identities}

O cartão **Identidades de login único** na página de um usuário lista as contas em provedores de
identidade que entram como este usuário, com as colunas **Provedor (emissor)**, **Sujeito**,
**E-mail informado** (o endereço que o provedor enviou) e **Vinculada**. O Axentra vincula uma
identidade no primeiro login único do usuário ou quando um administrador da plataforma a vincula
aqui.

> [!IMPORTANT]
> O cartão precisa de `users:manage`. Apenas administradores da plataforma vinculam e desvinculam
> identidades.

### Vincular uma identidade {#link-identity}

1. Abra a página do usuário e escolha **Vincular identidade** no cartão **Identidades de login
   único**.
2. Digite o **Provedor (emissor)** e o **Sujeito** e escolha **Vincular identidade**.

Depois, o usuário pode entrar com essa conta no provedor. Uma identidade pertence a um único
usuário: **Conflito** significa que ela já está vinculada, a este ou a outro usuário.

### Desvincular uma identidade {#unlink-identity}

1. No cartão **Identidades de login único**, escolha o botão de desvincular ao lado da identidade.
2. Leia o aviso e escolha **Desvincular identidade**.

Todas as sessões do usuário terminam imediatamente, porque uma sessão não registra com qual
identidade começou. A última forma de entrar de um usuário não pode ser desvinculada: se o usuário
não tem senha nem outra identidade, o Studio mostra **Última forma de entrar do usuário**. Vincule
outra identidade primeiro ou, em vez disso, [desabilite o usuário](help:users#disable).

## Desconectar um usuário de todos os lugares {#sign-out}

1. Abra a página do usuário.
2. Escolha **Sair de todos os lugares** e confirme.

Todas as sessões do usuário terminam imediatamente, em todos os dispositivos. O usuário pode entrar
de novo. Use isso quando um dispositivo for perdido ou uma sessão puder estar comprometida.
**Sessões ativas**, na mesma página, lista cada sessão com dispositivo, **Método de login**,
**Última atividade** e **Expira em**.

## Desabilitar um usuário {#disable}

1. Abra a página do usuário.
2. Escolha **Desabilitar usuário**.
3. Digite o endereço de e-mail do usuário (ou o ID, para usuários sem e-mail) para confirmar e
   escolha **Desabilitar usuário**.

Um usuário desabilitado não consegue entrar, nem por senha nem por login único, e todas as sessões
dele terminam imediatamente. As associações, a função na plataforma e o histórico de auditoria
permanecem, então **Habilitar usuário** restaura o acesso anterior.

> [!WARNING]
> As chaves de API que um usuário criou deixam de funcionar assim que ele é desabilitado ou perde as
> permissões que as chaves usam: as solicitações são recusadas com `api_key_creator_lost_access`
> (veja [chaves de API](help:api-keys#creator-permissions)). As chaves não são revogadas e voltam a
> funcionar se o acesso for restabelecido. Quando alguém sai, crie chaves substitutas como alguém
> que fica, mude os serviços para elas e revogue as chaves antigas.

Você não pode desabilitar a si mesmo, e o último administrador da plataforma ativo não pode ser
desabilitado.

## Alterar uma função na plataforma {#platform-role}

As funções na plataforma valem para **todos os produtos** do servidor, independentemente das
associações.

| Função na plataforma             | Significado                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nenhuma função na plataforma** | Acesso apenas por meio de associações a produtos e tenants.                                                                                                 |
| **Leitor da plataforma**         | Acesso somente leitura a todos os produtos, inclusive produtos arquivados e tenants suspensos, às configurações e ao log de auditoria de toda a instalação. |
| **Administrador da plataforma**  | Controle total de toda a instalação: todos os produtos e usuários, criação e arquivamento de produtos, sem teto de funções.                                 |

1. Abra a página do usuário. O cartão **Função na plataforma** só aparece para administradores da
   plataforma.
2. Escolha a nova **Função na plataforma**.
3. Escolha **Alterar função na plataforma** e confirme. Conceder **Administrador da plataforma**
   exige digitar o endereço de e-mail do usuário (ou o ID).

> [!CAUTION]
> Um administrador da plataforma pode fazer tudo no servidor, inclusive excluir tenants e criar
> chaves em qualquer produto. Conceda essa função ao menor número possível de pessoas. O último
> administrador da plataforma não pode perder a função.

## Solução de problemas {#troubleshooting}

**Não permitido na tela Usuários.** Falta a você `product_users:read` neste produto.
Proprietários e membros de tenants não têm essa permissão; eles veem os colegas na guia
**Membros** do tenant.

**Não há botões Desabilitar usuário nem Sair de todos os lugares.** Eles exigem `users:manage`, que
só os administradores da plataforma têm.

**Conflito: “you cannot disable yourself”.** Peça a outro administrador da plataforma.

**Conflito: “the last platform admin cannot be disabled” / “the last platform admin cannot lose
the role”.** Torne outro usuário administrador da plataforma primeiro.

**Não permitido: “only platform admins can change platform roles”.** Peça a um administrador da
plataforma.

**Um usuário não aparece na lista.** O usuário não é operador deste produto nem membro de um dos
tenants dele. Adicione-o ou convide-o; veja [membros e convites](help:members-invitations).

**Um usuário desabilitado ainda aparece nos tenants.** Desabilitar não remove associações.
Remova-as na guia **Membros** do tenant se o acesso não deve voltar quando o usuário for habilitado
novamente.

**Conflito ao adicionar um usuário de login único ou ao vincular uma identidade.** A identidade já
está vinculada a um usuário, ou o endereço de e-mail verificado pertence a outro usuário. Procure
esse usuário ou confira o provedor e o sujeito.
