---
title: Dépannage
summary: Ce que signifient les messages d’erreur du Studio, pourquoi ils apparaissent et que faire, des problèmes au démarrage jusqu’aux actions refusées.
keywords: erreur, problème, échec, ne fonctionne pas, panne, ID de requête, non autorisé, interdit, introuvable, conflit, 401, 403, 404, 409, 412, 413, 415, 422, 429, 500, impossible de se connecter, version incompatible, session expirée, module non activé
---

Lorsque le serveur Axentra refuse une requête ou ne peut pas l’exécuter, le Studio affiche un
message traduit qui nomme ce qui s’est passé et ce que tu peux faire. Cette page explique chaque
message, les écrans de démarrage que tu peux voir avant l’ouverture du Studio et quelques
situations courantes. Chaque section a sa propre cible de lien, ce qui permet aux écrans de te
diriger directement vers la bonne explication.

## Comment un message d’erreur est construit {#error-message}

Chaque erreur dans le Studio se compose des mêmes parties :

- **Titre** : un nom court pour le problème, par exemple **Non autorisé** ou **Conflit**. Il est
  choisi à partir du _code d’erreur_ stable du serveur ; il désigne donc le même problème dans
  toutes les langues.
- **Message** : ce qui s’est passé, la cause probable et ce qu’il faut faire ensuite.
- **Erreurs de champ** : lorsque le serveur rejette des valeurs individuelles, le Studio les liste
  sous les champs de formulaire concernés, ou sous forme de liste de noms de champs et de motifs.
- **Détails techniques** (repliables) : le **Statut HTTP**, le **Code d’erreur**, le **Message du
  serveur** (l’explication propre au serveur, toujours en anglais) et l’**ID de requête**.

Les actions qui échouent (enregistrement, suppression, envoi) apparaissent sous forme de
notification dans un coin de l’écran avec les mêmes informations. Pour **Non autorisé** et
**Conflit**, la notification ajoute le message du serveur, car il nomme généralement exactement ce
qui manque, par exemple `missing permission tenants:update` ou
`a tenant with this slug exists in the product`.

### L’ID de requête {#request-id}

Chaque réponse du serveur porte un ID de requête comme `req_01EXAMPLE…`. Le serveur écrit le même
ID dans ses journaux et dans le [journal d’audit](help:audit). Lorsque tu signales un problème à
ton opérateur ou au support, joins toujours l’ID de requête : il leur permet de retrouver la
requête exacte en quelques secondes.

> [!TIP]
> Ouvre **Détails techniques** et copie l’ID de requête avant de fermer le message ou de réessayer.

## Codes d’erreur {#error-codes}

Le tableau donne une vue d’ensemble. Les sections suivantes expliquent chaque code avec ses causes
et ses solutions.

| Titre dans le Studio                      | Code d’erreur                     | Statut HTTP  | En bref                                                 |
| ----------------------------------------- | --------------------------------- | ------------ | ------------------------------------------------------- |
| **Vérifie ta saisie**                     | `validation_failed`               | 422 (ou 400) | Des valeurs ont été rejetées                            |
| **Requête incomprise**                    | `bad_request`                     | 400          | La requête n’a pas pu être lue                          |
| **Connecte-toi**                          | `unauthenticated`                 | 401          | Aucune session valide                                   |
| **Non autorisé**                          | `forbidden`                       | 403          | Autorisation manquante, ou produit ou locataire inactif |
| **Reconnecte-toi**                        | `reauthentication_required`       | 403          | Nécessite une connexion récente                         |
| **Introuvable**                           | `not_found`                       | 404          | N’existe pas, ou n’est pas visible pour toi             |
| **Module non activé**                     | `module_disabled`                 | 404          | Module serveur désactivé                                |
| **Conflit**                               | `conflict`                        | 409          | Conflit avec des données ou un état existants           |
| **Indisponible dans ce mode**             | `mode_not_supported`              | 409          | Impossible dans ce mode de serveur                      |
| **Prestataire de paiement non configuré** | `payment_provider_not_configured` | 409          | La facturation nécessite un prestataire                 |
| **Modifié entre-temps**                   | `precondition_failed`             | 412          | Quelqu’un d’autre a enregistré avant toi                |
| **Trop volumineux**                       | `payload_too_large`               | 413          | Requête ou fichier trop gros                            |
| **Type non accepté**                      | `unsupported_media_type`          | 415          | Type de contenu bloqué ou non pris en charge            |
| **Trop de requêtes**                      | `rate_limited`                    | 429          | Ralentis                                                |
| **Quota dépassé**                         | `quota_exceeded`                  | 429          | Quota du locataire ou limite de l’offre épuisé          |
| **Erreur du serveur**                     | `internal`                        | 500 et plus  | Défaillance côté serveur                                |
| **Serveur injoignable**                   | `network_error`                   | aucun        | Aucune réponse du serveur                               |
| **Erreur inattendue**                     | `unknown`                         | autre        | Non reconnue                                            |

