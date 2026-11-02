---
title: Visão geral dos dados
summary: Veja quais coleções de registros e arquivos um produto armazena, quanto armazenamento cada tenant usa e quais configurações de armazenamento e retenção o servidor aplica.
keywords: dados, armazenamento, coleções, estatísticas, cota, uso de disco, espaço em disco, retenção, backup, cópia de segurança, política de tipos de conteúdo, tipos de arquivo bloqueados, backend de armazenamento, S3, armazenamento local
---

A **Visão geral dos dados** mostra, para o produto atual, o que está armazenado e sob quais regras:
as coleções de registros nas quais os tenants gravam, o armazenamento de arquivos que cada tenant
usa em comparação com a cota dele, a configuração de armazenamento do servidor e os períodos de
retenção que o servidor informa. É uma página somente leitura: ela não altera nada. Você altera
cotas na tela [Arquivos](help:files#quota) e a política de tipos de conteúdo na guia **Arquivos**
do produto (veja [Definir a política de tipos de conteúdo](#content-type-policy)).

Os operadores de produto a usam para responder perguntas como “qual tenant está perto da cota de
armazenamento?”, “quais coleções existem?” e “por quanto tempo o servidor mantém os eventos de
auditoria?”.

> [!IMPORTANT]
> A página exige o módulo do servidor `data` (registros). O cartão **Armazenamento de arquivos**
> também exige o módulo `storage`. As estatísticas exigem a permissão `collections:read`, concedida
> pelas funções de produto **Product owner**, **Product admin**, **Support** e **Product viewer**,
> assim como pelas funções na plataforma. Os cartões **Configuração de armazenamento** e
> **Retenção** exigem `platform:settings` ou `product:manage`. Veja
> [Funções e permissões](help:roles-permissions).

## Abrir a visão geral dos dados {#open}

1. Selecione um produto.
2. Na barra lateral, abra **Dados e armazenamento** e escolha **Visão geral dos dados**
   ([abrir a tela](app:dataOverview)).

Se a barra lateral marcar o item como **Desat.**, o módulo `data` não está habilitado no servidor.
Um operador habilita módulos na [configuração do servidor](help:server-configuration).

## O que a página mostra {#what-you-see}

| Cartão                            | Conteúdo                                                                            | Aparece quando                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Coleções de registros**         | Quantidade de coleções e registros e, em seguida, uma linha por coleção             | Você tem `collections:read`                                                           |
| **Armazenamento de arquivos**     | Bytes e arquivos usados pelo produto inteiro, as cotas padrão, uma linha por tenant | Você tem `collections:read` e o módulo `storage` está habilitado                      |
| **Configuração de armazenamento** | Backend, tamanho máximo de arquivo, tipos permitidos e bloqueados                   | Você tem `platform:settings` ou `product:manage` e o módulo `storage` está habilitado |
| **Retenção**                      | Por quanto tempo o servidor mantém eventos de auditoria e jobs concluídos           | Você tem `platform:settings` ou `product:manage`                                      |

Sem `collections:read`, a página mostra **Estatísticas do produto indisponíveis**. Membros de
tenant (funções **Owner**, **Admin**, **Member**, **Viewer** de um tenant) não têm essa permissão;
ela revelaria dados de outros tenants. Eles trabalham com os dados do próprio tenant em
[Registros](help:records) e [Arquivos](help:files).

## Coleções de registros {#collections}

Uma _coleção_ é um grupo nomeado de registros JSON, como `orders` ou `contacts`. As coleções não
são criadas nem configuradas separadamente: uma coleção passa a existir assim que um registro é
gravado nela e desaparece quando o último registro dela é excluído. Veja
[Registros](help:records#collections).

A tabela lista todas as coleções do produto em todos os tenants:

| Coluna               | Significado                                                         |
| -------------------- | ------------------------------------------------------------------- |
| **Coleção**          | Nome da coleção. Selecione-a para abri-la na tela **Registros**.    |
| **Registros**        | Quantidade de registros nesta coleção, somada em todos os tenants.  |
| **Tenants**          | Quantidade de tenants que têm pelo menos um registro nesta coleção. |
| **Última alteração** | Momento da criação ou atualização mais recente nesta coleção.       |

Se a tabela estiver vazia (**Nenhuma coleção ainda**), nenhum registro foi gravado neste produto
até agora.

## Armazenamento por tenant {#storage-per-tenant}

O cartão **Armazenamento de arquivos** começa com quatro números: **Armazenamento usado** e
**Arquivos** do produto inteiro (somente arquivos ativos), e a **Cota de armazenamento padrão** e a
**Cota de arquivos padrão**, que valem para todo tenant sem cota própria.

A tabela **Uso de armazenamento por tenant** tem uma linha por tenant (50 por página,
**Carregar mais** para o restante):

| Coluna                                           | Significado                                                                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**                                       | Selecione o nome para abrir os arquivos do tenant.                                                                                                                                             |
| **Armazenamento** / **Arquivos**                 | Bytes e quantidade de arquivos ativos do tenant.                                                                                                                                               |
| **Cota de armazenamento** / **Cota de arquivos** | O limite efetivo e quanto dele está em uso. **Ilimitado** significa que nenhum limite se aplica. O selo **Tenant** marca uma cota definida para este tenant; sem ele, o tenant herda o padrão. |

### Como a cota efetiva é determinada {#quotas}

Cada um dos dois limites (bytes e arquivos) é resolvido separadamente, nesta ordem:

1. A cota própria do tenant, definida com **Editar cota** na tela [Arquivos](help:files#quota).
2. O padrão do produto: `quota_bytes` / `quota_files` na seção `storage` das configurações do
   produto (página do produto, guia **Configurações**, campo **Configurações (JSON)**).
3. O padrão da instalação: `storage.default_quota_bytes` / `storage.default_quota_files` na
   configuração do servidor.
4. Caso contrário: ilimitado.

```json
{ "storage": { "quota_bytes": 10737418240, "quota_files": 10000 } }
```

O exemplo define um padrão de produto de 10 GiB (em bytes) e 10.000 arquivos.

> [!NOTE]
> O uso conta arquivos _ativos_. Um arquivo cuja data de expiração passou desaparece
> imediatamente, mas os bytes dele continuam contando até a limpeza do servidor ser executada (um
> operador agenda `axentra storage purge`, por exemplo a cada 15 minutos).

## Configuração de armazenamento {#storage-configuration}

Este cartão mostra as configurações efetivas do servidor. Elas fazem parte da configuração do
servidor e não podem ser alteradas no Studio.

| Configuração                  | O que faz                                                                                                                                      | Padrão  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Backend**                   | Onde o conteúdo dos arquivos é armazenado: `local` (um diretório no servidor) ou `s3` (Amazon S3 ou um serviço compatível com S3).             | `local` |
| **Tamanho máximo de arquivo** | Limite rígido por arquivo, verificado durante o envio.                                                                                         | 50 MiB  |
| **Tipos permitidos**          | Lista de permissões de tipos de conteúdo (`image/png`, `image/*`). **Todos os tipos, exceto os bloqueados** significa que a lista está vazia.  | vazia   |
| **Tipos bloqueados**          | O que acontece com executáveis, HTML, SVG e scripts neste produto, e se isso está **Definida para este produto** ou **Herdada da instalação**. | recusar |

Alterar o backend não move os arquivos existentes. Para desenvolvedores e operadores, todas as
chaves da seção `[storage]` estão descritas em
[Configuração do servidor](help:server-configuration).

## Definir a política de tipos de conteúdo {#content-type-policy}

Alguns tipos de arquivo podem executar código quando alguém os abre: executáveis, HTML, XHTML, SVG,
JavaScript, scripts de shell e PHP. O Axentra os _bloqueia_. A política de tipos de conteúdo
decide, por produto, o que acontece com um envio bloqueado: ele é recusado ou armazenado como
_anexo inerte_, mantido como `application/octet-stream` opaco que só é baixado, nunca exibido.

1. Abra o produto: **Produtos** e depois o nome do produto.
2. Escolha a guia **Arquivos**. (A guia fica oculta quando o módulo `storage` não está
   habilitado.)
3. Em **Política de tipos de conteúdo de arquivos**, escolha o comportamento e as listas (tabela
   abaixo).
4. Escolha **Salvar alterações**.

| Configuração                                    | O que faz                                                                                                                                                                                                                                                                                                              | Valores permitidos / padrão                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Tipos de arquivo bloqueados**                 | **Recusar o envio** (quem envia recebe um erro) ou **Armazenar como anexo inerte**. **Padrão da instalação** segue a configuração do servidor `storage.store_blocked_as_inert`.                                                                                                                                        | Padrão: padrão da instalação                                      |
| **Extensões aceitas como anexos inertes**       | Extensões bloqueadas que são mantidas como anexos inertes mesmo quando os envios são recusados nos demais casos. A decisão usa a extensão do nome do arquivo, também quando o bloqueio vem do conteúdo (um script `#!` chamado `run.sh`, com `sh` na lista, é mantido; o mesmo conteúdo chamado `run.txt` é recusado). | Separadas por vírgula, sem ponto: `html, sh`. No máximo 100 itens |
| **Extensões bloqueadas adicionalmente**         | Extensões bloqueadas além da lista integrada.                                                                                                                                                                                                                                                                          | `py, rb`. No máximo 100 itens                                     |
| **Tipos de conteúdo bloqueados adicionalmente** | Tipos de conteúdo bloqueados além da lista integrada.                                                                                                                                                                                                                                                                  | `text/x-python`. No máximo 100 itens                              |

A seção **Sempre bloqueados** lista as extensões e os tipos de conteúdo integrados. Um produto pode
bloquear mais ou manter arquivos bloqueados como anexos inertes, mas nunca pode desbloqueá-los.

> [!IMPORTANT]
> Ver a política exige `product:read`; alterá-la exige `product:manage` (funções
> **Product owner** e **Product admin**). Produtos arquivados são somente leitura.

> [!NOTE]
> A lista **Tipos permitidos** da instalação continua valendo depois da política: se a lista de
> permissões não contiver `application/octet-stream`, os arquivos inertes também são recusados.

A política é verificada de três formas: pelo tipo de conteúdo declarado, pela extensão do nome do
arquivo e pelos primeiros bytes do conteúdo (executáveis, HTML, SVG e qualquer arquivo que comece
com `#!`). Renomear um arquivo para uma extensão bloqueada segue a mesma política. As alterações
ficam registradas no log de auditoria como `storage.policy.update`. Detalhes para quem envia
arquivos: [Arquivos](help:files#content-types).

## Retenção {#retention}

| Configuração         | O que significa                                                                                                                                                               | Padrão   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Log de auditoria** | Dias durante os quais o servidor mantém eventos de auditoria (`observability.audit_retention_days`).                                                                          | 365 dias |
| **Jobs concluídos**  | Dias durante os quais o servidor mantém jobs concluídos (com sucesso, com falha, mortos ou cancelados) e entregas de webhook concluídas (`observability.job_retention_days`). | 30 dias  |

Registros e arquivos não têm período de retenção: eles permanecem até alguém excluí-los, a data de
expiração do próprio arquivo passar ou o tenant ser excluído (o que exclui todos os dados dele).

## Backups {#backups}

O cartão **Backups não são informados** é intencional: a API não informa o status dos backups nem
por quanto tempo os metadados de arquivos excluídos são mantidos. As duas coisas fazem parte da
operação do servidor. Por padrão, a limpeza remove as linhas de metadados de arquivos excluídos
após 30 dias; backups do banco de dados e o log de auditoria mantêm por mais tempo o nome, o
tamanho e o checksum de um arquivo excluído.

## Solução de problemas {#troubleshooting}

**Estatísticas do produto indisponíveis.** Suas funções não concedem `collections:read`. Peça uma
função de produto a um proprietário do produto ou use [Registros](help:records) e
[Arquivos](help:files) para o seu tenant.

**Módulo de armazenamento não habilitado.** O servidor não executa o módulo `storage`, então não é
possível armazenar arquivos. Um operador adiciona `storage` aos módulos habilitados; veja a
[Referência de módulos](help:modules-reference).

**Os cartões Configuração de armazenamento e Retenção não aparecem.** Eles exigem
`platform:settings` ou `product:manage`. Leitores do produto e a equipe de suporte não os veem.

**Um tenant mostra mais uso do que a soma dos arquivos dele.** Arquivos expirados contam até a
próxima limpeza. Pergunte a um operador se `axentra storage purge` é executado regularmente.

**Salvar a política de tipos de conteúdo falha com “Alterado nesse meio-tempo”.** Alguém alterou o
produto (configurações, nome ou política) depois que você abriu a página. Recarregue a página e
aplique sua alteração novamente.

**Salvar a política falha com “Verifique os dados informados”.** Um item não é uma extensão válida
(letras minúsculas, dígitos, `_`, `+` ou `-`, no máximo 16 caracteres, sem ponto) nem um tipo de
conteúdo válido (`type/subtype`), ou uma lista tem mais de 100 itens. A mensagem abaixo do campo
indica o problema.

**Não encontrado ao abrir a página.** O módulo `data` está desabilitado, ou o produto está
arquivado e você não é administrador da plataforma.
