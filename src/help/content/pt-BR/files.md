---
title: Arquivos
summary: Envie, encontre, baixe, compartilhe e exclua os arquivos de um tenant, e gerencie a cota de armazenamento, os limites de tamanho e a política de tipos de conteúdo.
keywords: arquivos, enviar, upload, baixar, download, anexos, documentos, armazenamento, cota, espaço em disco, tamanho do arquivo, tipo de conteúdo, tipo MIME, link de download, link de compartilhamento, URL assinada, URL pré-assinada, S3, rótulos, metadados, expiração, inerte, tipos bloqueados
---

A tela **Arquivos** mostra os arquivos que um tenant armazenou pelo módulo de armazenamento do
Axentra: documentos, imagens, exportações ou qualquer outro anexo que a sua aplicação envie. Você
pode enviar arquivos manualmente, encontrá-los por nome, tipo ou rótulo, baixá-los, criar um link
de download temporário, renomeá-los e excluí-los. A tela também mostra quanto da cota de
armazenamento o tenant está usando.

Um arquivo sempre pertence a exatamente um tenant. O conteúdo dele não pode ser alterado depois do
envio; para substituir um arquivo, envie um novo e exclua o antigo. O nome e os rótulos podem ser
alterados.

> [!IMPORTANT]
> A tela exige o módulo do servidor `storage`. Ver e baixar exige `files:read` no tenant; enviar,
> editar e excluir exige `files:write`. As funções de tenant **Owner**, **Admin** e **Member**
> concedem as duas; **Viewer** apenas lê. Funções de produto: **Product owner** e
> **Product admin** podem gravar em todos os tenants; **Support** e **Product viewer** leem.
> Alterar a cota de um tenant exige `tenants:update` (**Product owner**, **Product admin**). Veja
> [Funções e permissões](help:roles-permissions).

## Navegar pelos arquivos de um tenant {#browse}

1. Abra **Dados e armazenamento** › **Arquivos** ([abrir a tela](app:files)).
2. Escolha um **Tenant**.