### Vérifie ta saisie {#validation-failed}

**Ce qui s’est passé :** le serveur a contrôlé les valeurs que tu as envoyées et en a rejeté au
moins une (`validation_failed`, HTTP 422).

**Causes typiques :** un champ obligatoire est vide, une valeur est trop longue, une clé ou un slug
contient des caractères non autorisés, un champ JSON n’est pas un objet JSON, un nom d’autorisation
est inconnu ou non autorisé pour ce type de rôle, un mot de passe ne respecte pas la politique de
mots de passe du serveur.

**Que faire :** lis les messages sous les champs ou dans la liste sous le titre. Si aucun champ
n’est signalé, ouvre **Détails techniques** : le **Message du serveur** nomme la règle, par exemple
`permissions not allowed for a tenant role: tenants:read`. Corrige la valeur et envoie à nouveau.

### Requête incomprise {#bad-request}

**Ce qui s’est passé :** le serveur n’a pas du tout pu interpréter la requête (`bad_request`,
HTTP 400), par exemple parce qu’une valeur avait un format incorrect.

**Que faire :** recharge la page et répète l’action. Si cela se reproduit, signale-le avec l’ID de
requête ; normalement, le Studio n’envoie que des requêtes bien formées.

### Connecte-toi {#unauthenticated}

**Ce qui s’est passé :** tu n’es pas connecté, ou ta session a pris fin (`unauthenticated`,
HTTP 401).

**Causes typiques :** une session prend fin après une durée de vie maximale (par défaut
12 heures), après une période sans activité (par défaut 120 minutes), lorsque tu te déconnectes,
lorsqu’elle est révoquée (par toi ou par un administrateur), lorsque ton compte est désactivé et (pour tes autres
sessions) lorsque tu changes ton mot de passe. Les durées exactes sont fixées par ton opérateur.

