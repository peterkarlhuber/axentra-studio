---
title: Solução de problemas
summary: O que significam as mensagens de erro do Studio, por que aparecem e o que fazer, de problemas na inicialização a ações recusadas.
keywords: erro, problema, falhou, não funciona, ID da requisição, não permitido, proibido, não encontrado, conflito, 401, 403, 404, 409, 412, 413, 415, 422, 429, 500, não foi possível conectar, versão incompatível, sessão expirada, módulo não habilitado
---

Quando o servidor Axentra recusa ou não consegue concluir uma requisição, o Studio mostra uma
mensagem traduzida que diz o que aconteceu e o que você pode fazer. Esta página explica cada
mensagem, as telas de inicialização que você pode ver antes de o Studio abrir e algumas situações
comuns. Cada seção tem o próprio destino de link, para que as telas possam levar você direto à
explicação certa.

## Como uma mensagem de erro é montada {#error-message}

Todo erro no Studio tem as mesmas partes:

- **Título**: um nome curto para o problema, por exemplo **Não permitido** ou **Conflito**. Ele é
  escolhido a partir do _código de erro_ estável do servidor, então é o mesmo em todos os idiomas.
- **Mensagem**: o que aconteceu, a causa provável e o que fazer em seguida.
- **Erros de campo**: quando o servidor rejeita valores individuais, o Studio os lista abaixo dos
  campos do formulário afetados, ou como uma lista de nomes de campos e motivos.
- **Detalhes técnicos** (expansível): o **Status HTTP**, o **Código de erro**, a **Mensagem do
  servidor** (a explicação do próprio servidor, sempre em inglês) e o **ID da requisição**.

Ações que falham (salvar, excluir, enviar) aparecem como uma notificação no canto da tela, com as
mesmas informações. Para **Não permitido** e **Conflito**, a notificação acrescenta a mensagem do
servidor, porque ela geralmente diz exatamente o que falta, por exemplo
`missing permission tenants:update` ou `a tenant with this slug exists in the product`.

### O ID da requisição {#request-id}

Toda resposta do servidor traz um ID de requisição como `req_01EXAMPLE…`. O servidor grava o mesmo
ID nos logs e no [log de auditoria](help:audit). Quando você relatar um problema ao seu operador ou
ao suporte, inclua sempre o ID da requisição: com ele, encontram a requisição exata em segundos.

> [!TIP]
> Abra **Detalhes técnicos** e copie o ID da requisição antes de fechar a mensagem ou tentar de novo.

## Códigos de erro {#error-codes}

A tabela dá uma visão geral. As seções abaixo explicam cada código, com causas e soluções.

