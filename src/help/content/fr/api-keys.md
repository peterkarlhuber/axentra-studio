---
title: Clés d’API
summary: Crée des clés d’API pour les services qui appellent Axentra, envoie-les correctement, renouvelle-les sans interruption et révoque-les, y compris les clés qui en dérivent.
keywords: clé d’API, API, clé, jeton, secret, identifiants, accès machine, compte de service, intégration, renouveler, renouvellement, rotation, délai de grâce, révoquer, expiration, axk, bearer, X-API-Key
---

Une **clé d’API** permet à une machine, comme le backend de ton produit, un worker ou un script d’import,
d’appeler l’API d’Axentra sans qu’une personne se connecte. Chaque clé appartient à un seul produit, détient
une liste explicite d’autorisations et peut être liée à un locataire. Une clé ne détient jamais d’autorisations
de plateforme.

Le secret de la clé n’est affiché **qu’une seule fois**, lors de la création ou du renouvellement de la clé. Axentra n’en conserve qu’une
empreinte : personne, pas même un administrateur, ne peut l’afficher de nouveau.

> [!IMPORTANT]
> L’écran **Clés d’API** exige le module d’accès et `api_keys:read`. Créer, renouveler et
> révoquer des clés exige `api_keys:manage` (propriétaires et administrateurs du produit). Tu ne peux accorder à une clé
> que des autorisations que tu détiens toi-même au niveau du produit.

## Créer une clé d’API {#create}

