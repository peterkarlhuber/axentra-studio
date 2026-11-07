---
title: Notifications
summary: Rédiger des modèles d’e-mail en plusieurs langues, les prévisualiser et les tester, suivre la remise dans le journal des messages et définir tes propres préférences de notification.
keywords: notification, e-mail, courriel, mail, modèle, message, boîte d’envoi, remise, envoi, SMTP, aperçu, envoi de test, boîte de réception, désinscription, désabonnement, préférences, langue, traduction
---

Axentra envoie des e-mails à partir de **modèles**. Un modèle possède une clé, une catégorie et une
**variante** par langue avec un objet, un corps texte et un corps HTML facultatif. Ton produit (ou
Axentra lui-même, pour les invitations) envoie un modèle à un destinataire avec des valeurs pour ses
espaces réservés ; Axentra effectue le rendu, stocke le message dans une boîte d’envoi et le remet
en arrière-plan. Dans le Studio, tu rédiges et prévisualises des modèles, tu envoies des messages de
test, tu vérifies le statut de remise et tu choisis les notifications que tu reçois toi-même.

> [!IMPORTANT]
> L’écran **Notifications** nécessite le module `notify` sur le serveur ; sans lui, l’entrée
> n’apparaît pas dans la navigation (et les invitations n’envoient aucun e-mail). Les modèles, le
> journal des messages, la boîte de réception et les statistiques nécessitent l’autorisation de
> produit `notify:manage`. L’envoi d’un test nécessite en plus `notify:send` dans le locataire.
> Toute personne appartenant au produit peut définir ses propres préférences.

## L’écran Notifications {#overview}

Ouvre [Notifications](app:notifications). Avec `notify:manage`, tu vois les **Statistiques de
remise** et les onglets **Modèles**, **Journal des messages**, **Boîte de réception** et **Mes
préférences**. Sans cette autorisation, tu ne vois que **Mes préférences**.