| Título no Studio                          | Código de erro                    | Status HTTP  | Em resumo                                            |
| ----------------------------------------- | --------------------------------- | ------------ | ---------------------------------------------------- |
| **Verifique os dados informados**         | `validation_failed`               | 422 (ou 400) | Valores foram rejeitados                             |
| **Requisição não compreendida**           | `bad_request`                     | 400          | A requisição não pôde ser lida                       |
| **Assinatura inválida**                   | `invalid_signature`               | 400          | Webhook do provedor de pagamento recusado            |
| **Faça login**                            | `unauthenticated`                 | 401          | Nenhuma sessão válida                                |
| **Não permitido**                         | `forbidden`                       | 403          | Falta permissão, ou o produto ou tenant está inativo |
| **Faça login novamente**                  | `reauthentication_required`       | 403          | Exige um login recente                               |
| **Não encontrado**                        | `not_found`                       | 404          | Não existe, ou não é visível para você               |
| **Módulo não habilitado**                 | `module_disabled`                 | 404          | Módulo do servidor desligado                         |
| **Ação não suportada**                    | `method_not_allowed`              | 405          | Não oferecida neste endereço                         |
| **Conflito**                              | `conflict`                        | 409          | Conflita com dados ou estado existentes              |
| **A configuração já foi concluída**       | `setup_already_completed`         | 409          | Já existe um administrador                           |
| **Endereço de e-mail em uso**             | `email_taken`                     | 409          | Outra conta tem o endereço                           |
| **Indisponível neste modo**               | `mode_not_supported`              | 409          | Não é possível neste modo do servidor                |
| **Provedor de pagamento não configurado** | `payment_provider_not_configured` | 409          | A cobrança precisa de um provedor                    |
| **Alterado nesse meio-tempo**             | `precondition_failed`             | 412          | Outra pessoa salvou antes                            |
| **Grande demais**                         | `payload_too_large`               | 413          | Requisição ou arquivo grande demais                  |
| **Tipo não aceito**                       | `unsupported_media_type`          | 415          | Tipo de conteúdo bloqueado ou não suportado          |
| **Muitas requisições**                    | `rate_limited`                    | 429          | Reduza o ritmo                                       |
| **Cota excedida**                         | `quota_exceeded`                  | 429          | Cota do tenant ou limite do plano esgotado           |
| **Erro no servidor**                      | `internal`                        | 500 ou acima | Falha do lado do servidor                            |
| **A requisição falhou**                   | `error`                           | outro        | Erro HTTP sem código específico                      |
| **Servidor inacessível**                  | `network_error`                   | nenhum       | Nenhuma resposta do servidor                         |
| **Erro inesperado**                       | `unknown`                         | outro        | Não reconhecido                                      |

### Verifique os dados informados {#validation-failed}

**O que aconteceu:** o servidor verificou os valores que você enviou e rejeitou pelo menos um deles
(`validation_failed`, HTTP 422).

**Causas típicas:** um campo obrigatório está vazio, um valor é longo demais, uma chave ou slug
contém caracteres não permitidos, um campo JSON não é um objeto JSON, um nome de permissão é
desconhecido ou não é permitido para esse tipo de função, uma senha não atende à política de senhas
do servidor.

**O que fazer:** leia as mensagens abaixo dos campos ou na lista abaixo do título. Quando nenhum
campo estiver marcado, abra **Detalhes técnicos**: a **Mensagem do servidor** indica a regra, por
exemplo `permissions not allowed for a tenant role: tenants:read`. Corrija o valor e envie de novo.

### Requisição não compreendida {#bad-request}

**O que aconteceu:** o servidor não conseguiu interpretar a requisição (`bad_request`, HTTP 400),
por exemplo porque um valor estava no formato errado.

**O que fazer:** recarregue a página e repita a ação. Se acontecer de novo, relate o problema com o
ID da requisição; normalmente o Studio envia apenas requisições bem formadas.

### Assinatura inválida {#invalid-signature}

**O que aconteceu:** o servidor recusou um webhook do provedor de pagamento porque a assinatura não
conferia (`invalid_signature`, HTTP 400). Só o provedor de pagamento chama esse endpoint; você não
vê este código nas suas próprias ações no Studio.

**O que fazer:** nada no Studio. Um operador verifica se o segredo do webhook na configuração do
servidor é o mesmo do provedor de pagamento. Veja [Planos e assinaturas](help:plans-subscriptions).

### Faça login {#unauthenticated}

**O que aconteceu:** você não está conectado, ou a sua sessão terminou (`unauthenticated`, HTTP 401).

**Causas típicas:** uma sessão termina após a duração máxima (padrão 12 horas), após um período sem
atividade (padrão 120 minutos), quando você sai, quando você ou um administrador a revoga, quando a
sua conta é desabilitada e (para as suas outras sessões) quando você altera a sua senha. Os tempos
exatos são definidos pelo seu operador.

