---
title: État du système et supervision
summary: Vérifier que le serveur Axentra est en ligne et disponible, lire ses métriques et consulter les paramètres de conservation, de traçage et de journalisation qu’il indique.
keywords: état du système, santé, statut, disponibilité, vivacité, readiness, liveness, temps de fonctionnement, 503, supervision, monitoring, métriques, Prometheus, collecte, OpenTelemetry, traçage, niveau de journalisation, conservation, purge, version
---

Deux pages montrent comment se porte le serveur Axentra. **État du système** répond à la question
« le serveur est-il en ligne et capable de traiter des requêtes ? » et indique quelles versions du
serveur et du Studio sont en service. **Supervision** ajoute les métriques propres au serveur
(nombre de requêtes, erreurs, temps de réponse) ainsi que les paramètres de maintenance, de
conservation, de traçage et de journalisation qu’il indique. Les opérateurs s’en servent pour un
coup d’œil rapide ; pour les alertes et l’historique, connecte un véritable système de supervision
(voir [Pour les opérateurs](#for-operators)).

> [!IMPORTANT]
> Les deux pages sont ouvertes à tout utilisateur connecté et ne dépendent d’aucun module. Les
> cartes **Maintenance et conservation** et **Traçage et journalisation** nécessitent
> `platform:settings` (rôles sur la plateforme) ou `product:manage` dans au moins un produit
> (**Product owner**, **Product admin**). La carte **Métriques** dépend de la
> configuration des métriques du serveur, pas de ton rôle (voir [Métriques](#metrics)).

## Vérifier que le serveur est en bonne santé {#check-health}

1. Ouvre **Audit et supervision** › **État du système** ([ouvrir](app:health)).
2. Lis la carte **Disponibilité** : le statut global et une ligne par vérification.
3. Lis la carte **Vivacité** : **OK** signifie que le processus du serveur répond.
4. Choisis **Actualiser** pour vérifier à nouveau tout de suite. Les deux cartes s’actualisent
   aussi toutes les 30 secondes ; **Mis à jour le …** t’indique quand le résultat de disponibilité
   a été récupéré.

### Disponibilité {#readiness}

La disponibilité demande au serveur s’il peut traiter des requêtes à cet instant
(`GET /v1/health/ready`). Le serveur exécute chaque vérification et ne répond **OK** que si toutes
réussissent ; sinon, il répond avec le code HTTP `503` et le statut **Indisponible**, et le Studio
liste quand même chaque vérification pour que tu voies laquelle échoue.

| Vérification      | Présente quand                                         | Réussit quand                                                                                                                      |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `database`        | toujours                                               | Le serveur atteint sa base de données PostgreSQL                                                                                   |
| `notify_provider` | le module de notifications est activé                  | La configuration du prestataire d’e-mail est complète (adresse d’expéditeur, paramètres du prestataire). Aucun e-mail n’est envoyé |
| `schema`          | l’opérateur a défini `database.require_current_schema` | Aucune migration de base de données n’est en attente et aucune n’est inconnue du serveur                                           |

Les backends de produits construits sur Axentra peuvent enregistrer d’autres vérifications ; elles
apparaissent ici sous leur propre nom.

### Vivacité {#liveness}

La vivacité (`GET /v1/health/live`) t’indique seulement que le processus du serveur répond. Le
Studio affiche **Hors service** lorsque la requête échoue, par exemple parce que le serveur ou le
proxy placé devant lui est injoignable. Un serveur peut être vivant sans être disponible : le
processus tourne, mais une dépendance comme la base de données fait défaut.

### Versions {#versions}

La carte **Versions** de **État du système** affiche le nom et la version du **Serveur**, la
**Version de l’API du serveur**, l’**Environnement** (`development`, `test` ou `production`), la
**Version du Studio** et la **Version d’API requise** par ce build du Studio. Le Studio refuse de
démarrer face à un serveur dont la version d’API ne convient pas ; voir
[Vérification de compatibilité](help:server-configuration#compatibility).

## Utiliser la page Supervision {#monitoring}

Ouvre **Audit et supervision** › **Supervision** ([ouvrir](app:monitoring)). Elle affiche les mêmes
cartes **Disponibilité** et **Vivacité** que **État du système**, plus :

- **Maintenance et conservation** et **Traçage et journalisation** (voir
  [ci-dessous](#retention)),
- les **Métriques** du processus d’API (voir [Métriques](#metrics)).

**Actualiser** les recharge toutes. Les métriques s’actualisent aussi toutes les 30 secondes tant
qu’elles se chargent sans erreur.

## Métriques {#metrics}

La carte **Métriques** lit le point de terminaison Prometheus du serveur, `GET /metrics`, et le
présente sous forme d’indicateurs clés et de tableaux.

| Indicateur clé                                                                                                | Calculé à partir de                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Requêtes HTTP**                                                                                             | Toutes les requêtes (`axentra_http_requests_total`)                                                   |
| **Erreurs serveur (5xx)** / **Erreurs client (4xx)**                                                          | Les requêtes de cette classe de statut                                                                |
| **Temps de réponse moyen**                                                                                    | Durée totale des requêtes divisée par le nombre de requêtes (`axentra_http_request_duration_seconds`) |
| **Refusées (401/403)**                                                                                        | Refus d’authentification et d’autorisation (`axentra_auth_failures_total`)                            |
| **Notifications mises en file d’attente** / **Notifications remises** / **Échecs de remise de notifications** | Compteurs de notifications (seuls les processus qui traitent les notifications les communiquent)      |

Sous les indicateurs clés, les métriques sont regroupées en **HTTP**, **Authentification**, **Pool
de la base de données**, **Notifications**, **Tâches et événements** et **Autres métriques**.
Chaque tableau affiche une ligne par combinaison de libellés (par exemple par méthode, route et
statut) avec sa valeur ; pour les histogrammes, le **Nombre** et la **Moyenne**. Les métriques
volumineuses affichent les 50 premières lignes.

> [!WARNING]
> Les valeurs sont comptées **depuis le démarrage de ce processus d’API** et appartiennent **au
> seul processus qui a répondu à la requête du Studio**. Avec plusieurs processus d’API ou
> répliques, chacun tient ses propres chiffres, et le répartiteur de notifications ainsi que les
> workers de tâches ont aussi les leurs. Un redémarrage remet les chiffres à zéro. Pour une vue
> complète, laisse Prometheus collecter chaque processus.

### Jeton de métriques {#metrics-token}

La réponse de `/metrics` dépend de la configuration du serveur :

| Configuration du serveur                            | Ce qu’affiche le Studio                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `observability.metrics_enabled = false`             | **Les métriques ne sont pas disponibles**                                                                         |
| `observability.metrics_token_ref` est défini        | **Un jeton de métriques est requis** et un formulaire **Jeton de métriques**                                      |
| Aucun jeton configuré, `environment = "production"` | **Les métriques ne sont pas disponibles** (les métriques restent désactivées tant qu’aucun jeton n’est configuré) |
| Aucun jeton configuré, développement ou test        | Les métriques, sans jeton                                                                                         |

Pour afficher des métriques protégées :

1. Demande le jeton de métriques à ton opérateur (le secret vers lequel pointe
   `observability.metrics_token_ref`).
2. Saisis-le dans **Jeton Bearer** et choisis **Charger les métriques**.

> [!NOTE]
> Le Studio ne conserve le jeton que dans la page ouverte. Il n’est jamais stocké et disparaît
> lorsque tu quittes ou recharges la page. Si le serveur ne l’accepte pas, le Studio affiche
> **Le serveur n’a pas accepté ce jeton.**

## Conservation, traçage et journalisation {#retention}

**Maintenance et conservation** indique combien de temps le serveur conserve les données, telles
que renvoyées par `GET /v1/settings` :

| Ligne                                                        | Paramètre du serveur                                              | Par défaut                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Événements d’audit**                                       | `observability.audit_retention_days`                              | 365 jours                                                                     |
| **Tâches terminées**                                         | `observability.job_retention_days`                                | 30 jours                                                                      |
| **Contenu des notifications** / **Messages de notification** | `notify.content_retention_days` / `notify.message_retention_days` | non indiqué par la version du serveur pour laquelle ce Studio a été construit |

Une valeur que le serveur n’indique pas s’affiche comme **non signalé par le serveur** ; le Studio
ne devine jamais.

> [!IMPORTANT]
> La conservation ne s’exécute pas d’elle-même. Les données plus anciennes que la durée définie ne
> sont supprimées que lorsque l’opérateur exécute `axentra maintenance purge` (en général une fois
> par jour via cron ou un planificateur). La commande supprime aussi les sessions et les jetons
> d’installation expirés.

**Traçage et journalisation** indique si le **Traçage OpenTelemetry** est activé, le **Niveau de
journalisation**, le **Prestataire de notifications** (`local` ou `smtp`) et l’**Environnement**.
Ces valeurs sont en lecture seule ; elles se modifient dans la configuration du serveur.

## Pour les opérateurs {#for-operators}

- **Sondes** : utilise `GET /v1/health/live` comme sonde de vivacité et `GET /v1/health/ready`
  comme sonde de disponibilité de ton orchestrateur. Aucune des deux ne nécessite
  d’authentification ni n’est soumise à une limitation de débit.
- **Prometheus** : collecte `/metrics` sur chaque processus d’API. En production, configure
  `observability.metrics_token_ref` (par exemple `file:/run/secrets/axentra_metrics_token`) et
  donne à Prometheus le même jeton comme identifiant Bearer.
- **Studio sur la même origine** : le conteneur du Studio relaie `/metrics` vers l’API en même
  temps que `/v1`, de sorte que la page Supervision fonctionne derrière la même adresse.
- **Journaux** : ils sont au format JSON par défaut et portent l’ID de requête ; les secrets sont
  masqués.
- **Traçage** : `observability.otel_enabled = true` plus l’extra `otel` du paquet serveur exporte
  un span par requête via OTLP/HTTP.

Le dépôt du backend documente tout cela dans `docs/operations/OBSERVABILITY.md`.

## Dépannage {#troubleshooting}

- **Disponibilité : Indisponible** avec `database` **En échec** : le serveur ne parvient pas à
  joindre PostgreSQL. Vérifie la base de données et l’URL de base de données du serveur ; les
  requêtes qui ont besoin de données échouent jusqu’à son rétablissement.
- **`notify_provider` En échec** : la configuration e-mail est incomplète, par exemple une adresse
  d’expéditeur manquante ou invalide, ou des paramètres SMTP. Corrige `[notify]` dans la
  configuration du serveur.
- **`schema` En échec** : des migrations sont en attente. L’opérateur exécute `axentra migrate`.
- **Vivacité : Hors service** ou **Serveur injoignable** : le serveur ou le proxy entre le Studio
  et le serveur est injoignable. Vérifie que le serveur tourne et que l’adresse d’API du Studio est
  correcte (voir [Configuration du Studio](help:server-configuration#studio-config)).
- **Les métriques ne sont pas disponibles** : les métriques sont désactivées, ou il s’agit d’un
  serveur de production sans jeton de métriques. Demande à l’opérateur de définir
  `observability.metrics_token_ref`.
- **Le serveur n’a pas accepté ce jeton.** : le jeton est erroné ou a été renouvelé. Demande le
  jeton actuel à l’opérateur.
- **Les paramètres de conservation et de traçage ne sont visibles que par les administrateurs de
  la plateforme et les gestionnaires de produit** : tu n’as ni `platform:settings` ni
  `product:manage`. Le reste de la page fonctionne quand même.
- **Les métriques semblent trop basses ou retombent à zéro** : un autre processus d’API a répondu,
  ou le processus a redémarré (voir l’avertissement dans [Métriques](#metrics)).
