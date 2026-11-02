---
title: Se repérer dans Studio
summary: La disposition de Studio, la barre latérale, le sélecteur de produit, le menu utilisateur, le tableau de bord et l’aide intégrée.
keywords: interface, disposition, navigation, barre latérale, menu, tiroir, mobile, téléphone, fil d’Ariane, sélecteur de produit, menu utilisateur, langue, thème, mode sombre, mode clair, tableau de bord, aide, info-bulle, recherche, clavier
---

Cet article montre comment Studio est organisé, pour que tu trouves rapidement chaque écran. Il traite de la
navigation, du changement de produit, des réglages personnels comme la langue et le thème, du tableau de bord et
de l’aide intégrée à chaque écran.

## La disposition {#layout}

Après la connexion, Studio ouvre le tableau de bord du dernier produit utilisé, ou la liste des produits si
tu n’en as encore aucun. Chaque écran comporte trois parties :

- **Barre latérale** (à gauche) : la navigation, regroupée par domaine.
- **Barre supérieure** : à gauche le **fil d’Ariane** (le chemin vers la page actuelle, chaque étape étant cliquable),
  à droite le **sélecteur de produit**, le bouton d’aide et le **menu utilisateur**.
- **Zone de contenu** : le titre de la page avec une description d’une ligne, l’action principale de la page à droite
  (par exemple **Nouveau locataire**), puis en dessous les filtres, tableaux, cartes et onglets.

## La barre latérale {#sidebar}

La barre latérale liste les domaines dans cet ordre :

| Groupe                         | Entrées                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| (en haut)                      | **Tableau de bord**, **Produits**                            |
| **Identités et locataires**    | **Locataires**, **Utilisateurs**, **Invitations**            |
| **Accès et clés d’API**        | **Rôles**, **Autorisations**, **Clés d’API**                 |
| **Données et stockage**        | **Aperçu des données**, **Enregistrements**, **Fichiers**    |
| **Événements et tâches**       | **Tâches**, **Planifications**, **Événements**, **Webhooks** |
| **Utilisation et facturation** | **Utilisation**, **Offres**, **Abonnements**                 |
| (seule)                        | **Notifications**                                            |
| **Audit et supervision**       | **Journal d’audit**, **État du système**, **Supervision**    |
| (en bas)                       | **Paramètres**, **Centre d’aide**                            |

Les entrées qui appartiennent à un produit (de **Tableau de bord** à **Notifications**, sauf **Produits**) ne sont
affichées que lorsqu’un produit est sélectionné. **Produits**, **Journal d’audit**, **État du système**,
**Supervision** et **Paramètres** concernent toute la plateforme.

La barre latérale affiche les mêmes entrées pour tout le monde. Si tu ouvres une page pour laquelle tu n’as pas d’autorisation, la
page te l’indique (**Non autorisé**), et les actions que tu n’as pas le droit d’effectuer ne sont pas proposées.

### Entrées marquées « Désactivé » {#module-off}