1. Ouvre [Clés d’API](app:apiKeys) et choisis **Nouvelle clé d’API**.
2. Saisis un **Nom** qui indique où la clé est utilisée, par exemple `billing-worker production`.
3. Choisis éventuellement une **Portée locataire** (voir les [clés liées à un locataire](#tenant-scope)). Laisse **Tout
   le produit** pour une clé qui fonctionne dans tous les locataires.
4. Choisis éventuellement une **Expiration** : **Jamais** (par défaut), **Dans 30 jours**, **Dans 90
   jours**, **Dans 365 jours**, ou **À une date…** puis une **Date d’expiration** (voir
   [expiration](#expiry)).
5. Sélectionne les **Autorisations** dont le service a besoin, et pas davantage. La liste fonctionne comme décrit dans
   [rôles et autorisations](help:roles-permissions#checklist).
6. Choisis **Créer la clé**.
7. Copie le secret affiché sous **Secret de la clé d’API** dans ton gestionnaire de secrets.
8. Coche **J’ai conservé le secret en lieu sûr** et choisis **Terminé**.

> [!CAUTION]
> La boîte de dialogue du secret ne peut pas être fermée avec Échap ni par un clic à l’extérieur, et le secret ne peut plus être
> affiché ensuite. S’il est perdu, [renouvelle la clé](#rotate) pour obtenir un nouveau secret.

| Champ                | Effet                                             | Valeurs autorisées / par défaut                                                                                                     |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Nom**              | Libellé dans la liste et dans le journal d’audit. | 1 à 200 caractères. Pas forcément unique.                                                                                           |
| **Portée locataire** | Lie la clé à un locataire.                        | **Tout le produit** (par défaut) ou un locataire. Affiché quand le module des locataires est activé.                                |
| **Autorisations**    | Ce que la clé a le droit de faire.                | 1 à 100 autorisations de portée produit ou locataire, y compris les autorisations actives définies par le produit.                  |
| **Expiration**       | Moment après lequel la clé cesse de fonctionner.  | **Jamais** (par défaut), 30, 90 ou 365 jours après la création, ou la fin d’un jour choisi (après aujourd’hui, ton fuseau horaire). |

### Expiration {#expiry}

Une clé avec une expiration cesse de fonctionner à ce moment : elle est refusée comme une clé
révoquée et apparaît comme **Expiré**. Choisis une expiration pour les clés nécessaires seulement
pendant un temps, par exemple pour une migration ou le test d’un partenaire ; les services
permanents utilisent en général des clés sans expiration et en [renouvellent le secret](#rotate)
régulièrement.

L’expiration ne peut pas être modifiée après la création, et le renouvellement la conserve : crée
une nouvelle clé avant que l’ancienne expire et bascule le service. Les clés qu’un service crée avec
une autre clé ne survivent jamais à la clé qui les crée (voir [clés dérivées](#derived-keys)) ; les
clés créées dans Studio appartiennent à ton compte, cette règle ne s’applique donc pas à elles.

### Clés liées à un locataire {#tenant-scope}

Une clé dotée d’une **Portée locataire** ne fonctionne qu’à l’intérieur de ce locataire : elle peut y utiliser ses autorisations de locataire,
et ses autorisations de produit n’ont aucun effet. Tous les autres locataires répondent **Introuvable**.
Quand le locataire est supprimé, la clé est supprimée avec lui ; tant que le locataire est suspendu,
la clé est refusée.

## Envoyer la clé avec une requête {#use}

Une clé a la forme `axk_<26 characters>_<secret>`. La liste n’en affiche que la première partie (le
**préfixe**, par exemple `axk_01jdk7x3m9q2w8v5r4t6y0z1ab_`), qui identifie la clé mais ne permet pas d’appeler
l’API. Envoie la clé complète dans l’un de ces en-têtes :

```http
GET /v1/products/prd_01EXAMPLE/tenants HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01jdk7x3m9q2w8v5r4t6y0z1ab_EXAMPLEsecretEXAMPLEsecretEXAMPLEsec
```

```bash
curl -H "X-API-Key: $AXENTRA_API_KEY" https://api.example.com/v1/products/prd_01EXAMPLE/tenants
```

Les requêtes avec une clé n’ont besoin ni de jeton CSRF ni de cookie. Garde la clé hors des navigateurs et du code
source ; charge-la depuis une variable d’environnement ou un gestionnaire de secrets. Consulte les [bases de l’API](help:api-basics).

## Lire la liste des clés {#list}

| Colonne                     | Signification                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Nom**                     | Le nom et le préfixe de la clé.                                                                                                           |
| **Statut**                  | **Actif**, **Expiré** (date d’expiration dépassée) ou **Révoqué** (révoquée, ou remplacée par un renouvellement après le délai de grâce). |
| **Portée**                  | **Tout le produit** ou **Locataire** avec l’ID du locataire.                                                                              |
| **Autorisations**           | Nombre d’autorisations.                                                                                                                   |
| **Dernière utilisation**    | Dernière requête réussie ; mise à jour au plus une fois par minute.                                                                       |
| **Expire le**, **Créée le** | Horodatages.                                                                                                                              |

Les clés actives sont listées en premier, les plus récentes d’abord. Les clés expirées et révoquées restent listées pour référence.

## Renouveler une clé {#rotate}

Le renouvellement remplace une clé par une nouvelle, par exemple selon un calendrier ou après l’exposition d’un secret.

1. Dans la ligne de la clé, ouvre le menu d’actions (**…**) et choisis **Renouveler le secret**.
2. Choisis un **Délai de grâce de l’ancien secret**.
3. Choisis **Renouveler le secret** et conserve le nouveau secret, comme lors de la création d’une clé.

La clé de remplacement est une **nouvelle clé**, avec un nouvel ID et un nouveau préfixe, et les mêmes nom, autorisations,
portée de locataire et expiration. Les autorisations de produit retirées sont omises. L’ancienne clé est révoquée à la fin du
délai de grâce.

```diagram
key-rotation
```

### Délai de grâce {#grace-period}

| Option                                                         | Effet                                                                                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aucun – l’ancien secret cesse immédiatement de fonctionner** | L’ancienne clé est révoquée sur-le-champ. Les services qui l’utilisent encore échouent jusqu’à ce qu’ils reçoivent le nouveau secret.        |
| **1 heure**, **24 heures**, **7 jours**                        | L’ancienne et la nouvelle clé fonctionnent toutes les deux jusqu’à la fin du délai. Les deux sont listées comme **Actif**, avec le même nom. |

> [!TIP]
> Renouvellement sans interruption : renouvelle avec **24 heures**, déploie le nouveau secret dans tous les services,
> vérifie que la **Dernière utilisation** de la nouvelle clé évolue et que celle de l’ancienne s’arrête, puis révoque l’ancienne
> clé pour mettre fin au délai de grâce plus tôt.

Les clés qu’un service a créées _avec_ l’ancienne clé ne sont pas révoquées par le renouvellement et continuent de fonctionner.

## Révoquer une clé {#revoke}

1. Ouvre le menu d’actions de la clé (**…**) et choisis **Révoquer la clé**.
2. Saisis le nom de la clé pour confirmer, puis choisis **Révoquer la clé**.

La clé cesse de fonctionner immédiatement et définitivement. Révoquer une clé qui se trouve dans son délai de grâce
met fin à ce délai sur-le-champ.

> [!CAUTION]
> La révocation révoque aussi, d’un coup, toutes les clés **créées avec cette clé**, ainsi que les clés créées avec
> celles-ci. La confirmation ne les liste pas ; consulte l’entrée du [journal d’audit](help:audit) correspondant à
> la révocation pour connaître les clés dérivées révoquées.

## Clés dérivées et expiration {#derived-keys}

Un service dont la clé détient `api_keys:manage` peut créer d’autres clés via l’API. Ces
**clés dérivées** :

- détiennent au plus les autorisations de la clé qui les crée ;
- ne lui survivent jamais : sans expiration propre, elles héritent de l’expiration de la clé créatrice, et une expiration
  plus tardive est refusée ;
- sont révoquées en même temps qu’elle (voir [révoquer](#revoke)), mais pas lors d’un renouvellement.

Les clés créées dans Studio le sont par ton compte utilisateur, pas par une clé : ces règles ne
s’appliquent donc pas à elles. Les clés appartiennent au produit, mais elles n’agissent que dans les
limites des autorisations actuelles de la personne qui les a créées (voir la section suivante).

### Les clés dépendent des autorisations de leur créateur {#creator-permissions}

Une clé ne fonctionne que tant que la personne qui l’a créée détient encore les autorisations que la
clé utilise. Le serveur le vérifie à chaque requête : si le rôle de cette personne a changé, si elle
a été retirée du produit ou si son compte a été désactivé, une requête qui a besoin d’une
autorisation qu’elle ne détient plus est refusée avec `403 api_key_creator_lost_access`, et la
réponse nomme cette autorisation dans `permission`. La liste des clés affiche toujours une telle clé
comme **Actif**. Redonne l’autorisation à cette personne, ou crée une nouvelle clé en tant que
quelqu’un qui la détient, bascule tes services dessus et révoque l’ancienne clé.

Studio lui-même n’est jamais refusé ainsi : il utilise ta session utilisateur, pas une clé.

## Bon à savoir {#good-to-know}

- Un produit archivé ou un locataire suspendu fait échouer toutes ses clés avec **Non autorisé**
  jusqu’à sa restauration ou sa réactivation.
- Retirer une autorisation d’un produit supprime silencieusement son effet sur toutes les clés.
- Donne à chaque service sa propre clé, pour pouvoir en renouveler ou en révoquer une sans affecter les autres.

## Dépannage {#troubleshooting}

**Non autorisé : « you cannot grant permissions you do not hold: … ».** Tu as sélectionné une autorisation
que tu ne détiens pas toi-même. Retire-la, ou demande à un propriétaire du produit de créer la clé. Il en va de même pour le
renouvellement : la personne qui renouvelle doit détenir toutes les autorisations de la clé.

**Vérifie ta saisie : « an API key needs at least one permission » / « unknown permissions ».**
Sélectionne au moins une autorisation ; une autorisation de produit a peut-être été retirée entre-temps.

**Vérifie ta saisie : « only active keys can be rotated ».** La clé est expirée ou révoquée.
Crée plutôt une nouvelle clé.

**Vérifie ta saisie : « expires_at must not be later than the expiry of the creating key ».**
Uniquement via l’API : une clé dérivée ne peut pas survivre à sa clé parente.

**Connecte-toi (401) quand le service appelle l’API.** La clé est erronée, incomplète, révoquée ou
expirée. Vérifie que la clé complète (et pas seulement le préfixe) est envoyée et que le statut est **Actif**.

**Non autorisé (403) pour une clé valide.** Il manque à la clé l’autorisation requise pour cette requête, le
produit est archivé ou le locataire est suspendu.

**Introuvable (404) pour une clé valide.** La clé appartient à un autre produit, ou elle est liée à un
autre locataire.
