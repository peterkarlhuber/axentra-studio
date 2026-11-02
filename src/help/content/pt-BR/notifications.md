---
title: Notificações
summary: Escreva modelos de e-mail em vários idiomas, pré-visualize e teste, acompanhe a entrega no log de mensagens e defina suas próprias preferências de notificação.
keywords: notificação, e-mail, email, correio, modelo, template, mensagem, caixa de saída, entrega, SMTP, pré-visualização, envio de teste, caixa de correio, cancelar recebimento, descadastrar, preferências, idioma, tradução
---

O Axentra envia e-mails a partir de **Modelos**. Um modelo tem uma chave, uma categoria e uma
**variante** por idioma, com assunto, corpo de texto e um corpo HTML opcional. O seu produto (ou o
próprio Axentra, no caso de convites) envia um modelo a um destinatário com valores para os
placeholders; o Axentra renderiza o modelo, guarda a mensagem em uma caixa de saída e a entrega em
segundo plano. No Studio, você escreve e pré-visualiza modelos, envia mensagens de teste, verifica o
status da entrega e escolhe quais notificações você mesmo recebe.

> [!IMPORTANT]
> A tela **Notificações** precisa do módulo `notify` no servidor; sem ele, o item não aparece na
> navegação (e os convites não enviam e-mail). Modelos, log de mensagens, caixa de correio e
> estatísticas exigem a permissão de produto `notify:manage`. Enviar um teste também exige
> `notify:send` no tenant. Todos que pertencem ao produto podem definir as próprias preferências.

## A tela Notificações {#overview}

Abra [Notificações](app:notifications). Com `notify:manage`, você vê **Estatísticas de entrega** e
as guias **Modelos**, **Log de mensagens**, **Caixa de correio** e **Minhas preferências**. Sem
essa permissão, você vê apenas **Minhas preferências**.

