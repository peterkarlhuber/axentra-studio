---
title: Como se orientar no Studio
summary: O layout do Studio, a barra lateral, o seletor de produto, o menu do usuário, o painel e a ajuda integrada.
keywords: interface, layout, navegação, barra lateral, menu, gaveta, celular, smartphone, trilha de navegação, breadcrumbs, seletor de produto, menu do usuário, idioma, tema, modo escuro, modo claro, painel, dashboard, ajuda, dica, pesquisa, busca, teclado
---

Este artigo mostra como o Studio está organizado, para que você encontre qualquer tela
rapidamente. Ele aborda a navegação, a troca de produto, configurações pessoais como idioma e tema,
o painel e a ajuda integrada em cada tela.

## O layout {#layout}

Depois que você entra, o Studio abre o painel do produto que você usou por último, ou a lista de
produtos se você ainda não tiver nenhum. Toda tela tem três partes:

- **Barra lateral** (à esquerda): a navegação, agrupada por área.
- **Barra superior**: à esquerda, a **trilha de navegação** (o caminho até a página atual, com cada
  etapa clicável); à direita, o **seletor de produto**, o botão de ajuda e o **menu do usuário**.
- **Área de conteúdo**: o título da página com uma descrição de uma linha, a ação principal da
  página à direita (por exemplo **Novo tenant**) e, abaixo, filtros, tabelas, cartões e guias.

## A barra lateral {#sidebar}

A barra lateral lista as áreas nesta ordem:

| Grupo                         | Itens                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| (topo)                        | **Painel**, **Produtos**                                            |
| **Identidade e tenants**      | **Tenants**, **Usuários**, **Convites**                             |
| **Acesso e chaves de API**    | **Funções**, **Permissões**, **Chaves de API**                      |
| **Dados e armazenamento**     | **Visão geral dos dados**, **Registros**, **Arquivos**              |
| **Eventos e jobs**            | **Jobs**, **Agendamentos**, **Eventos**, **Webhooks**               |
| **Uso e cobrança**            | **Uso**, **Planos**, **Assinaturas**                                |
| (avulso)                      | **Notificações**                                                    |
| **Auditoria e monitoramento** | **Log de auditoria**, **Integridade do sistema**, **Monitoramento** |
| (base)                        | **Configurações**, **Central de ajuda**                             |

Os itens que pertencem a um produto (de **Painel** até **Notificações**, exceto **Produtos**) só
aparecem quando um produto está selecionado. **Produtos**, **Log de auditoria**,
**Integridade do sistema**, **Monitoramento** e **Configurações** valem para toda a plataforma.

A barra lateral mostra os mesmos itens para todos, com uma exceção: **Log de auditoria** só aparece
se você pode ler eventos de auditoria (`audit:read` em um dos seus produtos, ou `platform:audit`).
**Configurações**, **Integridade do sistema** e **Monitoramento** aparecem sempre, porque oferecem
algo a todos (suas preferências, as verificações públicas de integridade); as partes que você não
pode ler informam isso ali. Se você abrir uma página para a qual não tem permissão, por exemplo por
um link salvo, a página informa isso (**Não permitido**), e as ações que você não pode executar
não são oferecidas.

### Itens marcados como “Desat.” {#module-off}

