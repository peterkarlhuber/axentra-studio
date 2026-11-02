---
title: Data overview
summary: See which record collections and files a product stores, how much storage each tenant uses, and which storage and retention settings the server applies.
keywords: data, storage, collections, statistics, quota, disk usage, retention, backup, content-type policy, blocked file types, storage backend, S3, local storage
related: records, files, tenants, server-configuration, modules-reference, limitations
---

The **Data overview** shows, for the current product, what is stored and under which rules: the
record collections that tenants write to, the file storage each tenant uses compared with its
quota, the server's storage configuration and the retention periods the server reports. It is a
read-only page: it changes nothing. You change quotas on the [Files](help:files#quota) screen and
the content-type policy on the product's **Files** tab (see
[Set the content-type policy](#content-type-policy)).

Product operators use it to answer questions like "which tenant is close to its storage quota?",
"which collections exist?" and "how long does the server keep audit events?".

> [!IMPORTANT]
> The page needs the server module `data` (records). The **File storage** card also needs the
> module `storage`. The statistics need the permission `collections:read`, which the product roles
> **Product owner**, **Product admin**, **Support** and **Product viewer** grant, as do the platform
> roles. The **Storage configuration** and **Retention** cards need `platform:settings` or
> `product:manage`. See [Roles and permissions](help:roles-permissions).

## Open the data overview {#open}

1. Select a product.
2. In the sidebar, open **Data & Storage** and choose **Data overview**
   ([open the screen](app:dataOverview)).

If the sidebar marks the item as **Off**, the `data` module is not enabled on the server. An
operator enables modules in the [server configuration](help:server-configuration).

## What the page shows {#what-you-see}

| Card                      | Content                                                                           | Shown when                                                                           |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Record collections**    | Number of collections and records, then one row per collection                    | You have `collections:read`                                                          |
| **File storage**          | Bytes and files used by the whole product, the default quotas, one row per tenant | You have `collections:read` and the `storage` module is enabled                      |
| **Storage configuration** | Backend, maximum file size, allowed and blocked types                             | You have `platform:settings` or `product:manage` and the `storage` module is enabled |
| **Retention**             | How long the server keeps audit events and finished jobs                          | You have `platform:settings` or `product:manage`                                     |

Without `collections:read` the page shows **Product statistics not available**. Tenant members
(roles **Owner**, **Admin**, **Member**, **Viewer** of a tenant) do not have this permission; it
would reveal other tenants' data. They work with their own tenant's data on
[Records](help:records) and [Files](help:files).

## Record collections {#collections}

A _collection_ is a named group of JSON records, such as `orders` or `contacts`. Collections are
not created or configured separately: a collection exists as soon as one record is written to it
and disappears when its last record is deleted. See [Records](help:records#collections).

The table lists every collection of the product across all tenants:

| Column          | Meaning                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| **Collection**  | Name of the collection. Select it to open it on the **Records** screen. |
| **Records**     | Number of records in this collection, summed over all tenants.          |
| **Tenants**     | Number of tenants that have at least one record in this collection.     |
| **Last change** | Time of the most recent create or update in this collection.            |

If the table is empty (**No collections yet**), no record has been written in this product yet.

## Storage per tenant {#storage-per-tenant}

The **File storage** card starts with four figures: **Storage used** and **Files** for the whole
product (active files only), and the **Default storage quota** and **Default file quota** that
apply to every tenant without its own quota.

The table **Storage usage per tenant** has one row per tenant (50 per page, **Load more** for
the rest):

| Column                             | Meaning                                                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**                         | Select the name to open the tenant's files.                                                                                                                                               |
| **Storage** / **Files**            | Bytes and number of the tenant's active files.                                                                                                                                            |
| **Storage quota** / **File quota** | The effective limit and how much of it is used. **Unlimited** means no limit applies. The badge **Tenant** marks a quota set for this tenant; without it the tenant inherits the default. |

### How the effective quota is determined {#quotas}

Each of the two limits (bytes and files) is resolved separately, in this order:

1. The tenant's own quota, set with **Edit quota** on the [Files](help:files#quota) screen.
2. The product's default: `quota_bytes` / `quota_files` in the `storage` section of the product
   settings (product page, **Settings** tab, field **Settings (JSON)**).
3. The installation default: `storage.default_quota_bytes` / `storage.default_quota_files` in
   the server configuration.
4. Otherwise: unlimited.

```json
{ "storage": { "quota_bytes": 10737418240, "quota_files": 10000 } }
```

The example sets a product default of 10 GiB (in bytes) and 10,000 files.

> [!NOTE]
> Usage counts _active_ files. A file whose expiry time has passed disappears immediately, but
> its bytes keep counting until the server's purge has run (an operator schedules
> `axentra storage purge`, for example every 15 minutes).

## Storage configuration {#storage-configuration}

This card shows the server's effective settings. They are part of the server configuration and
cannot be changed in Studio.

| Setting               | What it does                                                                                                                                             | Default |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Backend**           | Where file contents are stored: `local` (a directory on the server) or `s3` (Amazon S3 or an S3-compatible service).                                     | `local` |
| **Maximum file size** | Hard limit per file, checked while the upload streams.                                                                                                   | 50 MiB  |
| **Allowed types**     | Allow-list of content types (`image/png`, `image/*`). **All types except blocked ones** means the list is empty.                                         | empty   |
| **Blocked types**     | What happens to executables, HTML, SVG and scripts in this product, and whether that is **Set for this product** or **Inherited from the installation**. | refuse  |

Changing the backend does not move existing files. For developers and operators, all keys of the
`[storage]` section are described in [Server configuration](help:server-configuration).

## Set the content-type policy {#content-type-policy}

Some file types can run code when someone opens them: executables, HTML, XHTML, SVG, JavaScript,
shell and PHP scripts. Axentra _blocks_ them. The content-type policy decides, per product, what
happens to a blocked upload: it is either refused, or stored as an _inert attachment_: kept as
opaque `application/octet-stream` that is only ever downloaded, never displayed.

1. Open the product: **Products**, then the product's name.
2. Choose the **Files** tab. (The tab is hidden when the `storage` module is not enabled.)
3. Under **File content-type policy**, choose the behaviour and lists (table below).
4. Choose **Save changes**.

| Setting                                      | What it does                                                                                                                                                                                                                                                                               | Allowed values / default                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Blocked file types**                       | **Refuse the upload** (the uploader gets an error) or **Store as inert attachment**. **Installation default** follows the server setting `storage.store_blocked_as_inert`.                                                                                                                 | Default: installation default                                 |
| **Extensions accepted as inert attachments** | Blocked extensions that are kept as inert attachments even when uploads are otherwise refused. The decision uses the file name's extension, also when the content is what is blocked (a `#!` script named `run.sh` with `sh` listed is kept; the same content named `run.txt` is refused). | Comma-separated, without dot: `html, sh`. At most 100 entries |
| **Additionally blocked extensions**          | Extensions blocked on top of the built-in list.                                                                                                                                                                                                                                            | `py, rb`. At most 100 entries                                 |
| **Additionally blocked content types**       | Content types blocked on top of the built-in list.                                                                                                                                                                                                                                         | `text/x-python`. At most 100 entries                          |

The section **Always blocked** lists the built-in extensions and content types. A product can
block more or keep blocked files as inert attachments, but it can never unblock them.

> [!IMPORTANT]
> Viewing the policy needs `product:read`; changing it needs `product:manage` (roles
> **Product owner** and **Product admin**). Archived products are read-only.

> [!NOTE]
> The installation's **Allowed types** list still applies after the policy: if the allow-list
> does not contain `application/octet-stream`, inert files are refused too.

The policy is checked in three ways: by the declared content type, by the file name's extension
and by the first bytes of the content (executables, HTML, SVG and any file that starts with `#!`).
Renaming a file to a blocked extension follows the same policy. Changes are recorded in the audit
log as `storage.policy.update`. Details for uploaders: [Files](help:files#content-types).

## Retention {#retention}

| Setting           | What it means                                                                                                                                    | Default  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **Audit log**     | Days the server keeps audit events (`observability.audit_retention_days`).                                                                       | 365 days |
| **Finished jobs** | Days the server keeps finished jobs (succeeded, failed, dead or cancelled) and finished webhook deliveries (`observability.job_retention_days`). | 30 days  |

Records and files have no retention period: they stay until someone deletes them, a file's own
expiry time passes, or the tenant is deleted (which deletes all its data).

## Backups {#backups}

The card **Backups are not reported** is intentional: the API reports neither backup status nor how
long the metadata of deleted files is kept. Both are part of operating the server. By default the
purge removes the metadata rows of deleted files after 30 days; database backups and the audit
log keep a deleted file's name, size and checksum longer.

## Troubleshooting {#troubleshooting}

**Product statistics not available.** Your roles do not grant `collections:read`. Ask a product
owner for a product role, or use [Records](help:records) and [Files](help:files) for your tenant.

**Storage module not enabled.** The server does not run the `storage` module, so files cannot be
stored. An operator adds `storage` to the enabled modules; see
[Modules reference](help:modules-reference).

**The Storage configuration and Retention cards are missing.** They need `platform:settings` or
`product:manage`. Product viewers and support staff do not see them.

**A tenant shows more usage than its files add up to.** Expired files count until the next purge.
Ask an operator whether `axentra storage purge` runs regularly.

**Saving the content-type policy fails with "Changed in the meantime".** Someone changed the
product (its settings, name or policy) after you opened the page. Reload the page and apply your
change again.

**Saving the policy fails with "Please check your input".** An entry is not a valid extension
(lowercase letters, digits, `_`, `+` or `-`, at most 16 characters, without dot) or content type (`type/subtype`), or a list has more than 100
entries. The message under the field names the problem.

**Not found when opening the page.** The `data` module is disabled, or the product is archived and
you are not a platform administrator.