Les **Statistiques de remise** comptent les messages de ce produit par statut, au total et pour les
**Dernières 24 heures**, et affichent le **Prestataire de remise**, les **Tentatives de remise
(24 h)** et le **Plus ancien message en file d’attente**. La carte s’actualise toutes les
30 secondes. Un message ancien en file d’attente signifie généralement qu’aucun répartiteur ne
tourne (voir [Dépannage](help:notifications#troubleshooting)).

## Modèles {#templates}

L’onglet **Modèles** liste tes modèles et les modèles par défaut **Intégré**, avec catégorie,
langues et version. Badges :

- **Intégré** : un modèle par défaut fourni avec Axentra (actuellement `invitation`, en anglais et
  en allemand). Ouvre-le et enregistre-le pour créer ta propre version avec la même clé, qui
  remplace le modèle par défaut pour ce produit. Supprimer ta version rétablit le modèle par
  défaut.
- **Sensible** : le contenu des messages envoyés n’est jamais affiché et il est effacé une fois
  l’envoi effectué.
- **Système uniquement** : Axentra envoie ce modèle lui-même (l’e-mail d’invitation avec son lien
  d’acceptation à usage unique). Tu peux modifier son contenu, mais il ne peut pas être envoyé
  manuellement ni en test.

### Créer un modèle {#create-template}

1. Choisis **Nouveau modèle**.
2. Sous **Général**, saisis la **Clé du modèle**, par exemple `welcome`. Ton produit envoie le
   modèle avec cette clé ; elle ne peut plus être modifiée ensuite.
3. Facultatif : **Nom** et **Description** pour le Studio.
4. Saisis la **Catégorie**, par exemple `onboarding` (voir
   [Catégories](help:notifications#categories)).
5. Active **Sensible** pour un contenu comme des liens ou des codes à usage unique.
6. Sous **Variables et valeurs d’exemple**, déclare chaque espace réservé et indique une valeur
   d’exemple pour l’aperçu (voir [Espaces réservés](help:notifications#placeholders)).
7. Sous **Contenu par langue**, renseigne **Objet** et **Texte** pour `en`, et éventuellement
   **HTML**.
8. Ajoute d’autres langues (voir [Langues](help:notifications#locale-variants)).
9. Choisis **Créer le modèle**.

Chaque enregistrement ultérieur incrémente la version (**Enregistrer une nouvelle version**). Les
anciennes versions ne sont pas conservées : le journal des messages stocke le contenu rendu et le
numéro de version de chaque message, pas l’ancien modèle.

### Paramètres d’un modèle {#template-settings}

| Paramètre              | Effet                                                                               | Valeurs autorisées / par défaut                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Clé du modèle**      | Identifiant utilisé lors de l’envoi                                                 | 2 à 63 caractères : lettres minuscules, chiffres, `_`, `.` et `-`, commençant par une lettre ; non modifiable |
| **Catégorie**          | Regroupe les modèles pour les désinscriptions                                       | 2 à 41 lettres minuscules, chiffres et `_`, commençant par une lettre ; par défaut `transactional`            |
| **Canal**              | Canal de remise                                                                     | **E-mail** uniquement                                                                                         |
| **Sensible**           | Le contenu des messages envoyés n’est jamais renvoyé et il est effacé après l’envoi | Désactivé                                                                                                     |
| **Variables**          | Espaces réservés que le modèle peut utiliser                                        | 50 au maximum ; lettres, chiffres et `_`, sans commencer par un chiffre                                       |
| **Contenu par langue** | Objet, texte et HTML facultatif par langue                                          | 1 à 20 langues ; `en` est obligatoire                                                                         |

### Espaces réservés {#placeholders}

Écris les espaces réservés sous la forme `{{ name }}` dans l’objet, le texte ou le HTML. Seuls les
espaces réservés simples sont pris en charge : pas de conditions, de boucles, de filtres ni
d’expressions, et tout autre élément commençant par `{{` est refusé à l’enregistrement. Chaque
espace réservé doit être déclaré comme variable ; si le texte en utilise qui ne sont pas déclarés,
le Studio propose **Déclarer les espaces réservés utilisés**.

Lors de l’envoi d’un message, chaque espace réservé doit avoir une valeur (chaîne, nombre ou
true/false, 10 000 caractères au maximum). Les valeurs sont insérées telles quelles dans le corps
texte ; dans le corps HTML, elles sont échappées. Les objets ne contiennent jamais de saut de
ligne.

> [!WARNING]
> Une valeur utilisée dans un lien (`href`) contrôle la cible du lien. Garde les liens dans le
> modèle ou laisse ton backend les construire ; ne laisse pas les utilisateurs finaux les fournir.

### Catégories {#categories}

Les destinataires peuvent se désinscrire de catégories dans leurs préférences. `transactional` et
`security` sont toujours remises et on ne peut pas s’en désinscrire. Utilise-les uniquement pour les
messages qu’un utilisateur doit recevoir, comme les réinitialisations de mot de passe ou les reçus.
Le Studio propose `transactional`, `security`, `onboarding` et `product` ; tu peux saisir n’importe
quelle catégorie valide.

### Langues et repli {#locale-variants}

Chaque langue est une **variante**. Pour en ajouter une, saisis un code de langue comme `de` ou
`de-at` dans **Ajouter une langue** et choisis **Ajouter** ; **Supprimer la langue …** la retire.
L’anglais (`en`) est obligatoire.

Axentra choisit la variante dans cet ordre : la langue demandée (par exemple `de-at`), puis sa
langue de base (`de`), puis `en`. La langue demandée est celle choisie lors de l’envoi, sinon la
langue de l’utilisateur destinataire, sinon (pour les invitations) la langue par défaut du produit,
sinon l’anglais.

## Aperçu {#preview}

L’**Aperçu** à côté de l’éditeur est rendu par le serveur à partir de l’état actuel, non
enregistré, avec tes valeurs d’exemple, un instant après que tu as arrêté de taper. Choisis la
langue dans le sélecteur de l’aperçu ; « Rendu dans la langue … » t’indique quelle variante a été
utilisée. L’aperçu apparaît dès que chaque langue a un objet et un texte.

Le HTML s’affiche dans un cadre isolé : les scripts ne s’exécutent jamais, et les images, polices
et styles distants ne sont pas chargés. Les logiciels de messagerie des destinataires peuvent
afficher le message différemment.

## Envoyer un test {#send-test}

**Envoyer un test** (dans l’éditeur, ou l’icône d’envoi dans la liste des modèles) envoie une
**vraie** notification :

1. Choisis le **Locataire**. Le message appartient à ce locataire ; tu as besoin de `notify:send`
   dans celui-ci.
2. Choisis le destinataire :
   - **Un membre du locataire** : choisis le **Membre**. Sa langue est utilisée, sauf si tu en
     choisis une.
   - **Une adresse e-mail** : uniquement avec l’autorisation de produit `notify:send_external`
     (propriétaires et administrateurs du produit). Sans elle, le Studio t’indique que tu ne peux
     envoyer qu’à des membres.
3. Facultatif : choisis une **Langue** ; sans choix, la langue du destinataire est utilisée, à
   défaut l’anglais.
4. Ajuste les **Valeurs** (préremplies avec les valeurs d’exemple).
5. Facultatif : **Aperçu** affiche le résultat avec ces valeurs. Choisis ensuite **Envoyer**.

Le Studio confirme **Notification acceptée** avec l’identifiant et le statut du message. La remise
a lieu de façon asynchrone ; suis-la dans le **Journal des messages**. Chaque boîte de dialogue
envoie avec sa propre clé d’idempotence : un nouveau clic après une erreur réseau n’envoie donc pas
le message deux fois.

Si le destinataire s’est désinscrit de la catégorie du modèle, le message est accepté avec le
statut **Bloqué** et n’est pas remis.

## Journal des messages {#message-log}

Le **Journal des messages** est la boîte d’envoi : chaque notification du produit avec l’heure, le
modèle (clé, version et langue), le **Destinataire**, le **Statut**, les **Tentatives** et la
**Dernière erreur**. Filtre par **Statut**, **Clé du modèle**, **Destinataire** et **Locataire**,
puis choisis **Appliquer** ; **Réinitialiser les filtres** les efface. L’icône de détails ouvre
tous les champs et, si disponible, le contenu.

| Statut                | Signification                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **En file d’attente** | En attente du répartiteur ; **Prochaine tentative** indique quand                                        |
| **Envoi en cours**    | Un répartiteur est en train de le remettre                                                               |
| **Envoyé**            | Le prestataire l’a accepté                                                                               |
| **Échoué**            | Erreur permanente, ou toutes les tentatives épuisées                                                     |
| **Bloqué**            | Non envoyé : le destinataire s’est désinscrit de la catégorie, ou l’utilisateur n’a pas d’adresse e-mail |

Une remise échouée est automatiquement retentée avec des délais d’attente croissants, par défaut
jusqu’à 5 tentatives. **Relancer la remise** remet un message **Échoué** dans la file d’attente avec
de nouvelles tentatives. Ce n’est plus possible une fois le contenu effacé par la conservation ;
envoie alors à nouveau la notification.

Le contenu peut être absent : les modèles sensibles ne l’affichent jamais, la conservation l’efface
(par défaut 30 jours après la remise) et les messages bloqués n’en stockent aucun. Le Studio indique
quel cas s’applique. Le serveur retire les jetons, clés et mots de passe de la dernière erreur.

> [!NOTE]
> La remise se fait au moins une fois : après un plantage, un message peut être remis deux fois.
> Les messages portent un Message-ID stable, ce qui permet aux serveurs de messagerie de repérer
> les doublons. L’ordre des messages n’est pas garanti.

## Boîte de réception {#mailbox}

La **Boîte de réception** n’existe que lorsque le serveur utilise le prestataire de développement
local (`notify.provider = "local"`). Ce prestataire n’envoie rien ; il stocke ici ce qu’il a
« remis », ce qui te permet de vérifier les modèles sur les serveurs de développement et de test.
Filtre par **Destinataire** et ouvre un message pour le voir tel qu’il a été remis.

Avec un vrai prestataire (SMTP), l’onglet indique **Aucune boîte de réception locale sur ce
serveur** : les messages partent vers de vrais destinataires, et tu les suis dans le **Journal des
messages**.

## Mes préférences {#preferences}

Dans **Mes préférences**, tu choisis les catégories que tu reçois de ce produit :

1. Dans **S’applique à**, choisis **Tout le produit** ou un locataire.
2. Sous **Recevoir ces catégories**, décoche les catégories que tu ne veux pas. Les catégories
   verrouillées (`transactional`, `security`) sont toujours remises.
3. Choisis **Enregistrer les préférences**.

Les préférences s’appliquent aux messages envoyés à partir de maintenant, à toi en tant
qu’utilisateur et à ton adresse e-mail. Une catégorie que tu désactives pour tout le produit reste
désactivée dans chaque locataire ; un réglage de locataire peut en désactiver davantage, mais pas
réactiver des catégories. Les catégories apparaissent dès que le produit contient des modèles dans
celles-ci. Définir des préférences pour un locataire nécessite `notify:preferences` dans celui-ci
(les membres et les administrateurs en disposent).

## Ta boîte de réception {#inbox}

Certaines notifications arrivent dans l’application plutôt que par e-mail : des messages de modèles
avec le canal `inbox`, que ton produit t’envoie en tant qu’utilisateur. Ouvre [Boîte de
réception](app:inbox) pour les lire. L’entrée de navigation indique combien sont non lues et
actualise ce nombre chaque minute.

- **Locataire** limite la liste à un locataire ; **Tous les locataires et le produit** affiche tout
  ce qui concerne ce produit.
- **Non lues seulement** masque les notifications que tu as lues.
- Ouvrir une notification affiche son texte et la marque comme lue. Le bouton enveloppe en marque
  une comme lue sans l’ouvrir, et **Tout marquer comme lu** marque toutes les notifications non lues
  de la portée choisie.

Toute personne qui appartient au produit a une boîte de réception ; afficher un seul locataire
nécessite `notify:preferences` dans ce locataire (les membres et les administrateurs l’ont). Tes
[préférences](help:notifications#preferences) s’appliquent aussi à la boîte de réception. Le texte
des modèles sensibles n’est jamais affiché, et il est effacé après la durée de conservation du
contenu, comme pour les e-mails. L’éditeur de modèles du Studio crée uniquement des modèles d’e-mail
; les modèles de boîte de réception se créent via l’API.

## Pour les administrateurs et les développeurs {#developers}

- **Envoyer depuis ton produit** : `POST /v1/products/{product_id}/tenants/{tenant_id}/notify/send`
  avec `template_key`, `to` (`{"user_id": …}` ou `{"email": …}`), `variables` et `locale`
  facultatif, plus un en-tête `Idempotency-Key`. Cela nécessite `notify:send` dans le locataire ;
  les adresses libres en dehors des membres du locataire nécessitent aussi `notify:send_external`.
  Voir [Bases de l’API](help:api-basics).
- **Répartiteur** : les messages ne sont remis que tant qu’un répartiteur tourne (`axentra notify-dispatch --loop`
  ou un worker). Sans lui, les messages restent **En file d’attente**.
- **Prestataires et paramètres** (`[notify]`) : `provider` (`local` ou `smtp`), `sender`, hôte,
  port, identifiants et STARTTLS SMTP, `max_attempts` (par défaut 5), backoff,
  `content_retention_days` (par défaut 30) et `message_retention_days` (par défaut 180). Voir
  [Configuration du serveur](help:server-configuration).
- **Confidentialité** : les objets et les corps sont chiffrés au repos. Les adresses des
  destinataires sont des données personnelles et sont visibles par les personnes disposant de
  `notify:manage` ; elles sont supprimées avec le message après la durée de conservation des
  messages.
- **Invitations** : lorsqu’une invitation de locataire est créée, Axentra envoie le modèle
  `invitation` avec le lien d’acceptation. Voir [Membres et invitations](help:members-invitations).

## Bon à savoir {#good-to-know}

- E-mail et [boîte de réception](help:notifications#inbox) dans l’application uniquement : pas de
  SMS ni de notifications push, pas de pièces jointes, pas d’adresse d’expéditeur par produit.
- Pas de lien de désinscription ni d’en-tête `List-Unsubscribe` ; les désinscriptions passent
  uniquement par les préférences et seulement pour les adresses qui appartiennent à des
  utilisateurs.
- Chaque locataire peut envoyer au plus 1000 notifications par heure glissante (réglage du serveur
  `notify.tenant_send_limit_per_hour`) ; les suivantes sont refusées avec **Trop de requêtes**. Les
  invitations et les e-mails de compte ne comptent pas.
- Voir [Limitations connues](help:limitations).

## Dépannage {#troubleshooting}

| Ce que tu vois                                                                                  | Cause                                                                                                                    | Que faire                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Seulement **Mes préférences**                                                                   | Tu n’as pas `notify:manage`                                                                                              | Demande à un administrateur du produit si tu as besoin des modèles                                                      |
| **Vérifie ta saisie** à l’enregistrement                                                        | Clé ou catégorie invalide, espace réservé non déclaré, syntaxe `{{ … }}` non prise en charge ou absence de variante `en` | Lis le message du serveur ; corrige le champ ou l’espace réservé indiqué                                                |
| L’aperçu signale une valeur manquante                                                           | Une variable déclarée n’a pas de valeur d’exemple                                                                        | Renseigne la **Valeur d’exemple**                                                                                       |
| **Conflit** « a template with this key exists »                                                 | Les clés sont uniques par produit                                                                                        | Choisis une autre clé ou modifie le modèle existant                                                                     |
| **Modifié entre-temps**                                                                         | Quelqu’un d’autre a enregistré le modèle                                                                                 | Recharge la page ; tes modifications non enregistrées sont perdues, copie-les donc d’abord                              |
| Pas d’icône d’envoi pour un modèle                                                              | Il est **Système uniquement**, ou tu n’as pas `notify:send`                                                              | Comportement normal pour les invitations ; demande un rôle avec `notify:send`                                           |
| « Tu n’as pas l’autorisation notify:send dans ce locataire »                                    | Ton rôle ne couvre pas ce locataire                                                                                      | Choisis un autre locataire ou demande un rôle                                                                           |
| **Non autorisé** lors d’un envoi à une adresse                                                  | L’adresse n’est pas celle d’un membre et tu n’as pas `notify:send_external`                                              | Envoie à un membre ou adresse-toi à un propriétaire du produit                                                          |
| **Introuvable** pour un membre                                                                  | L’utilisateur n’est pas membre du locataire                                                                              | Choisis un membre du locataire sélectionné                                                                              |
| Les messages restent **En file d’attente** ; **Plus ancien message en file d’attente** augmente | Aucun répartiteur ne tourne                                                                                              | Demande à l’opérateur d’exécuter `axentra notify-dispatch --loop` ou un worker                                          |
| Les messages finissent en **Échoué**                                                            | Le serveur SMTP a refusé le message ou est injoignable                                                                   | Lis la **Dernière erreur** ; demande à l’opérateur de vérifier les paramètres SMTP, puis choisis **Relancer la remise** |
| **Conflit** sur **Relancer la remise**                                                          | Le message n’est pas en échec, ou son contenu a été effacé                                                               | Envoie à nouveau la notification                                                                                        |
| **Bloqué**                                                                                      | Le destinataire s’est désinscrit de la catégorie, ou n’a pas d’adresse e-mail                                            | Utilise `transactional` uniquement pour les messages que les utilisateurs doivent recevoir                              |
| **Aucune boîte de réception locale sur ce serveur**                                             | Le serveur utilise SMTP                                                                                                  | Utilise le **Journal des messages**                                                                                     |
