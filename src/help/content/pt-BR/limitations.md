---
title: Limitações conhecidas
summary: O que o Studio e o servidor Axentra ainda não fazem, ou fazem com uma restrição conhecida, e como contornar.
keywords: limitações, problemas conhecidos, não suportado, recurso ausente, restrições, solução alternativa, contorno, roadmap, não é possível
---

Esta página lista as restrições que você pode notar ao trabalhar com esta versão do Studio e do
servidor Axentra, cada uma com uma solução alternativa, quando existe. Algumas vêm do Studio, outras
do servidor; às vezes a API do servidor oferece mais do que o Studio.

## Usuários e login {#users-sign-in}

- **O Studio cria apenas contas de login único.** As contas vêm da configuração inicial, do aceite
  de um convite, do primeiro login por login único ou de um administrador da plataforma que adiciona
  um [usuário de login único](help:users#external-user). Não há formulário para contas com senha: em
  vez disso, convide as pessoas para um tenant.
- **Sem autenticação de dois fatores** no próprio Axentra. Se você usa login único, o seu provedor
  de identidade pode exigi-la. A redefinição de senha e a verificação de e-mail precisam do módulo
  `notify`, que envia os links.
- **Os provedores de login único só são configurados na configuração do servidor.** O Studio não
  pode listar, adicionar nem desativar provedores de identidade.
- **Contas sem endereço de e-mail** (possíveis em algumas configurações de login único) não podem
  aceitar convites, porque os convites são vinculados a um endereço. Adicione-as diretamente aos
  tenants.
- **Sem exportação nem eliminação dos dados de uma pessoa.** As solicitações de proteção de dados
  precisam ser tratadas pelo operador em usuários, registros, backups e logs.
- **O bloqueio de tentativas de login é por minuto.** Qualquer pessoa que conheça um endereço de
  e-mail pode bloquear os logins por senha dessa conta por até um minuto enviando senhas erradas;
  sessões já abertas e o login único não são afetados.

## Funções, permissões e chaves de API {#access}

- **O Studio só consegue mostrar quais funções você pode atribuir se você puder ler funções**
  (`roles:read`). Sem isso, o campo de função é texto simples, e o servidor explica uma eventual
  recusa. Uma alteração de função feita enquanto uma página está aberta só é percebida quando o
  Studio recarregar as suas permissões, ou depois que você recarregar a página.
- **As permissões próprias de um produto não podem ser declaradas no Studio.** A página
  **Permissões** é somente leitura; os produtos as declaram no código ou pela API.
- **Salvar uma função personalizada descarta as permissões de produto aposentadas** que ainda estão
  listadas nela. Elas não tinham efeito enquanto aposentadas, mas teriam voltado se o produto as
  declarasse de novo.
- **Chaves de API criadas por uma pessoa não são revogadas quando essa pessoa sai.** Revise-as e
  revogue-as você mesmo.
- **A confirmação de revogação não lista as chaves derivadas.** Revogar uma chave também revoga
  todas as chaves criadas com ela, mas o Studio não mostra quais são.

## Dados e arquivos {#data-files}

- **Sem contagens totais.** As listas mostram “Exibindo N itens” e carregam mais sob demanda; a API
  não tem números de página nem totais, por design.
- **Registros:** filtros apenas em valores JSON de primeiro nível, ordenação apenas por ID, data de
  criação ou de atualização. Salvar um registro substitui o objeto JSON inteiro. Um registro tem no
  máximo 256 KiB.
- **A pesquisa de texto completo** ([Pesquisa](help:search)) abrange um tenant por vez e só encontra
  palavras inteiras (sem prefixo nem busca aproximada). O Studio não adiciona documentos ao índice; quem faz isso é o seu produto.
- **Backups e armazenamento de arquivos:** o Studio não mostra o status dos backups, e o
  procedimento de backup do servidor cobre o banco de dados; o armazenamento de arquivos precisa de
  backup separado.

## Jobs, eventos e webhooks {#events}

- **Enfileirar job só é oferecido com `jobs:manage`.** Alguns tipos de job também podem ser
  enfileirados por usuários de tenant, mas a API não diz quais, então o Studio não os oferece.
- **A visualização de eventos ao vivo faz polling.** Novos eventos aparecem com um pequeno atraso,
  não instantaneamente; não há WebSockets.
- **A próxima execução de um agendamento é calculada pelo servidor quando você salva**; o Studio
  verifica a sintaxe cron enquanto você digita, mas não pré-visualiza a próxima execução de uma
  expressão não salva. Os agendamentos rodam em UTC.

## Uso e cobrança {#usage-billing}

- **As reservas só podem ser consultadas pelo ID.** A API não tem uma lista de reservas.
- **Nenhum dado de cartão ou bancário no Studio**, por design. Planos pagos passam pelo checkout
  hospedado do provedor de pagamento.
- **Os provedores de pagamento não foram testados com serviços reais** nesta versão; eles são
  testados apenas com provedores simulados.

## Notificações {#notifications}

- **Somente e-mail e a caixa de entrada do app.** Não há canais de SMS ou push, e o editor de
  modelos do Studio cria apenas modelos de e-mail (modelos de caixa de entrada são criados pela
  API).
- **O envio é limitado por tenant**: por padrão, 1000 notificações em qualquer hora móvel
  (`notify.tenant_send_limit_per_hour`); as demais são recusadas com **Muitas requisições**.

## O Studio e o servidor {#studio-server}

- **A versão do servidor só é verificada quando o Studio carrega.** Depois de uma atualização do
  servidor, recarregue a página. A lista de módulos habilitados também só é lida no carregamento.
- **Endereços separados para o Studio e a API** só funcionam se os dois pertencerem ao mesmo site
  (por exemplo `studio.example.com` e `api.example.com`). A configuração recomendada e testada serve
  os dois a partir do mesmo endereço.
- **Servidores de produto único com produtos remanescentes:** se um servidor no modo de produto
  único ainda contém outros produtos, o Studio oculta o seletor de produtos. Administradores da
  plataforma só alcançam os outros produtos pela página **Produtos** e não podem arquivá-los ali.
- **As configurações do servidor não podem ser alteradas no Studio.** A página **Configurações**
  apenas mostra a configuração efetiva; as alterações são feitas no servidor.
- **O limite geral de taxa de requisições vem desligado por padrão** e é contado por processo do
  servidor.

## Navegadores, idiomas e acessibilidade {#browsers-languages}

- **Apenas navegadores baseados em Chromium são testados automaticamente.** Firefox e Safari devem
  funcionar, mas não são cobertos pelos testes automatizados.
- **Os textos do servidor estão em inglês**: as descrições de funções e permissões e a **Mensagem do
  servidor** nos detalhes de erro não são traduzidas.
- **As verificações de acessibilidade cobrem a primeira visualização de cada página**; diálogos,
  menus e erros de formulário abertos são verificados apenas em algumas áreas. Veja
  [Teclado e acessibilidade](help:keyboard-accessibility#known-gaps).

## Operação {#operations}

- **Nenhuma implantação em produção e nenhum teste de carga** foram realizados para esta versão;
  ainda não há números de capacidade.
- **As migrações de banco de dados só avançam.** Voltar a uma versão anterior significa restaurar
  um backup.

## Páginas relacionadas {#related}

- [Solução de problemas](help:troubleshooting) para mensagens de erro e soluções.
- [Perguntas frequentes](help:faq) para dúvidas comuns.
- [Referência de módulos](help:modules-reference) para entender o que significa um módulo desligado.
