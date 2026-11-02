---
title: Files
summary: Upload, find, download, share and delete a tenant's files, and manage its storage quota, size limits and the content-type policy.
keywords: files, upload, download, attachments, documents, storage, quota, disk space, file size, content type, MIME type, download link, share link, signed URL, presigned URL, S3, labels, metadata, expiry, inert, blocked types
related: data-overview, records, tenants, security, server-configuration, limitations
---

The **Files** screen shows the files a tenant has stored through Axentra's storage module:
documents, images, exports or any other attachment your application uploads. You can upload files
by hand, find them by name, type or label, download them, create a temporary download link,
rename them, and delete them. The screen also shows how much of its storage quota the tenant
uses.

A file always belongs to exactly one tenant. Its content cannot be changed after the upload;
to replace a file, upload a new one and delete the old one. The name and the labels can be
changed.

> [!IMPORTANT]
> The screen needs the server module `storage`. Viewing and downloading needs `files:read` in
> the tenant; uploading, editing and deleting needs `files:write`. Tenant roles **Owner**,
> **Admin** and **Member** grant both, **Viewer** only reads. Product roles: **Product owner** and
> **Product admin** may write in every tenant, **Support** and **Product viewer** read. Changing a
> tenant's quota needs `tenants:update` (**Product owner**, **Product admin**). See
> [Roles and permissions](help:roles-permissions).

## Browse a tenant's files {#browse}

1. Open **Data & Storage** › **Files** ([open the screen](app:files)).
2. Choose a **Tenant**.

The page shows the tenant's **Storage usage** and the list **Stored files**, newest first, 50 per
page. Only active, unexpired files are listed. Select the column headers **Name**, **Size** or
**Uploaded** to sort. Select a file's name to open its [details](#details); the **…** menu of each
row offers **Details**, **Download** and **Delete file**.

### Filter files {#filter}

| Filter                                              | What it matches                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Name contains**                                   | Part of the name, ignoring case.                                                                                            |
| **Content type**                                    | An exact type (`application/pdf`) or a family (`image/*`).                                                                  |
| **Uploaded by**                                     | The ID of the user (`usr_…`) or API key that uploaded the file.                                                             |
| **Label** and **Equals**, then **Add label filter** | Files whose labels contain this key with this value. `true`, `42` and `null` match with their type, other text as a string. |

All filters must match. Remove a label filter with the **×** on its chip.

## Upload a file {#upload}

1. Choose the tenant and select **Upload file**.
2. Under **File**, choose the file. Studio shows its name, size and type, and the rules the
   server applies (maximum size, allowed and blocked types).
