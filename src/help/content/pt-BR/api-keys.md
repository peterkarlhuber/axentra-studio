---
title: Chaves de API
summary: Crie chaves de API para serviços que chamam o Axentra, envie-as corretamente, rotacione-as sem indisponibilidade e revogue-as, incluindo as chaves derivadas delas.
keywords: chave de API, chave, token, segredo, credencial, acesso de máquina, conta de serviço, integração, rotacionar, rotação, período de carência, revogar, expiração, axk, bearer, X-API-Key
---

Uma **chave de API** permite que uma máquina, como o backend do seu produto, um worker ou um script
de importação, chame a API do Axentra sem que uma pessoa precise entrar. Cada chave pertence a
exatamente um produto, tem uma lista explícita de permissões e pode ser vinculada a um tenant. Uma
chave nunca tem permissões da plataforma.

O segredo da chave é mostrado **uma única vez**, quando a chave é criada ou rotacionada. O Axentra
armazena apenas um hash dele, então ninguém, nem mesmo um administrador, consegue exibi-lo de novo.

> [!IMPORTANT]
> A tela **Chaves de API** exige o módulo de acesso e `api_keys:read`. Criar, rotacionar e revogar
> chaves exige `api_keys:manage` (proprietários e administradores do produto). Você só pode
> conceder a uma chave permissões que você mesmo tem no nível do produto.

## Criar uma chave de API {#create}

