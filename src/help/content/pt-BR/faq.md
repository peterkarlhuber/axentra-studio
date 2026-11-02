---
title: Perguntas frequentes
summary: Respostas curtas às perguntas mais comuns sobre o Studio, com links para os detalhes.
keywords: FAQ, perguntas frequentes, dúvidas, como faço, por que, ajuda, respostas, perguntas comuns
---

Respostas curtas a perguntas comuns. Cada resposta leva ao artigo com os detalhes.

## Posso criar contas de usuário no Studio? {#create-users}

Não. As contas são criadas na [configuração inicial](help:first-run-setup), quando alguém aceita um
convite, ou no primeiro login por login único. No Studio, você convida pessoas para um tenant ou
adiciona contas existentes como membros. Veja [Membros e convites](help:members-invitations).

## Como tornar alguém operador de um produto? {#add-operator}

O Axentra não tem convites no nível do produto. A pessoa precisa de uma conta que você consiga ver:
primeiro convide-a para um dos tenants do produto; depois que ela aceitar, adicione-a na página do
produto, em **Membros**. Um administrador da plataforma pode adicionar qualquer conta existente
diretamente. Veja [Produtos](help:products).

## Qual a diferença entre uma função de produto e uma função de tenant? {#product-vs-tenant-role}

Uma função de tenant (por exemplo **Member**) vale apenas naquele tenant. Uma função de produto (por
exemplo **Product admin**) vale para o produto como um todo _e_ para todos os tenants dele. Dê
funções de produto apenas a quem precisa desse alcance. Veja
[Funções e permissões](help:roles-permissions).

## Qual a diferença entre Owner e Admin de um tenant? {#owner-vs-admin}

Eles têm as mesmas permissões. Apenas um **Owner** (ou alguém com autoridade no produto ou na
plataforma) pode tornar alguém proprietário, ou alterar ou remover um proprietário. Todo tenant
mantém pelo menos um proprietário. Veja [teto de funções](help:security#role-ceiling).

## Por que não consigo escolher algumas funções? {#roles-greyed-out}

O Studio marca as funções que você não pode atribuir com **"… (acima das suas permissões)"**: elas
contêm permissões que você mesmo não tem, ou são uma função de proprietário e você não é
proprietário. Ninguém pode distribuir mais direitos do que tem. Veja
[teto de funções](help:security#role-ceiling).

## Perdi o segredo de uma chave de API. Posso vê-lo de novo? {#lost-secret}

Não. Os segredos são exibidos exatamente uma vez, e o servidor guarda apenas um hash. Use
**Rotacionar segredo** para obter um novo; um período de carência mantém o segredo antigo
funcionando enquanto você atualiza os seus serviços. Veja [Chaves de API](help:api-keys).

## O que acontece com os dados quando suspendo um tenant? {#suspend-data}

Nada é excluído. Os membros e as chaves de API perdem o acesso até o tenant ser reativado;
administradores da plataforma ainda podem inspecioná-lo. Proprietários e administradores do produto podem
reativá-lo na página do tenant no Studio. Já excluir um tenant remove o tenant e
todos os dados dele e não pode ser desfeito. Veja [Tenants](help:tenants).

## Por que vejo "Não encontrado" para algo que existe? {#not-found-exists}

Se você não tem relação com um produto ou tenant, o Axentra responde exatamente como se ele não
existisse, para que ninguém descubra quais produtos, tenants ou contas há. Peça a alguém com acesso
que adicione você. Veja [Não encontrado](help:troubleshooting#not-found).

## Por que uma área da barra lateral está marcada como "Desat."? {#area-off}

O módulo do servidor por trás dela está desligado. Um operador pode habilitá-lo na configuração do
servidor. Veja a [referência de módulos](help:modules-reference).

## Por que falta um botão para mim? {#button-missing}

O Studio oculta ações que as suas permissões não permitem, e algumas ações dependem do modo do
servidor (por exemplo, **Novo produto** só existe no modo de vários produtos). Procure a permissão
na [referência de permissões](help:permissions-reference).

## Por que a minha sessão foi encerrada? {#signed-out}

As sessões terminam após a duração máxima, após um período de inatividade, quando são revogadas,
quando a sua conta é desabilitada e quando a sua senha foi alterada em outra sessão. Entre novamente;
o Studio leva você de volta à página em que estava. Veja [Segurança](help:security#sessions).

## Posso pagar ou guardar um cartão de crédito no Studio? {#payment}

Não. O Studio nunca pede dados de cartão ou bancários. Planos pagos passam pela página de checkout
hospedada do provedor de pagamento. Veja [Planos e assinaturas](help:plans-subscriptions).

## Posso editar registros no Studio? {#edit-records}

Sim, com a permissão `records:write` no tenant. Salvar substitui o objeto JSON inteiro do registro.
Veja [Registros](help:records).

## Por que os horários dos agendamentos parecem diferentes do que eu informei? {#utc}

Os agendamentos rodam em UTC (sem horário de verão). O Studio mostra a próxima e a última execução
no seu próprio fuso horário. Veja [Agendamentos](help:schedules).

## Onde altero a configuração do servidor? {#server-config}

Não no Studio. A página **Configurações** mostra a configuração efetiva; as alterações são feitas no
servidor por um operador. Veja [Configurações](help:settings) e
[configuração do servidor](help:server-configuration).

## Por que alguns textos estão em inglês quando uso outro idioma? {#english-texts}

As descrições das funções e permissões integradas e a **Mensagem do servidor** nos detalhes de erro
vêm do servidor e estão sempre em inglês. Todo o resto do Studio é traduzido.

## Como relato um problema? {#report-problem}

Abra **Detalhes técnicos** na mensagem de erro e copie o **ID da requisição** (`req_…`). Envie-o ao
seu operador junto com o horário e o que você fez. Veja
[o ID da requisição](help:troubleshooting#request-id).

## O Studio funciona no celular? {#mobile}

Sim. Em telas estreitas, a barra lateral vira uma gaveta atrás de **Abrir navegação**, e as colunas
menos importantes das tabelas ficam ocultas. Veja
[Teclado e acessibilidade](help:keyboard-accessibility#zoom).

## Posso usar o Studio só com o teclado ou com um leitor de tela? {#accessibility}

Sim. Todas as funções funcionam com o teclado, e o Studio foi projetado para atender à WCAG 2.1 AA.
Veja [Teclado e acessibilidade](help:keyboard-accessibility).
