---
title: Paramètres
summary: Choisir ta langue et ton thème, et consulter la configuration effective du serveur Axentra.
keywords: paramètres, réglages, préférences, langue, thème, mode sombre, mode clair, configuration du serveur, paramètres effectifs, config, modules, durée de session, limites
---

La page **Paramètres** comporte deux parties. Les **Préférences** sont tes choix personnels pour
le Studio : la langue de l’interface et le thème. La **Configuration du serveur** montre comment le
serveur Axentra est configuré à cet instant, par exemple quels modules sont activés, combien de
temps durent les sessions et quelles limites s’appliquent. La configuration du serveur est en
lecture seule dans le Studio : c’est l’opérateur qui la modifie sur le serveur.

Ouvre-la avec **Paramètres** en bas de la barre latérale ([ouvrir](app:settings)).

## Changer la langue et le thème {#preferences}

1. Sous **Préférences**, choisis une **Langue**. L’interface change immédiatement.
2. Sous **Thème**, choisis **Clair**, **Sombre** ou **Système**. **Système** suit le réglage clair
   ou sombre de ton système d’exploitation et change avec lui.

Les mêmes choix se trouvent dans le menu utilisateur en haut à droite (**Langue** et **Thème**).

| Paramètre  | Effet                                                                        | Valeurs                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Langue** | Langue de l’interface du Studio et des formats de date, d’heure et de nombre | English, Deutsch, Español, Français, Português (Brasil), Italiano. Sans choix, le Studio suit la langue de ton navigateur, à défaut l’anglais |
| **Thème**  | Couleurs de l’interface                                                      | **Clair**, **Sombre**, **Système** (par défaut)                                                                                               |

### Où les préférences sont enregistrées {#stored}

Ton choix s’applique immédiatement et il est enregistré deux fois : dans ce navigateur, pour qu’il
fonctionne avant même que tu te connectes, et dans ton compte utilisateur sur le serveur, pour
qu’il te suive dans d’autres navigateurs. Lorsque tu te connectes dans un navigateur qui n’a pas
encore de choix propre, le Studio reprend la langue et le thème de ton compte. Un choix fait dans
un navigateur reste dans ce navigateur jusqu’à ce que tu le modifies là-bas.

> [!NOTE]
> Certains textes viennent du serveur et restent en anglais, quelle que soit la langue choisie :
> les noms et descriptions des rôles intégrés, les descriptions du catalogue des autorisations et
> le message du serveur dans les détails techniques d’une erreur.

## Consulter la configuration du serveur {#server-configuration}

La carte **Configuration du serveur** affiche la configuration effective et non secrète du serveur
(`GET /v1/settings`) sous forme d’arborescence : des groupes comme `limits` ou `storage` contiennent
leurs valeurs. Les listes sont affichées séparées par des virgules. Utilise-la pour répondre à des
questions comme « quels modules sont activés ? », « combien de temps dure une session ? » ou
« quelle taille peut avoir un fichier ? » sans avoir à demander à l’opérateur.

> [!IMPORTANT]
> La configuration du serveur est affichée avec `platform:settings` (rôles sur la plateforme
> `platform_admin` et `platform_viewer`) ou avec `product:manage` dans au moins un produit
> (**Product owner**, **Product admin**). Les autres personnes ne voient que les préférences.

### Ce que signifient les valeurs {#settings-tree}

| Clé                                                              | Signification                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                                                    | `development`, `test` ou `production`. La production impose des contrôles de sécurité plus stricts au démarrage                                                                                                                                          |
| `mode`                                                           | `single` (un produit) ou `multi` (plusieurs produits) ; voir [Modes de déploiement](help:server-configuration#deployment-modes)                                                                                                                          |
| `modules`                                                        | Modules activés. Les sections du Studio des autres modules affichent **Module non activé sur ce serveur**                                                                                                                                                |
| `public_url`, `allowed_origins`                                  | L’adresse externe du serveur et les origines de navigateur (comme celle du Studio) autorisées à envoyer des requêtes authentifiées                                                                                                                       |
| `trusted_proxies`                                                | Proxys dont le serveur croit l’adresse client transmise (influe sur l’adresse IP dans le journal d’audit et sur les limitations de débit)                                                                                                                |
| `session_ttl_hours`, `session_idle_minutes`                      | Durée de vie maximale d’une session (par défaut 12 heures) et délai d’inactivité (par défaut 120 minutes)                                                                                                                                                |
| `password_login`, `password_min_length`, `login_rate_per_minute` | Si la connexion par mot de passe est activée, la longueur minimale du mot de passe (par défaut 12) et le nombre de tentatives de connexion échouées autorisées par compte et par minute (par défaut 10)                                                  |
| `limits`                                                         | `max_body_bytes` (plus grand corps de requête, par défaut 10 Mio), `rate_limit_per_minute`, `rate_limit_ip_per_minute`, `rate_limit_burst` (vide : pas de limitation de débit) et `api_docs` (si `/v1/docs` est `public`, `authenticated` ou `disabled`) |
| `oidc_providers`                                                 | Fournisseurs d’authentification unique (SSO) avec leurs règles d’inscription (jamais le secret client)                                                                                                                                                   |
| `storage`                                                        | Backend de stockage des fichiers, taille maximale des fichiers et types de contenu autorisés                                                                                                                                                             |
| `notify`, `billing`                                              | Prestataire de notifications et expéditeur ; prestataire de paiement et activation ou non des paiements réels                                                                                                                                            |
| `observability`                                                  | Niveau de journalisation, traçage, conservation de l’audit et des tâches                                                                                                                                                                                 |
| `encryption_key_ids`, `active_encryption_key`                    | ID des clés de chiffrement détenues par le serveur et de celle utilisée pour les nouvelles données (jamais le matériel de clé)                                                                                                                           |
| `features`                                                       | Indicateurs de fonctionnalités libres de l’installation                                                                                                                                                                                                  |

Les secrets (mots de passe de base de données, clés de chiffrement, secrets client, clés d’API des
prestataires) ne font jamais partie de cette réponse.

### Modifier la configuration du serveur {#change}

Le Studio ne peut pas modifier ces valeurs. L’opérateur modifie le fichier de configuration ou les
variables d’environnement du serveur, puis redémarre le serveur ; la prochaine fois que tu ouvres
cette page, tu vois les nouvelles valeurs. Voir [Configuration du serveur](help:server-configuration)
pour ce que les opérateurs modifient habituellement pour le Studio.

## Bon à savoir {#good-to-know}

- Les paramètres propres à un produit (par exemple sa politique de stockage) ne se trouvent pas
  ici ; ils sont sur la page du produit.
- Après que l’opérateur a activé ou désactivé un module, recharge le Studio : il ne lit la liste
  des modules qu’une fois, au démarrage.

## Dépannage {#troubleshooting}

- **La configuration du serveur n’est visible que par les administrateurs de la plateforme ainsi
  que par les propriétaires et administrateurs des produits.** : tu n’as ni `platform:settings` ni
  `product:manage`. Tes préférences fonctionnent quand même.
- **Le serveur n’a renvoyé aucun paramètre.** : le serveur a répondu avec une configuration vide.
  Recharge la page ; si elle reste vide, préviens l’opérateur.
- Ta langue ou ton thème ne te suit pas dans un autre navigateur : ce navigateur a déjà un choix
  propre, et c’est le choix du navigateur qui l’emporte. Modifie-le une fois dans ce navigateur.
- La langue ou le thème change à nouveau après la connexion : ce navigateur n’avait pas de choix
  propre, le Studio a donc repris celui de ton compte. Choisis à nouveau ; ce navigateur le
  conserve ensuite.
