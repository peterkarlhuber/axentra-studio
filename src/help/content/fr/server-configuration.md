---
title: Configuration du serveur pour le Studio
summary: Ce que les opérateurs configurent pour que le Studio fonctionne - l’adresse de l’API dans config.json, les origines autorisées, les modules, le mode mono ou multi-produit et la vérification de version.
keywords: opérateur, administrateur, déploiement, installation, configuration, config.json, apiBaseUrl, proxy inverse, reverse proxy, CORS, origines autorisées, même site, modules, activer un module, mono-produit, multi-produit, mode, compatibilité, version, Docker, sauvegarde, restauration, observabilité
---

Cet article s’adresse aux personnes qui exploitent Axentra et le Studio. Il couvre uniquement ce
qui compte pour le Studio : comment le Studio trouve l’API, ce que l’API doit autoriser, comment
les modules et le mode de déploiement modifient ce qu’affiche le Studio, et comment le Studio
vérifie qu’il est compatible avec la version du serveur. La configuration complète du serveur est
documentée dans le dépôt du backend (voir [Pour aller plus loin](#further-reading)).

Le Studio est une application web statique. Il n’a ni serveur, ni base de données, ni secrets
propres ; tout ce qu’il affiche provient de l’API Axentra, et toutes les décisions d’autorisation
sont prises par l’API.

```diagram
architecture
```

## Indiquer au Studio où se trouve l’API : config.json {#studio-config}

Au démarrage, le Studio charge `/config.json` depuis sa propre adresse, avant toute autre chose.
Un même build fonctionne donc dans tous les environnements.

```json
{ "apiBaseUrl": "" }
```

| `apiBaseUrl`                | Signification                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `""` (par défaut)           | **Même origine** (recommandé) : un proxy inverse sert le Studio et transmet `/v1` (et `/metrics`) à l’API sur la même adresse |
| `"https://api.example.com"` | L’API tourne sur une autre adresse. Indique uniquement l’origine ; un `/` ou un `/v1` final est supprimé                      |

Si `/config.json` est absent ou invalide, le Studio utilise la même origine.

Avec l’image de conteneur du Studio, tu n’écris pas le fichier toi-même :

| Variable                  | Effet                                                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AXENTRA_API_URL`         | Le conteneur relaie `/v1` et `/metrics` vers cette adresse d’API (configuration sur la même origine)                                                                                                     |
| `AXENTRA_PUBLIC_API_URL`  | Écrite dans `config.json` comme `apiBaseUrl` et autorisée dans la Content-Security-Policy (adresse d’API distincte)                                                                                      |
| `AXENTRA_CSP_CONNECT_SRC` | Origines `https://` supplémentaires auxquelles le Studio peut se connecter, séparées par des espaces (`https://hôte` ou `https://hôte:port`) ; toute autre valeur fait échouer le démarrage du conteneur |
| `AXENTRA_TLS_TERMINATED`  | `true` si les utilisateurs accèdent au Studio en HTTPS (TLS terminé devant le conteneur) : ajoute `Strict-Transport-Security`. Par défaut `false`                                                        |

## Faire accepter le Studio par l’API {#allowed-origins}

L’API refuse les requêtes de navigateur authentifiées provenant d’origines inconnues. Configure sur
le serveur Axentra :

- `security.allowed_origins` : ajoute l’adresse publique du Studio, par exemple
  `["https://studio.example.com"]`, sauf si le Studio tourne sur la `public_url` de l’API
  elle-même. En production, seules les origines `https://` explicites sont acceptées ; `*` n’est
  jamais autorisé.
- `security.public_url` : l’adresse externe `https://` de l’API. Elle active les cookies
  sécurisés.
- `security.trusted_proxies` : les proxys placés devant l’API, pour que l’adresse IP du client dans
  le journal d’audit et dans la limitation de débit soit celle de l’utilisateur et non celle du
  proxy.

> [!WARNING]
> Avec une adresse d’API distincte, le Studio et l’API doivent se trouver sur le **même site**
> (par exemple `studio.example.com` et `api.example.com`). Le cookie de session est
> `SameSite=Lax` : une configuration intersites ne permet donc pas de se connecter. La même origine
> est la configuration testée et recommandée.

Pour l’authentification unique, le fournisseur d’identité renvoie vers une adresse absolue du
Studio, que l’API doit accepter comme cible de redirection.

## Activer des modules {#modules}

Le paramètre de serveur `modules` détermine quelles parties d’Axentra tournent. Les modules
`identity`, `tenancy`, `access` et `audit` sont toujours actifs. Les autres sont facultatifs :

| Module               | Sections du Studio                                            |
| -------------------- | ------------------------------------------------------------- |
| `data`               | **Aperçu des données**, **Enregistrements**                   |
| `storage`            | **Fichiers**                                                  |
| `events`             | **Tâches**, **Planifications**, **Événements**, **Webhooks**  |
| `usage`              | **Utilisation**                                               |
| `billing`            | **Offres**, **Abonnements**                                   |
| `notify`             | **Notifications**                                             |
| `search`, `realtime` | Pas d’écran dans le Studio ; disponibles uniquement via l’API |

Le Studio lit la liste des modules depuis `GET /v1/meta` une seule fois, au chargement :

- Une section dont le module est désactivé reste dans la barre latérale, marquée **Désactivé**, et
  affiche **Module non activé sur ce serveur**.
- Un module actif qui n’a pas d’écrans dans cette version du Studio affiche **Pas encore
  disponible dans le Studio**.

Pour modifier les modules, édite la configuration du serveur (par exemple
`modules = ["identity", "tenancy", "access", "audit", "data", "storage", "events"]` ou la variable
d’environnement `AXENTRA__MODULES`), redémarre l’API, puis recharge le Studio. La liste active est
affichée sous `modules` sur la page [Paramètres](help:settings#settings-tree). Voir
[Référence des modules](help:modules-reference).

> [!NOTE]
> Désactiver un module retire ses points de terminaison ; ses données restent dans la base de
> données et réapparaissent lorsque tu réactives le module.

## Déploiement mono-produit ou multi-produit {#deployment-modes}

Le `mode` du serveur détermine combien de produits il sert. Le Studio le lit depuis
`GET /v1/meta`.

|                                              | `single` (par défaut sur le serveur)                                                         | `multi`                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Produits                                     | Exactement un, créé au premier démarrage à partir de la section `[product]` (`slug`, `name`) | Autant que nécessaire, créés par les administrateurs de la plateforme |
| Page d’accueil                               | Le tableau de bord du produit                                                                | Le dernier produit utilisé, sinon la liste des produits               |
| Barre supérieure                             | Le nom du produit, sans sélecteur                                                            | Sélecteur de produit                                                  |
| **Nouveau produit**, archivage, restauration | Non proposés (l’API répond `409 mode_not_supported`)                                         | Avec `products:create` / `products:archive`                           |
| ID de produit inconnu dans l’adresse         | Redirection vers la même section de l’unique produit                                         | **Introuvable**                                                       |

Tout le reste (locataires, utilisateurs, rôles, données, audit) fonctionne de la même façon dans
les deux modes. Les comptes utilisateurs appartiennent à l’installation dans les deux modes. Passer
une installation de `single` à `multi` est un changement de configuration sans migration de
données.

## Vérification de compatibilité entre le Studio et l’API {#compatibility}

Chaque build du Studio déclare la version d’API dont il a besoin (**Version d’API requise**,
actuellement `1.0`). Au démarrage, le Studio lit `api_version` depuis `GET /v1/meta` :

| Version d’API du serveur                                                             | Résultat                                                                                              |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Même version majeure, version mineure égale ou supérieure (par exemple `1.0`, `1.3`) | Le Studio démarre                                                                                     |
| Version mineure inférieure (par exemple serveur `1.0`, le Studio nécessite `1.2`)    | **Version du serveur incompatible** : mets à jour le serveur ou utilise un Studio plus ancien         |
| Version majeure différente (par exemple `2.0`)                                       | **Version du serveur incompatible** : utilise une version du Studio prévue pour cette version majeure |
| Illisible                                                                            | **Version du serveur incompatible** avec la valeur brute                                              |

En cas de refus, rien d’autre ne se charge : un serveur inadapté ne reçoit donc jamais d’écritures
du Studio. Les deux versions sont affichées dans [État du système](help:health-monitoring#versions).
Les combinaisons testées ensemble sont listées dans `docs/COMPATIBILITY.md` du Studio.

> [!TIP]
> Après une mise à jour du serveur, recharge les onglets du Studio ouverts : la vérification n’a
> lieu qu’au chargement du Studio.

Si le Studio affiche plutôt **Impossible de se connecter à Axentra**, il n’a pas du tout pu charger
`GET /v1/meta` ; voir [Dépannage](#troubleshooting).

## Paramètres du serveur qui modifient ce que voient les utilisateurs {#user-visible-settings}

| Paramètre du serveur                                  | Effet dans le Studio                                                                                                                                                                               | Par défaut                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `security.password_login`                             | Formulaire de connexion par mot de passe sur la page de connexion                                                                                                                                  | activé                                         |
| Fournisseurs `[[oidc]]`                               | Boutons d’authentification unique sur la page de connexion                                                                                                                                         | aucun                                          |
| `security.session_ttl_hours` / `session_idle_minutes` | Moment où les utilisateurs doivent se reconnecter                                                                                                                                                  | 12 h / 120 min                                 |
| `security.password_min_length`                        | Longueur minimale des nouveaux mots de passe                                                                                                                                                       | 12                                             |
| `security.first_password` / `fresh_login_minutes`     | Si et dans quel délai les utilisateurs de l’authentification unique peuvent définir un mot de passe dans leur [profil](help:profile#set-password)                                                  | autorisé dans les 5 min                        |
| `security.max_body_bytes`, `storage.max_file_bytes`   | Plus grande requête et plus grand téléversement de fichier                                                                                                                                         | 10 Mio / 50 Mio                                |
| `observability.metrics_enabled` / `metrics_token_ref` | Si les **Métriques** de la page Supervision affichent des données ou demandent un jeton                                                                                                            | activé ; désactivé en production sans jeton    |
| `observability.audit_retention_days`                  | Profondeur de l’historique du journal d’audit après `axentra maintenance purge`                                                                                                                    | 365                                            |
| `notify.invitation_accept_url`                        | Où mènent les liens d’invitation (le `invitation_accept_url` propre au produit a la priorité). Règle-le sur `https://<your Studio address>/invitations/accept` quand le Studio a sa propre adresse | `/accept-invitation` sur `security.public_url` |

Modifie-les dans le fichier TOML du serveur ou sous forme de variables d’environnement
`AXENTRA__<SECTION>__<KEY>` (par exemple `AXENTRA__SECURITY__SESSION_TTL_HOURS=8`), puis redémarre
l’API. Les secrets sont toujours fournis sous forme de références (`env:NAME` ou `file:/path`),
jamais directement en clair en production.

## Pour aller plus loin {#further-reading}

Dans le dépôt du backend Axentra :

- `docs/operations/CONFIGURATION.md` : chaque paramètre avec sa valeur par défaut et sa variable
  d’environnement.
- `docs/operations/DEPLOYMENT.md` : image de conteneur, stacks compose et liste de contrôle pour la
  production.
- `docs/architecture/DEPLOYMENT_MODELS.md` : les modes mono-produit et multi-produit en détail.
- `docs/operations/BACKUP_RESTORE.md` : sauvegarde et restauration de la base de données, et
  vérification d’une restauration. Le Studio ne contient aucune donnée : sauvegarder la base de
  données suffit donc.
- `docs/operations/OBSERVABILITY.md` : métriques, traçage, journaux, contrôles d’état et
  conservation.
- `docs/architecture/VERSIONING.md` : numéros de version et règles de compatibilité.

Dans le dépôt du Studio : `README.md` (configuration et image de conteneur) et
`docs/COMPATIBILITY.md` (combinaisons testées).

## Dépannage {#troubleshooting}

- **Impossible de se connecter à Axentra** : le Studio n’a pas pu charger `GET /v1/meta`. Vérifie
  que l’API tourne, que `apiBaseUrl` dans `/config.json` est correct (ou que le proxy transmet
  `/v1`) et, avec une adresse d’API distincte, que la Content-Security-Policy l’autorise.
- La connexion échoue avec **Non autorisé**, ou chaque modification échoue avec **Non autorisé** :
  l’API refuse l’origine du Studio. Ajoute l’adresse du Studio à `security.allowed_origins` et
  redémarre l’API.
- La connexion semble fonctionner, mais tu es aussitôt déconnecté : le Studio et l’API sont sur des
  sites différents, ou la `public_url` de l’API est en `https://` alors que les utilisateurs y
  accèdent en `http://`. Utilise la même origine ou une configuration sur le même site en HTTPS.
- **Version du serveur incompatible** : voir [Vérification de compatibilité](#compatibility).
- **Module non activé sur ce serveur** : active sur le serveur le module indiqué dans le message et
  recharge le Studio.
- **Indisponible dans ce mode** : l’action nécessite le mode `multi` ; le serveur tourne en mode
  `single`.
- Le journal d’audit affiche l’adresse du proxy comme **Adresse IP** : ajoute le proxy à
  `security.trusted_proxies`.
- Les liens d’invitation ouvrent une page de l’API ou **Page introuvable** : le Studio a sa propre
  adresse. Règle `notify.invitation_accept_url` sur
  `https://<your Studio address>/invitations/accept` et redémarre l’API. Les liens déjà envoyés
  pointent toujours vers l’API ; envoie à ces personnes le jeton ou une nouvelle invitation. Voir
  [Membres et invitations](help:members-invitations#delivery).
