---
title: Search
summary: Search a tenant's full-text index, narrow the results by kind, look at an indexed document and remove a wrong entry from the index.
keywords: search, full-text, find, index, indexed document, kind, reference ID, highlight, query, phrase, exclude, search:query, search:index
related: records, files, roles-permissions, modules-reference, limitations
---

The **Search** screen searches the full-text index that your product keeps for each tenant. The
product puts the searchable text of its own objects into this index (an invoice, a contact, a
ticket); Studio lets you query it the same way your users do, check what is indexed and remove an
entry that should not be there.

The index is a _copy_: your product writes it and stays the source of truth. Axentra does not read
records, files or your product's tables by itself, so an object appears in search only after the
product has indexed it.

> [!IMPORTANT]
> The screen needs the server module `search`. Searching needs `search:query` in the tenant;
> removing a document from the index needs `search:index` (see [Who may do what](#permissions)).

## Who may do what {#permissions}

| Role                                                | Search (`search:query`) | Remove from index (`search:index`) |
| --------------------------------------------------- | ----------------------- | ---------------------------------- |
| Tenant **Owner**, **Admin**                         | yes                     | yes                                |
| Tenant **Member**, **Viewer**                       | yes                     | no                                 |
| **Product owner**, **Product admin** (every tenant) | yes                     | yes                                |
| **Support**, **Product viewer** (every tenant)      | yes                     | no                                 |
| **Platform administrator**                          | yes                     | yes                                |
| **Platform viewer**                                 | yes                     | no                                 |

Members cannot write to the index by default, because every entry is shown to everyone who may
search the tenant. A custom role can grant both permissions; see
[Roles and permissions](help:roles-permissions).

## Search a tenant {#query}

1. Open **Data & Storage** › **Search** ([open the screen](app:search)).
2. Choose a **Tenant**. Every tenant has its own index; there is no search across tenants.
3. Under **Search for**, enter your search and choose **Search** (or press Enter).

| You enter          | Search finds                                         |
| ------------------ | ---------------------------------------------------- |
| `invoice acme`     | documents that contain both words (in any order)     |
| `"late payment"`   | documents that contain exactly this phrase           |
| `invoice or offer` | documents that contain at least one of the words     |
| `invoice -draft`   | documents with `invoice` that do not contain `draft` |

Search matches whole words, ignoring upper and lower case. It does not match parts of words
(`inv` does not find `invoice`) and does not correct spelling. Whether `invoices` also finds
`invoice` depends on the language the server indexes with (see [Good to know](#limits)).

The search and the tenant are part of the address, so you can bookmark a search or send the link
to a colleague who has access to the same tenant.

### Narrow by kind {#kinds}

Every indexed document has a **kind** that your product chooses, for example `invoice` or `note`.
Under **Kinds**, enter one or more kinds separated by commas to see only those. Kinds use
lowercase letters, digits, dots, hyphens and underscores and start with a letter; at most 20 at
once. Leave the field empty to search all kinds.

## Read the results {#results}

Results are sorted by relevance: matches in the title count more than matches in the text, more
matches count more, and among equal results the most recently updated comes first. Each result
shows:

- the **title** with the matching words highlighted (or the reference ID if the document has no
  title),
- the **kind** and the **reference ID**, which is your product's own ID of the object,
- when the document was last **updated** in the index,
- up to two short passages of the text with the matches highlighted.

Twenty results are shown at first; **Load more** fetches the next ones. The counter below the
list says how many are shown and whether more are available.

> [!NOTE]
> Results are not a snapshot. If the product changes the index while you page through the
> results, a document can move and appear twice or not at all. Very deep paging (beyond position
> 1000 by default) is refused; refine the search instead.

## Look at an indexed document {#document}

Select a result's title. A side panel shows what the index holds for it: **Kind**, **Reference
ID**, **Document ID** (`sdoc_…`), **Version** (increases with every new indexing),
**Language**, who indexed it (**Indexed by**, **Last indexed by**) and when, the full **Text**
and the **Metadata** your product stored with it. Metadata is shown but not searched.

## Remove a document from the index {#remove}

If a document should not appear in search (for example it was indexed by mistake or belongs to a
deleted object), you can remove it:

1. Open the document from the results.
2. Choose **Remove from index** and confirm.

> [!WARNING]
> This removes only the index entry. The original object in your product is not changed, and the
> product adds the entry again the next time it indexes that object. To remove something for
> good, delete or change it in your product.

## How documents get into the index {#index}

Your product indexes its objects through the API (`PUT …/search/documents/{kind}/{ref_id}` with
`search:index`), usually right after saving an object or in a [job](help:jobs) that retries.
Indexing the same kind and reference ID again replaces the document. Studio does not add documents
itself. Who indexed a document is recorded on it and, unless the server turns this off, in the
[audit log](help:audit) (`search.document.upsert`, `search.document.delete`), without its text.

## Good to know {#limits}

| Item        | Rule                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Scope       | One tenant at a time. Everyone with `search:query` in the tenant sees every document of that tenant.  |
| Search text | 1 to 500 characters. A search with only punctuation or very common words finds nothing.               |
| Kinds       | `^[a-z][a-z0-9_.-]{0,62}$`, at most 20 per search                                                     |
| Matching    | Whole words; no prefix, fuzzy or accent-insensitive matching (`café` does not find `cafe`)            |
| Language    | One per installation (server setting `search.language`, default `simple`: no stemming, no stop words) |
| Paging      | 20 per page in Studio, at most up to position `search.max_offset` (default 1000)                      |

## Troubleshooting {#troubleshooting}

### No matches {#no-results}

Check the spelling, use whole words and fewer of them, and remove
the kind filter. If the object should be there, your product has not indexed it (yet) for this
tenant: the index only contains what the product puts into it.

### Other messages {#messages}

**You cannot search this tenant.** Your role in this tenant does not include `search:query`. Ask
an owner or admin of the tenant.

**Search is shown as "module not enabled".** The server runs without the module `search`. See
[Modules](help:modules-reference#search-realtime).

**Please check your input.** The search is longer than 500 characters, a kind is not valid, or
you paged deeper than the server allows. Shorten or refine the search.

**Not found** when opening a document. The product removed it from the index after the results
were loaded. Search again.

**Remove from index is missing.** Your role does not include `search:index` in this tenant.
