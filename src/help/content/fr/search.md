---
title: Recherche
summary: Chercher dans l’index plein texte d’un locataire, restreindre les résultats par type, consulter un document indexé et retirer de l’index une entrée erronée.
keywords: recherche, chercher, plein texte, index, document indexé, type, ID de référence, surlignage, expression, exclure, search:query, search:index
---

L’écran **Recherche** interroge l’index plein texte que ton produit tient pour chaque locataire. Le
produit place dans cet index le texte consultable de ses propres objets (une facture, un contact, un
ticket) ; dans le Studio, tu peux l’interroger comme tes utilisateurs, vérifier ce qui est indexé et
retirer une entrée qui n’a rien à y faire.

L’index est une _copie_ : ton produit l’écrit et reste la source de référence. Axentra ne lit pas
de lui-même les enregistrements, les fichiers ou les tables de ton produit ; un objet n’apparaît
donc dans la recherche qu’une fois que le produit l’a indexé.

> [!IMPORTANT]
> L’écran exige le module serveur `search`. Chercher exige `search:query` dans le locataire ;
> retirer un document de l’index exige `search:index` (consulte [Qui peut faire quoi](#permissions)).

## Qui peut faire quoi {#permissions}

| Rôle                                                       | Chercher (`search:query`) | Retirer de l’index (`search:index`) |
| ---------------------------------------------------------- | ------------------------- | ----------------------------------- |
| Locataire **Owner**, **Admin**                             | oui                       | oui                                 |
| Locataire **Member**, **Viewer**                           | oui                       | non                                 |
| **Product owner**, **Product admin** (tous les locataires) | oui                       | oui                                 |
| **Support**, **Product viewer** (tous les locataires)      | oui                       | non                                 |
| **Administrateur de la plateforme**                        | oui                       | oui                                 |
| **Lecteur de la plateforme**                               | oui                       | non                                 |

Par défaut, les membres ne peuvent pas écrire dans l’index, car chaque entrée est montrée à tous
ceux qui peuvent chercher dans le locataire. Un rôle personnalisé peut accorder les deux
autorisations ; consulte les [rôles et autorisations](help:roles-permissions).

## Chercher dans un locataire {#query}

1. Ouvre **Données et stockage** › **Recherche** ([ouvrir l’écran](app:search)).
2. Choisis un **Locataire**. Chaque locataire a son propre index ; il n’y a pas de recherche sur
   plusieurs locataires.
3. Sous **Termes de recherche**, saisis ta recherche et choisis **Chercher** (ou appuie sur Entrée).

| Tu saisis          | La recherche trouve                                                     |
| ------------------ | ----------------------------------------------------------------------- |
| `invoice acme`     | les documents qui contiennent les deux mots (dans n’importe quel ordre) |
| `"late payment"`   | les documents qui contiennent exactement cette expression               |
| `invoice or offer` | les documents qui contiennent au moins l’un des mots                    |
| `invoice -draft`   | les documents avec `invoice` qui ne contiennent pas `draft`             |

La recherche trouve des mots entiers, sans tenir compte des majuscules et minuscules. Elle ne trouve
pas les parties de mots (`inv` ne trouve pas `invoice`, sauf avec [Trouver les débuts de mots](#prefix)) et ne corrige pas l’orthographe. Le fait que
`invoices` trouve aussi `invoice` dépend de la langue avec laquelle le serveur indexe (consulte
[Bon à savoir](#limits)).

La recherche et le locataire font partie de l’adresse : tu peux donc mettre une recherche en favori
ou envoyer le lien à quelqu’un qui a accès au même locataire.

### Trouver les débuts de mots {#prefix}

Choisis **Trouver les débuts de mots** pour la recherche pendant la saisie : chaque mot saisi doit
correspondre, et les mots de deux caractères ou plus trouvent aussi les mots plus longs qui
commencent ainsi (`inv` trouve `invoice`, `inv acme` trouve les documents avec un mot qui commence
par `inv` et le mot `acme`). Dans ce mode, les guillemets, `or` et `-mot` n’ont pas de sens
particulier, et seuls les huit premiers mots comptent. Le choix fait partie de l’adresse, comme la
recherche elle-même.

### Restreindre par type {#kinds}

Chaque document indexé a un **type** choisi par ton produit, par exemple `invoice` ou `note`. Sous
**Types**, saisis un ou plusieurs types séparés par des virgules pour ne voir que ceux-là. Les types
utilisent des minuscules, des chiffres, des points, des tirets et des tirets bas et commencent par
une lettre ; 20 au maximum à la fois. Laisse le champ vide pour chercher dans tous les types.

Sous le champ, **Types indexés** liste les types présents dans l’index du locataire avec leur
nombre de documents. Sélectionne-en un pour l’ajouter au champ, ou sélectionne-le à nouveau pour le
retirer.

## Lire les résultats {#results}

Les résultats sont triés par pertinence : les correspondances dans le titre comptent plus que celles
dans le texte, davantage de correspondances comptent plus et, à égalité, le résultat mis à jour le
plus récemment vient en premier. Chaque résultat affiche :

- le **titre** avec les mots trouvés surlignés (ou l’ID de référence si le document n’a pas de
  titre),
- le **type** et l’**ID de référence**, c’est-à-dire l’ID propre de l’objet dans ton produit,
- la date de dernière **mise à jour** du document dans l’index,
- jusqu’à deux courts passages du texte avec les correspondances surlignées.

Vingt résultats s’affichent d’abord ; **Charger plus** récupère les suivants. Le compteur sous la
liste indique combien sont affichés et s’il y en a d’autres.

> [!NOTE]
> Les résultats ne sont pas un instantané. Si le produit modifie l’index pendant que tu parcours les
> pages, un document peut se déplacer et apparaître deux fois ou pas du tout. Une pagination très
> profonde (au-delà de la position 1000 par défaut) est refusée ; affine plutôt la recherche.

## Consulter un document indexé {#document}

Choisis le titre d’un résultat. Un panneau latéral montre ce que l’index contient : **Type**,
**ID de référence**, **ID du document** (`sdoc_…`), **Version** (augmente à chaque nouvelle
indexation), **Langue**, qui l’a indexé (**Indexé par**, **Dernière indexation par**) et quand, le
**Texte** complet et les **Métadonnées** que ton produit a enregistrées avec lui. Les métadonnées
sont affichées, mais pas recherchées.

## Retirer un document de l’index {#remove}

Si un document ne doit pas apparaître dans la recherche (par exemple s’il a été indexé par erreur ou
appartient à un objet supprimé), tu peux le retirer :

1. Ouvre le document depuis les résultats.
2. Choisis **Retirer de l’index** et confirme.

> [!WARNING]
> Cela retire seulement l’entrée de l’index. L’objet d’origine dans ton produit ne change pas, et le
> produit ajoute de nouveau l’entrée la prochaine fois qu’il indexe cet objet. Pour retirer quelque
> chose définitivement, supprime-le ou modifie-le dans ton produit.

## Comment les documents arrivent dans l’index {#index}

Ton produit indexe ses objets via l’API (`PUT …/search/documents/{kind}/{ref_id}` avec
`search:index`), en général juste après avoir enregistré un objet ou dans une [tâche](help:jobs) qui
réessaie. Indexer de nouveau le même type et le même ID de référence remplace le document. Le Studio
n’ajoute pas de documents lui-même. Qui a indexé un document est noté sur celui-ci et, sauf si le
serveur le désactive, dans le [journal d’audit](help:audit) (`search.document.upsert`,
`search.document.delete`), sans son texte.

## Bon à savoir {#limits}

| Élément            | Règle                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portée             | Un locataire à la fois. Toute personne ayant `search:query` dans le locataire voit chaque document de ce locataire.                                               |
| Texte de recherche | De 1 à 500 caractères. Une recherche composée uniquement de ponctuation ou de mots très courants ne trouve rien.                                                  |
| Types              | `^[a-z][a-z0-9_.-]{0,62}$`, 20 au maximum par recherche                                                                                                           |
| Correspondance     | Mots entiers, ou débuts de mots avec **Trouver les débuts de mots** ; pas de recherche approximative ni d’insensibilité aux accents (`café` ne trouve pas `cafe`) |
| Langue             | Une par installation (paramètre serveur `search.language`, par défaut `simple` : sans racinisation ni mots vides)                                                 |
| Pagination         | 20 par page dans le Studio, au plus jusqu’à la position `search.max_offset` (1000 par défaut)                                                                     |

## Dépannage {#troubleshooting}

### Aucun résultat {#no-results}

Vérifie l’orthographe, utilise des mots entiers et moins de mots, et retire le filtre de types. Si
l’objet devrait y figurer, ton produit ne l’a pas (encore) indexé pour ce locataire : l’index ne
contient que ce que le produit y place.

### La recherche a pris trop de temps {#too-expensive}

**La recherche a pris trop de temps** signifie que le serveur a arrêté la recherche à sa limite de
temps (réglage du serveur `search.statement_timeout_ms`, 5 secondes par défaut), en général parce
qu’un mot très courant ou un début de mot court correspond à une grande partie d’un gros index.
Utilise des mots plus précis ou plus nombreux, désactive **Trouver les débuts de mots** ou restreins
la recherche avec un filtre de type.

### Autres messages {#messages}

**Tu ne peux pas chercher dans ce locataire.** Ton rôle dans ce locataire n’inclut pas
`search:query`. Demande à un owner ou admin du locataire.

**La recherche s’affiche comme « module non activé ».** Le serveur fonctionne sans le module
`search`. Consulte les [modules](help:modules-reference#search-realtime).

**Vérifie ta saisie.** La recherche dépasse 500 caractères, un type n’est pas valide ou tu as
paginé plus loin que le serveur ne l’autorise. Raccourcis ou affine la recherche.

**Introuvable** à l’ouverture d’un document. Le produit l’a retiré de l’index après le chargement
des résultats. Relance la recherche.

**Retirer de l’index est absent.** Ton rôle n’inclut pas `search:index` dans ce locataire.
