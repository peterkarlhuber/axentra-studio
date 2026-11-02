---
title: Journal d’audit
summary: Savoir qui a fait quoi et quand sur le serveur, filtrer le journal, partager une vue filtrée et lire tous les détails d’un événement.
keywords: audit, piste d’audit, historique, journal d’activité, qui a modifié, journal des événements, conformité, ID de requête, refusé, tentatives de connexion
---

Le **Journal d’audit** enregistre les actions administratives et celles qui touchent à la sécurité
sur le serveur Axentra : qui a agi (un utilisateur, une clé d’API ou le système), ce qui a été
fait, sur quel objet, avec quel résultat et quand. Utilise-le pour répondre à des questions comme
« qui a révoqué cette clé d’API ? », « pourquoi cet utilisateur ne peut-il plus se connecter ? » ou
« que s’est-il passé lors de la requête portant cet ID de requête ? ».

Le serveur écrit lui-même les événements. Le Studio se contente de les lire : personne ne peut
modifier ni supprimer un événement d’audit, pas même un administrateur de la plateforme.

> [!IMPORTANT]
> Le module d’audit est toujours activé. Pour lire les événements d’un produit, tu as besoin de
> l’autorisation `audit:read` dans ce produit (tous les rôles de produit intégrés l’ont :
> **Product owner**, **Product admin**, **Support** et **Product viewer**).
> Les événements de toute l’installation, y compris ceux qui n’appartiennent à aucun
> produit, nécessitent `platform:audit` (rôles sur la plateforme `platform_admin` et
> `platform_viewer`). Les rôles de locataire ne permettent pas de lire le journal d’audit.

## Qui voit quels événements {#who-sees-what}

| Tu as                                               | Le Studio affiche                                                                                                     | Filtre de produit                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `platform:audit`                                    | Tous les événements de l’installation, y compris les connexions, l’installation et les autres événements sans produit | **Tous les produits** (par défaut) ou un produit               |
| `audit:read` dans un produit, sans `platform:audit` | Uniquement les événements d’un produit ; le Studio démarre avec le dernier produit que tu as utilisé                  | L’un de tes produits ; **Tous les produits** n’est pas proposé |
| Aucune des deux                                     | **Journal d’audit** n’apparaît pas dans la barre latérale ; un lien direct affiche **Non autorisé**                   | –                                                              |