**O que fazer:** o Studio leva você automaticamente à página de login e, depois, de volta à página
em que você estava. Dados de formulário não salvos são perdidos. Veja [Sessão encerrada](#session-ended).

### Não permitido {#forbidden}

**O que aconteceu:** o servidor conhece você e o item, mas recusa a ação (`forbidden`, HTTP 403).

**Causas típicas:**

- **Falta uma permissão.** A mensagem do servidor diz qual, por exemplo
  `missing permission records:write`. Veja a [referência de permissões](help:permissions-reference)
  para saber o que cada permissão permite e quais funções integradas a têm.
- **O produto está arquivado ou o tenant está suspenso.** Nesse caso, apenas administradores da
  plataforma (acesso total) e leitores da plataforma (acesso de leitura) ainda podem trabalhar nele;
  todos os outros, incluindo chaves de API, recebem `the product or tenant is not active`.
- **O teto de funções.** Você tentou atribuir uma função com permissões que você mesmo não tem, ou
  uma função de proprietário sem ser proprietário. Veja [teto de funções](help:security#role-ceiling).
- **Permissões de chaves de API.** Você tentou dar a uma nova chave uma permissão que você não tem
  (`you cannot grant permissions you do not hold`).
- **Verificação de origem.** O servidor recusou uma requisição porque o Studio roda em um endereço
  em que ele não confia (`cross-origin request refused`) ou porque o token de segurança estava
  ausente (`missing or invalid CSRF token`). Veja
  [O login ou o salvamento falha com Não permitido](#csrf-origin).

**O que fazer:** peça a um proprietário ou administrador do produto ou do tenant que dê a você uma
função com a permissão que falta, ou que reative o produto ou o tenant. O Studio geralmente oculta
os botões de ações que você não pode executar, mas a palavra final é sempre do servidor.

### Faça login novamente {#reauthentication-required}

**O que aconteceu:** a ação só é permitida nos primeiros minutos após o login
(`reauthentication_required`, HTTP 403). Hoje, isso vale para definir uma primeira senha em uma
conta que até agora só entra por login único.

**O que fazer:** escolha **Entrar novamente**. O Studio encerra a sua sessão, abre a página de login
e traz você de volta ao mesmo lugar; repita a ação imediatamente (janela padrão: 5 minutos). Se o
seu operador desativou as primeiras senhas, a ação nunca é possível. Veja [Perfil](help:profile).

### Não encontrado {#not-found}

**O que aconteceu:** o servidor responde como se o item não existisse (`not_found`, HTTP 404).

**Causas típicas:** o item foi excluído, o endereço foi digitado errado ou vem de outra instalação,
ou você não tem relação com o produto ou o tenant. Nesse último caso, o Axentra mostra de propósito
**Não encontrado** em vez de **Não permitido**, para que ninguém descubra quais produtos, tenants ou
contas existem.

Ao adicionar um usuário existente como membro, **Usuário não encontrado** significa que nenhuma
conta _que você consegue ver_ tem esse endereço. Envie um convite em vez disso (veja
[Membros e convites](help:members-invitations)).

**O que fazer:** verifique o endereço, volte para a lista ou peça a alguém com acesso ao produto ou
ao tenant que adicione você.

### Módulo não habilitado {#module-disabled}

**O que aconteceu:** a ação precisa de um módulo do servidor que está desligado (`module_disabled`).

**O que fazer:** peça ao seu operador que habilite o módulo na configuração do servidor. A
[referência de módulos](help:modules-reference) lista o que cada módulo oferece.

### Ação não suportada {#method-not-allowed}

**O que aconteceu:** o servidor não oferece esta ação neste endereço (`method_not_allowed`,
HTTP 405). O Studio só envia requisições que a API do servidor descreve, então provavelmente o
Studio e o servidor têm versões diferentes.

**O que fazer:** recarregue a página. Se acontecer de novo, relate o problema com o ID da
requisição e a versão do servidor mostrada no rodapé da barra lateral.

### Conflito {#conflict}

**O que aconteceu:** a requisição conflita com dados existentes ou com o estado atual do item
(`conflict`, HTTP 409). A mensagem do servidor explica o conflito; o Studio a mostra depois do texto
traduzido.

**Causas típicas e soluções:**

| Mensagem do servidor (exemplos)                                                                               | O que fazer                                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `a tenant with this slug exists in the product`, `a role with this key exists`, `a plan with this key exists` | Escolha outro slug ou outra chave. Slugs e chaves são únicos.                                  |
| `an open invitation for this email exists`                                                                    | Use ou revogue antes o convite em aberto.                                                      |
| `the tenant needs at least one owner`, `the product needs at least one owner`                                 | Dê a função de proprietário a outra pessoa antes de rebaixar ou remover o último proprietário. |
| `the role is assigned 3 times; reassign those members first`                                                  | Passe esses membros para outra função e depois exclua a função.                                |
| `subscriptions use this plan; deactivate it instead`, `the meter has recorded usage; deactivate it instead`   | Desative em vez de excluir.                                                                    |
| `only failed or dead jobs can be retried`, `the job is already succeeded`                                     | O job não está mais em um estado que permita a ação; recarregue.                               |
| `the delivery is already queued or in progress`                                                               | Aguarde a entrega em andamento terminar.                                                       |

### A configuração já foi concluída {#setup-already-completed}

**O que aconteceu:** a configuração inicial foi enviada, embora o servidor já tenha um
administrador da plataforma (`setup_already_completed`, HTTP 409), por exemplo porque alguém a
concluiu nesse meio-tempo em outra aba.

**O que fazer:** entre com a conta de administrador. Veja
[Configuração inicial](help:first-run-setup).

### Endereço de e-mail em uso {#email-taken}

**O que aconteceu:** outra conta já tem este endereço de e-mail (`email_taken`, HTTP 409).
Endereços de e-mail são únicos, sem diferenciar maiúsculas e minúsculas.

**O que fazer:** use outro endereço ou entre com a conta existente. Na configuração inicial isso
acontece quando o login único criou uma conta com o endereço antes do primeiro administrador.

### Já usada para outra requisição {#idempotency-conflict}

Algumas ações (enfileirar um job, publicar um evento, enviar uma notificação, registrar uso) levam
uma _chave de idempotência_, para que um envio repetido não seja executado duas vezes. Se a mesma
chave já foi usada com outros valores, ou por outro chamador, o servidor responde `409`. O Studio
mostra **Já usada para outra requisição** e gera uma nova chave para você ou oferece **Usar nova
chave**. Envie de novo para criar um novo item. Veja o verbete do glossário
[chave de idempotência](help:glossary#idempotency-key).

### Indisponível neste modo {#mode-not-supported}

**O que aconteceu:** o servidor roda em um modo que não oferece a ação (`mode_not_supported`).

**Causas típicas:** criar ou arquivar produtos em um servidor no modo de produto único; alterar o
plano de uma assinatura gerenciada pelo Stripe (ela pertence ao Stripe: altere-a no Stripe, por
exemplo no portal do cliente, e o Stripe atualiza o Axentra); ou abrir a caixa de correio local das
notificações quando o servidor não usa o provedor local de e-mail de teste. A mensagem do servidor
informa o caso.

**O que fazer:** uma assinatura do Stripe se altera no Stripe. Fora isso, nada no Studio; um
operador teria de alterar a configuração do servidor. Veja [Produtos](help:products),
[Planos e assinaturas](help:plans-subscriptions) e
[configuração do servidor](help:server-configuration).

### Provedor de pagamento não configurado {#payment-provider-not-configured}

**O que aconteceu:** uma ação de cobrança, como um checkout de um plano pago, precisa de um provedor
de pagamento, e o servidor não tem nenhum configurado (`payment_provider_not_configured`).

**O que fazer:** peça ao seu operador que configure o provedor de cobrança. Veja
[Planos e assinaturas](help:plans-subscriptions).

### Alterado nesse meio-tempo {#precondition-failed}

**O que aconteceu:** você editou um item que outra pessoa salvou depois que você o abriu
(`precondition_failed`, HTTP 412). O Studio envia a versão a partir da qual você começou; o servidor
se recusa a sobrescrever a versão mais nova, para que a alteração de ninguém se perca sem aviso.

**O que fazer:** recarregue o item, confira a alteração da outra pessoa e faça a sua alteração de novo.

### Grande demais {#payload-too-large}

**O que aconteceu:** a requisição ou o arquivo é maior do que o servidor aceita
(`payload_too_large`, HTTP 413).

**Limites típicos:** corpos de requisição de 10 MiB por padrão (definido pelo operador), um registro
com no máximo 256 KiB de JSON e arquivos até o tamanho máximo de arquivo do servidor. A mensagem do
servidor indica o limite, por exemplo `files may be at most 10485760 bytes`. (Payloads de jobs e
dados de eventos, com no máximo 64 KB cada, são recusados com **Verifique os dados informados**.)

**O que fazer:** use um arquivo menor ou menos dados, ou pergunte ao seu operador sobre o limite.
Veja [Arquivos](help:files) e [Registros](help:records).

### Tipo não aceito {#unsupported-media-type}

**O que aconteceu:** o servidor não aceita o tipo de conteúdo (`unsupported_media_type`, HTTP 415).
Na maioria das vezes, um envio de arquivo foi bloqueado: executáveis, HTML, SVG e arquivos de script
são bloqueados pelo tipo, pela extensão do nome do arquivo e pelo conteúdo.

**O que fazer:** envie outro tipo de arquivo, ou compacte o arquivo em um pacote, se o seu produto
permitir. Um produto pode ser configurado para armazenar arquivos bloqueados como anexos inertes em
vez de recusá-los. Veja [Arquivos](help:files).

### Muitas requisições {#rate-limited}

**O que aconteceu:** requisições demais em pouco tempo (`rate_limited`, HTTP 429).

**Causas típicas:** tentativas de login com falha demais para uma conta ou a partir de um endereço
de rede (padrão: 10 tentativas com falha por conta por minuto), ou um limite geral de requisições
que o seu operador ativou.

**O que fazer:** aguarde cerca de um minuto e tente de novo. Se você continuar atingindo o limite ao
entrar, verifique o endereço de e-mail e a senha, ou use o login único, se disponível.

### Cota excedida {#quota-exceeded}

**O que aconteceu:** uma cota ou um limite de plano se esgotou (`quota_exceeded`, HTTP 429), por
exemplo a cota de armazenamento do tenant (bytes ou número de arquivos) ou uma cota de uso.

**O que fazer:** exclua arquivos ou aguarde o próximo período de uso, ou peça a alguém com
`tenants:update` (cota de armazenamento), `usage:manage` (cotas de uso) ou `billing:manage` (planos)
que aumente o limite. Veja [Uso](help:usage) e [Arquivos](help:files).

### Erro no servidor {#internal}

**O que aconteceu:** o servidor, ou um serviço por trás dele, falhou ao tratar a requisição
(`internal`, HTTP 500 ou acima). Por motivos de segurança, o servidor nunca mostra detalhes
internos; o ID da requisição liga o seu relato à entrada de log do servidor. Um `502`, `503` ou
`504` de um proxy reverso à frente do servidor também aparece como **Erro no servidor**.

**O que fazer:** tente de novo depois de um instante. A sua alteração pode não ter sido salva, então
verifique antes de repetir ações destrutivas. Se continuar falhando, relate ao seu operador com o ID
da requisição e o horário.

### A requisição falhou {#error}

**O que aconteceu:** o servidor recusou a requisição com um erro HTTP sem código mais específico
(`error`).

**O que fazer:** confira a **Mensagem do servidor** e o **Status HTTP** em **Detalhes técnicos** e
tente de novo. Se continuar acontecendo, relate o problema com o ID da requisição.

### Servidor inacessível {#network-error}

**O que aconteceu:** o Studio não recebeu resposta nenhuma (`network_error`): a conexão falhou ou
foi interrompida.

**O que fazer:** verifique a sua conexão de rede e a VPN. Se outros sites funcionam, o servidor
Axentra pode estar fora do ar ou reiniciando; verifique a
[Integridade do sistema](help:health-monitoring) assim que ele voltar a responder, ou pergunte ao
seu operador.

### Erro inesperado {#unknown}

**O que aconteceu:** o servidor respondeu com um erro que o Studio não reconhece (`unknown`).

**O que fazer:** tente de novo. Se continuar acontecendo, relate o problema com o ID da requisição,
o **Código de erro** e a **Mensagem do servidor**, em **Detalhes técnicos**.

## Mensagens na inicialização {#startup}

Antes de mostrar qualquer coisa, o Studio carrega as informações do servidor, verifica a versão da
API e depois a sua sessão. Problemas nessa fase ocupam a tela inteira.

### Conectando ao servidor Axentra… {#connecting}

Esta é a tela de inicialização normal. Se ela demorar muito, o servidor está lento para responder ou
inacessível; nesse caso, o Studio mostra [Não foi possível conectar ao Axentra](#api-unreachable).

### Não foi possível conectar ao Axentra {#api-unreachable}

O Studio não conseguiu carregar as informações do servidor (`GET /v1/meta`). Abaixo da explicação,
você vê o título do erro e, se o servidor respondeu, o ID da requisição.

- **Servidor inacessível**: o servidor está fora do ar, reiniciando ou bloqueado pela rede.
- **Erro no servidor** ou **Não encontrado**: o Studio alcança _alguma coisa_, mas não a API do
  Axentra, por exemplo um proxy reverso que não encaminha `/v1`, ou um endereço de API errado no
  arquivo de configuração do Studio (`/config.json`, configuração `apiBaseUrl`).

**O que fazer:** escolha **Tentar novamente**. Se persistir, um operador deve verificar se o servidor
está rodando e se o Studio aponta para o endereço de API certo (veja
[configuração do servidor](help:server-configuration)).

### Versão do servidor incompatível {#incompatible-version}

O Studio e o servidor falam versões diferentes da API do Axentra. A tela mostra a **Versão da API do
servidor**, a **Versão da API exigida**, a versão do **Servidor** e a **Versão do Studio**, além de
um destes motivos:

- **Versão principal diferente**: o Studio e o servidor são de gerações diferentes.
- **Servidor antigo demais**: o servidor é mais antigo do que este Studio exige. Atualize o
  servidor ou use um Studio mais antigo.
- **Versão ilegível**: o servidor informou uma versão que o Studio não consegue interpretar.

**O que fazer:** use uma versão do Studio compatível com a versão da API do servidor, ou atualize o
servidor. O Studio só verifica a versão quando a página carrega: depois de uma atualização do
servidor, recarregue a página.

### Configurar o Axentra {#setup-required}

Um servidor novo ainda não tem administrador da plataforma. Nesse caso, o Studio abre **Configurar o
Axentra** em vez da página de login. Você precisa de um token de configuração de uso único que um
operador imprime no servidor. Veja [Configuração inicial](help:first-run-setup).

### Não foi possível verificar sua sessão {#session-check-failed}

O Studio perguntou ao servidor se você está conectado e recebeu um erro em vez de uma resposta (por
exemplo **Erro no servidor** ou **Servidor inacessível**). Escolha **Tentar novamente**. Isso não é o
mesmo que uma sessão encerrada.

### Sessão encerrada {#session-ended}

Quando qualquer requisição retorna **Faça login**, o Studio abre a página de login com o aviso
**Entre novamente para continuar de onde parou.** Depois de entrar, você volta à mesma página. Veja
[Como entrar](help:signing-in).

### Módulo não habilitado neste servidor {#module-not-enabled}

Você abriu uma área cujo módulo do servidor está desligado. A página indica o ID do módulo que um
operador precisa habilitar (por exemplo `storage` ou `billing`). Na barra lateral, essas áreas levam
o rótulo **Desat.**. Veja a [referência de módulos](help:modules-reference).

### Ainda não disponível no Studio {#not-in-studio}

O módulo está habilitado no servidor, mas esta versão do Studio não tem telas para ele. Use a API
diretamente ou uma versão mais nova do Studio.

### Página não encontrada {#page-not-found}

O endereço não corresponde a nenhuma página do Studio: ele pode ter sido digitado errado, ou o item
foi movido ou excluído. Escolha **Ir para a página inicial**.

### Algo deu errado {#something-went-wrong}

A página não pôde ser exibida, muitas vezes porque uma versão mais nova do Studio foi implantada
enquanto a sua guia estava aberta. Escolha **Recarregar página**. Se o problema continuar, relate-o
com o endereço da página.

## Situações comuns {#situations}

### Uma área aparece como Desat. na barra lateral {#menu-item-off}

O módulo do servidor por trás dela está desligado. A área ainda abre e informa qual módulo
habilitar. Áreas que precisam de um produto (a maioria) só aparecem depois que você escolhe um
produto.

### Falta um botão ou uma guia {#action-missing}

O Studio oculta ações e guias que as suas permissões não permitem, por exemplo **Novo tenant** sem
`tenants:create` ou a guia **Membros** sem `members:read`. Procure a permissão na
[referência de permissões](help:permissions-reference) e peça uma função adequada. Algumas ações
também ficam ocultas por causa do modo do servidor (por exemplo **Novo produto** no modo de produto
único).

### Uma página mostra Não permitido, embora você consiga abri-la {#page-forbidden}

A barra lateral mostra quase todas as áreas (só **Log de auditoria** fica oculto sem uma permissão
de auditoria); se você pode ler os dados de uma área é decidido quando a página carrega. Uma área
sem a permissão de leitura mostra **Não permitido**, com a permissão que falta na mensagem do
servidor.

### O login ou o salvamento falha com Não permitido {#csrf-origin}

Se o login ou todas as alterações falham com **Não permitido** e a mensagem do servidor diz
`cross-origin request refused` ou `missing or invalid CSRF token`, o Studio roda em um endereço em
que o servidor não confia, ou o seu navegador bloqueia o cookie de sessão. Um operador precisa
adicionar o endereço do Studio às origens permitidas do servidor. Quando o Studio e a API rodam em
endereços diferentes, os dois precisam pertencer ao mesmo site (por exemplo `studio.example.com` e
`api.example.com`). Veja [Segurança](help:security#sessions-csrf).

### O login falha {#sign-in-fails}

**Falha ao entrar**, com "O endereço de e-mail ou a senha estão incorretos", aparece tanto para uma
senha errada _quanto_ para um endereço desconhecido; o servidor não revela qual é o caso. Depois de
tentativas demais, você vê [Muitas requisições](#rate-limited). Uma conta desabilitada não consegue
entrar de forma alguma. Veja [Como entrar](help:signing-in).

### Um segredo de exibição única foi perdido {#secret-lost}

Segredos de chaves de API, segredos de assinatura de webhooks e links de convite são exibidos apenas
uma vez e não podem ser mostrados de novo. Rotacione o segredo ou crie um novo convite. Veja
[Chaves de API](help:api-keys), [Webhooks](help:webhooks) e [Membros e convites](help:members-invitations).

### Problemas específicos de recursos {#feature-problems}

Cada artigo de recurso tem a própria seção de solução de problemas, por exemplo para jobs que ficam
pendentes, entregas de webhook que falham, envios de arquivo rejeitados ou convites que não chegam:
[Jobs](help:jobs), [Agendamentos](help:schedules), [Webhooks](help:webhooks), [Arquivos](help:files),
[Notificações](help:notifications), [Planos e assinaturas](help:plans-subscriptions).
