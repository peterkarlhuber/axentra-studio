---
title: Sécurité
summary: Comment Axentra et le Studio protègent les connexions, séparent les locataires, limitent ce que chacun peut accorder et traitent les secrets, et ce que tu peux faire pour sécuriser ton installation.
keywords: sécurité, session, cookie, CSRF, sécurité au niveau des lignes, row-level security, RLS, isolation des locataires, plafond de rôle, secret, clé d’API, renouvellement, rotation, signature de webhook, HMAC, audit, confidentialité, RGPD, GDPR, mot de passe
---

Axentra est conçu pour qu’une erreur à un endroit n’ouvre pas tout : l’accès est refusé tant
qu’aucun rôle ne l’accorde, les données de chaque locataire sont séparées dans la base de données,
personne ne peut distribuer plus de droits qu’il n’en possède, et les secrets sont affichés une
seule fois puis stockés uniquement sous une forme illisible. Cette page explique ces protections
en termes simples, ce que tu en vois dans le Studio et les bonnes habitudes qui gardent une
installation sûre.

> [!NOTE]
> Le Studio n’est qu’une fenêtre sur le serveur Axentra. Chaque décision (qui peut voir ou modifier
> quoi) est prise par le serveur. Le Studio masque les boutons que tu ne peux pas utiliser, mais ce
> masquage est une commodité, pas la protection.

## Sessions et protection CSRF {#sessions-csrf}

### Ta session {#sessions}

Lorsque tu te connectes, le serveur crée une _session_ et ton navigateur reçoit un cookie de
session. Le cookie est marqué de sorte que les scripts d’une page ne puissent pas le lire, et en
HTTPS il n’est envoyé que sur des connexions chiffrées. Le serveur ne stocke qu’une empreinte
(hachage) du jeton de session, jamais le jeton lui-même. Un nouveau jeton est créé à chaque
connexion.

Une session prend fin :

- après sa durée de vie maximale (par défaut 12 heures),
- après une période sans activité (par défaut 120 minutes),
- lorsque tu choisis **Se déconnecter** dans le menu utilisateur,
- lorsque tu la révoques sous **Tes sessions** dans ton [profil](help:profile), ou qu’un
  administrateur utilise **Déconnecter partout** sur ta page utilisateur,
- lorsque ton compte est désactivé,
- pour toutes tes _autres_ sessions, lorsque tu changes ton mot de passe.