Le serveur vérifie l’autorisation à chaque requête. Sélectionner un produit que tu n’as pas le
droit de lire renvoie **Non autorisé**, et un événement que tu n’as pas le droit de lire ne peut
pas être ouvert en détail (voir [Dépannage](#troubleshooting)).

> [!NOTE]
> Les événements sans produit, comme `identity.login`, `identity.logout` ou
> `identity.setup.complete`, ne sont visibles qu’avec `platform:audit`.

## Ouvrir le journal d’audit {#open}

1. Dans la barre latérale, ouvre **Audit et supervision** › **Journal d’audit**
   ([ouvrir](app:audit)).
2. Les événements les plus récents apparaissent en premier. Fais défiler jusqu’à la fin du tableau
   pour en charger davantage.

Chaque ligne affiche **Heure**, **Action**, **Auteur**, **Cible** et **Résultat**. Sur un
téléphone, seules **Heure** et **Action** sont affichées ; ouvre les détails pour voir le reste.

## Filtrer les événements {#filter}

1. Saisis un mot dans **Rechercher**. Sur un écran étroit, choisis **Plus de filtres** pour voir
   les autres champs ; le nombre entre parenthèses indique combien de filtres sont actifs.
2. Renseigne n’importe lequel des autres filtres. Tous les filtres se combinent (un événement doit
   correspondre à chacun d’eux).
3. Choisis **Appliquer les filtres**. Le Studio ne charge de nouveaux résultats que lorsque tu
   appliques les filtres.
4. Pour recommencer, choisis **Réinitialiser les filtres**.

| Filtre              | Ce qu’il retient                                                                                                   | Exemple                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **Rechercher**      | Une partie de l’action, de l’ID de la cible, du nom de l’auteur ou de l’ID de l’auteur (sans distinction de casse) | `acme`, `api_key`                    |
| **Produit**         | Les événements d’un produit                                                                                        | –                                    |
| **ID du locataire** | Les événements d’un locataire (ID exact)                                                                           | `ten_01EXAMPLE`                      |
| **Action**          | Le nom exact de l’action, ou un préfixe s’il se termine par `*`                                                    | `access.api_key.revoke`, `tenancy.*` |
| **ID de l’auteur**  | Les événements d’un utilisateur ou d’une clé d’API (ID exact)                                                      | `usr_01EXAMPLE`, `key_01EXAMPLE`     |
| **Résultat**        | **Succès**, **Refusé** ou **Échec**                                                                                | –                                    |
| **Du** / **Au**     | Plage de temps dans ton heure locale. **Du** est inclus, **Au** ne l’est pas                                       | –                                    |

Le serveur accepte au maximum 100 caractères pour **Action** et 200 pour **Rechercher**.

### Partager une vue filtrée {#share}

Les filtres appliqués font partie de l’adresse de la page, par exemple
`/audit?actor_id=usr_01EXAMPLE&outcome=denied`. Copie l’adresse depuis le navigateur pour partager
cette vue précise ou l’ajouter à tes favoris. La personne qui la reçoit ne voit que les événements
que ses propres autorisations lui permettent de voir.

## Lire les détails d’un événement {#event-detail}

1. Choisis le bouton de détails en fin de ligne (**Afficher les détails de …**).
2. Un panneau latéral s’ouvre avec tous les champs de l’événement et ses **Détails**.

| Champ                                               | Signification                                                                                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID de l’événement**                               | ID de l’événement d’audit (`aud_…`)                                                                                                                                                        |
| **Heure**                                           | Moment où le serveur a enregistré l’événement                                                                                                                                              |
| **Action**                                          | Ce qui s’est passé, sous la forme `module.object.verb`                                                                                                                                     |
| **Auteur** / **Type d’auteur** / **ID de l’auteur** | Qui a agi. Types : `user`, `api_key`, `system` (le serveur lui-même, par exemple une tâche planifiée) et `anonymous` (personne n’était connecté, par exemple lors d’une connexion échouée) |
| **Produit** / **Locataire**                         | Où cela s’est passé ; vide pour les événements à l’échelle de l’installation                                                                                                               |
| **Cible**                                           | L’objet concerné : type et ID (par exemple `api_key · key_01EXAMPLE`)                                                                                                                      |
| **Résultat**                                        | Voir [Résultats](#outcomes)                                                                                                                                                                |
| **ID de requête**                                   | Le `X-Request-ID` de la requête HTTP à l’origine de l’événement                                                                                                                            |
| **Adresse IP**                                      | L’adresse du client telle que le serveur la voit (derrière un proxy, uniquement si le proxy est de confiance)                                                                              |
| **Détails**                                         | Données supplémentaires au format JSON, par exemple les champs modifiés ou le motif d’un refus                                                                                             |

> [!NOTE]
> Le serveur retire les secrets (mots de passe, jetons, clés) des détails avant de les stocker. Tu
> ne trouveras jamais de secret dans le journal d’audit.

### Résultats {#outcomes}

| Résultat   | Signification                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Succès** | L’action a été effectuée.                                                                                                                                                                                |
| **Refusé** | Le serveur a refusé l’action, par exemple une connexion avec un mot de passe erroné, un changement de mot de passe avec un mot de passe actuel erroné ou un premier mot de passe sans connexion récente. |
| **Échec**  | L’action a été tentée mais n’a pas abouti.                                                                                                                                                               |

Une requête refusée pour cause d’autorisations manquantes n’est généralement **pas** enregistrée :
le client reçoit seulement `403`. Cherche les événements **Refusé** principalement autour de la
connexion et des mots de passe.

## Retracer une requête grâce à son ID de requête {#request-id}

Chaque message d’erreur du Studio affiche un **ID de requête** sous **Détails techniques**. Pour
savoir ce que cette requête a modifié :

1. Copie l’ID de requête depuis le message d’erreur.
2. La recherche de l’audit ne couvre pas les ID de requête. Restreins la liste avec **Du** /
   **Au** (et l’**ID de l’auteur**, si tu le connais), ouvre les événements candidats et compare
   leur **ID de requête**.
3. Si aucun événement ne correspond, la requête n’a rien modifié qui soit audité. Transmets l’ID
   de requête à ton opérateur : les journaux du serveur portent le même ID.

Voir [ID de requête](help:api-basics#request-ids) pour comprendre le fonctionnement des ID de
requête.

## Ce qui est enregistré {#what-is-recorded}

Les actions sont nommées `module.object.verb`. Exemples typiques :

| Domaine                                 | Actions                                                                                                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connexion et comptes                    | `identity.login`, `identity.logout`, `identity.password.change`, `identity.session.revoke`, `identity.session.revoke_all`, `identity.platform_role.set`, `identity.setup.complete` |
| Produits, locataires, membres           | `tenancy.product.create`, `tenancy.tenant.create`, `tenancy.tenant.update`, `tenancy.member.set`, `tenancy.invitation.create`, `tenancy.invitation.accept`                         |
| Accès                                   | `access.role.create`, `access.api_key.create`, `access.api_key.rotate`, `access.api_key.revoke`                                                                                    |
| Données et fichiers                     | `data.record.delete`, `storage.file.upload`, `storage.file.delete`, `storage.policy.update`                                                                                        |
| Événements et tâches                    | `events.job.enqueue`, `events.job.cancel`, `events.schedule.update`, `events.webhook.rotate_secret`                                                                                |
| Utilisation, facturation, notifications | `usage.quota.set`, `billing.plan.update`, `notify.template.update`, `notify.message.enqueue`                                                                                       |

Tout n’est pas un événement d’audit : les lectures ne sont pas enregistrées, pas plus que la
création ou la modification d’un enregistrement (sa suppression l’est). Les backends de produits
construits sur Axentra peuvent ajouter leurs propres actions.

## Conservation {#retention}

Les événements d’audit sont conservés pendant `observability.audit_retention_days` (par défaut
365 jours). Ils ne sont supprimés que lorsque l’opérateur exécute la tâche de maintenance
`axentra maintenance purge`. Tant que cette tâche n’a pas tourné, les événements plus anciens
restent visibles. La valeur configurée est affichée sous **Maintenance et conservation** sur la
page [Supervision](help:health-monitoring#retention).

## Bon à savoir {#good-to-know}

- La liste est triée par heure, les plus récents d’abord ; tu ne peux pas changer l’ordre.
- Les heures sont affichées dans le fuseau horaire de ton navigateur ; l’API stocke et filtre en
  UTC.
- Le Studio ne propose pas d’export. Les développeurs peuvent lire le journal avec l’API
  (`GET /v1/audit`, pagination par curseur) ou les SDK (`audit.list`, `audit.iter`) ; voir
  [Bases de l’API](help:api-basics#pagination).

## Dépannage {#troubleshooting}

- **Non autorisé** à l’ouverture de la page : tu n’as pas `audit:read` dans le produit sélectionné. Choisis un produit où tu as un rôle de produit, ou demande l’accès à un propriétaire du produit ou à un administrateur de la plateforme.
- **Aucun événement correspondant** : les filtres sont trop restrictifs. Vérifie que l’**Action** est orthographiée exactement (les actions s’écrivent `tenancy.tenant.create`, pas `tenant.created`) ou termine-la par `*`, élargis **Du** / **Au**, ou choisis **Réinitialiser les filtres**.
- **Aucun événement d’audit pour l’instant** alors que des choses ont changé : tu consultes un seul produit, mais la modification concernait toute l’installation (par exemple une connexion). Ces événements nécessitent `platform:audit`. Vérifie aussi que l’action fait partie de celles qui sont enregistrées (voir [Ce qui est enregistré](#what-is-recorded)).
- **L’événement complet n’a pas pu être chargé** (dans le panneau de détails) : l’événement a été supprimé par la tâche de conservation, ou il appartient à un produit (ou à aucun produit) que tu n’as pas le droit de lire. Le serveur répond `404` dans les deux cas, pour ne pas révéler si l’événement existe. Le Studio affiche à la place les valeurs de la liste.
- **Vérifie ta saisie** : une valeur de filtre a été refusée, par exemple une **Action** de plus de 100 caractères ou une recherche (**Rechercher**) de plus de 200 caractères.