**Estatísticas de entrega** contam as mensagens deste produto por status, no total e nas **Últimas
24 horas**, e mostram o **Provedor de entrega**, as **Tentativas de entrega (24 h)** e a **Mensagem
mais antiga na fila**. O cartão é atualizado a cada 30 segundos. Uma mensagem antiga na fila
geralmente significa que nenhum dispatcher está em execução (veja
[Solução de problemas](help:notifications#troubleshooting)).

## Modelos {#templates}

A guia **Modelos** lista os seus modelos e os padrões **Integrado**, com categoria, idiomas e versão.
Selos:

- **Integrado**: um padrão que vem com o Axentra (atualmente `invitation`, em inglês e alemão).
  Abra-o e salve para criar a sua própria versão com a mesma chave, que substitui o padrão neste
  produto. Excluir a sua versão restaura o padrão.
- **Sensível**: o conteúdo das mensagens enviadas nunca é exibido e é apagado assim que a mensagem
  é enviada.
- **Somente sistema**: o próprio Axentra envia este modelo (o e-mail de convite com o link de
  aceite de uso único). Você pode alterar o conteúdo, mas ele não pode ser enviado manualmente nem
  como teste.

### Criar um modelo {#create-template}

1. Escolha **Novo modelo**.
2. Em **Geral**, informe a **Chave do modelo**, por exemplo `welcome`. O seu produto envia o modelo
   por essa chave; ela não pode ser alterada depois.
3. Opcional: **Nome** e **Descrição** para o Studio.
4. Informe a **Categoria**, por exemplo `onboarding` (veja [Categorias](help:notifications#categories)).
5. Ative **Sensível** para conteúdos como links ou códigos de uso único.
6. Em **Variáveis e valores de exemplo**, declare cada placeholder e informe um valor de exemplo
   para a pré-visualização (veja [Placeholders](help:notifications#placeholders)).
7. Em **Conteúdo por idioma**, preencha **Assunto** e **Texto** para `en` e, opcionalmente, **HTML**.
8. Adicione mais idiomas (veja [Idiomas](help:notifications#locale-variants)).
9. Escolha **Criar modelo**.

Cada salvamento posterior aumenta a versão (**Salvar nova versão**). Versões antigas não são
guardadas: o log de mensagens armazena o conteúdo renderizado e o número da versão de cada
mensagem, não o modelo antigo.

### Configurações do modelo {#template-settings}

| Configuração            | O que faz                                                                    | Valores permitidos / padrão                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Chave do modelo**     | Identificador usado no envio                                                 | De 2 a 63 caracteres: letras minúsculas, dígitos, `_`, `.` e `-`, começando com uma letra; não pode ser alterada |
| **Categoria**           | Agrupa modelos para o cancelamento de recebimento                            | De 2 a 41 letras minúsculas, dígitos e `_`, começando com uma letra; padrão `transactional`                      |
| **Canal**               | Canal de entrega                                                             | Somente **E-mail**                                                                                               |
| **Sensível**            | O conteúdo das mensagens enviadas nunca é retornado e é apagado após o envio | Desligado                                                                                                        |
| **Variáveis**           | Placeholders que o modelo pode usar                                          | No máximo 50; letras, dígitos e `_`, sem começar com dígito                                                      |
| **Conteúdo por idioma** | Assunto, texto e HTML opcional por idioma                                    | De 1 a 20 idiomas; `en` é obrigatório                                                                            |

### Placeholders {#placeholders}

Escreva os placeholders como `{{ name }}` no assunto, no texto ou no HTML. Apenas placeholders
simples são aceitos: sem condições, laços, filtros ou expressões, e qualquer outra coisa que comece
com `{{` é recusada ao salvar. Todo placeholder precisa ser declarado como variável; se o texto usar
placeholders não declarados, o Studio oferece **Declarar placeholders usados**.

No envio de uma mensagem, todo placeholder precisa de um valor (string, número ou true/false, com no
máximo 10 000 caracteres). Os valores são inseridos como estão no corpo de texto; no corpo HTML,
recebem escape de HTML. Assuntos nunca contêm quebras de linha.

> [!WARNING]
> Um valor usado dentro de um link (`href`) controla o destino do link. Mantenha os links no modelo
> ou deixe o seu backend montá-los; não permita que usuários finais os forneçam.

### Categorias {#categories}

Os destinatários podem cancelar o recebimento de categorias nas preferências. `transactional` e
`security` são sempre entregues e não podem ter o recebimento cancelado. Use-as apenas para
mensagens que o usuário precisa receber, como redefinições de senha ou recibos. O Studio sugere
`transactional`, `security`, `onboarding` e `product`; você pode informar qualquer categoria válida.

### Idiomas e fallback {#locale-variants}

Cada idioma é uma **variante**. Para adicionar uma, digite um código de idioma como `pt-br` ou `de`
em **Adicionar idioma** e escolha **Adicionar**; **Remover idioma …** remove a variante. O inglês
(`en`) é obrigatório.

O Axentra escolhe a variante nesta ordem: o idioma solicitado (por exemplo `pt-br`), depois o idioma
base (`pt`) e depois `en`. O idioma solicitado é o escolhido no envio; se não houver, o idioma do
usuário destinatário; se não houver, (para convites) o idioma padrão do produto; caso contrário,
inglês.

## Pré-visualização {#preview}

A **Pré-visualização** ao lado do editor é renderizada pelo servidor a partir do estado atual, não
salvo, com os seus valores de exemplo, um instante depois que você para de digitar. Escolha o idioma
no seletor da pré-visualização; "Renderizada no idioma …" informa qual variante foi usada. A
pré-visualização aparece quando todos os idiomas têm assunto e texto.

O HTML é exibido em um quadro isolado: scripts nunca são executados, e imagens, fontes e estilos
remotos não são carregados. Os programas de e-mail dos destinatários podem exibir a mensagem de
forma diferente.

## Enviar um teste {#send-test}

**Enviar teste** (no editor, ou pelo ícone de envio na lista de modelos) envia uma notificação
**real**:

1. Escolha o **Tenant**. A mensagem pertence a esse tenant; você precisa de `notify:send` nele.
2. Escolha o destinatário:
   - **Um membro do tenant**: escolha o **Membro**. O idioma dele é usado, a menos que você escolha outro.
   - **Um endereço de e-mail**: somente com a permissão de produto `notify:send_external`
     (proprietários e administradores do produto). Sem ela, o Studio explica que você só pode
     enviar para membros.
3. Opcional: escolha um **Idioma**; sem escolha, é usado o idioma do destinatário ou, na falta dele,
   o inglês.
4. Ajuste os **Valores** (preenchidos com os valores de exemplo).
5. Opcional: **Pré-visualização** mostra o resultado com esses valores. Depois, escolha **Enviar**.

O Studio confirma **Notificação aceita** com o ID e o status da mensagem. A entrega acontece de
forma assíncrona; acompanhe-a no **Log de mensagens**. Cada diálogo envia com a própria chave de
idempotência, então um clique repetido após um erro de rede não envia duas vezes.

Se o destinatário cancelou o recebimento da categoria do modelo, a mensagem é aceita com o status
**Suprimida** e não é entregue.

## Log de mensagens {#message-log}

O **Log de mensagens** é a caixa de saída: todas as notificações do produto com horário, modelo
(chave, versão e idioma), **Destinatário**, **Status**, **Tentativas** e **Último erro**. Filtre por
**Status**, **Chave do modelo**, **Destinatário** e **Tenant** e escolha **Aplicar**; **Redefinir
filtros** limpa os filtros. O ícone de detalhes abre todos os campos e, quando disponível, o
conteúdo.

| Status        | Significado                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| **Na fila**   | Aguardando o dispatcher; **Próxima tentativa** mostra quando                                             |
| **Enviando**  | Um dispatcher está entregando a mensagem                                                                 |
| **Enviada**   | O provedor aceitou a mensagem                                                                            |
| **Falhou**    | Erro permanente, ou todas as tentativas esgotadas                                                        |
| **Suprimida** | Não enviada: o destinatário cancelou o recebimento da categoria, ou o usuário não tem endereço de e-mail |

Uma entrega com falha é repetida automaticamente com intervalos crescentes, por padrão até 5
tentativas. **Tentar entrega novamente** devolve uma mensagem **Falhou** à fila com novas
tentativas. Isso não é possível depois que o conteúdo foi apagado pela retenção; nesse caso, envie
a notificação de novo.

O conteúdo pode estar ausente: modelos sensíveis nunca o exibem, a retenção o apaga (por padrão 30
dias após a entrega) e mensagens suprimidas não guardam nenhum. O Studio informa qual é o caso. O
servidor remove tokens, chaves e senhas do último erro.

> [!NOTE]
> A entrega é do tipo "pelo menos uma vez": após uma falha grave, uma mensagem pode ser entregue
> duas vezes. As mensagens têm um Message-ID estável, para que os servidores de e-mail reconheçam
> duplicatas. A ordem das mensagens não é garantida.

## Caixa de correio {#mailbox}

A **Caixa de correio** só existe quando o servidor usa o provedor local de desenvolvimento
(`notify.provider = "local"`). Esse provedor não envia nada; ele guarda aqui o que "entregou", para
que você possa conferir modelos em servidores de desenvolvimento e teste. Filtre por
**Destinatário** e abra uma mensagem para vê-la como foi entregue.

Com um provedor real (SMTP), a guia mostra **Nenhuma caixa de correio local neste servidor**: as
mensagens vão para destinatários reais, e você as acompanha no **Log de mensagens**.

## Minhas preferências {#preferences}

Em **Minhas preferências**, você escolhe quais categorias recebe deste produto:

1. Em **Aplica-se a**, escolha **O produto inteiro** ou um tenant.
2. Em **Receber estas categorias**, desmarque as categorias que você não quer. Categorias bloqueadas
   (`transactional`, `security`) são sempre entregues.
3. Escolha **Salvar preferências**.

As preferências valem para mensagens enviadas a partir de agora, para você como usuário e para o
seu endereço de e-mail. Uma categoria que você desativa para o produto inteiro continua desativada
em todos os tenants; uma configuração de tenant pode desativar mais categorias, mas não reativá-las.
As categorias aparecem quando o produto tem modelos nelas. Definir preferências para um tenant
exige `notify:preferences` nele (membros e administradores têm essa permissão).

## Para administradores e desenvolvedores {#developers}

- **Envio a partir do seu produto**: `POST /v1/products/{product_id}/tenants/{tenant_id}/notify/send`
  com `template_key`, `to` (`{"user_id": …}` ou `{"email": …}`), `variables` e `locale` opcional,
  além de um cabeçalho `Idempotency-Key`. Exige `notify:send` no tenant; endereços livres fora dos
  membros do tenant também exigem `notify:send_external`. Veja [Noções básicas da API](help:api-basics).
- **Dispatcher**: as mensagens só são entregues enquanto um dispatcher está em execução
  (`axentra notify-dispatch --loop` ou um worker). Sem ele, as mensagens ficam **Na fila**.
- **Provedores e configurações** (`[notify]`): `provider` (`local` ou `smtp`), `sender`, host, porta,
  credenciais e STARTTLS do SMTP, `max_attempts` (padrão 5), backoff, `content_retention_days`
  (padrão 30) e `message_retention_days` (padrão 180). Veja
  [Configuração do servidor](help:server-configuration).
- **Privacidade**: assuntos e corpos são criptografados em repouso. Os endereços dos destinatários
  são dados pessoais e ficam visíveis para quem tem `notify:manage`; eles são excluídos junto com a
  mensagem após a retenção de mensagens.
- **Convites**: quando um convite de tenant é criado, o Axentra envia o modelo `invitation` com o
  link de aceite. Veja [Membros e convites](help:members-invitations).

## Bom saber {#good-to-know}

- Somente e-mail: sem SMS ou push, sem anexos, sem endereço de remetente por produto.
- Sem link de descadastro nem cabeçalho `List-Unsubscribe`; o cancelamento de recebimento funciona
  apenas pelas preferências e apenas para endereços que pertencem a usuários.
- Ainda não há limite de taxa de envio por tenant.
- Veja [Limitações conhecidas](help:limitations).

## Solução de problemas {#troubleshooting}

| O que você vê                                                               | Por quê                                                                                                           | O que fazer                                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Apenas **Minhas preferências**                                              | Você não tem `notify:manage`                                                                                      | Peça a um administrador do produto, se você precisar dos modelos                                                          |
| **Verifique os dados informados** ao salvar                                 | Chave ou categoria inválida, placeholder não declarado, sintaxe `{{ … }}` não suportada ou falta da variante `en` | Leia a mensagem do servidor; corrija o campo ou placeholder indicado                                                      |
| A pré-visualização diz que falta um valor                                   | Uma variável declarada não tem valor de exemplo                                                                   | Preencha o **Valor de exemplo**                                                                                           |
| **Conflito** "a template with this key exists"                              | As chaves são únicas por produto                                                                                  | Escolha outra chave ou edite o modelo existente                                                                           |
| **Alterado nesse meio-tempo**                                               | Outra pessoa salvou o modelo                                                                                      | Recarregue; as suas edições não salvas são perdidas, então copie-as antes                                                 |
| Nenhum ícone de envio para um modelo                                        | Ele é **Somente sistema**, ou você não tem `notify:send`                                                          | Esperado para convites; peça uma função com `notify:send`                                                                 |
| "Você não tem a permissão notify:send neste tenant"                         | Sua função não abrange esse tenant                                                                                | Escolha outro tenant ou peça uma função                                                                                   |
| **Não permitido** ao enviar para um endereço                                | O endereço não é de um membro e você não tem `notify:send_external`                                               | Envie para um membro ou peça a um proprietário do produto                                                                 |
| **Não encontrado** para um membro                                           | O usuário não é membro do tenant                                                                                  | Escolha um membro do tenant selecionado                                                                                   |
| As mensagens ficam **Na fila**; **Mensagem mais antiga na fila** só aumenta | Nenhum dispatcher está em execução                                                                                | Peça ao operador que execute `axentra notify-dispatch --loop` ou um worker                                                |
| As mensagens terminam como **Falhou**                                       | O SMTP recusou a mensagem ou está inacessível                                                                     | Leia o **Último erro**; peça ao operador que verifique as configurações de SMTP e depois use **Tentar entrega novamente** |
| **Conflito** em **Tentar entrega novamente**                                | A mensagem não está com falha, ou o conteúdo dela foi apagado                                                     | Envie a notificação de novo                                                                                               |
| **Suprimida**                                                               | O destinatário cancelou o recebimento da categoria, ou não tem endereço de e-mail                                 | Use `transactional` apenas para mensagens que os usuários precisam receber                                                |
| **Nenhuma caixa de correio local neste servidor**                           | O servidor usa SMTP                                                                                               | Use o **Log de mensagens**                                                                                                |
