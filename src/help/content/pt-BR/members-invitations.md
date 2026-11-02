---
title: Membros e convites
summary: Dê acesso a um tenant adicionando pessoas como membros ou convidando-as por e-mail, e entenda o teto de funções que limita quais funções você pode atribuir.
keywords: membro, associação, convidar, convite, link do convite, token do convite, aceitar convite, teto de funções, proprietário, adicionar usuário, onboarding, integração, equipe, time
---

Um **membro** é um usuário com uma função em um tenant, por exemplo **Owner** (proprietário),
**Admin** (administrador), **Member** (membro) ou **Viewer** (leitor). A função decide o que a
pessoa pode fazer nesse tenant. Você dá acesso a alguém de uma de duas formas:

- **Adicionar** uma conta existente diretamente, quando você já consegue ver essa conta.
- **Convidar** uma pessoa por e-mail. Ela aceita o convite depois de entrar e se torna membro com a
  função que você escolheu.

Os operadores de um produto inteiro são gerenciados no próprio produto; veja
[produtos](help:products#members).

> [!IMPORTANT]
> Ver as guias **Membros** e **Convites** de um tenant exige `members:read` no tenant; adicionar,
> convidar, alterar funções, remover e revogar exige `members:manage`. Proprietários e
> administradores do tenant têm as duas; operadores com **Support** têm `members:manage`, mas só
> podem atribuir funções dentro das próprias permissões (veja o [teto de funções](#role-ceiling)).
> As duas telas exigem o módulo de tenants.

## Funções de tenant integradas {#tenant-roles}

| Função                     | Pode fazer                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Owner** (`tenant_owner`) | Tudo no tenant, inclusive tornar outras pessoas proprietárias.                                                       |
| **Admin** (`tenant_admin`) | As mesmas permissões do Owner, mas não pode atribuir, alterar nem remover proprietários.                             |
| **Member** (`member`)      | Trabalha com os dados: lê e grava registros e arquivos, publica eventos, registra uso, envia notificações, pesquisa. |
| **Viewer** (`viewer`)      | Lê o tenant, seus membros, registros, arquivos, uso e cobrança, e pesquisa.                                          |

As funções de tenant personalizadas do seu produto aparecem nas mesmas listas, com a chave entre
parênteses. Veja [funções e permissões](help:roles-permissions).

## Adicionar um usuário existente {#add}

1. Abra o tenant em [Tenants](app:tenants) e selecione a guia **Membros**.
2. Escolha **Adicionar membro**.
3. Informe o **Endereço de e-mail** e escolha uma **Função**.
4. Escolha **Adicionar membro**.

Isso só funciona para contas que você consegue ver: administradores da plataforma veem todas as
contas; usuários com `product_users:read` (proprietários, administradores, suporte e leitores do
produto) veem todos que já pertencem ao produto; os demais veem apenas os membros do próprio
tenant. Para qualquer outro endereço, o diálogo mostra **Usuário não encontrado** e oferece
**Enviar convite**, que cria um convite com o mesmo e-mail e a mesma função.

> [!NOTE]
> O Axentra responde “não encontrado” da mesma forma, quer a conta não exista, quer apenas não
> esteja visível para você. Isso impede que a lista de contas do servidor seja sondada.

## Alterar uma função ou remover um membro {#change-role}

- Para alterar uma função, escolha uma nova na coluna **Função** do membro. A alteração vale
  imediatamente.
- Para remover um membro, escolha o ícone de lixeira na linha e confirme **Remover membro?**. A
  pessoa perde todo o acesso concedido por essa associação. A conta e as outras associações dela
  permanecem.

Um tenant sempre mantém pelo menos um **Owner**: o último proprietário não pode ser removido nem
receber outra função. Torne outra pessoa proprietária primeiro.

## Convidar alguém por e-mail {#invite}

1. Abra o tenant e selecione a guia **Convites**, ou abra [Convites](app:invitations) e escolha o
   tenant.
2. Escolha **Convidar membro**.
3. Informe o **Endereço de e-mail** e escolha uma **Função**. O Studio pré-seleciona **Member** ou
   a primeira função que você pode atribuir.
4. Escolha **Enviar convite**.

O diálogo **Convite criado** mostra então o **Link do convite** (quando disponível) e o **Token do
convite**.

> [!CAUTION]
> O link e o token são mostrados uma única vez. O Axentra armazena apenas um hash do token, então
> ninguém consegue exibi-lo de novo. Qualquer pessoa que tenha o token e entre com o endereço
> convidado pode participar do tenant. Compartilhe-o somente com a pessoa convidada. Se ele se perder,
> revogue o convite e crie um novo.

### Como o convite chega à pessoa {#delivery}

- **Módulo de notificações ativado:** o Axentra coloca na fila um e-mail de convite para o
  endereço com o link de aceite, e o Studio mostra o mesmo link para que você também possa enviá-lo.
  O link usa a configuração de produto `invitation_accept_url`, se definida (veja
  [configurações do produto](help:products#settings)); caso contrário, a configuração do servidor
  `notify.invitation_accept_url` (veja a
  [configuração do servidor](help:server-configuration#user-visible-settings)); caso contrário,
  `/accept-invitation` na URL pública do servidor. O Studio atende `/accept-invitation` e
  redireciona para a página **Aceitar convite**, então o padrão funciona quando o Studio roda no
  endereço da API. Quando o Studio tem endereço próprio (por exemplo `https://studio.example.com`
  ao lado de `https://api.example.com`), o padrão aponta para a API: defina
  `notify.invitation_accept_url` (ou a configuração de produto) como
  `https://<your Studio address>/invitations/accept`.
- **Módulo de notificações desabilitado:** nenhum e-mail é enviado e não há link. Compartilhe o
  **Token do convite**; a pessoa o informa na página **Aceitar convite** do Studio.

### Validade e status do convite {#expiry}

| Status       | Significado                                                   |
| ------------ | ------------------------------------------------------------- |
| **Pendente** | Em aberto e válido; pode ser aceito ou revogado.              |
| **Aceito**   | Usado; a pessoa é membro.                                     |
| **Revogado** | Cancelado com **Revogar convite**; o token não funciona mais. |
| **Expirado** | Não aceito em até **7 dias** após a criação.                  |

A validade de 7 dias é fixa. Para estendê-la, revogue o convite (se ainda estiver pendente) e
convide novamente. Só pode existir um convite em aberto por endereço de e-mail e tenant ao mesmo
tempo.

### Revogar um convite {#revoke}

Escolha o ícone de lixeira ao lado de um convite **Pendente** e confirme **Revogar convite?**. O
link e o token param de funcionar imediatamente.

## Aceitar um convite {#accept}

Isto é o que a pessoa convidada faz:

1. Abra o link do convite. Se você não estiver conectado, **Entrar** avisa que você está entrando
   para um convite e depois traz você de volta a ele, também após o login único.
2. Entre com a conta cujo endereço de e-mail é o endereço convidado. Ainda não tem conta? Se a
   página de login oferecer login único, entre por ali com o endereço convidado: o servidor cria
   sua conta porque há um convite aberto para ele. Não há cadastro com senha; fale com quem
   convidou você ou com um administrador.
3. Confira a conta mostrada em **Conectado como** e escolha **Aceitar convite**. Depois de entrar
   com senha, nada acontece antes da sua confirmação. O Studio tira o token da barra de endereço
   assim que a página o lê, para que ele não fique no histórico do navegador; o campo **Token do
   convite** já vem preenchido. Se você tiver só o token, abra **Aceitar convite** em
   `/invitations/accept` e cole-o.

Com o login único, o servidor aceita o convite assim que você entra. O Studio confere que agora você
é membro do tenant e mostra **Convite aceito** na hora, sem uma segunda confirmação. Se o servidor
não conseguiu aceitá-lo (por exemplo, porque você entrou com outro endereço), a página pede a sua
confirmação como no passo 3 e explica o que deu errado.

**Convite aceito** mostra o tenant, o produto e sua função; **Abrir o tenant** leva você até ele.
Se você já era membro do tenant, sua função atual continua a mesma.

> [!IMPORTANT]
> Um convite só pode ser aceito por um usuário conectado cuja conta tenha exatamente o endereço de
> e-mail convidado (maiúsculas e minúsculas não importam). Usuários sem endereço de e-mail não
> podem aceitar convites; adicione-os diretamente.

## Teto de funções: quais funções você pode atribuir {#role-ceiling}

Ter `members:manage` não permite que você conceda mais do que você mesmo tem. O servidor aplica
estas regras, e o Studio as mostra com antecedência:

1. **Permissões.** Você só pode atribuir uma função (adicionar, convidar ou alterar para ela) se
   tiver todas as permissões dessa função no mesmo tenant. Você só pode alterar ou remover um
   membro se a função _atual_ dele também estiver dentro das suas permissões.
2. **Nível de proprietário.** A função **Owner** só pode ser atribuída, alterada ou removida por um
   proprietário do tenant, por um operador de produto, por uma chave de API do produto inteiro ou
   por um administrador da plataforma.
3. **Último proprietário.** O último proprietário de um tenant (e o último **Product owner** de um
   produto) não pode ser removido nem rebaixado.

| Você é                                    | Você pode atribuir                              | Você não pode                                                          |
| ----------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Administrador da plataforma               | Todas as funções                                | Nada é limitado                                                        |
| Proprietário ou administrador do produto  | Todas as funções de tenant, inclusive **Owner** | (Administradores do produto não podem gerenciar operadores de produto) |
| Operador com **Support**                  | **Viewer**                                      | **Member**, **Admin**, **Owner**                                       |
| **Owner** do tenant                       | Todas as funções do tenant                      | Remover o último proprietário                                          |
| **Admin** do tenant                       | **Admin**, **Member**, **Viewer**               | Atribuir, rebaixar ou remover um **Owner**                             |
| Função personalizada com `members:manage` | Funções cujas permissões ela tem                | Funções mais fortes                                                    |

No Studio, as funções que você não pode atribuir aparecem como **“… (acima das suas
permissões)”** e ficam desabilitadas, e os membros que você não pode alterar mostram **Acima da sua
própria função**, sem seletor de função nem botão de remover.

> [!NOTE]
> O Studio só consegue calcular o teto quando você pode ler as funções do produto (`roles:read`).
> Sem isso, a função é um campo de texto livre e o servidor explica uma recusa com **Não
> permitido**.

## Solução de problemas {#troubleshooting}

**Usuário não encontrado.** A conta não existe ou você não tem permissão para vê-la. Use **Enviar
convite**.

**Conflito: “an open invitation for this email exists”.** Já existe um convite pendente para este
endereço no tenant. Use-o ou revogue-o e convide novamente.

**Não permitido: “you cannot assign the role …: it has permissions you do not hold”.** A função
está acima do seu nível. Escolha uma função mais fraca ou peça a um proprietário. Veja o
[teto de funções](#role-ceiling).

**Não permitido: “only owners can assign the role tenant_owner”.** Somente proprietários,
operadores de produto e administradores da plataforma podem gerenciar proprietários.

**Conflito: “the tenant needs at least one owner”.** Você tentou remover ou rebaixar o último
proprietário.

**Verifique os dados informados: “unknown tenant role …”.** A chave da função não existe neste
produto (por exemplo, um erro de digitação no campo de texto livre da função) ou é uma função de
produto.

**Ao aceitar: Este convite não pode ser usado.** O servidor responde da mesma forma para um
convite expirado (após 7 dias), já aceito ou revogado, e para um link ou token incompleto ou
digitado errado, para que ninguém consiga sondar convites. Peça um novo convite a quem convidou
você.

**Ao aceitar: Convite para outro endereço de e-mail.** Você está conectado com uma conta de outro
endereço. Escolha **Sair e usar o endereço convidado**: depois que você entrar com o endereço
convidado, o Studio traz você de volta ao convite. Ou peça um convite para o seu próprio endereço.

**Ao aceitar: Sua conta não tem endereço de e-mail.** Essas contas não podem aceitar convites. Entre
com o endereço convidado ou peça a quem convidou você que adicione sua conta diretamente ao tenant.

**Ao aceitar: Não foi possível acessar o servidor.** Nada foi alterado. Verifique sua conexão e
escolha **Tentar novamente**.

**O link do convite abre "não encontrada" ou uma página da API.** O link aponta para um endereço
onde o Studio não roda. Defina a configuração do servidor `notify.invitation_accept_url` (ou a
configuração de produto `invitation_accept_url`) com a página de aceite do Studio; veja
[a entrega](#delivery). Até lá, envie o token e peça que a pessoa o cole em `/invitations/accept`.

**A pessoa convidada não consegue entrar.** Ela ainda não tem conta. O Studio não cria contas e não
existe cadastro com senha. Uma pessoa convidada obtém uma conta entrando pelo login único com o
endereço de e-mail convidado e verificado; sem login único, fale com um administrador da
plataforma. Veja [entrar e sair](help:signing-in).

**O diálogo do convite mostra apenas um token.** O módulo de notificações está desabilitado, então
nenhum link foi gerado. Compartilhe o token.
