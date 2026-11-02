---
title: Registros
summary: Navegue, filtre, crie, edite e exclua os registros JSON que os tenants armazenam em coleções, e resolva conflitos de “alterado nesse meio-tempo”.
keywords: registros, dados, JSON, documentos, coleção, entradas, linhas, banco de dados, filtro, versão, conflito, 412, If-Match, concorrência otimista
---

_Registros_ são pequenos objetos JSON que a sua aplicação armazena pela API do Axentra, por
exemplo pedidos, anotações ou configurações, sem precisar de uma tabela própria no banco de dados.
Cada registro pertence a exatamente um tenant e a uma _coleção_ (um grupo nomeado como `orders`). A
tela **Registros** permite examinar esses dados, encontrar registros pelo conteúdo e, com permissão
de escrita, corrigir ou adicionar registros manualmente.

> [!IMPORTANT]
> A tela exige o módulo do servidor `data`. Ler exige `records:read` no tenant; criar, alterar e
> excluir exige `records:write`. As funções de tenant **Owner**, **Admin** e **Member** concedem as
> duas; **Viewer** apenas lê. As funções de produto **Product owner** e **Product admin** podem
> gravar em todos os tenants; **Support** e **Product viewer** leem em todos os tenants. A lista de
> todas as coleções exige `collections:read` (somente funções de produto). Veja
> [Funções e permissões](help:roles-permissions).

## Coleções e registros {#collections}

- Uma **coleção** é criada ao gravar o primeiro registro nela e desaparece quando o último registro
  dela é excluído. Não há nada a configurar. Os nomes usam letras minúsculas, dígitos e
  sublinhados, começam com uma letra e têm no máximo 63 caracteres (`orders`, `support_notes`).
