---
title: Records
summary: Browse, filter, create, edit and delete the JSON records that tenants store in collections, and resolve "changed in the meantime" conflicts.
keywords: records, data, JSON, documents, collection, entries, rows, database, filter, version, conflict, 412, If-Match, optimistic concurrency
related: data-overview, files, tenants, roles-permissions, api-basics, audit
---

_Records_ are small JSON objects that your application stores through the Axentra API, for
example orders, notes or settings, without needing its own database table. Every record belongs
to exactly one tenant and to one _collection_ (a named group such as `orders`). The **Records**
screen lets you look into this data, find records by their content and, with write permission,
fix or add records by hand.

> [!IMPORTANT]
> The screen needs the server module `data`. Reading needs `records:read` in the tenant, creating,
> changing and deleting needs `records:write`. Tenant roles **Owner**, **Admin** and **Member**
> grant both; **Viewer** only reads. The product roles **Product owner** and **Product admin** may
> write in every tenant; **Support** and **Product viewer** read in every tenant. The list of all
> collections needs `collections:read` (product roles only). See
> [Roles and permissions](help:roles-permissions).

## Collections and records {#collections}

- A **collection** is created by writing the first record into it and disappears when its last
  record is deleted. There is nothing to configure. Names use lowercase letters, digits and
  underscores, start with a letter and have at most 63 characters (`orders`, `support_notes`).
