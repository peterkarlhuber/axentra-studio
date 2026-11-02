---
title: Segurança
summary: Como o Axentra e o Studio protegem os logins, separam os tenants, limitam o que as pessoas podem conceder e tratam segredos, e o que você pode fazer para manter a sua instalação segura.
keywords: segurança, sessão, cookie, CSRF, segurança em nível de linha, RLS, isolamento de tenants, teto de funções, segredo, chave de API, rotação, assinatura de webhook, HMAC, auditoria, privacidade, LGPD, GDPR, senha
---

O Axentra foi construído para que um erro em um ponto não abra tudo: o acesso é negado a menos que
uma função o conceda, os dados de cada tenant ficam separados no banco de dados, as pessoas não
podem distribuir mais direitos do que têm, e os segredos são exibidos uma única vez e depois
armazenados apenas em uma forma que não pode ser lida de volta. Esta página explica essas proteções
em palavras simples, o que você vê delas no Studio e os hábitos que mantêm uma instalação segura.

> [!NOTE]
> O Studio é apenas uma janela para o servidor Axentra. Toda decisão (quem pode ver ou alterar o
> quê) é tomada pelo servidor. O Studio oculta botões que você não pode usar, mas ocultar é uma
> conveniência, não a proteção.

## Sessões e proteção contra CSRF {#sessions-csrf}

### A sua sessão {#sessions}

Quando você entra, o servidor cria uma _sessão_ e o seu navegador recebe um cookie de sessão. O
cookie é marcado de forma que scripts em uma página não possam lê-lo e, com HTTPS, ele só é enviado
por conexões criptografadas. O servidor guarda apenas uma impressão digital (hash) do token de
sessão, nunca o próprio token. Um novo token é criado a cada login.

Uma sessão termina:

- após a duração máxima (padrão 12 horas),
- após um período sem atividade (padrão 120 minutos),
- quando você escolhe **Sair** no menu do usuário,
- quando você a revoga em **Suas sessões**, no seu [perfil](help:profile), ou quando um
  administrador usa **Sair de todos os lugares** na sua página de usuário,
- quando a sua conta é desabilitada,
- para todas as suas _outras_ sessões, quando você altera a sua senha.

