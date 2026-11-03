---
title: Pesquisa
summary: Pesquisar no índice de texto completo de um tenant, filtrar os resultados por tipo, ver um documento indexado e remover do índice uma entrada errada.
keywords: pesquisa, pesquisar, buscar, texto completo, índice, documento indexado, tipo, ID de referência, destaque, frase, excluir, search:query, search:index
---

A tela **Pesquisa** pesquisa no índice de texto completo que o seu produto mantém para cada tenant.
O produto coloca nesse índice o texto pesquisável dos seus próprios objetos (uma fatura, um contato,
um ticket); no Studio você pode consultá-lo do mesmo jeito que os seus usuários, verificar o que está
indexado e remover uma entrada que não deveria estar lá.

O índice é uma _cópia_: o seu produto o grava e continua sendo a fonte da verdade. O Axentra não lê
sozinho registros, arquivos ou as tabelas do seu produto; por isso um objeto só aparece na pesquisa
depois que o produto o indexou.

> [!IMPORTANT]
> A tela exige o módulo do servidor `search`. Pesquisar exige `search:query` no tenant; remover um
> documento do índice exige `search:index` (veja [Quem pode fazer o quê](#permissions)).

## Quem pode fazer o quê {#permissions}

| Função                                                  | Pesquisar (`search:query`) | Remover do índice (`search:index`) |
| ------------------------------------------------------- | -------------------------- | ---------------------------------- |
| Tenant **Owner**, **Admin**                             | sim                        | sim                                |
| Tenant **Member**, **Viewer**                           | sim                        | não                                |
| **Product owner**, **Product admin** (todos os tenants) | sim                        | sim                                |
| **Support**, **Product viewer** (todos os tenants)      | sim                        | não                                |
| **Administrador da plataforma**                         | sim                        | sim                                |
| **Leitor da plataforma**                                | sim                        | não                                |

Por padrão, membros não podem gravar no índice, porque cada entrada é mostrada a todos que podem
pesquisar no tenant. Uma função própria pode conceder as duas permissões; veja
[Funções e permissões](help:roles-permissions).

## Pesquisar em um tenant {#query}

1. Abra **Dados e armazenamento** › **Pesquisa** ([abrir a tela](app:search)).
2. Escolha um **Tenant**. Cada tenant tem o seu próprio índice; não há pesquisa entre tenants.
3. Em **Pesquisar por**, digite a sua pesquisa e escolha **Pesquisar** (ou pressione Enter).

| Você digita        | A pesquisa encontra                                        |
| ------------------ | ---------------------------------------------------------- |
| `invoice acme`     | documentos que contêm as duas palavras (em qualquer ordem) |
| `"late payment"`   | documentos que contêm exatamente esta frase                |
| `invoice or offer` | documentos que contêm pelo menos uma das palavras          |
| `invoice -draft`   | documentos com `invoice` que não contêm `draft`            |

A pesquisa encontra palavras inteiras e não diferencia maiúsculas de minúsculas. Ela não encontra
partes de palavras (`inv` não encontra `invoice`) e não corrige a ortografia. Se `invoices` também
encontra `invoice` depende do idioma com que o servidor indexa (veja [Bom saber](#limits)).

A pesquisa e o tenant fazem parte do endereço, então você pode salvar uma pesquisa nos favoritos ou
enviar o link para alguém que tenha acesso ao mesmo tenant.

### Filtrar por tipo {#kinds}

Cada documento indexado tem um **tipo** escolhido pelo seu produto, por exemplo `invoice` ou `note`.
Em **Tipos**, digite um ou mais tipos separados por vírgulas para ver só esses. Os tipos usam letras
minúsculas, dígitos, pontos, hífens e sublinhados e começam com uma letra; no máximo 20 de cada vez.
Deixe o campo vazio para pesquisar em todos os tipos.

## Ler os resultados {#results}

Os resultados são ordenados por relevância: correspondências no título contam mais do que no texto,
mais correspondências contam mais e, entre resultados iguais, o atualizado mais recentemente vem
primeiro. Cada resultado mostra:

- o **título** com as palavras encontradas destacadas (ou o ID de referência, se o documento não
  tiver título),
- o **tipo** e o **ID de referência**, que é o ID do objeto no seu produto,
- quando o documento foi **atualizado** pela última vez no índice,
- até dois trechos curtos do texto com as correspondências destacadas.

Primeiro aparecem vinte resultados; **Carregar mais** busca os próximos. O contador abaixo da lista
diz quantos são exibidos e se há mais disponíveis.

> [!NOTE]
> Os resultados não são um retrato fixo. Se o produto alterar o índice enquanto você navega pelas
> páginas, um documento pode mudar de lugar e aparecer duas vezes ou nenhuma. Paginar muito fundo
> (além da posição 1000, por padrão) é recusado; refine a pesquisa em vez disso.

## Ver um documento indexado {#document}

Escolha o título de um resultado. Um painel lateral mostra o que o índice guarda dele: **Tipo**,
**ID de referência**, **ID do documento** (`sdoc_…`), **Versão** (aumenta a cada nova indexação),
**Idioma**, quem o indexou (**Indexado por**, **Indexado por último por**) e quando, o **Texto**
completo e os **Metadados** que o seu produto gravou com ele. Os metadados são exibidos, mas não
pesquisados.

## Remover um documento do índice {#remove}

Se um documento não deve aparecer na pesquisa (por exemplo, foi indexado por engano ou pertence a um
objeto excluído), você pode removê-lo:

1. Abra o documento a partir dos resultados.
2. Escolha **Remover do índice** e confirme.

> [!WARNING]
> Isso remove apenas a entrada do índice. O objeto original no seu produto não muda, e o produto
> adiciona a entrada de novo na próxima vez que indexar esse objeto. Para remover algo de vez, exclua
> ou altere o objeto no seu produto.

## Como os documentos chegam ao índice {#index}

O seu produto indexa os seus objetos pela API (`PUT …/search/documents/{kind}/{ref_id}` com
`search:index`), normalmente logo depois de salvar um objeto ou em um [job](help:jobs) que tenta de
novo. Indexar de novo o mesmo tipo e ID de referência substitui o documento. O Studio não adiciona
documentos sozinho. Quem indexou um documento fica registrado nele e, a menos que o servidor
desative isso, no [log de auditoria](help:audit) (`search.document.upsert`,
`search.document.delete`), sem o texto.

## Bom saber {#limits}

| Item              | Regra                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Escopo            | Um tenant por vez. Todos com `search:query` no tenant veem cada documento desse tenant.                           |
| Texto da pesquisa | De 1 a 500 caracteres. Uma pesquisa só com pontuação ou palavras muito comuns não encontra nada.                  |
| Tipos             | `^[a-z][a-z0-9_.-]{0,62}$`, no máximo 20 por pesquisa                                                             |
| Correspondência   | Palavras inteiras; sem prefixo, busca aproximada ou insensibilidade a acentos (`café` não encontra `cafe`)        |
| Idioma            | Um por instalação (configuração do servidor `search.language`, padrão `simple`: sem radicais nem palavras vazias) |
| Paginação         | 20 por página no Studio, no máximo até a posição `search.max_offset` (padrão 1000)                                |

## Solução de problemas {#troubleshooting}

### Nenhum resultado {#no-results}

Confira a ortografia, use palavras inteiras e menos palavras e remova o filtro de tipos. Se o objeto
deveria estar lá, o seu produto (ainda) não o indexou para este tenant: o índice contém apenas o que
o produto coloca nele.

### Outras mensagens {#messages}

**Você não pode pesquisar neste tenant.** A sua função neste tenant não inclui `search:query`. Peça
a um owner ou admin do tenant.

**A pesquisa aparece como "módulo não habilitado".** O servidor roda sem o módulo `search`. Veja
[Módulos](help:modules-reference#search-realtime).

**Verifique os dados informados.** A pesquisa tem mais de 500 caracteres, um tipo não é válido ou
você paginou além do que o servidor permite. Encurte ou refine a pesquisa.

**Não encontrado** ao abrir um documento. O produto o removeu do índice depois que os resultados
foram carregados. Pesquise de novo.

**Remover do índice não aparece.** A sua função não inclui `search:index` neste tenant.