- Um **registro** tem um **ID** (`rec_…`), seus **Dados** (um objeto JSON), uma **Versão** (começa
  em 1 e aumenta a cada alteração), as datas **Criado em**/**Atualizado em** e o usuário ou a chave
  de API que o criou e o alterou por último (**Criado por**, **Atualizado por**).
- O mesmo nome de coleção em dois tenants contém dois conjuntos separados de registros. O Studio
  sempre mostra um tenant por vez; o servidor garante a separação.

## Navegar pelos registros {#browse}

1. Abra **Dados e armazenamento** › **Registros** ([abrir a tela](app:records)).
2. Escolha um **Tenant** no topo.
3. Escolha uma coleção na lista **Coleções** à esquerda. O número ao lado dela conta os registros
   dela em todos os tenants.

A tabela mostra **ID**, uma prévia resumida dos **Dados**, **Versão**, **Criado em** e
**Atualizado em**, do mais novo para o mais antigo, 50 por página; **Carregar mais** busca a
próxima página. Selecione o ícone de olho (**Ver registro …**) para abrir o registro com todos os
campos e o JSON completo e formatado.

> [!TIP]
> Na página de um tenant, **Ver registros** abre esta tela com o tenant já selecionado. Na
> [Visão geral dos dados](help:data-overview#collections), selecionar uma coleção a abre aqui.

Se você não tiver uma função de produto, o Studio não consegue listar as coleções do produto. Nesse
caso, informe o nome da coleção em **Nome da coleção** e escolha **Abrir**.

### Ordenar {#sort}

Selecione os cabeçalhos de coluna **ID**, **Criado em** ou **Atualizado em** para ordenar;
selecione de novo para inverter. Não é possível ordenar por **Dados**.

## Filtrar pelo conteúdo {#filter}

1. Em **Campo**, informe o nome de um campo de primeiro nível do JSON, por exemplo `status`.
2. Em **Igual a**, informe o valor, por exemplo `open`.
3. Escolha **Adicionar filtro**. O filtro aparece como um chip; o **×** em um chip o remove.

Vários filtros precisam corresponder todos. Os valores são lidos como JSON quando possível:
`true`, `42`, `null`, `"42"` ou `{"city": "Graz"}` correspondem com o respectivo tipo; qualquer
outra coisa (`open`) corresponde como texto. Assim, `total` = `12` encontra `{"total": 12}`, mas
não `{"total": "12"}`.

Um filtro é uma verificação de _contenção_: um valor de objeto corresponde quando o campo do
registro contém pelo menos essas chaves. `address` = `{"city": "Graz"}` encontra
`{"address": {"city": "Graz", "zip": "8010"}}`. Os nomes de campo só podem conter letras, dígitos e
sublinhados; por isso, filtre campos aninhados por meio de um valor de objeto, como mostrado.

## Criar um registro {#create}

1. Escolha o tenant (e, se quiser, a coleção).
2. Escolha **Novo registro**.
3. Em **Coleção**, mantenha ou informe o nome da coleção. Um nome novo cria a coleção.
4. Em **Dados**, informe um objeto JSON, por exemplo:

   ```json
   { "status": "open", "total": 12, "customer": { "name": "Acme" } }
   ```

5. Escolha **Criar registro**. O Studio passa para a coleção do registro.

O ID, a versão e as datas são definidos pelo servidor; não os coloque nos dados.

## Editar um registro {#edit}

1. Abra o registro (ícone de olho) e escolha **Editar**.
2. Altere o JSON em **Dados** e escolha **Salvar alterações**.

Salvar **substitui o objeto inteiro**: campos que você remove do JSON são removidos do registro. A
coleção não pode ser alterada; para mover um registro, crie-o na outra coleção e exclua o antigo.

### Versões e conflitos {#versions}

O Studio informa ao servidor qual versão você editou (HTTP `If-Match`). Se outra pessoa ou a sua
aplicação alterou ou excluiu o registro depois que você o abriu, o servidor recusa a alteração com
**Alterado nesse meio-tempo** (HTTP 412) em vez de sobrescrever silenciosamente a outra alteração.
Isso também vale para a exclusão.

Para resolver: feche o diálogo, recarregue a lista, abra o registro de novo, aplique sua alteração
aos dados atuais e salve.

## Excluir um registro {#delete}

1. Abra o registro e escolha **Excluir registro**.
2. Confirme com **Excluir registro**.

> [!CAUTION]
> A exclusão é permanente; não há lixeira. O log de auditoria registra que o registro foi excluído
> (`data.record.delete`), mas não os dados dele.

## Configurações e limites {#limits}

| Item              | Regra                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Nome da coleção   | `^[a-z][a-z0-9_]{0,62}$`: minúsculas, dígitos, sublinhados, começa com uma letra, no máximo 63 caracteres |
| Dados             | Um objeto JSON (não um array nem um valor simples), no máximo 256 KiB serializado                         |
| Campo de filtro   | Letras, dígitos, sublinhado, começando com uma letra ou um sublinhado, no máximo 63 caracteres            |
| Ordenação         | `id`, `created_at`, `updated_at`, crescente ou decrescente                                                |
| Tamanho da página | 50 no Studio; a API aceita um `limit`                                                                     |

## Para desenvolvedores {#api}

O Studio usa a mesma API que a sua aplicação.
`C = /v1/products/{product_id}/tenants/{tenant_id}/records/{collection}`:

| Método e caminho                            | Permissão          | Finalidade                                   |
| ------------------------------------------- | ------------------ | -------------------------------------------- |
| `GET /v1/products/{product_id}/collections` | `collections:read` | Coleções com contagens                       |
| `GET C?where=&sort=&limit=&cursor=`         | `records:read`     | Listar; `where` é um objeto JSON (contenção) |
| `GET C/{record_id}`                         | `records:read`     | Um registro; o `ETag` é a versão             |
| `POST C` (corpo: o objeto de dados)         | `records:write`    | Criar (201)                                  |
| `PUT C/{record_id}`, `If-Match`             | `records:write`    | Substituir os dados                          |
| `DELETE C/{record_id}`, `If-Match`          | `records:write`    | Excluir (204)                                |

```http
PUT /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/records/orders/rec_01EXAMPLE
If-Match: "3"
Content-Type: application/json

{"status": "shipped", "total": 12}
```

Sem `If-Match`, o servidor sobrescreve incondicionalmente. Toda criação, substituição e exclusão
grava um evento de auditoria (`data.record.create`, `data.record.replace`, `data.record.delete`)
com a coleção e a versão, nunca os dados. Para dados relacionais com muitas linhas ou junções, os
produtos usam tabelas próprias em vez de registros; veja
[noções básicas da API](help:api-basics).

## Solução de problemas {#troubleshooting}

**Alterado nesse meio-tempo.** Alguém alterou ou excluiu o registro depois que você o abriu.
Recarregue, abra o registro de novo e repita sua alteração. Veja
[Versões e conflitos](#versions).

**Verifique os dados informados** ao salvar. O nome da coleção ou os dados não atendem aos
[limites](#limits). O Studio já verifica o nome e se os dados são um objeto JSON; a mensagem do
servidor indica o problema.

**Grande demais.** Os dados do registro ultrapassam 256 KiB. Armazene conteúdo grande como
[arquivo](help:files) e mantenha apenas o ID do arquivo no registro.

**Verifique os dados informados** ao filtrar: um nome de campo contém um ponto ou outros caracteres
não permitidos. Filtre valores aninhados com um valor de objeto (veja
[Filtrar pelo conteúdo](#filter)).

**A lista Coleções mostra um erro ou “Não permitido”.** Listar coleções exige `collections:read`,
que só as funções de produto têm. Informe o nome da coleção em **Nome da coleção**.

**Novo registro, Editar e Excluir registro não aparecem.** Sua função não concede `records:write`
neste tenant ou ainda não há um tenant selecionado.

**Não encontrado.** O registro foi excluído, o tenant está suspenso (somente administradores da
plataforma alcançam tenants suspensos) ou você não tem acesso a este tenant.

**Nenhum registro corresponde.** Remova os filtros um a um. Lembre-se de que `12` e `"12"` são
valores diferentes.
