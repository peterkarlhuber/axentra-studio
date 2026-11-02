---
title: Teclado e acessibilidade
summary: Como usar o Studio com o teclado, um leitor de tela, zoom, movimento reduzido e tema claro ou escuro, e quais lacunas são conhecidas.
keywords: acessibilidade, a11y, teclado, atalhos, tab, foco, leitor de tela, NVDA, JAWS, VoiceOver, zoom, ampliação, contraste, modo escuro, modo claro, tema, movimento reduzido, WCAG
---

O Studio foi projetado para atender à WCAG 2.1 nível AA. Todas as funções funcionam com o teclado, a
estrutura das páginas é anunciada corretamente pelos leitores de tela, e o Studio segue as
configurações do seu sistema para esquema de cores e movimento. Cada versão é verificada
automaticamente com o mecanismo de acessibilidade axe-core em todas as páginas, nos temas claro e
escuro, em uma tela de desktop e em uma tela de celular com 360 pixels de largura.

## Uso do teclado {#keyboard}

| Tecla                                      | O que faz                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Tab** / **Shift+Tab**                    | Vai para o controle seguinte ou anterior.                                           |
| **Tab** logo após o carregamento da página | Alcança primeiro **Pular para o conteúdo principal**; **Enter** pula a navegação.   |
| **Enter**                                  | Segue um link, pressiona um botão, envia um formulário.                             |
| **Espaço**                                 | Pressiona um botão, marca uma caixa de seleção, alterna uma chave.                  |
| **Teclas de seta**                         | Movem dentro de menus, listas de seleção e guias; **Enter** ou **Espaço** escolhe.  |
| **Escape**                                 | Fecha um diálogo, uma gaveta, um menu, uma dica de informação ou a navegação móvel. |
| **F8**                                     | Pula para a área de notificações (as mensagens no canto da tela).                   |
| **Enter** em um campo **Tipos de evento**  | Adiciona à lista o tipo de evento digitado.                                         |

Bom saber:

- **Os diálogos mantêm o foco dentro deles** enquanto estão abertos e o devolvem ao botão que os
  abriu quando fecham.
- **Diálogos de segredos de exibição única não fecham com Escape.** Os segredos de chaves de API e
  de webhooks são exibidos apenas uma vez, então o diálogo fica aberto até você confirmar **Guardei o
  segredo em local seguro**. Isso evita perder um segredo por acidente.
- **Ações perigosas** pedem confirmação; algumas, como revogar uma chave de API, também pedem que
  você digite um nome (**Digite … para confirmar**). Isso protege contra teclas pressionadas por
  engano.
- **Dicas de informação** (os pequenos botões (i) ao lado dos rótulos) abrem com **Enter** ou
  **Espaço** e fecham com **Escape**. Elas funcionam com teclado, toque e leitores de tela, não
  apenas ao passar o mouse.
- **Tabelas** com muitas colunas rolam dentro da própria área rotulada. Coloque o foco na área com
  **Tab** e role-a com as teclas de seta.

## Foco {#focus}

O controle que tem o foco do teclado sempre mostra um anel visível (violeta, com contraste de pelo
menos 3:1 em relação ao fundo). Depois que você abre outra página, o Studio move o foco para o
título principal da página, para que você comece pelo novo conteúdo e os leitores de tela anunciem
a nova página.

## Leitores de tela {#screen-readers}

- **Landmarks:** cada página tem um cabeçalho, a navegação principal e o conteúdo principal, além de
  exatamente um título principal.
- **Breadcrumbs** e a **Navegação principal** são rotulados. As áreas da barra lateral de módulos
  desligados são anunciadas como “módulo não habilitado”.
- **Formulários:** todo campo tem um rótulo visível; campos obrigatórios são anunciados; mensagens
  de erro são associadas ao campo correspondente.
- **Tabelas** têm legendas e cabeçalhos de coluna, e colunas ordenáveis anunciam a direção da
  ordenação. A contagem “Exibindo N itens” é anunciada quando mais linhas são carregadas.
- **Mensagens de status** (copiado para a área de transferência, carregando, notificações) são
  anunciadas por regiões dinâmicas. Notificações de erro são anunciadas imediatamente.