A página mostra o **Uso de armazenamento** do tenant e a lista **Arquivos armazenados**, do mais
novo para o mais antigo, 50 por página. Somente arquivos ativos e não expirados aparecem.
Selecione os cabeçalhos de coluna **Nome**, **Tamanho** ou **Enviado em** para ordenar. Selecione
o nome de um arquivo para abrir os [detalhes](#details); o menu **…** de cada linha oferece
**Detalhes**, **Baixar** e **Excluir arquivo**.

### Filtrar arquivos {#filter}

| Filtro                                                          | O que encontra                                                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome contém**                                                 | Parte do nome, sem diferenciar maiúsculas e minúsculas.                                                                                        |
| **Tipo de conteúdo**                                            | Um tipo exato (`application/pdf`) ou uma família (`image/*`).                                                                                  |
| **Enviado por**                                                 | O ID do usuário (`usr_…`) ou da chave de API que enviou o arquivo.                                                                             |
| **Rótulo** e **Igual a**, depois **Adicionar filtro de rótulo** | Arquivos cujos rótulos contêm esta chave com este valor. `true`, `42` e `null` correspondem com o respectivo tipo; outros textos, como string. |

Todos os filtros precisam corresponder. Remova um filtro de rótulo com o **×** no chip dele.

## Enviar um arquivo {#upload}

1. Escolha o tenant e selecione **Enviar arquivo**.
2. Em **Arquivo**, escolha o arquivo. O Studio mostra o nome, o tamanho e o tipo dele, além das
   regras que o servidor aplica (tamanho máximo, tipos permitidos e bloqueados).
3. Campos opcionais:
   - **Nome de exibição**: o nome exibido nas listas e usado nos downloads. O padrão é o nome do
     arquivo.
   - **Rótulos (metadados)**: um objeto JSON plano como `{"kind": "invoice", "year": 2026}` (veja
     [Rótulos](#labels)).
   - **Expira em**: depois desse momento, o arquivo fica oculto e é removido mais tarde (veja
     [Expiração](#expiry)).
4. Selecione **Enviar**. Uma barra de progresso mostra a transferência; **Cancelar envio** a
   interrompe.

O servidor verifica tudo de novo, independentemente do que o Studio mostra. Arquivos vazios são
recusados.

### Limite de tamanho {#size-limit}

Cada arquivo pode ter no máximo o **Tamanho máximo de arquivo** do servidor (padrão 50 MiB,
definido pelo operador em `storage.max_file_bytes`). O servidor para de ler assim que um envio
ultrapassa esse valor. O Studio avisa antes do envio se conhecer o limite; ele só o conhece se você
puder ler as configurações do servidor (`platform:settings` ou `product:manage`). Caso contrário, o
diálogo informa que o servidor verifica tamanho, tipo e cota durante o envio.

### Tipos permitidos e bloqueados {#content-types}

Duas regras decidem se um tipo de arquivo é aceito:

- **Tipos bloqueados.** Executáveis, HTML, XHTML, SVG, JavaScript, scripts de shell e PHP e
  arquivos semelhantes são bloqueados, reconhecidos pelo tipo declarado, pela extensão do arquivo e
  pelo conteúdo (também qualquer arquivo que comece com `#!`). Dependendo da política de tipos de
  conteúdo do produto, um arquivo bloqueado é recusado ou armazenado como
  [anexo inerte](#inert). Quem gerencia o produto define a política na guia **Arquivos** do
  produto; veja [Definir a política de tipos de conteúdo](help:data-overview#content-type-policy).
- **Tipos permitidos.** Se o operador configurou uma lista de permissões
  (`storage.allowed_content_types`), somente esses tipos são aceitos, por exemplo
  `image/*, application/pdf`. Sem lista, todos os tipos, exceto os bloqueados, são aceitos.

O tipo informado pelo navegador é apenas uma indicação: o servidor inspeciona os primeiros bytes e
usa o tipo detectado quando o declarado está ausente, é genérico ou claramente errado.

### Anexos inertes {#inert}

Quando a política mantém um arquivo bloqueado em vez de recusá-lo, o arquivo é armazenado como
`application/octet-stream` e marcado como **Armazenado como inerte** nos detalhes, com o tipo com
que foi enviado. Esse arquivo só é baixado como anexo, nunca aberto no navegador. Renomear um
arquivo para uma extensão bloqueada (por exemplo `.html`) segue a mesma política: a alteração é
recusada ou o arquivo se torna inerte.

### Rótulos {#labels}

Rótulos são pares chave/valor seus para encontrar e agrupar arquivos, como `{"kind": "invoice"}`.
Regras: um objeto JSON plano, no máximo 64 chaves; chaves de 1 a 64 caracteres entre letras,
dígitos e `_ . : -`; valores são texto (no máximo 1024 caracteres), números, `true`/`false` ou
`null`; no máximo 8 KiB no total. Não coloque segredos em nomes ou rótulos: eles aparecem no log de
auditoria.

## Cota de armazenamento {#quota}

O cartão **Uso de armazenamento** compara os bytes e a quantidade de arquivos do tenant com a cota
efetiva dele. O medidor passa para uma cor de alerta em 80 % e para uma cor crítica em 95 %. A
linha abaixo diz de onde vem a cota: **Cota definida para este tenant**, **Cota herdada do padrão
do produto ou do servidor** ou **Sem cota: ilimitado**. A forma como os padrões são resolvidos está
explicada na [Visão geral dos dados](help:data-overview#quotas).

Quando uma cota é atingida, novos envios são recusados; os arquivos existentes permanecem.

### Alterar a cota de um tenant {#edit-quota}

1. No cartão **Uso de armazenamento**, selecione **Editar cota**.
2. Informe um **Limite de armazenamento** com a **Unidade** (MiB, GiB, TiB) e/ou um **Limite de
   arquivos**. Deixe um campo vazio para herdar o padrão do produto ou do servidor; `0` bloqueia
   todos os envios.
3. Selecione **Salvar alterações**.

Um limite abaixo do uso atual é permitido: os arquivos existentes permanecem, e novos envios são
recusados. Se alguém alterou a cota depois que você abriu o diálogo, o salvamento é recusado com
**Alterado nesse meio-tempo**; recarregue e tente novamente. As alterações de cota são auditadas
(`storage.quota.update`).

## Detalhes do arquivo {#details}

Selecione o nome de um arquivo para abrir os detalhes: **Nome**, **ID**, **Status**, **Tipo de
conteúdo**, **Armazenado como inerte** (somente para arquivos inertes), **Tamanho**, checksum
**SHA-256**, **Versão**, **Enviado por**, **Enviado em**, **Atualizado em**, **Expira em** e os
rótulos. O SHA-256 permite verificar se uma cópia baixada é idêntica ao arquivo armazenado.

O **Status** de um arquivo listado é sempre `active`. Internamente, um arquivo fica `pending`
enquanto os bytes dele estão sendo gravados e `deleted` depois da exclusão; nenhum dos dois aparece
na lista.

## Baixar um arquivo {#download}

Selecione **Baixar** nos detalhes ou no menu **…** da linha. O Studio pede ao servidor um link de
download de curta duração e inicia o download com ele. Os arquivos são sempre baixados como anexos,
nunca abertos no navegador. Downloads não são registrados no log de auditoria.

## Compartilhar um link de download {#download-links}

1. Abra os detalhes do arquivo e selecione **Criar link de download**.
2. Copie o **Link de download** e repasse-o.

> [!CAUTION]
> Qualquer pessoa que tenha o link pode baixar o arquivo até ele expirar, sem fazer login. Um link
> não pode ser revogado isoladamente; excluir o arquivo o encerra. Compartilhe links apenas com o
> destinatário pretendido, por um canal de confiança.

### Por quanto tempo um link funciona {#link-expiry}

O link expira no momento mostrado em **Expira em**. O Studio sempre solicita a maior validade que
o servidor permite: `storage.signed_url_ttl_seconds`, por padrão 300 segundos (5 minutos),
configurável entre 10 segundos e 24 horas. Um link nunca dura mais do que a expiração do próprio
arquivo.

Há dois tipos de link, dependendo da configuração do servidor:

| Tipo                                                                                  | URL                                                                                                 | Para de funcionar quando                                                                 |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Link assinado do Axentra (padrão)                                                     | A URL pública do servidor + `/v1/files/download/…`                                                  | Expira, o arquivo é excluído ou expira, ou o tenant ou o produto é suspenso ou arquivado |
| Link pré-assinado do S3 (marcado como **pré-assinado pelo armazenamento de objetos**) | Aponta diretamente para o bucket S3; somente com o backend S3 e `s3_presigned_downloads` habilitado | Expira ou o arquivo é excluído. Suspender o tenant **não** o encerra                     |

## Renomear um arquivo ou alterar os rótulos {#edit}

1. Abra os detalhes e selecione **Editar nome e rótulos**.
2. Altere o **Nome** e/ou o JSON de **Rótulos (metadados)**. Os rótulos que você salva substituem
   todos os rótulos anteriores.
3. Selecione **Salvar alterações**.

O conteúdo não pode ser alterado. Se outra pessoa editou o arquivo nesse meio-tempo, o salvamento é
recusado com **Alterado nesse meio-tempo**.

## Excluir um arquivo {#delete}

1. Selecione **Excluir arquivo** nos detalhes ou no menu **…** da linha.
2. Confirme com **Excluir arquivo**.

O arquivo desaparece para todos de uma vez, a cota dele é liberada e os links de download
existentes param de funcionar. Em seguida, o servidor exclui o objeto armazenado.

> [!CAUTION]
> A exclusão não pode ser desfeita. É uma exclusão lógica no nível do armazenamento: dependendo do
> backend, os bytes podem permanecer no disco até o espaço ser reutilizado, ou como versões
> antigas do objeto em um bucket S3 com versionamento. Backups do banco de dados e o log de
> auditoria mantêm o nome, o tamanho e o checksum do arquivo. Se arquivos excluídos precisarem ser
> irrecuperáveis, os operadores precisam de criptografia de disco ou regras de ciclo de vida do
> bucket; veja [Segurança](help:security).

## Expiração {#expiry}

Um arquivo com **Expira em** definido desaparece das listas, dos detalhes e dos links de download
no momento em que esse horário passa. A limpeza do servidor (`axentra storage purge`, agendada pelo
operador) o remove depois; até lá, os bytes dele ainda contam para a cota. A expiração só pode ser
definida no envio, não alterada depois no Studio.

## Backends de armazenamento e verificação {#backends}

O local onde o conteúdo dos arquivos fica é uma configuração do servidor, mostrada na
[Visão geral dos dados](help:data-overview#storage-configuration):

- `local`: um diretório no servidor (padrão `./var/storage`).
- `s3`: Amazon S3 ou um serviço compatível com S3, opcionalmente com criptografia no servidor.

Alterar o backend não migra os arquivos existentes. O Axentra calcula um SHA-256 para cada arquivo,
mas **não** verifica arquivos em busca de malware nem inspeciona arquivos compactados. Se você
precisar dessa verificação, execute-a na sua aplicação ou em um job depois do envio.

## Solução de problemas {#troubleshooting}

**Arquivo grande demais.** O arquivo ultrapassa o tamanho máximo de arquivo do servidor. Compacte-o
ou divida-o, ou peça a um operador que aumente `storage.max_file_bytes`.

**Tipo de arquivo não aceito.** O arquivo é de um tipo bloqueado (executável, HTML, SVG, script), a
extensão ou o conteúdo dele parece com um, ou ele não está na lista de permissões do servidor.
Confira as regras no diálogo de envio. Quem gerencia o produto pode manter arquivos bloqueados como
anexos inertes ([política de tipos de conteúdo](help:data-overview#content-type-policy)).

**Cota de armazenamento esgotada.** O tenant atingiu a cota de bytes ou de arquivos. Exclua
arquivos ou peça a um proprietário ou administrador do produto que
[aumente a cota](#edit-quota). Arquivos expirados contam até a próxima limpeza.

**Sem acesso aos arquivos deste tenant.** Suas funções não concedem `files:read` neste tenant. Peça
uma função a um proprietário do produto ou ao proprietário do tenant.

**Enviar arquivo não aparece.** Falta a você `files:write` neste tenant ou nenhum tenant está
selecionado.

**Conflito: o envio demorou demais.** O envio ficou inacabado por mais tempo que o limite do
servidor (padrão: uma hora) e foi descartado. Envie novamente por uma conexão mais rápida.

**Verifique os dados informados.** Os rótulos não são um objeto JSON plano ou violam as
[regras de rótulos](#labels), ou **Expira em** está no passado.

**Alterado nesse meio-tempo.** Alguém renomeou, alterou os rótulos ou excluiu o arquivo, ou alterou
a cota, depois que você o abriu. Recarregue e repita.

**Um link de download retorna “Não encontrado”.** Ele expirou, o arquivo foi excluído ou expirou,
ou o tenant ou o produto foi suspenso ou arquivado. Crie um novo link. O servidor responde a todos
esses casos da mesma forma, de propósito.

**O link copiado aponta para o host errado.** Os links assinados são montados a partir da URL
pública do servidor (`security.public_url`). Peça a um operador que a defina com o endereço que os
destinatários conseguem acessar.

**O diálogo de envio não mostra o limite de tamanho nem os tipos permitidos.** Você não pode ler as
configurações do servidor. O servidor continua aplicando essas regras; o erro dele informa qual
regra falhou.