- A **record** has an **ID** (`rec_…`), its **Data** (a JSON object), a **Version** (starts at 1,
  increases with every change), **Created**/**Updated** times and the user or API key that
  created and last changed it (**Created by**, **Updated by**).
- The same collection name in two tenants holds two separate sets of records. Studio always shows
  one tenant at a time; the server enforces the separation.

## Browse records {#browse}

1. Open **Data & Storage** › **Records** ([open the screen](app:records)).
2. Choose a **Tenant** at the top.
3. Choose a collection in the **Collections** list on the left. The number next to it counts its
   records in all tenants.

The table shows **ID**, a shortened **Data** preview, **Version**, **Created** and **Updated**,
newest first, 50 per page; **Load more** fetches the next page. Select the eye icon
(**View record …**) to open the record with all fields and the full, formatted JSON.

> [!TIP]
> On a tenant's page, **Browse records** opens this screen with the tenant already selected. On
> the [Data overview](help:data-overview#collections), selecting a collection opens it here.

If you have no product role, Studio cannot list the product's collections. Enter the collection's
name under **Collection name** and choose **Open** instead.

### Sort {#sort}

Select the column headers **ID**, **Created** or **Updated** to sort; select again to reverse.
Sorting by **Data** is not possible.

## Filter by content {#filter}

1. Under **Field**, enter the name of a top-level field of the JSON, for example `status`.
2. Under **Equals**, enter the value, for example `open`.
3. Choose **Add filter**. The filter appears as a chip; the **×** on a chip removes it.

Several filters must all match. Values are read as JSON where possible: `true`, `42`, `null`,
`"42"` or `{"city": "Graz"}` match with their type, anything else (`open`) matches as text. So
`total` = `12` finds `{"total": 12}` but not `{"total": "12"}`.

A filter is a _containment_ check: an object value matches when the record's field contains at
least these keys. `address` = `{"city": "Graz"}` finds `{"address": {"city": "Graz", "zip":
"8010"}}`. Field names may contain letters, digits and underscores only, so filter nested fields
through an object value as shown.

## Create a record {#create}

1. Choose the tenant (and, optionally, the collection).
2. Choose **New record**.
3. Under **Collection**, keep or enter the collection name. A new name creates the collection.
4. Under **Data**, enter a JSON object, for example:

   ```json
   { "status": "open", "total": 12, "customer": { "name": "Acme" } }
   ```

5. Choose **Create record**. Studio switches to the record's collection.

The ID, version and times are set by the server; do not put them into the data.

## Edit a record {#edit}

1. Open the record (eye icon) and choose **Edit**.
2. Change the JSON under **Data** and choose **Save changes**.

Saving **replaces the whole object**: fields you remove from the JSON are removed from the
record. The collection cannot be changed; to move a record, create it in the other collection and
delete the old one.

### Versions and conflicts {#versions}

Studio tells the server which version you edited (HTTP `If-Match`). If someone else, a person
or your application, changed or deleted the record after you opened it, the server refuses the
change with **Changed in the meantime** (HTTP 412) instead of silently overwriting the other
change. This also applies to deleting.

To resolve it: close the dialog, reload the list, open the record again, apply your change to the
current data and save.

## Delete a record {#delete}

1. Open the record and choose **Delete record**.
2. Confirm with **Delete record**.

> [!CAUTION]
> Deleting is permanent; there is no recycle bin. The audit log keeps that the record was deleted
> (`data.record.delete`) but not its data.

## Settings and limits {#limits}

| Item            | Rule                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Collection name | `^[a-z][a-z0-9_]{0,62}$`: lowercase, digits, underscores, starts with a letter, at most 63 characters |
| Data            | A JSON object (no array or plain value), at most 256 KiB serialized                                   |
| Filter field    | Letters, digits, underscore, starting with a letter or underscore, at most 63 characters              |
| Sort            | `id`, `created_at`, `updated_at`, ascending or descending                                             |
| Page size       | 50 in Studio; the API accepts a `limit`                                                               |

## For developers {#api}

Studio uses the same API as your application. `C = /v1/products/{product_id}/tenants/{tenant_id}/records/{collection}`:

| Method and path                             | Permission         | Purpose                                      |
| ------------------------------------------- | ------------------ | -------------------------------------------- |
| `GET /v1/products/{product_id}/collections` | `collections:read` | Collections with counts                      |
| `GET C?where=&sort=&limit=&cursor=`         | `records:read`     | List; `where` is a JSON object (containment) |
| `GET C/{record_id}`                         | `records:read`     | One record, `ETag` is the version            |
| `POST C` (body: the data object)            | `records:write`    | Create (201)                                 |
| `PUT C/{record_id}`, `If-Match`             | `records:write`    | Replace the data                             |
| `DELETE C/{record_id}`, `If-Match`          | `records:write`    | Delete (204)                                 |

```http
PUT /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/records/orders/rec_01EXAMPLE
If-Match: "3"
Content-Type: application/json

{"status": "shipped", "total": 12}
```

Without `If-Match` the server overwrites unconditionally. Every create, replace and delete writes
an audit event (`data.record.create`, `data.record.replace`, `data.record.delete`) with the
collection and version, never the data. For relational data with many rows or joins, products
use their own tables instead of records; see [API basics](help:api-basics).

## Troubleshooting {#troubleshooting}

**Changed in the meantime.** Someone changed or deleted the record after you opened it. Reload,
open the record again and repeat your change. See [Versions and conflicts](#versions).

**Please check your input** when saving. The collection name or the data does not meet the
[limits](#limits). Studio already checks the name and that the data is a JSON object; the
server message names the problem.

**Too large.** The record's data exceeds 256 KiB. Store large content as a
[file](help:files) and keep only its file ID in the record.

**Please check your input** when filtering: a field name contains a dot or other characters that
are not allowed. Filter nested values with an object value (see [Filter by content](#filter)).

**The Collections list shows an error or "Not permitted".** Listing collections needs
`collections:read`, which only product roles have. Enter the collection name under **Collection
name** instead.

**New record, Edit and Delete record are missing.** Your role does not grant `records:write` in
this tenant, or no tenant is selected yet.

**Not found.** The record was deleted, the tenant is suspended (only platform administrators can
reach suspended tenants), or you have no access to this tenant.

**No records match.** Remove filters one by one. Remember that `12` and `"12"` are different
values.