3. Optional fields:
   - **Display name**: the name shown in lists and used for downloads. Defaults to the file name.
   - **Labels (metadata)**: a flat JSON object such as `{"kind": "invoice", "year": 2026}` (see
     [Labels](#labels)).
   - **Expires at**: after this time the file is hidden and later removed (see
     [Expiry](#expiry)).
4. Select **Upload**. A progress bar shows the transfer; **Cancel upload** stops it.

The server checks everything again, whatever Studio shows. Empty files are refused.

### Size limit {#size-limit}

Each file may be at most the server's **Maximum file size** (default 50 MiB, set by the operator in
`storage.max_file_bytes`). The server stops reading as soon as an upload exceeds it. Studio
warns before uploading if it knows the limit; it knows it only if you may read the server settings
(`platform:settings` or `product:manage`). Otherwise the dialog says that the server checks size,
type and quota during the upload.

### Allowed and blocked types {#content-types}

Two rules decide whether a file type is accepted:

- **Blocked types.** Executables, HTML, XHTML, SVG, JavaScript, shell and PHP scripts and similar
  files are blocked, recognized by declared type, file extension and content (also any file that
  starts with `#!`). Depending on the product's content-type policy, a blocked file is refused
  or stored as an [inert attachment](#inert). Product managers set the policy on the product's
  **Files** tab; see [Set the content-type policy](help:data-overview#content-type-policy).
- **Allowed types.** If the operator configured an allow-list (`storage.allowed_content_types`),
  only these types are accepted, for example `image/*, application/pdf`. Without a list, all
  types except blocked ones are accepted.

The browser's reported type is only a hint: the server inspects the first bytes and uses the
detected type when the declared one is missing, generic or clearly wrong.

### Inert attachments {#inert}

When the policy keeps a blocked file instead of refusing it, the file is stored as
`application/octet-stream` and marked **Stored inert** in its details, with the type it was
uploaded as. Such a file is only ever downloaded as an attachment, never opened in the browser.
Renaming a file to a blocked extension (for example `.html`) follows the same policy: it is
refused, or the file becomes inert.

### Labels {#labels}

Labels are your own key/value pairs to find and group files, such as `{"kind": "invoice"}`.
Rules: a flat JSON object, at most 64 keys; keys of 1-64 characters from letters, digits and
`_ . : -`; values are text (at most 1024 characters), numbers, `true`/`false` or `null`; at most
8 KiB in total. Do not put secrets into names or labels: they appear in the audit log.

## Storage quota {#quota}

The **Storage usage** card compares the tenant's bytes and number of files with its effective
quota. The meter turns to a warning colour at 80 % and to a critical one at 95 %. The line below
says where the quota comes from: **Quota set for this tenant**, **Quota inherited from the product
or server default**, or **No quota: unlimited**. How defaults are resolved is explained in
[Data overview](help:data-overview#quotas).

When a quota is reached, further uploads are refused; existing files stay.

### Change a tenant's quota {#edit-quota}

1. On the **Storage usage** card, select **Edit quota**.
2. Enter a **Storage limit** with its **Unit** (MiB, GiB, TiB) and/or a **File limit**.
   Leave a field empty to inherit the product or server default; `0` blocks all uploads.
3. Select **Save changes**.

A limit below the current usage is allowed: existing files stay, new uploads are refused. If
someone changed the quota after you opened the dialog, saving is refused with **Changed in the
meantime**; reload and try again. Quota changes are audited (`storage.quota.update`).

## File details {#details}

Select a file's name to open its details: **Name**, **ID**, **Status**, **Content type**, **Stored
inert** (only for inert files), **Size**, **SHA-256** checksum, **Version**, **Uploaded by**,
**Uploaded**, **Updated**, **Expires** and the labels. The SHA-256 lets you check that a downloaded
copy is identical to the stored file.

The **Status** of a listed file is always `active`. Internally, a file is `pending` while its bytes
are being written and `deleted` after deletion; neither appears in the list.

## Download a file {#download}

Select **Download** in the details or in the row's **…** menu. Studio asks the server for a
short-lived download link and starts the download with it. Files are always downloaded as
attachments, never opened in the browser. Downloads are not recorded in the audit log.

## Share a download link {#download-links}

1. Open the file's details and select **Create download link**.
2. Copy the **Download link** and pass it on.

> [!CAUTION]
> Anyone who has the link can download the file until it expires, without signing in. A link
> cannot be revoked on its own; deleting the file ends it. Share links only with the intended
> recipient, over a channel you trust.

### How long a link works {#link-expiry}

The link expires at the time shown under **Expires**. Studio always requests the longest lifetime
the server allows: `storage.signed_url_ttl_seconds`, by default 300 seconds (5 minutes),
configurable between 10 seconds and 24 hours. A link never outlives the file's own expiry time.

There are two kinds of links, depending on the server's configuration:

| Kind                                                         | URL                                                                                             | Stops working when                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Signed Axentra link (default)                                | The server's public URL + `/v1/files/download/…`                                                | It expires, the file is deleted or expires, or the tenant or product is suspended or archived |
| Presigned S3 link (marked **presigned by the object store**) | Points directly to the S3 bucket; only with the S3 backend and `s3_presigned_downloads` enabled | It expires or the file is deleted. Suspending the tenant does **not** end it                  |

## Rename a file or change its labels {#edit}

1. Open the details and select **Edit name and labels**.
2. Change the **Name** and/or the **Labels (metadata)** JSON. The labels you save replace all
   previous labels.
3. Select **Save changes**.

The content cannot be changed. If someone else edited the file in the meantime, saving is refused
with **Changed in the meantime**.

## Delete a file {#delete}

1. Select **Delete file** in the details or the row's **…** menu.
2. Confirm with **Delete file**.

The file disappears for everyone at once, its quota is released and existing download links stop
working. The server then deletes the stored object.

> [!CAUTION]
> Deletion cannot be undone. It is a logical deletion at the storage level: depending on the
> backend, the bytes can remain on the disk until it is reused, or as older object versions in an
> S3 bucket with versioning. Database backups and the audit log keep the file's name, size and
> checksum. If deleted files must be unrecoverable, operators need disk encryption or bucket
> lifecycle rules; see [Security](help:security).

## Expiry {#expiry}

A file with **Expires at** set disappears from lists, details and download links the moment that
time passes. The server's purge (`axentra storage purge`, scheduled by the operator) removes it
later; until then its bytes still count against the quota. The expiry time can only be set at
upload, not changed afterwards in Studio.

## Storage backends and scanning {#backends}

Where file contents live is a server setting, shown on the [Data overview](help:data-overview#storage-configuration):

- `local`: a directory on the server (default `./var/storage`).
- `s3`: Amazon S3 or an S3-compatible service, optionally with server-side encryption.

Changing the backend does not migrate existing files. Axentra computes a SHA-256 for every file,
but it does **not** scan files for malware and does not inspect archives. If you need scanning,
run it in your application or a job after the upload.

## Troubleshooting {#troubleshooting}

**File too large.** The file exceeds the server's maximum file size. Compress or split it, or ask
an operator to raise `storage.max_file_bytes`.

**File type not accepted.** The file is a blocked type (executable, HTML, SVG, script), its
extension or content looks like one, or it is not on the server's allow-list. Check the rules in
the upload dialog. A product manager can keep blocked files as inert attachments
([content-type policy](help:data-overview#content-type-policy)).

**Storage quota exhausted.** The tenant reached its byte or file quota. Delete files, or ask a
product owner or admin to [raise the quota](#edit-quota). Expired files count until the next
purge.

**No access to this tenant's files.** Your roles do not grant `files:read` in this tenant. Ask a
product owner or the tenant's owner for a role.

**Upload file is missing.** You lack `files:write` in this tenant, or no tenant is selected.

**Conflict: the upload took too long.** The upload stayed unfinished longer than the server's
timeout (default one hour) and was discarded. Upload again over a faster connection.

**Please check your input.** The labels are not a flat JSON object or break the [label
rules](#labels), or **Expires at** is in the past.

**Changed in the meantime.** Someone renamed, relabelled or deleted the file, or changed the quota,
after you opened it. Reload and repeat.

**A download link returns "Not found".** It expired, the file was deleted or expired, or the tenant
or product was suspended or archived. Create a new link. The server answers all of these the same
way on purpose.

**The copied link points to the wrong host.** Signed links are built from the server's public URL
(`security.public_url`). Ask an operator to set it to the address recipients can reach.

**The upload dialog does not show the size limit or allowed types.** You cannot read the server
settings. The server still enforces them; its error tells you which rule failed.
