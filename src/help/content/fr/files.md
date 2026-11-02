---
title: Fichiers
summary: Téléverse, trouve, télécharge, partage et supprime les fichiers d’un locataire, et gère son quota de stockage, les limites de taille et la politique de types de contenu.
keywords: fichiers, téléverser, téléversement, upload, télécharger, pièces jointes, documents, stockage, quota, espace disque, taille de fichier, type de contenu, type MIME, lien de téléchargement, lien de partage, URL signée, URL pré-signée, S3, étiquettes, métadonnées, expiration, inerte, types bloqués
---

L’écran **Fichiers** affiche les fichiers qu’un locataire a stockés via le module de stockage d’Axentra :
documents, images, exports ou toute autre pièce jointe que ton application téléverse. Tu peux téléverser des fichiers
à la main, les trouver par nom, par type ou par étiquette, les télécharger, créer un lien de téléchargement temporaire,
les renommer et les supprimer. L’écran indique aussi quelle part de son quota de stockage le locataire
utilise.

Un fichier appartient toujours à un seul locataire. Son contenu ne peut plus être modifié après le téléversement ;
pour remplacer un fichier, téléverses-en un nouveau et supprime l’ancien. Le nom et les étiquettes peuvent être
modifiés.

> [!IMPORTANT]
> L’écran exige le module serveur `storage`. Consulter et télécharger exige `files:read` dans
> le locataire ; téléverser, modifier et supprimer exige `files:write`. Les rôles de locataire **Owner**,
> **Admin** et **Member** accordent les deux, **Viewer** ne fait que lire. Rôles de produit : **Product owner** et
> **Product admin** peuvent écrire dans tous les locataires, **Support** et **Product viewer** lisent. Modifier le
> quota d’un locataire exige `tenants:update` (**Product owner**, **Product admin**). Consulte les
> [rôles et autorisations](help:roles-permissions).

## Parcourir les fichiers d’un locataire {#browse}

1. Ouvre **Données et stockage** › **Fichiers** ([ouvrir l’écran](app:files)).
2. Choisis un **Locataire**.

