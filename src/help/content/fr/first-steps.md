---
title: Premiers pas
summary: Une première session guidée dans Studio - crée un produit et un locataire, invite un membre, crée une clé d’API et vérifie que chaque étape a fonctionné.
keywords: démarrage, prise en main, démarrage rapide, tutoriel, débutant, premier produit, premier locataire, première clé d’API, première invitation, hello world, pas à pas, guide
---

Dans ce tutoriel, tu mets en place une petite structure de travail bien réelle : un produit, un client (locataire) dans
ce produit, une invitation pour une personne et une clé d’API qu’une machine peut utiliser. Après chaque étape,
tu vérifies le résultat, pour savoir que tout a fonctionné. Compte environ 15 minutes.

Tu apprends en chemin les termes les plus importants. Si l’un d’eux est nouveau pour toi, consulte les
[concepts clés](help:concepts).

## Avant de commencer {#before-you-start}

> [!IMPORTANT]
>
> - Tu es connecté à Studio, idéalement en tant qu’**administrateur de la plateforme** (par exemple avec le compte
>   issu de l’[installation initiale](help:first-run-setup)).
> - Pour créer un produit, il te faut l’autorisation de plateforme `products:create` et un serveur en
>   **mode multi-produit**. En mode produit unique, le produit existe déjà : passe
>   l’[étape 1](help:first-steps#create-product).
> - Pour l’[étape 4](help:first-steps#create-api-key) et sa vérification, il te faut une ligne de commande avec `curl`.

Utilise des noms d’exemple. Ce tutoriel utilise le produit « Example CRM » et le locataire « Acme Ltd ».

## Étape 1 : créer un produit {#create-product}

Un **produit** est ton application sur le serveur Axentra. Tout le reste de ce tutoriel se trouve
à l’intérieur.

1. Ouvre [Produits](app:products).
2. Choisis **Nouveau produit**.
3. Saisis le **Nom** `Example CRM`. Studio en dérive le **Slug** `example-crm` ; conserve-le.
4. Ajoute éventuellement une **Description**.
5. Choisis **Créer le produit**.

**Résultat attendu :** Studio affiche le message Produit « Example CRM » créé et ouvre la page du produit.

**Vérification :** Ouvre l’onglet **Membres**. Ton compte y figure avec le rôle **Product owner** : la
personne qui crée un produit en devient propriétaire. Le produit apparaît aussi dans le sélecteur de produit en haut.

Choisis maintenant **Ouvrir le tableau de bord**. Le tableau de bord d’« Example CRM » s’ouvre ; tous les compteurs affichent `0` sauf
**Utilisateurs** (toi, en tant qu’opérateur du produit) et **Événements d’audit (24 h)**.

## Étape 2 : créer un locataire {#create-tenant}

Un **locataire** est une organisation cliente de ton produit. Ses données sont strictement séparées de celles de tous les
autres locataires.

1. Ouvre [Locataires](app:tenants), ou choisis **Nouveau locataire** sur le tableau de bord.
2. Choisis **Nouveau locataire**.
3. Saisis le **Nom** `Acme Ltd`. Studio en dérive le **Slug** `acme-ltd`.
4. Choisis **Créer le locataire**.

**Résultat attendu :** Studio affiche le message Locataire « Acme Ltd » créé et ouvre la page du locataire avec
les onglets **Détails**, **Membres** et **Invitations**. Le statut est **Actif**.

**Vérification :** De retour sur le tableau de bord, **Locataires** affiche désormais `1`. Note l’**ID** du locataire dans
l’onglet **Détails** (il commence par `ten_`) ; tu en auras besoin à l’étape 4.

> [!NOTE]
> Un nouveau locataire n’a aucun membre. Tu en ajoutes à l’étape suivante.

## Étape 3 : inviter un membre {#invite-member}

Les personnes rejoignent un locataire par une **invitation** (ou sont ajoutées directement si elles ont déjà un
compte visible pour toi).

1. Sur la page du locataire, ouvre l’onglet **Invitations**.
2. Choisis **Inviter un membre**.
3. Saisis l’**Adresse e-mail** d’une collègue, par exemple `maria@example.com`.
4. Laisse **Rôle** sur **Member**, ou choisis un autre rôle. Les rôles au-delà de tes propres autorisations ne peuvent pas être
   sélectionnés.
5. Choisis **Envoyer l’invitation**.

**Résultat attendu :** La boîte de dialogue **Invitation créée** affiche le secret de l’invitation, marqué
**Affiché une seule fois** : avec le module `notify` activé, un **Lien d’invitation** (et Axentra envoie aussi l’invitation
par e-mail), sinon uniquement le **Jeton d’invitation**.

6. Copie le lien ou le jeton et envoie-le à ta collègue par un canal de confiance, puis choisis
   **Terminé**.

**Vérification :** L’onglet **Invitations** liste l’invitation avec le statut **En attente** et une date d’expiration
sept jours plus tard.

> [!IMPORTANT]
> Ta collègue accepte l’invitation en étant connectée avec un compte qui a exactement l’adresse e-mail
> invitée. Le fonctionnement, y compris pour les personnes sans compte, est décrit dans
> [Intégrer une organisation cliente](help:tutorial-onboard-customer#accept-invitation).

## Étape 4 : créer une clé d’API {#create-api-key}

Une **clé d’API** permet à une machine, par exemple l’intégration d’Acme, d’appeler l’API. Chaque clé possède une
liste explicite d’autorisations ; ne lui donne que ce dont elle a besoin.

1. Ouvre [Clés d’API](app:apiKeys), ou choisis **Nouvelle clé d’API** sur le tableau de bord.
2. Choisis **Nouvelle clé d’API**.
3. Saisis le **Nom** `acme-integration test`.
4. Sous **Portée locataire**, choisis **Acme Ltd**. La clé ne peut alors atteindre que les données de ce locataire.
5. Sous **Autorisations**, sélectionne uniquement `tenant:read`.
6. Choisis **Créer la clé**.

**Résultat attendu :** La boîte de dialogue **Secret de « acme-integration test »** affiche le **Secret de la clé d’API**,
qui commence par `axk_`. Copie-le maintenant : il n’est affiché que cette seule fois.

7. Coche **J’ai conservé le secret en lieu sûr**, puis choisis **Terminé**.

**Vérification :** La clé est listée avec le statut **Actif**, la portée **Locataire** et **1 autorisation**.

### Tester la clé {#try-api-key}

Appelle l’API avec la clé. Remplace l’adresse, l’ID du produit (carte **Serveur** du tableau de bord,
**ID du produit**) et l’ID du locataire :

```bash
curl -s https://axentra.example.com/v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE \
  -H "Authorization: Bearer axk_EXAMPLE_SECRET"
```

**Résultat attendu :** une description JSON du locataire :

```json
{
  "id": "ten_01EXAMPLE",
  "product_id": "prd_01EXAMPLE",
  "slug": "acme-ltd",
  "name": "Acme Ltd",
  "status": "active"
}
```

La réponse réelle contient quelques champs supplémentaires. De retour dans Studio, recharge **Clés d’API** : **Dernière utilisation**
affiche maintenant une heure.

Si l’appel échoue, consulte le [dépannage](help:first-steps#troubleshooting). Pour découvrir l’API, consulte
les [bases de l’API](help:api-basics).

## Étape 5 : consulter le journal d’audit {#check-audit}

Tout ce que tu viens de faire a été enregistré.

1. Ouvre le [Journal d’audit](app:audit).
2. Sous **Produit**, choisis « Example CRM » et applique le filtre.

**Résultat attendu :** Tu vois, du plus récent au plus ancien, `access.api_key.create`, `tenancy.invitation.create`,
`tenancy.tenant.create` et (en mode multi-produit) `tenancy.product.create`, chacun avec toi comme
auteur et le résultat **Succès**. Sélectionne une entrée pour en voir les détails.

## Ce que tu as construit {#summary}

```diagram
hierarchy
```

Tu disposes d’un produit avec un locataire, d’une invitation ouverte et d’une clé d’API liée au locataire, et tu sais où
vérifier chacun d’eux. Pour continuer :

- Intègre un vrai client de bout en bout : [Intégrer une organisation cliente](help:tutorial-onboard-customer).
- Définis tes propres rôles : [rôles et autorisations](help:roles-permissions).
- Supprime la clé de test : sur **Clés d’API**, ouvre les actions de la clé et choisis **Révoquer la clé**.

## Dépannage {#troubleshooting}

| Problème                                                   | Cause et solution                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Nouveau produit** est absent                             | Tu n’es pas administrateur de la plateforme, ou le serveur fonctionne en mode produit unique. Utilise le produit existant.    |
| **Conflit** lors de la création du produit ou du locataire | Le slug est déjà pris (produits : sur le serveur ; locataires : dans le produit). Choisis un autre slug.                      |
| **Vérifie ta saisie** pour le slug                         | Les slugs comptent de 2 à 63 caractères : lettres minuscules, chiffres et tirets, et commencent par une lettre ou un chiffre. |
| **Conflit** lors de l’invitation                           | Une invitation ouverte existe déjà pour cette adresse dans le locataire. Révoque-la ou utilise-la.                            |
| **Non autorisé** lors de la création de la clé             | Tu as sélectionné une autorisation que tu ne détiens pas toi-même.                                                            |
| `curl` répond `401`                                        | Le secret est incomplet ou erroné, ou la clé a été révoquée. Crée une nouvelle clé.                                           |
| `curl` répond `404`                                        | L’ID du produit ou du locataire est erroné, ou la clé est liée à un autre locataire.                                          |
| `curl` répond `403`                                        | Il manque l’autorisation (`tenant:read`) à la clé, ou le locataire est suspendu.                                              |
| Le journal d’audit n’affiche rien                          | Il te faut `audit:read` pour le produit (ou un rôle sur la plateforme). Vérifie le filtre **Produit**.                        |