O seu operador pode alterar essas durações. Quando uma sessão termina, o Studio leva você à página
de login e, depois, de volta para onde você estava (veja
[Sessão encerrada](help:troubleshooting#session-ended)).

### Proteção contra CSRF {#csrf}

_Cross-site request forgery_ (CSRF) é um ataque em que outro site tenta fazer o seu navegador enviar
uma alteração ao Axentra enquanto você está conectado. O Axentra o bloqueia de três formas, e você
não precisa fazer nada:

1. O cookie de sessão não é enviado junto com requisições que outros sites disparam em segundo plano
   (`SameSite=Lax`).
2. Toda alteração que o Studio envia leva um token de segurança que pertence à sua sessão. O Studio
   guarda esse token apenas na memória, nunca no armazenamento do navegador.
3. O servidor verifica se a requisição vem de um endereço em que ele confia (o endereço do Studio
   precisa estar na lista de origens permitidas do servidor).

Se o Studio roda em um endereço em que o servidor não confia, o login e todas as alterações falham
com **Não permitido**; veja [O login ou o salvamento falha](help:troubleshooting#csrf-origin).

### Senhas e tentativas de login {#passwords}

As senhas são armazenadas com Argon2id, um hash lento de mão única. A política do servidor exige,
por padrão, pelo menos 12 caracteres. Um login com falha sempre diz que o endereço de e-mail _ou_ a
senha está errado, para que ninguém descubra quais contas existem. Depois de cerca de 10 tentativas
com falha para uma conta em um minuto (mais a partir de um mesmo endereço de rede), novas tentativas
são recusadas por até um minuto.

Definir uma _primeira_ senha em uma conta que só entra por login único só é permitido nos primeiros
minutos após o login, para que uma sessão roubada não possa ser transformada em um login por senha
permanente (veja [Faça login novamente](help:troubleshooting#reauthentication-required)).

## Isolamento de tenants {#tenant-isolation}

Cada cliente ou organização em um produto é um [tenant](help:tenants). O Axentra mantém os tenants
separados em duas camadas independentes:

1. **Verificações de permissão.** Antes de qualquer dado ser lido ou gravado, o servidor verifica se
   você (ou a chave de API) tem a permissão necessária para exatamente este produto e tenant.
2. **Segurança em nível de linha no banco de dados.** Toda transação do banco de dados fica limitada
   a um produto ou a um tenant. Mesmo que uma consulta esqueça um filtro, o próprio banco de dados
   retorna apenas linhas desse produto ou tenant e se recusa a gravar linhas para outro.

O que isso significa para você:

- Um membro de tenant vê apenas os dados do próprio tenant. Pessoas sem relação com um produto ou
  tenant recebem **Não encontrado**, exatamente como se ele não existisse.
- Uma função no nível do produto (por exemplo **Product admin**) vale em _todos_ os tenants do
  produto. Dê funções de produto apenas a quem realmente precisa desse alcance.
- Uma chave de API pertence a um produto e pode ser restrita a um tenant.
- As contas de usuário são globais: uma conta pode trabalhar em vários produtos e tenants.
  Administradores de produto veem apenas os usuários relacionados ao seu produto.

> [!NOTE]
> Administradores de banco de dados, e os backups do banco, podem ver todos os dados. Proteger o
> servidor de banco de dados e os backups é tarefa do operador.

## Teto de funções: ninguém concede mais do que tem {#role-ceiling}

Ter permissão para gerenciar membros (`members:manage`, ou `product_members:manage` para operadores
de produto) não significa que você pode tornar qualquer pessoa administradora. O servidor impõe um
_teto de funções_:

- Você só pode atribuir uma função (adicionar, convidar ou alterar um membro) se **tiver todas as
  permissões dessa função** no mesmo escopo.
- Você só pode alterar ou remover um membro se a função _atual_ dele também estiver dentro das suas
  permissões.
- As funções de proprietário (**Owner** de um tenant, **Product owner** de um produto) só podem ser
  atribuídas, alteradas ou removidas por um proprietário do mesmo escopo, ou por alguém com
  autoridade acima: operadores de produto para tenants, administradores da plataforma em todo lugar.
- O último proprietário de um produto ou tenant não pode ser removido nem rebaixado, e o último
  administrador da plataforma não pode ser desabilitado nem rebaixado.

No Studio, funções que você não pode atribuir aparecem como **"… (acima das suas permissões)"** e não
podem ser selecionadas; membros acima do seu nível mostram **Acima da sua própria função: somente
alguém com as permissões desta função pode alterá-la**. O mesmo princípio vale para chaves de API:
uma nova chave só pode ter permissões que quem a cria tem. Permissões da plataforma nunca são
concedidas a chaves de API.

Detalhes e exemplos: [Funções e permissões](help:roles-permissions) e a
[referência de permissões](help:permissions-reference).

## Segredos de exibição única {#one-time-secrets}

Alguns valores são segredos que permitem que uma máquina ou pessoa aja em seu nome. O Axentra
exibe cada um deles **exatamente uma vez**:

| Segredo                                      | Quando é exibido                                        | Como o servidor o guarda                               |
| -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Segredo da chave de API (`axk_…`)            | Depois de criar ou rotacionar uma chave                 | Apenas um hash; não pode ser exibido de novo           |
| Segredo de assinatura do webhook (`whsec_…`) | Depois de criar um webhook ou rotacionar o segredo dele | Criptografado (AES-256-GCM), usado apenas para assinar |
| Link e token de convite                      | Depois de criar um convite                              | Apenas um hash do token                                |
| Token de configuração inicial                | Impresso no servidor para o primeiro administrador      | Apenas um hash; válido por tempo limitado              |

No Studio, os segredos de chaves de API e de webhooks aparecem em um diálogo com um aviso, um campo
mascarado e botões de cópia. O diálogo não pode ser fechado com Escape nem clicando fora; você
confirma com **Guardei o segredo em local seguro**. Links e tokens de convite aparecem em uma caixa
marcada como **Exibido apenas uma vez**.

Se um segredo for perdido, ele não pode ser recuperado: [rotacione a chave de API](help:api-keys),
rotacione o [segredo do webhook](help:webhooks) ou crie um novo convite.

## Boas práticas com chaves de API {#api-key-hygiene}

[Chaves de API](help:api-keys) permitem que outros sistemas chamem a API do Axentra. Boas práticas:

- **Uma chave por serviço e ambiente**, com o nome de onde é usada (por exemplo
  "billing-worker produção"), para que você possa revogar uma sem quebrar as outras.
- **Privilégio mínimo:** conceda apenas as permissões de que o serviço precisa e restrinja a chave a
  um tenant quando o serviço trabalha para um único tenant.
- **Guarde os segredos em um gerenciador de segredos**, nunca no código-fonte, em tickets ou no chat.
- **Rotacione regularmente** com **Rotacionar segredo**. Um período de carência (de até 7 dias)
  mantém o segredo antigo funcionando enquanto você atualiza os serviços.
- **Revogue as chaves de que você não precisa mais.** Revogar uma chave também revoga todas as chaves
  criadas com ela. Chaves criadas por uma pessoa pertencem ao produto, não à pessoa: quando alguém
  sai, verifique e revogue as chaves que essa pessoa configurou.
- Fique de olho na coluna **Último uso**: uma chave que nunca é usada pode ser removida; uma chave
  usada de forma inesperada merece uma olhada no [log de auditoria](help:audit).

## Assinaturas de webhook {#webhook-signing}

O Axentra assina cada requisição de [webhook](help:webhooks) para que o sistema receptor possa
verificar se ela realmente vem do seu servidor Axentra e não foi alterada nem reenviada. Cada
requisição traz um cabeçalho `Axentra-Signature`:

```text
Axentra-Signature: t=1767225600,v1=5f2b…
```

`t` é o momento da assinatura (segundos Unix); `v1` é um HMAC-SHA256 de `<t>.<raw request body>`
calculado com o segredo de assinatura do webhook. Durante uma rotação de segredo com período de
carência, o cabeçalho traz dois valores `v1`, um por segredo. O receptor deve:

1. calcular o HMAC sobre o timestamp, um ponto e o corpo bruto,
2. compará-lo com cada valor `v1` em tempo constante,
3. rejeitar requisições cujo timestamp tenha mais de cerca de 5 minutos,
4. ignorar eventos cujo ID (`Axentra-Event-Id`) ele já processou.

O [tutorial de receptor de webhooks](help:tutorial-webhook-receiver) mostra um exemplo completo.

## Trilha de auditoria {#audit-trail}

O servidor registra as alterações relevantes para a segurança em um [log de auditoria](help:audit)
que só aceita inclusões: quem (usuário ou chave de API), o quê (por exemplo `access.role.create`),
quando, em qual produto e tenant, o resultado, o ID da requisição, o endereço IP e o navegador ou
cliente. Os segredos são removidos dos detalhes registrados antes do armazenamento.

Operadores de produto com `audit:read` veem os eventos do seu produto; administradores e leitores da
plataforma (`platform:audit`) veem eventos de toda a instalação, como logins e alterações de
usuários. Os eventos de auditoria são mantidos por um período que o seu operador define (padrão 365
dias).

## O que o Studio nunca armazena {#what-studio-never-stores}

- **Nenhum segredo no navegador.** O token CSRF e um token de monitoramento que você informe ficam
  apenas na memória e desaparecem quando você fecha ou recarrega a guia. Segredos de exibição única
  são exibidos, nunca salvos.
- **Apenas preferências inofensivas no armazenamento do navegador:** idioma, tema, a barra lateral
  recolhida e o último produto que você usou.
- **Nenhum dado de cartão ou bancário.** O Studio nunca pede dados de pagamento; os pagamentos
  acontecem apenas na página hospedada do provedor de pagamento (veja
  [Planos e assinaturas](help:plans-subscriptions)).
- **Nenhum script de terceiros.** O Studio carrega o próprio código apenas do próprio endereço. As
  pré-visualizações de e-mail são exibidas em um sandbox que não pode executar scripts.

O servidor também remove senhas, tokens e chaves dos logs, das mensagens de erro e dos detalhes de
auditoria.

## Boas práticas {#good-practice}

- Conceda funções da plataforma com moderação; prefira funções de produto e de tenant.
- Use as funções integradas quando servirem, e funções personalizadas apenas com as permissões
  necessárias.
- Desabilite as contas de quem sai (**Desabilitar usuário** encerra todas as sessões da pessoa de
  uma vez) e revise as chaves de API que ela criou.
- Revise o [log de auditoria](help:audit) regularmente, principalmente alterações de funções, chaves
  e membros.
- Saia da sessão em computadores compartilhados e revogue, no seu [perfil](help:profile), as sessões
  que você não reconhece.

> [!IMPORTANT]
> O Axentra oferece medidas técnicas (separação de tenants, criptografia dos segredos armazenados,
> trilha de auditoria, minimização de dados nos logs), mas não torna uma instalação, por si só,
> conforme com leis de proteção de dados como a LGPD ou o GDPR. Hospedagem, backups, retenção e
> solicitações de titulares de dados são responsabilidade do operador. Ainda não há exportação nem
> eliminação integradas dos dados de uma pessoa (veja [limitações](help:limitations)).

## Solução de problemas {#troubleshooting}

| Situação                                                                                                                     | Causa e solução                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O login e todas as alterações falham com **Não permitido** (`cross-origin request refused`, `missing or invalid CSRF token`) | O endereço do Studio não está nas origens permitidas do servidor, ou o cookie está bloqueado. Veja [a entrada de solução de problemas](help:troubleshooting#csrf-origin). |
| A sua sessão é encerrada inesperadamente                                                                                     | A sessão expirou, foi revogada, ou a sua senha foi alterada em outra sessão. Entre novamente.                                                                             |
| **Não permitido** ao atribuir uma função                                                                                     | Teto de funções: a função tem permissões que você não tem, ou é uma função de proprietário. Peça a um proprietário.                                                       |
| **Não permitido** ao criar uma chave de API                                                                                  | Você tentou conceder uma permissão que você mesmo não tem. Remova-a da seleção.                                                                                           |
| **Faça login novamente** ao definir uma senha                                                                                | Só é permitido logo após o login. Escolha **Entrar novamente** e repita em seguida.                                                                                       |
| Um receptor rejeita as assinaturas de webhook                                                                                | Ele precisa assinar o corpo _bruto_, aceitar qualquer valor `v1` e usar o segredo atual. Veja [Webhooks](help:webhooks).                                                  |
| Você perdeu um segredo                                                                                                       | Ele não pode ser exibido de novo; rotacione-o ou crie um novo convite.                                                                                                    |
