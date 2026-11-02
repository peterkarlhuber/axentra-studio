---
title: Questions fréquentes
summary: Des réponses courtes aux questions les plus fréquentes sur le Studio, avec des liens vers les détails.
keywords: FAQ, foire aux questions, questions, comment faire, pourquoi, aide, réponses, questions courantes
---

Des réponses courtes aux questions courantes. Chaque réponse renvoie vers l’article qui donne les
détails.

## Puis-je créer des comptes utilisateurs dans le Studio ? {#create-users}

Non. Les comptes sont créés lors de la [première installation](help:first-run-setup), lorsque
quelqu’un accepte une invitation, ou lors de la première connexion par authentification unique.
Dans le Studio, tu invites des personnes dans un locataire ou tu ajoutes des comptes existants
comme membres. Voir [Membres et invitations](help:members-invitations).

## Comment faire de quelqu’un un opérateur du produit ? {#add-operator}

Axentra ne propose pas d’invitations au niveau du produit. La personne a besoin d’un compte que tu
peux voir : invite-la d’abord dans l’un des locataires du produit ; une fois qu’elle a accepté,
ajoute-la sur la page du produit sous **Membres**. Un administrateur de la plateforme peut ajouter
directement n’importe quel compte existant. Voir [Produits](help:products).

## Quelle est la différence entre un rôle de produit et un rôle de locataire ? {#product-vs-tenant-role}

Un rôle de locataire (par exemple **Member**) ne s’applique que dans ce locataire. Un rôle de
produit (par exemple **Product admin**) s’applique au produit dans son ensemble _et_ à chacun de
ses locataires. N’attribue des rôles de produit qu’aux personnes qui ont besoin de cette portée.
Voir [Rôles et autorisations](help:roles-permissions).

## Quelle est la différence entre Owner et Admin d’un locataire ? {#owner-vs-admin}

Ils ont les mêmes autorisations. Seul un **Owner** (ou une personne ayant autorité au niveau du
produit ou de la plateforme) peut nommer quelqu’un propriétaire, ou modifier ou retirer un
propriétaire. Chaque locataire conserve au moins un propriétaire. Voir
[Plafond de rôle](help:security#role-ceiling).

## Pourquoi ne puis-je pas choisir certains rôles ? {#roles-greyed-out}

Le Studio signale les rôles que tu ne peux pas attribuer par **« … (au-delà de tes
autorisations) »** : ils contiennent des autorisations que tu ne possèdes pas toi-même, ou ce sont
des rôles de propriétaire et tu n’es pas propriétaire. Personne ne peut distribuer plus de droits
qu’il n’en a. Voir [Plafond de rôle](help:security#role-ceiling).

## J’ai perdu le secret d’une clé d’API. Puis-je le revoir ? {#lost-secret}

Non. Les secrets ne sont affichés qu’une seule fois et le serveur n’en conserve qu’un hachage.
Utilise **Renouveler le secret** pour en obtenir un nouveau ; un délai de grâce maintient l’ancien
secret valide pendant que tu mets à jour tes services. Voir [Clés d’API](help:api-keys).

## Qu’advient-il des données lorsque je suspends un locataire ? {#suspend-data}

Rien n’est supprimé. Les membres et les clés d’API perdent l’accès jusqu’à la réactivation du
locataire ; les administrateurs de la plateforme peuvent toujours le consulter. Les propriétaires et les administrateurs du produit
peuvent le réactiver depuis la page du locataire dans Studio. Supprimer un
locataire, en revanche, efface le locataire et toutes ses données, de façon irréversible. Voir
[Locataires](help:tenants).

## Pourquoi vois-je « Introuvable » pour quelque chose qui existe ? {#not-found-exists}

Si tu n’as aucun lien avec un produit ou un locataire, Axentra répond exactement comme s’il
n’existait pas, afin que personne ne puisse découvrir quels produits, locataires ou comptes
existent. Demande à une personne qui y a accès de t’ajouter. Voir
[Introuvable](help:troubleshooting#not-found).

## Pourquoi une section de la barre latérale est-elle marquée « Désactivé » ? {#area-off}

Le module serveur correspondant est désactivé. Un opérateur peut l’activer dans la configuration du
serveur. Voir la [référence des modules](help:modules-reference).

## Pourquoi un bouton me manque-t-il ? {#button-missing}

Le Studio masque les actions que tes autorisations ne permettent pas, et certaines actions
dépendent du mode du serveur (par exemple **Nouveau produit** n’existe qu’en mode multi-produit).
Recherche l’autorisation dans la [référence des autorisations](help:permissions-reference).

## Pourquoi ai-je été déconnecté ? {#signed-out}

Les sessions prennent fin après une durée de vie maximale, après une période d’inactivité,
lorsqu’elles sont révoquées, lorsque ton compte est désactivé et lorsque ton mot de passe a été
changé dans une autre session. Reconnecte-toi ; le Studio te ramène à la page où tu étais. Voir
[Sécurité](help:security#sessions).

## Puis-je payer ou enregistrer une carte bancaire dans le Studio ? {#payment}

Non. Le Studio ne demande jamais de données de carte ni de coordonnées bancaires. Les offres
payantes passent par la page de paiement hébergée du prestataire de paiement. Voir
[Offres et abonnements](help:plans-subscriptions).

## Puis-je modifier des enregistrements dans le Studio ? {#edit-records}

Oui, avec l’autorisation `records:write` dans le locataire concerné. L’enregistrement remplace
l’objet JSON complet de l’enregistrement. Voir [Enregistrements](help:records).

## Pourquoi les heures des planifications diffèrent-elles de ce que j’ai saisi ? {#utc}

Les planifications s’exécutent en UTC (sans heure d’été). Le Studio affiche la prochaine et la
dernière exécution dans ton propre fuseau horaire. Voir [Planifications](help:schedules).

## Où modifier la configuration du serveur ? {#server-config}

Pas dans le Studio. La page **Paramètres** affiche la configuration effective ; les modifications
sont faites sur le serveur par un opérateur. Voir [Paramètres](help:settings) et
[Configuration du serveur](help:server-configuration).

## Pourquoi certains textes sont-ils en anglais alors que j’utilise une autre langue ? {#english-texts}

Les descriptions des rôles intégrés et des autorisations ainsi que le **Message du serveur** dans
les détails d’une erreur proviennent du serveur et sont toujours en anglais. Tout le reste du
Studio est traduit.

## Comment signaler un problème ? {#report-problem}

Ouvre **Détails techniques** dans le message d’erreur et copie l’**ID de requête** (`req_…`).
Envoie-le à ton opérateur avec l’heure et ce que tu faisais. Voir
[l’ID de requête](help:troubleshooting#request-id).

## Le Studio fonctionne-t-il sur un téléphone ? {#mobile}

Oui. Sur les écrans étroits, la barre latérale devient un tiroir derrière **Ouvrir la
navigation**, et les colonnes de tableau les moins importantes sont masquées. Voir
[Clavier et accessibilité](help:keyboard-accessibility#zoom).

## Puis-je utiliser le Studio uniquement au clavier ou avec un lecteur d’écran ? {#accessibility}

Oui. Chaque fonction est utilisable au clavier, et le Studio est conçu pour respecter le niveau AA
des WCAG 2.1. Voir [Clavier et accessibilité](help:keyboard-accessibility).