**Que faire :** le Studio t’amène automatiquement sur la page de connexion, puis te ramène ensuite
à la page où tu étais. Les saisies de formulaire non enregistrées sont perdues. Voir
[Session terminée](#session-ended).

### Non autorisé {#forbidden}

**Ce qui s’est passé :** le serveur te connaît, ainsi que l’élément, mais refuse l’action
(`forbidden`, HTTP 403).

**Causes typiques :**

- **Une autorisation manque.** Le message du serveur indique laquelle, par exemple
  `missing permission records:write`. Consulte la
  [référence des autorisations](help:permissions-reference) pour savoir ce que permet chaque
  autorisation et quels rôles intégrés la détiennent.
- **Le produit est archivé ou le locataire est suspendu.** Seuls les administrateurs de la
  plateforme (accès complet) et les lecteurs de la plateforme (accès en lecture) peuvent alors
  encore y travailler ; tous les autres, clés d’API comprises, obtiennent
  `the product or tenant is not active`. Les propriétaires et les administrateurs du produit
  peuvent toujours ouvrir la page d’un locataire suspendu et le [réactiver](help:tenants#reactivate).
- **Le plafond de rôle.** Tu as tenté d’attribuer un rôle comportant des autorisations que tu ne
  possèdes pas toi-même, ou un rôle de propriétaire sans être propriétaire. Voir
  [Plafond de rôle](help:security#role-ceiling).
- **Autorisations des clés d’API.** Tu as tenté de donner à une nouvelle clé une autorisation que
  tu n’as pas (`you cannot grant permissions you do not hold`).
- **Contrôle de l’origine.** Le serveur a refusé une requête parce que le Studio tourne à une
  adresse à laquelle il ne fait pas confiance (`cross-origin request refused`) ou parce que le
  jeton de sécurité manquait (`missing or invalid CSRF token`). Voir
  [La connexion ou l’enregistrement échoue avec Non autorisé](#csrf-origin).

**Que faire :** demande à un propriétaire ou à un administrateur du produit ou du locataire de te
donner un rôle avec l’autorisation manquante, ou de réactiver le produit ou le locataire. Le Studio
masque généralement les boutons des actions que tu n’as pas le droit d’effectuer, mais le serveur a
toujours le dernier mot.

### Reconnecte-toi {#reauthentication-required}

**Ce qui s’est passé :** l’action n’est autorisée que dans les quelques minutes suivant une
connexion (`reauthentication_required`, HTTP 403). Actuellement, cela concerne la définition d’un
premier mot de passe pour un compte qui ne se connecte jusqu’ici que par authentification unique.

**Que faire :** choisis **Se reconnecter**. Le Studio te déconnecte, ouvre la page de connexion et
te ramène au même endroit ; répète l’action tout de suite (fenêtre par défaut : 5 minutes). Si ton
opérateur a désactivé les premiers mots de passe, l’action n’est jamais possible. Voir
[Profil](help:profile).

### Introuvable {#not-found}

**Ce qui s’est passé :** le serveur répond comme si l’élément n’existait pas (`not_found`,
HTTP 404).

**Causes typiques :** l’élément a été supprimé, l’adresse est mal saisie ou provient d’une autre
installation, ou tu n’as aucun lien avec le produit ou le locataire. Dans ce dernier cas, Axentra
affiche délibérément **Introuvable** au lieu de **Non autorisé**, afin que personne ne puisse savoir
quels produits, locataires ou comptes existent.

Lorsque tu ajoutes un utilisateur existant comme membre, **Utilisateur introuvable** signifie
qu’aucun compte _visible pour toi_ ne porte cette adresse. Envoie plutôt une invitation (voir
[Membres et invitations](help:members-invitations)).

**Que faire :** vérifie l’adresse, reviens à la liste ou demande à une personne ayant accès au
produit ou au locataire de t’ajouter.

### Module non activé {#module-disabled}

**Ce qui s’est passé :** l’action nécessite un module serveur qui est désactivé
(`module_disabled`).

**Que faire :** demande à ton opérateur d’activer le module dans la configuration du serveur. La
[référence des modules](help:modules-reference) indique ce que fait fonctionner chaque module.

### Conflit {#conflict}

**Ce qui s’est passé :** la requête entre en conflit avec des données existantes ou avec l’état
actuel de l’élément (`conflict`, HTTP 409). Le message du serveur explique le conflit ; le Studio
l’affiche après le texte traduit.

**Causes typiques et solutions :**

| Message du serveur (exemples)                                                                                 | Que faire                                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `a tenant with this slug exists in the product`, `a role with this key exists`, `a plan with this key exists` | Choisis un autre slug ou une autre clé. Les slugs et les clés sont uniques.                                    |
| `an open invitation for this email exists`                                                                    | Utilise ou révoque d’abord l’invitation ouverte.                                                               |
| `the tenant needs at least one owner`, `the product needs at least one owner`                                 | Donne le rôle de propriétaire à une autre personne avant de rétrograder ou de retirer le dernier propriétaire. |
| `the role is assigned 3 times; reassign those members first`                                                  | Attribue un autre rôle à ces membres, puis supprime le rôle.                                                   |
| `subscriptions use this plan; deactivate it instead`, `the meter has recorded usage; deactivate it instead`   | Désactive au lieu de supprimer.                                                                                |
| `only failed or dead jobs can be retried`, `the job is already succeeded`                                     | La tâche n’est plus dans un état qui permet l’action ; recharge la page.                                       |
| `the delivery is already queued or in progress`                                                               | Attends la fin de la livraison en cours.                                                                       |

### Déjà utilisée pour une autre requête {#idempotency-conflict}

Certaines actions (mettre une tâche en file d’attente, publier un événement, envoyer une
notification, enregistrer l’utilisation) portent une _clé d’idempotence_ pour qu’un nouvel envoi ne
soit pas exécuté deux fois. Si la même clé a déjà été utilisée avec d’autres valeurs, ou par un
autre appelant, le serveur répond `409`. Le Studio affiche **Déjà utilisée pour une autre requête**
et génère une nouvelle clé pour toi ou propose **Utiliser une nouvelle clé**. Envoie à nouveau pour
créer un nouvel élément. Voir l’entrée du glossaire
[clé d’idempotence](help:glossary#idempotency-key).

### Indisponible dans ce mode {#mode-not-supported}

**Ce qui s’est passé :** le serveur tourne dans un mode qui ne prend pas en charge l’action
(`mode_not_supported`).

**Causes typiques :** créer ou archiver des produits sur un serveur en mode mono-produit, ou ouvrir
la boîte de réception locale des notifications alors que le serveur n’utilise pas le prestataire
d’e-mail de test local.

**Que faire :** rien dans le Studio ; un opérateur devrait modifier la configuration du serveur.
Voir [Produits](help:products) et [Configuration du serveur](help:server-configuration).

### Prestataire de paiement non configuré {#payment-provider-not-configured}

**Ce qui s’est passé :** une action de facturation, comme un paiement pour une offre payante,
nécessite un prestataire de paiement, et le serveur n’en a aucun de configuré
(`payment_provider_not_configured`).

**Que faire :** demande à ton opérateur de configurer le prestataire de paiement. Voir
[Offres et abonnements](help:plans-subscriptions).

### Modifié entre-temps {#precondition-failed}

**Ce qui s’est passé :** tu as modifié un élément que quelqu’un d’autre a enregistré après que tu
l’as ouvert (`precondition_failed`, HTTP 412). Le Studio envoie la version à partir de laquelle tu
as commencé ; le serveur refuse d’écraser la version plus récente, afin que la modification de
personne ne soit perdue en silence.

**Que faire :** recharge l’élément, examine la modification de l’autre personne et refais ta
modification.

### Trop volumineux {#payload-too-large}

**Ce qui s’est passé :** la requête ou le fichier est plus gros que ce qu’accepte le serveur
(`payload_too_large`, HTTP 413).

**Limites typiques :** corps de requête de 10 Mio par défaut (fixé par l’opérateur), un
enregistrement de 256 Kio de JSON au maximum, et des fichiers jusqu’à la taille maximale de fichier
du serveur. Le message du serveur nomme la limite, par exemple
`files may be at most 10485760 bytes`. (Les charges utiles de tâches et les données d’événements,
de 64 Ko au maximum chacune, sont refusées avec **Vérifie ta saisie** à la place.)

**Que faire :** utilise un fichier plus petit ou moins de données, ou interroge ton opérateur sur
la limite. Voir [Fichiers](help:files) et [Enregistrements](help:records).

### Type non accepté {#unsupported-media-type}

**Ce qui s’est passé :** le serveur n’accepte pas le type de contenu (`unsupported_media_type`,
HTTP 415). Le plus souvent, un téléversement de fichier a été bloqué : les exécutables, le HTML, le
SVG et les fichiers de script sont bloqués d’après leur type, l’extension du nom de fichier et leur
contenu.

**Que faire :** téléverse un autre type de fichier, ou place le fichier dans une archive si ton
produit l’autorise. Un produit peut être configuré pour stocker les fichiers bloqués comme pièces
jointes inertes au lieu de les refuser. Voir [Fichiers](help:files).

### Trop de requêtes {#rate-limited}

**Ce qui s’est passé :** trop de requêtes en peu de temps (`rate_limited`, HTTP 429).

**Causes typiques :** trop de tentatives de connexion échouées pour un compte ou depuis une adresse
réseau (par défaut : 10 tentatives échouées par compte et par minute), ou une limitation générale
des requêtes activée par ton opérateur.

**Que faire :** attends environ une minute, puis réessaie. Si tu atteins sans cesse la limite lors
de la connexion, vérifie l’adresse e-mail et le mot de passe, ou utilise l’authentification unique
si elle est disponible.

### Quota dépassé {#quota-exceeded}

**Ce qui s’est passé :** un quota ou une limite d’offre est épuisé (`quota_exceeded`, HTTP 429),
par exemple le quota de stockage du locataire (octets ou nombre de fichiers) ou un quota
d’utilisation.

**Que faire :** supprime des fichiers ou attends la prochaine période d’utilisation, ou demande à
une personne disposant de `tenants:update` (quota de stockage), `usage:manage` (quotas
d’utilisation) ou `billing:manage` (offres) d’augmenter la limite. Voir [Utilisation](help:usage)
et [Fichiers](help:files).

### Erreur du serveur {#internal}

**Ce qui s’est passé :** le serveur, ou un service situé derrière lui, a échoué en traitant la
requête (`internal`, HTTP 500 ou plus). Pour des raisons de sécurité, le serveur n’affiche jamais
de détails internes ; l’ID de requête relie ton signalement à l’entrée de journal du serveur. Un
`502`, `503` ou `504` renvoyé par un proxy inverse placé devant le serveur apparaît aussi comme
**Erreur du serveur**.

**Que faire :** réessaie après un moment. Ta modification n’a peut-être pas été enregistrée :
vérifie avant de répéter des actions destructrices. Si l’échec persiste, signale-le à ton opérateur
avec l’ID de requête et l’heure.

### Serveur injoignable {#network-error}

**Ce qui s’est passé :** le Studio n’a reçu aucune réponse (`network_error`) : la connexion a
échoué ou a été interrompue.

**Que faire :** vérifie ta connexion réseau et ton VPN. Si d’autres sites fonctionnent, le serveur
Axentra est peut-être arrêté ou en cours de redémarrage ; consulte
[État du système](help:health-monitoring) dès qu’il répond à nouveau, ou adresse-toi à ton
opérateur.

### Erreur inattendue {#unknown}

**Ce qui s’est passé :** le serveur a répondu par une erreur que le Studio ne reconnaît pas
(`unknown`).

**Que faire :** réessaie. Si cela se reproduit, signale-le avec l’ID de requête, le **Code
d’erreur** et le **Message du serveur** figurant dans **Détails techniques**.

## Messages au démarrage {#startup}

Avant d’afficher quoi que ce soit, le Studio charge les informations du serveur, vérifie la version
de l’API, puis ta session. Les problèmes survenant dans cette phase occupent tout l’écran.

### Connexion au serveur Axentra… {#connecting}

C’est l’écran de démarrage normal. S’il reste affiché longtemps, le serveur répond lentement ou
est injoignable ; le Studio affiche alors
[Impossible de se connecter à Axentra](#api-unreachable).

### Impossible de se connecter à Axentra {#api-unreachable}

Le Studio n’a pas pu charger les informations du serveur (`GET /v1/meta`). Sous l’explication, tu
vois le titre de l’erreur et, si le serveur a répondu, l’ID de requête.

- **Serveur injoignable** : le serveur est arrêté, en cours de redémarrage ou bloqué par le réseau.
- **Erreur du serveur** ou **Introuvable** : le Studio atteint _quelque chose_, mais pas l’API
  Axentra, par exemple un proxy inverse qui ne transmet pas `/v1`, ou une adresse d’API erronée
  dans le fichier de configuration du Studio (`/config.json`, paramètre `apiBaseUrl`).

**Que faire :** choisis **Réessayer**. Si le problème persiste, un opérateur doit vérifier que le
serveur tourne et que le Studio pointe vers la bonne adresse d’API (voir
[Configuration du serveur](help:server-configuration)).

### Version du serveur incompatible {#incompatible-version}

Le Studio et le serveur parlent des versions différentes de l’API Axentra. L’écran affiche la
**Version de l’API du serveur**, la **Version d’API requise**, la version du **Serveur** et la
**Version du Studio**, ainsi que l’un de ces motifs :

- **Version majeure différente** : le Studio et le serveur appartiennent à des générations
  différentes.
- **Serveur trop ancien** : le serveur est plus ancien que ce qu’exige ce Studio. Mets à jour le
  serveur ou utilise un Studio plus ancien.
- **Version illisible** : le serveur a indiqué une version que le Studio ne sait pas interpréter.

**Que faire :** utilise une version du Studio qui correspond à la version d’API du serveur, ou mets
à jour le serveur. Le Studio ne vérifie la version qu’au chargement de la page : après une mise à
jour du serveur, recharge la page.

### Installer Axentra {#setup-required}

Un serveur neuf n’a pas encore d’administrateur de la plateforme. Le Studio ouvre alors **Installer
Axentra** au lieu de la page de connexion. Tu as besoin d’un jeton d’installation à usage unique
qu’un opérateur affiche sur le serveur. Voir [Première installation](help:first-run-setup).

### Ta session n’a pas pu être vérifiée {#session-check-failed}

Le Studio a demandé au serveur si tu étais connecté et a reçu une erreur au lieu d’une réponse (par
exemple **Erreur du serveur** ou **Serveur injoignable**). Choisis **Réessayer**. Ce n’est pas la
même chose qu’une session terminée.

### Session terminée {#session-ended}

Lorsqu’une requête renvoie **Connecte-toi**, le Studio ouvre la page de connexion avec la mention
**Connecte-toi pour reprendre là où tu t’étais arrêté.** Après la connexion, tu reviens à la même
page. Voir [Connexion](help:signing-in).

### Module non activé sur ce serveur {#module-not-enabled}

Tu as ouvert une section dont le module serveur est désactivé. La page nomme l’identifiant du
module qu’un opérateur doit activer (par exemple `storage` ou `billing`). Dans la barre latérale,
ces sections portent la mention **Désactivé**. Voir la
[référence des modules](help:modules-reference).

### Pas encore disponible dans le Studio {#not-in-studio}

Le module est activé sur le serveur, mais cette version du Studio ne propose pas d’écrans pour
lui. Utilise directement l’API ou une version plus récente du Studio.

### Page introuvable {#page-not-found}

L’adresse ne correspond à aucune page du Studio : elle est peut-être mal saisie, ou l’élément a été
déplacé ou supprimé. Choisis **Aller à la page d’accueil**.

### Une erreur s’est produite {#something-went-wrong}

La page n’a pas pu être affichée, souvent parce qu’une version plus récente du Studio a été
déployée pendant que ton onglet était ouvert. Choisis **Recharger la page**. Si le problème
persiste, signale-le avec l’adresse de la page.

## Situations courantes {#situations}

### Une section affiche Désactivé dans la barre latérale {#menu-item-off}

Le module serveur correspondant est désactivé. La section s’ouvre quand même et t’indique quel
module activer. Les sections qui nécessitent un produit (la plupart) n’apparaissent qu’une fois que
tu as choisi un produit.

### Un bouton ou un onglet manque {#action-missing}

Le Studio masque les actions et les onglets que tes autorisations ne permettent pas, par exemple
**Nouveau locataire** sans `tenants:create` ou l’onglet **Membres** sans `members:read`. Recherche
l’autorisation dans la [référence des autorisations](help:permissions-reference) et demande un rôle
adapté. Certaines actions sont aussi masquées en raison du mode du serveur (par exemple **Nouveau
produit** en mode mono-produit).

### Une page affiche Non autorisé alors que tu peux l’ouvrir {#page-forbidden}

La barre latérale affiche toutes les sections ; le droit de lire leurs données est déterminé au
chargement de la page. Une section sans l’autorisation de lecture affiche **Non autorisé** avec
l’autorisation manquante dans le message du serveur.

### La connexion ou l’enregistrement échoue avec Non autorisé {#csrf-origin}

Si la connexion ou chaque modification échoue avec **Non autorisé** et que le message du serveur
indique `cross-origin request refused` ou `missing or invalid CSRF token`, le Studio tourne à une
adresse à laquelle le serveur ne fait pas confiance, ou ton navigateur bloque le cookie de session.
Un opérateur doit ajouter l’adresse du Studio aux origines autorisées du serveur. Lorsque le Studio
et l’API tournent sur des adresses différentes, les deux doivent appartenir au même site (par
exemple `studio.example.com` et `api.example.com`). Voir [Sécurité](help:security#sessions-csrf).

### La connexion échoue {#sign-in-fails}

**Échec de la connexion** avec « L’adresse e-mail ou le mot de passe est incorrect. » apparaît pour
un mot de passe erroné _comme_ pour une adresse inconnue ; le serveur ne révèle pas lequel des deux.
Après trop de tentatives, tu vois [Trop de requêtes](#rate-limited). Un compte désactivé ne peut pas
du tout se connecter. Voir [Connexion](help:signing-in).

### Un lien d’invitation ne fonctionne pas {#invitation-link}

- **Page introuvable** ou une page de l’API : le lien pointe vers une adresse où le Studio ne tourne
  pas. Demande à ton exploitant de régler `notify.invitation_accept_url`, voir
  [Membres et invitations](help:members-invitations#delivery).
- **Cette invitation ne peut pas être utilisée** : l’invitation a expiré, a déjà été utilisée ou a
  été révoquée, ou le lien est incomplet. Demande une nouvelle invitation à la personne qui t’a
  invité.
- **Invitation pour une autre adresse e-mail** : choisis **Se déconnecter et utiliser l’adresse
  invitée**.

Voir [Accepter une invitation](help:members-invitations#accept).

### Un secret à usage unique a été perdu {#secret-lost}

Les secrets de clés d’API, les secrets de signature de webhooks et les liens d’invitation ne sont
affichés qu’une seule fois et ne peuvent plus être affichés ensuite. Renouvelle le secret ou crée
une nouvelle invitation. Voir [Clés d’API](help:api-keys), [Webhooks](help:webhooks) et
[Membres et invitations](help:members-invitations).

### Problèmes propres à une fonctionnalité {#feature-problems}

Chaque article de fonctionnalité a sa propre section de dépannage, par exemple pour les tâches qui
restent en attente, les livraisons de webhooks qui échouent, les téléversements rejetés ou les
invitations qui n’arrivent pas : [Tâches](help:jobs), [Planifications](help:schedules),
[Webhooks](help:webhooks), [Fichiers](help:files), [Notifications](help:notifications),
[Offres et abonnements](help:plans-subscriptions).