Ton opérateur peut modifier ces durées. Lorsqu’une session prend fin, le Studio t’amène sur la page
de connexion, puis te ramène là où tu étais (voir
[Session terminée](help:troubleshooting#session-ended)).

### Protection CSRF {#csrf}

La _falsification de requête intersites_ (CSRF, cross-site request forgery) est une attaque dans
laquelle un autre site web tente de faire envoyer à ton navigateur une modification vers Axentra
pendant que tu es connecté. Axentra la bloque de trois façons, sans que tu aies quoi que ce soit à
faire :

1. Le cookie de session n’est pas joint aux requêtes que d’autres sites déclenchent en
   arrière-plan (`SameSite=Lax`).
2. Chaque modification envoyée par le Studio porte un jeton de sécurité propre à ta session. Le
   Studio conserve ce jeton uniquement en mémoire, jamais dans le stockage du navigateur.
3. Le serveur vérifie que la requête provient d’une adresse de confiance (l’adresse du Studio doit
   figurer dans la liste des origines autorisées du serveur).

Si le Studio tourne à une adresse à laquelle le serveur ne fait pas confiance, la connexion et
chaque modification échouent avec **Non autorisé** ; voir
[La connexion ou l’enregistrement échoue](help:troubleshooting#csrf-origin).

### Mots de passe et tentatives de connexion {#passwords}

Les mots de passe sont stockés avec Argon2id, une fonction de hachage à sens unique volontairement
lente. La politique du serveur exige par défaut au moins 12 caractères. Une connexion échouée
indique toujours que l’adresse e-mail _ou_ le mot de passe est erroné, afin que personne ne puisse
savoir quels comptes existent. Après environ 10 tentatives échouées pour un même compte en une
minute (davantage depuis une même adresse réseau), les tentatives suivantes sont refusées pendant
jusqu’à une minute.

Définir un _premier_ mot de passe sur un compte qui se connecte uniquement par authentification
unique n’est autorisé que dans les quelques minutes suivant la connexion, afin qu’une session volée
ne puisse pas être transformée en connexion permanente par mot de passe (voir
[Reconnecte-toi](help:troubleshooting#reauthentication-required)).

## Isolation des locataires {#tenant-isolation}

Chaque client ou organisation d’un produit est un [locataire](help:tenants). Axentra sépare les
locataires à l’aide de deux couches indépendantes :

1. **Vérification des autorisations.** Avant toute lecture ou écriture de données, le serveur
   vérifie que tu disposes (ou que la clé d’API dispose) de l’autorisation requise pour ce produit
   et ce locataire précis.
2. **Sécurité au niveau des lignes dans la base de données.** Chaque transaction de base de
   données est limitée à un produit ou à un locataire. Même si une requête oubliait un filtre, la
   base de données elle-même ne renvoie que les lignes de ce produit ou de ce locataire et refuse
   d’écrire des lignes pour un autre.

Ce que cela signifie pour toi :

- Un membre d’un locataire ne voit que les données de son propre locataire. Les personnes sans lien
  avec un produit ou un locataire obtiennent **Introuvable**, exactement comme s’il n’existait pas.
- Un rôle au niveau du produit (par exemple **Product admin**) s’applique dans _chaque_ locataire
  du produit. N’attribue des rôles de produit qu’aux personnes qui ont réellement besoin de cette
  portée.
- Une clé d’API appartient à un produit et peut être restreinte à un locataire.
- Les comptes utilisateurs sont globaux : un même compte peut travailler dans plusieurs produits et
  locataires. Les administrateurs d’un produit ne voient que les utilisateurs liés à leur produit.

> [!NOTE]
> Les administrateurs de la base de données, ainsi que les sauvegardes de la base, peuvent voir
> toutes les données. La protection du serveur de base de données et de ses sauvegardes relève de
> l’opérateur.

## Plafond de rôle : personne ne peut accorder plus qu’il ne possède {#role-ceiling}

Avoir le droit de gérer les membres (`members:manage`, ou `product_members:manage` pour les
opérateurs de produit) ne signifie pas que tu peux faire de n’importe qui un administrateur. Le
serveur applique un _plafond de rôle_ :

- Tu ne peux attribuer un rôle (ajouter, inviter ou modifier un membre) que si **tu possèdes chaque
  autorisation de ce rôle** dans la même portée.
- Tu ne peux modifier ou retirer un membre que si son rôle _actuel_ reste lui aussi dans les
  limites de tes autorisations.
- Les rôles de propriétaire (**Owner** d’un locataire, **Product owner** d’un produit) ne peuvent
  être attribués, modifiés ou retirés que par un propriétaire de la même portée, ou par une
  personne ayant autorité au niveau supérieur : les opérateurs de produit pour les locataires, les
  administrateurs de la plateforme partout.
- Le dernier propriétaire d’un produit ou d’un locataire ne peut pas être retiré ni rétrogradé, et
  le dernier administrateur de la plateforme ne peut pas être désactivé ni rétrogradé.

Dans le Studio, les rôles que tu ne peux pas attribuer apparaissent sous la forme **« … (au-delà de
tes autorisations) »** et ne peuvent pas être sélectionnés ; les membres situés au-dessus de ton
niveau affichent **Supérieur à ton propre rôle : seule une personne disposant des autorisations de
ce rôle peut le modifier**. Le même principe s’applique aux clés d’API : une nouvelle clé ne peut
détenir que des autorisations que possède son créateur. Les autorisations de plateforme ne sont
jamais accordées aux clés d’API.

Détails et exemples : [Rôles et autorisations](help:roles-permissions) et la
[référence des autorisations](help:permissions-reference).

## Secrets à usage unique {#one-time-secrets}

Certaines valeurs sont des secrets qui permettent à une machine ou à une personne d’agir en ton
nom. Axentra affiche chacun d’eux **une seule fois** :

| Secret                                     | Quand il est affiché                                              | Comment le serveur le conserve                         |
| ------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Secret de clé d’API (`axk_…`)              | Après la création ou le renouvellement d’une clé                  | Uniquement un hachage ; il ne peut plus être affiché   |
| Secret de signature de webhook (`whsec_…`) | Après la création d’un webhook ou le renouvellement de son secret | Chiffré (AES-256-GCM), utilisé uniquement pour signer  |
| Lien et jeton d’invitation                 | Après la création d’une invitation                                | Uniquement un hachage du jeton                         |
| Jeton d’installation                       | Affiché sur le serveur pour le premier administrateur             | Uniquement un hachage ; valable pour une durée limitée |

Dans le Studio, les secrets de clés d’API et de webhooks apparaissent dans une boîte de dialogue
avec un avertissement, un champ masqué et des boutons de copie. La boîte de dialogue ne peut pas
être fermée avec Échap ni par un clic à l’extérieur ; tu confirmes avec **J’ai conservé le secret
en lieu sûr**. Les liens et jetons d’invitation sont affichés dans un encadré marqué **Affiché une
seule fois**.

Si un secret est perdu, il ne peut pas être récupéré : [renouvelle la clé d’API](help:api-keys),
renouvelle le [secret du webhook](help:webhooks) ou crée une nouvelle invitation.

## Bonnes pratiques pour les clés d’API {#api-key-hygiene}

Les [clés d’API](help:api-keys) permettent à d’autres systèmes d’appeler l’API Axentra. Bonnes
pratiques :

- **Une clé par service et par environnement**, nommée d’après son lieu d’utilisation (par exemple
  « billing-worker production »), pour pouvoir en révoquer une sans casser les autres.
- **Moindre privilège :** n’accorde que les autorisations dont le service a besoin, et restreins la
  clé à un locataire lorsque le service ne travaille que pour un seul locataire.
- **Stocke les secrets dans un gestionnaire de secrets**, jamais dans le code source, les tickets
  ou la messagerie instantanée.
- **Renouvelle régulièrement** avec **Renouveler le secret**. Un délai de grâce (jusqu’à 7 jours)
  maintient l’ancien secret valide pendant que tu mets à jour les services.
- **Révoque les clés dont tu n’as plus besoin.** Révoquer une clé révoque aussi toutes les clés
  créées avec elle. Les clés créées par une personne ne fonctionnent que tant que cette personne
  garde les autorisations qu’elles utilisent ([détails](help:api-keys#creator-permissions)) :
  lorsque quelqu’un part, remplace les clés qu’il a configurées et révoque les anciennes.
- Surveille la colonne **Dernière utilisation** : une clé jamais utilisée peut disparaître ; une
  clé utilisée de façon inattendue mérite un coup d’œil dans le [journal d’audit](help:audit).

## Signatures de webhook {#webhook-signing}

Axentra signe chaque requête de [webhook](help:webhooks) pour que le système destinataire puisse
vérifier qu’elle provient bien de ton serveur Axentra et qu’elle n’a été ni modifiée ni rejouée.
Chaque requête porte un en-tête `Axentra-Signature` :

```text
Axentra-Signature: t=1767225600,v1=5f2b…
```

`t` est l’heure de la signature (secondes Unix) ; `v1` est un HMAC-SHA256 de
`<t>.<raw request body>` calculé avec le secret de signature du webhook. Pendant un renouvellement
de secret avec délai de grâce, l’en-tête porte deux valeurs `v1`, une par secret. Le destinataire
doit :

1. calculer le HMAC sur l’horodatage, un point et le corps brut,
2. le comparer à chaque valeur `v1` en temps constant,
3. rejeter les requêtes dont l’horodatage date de plus de 5 minutes environ,
4. ignorer les événements dont l’identifiant (`Axentra-Event-Id`) a déjà été traité.

Le [tutoriel sur le récepteur de webhooks](help:tutorial-webhook-receiver) présente un exemple
complet.

## Piste d’audit {#audit-trail}

Le serveur enregistre les modifications liées à la sécurité dans un [journal d’audit](help:audit)
en ajout seul : qui (utilisateur ou clé d’API), quoi (par exemple `access.role.create`), quand,
dans quel produit et quel locataire, le résultat, l’ID de requête, l’adresse IP et le navigateur ou
le client. Les secrets sont retirés des détails enregistrés avant le stockage.

Les opérateurs de produit disposant de `audit:read` voient les événements de leur produit ; les
administrateurs et lecteurs de la plateforme (`platform:audit`) voient les événements à l’échelle
de l’installation, comme les connexions et les modifications d’utilisateurs. Les événements
d’audit sont conservés pendant une durée fixée par ton opérateur (par défaut 365 jours).

## Ce que le Studio ne stocke jamais {#what-studio-never-stores}

- **Aucun secret dans le navigateur.** Le jeton CSRF et un jeton de supervision que tu saisis ne
  sont conservés qu’en mémoire et disparaissent lorsque tu fermes ou recharges l’onglet. Les
  secrets à usage unique sont affichés, jamais enregistrés.
- **Uniquement des préférences anodines dans le stockage du navigateur :** la langue, le thème, la
  barre latérale réduite et le dernier produit utilisé.
- **Aucune donnée de carte ni coordonnée bancaire.** Le Studio ne demande jamais de données de
  paiement ; les paiements se font uniquement sur la page hébergée du prestataire de paiement
  (voir [Offres et abonnements](help:plans-subscriptions)).
- **Aucun script tiers.** Le Studio charge son code uniquement depuis sa propre adresse. Les
  aperçus d’e-mails s’affichent dans un bac à sable qui ne peut pas exécuter de scripts.

Le serveur retire aussi les mots de passe, jetons et clés de ses journaux, de ses messages d’erreur
et des détails d’audit.

## Bonnes pratiques {#good-practice}

- Attribue les rôles sur la plateforme avec parcimonie ; privilégie les rôles de produit et de
  locataire.
- Utilise les rôles intégrés lorsqu’ils conviennent, et des rôles personnalisés avec uniquement les
  autorisations nécessaires.
- Désactive les comptes des personnes qui partent (**Désactiver l’utilisateur** met fin à toutes
  leurs sessions d’un coup) et passe en revue les clés d’API qu’elles ont créées.
- Consulte régulièrement le [journal d’audit](help:audit), en particulier les modifications de
  rôles, de clés et de membres.
- Déconnecte-toi sur les ordinateurs partagés, et révoque dans ton [profil](help:profile) les
  sessions que tu ne reconnais pas.

> [!IMPORTANT]
> Axentra fournit des mesures techniques (séparation des locataires, chiffrement des secrets
> stockés, piste d’audit, minimisation des données dans les journaux), mais il ne rend pas à lui
> seul une installation conforme au droit de la protection des données, comme le RGPD.
> L’hébergement, les sauvegardes, la conservation et les demandes des personnes concernées
> relèvent de l’opérateur. Il n’existe pas encore d’export ni d’effacement intégré des données
> d’une personne (voir [limitations](help:limitations)).

## Dépannage {#troubleshooting}

| Situation                                                                                                                                 | Cause et solution                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La connexion et toutes les modifications échouent avec **Non autorisé** (`cross-origin request refused`, `missing or invalid CSRF token`) | L’adresse du Studio ne figure pas parmi les origines autorisées du serveur, ou le cookie est bloqué. Voir [l’entrée de dépannage](help:troubleshooting#csrf-origin). |
| Tu es déconnecté de façon inattendue                                                                                                      | La session a expiré, a été révoquée, ou ton mot de passe a été changé dans une autre session. Reconnecte-toi.                                                        |
| **Non autorisé** lors de l’attribution d’un rôle                                                                                          | Plafond de rôle : le rôle comporte des autorisations que tu n’as pas, ou c’est un rôle de propriétaire. Adresse-toi à un propriétaire.                               |
| **Non autorisé** lors de la création d’une clé d’API                                                                                      | Tu as tenté d’accorder une autorisation que tu n’as pas toi-même. Retire-la de la sélection.                                                                         |
| **Reconnecte-toi** lors de la définition d’un mot de passe                                                                                | Autorisé uniquement peu après la connexion. Choisis **Se reconnecter**, puis recommence aussitôt.                                                                    |
| Un destinataire rejette les signatures de webhook                                                                                         | Il doit signer le corps _brut_, accepter n’importe quelle valeur `v1` et utiliser le secret actuel. Voir [Webhooks](help:webhooks).                                  |
| Tu as perdu un secret                                                                                                                     | Il ne peut plus être affiché ; renouvelle-le ou crée une nouvelle invitation.                                                                                        |
