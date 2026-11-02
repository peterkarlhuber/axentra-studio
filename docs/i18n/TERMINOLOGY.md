# Terminology

Studio's interface and in-app help exist in six languages: English (reference), German, Spanish,
French, Brazilian Portuguese and Italian. This file fixes the core terms so that the interface,
the help articles and future changes use the same words. The complete per-language glossaries,
with notes on each choice, are in [`terms-es.tsv`](terms-es.tsv), [`terms-fr.tsv`](terms-fr.tsv),
[`terms-pt-BR.tsv`](terms-pt-BR.tsv) and [`terms-it.tsv`](terms-it.tsv). German follows the terms
already used in `src/i18n/locales/de`.

## Rules for every language

- **Informal address** everywhere (product owner decision): German _du_, Spanish _tú_, French
  _tu_, Brazilian Portuguese _você_, Italian _tu_. `npm run i18n:check` and `npm run help:check`
  reject the formal forms.
- **Never translate** product names (Axentra, Axentra Studio, Studio), permission ids
  (`tenants:read`), error codes, API paths, header names, JSON keys, status values in code and
  anything else inside code formatting.
- **Texts that come from the server** stay as the server sends them: the names and descriptions
  of built-in roles and permissions and server error messages are English. Help articles show
  them in English in bold (exactly as on screen) and may add a translation in parentheses.
- **UI labels in help articles** are copied from the locale JSON of the same language, never
  re-translated.
- Values that are intentionally the same as English are listed in
  [`src/i18n/untranslated.json`](../../src/i18n/untranslated.json); everything else identical to
  English is reported as untranslated.

## Core terms

| English        | Deutsch           | Español               | Français             | Português (Brasil)    | Italiano              |
| -------------- | ----------------- | --------------------- | -------------------- | --------------------- | --------------------- |
| product        | Produkt           | producto              | produit              | produto               | prodotto              |
| tenant         | Mandant           | inquilino             | locataire            | tenant                | tenant                |
| user           | Benutzer          | usuario               | utilisateur          | usuário               | utente                |
| member         | Mitglied          | miembro               | membre               | membro                | membro                |
| invitation     | Einladung         | invitación            | invitation           | convite               | invito                |
| role           | Rolle             | rol                   | rôle                 | função                | ruolo                 |
| permission     | Berechtigung      | permiso               | autorisation         | permissão             | autorizzazione        |
| API key        | API-Schlüssel     | clave de API          | clé d’API            | chave de API          | chiave API            |
| secret         | Geheimnis         | secreto               | secret               | segredo               | segreto               |
| grace period   | Übergangsfrist    | período de gracia     | délai de grâce       | período de carência   | periodo di tolleranza |
| rotate         | rotieren          | rotar                 | renouveler           | rotacionar            | ruotare               |
| revoke         | widerrufen        | revocar               | révoquer             | revogar               | revocare              |
| suspend        | sperren           | suspender             | suspendre            | suspender             | sospendere            |
| reactivate     | reaktivieren      | reactivar             | réactiver            | reativar              | riattivare            |
| archive        | archivieren       | archivar              | archiver             | arquivar              | archiviare            |
| restore        | wiederherstellen  | restaurar             | restaurer            | restaurar             | ripristinare          |
| record         | Datensatz         | registro              | enregistrement       | registro              | record                |
| collection     | Sammlung          | colección             | collection           | coleção               | raccolta              |
| file           | Datei             | archivo               | fichier              | arquivo               | file                  |
| quota          | Kontingent        | cuota                 | quota                | cota                  | quota                 |
| job            | Job               | tarea                 | tâche                | job                   | job                   |
| schedule       | Zeitplan          | programación          | planification        | agendamento           | pianificazione        |
| event          | Ereignis          | evento                | événement            | evento                | evento                |
| webhook        | Webhook           | webhook               | webhook              | webhook               | webhook               |
| endpoint       | Endpunkt          | endpoint              | point de terminaison | endpoint              | endpoint              |
| delivery       | Zustellung        | entrega               | livraison            | entrega               | consegna              |
| signing secret | Signaturgeheimnis | secreto de firma      | secret de signature  | segredo de assinatura | segreto di firma      |
| usage          | Nutzung           | uso                   | utilisation          | uso                   | utilizzo              |
| meter          | Zähler            | medidor               | compteur             | medidor               | contatore             |
| plan           | Tarif             | plan                  | offre                | plano                 | piano                 |
| subscription   | Abonnement        | suscripción           | abonnement           | assinatura            | abbonamento           |
| entitlement    | Leistung (Tarif)  | prestación            | droit                | direito               | diritto d'uso         |
| notification   | Benachrichtigung  | notificación          | notification         | notificação           | notifica              |
| template       | Vorlage           | plantilla             | modèle               | modelo                | modello               |
| audit log      | Audit-Protokoll   | registro de auditoría | journal d’audit      | log de auditoria      | registro di audit     |
| settings       | Einstellungen     | configuración         | paramètres           | configurações         | impostazioni          |