Une entrée dont le module du serveur n’est pas activé reste visible et affiche **Désactivé**. En l’ouvrant, tu vois
**Module non activé sur ce serveur** avec l’identifiant du module (par exemple `storage`) que l’opérateur du serveur
doit activer. Tu vois ainsi ce qui existe et ce qui manque. Consulte les
[modules](help:concepts#modules).

### Replier la barre latérale {#collapse-sidebar}

En bas de la barre latérale, **Replier la barre latérale** la réduit à des icônes ; **Déplier la barre latérale** fait réapparaître
les libellés. Dans la barre latérale repliée, survole une icône ou place le focus dessus pour voir son nom. Studio
mémorise ce choix dans ce navigateur. La version du serveur est affichée en bas de la barre latérale
dépliée.

### Sur téléphone et petits écrans {#mobile}

Studio fonctionne à partir de 360 pixels de large. Sur les écrans étroits, la barre latérale devient un tiroir : ouvre-le avec
**Ouvrir la navigation** (le bouton de menu en haut à gauche). Il se ferme quand tu choisis une page, avec
**Fermer la navigation**, ou avec Échap. Les tableaux larges défilent dans leur propre zone, et les colonnes moins importantes
peuvent être masquées.

## Changer de produit {#product-switcher}

La plupart des domaines appartiennent à un produit ; l’adresse contient alors `/p/<product id>/`. Le **sélecteur de
produit** dans la barre supérieure indique le produit actuel (**Produit** et son nom).

1. Sélectionne le sélecteur de produit.
2. Choisis un autre produit dans la liste, ou **Tous les produits** pour ouvrir la liste des produits.

Studio reste dans le même domaine quand tu changes de produit : si tu consultes les locataires du produit A, tu
arrives sur les locataires du produit B. Studio mémorise le dernier produit par navigateur. Les produits archivés
ne sont pas listés dans le sélecteur ; ouvre-les depuis **Produits**.

Sur les pages qui concernent toute la plateforme (par exemple **Journal d’audit** ou **Paramètres**), le sélecteur peut afficher **Aucun
produit sélectionné**.

En **mode produit unique**, il n’y a pas de menu : la barre supérieure affiche une étiquette fixe **Produit** avec le
nom de l’unique produit du serveur. Consulte [mode produit unique et mode multi-produit](help:concepts#single-multi-product).

## Fil d’Ariane {#breadcrumbs}

Le fil d’Ariane indique où tu te trouves, par exemple _Locataires › ten_01EXAMPLE_. Choisis une étape précédente
pour remonter.

## Le menu utilisateur {#user-menu}

Ouvre le menu utilisateur avec tes initiales et ton nom en haut à droite. Il contient :

| Entrée             | Effet                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **Profil**         | Ton compte : nom, mot de passe, sessions actives. Consulte le [profil](help:profile).      |
| **Langue**         | La langue de l’interface. Voir [ci-dessous](help:interface#language).                      |
| **Thème**          | **Clair**, **Sombre** ou **Système**. Voir [ci-dessous](help:interface#theme).             |
| **Se déconnecter** | Met fin à ta session. Consulte [se connecter et se déconnecter](help:signing-in#sign-out). |

### Langue {#language}

Choisis **Langue** dans le menu utilisateur, puis une langue. Le changement s’applique immédiatement. Il est
enregistré dans ce navigateur et dans ton compte, et te suit donc dans les autres navigateurs. Tu peux aussi le modifier
sous **Paramètres** ou, avant la connexion, sur la page de connexion. Sans choix de ta part, Studio
suit la langue du navigateur. Les dates, heures et nombres sont formatés selon la langue choisie.

> [!NOTE]
> Certains textes proviennent du serveur et sont toujours en anglais : les noms et descriptions des rôles
> intégrés (par exemple « Product admin », « Owner »), les descriptions du catalogue des autorisations et le
> message du serveur dans les détails techniques d’une erreur.

### Thème {#theme}

Choisis **Thème** dans le menu utilisateur : **Clair**, **Sombre** ou **Système** (suit ton système
d’exploitation). Comme la langue, le thème est enregistré dans ce navigateur et dans ton compte.

## Le tableau de bord {#dashboard}

Le **Tableau de bord** est la page d’accueil d’un produit. Il affiche :

- **Compteurs** : **Locataires**, **Utilisateurs**, **Clés d’API**, **Événements d’audit (24 h)**, **Enregistrements** et
  **Requêtes refusées (24 h)**. Chaque compteur renvoie vers la page correspondante ; son info-bulle (i) indique exactement ce
  qui est compté. Si le serveur ne renvoie aucun compteur, tu vois « Le serveur n’a signalé aucun compteur pour ce
  produit. »
- Les cartes **Utilisation et facturation**, quand ces modules sont activés et que tu as le droit de les consulter.
- **État du système** : le résultat du contrôle de disponibilité du serveur, avec **Détails**.
- **Serveur** : **Version du serveur**, **Version de l’API**, **Environnement**, **Mode**, **ID du produit** et les
  **Modules** avec leur état (vert : activé, gris : non activé).

Actions rapides en haut à droite : **Nouveau locataire** (avec `tenants:create`, module `tenancy`) et **Nouvelle
clé d’API** (avec `api_keys:manage`).

| Compteur                      | Ce qui est compté                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Locataires**                | Tous les locataires du produit, actifs et suspendus.                                                                   |
| **Utilisateurs**              | Les membres des locataires et les opérateurs du produit, chaque personne une seule fois.                               |
| **Clés d’API**                | Les clés non révoquées, y compris celles qui ont expiré.                                                               |
| **Enregistrements**           | Les enregistrements de toutes les collections et de tous les locataires.                                               |
| **Événements d’audit (24 h)** | Les événements d’audit de ce produit au cours des dernières 24 heures.                                                 |
| **Requêtes refusées (24 h)**  | Les tentatives refusées au cours des dernières 24 heures ; ouvre le journal d’audit filtré sur les événements refusés. |

> [!TIP]
> La carte **Serveur** répond à la question la plus fréquente du support : « Quelle version tourne, et le
> module est-il seulement activé ? »

## Listes et formulaires {#lists-forms}

- Les **listes** se chargent page par page : sous un tableau, **Charger plus** récupère les entrées suivantes, et **Toutes
  les entrées sont chargées** indique la fin. Il n’y a pas de numéros de page.
- Les **boîtes de dialogue de création** ajoutent `?new=1` à l’adresse : la boîte de dialogue survit ainsi à un rechargement et le bouton
  Retour du navigateur la ferme.
- Les **slugs** (noms courts adaptés aux URL) sont dérivés du nom jusqu’à ce que tu modifies toi-même le slug.
- **Enregistrer les modifications** ne devient actif que lorsque quelque chose a changé.
- Les **actions destructrices** demandent une confirmation ; supprimer un locataire te demande de saisir son slug.
- Les **secrets** (clés d’API, jetons d’invitation) ne sont affichés qu’une seule fois. Une boîte de dialogue de secret ne peut pas être fermée avec
  Échap ni par un clic à l’extérieur ; confirme d’abord que tu as conservé le secret.

## L’aide dans Studio {#help-center}

Le **Centre d’aide** contient tous les articles, tutoriels et pages de référence. Ouvre-le depuis la barre latérale
(**Centre d’aide**), avec le bouton d’aide (?) de la barre supérieure (**Aide et documentation**), ou depuis le
lien des pages de connexion et d’installation ; il fonctionne sans connexion.

- **Rechercher** : saisis du texte dans le champ de recherche (texte indicatif : Rechercher dans l’aide, par exemple « clé d’API »). Studio parcourt tous
  les articles dans ta langue, et chaque résultat ouvre la section correspondante.
- **Pour commencer** : les articles destinés aux nouveaux utilisateurs.
- Les **articles** comportent une table des matières (**Sur cette page**), **Précédent** et **Suivant**, des **Sujets
  connexes**, et un bouton pour copier un lien vers l’article. Les liens fonctionnent dans toutes les langues, et changer
  de langue laisse l’article ouvert.

### L’aide dans chaque écran {#contextual-help}

- **Aide de la page** : le bouton (?) à côté du titre d’une page (**Aide pour cette page**) ouvre l’article de
  cette page dans un panneau latéral. Tu ne perds pas ta place, et un formulaire en cours de saisie reste tel quel.
  Les liens dans le panneau ouvrent d’autres articles (**Retour** revient en arrière), **Ouvrir dans le centre d’aide** affiche
  l’article complet, et **Fermer l’aide** ferme le panneau.
- **Info-bulles** : le bouton (i) à côté d’un champ, d’une colonne ou d’un statut explique les effets, les valeurs par défaut et
  les limites. Il s’ouvre par un clic, un appui, Entrée ou Espace et se ferme avec Échap. **En savoir plus** dans l’info-bulle
  ouvre l’article associé dans le panneau latéral.
- Les liens **En savoir plus** dans les messages, les pages vides et les boîtes de dialogue de confirmation mènent à la section qui
  explique la situation.

## Les bases du clavier {#keyboard}

Tout dans Studio fonctionne au clavier :

| Touche                        | Effet                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Tab / Maj+Tab                 | Contrôle suivant / précédent. Le focus est toujours visible.                                                         |
| Tab juste après le chargement | Atteint **Aller au contenu principal** ; Entrée saute la navigation.                                                 |
| Entrée / Espace               | Active les boutons, liens, cases à cocher, interrupteurs et info-bulles.                                             |
| Touches fléchées              | Déplacement dans les menus, les listes et entre les onglets.                                                         |
| Échap                         | Ferme un menu, une boîte de dialogue, une info-bulle ou la navigation mobile (pas les boîtes de dialogue de secret). |
| F8                            | Accède à la zone de notification (messages courts).                                                                  |

Quand tu ouvres une autre page, le focus se place sur son titre, pour que les lecteurs d’écran annoncent la nouvelle page.
Plus de détails dans [clavier et accessibilité](help:keyboard-accessibility).

## Dépannage {#troubleshooting}

| Situation                                                        | Cause et solution                                                                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La barre latérale n’affiche que quelques entrées                 | Aucun produit n’est sélectionné. Choisis-en un avec le sélecteur de produit ou sous **Produits**.                                                              |
| Une entrée affiche **Désactivé**                                 | Le module du serveur n’est pas activé. Adresse-toi à l’opérateur ; consulte les [modules](help:concepts#modules).                                              |
| Une page indique **Non autorisé**                                | Tes rôles ne comportent pas l’autorisation. Consulte les [rôles et autorisations](help:roles-permissions).                                                     |
| **Pas encore disponible dans le Studio**                         | Le serveur dispose du module, mais cette version de Studio n’a pas encore d’écrans pour lui. Utilise l’API ou une version plus récente de Studio.              |
| Le sélecteur de produit ne liste pas un produit                  | Le produit est archivé, ou tu n’y as aucun rôle. Ouvre **Produits**.                                                                                           |
| La langue ou le thème diffèrent d’un navigateur à l’autre        | Un choix fait dans un navigateur y est mémorisé et l’emporte sur celui enregistré dans ton compte. Refais ton choix dans le menu utilisateur de ce navigateur. |
| Après une mise à jour du serveur, Studio se comporte bizarrement | Recharge la page ; Studio ne vérifie la version du serveur qu’au chargement.                                                                                   |
