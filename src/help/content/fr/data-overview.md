---
title: Aperçu des données
summary: Vois quelles collections d’enregistrements et quels fichiers un produit stocke, combien de stockage chaque locataire utilise et quels paramètres de stockage et de conservation le serveur applique.
keywords: données, stockage, collections, statistiques, quota, espace disque, conservation, rétention, sauvegarde, politique de types de contenu, types de fichiers bloqués, backend de stockage, S3, stockage local
---

L’**Aperçu des données** montre, pour le produit actuel, ce qui est stocké et selon quelles règles : les
collections d’enregistrements dans lesquelles écrivent les locataires, le stockage de fichiers utilisé par chaque locataire par rapport à son
quota, la configuration du stockage du serveur et les durées de conservation que le serveur indique. C’est une
page en lecture seule : elle ne modifie rien. Tu modifies les quotas sur l’écran [Fichiers](help:files#quota) et
la politique de types de contenu dans l’onglet **Fichiers** du produit (voir
[Définir la politique de types de contenu](#content-type-policy)).

Les opérateurs de produit l’utilisent pour répondre à des questions comme « quel locataire approche de son quota de stockage ? »,
« quelles collections existent ? » et « combien de temps le serveur conserve-t-il les événements d’audit ? ».

> [!IMPORTANT]
> La page exige le module serveur `data` (enregistrements). La carte **Stockage de fichiers** exige aussi le
> module `storage`. Les statistiques exigent l’autorisation `collections:read`, accordée par les rôles de produit
> **Product owner**, **Product admin**, **Support** et **Product viewer**, ainsi que par les rôles
> sur la plateforme. Les cartes **Configuration du stockage** et **Conservation** exigent `platform:settings` ou
> `product:manage`. Consulte les [rôles et autorisations](help:roles-permissions).

## Ouvrir l’aperçu des données {#open}

1. Sélectionne un produit.
2. Dans la barre latérale, ouvre **Données et stockage** et choisis **Aperçu des données**
   ([ouvrir l’écran](app:dataOverview)).

Si la barre latérale marque l’entrée comme **Désactivé**, le module `data` n’est pas activé sur le serveur. Un
opérateur active les modules dans la [configuration du serveur](help:server-configuration).

## Ce qu’affiche la page {#what-you-see}

| Carte                             | Contenu                                                                                               | Affichée quand                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Collections d’enregistrements** | Nombre de collections et d’enregistrements, puis une ligne par collection                             | Tu as `collections:read`                                                        |
| **Stockage de fichiers**          | Octets et fichiers utilisés par l’ensemble du produit, les quotas par défaut, une ligne par locataire | Tu as `collections:read` et le module `storage` est activé                      |
| **Configuration du stockage**     | Backend, taille de fichier maximale, types autorisés et bloqués                                       | Tu as `platform:settings` ou `product:manage` et le module `storage` est activé |
| **Conservation**                  | Durée pendant laquelle le serveur conserve les événements d’audit et les tâches terminées             | Tu as `platform:settings` ou `product:manage`                                   |

Sans `collections:read`, la page affiche **Statistiques du produit indisponibles**. Les membres d’un locataire
(rôles **Owner**, **Admin**, **Member**, **Viewer** d’un locataire) n’ont pas cette autorisation : elle
révélerait les données des autres locataires. Ils travaillent avec les données de leur propre locataire dans
[Enregistrements](help:records) et [Fichiers](help:files).

## Collections d’enregistrements {#collections}

Une _collection_ est un groupe nommé d’enregistrements JSON, comme `orders` ou `contacts`. Les collections ne sont
ni créées ni configurées séparément : une collection existe dès qu’un enregistrement y est écrit, et
disparaît quand son dernier enregistrement est supprimé. Consulte les [enregistrements](help:records#collections).

Le tableau liste toutes les collections du produit, tous locataires confondus :

| Colonne                   | Signification                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------- |
| **Collection**            | Nom de la collection. Sélectionne-la pour l’ouvrir sur l’écran **Enregistrements**. |
| **Enregistrements**       | Nombre d’enregistrements de cette collection, additionnés sur tous les locataires.  |
| **Locataires**            | Nombre de locataires qui ont au moins un enregistrement dans cette collection.      |
| **Dernière modification** | Heure de la création ou de la mise à jour la plus récente dans cette collection.    |

Si le tableau est vide (**Aucune collection pour l’instant**), aucun enregistrement n’a encore été écrit dans ce produit.

## Stockage par locataire {#storage-per-tenant}

La carte **Stockage de fichiers** commence par quatre chiffres : **Stockage utilisé** et **Fichiers** pour l’ensemble du
produit (fichiers actifs uniquement), ainsi que le **Quota de stockage par défaut** et le **Quota de fichiers par défaut** qui
s’appliquent à tout locataire sans quota propre.

Le tableau **Utilisation du stockage par locataire** comporte une ligne par locataire (50 par page, **Charger plus** pour
le reste) :

| Colonne                                       | Signification                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Locataire**                                 | Sélectionne le nom pour ouvrir les fichiers du locataire.                                                                                                                                                                |
| **Stockage** / **Fichiers**                   | Octets et nombre de fichiers actifs du locataire.                                                                                                                                                                        |
| **Quota de stockage** / **Quota de fichiers** | La limite effective et la part utilisée. **Illimité** signifie qu’aucune limite ne s’applique. Le badge **Locataire** signale un quota défini pour ce locataire ; sans lui, le locataire hérite de la valeur par défaut. |

### Comment le quota effectif est déterminé {#quotas}

Chacune des deux limites (octets et fichiers) est déterminée séparément, dans cet ordre :

1. Le quota propre du locataire, défini avec **Modifier le quota** sur l’écran [Fichiers](help:files#quota).
2. La valeur par défaut du produit : `quota_bytes` / `quota_files` dans la section `storage` des paramètres
   du produit (page du produit, onglet **Paramètres**, champ **Paramètres (JSON)**).
3. La valeur par défaut de l’installation : `storage.default_quota_bytes` / `storage.default_quota_files` dans
   la configuration du serveur.
4. Sinon : illimité.

```json
{ "storage": { "quota_bytes": 10737418240, "quota_files": 10000 } }
```

L’exemple définit une valeur par défaut du produit de 10 Gio (en octets) et de 10 000 fichiers.

> [!NOTE]
> L’utilisation compte les fichiers _actifs_. Un fichier dont la date d’expiration est passée disparaît immédiatement, mais
> ses octets continuent d’être comptés jusqu’au passage de la purge du serveur (un opérateur planifie
> `axentra storage purge`, par exemple toutes les 15 minutes).

## Configuration du stockage {#storage-configuration}

Cette carte affiche les paramètres effectifs du serveur. Ils font partie de la configuration du serveur et
ne peuvent pas être modifiés dans Studio.

| Paramètre                      | Effet                                                                                                                                                                | Valeur par défaut |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **Backend**                    | Emplacement de stockage du contenu des fichiers : `local` (un répertoire sur le serveur) ou `s3` (Amazon S3 ou un service compatible S3).                            | `local`           |
| **Taille de fichier maximale** | Limite stricte par fichier, vérifiée pendant la réception du téléversement.                                                                                          | 50 Mio            |
| **Types autorisés**            | Liste des types de contenu autorisés (`image/png`, `image/*`). **Tous les types, sauf les types bloqués** signifie que la liste est vide.                            | vide              |
| **Types bloqués**              | Ce qui arrive aux exécutables, au HTML, au SVG et aux scripts dans ce produit, et si ce comportement est **Défini pour ce produit** ou **Hérité de l’installation**. | refuser           |

Changer de backend ne déplace pas les fichiers existants. Pour les développeurs et les opérateurs, toutes les clés de la
section `[storage]` sont décrites dans la [configuration du serveur](help:server-configuration).

## Définir la politique de types de contenu {#content-type-policy}

Certains types de fichiers peuvent exécuter du code quand quelqu’un les ouvre : exécutables, HTML, XHTML, SVG, JavaScript,
scripts shell et PHP. Axentra les _bloque_. La politique de types de contenu décide, par produit, de ce qu’il
advient d’un téléversement bloqué : il est soit refusé, soit stocké comme _pièce jointe inerte_, c’est-à-dire conservé comme
`application/octet-stream` opaque, qui est toujours téléchargé et jamais affiché.

1. Ouvre le produit : **Produits**, puis le nom du produit.
2. Choisis l’onglet **Fichiers**. (L’onglet est masqué quand le module `storage` n’est pas activé.)
3. Sous **Politique de types de contenu des fichiers**, choisis le comportement et les listes (tableau ci-dessous).
4. Choisis **Enregistrer les modifications**.

| Paramètre                                             | Effet                                                                                                                                                                                                                                                                                                                                                         | Valeurs autorisées / par défaut                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Types de fichiers bloqués**                         | **Refuser le téléversement** (la personne qui téléverse reçoit une erreur) ou **Stocker comme pièce jointe inerte**. **Valeur par défaut de l’installation** suit le paramètre du serveur `storage.store_blocked_as_inert`.                                                                                                                                   | Par défaut : valeur par défaut de l’installation                           |
| **Extensions acceptées comme pièces jointes inertes** | Extensions bloquées qui sont conservées comme pièces jointes inertes même quand les téléversements sont par ailleurs refusés. La décision se fonde sur l’extension du nom de fichier, y compris quand c’est le contenu qui est bloqué (un script `#!` nommé `run.sh` est conservé si `sh` figure dans la liste ; le même contenu nommé `run.txt` est refusé). | Séparées par des virgules, sans point : `html, sh`. 100 entrées au maximum |
| **Extensions bloquées en plus**                       | Extensions bloquées en plus de la liste intégrée.                                                                                                                                                                                                                                                                                                             | `py, rb`. 100 entrées au maximum                                           |
| **Types de contenu bloqués en plus**                  | Types de contenu bloqués en plus de la liste intégrée.                                                                                                                                                                                                                                                                                                        | `text/x-python`. 100 entrées au maximum                                    |

La section **Toujours bloqués** liste les extensions et les types de contenu intégrés. Un produit peut
en bloquer davantage ou conserver les fichiers bloqués comme pièces jointes inertes, mais il ne peut jamais les débloquer.

> [!IMPORTANT]
> Consulter la politique exige `product:read` ; la modifier exige `product:manage` (rôles
> **Product owner** et **Product admin**). Les produits archivés sont en lecture seule.

> [!NOTE]
> La liste **Types autorisés** de l’installation s’applique toujours après la politique : si la liste d’autorisation
> ne contient pas `application/octet-stream`, les fichiers inertes sont eux aussi refusés.

La politique est vérifiée de trois façons : par le type de contenu déclaré, par l’extension du nom de fichier
et par les premiers octets du contenu (exécutables, HTML, SVG et tout fichier qui commence par `#!`).
Renommer un fichier avec une extension bloquée suit la même politique. Les modifications sont consignées dans le journal
d’audit sous `storage.policy.update`. Détails pour les personnes qui téléversent : [Fichiers](help:files#content-types).

## Conservation {#retention}

| Paramètre            | Signification                                                                                                                                                                                    | Valeur par défaut |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| **Journal d’audit**  | Nombre de jours pendant lesquels le serveur conserve les événements d’audit (`observability.audit_retention_days`).                                                                              | 365 jours         |
| **Tâches terminées** | Nombre de jours pendant lesquels le serveur conserve les tâches terminées (réussies, échouées, mortes ou annulées) et les livraisons de webhooks terminées (`observability.job_retention_days`). | 30 jours          |

Les enregistrements et les fichiers n’ont pas de durée de conservation : ils restent jusqu’à ce que quelqu’un les supprime, que la
date d’expiration propre d’un fichier soit atteinte, ou que le locataire soit supprimé (ce qui supprime toutes ses données).

## Sauvegardes {#backups}

La carte **Les sauvegardes ne sont pas signalées** est volontaire : l’API n’indique ni l’état des sauvegardes ni la durée de
conservation des métadonnées des fichiers supprimés. Les deux relèvent de l’exploitation du serveur. Par défaut, la
purge supprime les lignes de métadonnées des fichiers supprimés au bout de 30 jours ; les sauvegardes de la base de données et le journal
d’audit conservent plus longtemps le nom, la taille et la somme de contrôle d’un fichier supprimé.

## Dépannage {#troubleshooting}

**Statistiques du produit indisponibles.** Tes rôles n’accordent pas `collections:read`. Demande un rôle de produit à un
propriétaire du produit, ou utilise [Enregistrements](help:records) et [Fichiers](help:files) pour ton locataire.

**Module de stockage non activé.** Le serveur n’exécute pas le module `storage` : aucun fichier ne peut donc être
stocké. Un opérateur ajoute `storage` aux modules activés ; consulte la
[référence des modules](help:modules-reference).

**Les cartes Configuration du stockage et Conservation sont absentes.** Elles exigent `platform:settings` ou
`product:manage`. Les lecteurs du produit et l’équipe de support ne les voient pas.

**Un locataire affiche une utilisation supérieure à la somme de ses fichiers.** Les fichiers expirés sont comptés jusqu’à la prochaine purge.
Demande à un opérateur si `axentra storage purge` s’exécute régulièrement.

**L’enregistrement de la politique de types de contenu échoue avec « Modifié entre-temps ».** Une autre personne a modifié le
produit (ses paramètres, son nom ou sa politique) après que tu as ouvert la page. Recharge la page et applique de nouveau ta
modification.

**L’enregistrement de la politique échoue avec « Vérifie ta saisie ».** Une entrée n’est pas une extension valide
(lettres minuscules, chiffres, `_`, `+` ou `-`, 16 caractères au maximum, sans point) ou un type de contenu valide (`type/subtype`), ou une liste dépasse 100
entrées. Le message sous le champ précise le problème.

**Introuvable à l’ouverture de la page.** Le module `data` est désactivé, ou le produit est archivé et
tu n’es pas administrateur de la plateforme.