- **Gráficos** têm um resumo em texto, e **Mostrar tabela de dados** exibe os mesmos valores em uma
  tabela.
- **Pré-visualizações de e-mail** são exibidas em um quadro isolado (sandbox); o conteúdo de texto
  pode ser lido normalmente.

## Zoom e tamanho do texto {#zoom}

Você pode aplicar zoom de até 200 % no navegador sem perder conteúdo nem funções. Em janelas
estreitas (e com zoom aplicado), o layout se adapta:

| Largura da janela | Layout                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| 1200 px ou mais   | Barra lateral completa, páginas com várias colunas                                                    |
| De 960 a 1199 px  | Barra lateral completa ou recolhida                                                                   |
| Abaixo de 960 px  | A barra lateral vira uma gaveta aberta com **Abrir navegação**                                        |
| Abaixo de 640 px  | Colunas menos importantes das tabelas ficam ocultas, e as ações da página passam para baixo do título |

Botões padrão têm pelo menos 36 pixels de altura e botões grandes, 44 pixels; alguns botões
compactos em tabelas e barras de ferramentas são menores. No desktop, você pode recolher a barra
lateral para ícones com **Recolher barra lateral**; o Studio lembra essa escolha por navegador.

## Movimento reduzido {#reduced-motion}

Se o seu sistema operacional pede aos apps que reduzam o movimento, o Studio desliga as animações e
transições (por exemplo, de diálogos, menus e indicadores de carregamento).

## Tema claro, escuro e do sistema {#themes}

Abra o menu do usuário (o seu nome na barra superior) e escolha **Tema**: **Claro**, **Escuro** ou
**Sistema** (segue o seu sistema operacional). Os dois temas são verificados quanto a contraste
suficiente. A sua escolha é salva no navegador e no seu perfil; um navegador em que você ainda não
escolheu um tema adota o do seu perfil depois que você entra.

## Idioma {#language}

Escolha o idioma no menu do usuário, em **Idioma**, ou na página de login. Enquanto você está
conectado, a escolha é salva no seu perfil. Datas, horários e números seguem o idioma selecionado.
Alguns textos vêm do servidor e continuam em inglês, por exemplo as descrições das funções e
permissões integradas e a **Mensagem do servidor** nos detalhes de erro.

## Lacunas conhecidas {#known-gaps}

- **As verificações automáticas cobrem a primeira visualização de cada página.** Diálogos, menus,
  gavetas, notificações e erros de formulário abertos são verificados apenas em algumas áreas.
- **Apenas o Chromium é testado automaticamente.** Firefox e Safari (WebKit) não são cobertos pelos
  testes automatizados.
- **O modo de alto contraste do Windows** (cores forçadas) não é testado especificamente.
- **Os gráficos são orientados ao ponteiro.** Passar o mouse mostra detalhes de pontos individuais;
  usuários de teclado e de leitores de tela obtêm os mesmos valores por meio de **Mostrar tabela de
  dados**.
- **Textos do servidor**, como descrições de permissões e mensagens do servidor, estão apenas em
  inglês.

Se você encontrar uma barreira, relate-a ao seu operador com o endereço da página e os passos que
levaram até ela.

## Solução de problemas {#troubleshooting}

| Situação                              | O que fazer                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| O anel de foco não está visível       | Use **Tab** (o anel aparece com o foco do teclado, não com cliques do mouse). Verifique se nenhuma extensão do navegador sobrescreve os estilos da página.                     |
| Um diálogo não fecha com Escape       | Ele mostra um segredo de exibição única. Copie-o e guarde-o; depois, confirme **Guardei o segredo em local seguro**.                                                           |
| As animações continuam                | Ative “reduzir movimento” nas configurações de acessibilidade do seu sistema operacional e recarregue o Studio.                                                                |
| O tema volta ao anterior              | O armazenamento do navegador pode estar bloqueado (por exemplo, no modo privado), então a escolha não é lembrada localmente; o Studio então volta ao tema salvo no seu perfil. |
| O conteúdo fica cortado com zoom alto | Tabelas largas rolam dentro da própria área; coloque o foco nela com **Tab** e use as teclas de seta.                                                                          |