Um item cujo módulo do servidor não está habilitado continua visível e mostra **Desat.**. Ao
abri-lo, aparece **Módulo não habilitado neste servidor** com o ID do módulo (por exemplo
`storage`) que o operador do servidor precisa habilitar. Assim você vê o que existe e o que está
faltando. Veja [módulos](help:concepts#modules).

### Recolher a barra lateral {#collapse-sidebar}

Na parte de baixo da barra lateral, **Recolher barra lateral** a reduz a ícones; **Expandir barra
lateral** traz os rótulos de volta. Na barra lateral recolhida, passe o mouse sobre um ícone ou
coloque o foco nele para ver o nome. O Studio memoriza a escolha neste navegador. A versão do
servidor aparece na parte de baixo da barra lateral expandida.

### Em celulares e telas pequenas {#mobile}

O Studio funciona a partir de 360 pixels de largura. Em telas estreitas, a barra lateral vira uma
gaveta: abra-a com **Abrir navegação** (o botão de menu no canto superior esquerdo). Ela fecha
quando você escolhe uma página, com **Fechar navegação** ou com Escape. Tabelas largas rolam dentro
da própria área, e colunas menos importantes podem ficar ocultas.

## Trocar de produto {#product-switcher}

A maioria das áreas pertence a um produto; o endereço então contém `/p/<product id>/`. O **seletor
de produto** na barra superior mostra o produto atual (**Produto** e o nome dele).

1. Selecione o seletor de produto.
2. Escolha outro produto na lista ou **Todos os produtos** para abrir a lista de produtos.

O Studio permanece na mesma área quando você troca: se você está vendo os tenants do produto A,
chega aos tenants do produto B. O Studio memoriza o último produto por navegador. Produtos
arquivados não aparecem no seletor; abra-os em **Produtos**.

Em páginas da plataforma inteira (por exemplo **Log de auditoria** ou **Configurações**), o seletor
pode mostrar **Nenhum produto selecionado**.

No **modo de produto único** não há menu: a barra superior mostra um rótulo fixo **Produto** com o
nome do único produto do servidor. Veja
[modo de produto único e multiproduto](help:concepts#single-multi-product).

## Trilha de navegação {#breadcrumbs}

A trilha de navegação mostra onde você está, por exemplo _Tenants › ten_01EXAMPLE_. Escolha uma
etapa anterior para voltar um nível.

## O menu do usuário {#user-menu}

Abra o menu do usuário pelas suas iniciais e seu nome no canto superior direito. Ele contém:

| Item       | O que faz                                                                  |
| ---------- | -------------------------------------------------------------------------- |
| **Perfil** | Sua conta: nome, senha, sessões ativas. Veja [perfil](help:profile).       |
| **Idioma** | O idioma da interface. Veja [abaixo](help:interface#language).             |
| **Tema**   | **Claro**, **Escuro** ou **Sistema**. Veja [abaixo](help:interface#theme). |
| **Sair**   | Encerra sua sessão. Veja [entrar e sair](help:signing-in#sign-out).        |

### Idioma {#language}

Escolha **Idioma** no menu do usuário e selecione um idioma. A alteração vale imediatamente. Ela é
salva neste navegador e na sua conta, então acompanha você em outros navegadores. Você também pode
alterá-lo em **Configurações** ou, antes de entrar, na página de login. Sem uma escolha sua, o Studio
segue o idioma do navegador. Datas, horas e números são formatados conforme o idioma escolhido.

> [!NOTE]
> Alguns textos vêm do servidor e estão sempre em inglês: os nomes e as descrições das funções
> integradas (por exemplo “Product admin”, “Owner”), as descrições do catálogo de permissões e a
> mensagem do servidor nos detalhes técnicos de um erro.

### Tema {#theme}

Escolha **Tema** no menu do usuário: **Claro**, **Escuro** ou **Sistema** (segue o sistema
operacional). Assim como o idioma, o tema é salvo neste navegador e na sua conta.

## O painel {#dashboard}

O **Painel** é a página inicial de um produto. Ele mostra:

- **Contadores**: **Tenants**, **Usuários**, **Chaves de API**, **Eventos de auditoria (24 h)**,
  **Registros** e **Requisições negadas (24 h)**. Cada contador leva à página correspondente; a dica
  (i) dele diz exatamente o que é contado. Se o servidor não informar contadores, você vê “O
  servidor não informou contadores para este produto.”
- Cartões de **uso e cobrança**, quando esses módulos estão habilitados e você pode lê-los.
- **Integridade do sistema**: o resultado da verificação de prontidão do servidor, com
  **Detalhes**.
- **Servidor**: **Versão do servidor**, **Versão da API**, **Ambiente**, **Modo**, **ID do
  produto** e os **Módulos** com o estado de cada um (verde: habilitado, cinza: não habilitado).

Ações rápidas no canto superior direito: **Novo tenant** (com `tenants:create`, módulo `tenancy`) e
**Nova chave de API** (com `api_keys:manage`).

| Contador                        | O que é contado                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Tenants**                     | Todos os tenants do produto, ativos e suspensos.                                                 |
| **Usuários**                    | Membros de tenants e operadores de produto, cada pessoa uma vez.                                 |
| **Chaves de API**               | Chaves não revogadas, incluindo as expiradas.                                                    |
| **Registros**                   | Registros em todas as coleções e tenants.                                                        |
| **Eventos de auditoria (24 h)** | Eventos de auditoria deste produto nas últimas 24 horas.                                         |
| **Requisições negadas (24 h)**  | Tentativas recusadas nas últimas 24 horas; abre o log de auditoria filtrado por eventos negados. |

> [!TIP]
> O cartão **Servidor** responde à pergunta de suporte mais comum: “Qual versão está rodando, e o
> módulo está mesmo habilitado?”

## Listas e formulários {#lists-forms}

- **Listas** carregam página por página: abaixo de uma tabela, **Carregar mais** busca os próximos
  itens, e **Todos os itens carregados** marca o fim. Não há números de página.
- **Diálogos de criação** acrescentam `?new=1` ao endereço, para que o diálogo sobreviva a um
  recarregamento e o botão Voltar do navegador o feche.
- **Slugs** (nomes curtos, adequados para URLs) são derivados do nome até você editar o slug.
- **Salvar alterações** só fica ativo quando algo foi alterado.
- **Ações destrutivas** pedem confirmação; excluir um tenant pede que você digite o slug dele.
- **Segredos** (chaves de API, tokens de convite) são mostrados uma única vez. Um diálogo de segredo
  não pode ser fechado com Escape nem clicando fora dele; confirme antes que você guardou o segredo.

## Ajuda no Studio {#help-center}

A **Central de ajuda** contém todos os artigos, tutoriais e páginas de referência. Abra-a pela barra
lateral (**Central de ajuda**), pelo botão de ajuda (?) na barra superior (**Ajuda e
documentação**) ou pelo link nas páginas de login e de configuração; ela funciona sem login.

- **Pesquisar**: digite na caixa de pesquisa (“Pesquise na ajuda, por exemplo ‘chave de API’”). O
  Studio pesquisa todos os artigos no seu idioma, e cada resultado abre a seção correspondente.
- **Comece aqui**: os artigos para novos usuários.
- **Artigos** têm um sumário (**Nesta página**), **Anterior** e **Próximo**, **Tópicos
  relacionados** e um botão para copiar um link para o artigo. Os links funcionam em todos os
  idiomas, e trocar o idioma mantém o artigo aberto.

### Ajuda em cada tela {#contextual-help}

- **Ajuda da página**: o botão (?) ao lado do título de uma página (**Ajuda para esta página**) abre
  o artigo daquela página em um painel lateral. Você não perde o lugar, e um formulário que você
  está preenchendo continua como está. Links dentro do painel abrem outros artigos (**Voltar**
  retorna), **Abrir na central de ajuda** mostra o artigo completo e **Fechar ajuda** fecha o
  painel.
- **Dicas de informação**: o botão (i) ao lado de um campo, uma coluna ou um status explica
  efeitos, padrões e limites. Ele abre com clique, toque, Enter ou Espaço e fecha com Escape.
  **Saiba mais** na dica abre o artigo relacionado no painel lateral.
- Links **Saiba mais** em mensagens, páginas vazias e diálogos de confirmação levam à seção que
  explica a situação.

## Noções básicas de teclado {#keyboard}

Tudo no Studio funciona com o teclado:

| Tecla                  | Efeito                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| Tab / Shift+Tab        | Próximo / anterior controle. O foco está sempre visível.                                      |
| Tab logo após carregar | Alcança **Pular para o conteúdo principal**; Enter pula a navegação.                          |
| Enter / Espaço         | Aciona botões, links, caixas de seleção, chaves e dicas de informação.                        |
| Teclas de seta         | Movem-se em menus, listas e entre guias.                                                      |
| Escape                 | Fecha um menu, diálogo, dica de informação ou a navegação móvel (não os diálogos de segredo). |
| F8                     | Pula para a área de notificações (mensagens curtas).                                          |

Depois que você abre outra página, o foco vai para o título dela, para que leitores de tela
anunciem a nova página. Mais em [teclado e acessibilidade](help:keyboard-accessibility).

## Solução de problemas {#troubleshooting}

| Situação                                                                      | Causa e solução                                                                                                                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| A barra lateral mostra apenas alguns itens                                    | Nenhum produto está selecionado. Escolha um com o seletor de produto ou em **Produtos**.                                                             |
| Um item mostra **Desat.**                                                     | O módulo do servidor não está habilitado. Fale com o operador; veja [módulos](help:concepts#modules).                                                |
| Uma página diz **Não permitido**                                              | Suas funções não incluem a permissão. Veja [funções e permissões](help:roles-permissions).                                                           |
| **Ainda não disponível no Studio**                                            | O servidor tem o módulo, mas esta versão do Studio não tem telas para ele. Use a API ou um Studio mais novo.                                         |
| O seletor de produto não lista um produto                                     | O produto está arquivado ou você não tem função nele. Abra **Produtos**.                                                                             |
| Idioma ou tema diferem entre navegadores                                      | Uma escolha feita em um navegador fica memorizada nele e prevalece sobre a salva na sua conta. Escolha novamente no menu do usuário desse navegador. |
| Depois de uma atualização do servidor, o Studio se comporta de forma estranha | Recarregue a página; o Studio só verifica a versão do servidor ao carregar.                                                                          |