1. Abra [Chaves de API](app:apiKeys) e escolha **Nova chave de API**.
2. Informe um **Nome** que diga onde a chave é usada, por exemplo `billing-worker production`.
3. Se quiser, escolha um **Escopo de tenant** (veja [chaves vinculadas a tenant](#tenant-scope)).
   Deixe **Produto inteiro** para uma chave que funcione em todos os tenants.
4. Se quiser, escolha uma **Expiração**: **Nunca** (padrão), **Em 30 dias**, **Em 90 dias**, **Em
   365 dias**, ou **Em uma data…** e depois uma **Data de expiração** (veja [expiração](#expiry)).
5. Selecione as **Permissões** de que o serviço precisa, e nada além disso. A lista funciona como
   descrito em [funções e permissões](help:roles-permissions#checklist).
6. Escolha **Criar chave**.
7. Copie o segredo de **Segredo da chave de API** para o seu gerenciador de segredos.
8. Marque **Guardei o segredo em local seguro** e escolha **Concluído**.

> [!CAUTION]
> O diálogo do segredo não pode ser fechado com Escape nem clicando fora dele, e o segredo não pode
> ser mostrado de novo. Se ele se perder, [rotacione a chave](#rotate) para obter um novo segredo.

| Campo                | O que faz                                           | Valores permitidos / padrão                                                                                                |
| -------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Nome**             | Rótulo na lista e no log de auditoria.              | 1–200 caracteres. Não precisa ser único.                                                                                   |
| **Escopo de tenant** | Vincula a chave a um tenant.                        | **Produto inteiro** (padrão) ou um tenant. Aparece quando o módulo de tenants está habilitado.                             |
| **Permissões**       | O que a chave pode fazer.                           | 1–100 permissões de escopo produto ou tenant, inclusive as definidas pelo produto que estejam ativas.                      |
| **Expiração**        | Momento a partir do qual a chave para de funcionar. | **Nunca** (padrão), 30, 90 ou 365 dias após a criação, ou o fim de um dia escolhido (depois de hoje, no seu fuso horário). |

### Expiração {#expiry}

Uma chave com expiração para de funcionar nesse momento: ela é recusada como uma chave revogada e
aparece como **Expirado**. Escolha uma expiração para chaves necessárias só por um tempo, por
exemplo para uma migração ou o teste de um parceiro; serviços permanentes costumam usar chaves sem
expiração e [rotacioná-las](#rotate) periodicamente.

A expiração não pode ser alterada depois da criação, e a rotação a mantém: crie uma chave nova antes
que a antiga expire e mude o serviço. Chaves que um serviço cria com outra chave nunca duram mais
que a chave que as cria (veja [chaves derivadas](#derived-keys)); chaves criadas no Studio pertencem
à sua conta, então essa regra não se aplica a elas.

### Chaves vinculadas a tenant {#tenant-scope}

Uma chave com **Escopo de tenant** só funciona dentro desse tenant: ela pode usar ali as
permissões de tenant, e as permissões de produto dela não têm nenhum efeito. Todos os outros
tenants respondem **Não encontrado**. Quando o tenant é excluído, a chave é excluída com ele;
enquanto o tenant está suspenso, a chave é recusada.

## Enviar a chave em uma requisição {#use}

Uma chave tem o formato `axk_<26 characters>_<secret>`. A lista mostra apenas a primeira parte (o
**prefixo**, por exemplo `axk_01jdk7x3m9q2w8v5r4t6y0z1ab_`), que identifica a chave, mas não pode
ser usada para chamar a API. Envie a chave completa em um destes cabeçalhos:

```http
GET /v1/products/prd_01EXAMPLE/tenants HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01jdk7x3m9q2w8v5r4t6y0z1ab_EXAMPLEsecretEXAMPLEsecretEXAMPLEsec
```

```bash
curl -H "X-API-Key: $AXENTRA_API_KEY" https://api.example.com/v1/products/prd_01EXAMPLE/tenants
```

Requisições com chave não precisam de token CSRF nem de cookie. Mantenha a chave fora de
navegadores e do código-fonte; carregue-a de uma variável de ambiente ou de um gerenciador de
segredos. Veja [noções básicas da API](help:api-basics).

## Ler a lista de chaves {#list}

| Coluna                       | Significado                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**                     | O nome e o prefixo da chave.                                                                                                             |
| **Status**                   | **Ativo**, **Expirado** (passou da data de expiração) ou **Revogado** (revogada, ou substituída por rotação após o período de carência). |
| **Escopo**                   | **Produto inteiro** ou **Tenant** com o ID do tenant.                                                                                    |
| **Permissões**               | Quantidade de permissões.                                                                                                                |
| **Último uso**               | Última requisição bem-sucedida; atualizado no máximo uma vez por minuto.                                                                 |
| **Expira em**, **Criada em** | Data e hora.                                                                                                                             |

As chaves ativas aparecem primeiro, das mais novas para as mais antigas. Chaves expiradas e
revogadas continuam listadas para consulta.

## Rotacionar uma chave {#rotate}

Rotacionar substitui uma chave por uma nova, por exemplo periodicamente ou depois que um segredo
foi exposto.

1. Na linha da chave, abra o menu de ações (**…**) e escolha **Rotacionar segredo**.
2. Escolha um **Período de carência do segredo antigo**.
3. Escolha **Rotacionar segredo** e guarde o novo segredo, como ao criar uma chave.

A substituta é uma **chave nova**, com novo ID e novo prefixo, e com o mesmo nome, permissões,
escopo de tenant e expiração. Permissões de produto descontinuadas ficam de fora. A chave antiga é
revogada quando o período de carência termina.

```diagram
key-rotation
```

### Período de carência {#grace-period}

| Opção                                                          | Efeito                                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Nenhum – o segredo antigo deixa de funcionar imediatamente** | A chave antiga é revogada na hora. Os serviços que ainda a usam falham até receberem o novo segredo.       |
| **1 hora**, **24 horas**, **7 dias**                           | A chave antiga e a nova funcionam até o fim do período. As duas aparecem como **Ativo**, com o mesmo nome. |

> [!TIP]
> Rotação sem indisponibilidade: rotacione com **24 horas**, implante o novo segredo em todos os
> serviços, confira se o **Último uso** da chave nova avança e o da antiga para, e então revogue a
> chave antiga para encerrar o período de carência antes.

As chaves que um serviço criou _com_ a chave antiga não são revogadas pela rotação e continuam
funcionando.

## Revogar uma chave {#revoke}

1. Abra o menu de ações da chave (**…**) e escolha **Revogar chave**.
2. Digite o nome da chave para confirmar e escolha **Revogar chave**.

A chave para de funcionar imediatamente e de forma permanente. Revogar uma chave que está no
período de carência encerra esse período na hora.

> [!CAUTION]
> Revogar também revoga, de uma só vez, todas as chaves que foram **criadas com esta chave** e as
> chaves criadas com essas. A confirmação não as lista; consulte a entrada da revogação no
> [log de auditoria](help:audit) para ver as chaves derivadas revogadas.

## Chaves derivadas e expiração {#derived-keys}

Um serviço cuja chave tem `api_keys:manage` pode criar outras chaves pela API. Essas **chaves
derivadas**:

- têm no máximo as permissões da chave que as cria;
- nunca duram mais do que ela: sem expiração própria, herdam a expiração da chave criadora, e uma
  expiração posterior é recusada;
- são revogadas junto com ela (veja [revogar](#revoke)), mas não na rotação.

As chaves criadas no Studio são criadas pela sua conta de usuário, não por uma chave, então essas
regras não se aplicam a elas. As chaves pertencem ao produto, mas só agem dentro das permissões
atuais da pessoa que as criou (veja a próxima seção).

### As chaves dependem das permissões de quem as criou {#creator-permissions}

Uma chave só funciona enquanto a pessoa que a criou ainda tiver as permissões que a chave usa. O
servidor verifica isso a cada solicitação: se o papel dessa pessoa mudou ou ela foi removida do
produto, uma solicitação que precisa de uma permissão que ela não tem mais é recusada com `403
api_key_creator_lost_access`, e a resposta indica essa permissão em `permission`. A lista de chaves
continua mostrando essa chave como **Ativo**. Devolva a permissão a essa pessoa, ou crie uma nova
chave como alguém que a tenha, mude seus serviços para ela e revogue a chave antiga.

O próprio Studio nunca é recusado assim: ele usa a sua sessão de usuário, não uma chave.

## Bom saber {#good-to-know}

- Um produto arquivado ou um tenant suspenso faz todas as chaves dele falharem com
  **Não permitido** até ser restaurado ou reativado.
- Remover uma permissão de um produto (descontinuá-la) remove silenciosamente o efeito dela de
  todas as chaves.
- Dê a cada serviço a própria chave, para poder rotacionar ou revogar uma sem afetar as outras.

## Solução de problemas {#troubleshooting}

**Não permitido: “you cannot grant permissions you do not hold: …”.** Você selecionou uma
permissão que você mesmo não tem. Remova-a ou peça a um proprietário do produto que crie a chave. O
mesmo vale para a rotação: quem rotaciona precisa ter todas as permissões da chave.

**Verifique os dados informados: “an API key needs at least one permission” / “unknown
permissions”.** Selecione pelo menos uma permissão; uma permissão de produto pode ter sido
descontinuada nesse meio-tempo.

**Verifique os dados informados: “only active keys can be rotated”.** A chave está expirada ou
revogada. Crie uma chave nova.

**Verifique os dados informados: “expires_at must not be later than the expiry of the creating
key”.** Apenas pela API: uma chave derivada não pode durar mais do que a chave que a criou.

**Faça login (401) quando o serviço chama a API.** A chave está errada, incompleta, revogada ou
expirada. Confira se a chave completa (não apenas o prefixo) é enviada e se o status é **Ativo**.

**Não permitido (403) para uma chave válida.** Falta à chave a permissão para essa requisição, o
produto está arquivado ou o tenant está suspenso.

**Não encontrado (404) para uma chave válida.** A chave pertence a outro produto ou está vinculada a
outro tenant.
