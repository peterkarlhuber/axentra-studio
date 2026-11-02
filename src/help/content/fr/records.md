---
title: Enregistrements
summary: Parcours, filtre, crée, modifie et supprime les enregistrements JSON que les locataires stockent dans des collections, et résous les conflits « modifié entre-temps ».
keywords: enregistrements, données, JSON, documents, collection, entrées, lignes, base de données, filtre, version, conflit, 412, If-Match, concurrence optimiste
---

Les _enregistrements_ sont de petits objets JSON que ton application stocke via l’API d’Axentra, par
exemple des commandes, des notes ou des réglages, sans avoir besoin de sa propre table de base de données. Chaque enregistrement appartient
à un seul locataire et à une seule _collection_ (un groupe nommé comme `orders`). L’écran
**Enregistrements** te permet d’examiner ces données, de trouver des enregistrements d’après leur contenu et, avec l’autorisation d’écriture,
de corriger ou d’ajouter des enregistrements à la main.

> [!IMPORTANT]
> L’écran exige le module serveur `data`. La lecture exige `records:read` dans le locataire ; créer,
> modifier et supprimer exige `records:write`. Les rôles de locataire **Owner**, **Admin** et **Member**
> accordent les deux ; **Viewer** ne fait que lire. Les rôles de produit **Product owner** et **Product admin** peuvent
> écrire dans tous les locataires ; **Support** et **Product viewer** lisent dans tous les locataires. La liste de toutes les
> collections exige `collections:read` (rôles de produit uniquement). Consulte les
> [rôles et autorisations](help:roles-permissions).

## Collections et enregistrements {#collections}

- Une **collection** est créée par l’écriture de son premier enregistrement et disparaît quand son dernier
  enregistrement est supprimé. Il n’y a rien à configurer. Les noms utilisent des lettres minuscules, des chiffres et des
  tirets bas, commencent par une lettre et comptent au plus 63 caractères (`orders`, `support_notes`).