La page affiche l’**Utilisation du stockage** du locataire et la liste **Fichiers stockés**, les plus récents d’abord, 50 par
page. Seuls les fichiers actifs et non expirés sont listés. Sélectionne les en-têtes de colonne **Nom**, **Taille** ou
**Téléversé le** pour trier. Sélectionne le nom d’un fichier pour ouvrir ses [détails](#details) ; le menu **…** de chaque
ligne propose **Détails**, **Télécharger** et **Supprimer le fichier**.

### Filtrer les fichiers {#filter}

| Filtre                                                              | Ce qui correspond                                                                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Le nom contient**                                                 | Une partie du nom, sans tenir compte de la casse.                                                                                                                   |
| **Type de contenu**                                                 | Un type exact (`application/pdf`) ou une famille (`image/*`).                                                                                                       |
| **Téléversé par**                                                   | L’ID de l’utilisateur (`usr_…`) ou de la clé d’API qui a téléversé le fichier.                                                                                      |
| **Étiquette** et **Égal à**, puis **Ajouter un filtre d’étiquette** | Les fichiers dont les étiquettes contiennent cette clé avec cette valeur. `true`, `42` et `null` correspondent avec leur type, tout autre texte en tant que chaîne. |

Tous les filtres doivent correspondre. Supprime un filtre d’étiquette avec le **×** de sa puce.

## Téléverser un fichier {#upload}

1. Choisis le locataire et sélectionne **Téléverser un fichier**.
2. Sous **Fichier**, choisis le fichier. Studio affiche son nom, sa taille et son type, ainsi que les règles que le
   serveur applique (taille maximale, types autorisés et bloqués).
3. Champs facultatifs :
   - **Nom d’affichage** : le nom affiché dans les listes et utilisé pour les téléchargements. Par défaut, le nom du fichier.
   - **Étiquettes (métadonnées)** : un objet JSON plat comme `{"kind": "invoice", "year": 2026}` (voir
     [Étiquettes](#labels)).
   - **Expire le** : passé ce moment, le fichier est masqué puis supprimé ultérieurement (voir
     [Expiration](#expiry)).
4. Sélectionne **Téléverser**. Une barre de progression montre le transfert ; **Annuler le téléversement** l’interrompt.

Le serveur revérifie tout, quoi que Studio affiche. Les fichiers vides sont refusés.

### Limite de taille {#size-limit}

Chaque fichier peut atteindre au plus la **Taille de fichier maximale** du serveur (50 Mio par défaut, définie par l’opérateur dans
`storage.max_file_bytes`). Le serveur arrête la lecture dès qu’un téléversement la dépasse. Studio
avertit avant le téléversement s’il connaît la limite ; il ne la connaît que si tu as le droit de lire les paramètres du serveur
(`platform:settings` ou `product:manage`). Sinon, la boîte de dialogue indique que le serveur vérifie la taille,
le type et le quota pendant le téléversement.

### Types autorisés et bloqués {#content-types}

Deux règles déterminent si un type de fichier est accepté :

- **Types bloqués.** Les exécutables, le HTML, le XHTML, le SVG, le JavaScript, les scripts shell et PHP et les fichiers
  similaires sont bloqués ; ils sont reconnus par leur type déclaré, leur extension et leur contenu (y compris tout fichier qui
  commence par `#!`). Selon la politique de types de contenu du produit, un fichier bloqué est refusé
  ou stocké comme [pièce jointe inerte](#inert). Les gestionnaires du produit définissent la politique dans l’onglet
  **Fichiers** du produit ; consulte [Définir la politique de types de contenu](help:data-overview#content-type-policy).
- **Types autorisés.** Si l’opérateur a configuré une liste d’autorisation (`storage.allowed_content_types`),
  seuls ces types sont acceptés, par exemple `image/*, application/pdf`. Sans liste, tous les
  types sont acceptés, sauf les types bloqués.

Le type annoncé par le navigateur n’est qu’une indication : le serveur examine les premiers octets et utilise le
type détecté quand le type déclaré est absent, générique ou manifestement erroné.

### Pièces jointes inertes {#inert}

Quand la politique conserve un fichier bloqué au lieu de le refuser, le fichier est stocké comme
`application/octet-stream` et marqué **Stocké inerte** dans ses détails, avec le type sous lequel il a été
téléversé. Un tel fichier n’est jamais que téléchargé comme pièce jointe, jamais ouvert dans le navigateur.
Renommer un fichier avec une extension bloquée (par exemple `.html`) suit la même politique : le renommage est
refusé, ou le fichier devient inerte.

### Étiquettes {#labels}

Les étiquettes sont tes propres paires clé/valeur pour trouver et regrouper des fichiers, comme `{"kind": "invoice"}`.
Règles : un objet JSON plat, 64 clés au maximum ; des clés de 1 à 64 caractères composées de lettres, de chiffres et de
`_ . : -` ; des valeurs de type texte (1024 caractères au maximum), nombre, `true`/`false` ou `null` ; 8 Kio au maximum
au total. Ne mets pas de secrets dans les noms ni dans les étiquettes : ils apparaissent dans le journal d’audit.

## Quota de stockage {#quota}

La carte **Utilisation du stockage** compare les octets et le nombre de fichiers du locataire à son quota
effectif. La jauge passe à une couleur d’avertissement à 80 % et à une couleur critique à 95 %. La ligne en dessous
indique l’origine du quota : **Quota défini pour ce locataire**, **Quota hérité du produit ou de la valeur par défaut
du serveur**, ou **Aucun quota : illimité**. La façon dont les valeurs par défaut sont déterminées est expliquée dans
l’[Aperçu des données](help:data-overview#quotas).

Quand un quota est atteint, les téléversements suivants sont refusés ; les fichiers existants restent.

### Modifier le quota d’un locataire {#edit-quota}

1. Sur la carte **Utilisation du stockage**, sélectionne **Modifier le quota**.
2. Saisis une **Limite de stockage** avec son **Unité** (Mio, Gio, Tio) et/ou une **Limite de fichiers**.
   Laisse un champ vide pour hériter de la valeur par défaut du produit ou du serveur ; `0` bloque tous les téléversements.
3. Sélectionne **Enregistrer les modifications**.

Une limite inférieure à l’utilisation actuelle est autorisée : les fichiers existants restent, les nouveaux téléversements sont refusés. Si
quelqu’un a modifié le quota après que tu as ouvert la boîte de dialogue, l’enregistrement est refusé avec **Modifié
entre-temps** ; recharge et réessaie. Les modifications de quota sont auditées (`storage.quota.update`).

## Détails d’un fichier {#details}

Sélectionne le nom d’un fichier pour ouvrir ses détails : **Nom**, **ID**, **Statut**, **Type de contenu**, **Stocké
inerte** (uniquement pour les fichiers inertes), **Taille**, somme de contrôle **SHA-256**, **Version**, **Téléversé par**,
**Téléversé le**, **Modifié le**, **Expire le** et les étiquettes. Le SHA-256 te permet de vérifier qu’une copie
téléchargée est identique au fichier stocké.

Le **Statut** d’un fichier listé est toujours `active`. En interne, un fichier est `pending` pendant l’écriture de ses octets
et `deleted` après sa suppression ; aucun de ces deux états n’apparaît dans la liste.

## Télécharger un fichier {#download}

Sélectionne **Télécharger** dans les détails ou dans le menu **…** de la ligne. Studio demande au serveur un
lien de téléchargement de courte durée et lance le téléchargement avec ce lien. Les fichiers sont toujours téléchargés comme
pièces jointes, jamais ouverts dans le navigateur. Les téléchargements ne sont pas consignés dans le journal d’audit.

## Partager un lien de téléchargement {#download-links}

1. Ouvre les détails du fichier et sélectionne **Créer un lien de téléchargement**.
2. Copie le **Lien de téléchargement** et transmets-le.

> [!CAUTION]
> Toute personne qui possède le lien peut télécharger le fichier jusqu’à son expiration, sans se connecter. Un lien
> ne peut pas être révoqué individuellement ; supprimer le fichier y met fin. Ne partage les liens qu’avec le
> destinataire prévu, par un canal de confiance.

### Durée de validité d’un lien {#link-expiry}

Le lien expire au moment indiqué sous **Expire le**. Studio demande toujours la durée de vie la plus longue
que le serveur autorise : `storage.signed_url_ttl_seconds`, 300 secondes (5 minutes) par défaut,
configurable entre 10 secondes et 24 heures. Un lien ne survit jamais à la date d’expiration propre du fichier.

Il existe deux sortes de liens, selon la configuration du serveur :

| Sorte                                                          | URL                                                                                                     | Cesse de fonctionner quand                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Lien Axentra signé (par défaut)                                | L’URL publique du serveur + `/v1/files/download/…`                                                      | Il expire, le fichier est supprimé ou expire, ou le locataire ou le produit est suspendu ou archivé |
| Lien S3 pré-signé (marqué **pré-signé par le stockage objet**) | Pointe directement vers le bucket S3 ; uniquement avec le backend S3 et `s3_presigned_downloads` activé | Il expire ou le fichier est supprimé. La suspension du locataire n’y met **pas** fin                |

## Renommer un fichier ou modifier ses étiquettes {#edit}

1. Ouvre les détails et sélectionne **Modifier le nom et les étiquettes**.
2. Modifie le **Nom** et/ou le JSON des **Étiquettes (métadonnées)**. Les étiquettes que tu enregistres remplacent toutes
   les étiquettes précédentes.
3. Sélectionne **Enregistrer les modifications**.

Le contenu ne peut pas être modifié. Si quelqu’un d’autre a modifié le fichier entre-temps, l’enregistrement est refusé
avec **Modifié entre-temps**.

## Supprimer un fichier {#delete}

1. Sélectionne **Supprimer le fichier** dans les détails ou dans le menu **…** de la ligne.
2. Confirme avec **Supprimer le fichier**.

Le fichier disparaît immédiatement pour tout le monde, son quota est libéré et les liens de téléchargement existants cessent
de fonctionner. Le serveur supprime ensuite l’objet stocké.

> [!CAUTION]
> La suppression est irréversible. Il s’agit d’une suppression logique au niveau du stockage : selon le
> backend, les octets peuvent rester sur le disque jusqu’à ce que l’espace soit réutilisé, ou sous forme d’anciennes versions d’objet dans un
> bucket S3 avec gestion des versions. Les sauvegardes de la base de données et le journal d’audit conservent le nom, la taille et la
> somme de contrôle du fichier. Si les fichiers supprimés doivent être irrécupérables, les opérateurs ont besoin d’un chiffrement de disque ou de règles
> de cycle de vie du bucket ; consulte la [sécurité](help:security).

## Expiration {#expiry}

Un fichier pour lequel **Expire le** est défini disparaît des listes, des détails et des liens de téléchargement dès que
ce moment est passé. La purge du serveur (`axentra storage purge`, planifiée par l’opérateur) le supprime
ensuite ; d’ici là, ses octets comptent toujours dans le quota. La date d’expiration ne peut être définie qu’au
téléversement, et ne peut plus être modifiée ensuite dans Studio.

## Backends de stockage et analyse {#backends}

L’emplacement du contenu des fichiers est un paramètre du serveur, affiché dans l’[Aperçu des données](help:data-overview#storage-configuration) :

- `local` : un répertoire sur le serveur (par défaut `./var/storage`).
- `s3` : Amazon S3 ou un service compatible S3, éventuellement avec chiffrement côté serveur.

Changer de backend ne migre pas les fichiers existants. Axentra calcule un SHA-256 pour chaque fichier,
mais il n’analyse **pas** les fichiers à la recherche de logiciels malveillants et n’inspecte pas les archives. Si tu as besoin d’une analyse,
exécute-la dans ton application ou dans une tâche après le téléversement.

## Dépannage {#troubleshooting}

**Fichier trop volumineux.** Le fichier dépasse la taille de fichier maximale du serveur. Compresse-le ou découpe-le, ou demande
à un opérateur d’augmenter `storage.max_file_bytes`.

**Type de fichier non accepté.** Le fichier est d’un type bloqué (exécutable, HTML, SVG, script), son
extension ou son contenu y ressemble, ou il ne figure pas dans la liste d’autorisation du serveur. Vérifie les règles dans
la boîte de dialogue de téléversement. Un gestionnaire du produit peut conserver les fichiers bloqués comme pièces jointes inertes
([politique de types de contenu](help:data-overview#content-type-policy)).

**Quota de stockage épuisé.** Le locataire a atteint son quota d’octets ou de fichiers. Supprime des fichiers, ou demande à un
propriétaire ou à un administrateur du produit d’[augmenter le quota](#edit-quota). Les fichiers expirés comptent jusqu’à la prochaine
purge.

**Aucun accès aux fichiers de ce locataire.** Tes rôles n’accordent pas `files:read` dans ce locataire. Demande un rôle à un
propriétaire du produit ou au propriétaire du locataire.

**Téléverser un fichier est absent.** Il te manque `files:write` dans ce locataire, ou aucun locataire n’est sélectionné.

**Conflit : le téléversement a pris trop de temps.** Le téléversement est resté inachevé plus longtemps que le délai
du serveur (une heure par défaut) et a été abandonné. Téléverse de nouveau avec une connexion plus rapide.

**Vérifie ta saisie.** Les étiquettes ne forment pas un objet JSON plat ou enfreignent les [règles des
étiquettes](#labels), ou **Expire le** est dans le passé.

**Modifié entre-temps.** Quelqu’un a renommé, réétiqueté ou supprimé le fichier, ou modifié le quota,
après que tu l’as ouvert. Recharge et recommence.

**Un lien de téléchargement renvoie « Introuvable ».** Il a expiré, le fichier a été supprimé ou a expiré, ou le locataire
ou le produit a été suspendu ou archivé. Crée un nouveau lien. Le serveur répond volontairement de la même façon
dans tous ces cas.

**Le lien copié pointe vers le mauvais hôte.** Les liens signés sont construits à partir de l’URL publique du serveur
(`security.public_url`). Demande à un opérateur de la définir sur l’adresse que les destinataires peuvent joindre.

**La boîte de dialogue de téléversement n’affiche pas la limite de taille ni les types autorisés.** Tu ne peux pas lire les paramètres
du serveur. Le serveur les applique tout de même ; son message d’erreur indique quelle règle n’a pas été respectée.