- Un **enregistrement** possède un **ID** (`rec_…`), ses **Données** (un objet JSON), une **Version** (commence à 1 et
  augmente à chaque modification), des dates **Créé le**/**Modifié le**, ainsi que l’utilisateur ou la clé d’API qui
  l’a créé et modifié en dernier (**Créé par**, **Modifié par**).
- Le même nom de collection dans deux locataires contient deux ensembles d’enregistrements distincts. Studio affiche toujours
  un seul locataire à la fois ; le serveur impose la séparation.

## Parcourir les enregistrements {#browse}

1. Ouvre **Données et stockage** › **Enregistrements** ([ouvrir l’écran](app:records)).
2. Choisis un **Locataire** en haut.
3. Choisis une collection dans la liste **Collections** à gauche. Le nombre affiché à côté compte ses
   enregistrements dans tous les locataires.

Le tableau affiche l’**ID**, un aperçu abrégé des **Données**, la **Version**, **Créé le** et **Modifié le**,
les plus récents d’abord, 50 par page ; **Charger plus** récupère la page suivante. Sélectionne l’icône en forme d’œil
(**Afficher l’enregistrement …**) pour ouvrir l’enregistrement avec tous ses champs et le JSON complet et mis en forme.

> [!TIP]
> Sur la page d’un locataire, **Parcourir les enregistrements** ouvre cet écran avec le locataire déjà sélectionné. Dans
> l’[Aperçu des données](help:data-overview#collections), sélectionner une collection l’ouvre ici.

Si tu n’as pas de rôle de produit, Studio ne peut pas lister les collections du produit. Saisis plutôt le nom de la collection
sous **Nom de la collection** et choisis **Ouvrir**.

### Trier {#sort}

Sélectionne les en-têtes de colonne **ID**, **Créé le** ou **Modifié le** pour trier ; sélectionne-les de nouveau pour inverser l’ordre.
Le tri par **Données** n’est pas possible.

## Filtrer par contenu {#filter}

1. Sous **Champ**, saisis le nom d’un champ de premier niveau du JSON, par exemple `status`.
2. Sous **Égal à**, saisis la valeur, par exemple `open`.
3. Choisis **Ajouter un filtre**. Le filtre apparaît sous forme de puce ; le **×** d’une puce le supprime.

Plusieurs filtres doivent tous correspondre. Les valeurs sont lues comme du JSON dans la mesure du possible : `true`, `42`, `null`,
`"42"` ou `{"city": "Graz"}` correspondent avec leur type, tout le reste (`open`) correspond en tant que texte. Ainsi,
`total` = `12` trouve `{"total": 12}` mais pas `{"total": "12"}`.

Un filtre est une vérification d’_inclusion_ : une valeur objet correspond quand le champ de l’enregistrement contient au
moins ces clés. `address` = `{"city": "Graz"}` trouve `{"address": {"city": "Graz", "zip":
"8010"}}`. Les noms de champ ne peuvent contenir que des lettres, des chiffres et des tirets bas : filtre donc les champs imbriqués
au moyen d’une valeur objet, comme montré ci-dessus.

## Créer un enregistrement {#create}

1. Choisis le locataire (et, éventuellement, la collection).
2. Choisis **Nouvel enregistrement**.
3. Sous **Collection**, conserve ou saisis le nom de la collection. Un nouveau nom crée la collection.
4. Sous **Données**, saisis un objet JSON, par exemple :

   ```json
   { "status": "open", "total": 12, "customer": { "name": "Acme" } }
   ```

5. Choisis **Créer l’enregistrement**. Studio passe à la collection de l’enregistrement.

L’ID, la version et les dates sont définis par le serveur ; ne les mets pas dans les données.

## Modifier un enregistrement {#edit}

1. Ouvre l’enregistrement (icône en forme d’œil) et choisis **Modifier**.
2. Modifie le JSON sous **Données** et choisis **Enregistrer les modifications**.

L’enregistrement **remplace l’objet en entier** : les champs que tu retires du JSON sont retirés de
l’enregistrement. La collection ne peut pas être modifiée ; pour déplacer un enregistrement, crée-le dans l’autre collection et
supprime l’ancien.

### Versions et conflits {#versions}

Studio indique au serveur quelle version tu as modifiée (HTTP `If-Match`). Si quelqu’un d’autre, une personne
ou ton application, a modifié ou supprimé l’enregistrement après que tu l’as ouvert, le serveur refuse la
modification avec **Modifié entre-temps** (HTTP 412) au lieu d’écraser silencieusement l’autre
modification. Cela vaut aussi pour la suppression.

Pour résoudre le conflit : ferme la boîte de dialogue, recharge la liste, rouvre l’enregistrement, applique ta modification aux
données actuelles et enregistre.

## Supprimer un enregistrement {#delete}

1. Ouvre l’enregistrement et choisis **Supprimer l’enregistrement**.
2. Confirme avec **Supprimer l’enregistrement**.

> [!CAUTION]
> La suppression est définitive ; il n’y a pas de corbeille. Le journal d’audit garde la trace de la suppression de l’enregistrement
> (`data.record.delete`), mais pas ses données.

## Paramètres et limites {#limits}

| Élément           | Règle                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Nom de collection | `^[a-z][a-z0-9_]{0,62}$` : minuscules, chiffres, tirets bas, commence par une lettre, 63 caractères au maximum |
| Données           | Un objet JSON (pas de tableau ni de valeur simple), 256 Kio au maximum une fois sérialisé                      |
| Champ de filtre   | Lettres, chiffres, tiret bas, commence par une lettre ou un tiret bas, 63 caractères au maximum                |
| Tri               | `id`, `created_at`, `updated_at`, croissant ou décroissant                                                     |
| Taille de page    | 50 dans Studio ; l’API accepte un paramètre `limit`                                                            |

## Pour les développeurs {#api}

Studio utilise la même API que ton application. `C = /v1/products/{product_id}/tenants/{tenant_id}/records/{collection}` :

| Méthode et chemin                           | Autorisation       | Rôle                                               |
| ------------------------------------------- | ------------------ | -------------------------------------------------- |
| `GET /v1/products/{product_id}/collections` | `collections:read` | Collections avec leurs effectifs                   |
| `GET C?where=&sort=&limit=&cursor=`         | `records:read`     | Liste ; `where` est un objet JSON (inclusion)      |
| `GET C/{record_id}`                         | `records:read`     | Un enregistrement ; `ETag` correspond à la version |
| `POST C` (corps : l’objet de données)       | `records:write`    | Création (201)                                     |
| `PUT C/{record_id}`, `If-Match`             | `records:write`    | Remplacement des données                           |
| `DELETE C/{record_id}`, `If-Match`          | `records:write`    | Suppression (204)                                  |

```http
PUT /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/records/orders/rec_01EXAMPLE
If-Match: "3"
Content-Type: application/json

{"status": "shipped", "total": 12}
```

Sans `If-Match`, le serveur écrase sans condition. Chaque création, remplacement et suppression écrit
un événement d’audit (`data.record.create`, `data.record.replace`, `data.record.delete`) avec la
collection et la version, jamais les données. Pour des données relationnelles comportant de nombreuses lignes ou des jointures, les produits
utilisent leurs propres tables plutôt que des enregistrements ; consulte les [bases de l’API](help:api-basics).

## Dépannage {#troubleshooting}

**Modifié entre-temps.** Quelqu’un a modifié ou supprimé l’enregistrement après que tu l’as ouvert. Recharge,
rouvre l’enregistrement et répète ta modification. Consulte [Versions et conflits](#versions).

**Vérifie ta saisie** lors de l’enregistrement. Le nom de la collection ou les données ne respectent pas les
[limites](#limits). Studio vérifie déjà le nom et le fait que les données forment un objet JSON ; le
message du serveur précise le problème.

**Trop volumineux.** Les données de l’enregistrement dépassent 256 Kio. Stocke les contenus volumineux sous forme de
[fichier](help:files) et ne conserve que son ID de fichier dans l’enregistrement.

**Vérifie ta saisie** lors du filtrage : un nom de champ contient un point ou d’autres caractères qui
ne sont pas autorisés. Filtre les valeurs imbriquées avec une valeur objet (voir [Filtrer par contenu](#filter)).

**La liste Collections affiche une erreur ou « Non autorisé ».** Lister les collections exige
`collections:read`, que seuls les rôles de produit possèdent. Saisis plutôt le nom de la collection sous **Nom de
la collection**.

**Nouvel enregistrement, Modifier et Supprimer l’enregistrement sont absents.** Ton rôle n’accorde pas `records:write` dans
ce locataire, ou aucun locataire n’est encore sélectionné.

**Introuvable.** L’enregistrement a été supprimé, le locataire est suspendu (seuls les administrateurs de la plateforme peuvent
accéder aux locataires suspendus), ou tu n’as pas accès à ce locataire.

**Aucun enregistrement correspondant.** Retire les filtres un par un. N’oublie pas que `12` et `"12"` sont des
valeurs différentes.
