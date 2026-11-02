---
title: Finding your way around Studio
summary: The layout of Studio, the sidebar, product switcher, user menu, dashboard and the built-in help.
keywords: interface, layout, navigation, sidebar, menu, drawer, mobile, phone, breadcrumbs, product switcher, user menu, language, theme, dark mode, light mode, dashboard, help, info tip, search, keyboard
related: first-steps, concepts, keyboard-accessibility, settings, profile, signing-in
---

This article shows how Studio is organized, so that you find every screen quickly. It covers the
navigation, switching products, personal settings such as language and theme, the dashboard, and
the help that is built into every screen.

## The layout {#layout}

After you sign in, Studio opens the dashboard of the product you used last, or the product list if
you have none yet. Every screen has three parts:

- **Sidebar** (left): the navigation, grouped by area.
- **Top bar**: on the left the **breadcrumbs** (the path to the current page, each step clickable),
  on the right the **product switcher**, the help button and the **user menu**.
- **Content area**: the page title with a one-line description, the page's main action on the right
  (for example **New tenant**), and below it filters, tables, cards and tabs.

## The sidebar {#sidebar}

The sidebar lists the areas in this order:

| Group                  | Entries                                           |
| ---------------------- | ------------------------------------------------- |
| (top)                  | **Dashboard**, **Products**                       |
| **Identity & Tenants** | **Tenants**, **Users**, **Invitations**           |
| **Access & API Keys**  | **Roles**, **Permissions**, **API keys**          |
| **Data & Storage**     | **Data overview**, **Records**, **Files**         |
| **Events & Jobs**      | **Jobs**, **Schedules**, **Events**, **Webhooks** |
| **Usage & Billing**    | **Usage**, **Plans**, **Subscriptions**           |
| (single)               | **Notifications**                                 |
| **Audit & Monitoring** | **Audit log**, **System health**, **Monitoring**  |
| (bottom)               | **Settings**, **Help center**                     |

Entries that belong to a product (from **Dashboard** to **Notifications**, except **Products**) are
shown only when a product is selected. **Products**, **Audit log**, **System health**,
**Monitoring** and **Settings** are platform-wide.

The sidebar shows the same entries to everybody. If you open a page you have no permission for, the
page tells you so (**Not permitted**), and actions you may not perform are not offered.

### Entries marked "Off" {#module-off}

An entry whose server module is not enabled stays visible and shows **Off**. Opening it shows
**Module not enabled on this server** with the module id (for example `storage`) that the server
operator has to enable. This way you can see what exists and what is missing. See
[modules](help:concepts#modules).

### Collapse the sidebar {#collapse-sidebar}

At the bottom of the sidebar, **Collapse sidebar** reduces it to icons; **Expand sidebar** brings
the labels back. In the collapsed sidebar, hover over or focus an icon to see its name. Studio
remembers the choice in this browser. The server version is shown at the bottom of the expanded
sidebar.

### On phones and small screens {#mobile}

Studio works from 360 pixels width. On narrow screens the sidebar becomes a drawer: open it with
**Open navigation** (the menu button at the top left). It closes when you choose a page, with
**Close navigation**, or with Escape. Wide tables scroll inside their own area, and less important
columns may be hidden.

## Switch the product {#product-switcher}

Most areas belong to one product; the address then contains `/p/<product id>/`. The **product
switcher** in the top bar shows the current product (**Product** and its name).

1. Select the product switcher.
2. Choose another product from the list, or **All products** to open the product list.

Studio stays in the same area when you switch: if you are looking at the tenants of product A, you
land on the tenants of product B. Studio remembers the last product per browser. Archived products
are not listed in the switcher; open them from **Products**.

On platform-wide pages (for example **Audit log** or **Settings**) the switcher may show **No
product selected**.

In **single-product mode** there is no menu: the top bar shows a fixed **Product** label with the
name of the server's one product. See [single- and multi-product mode](help:concepts#single-multi-product).

## Breadcrumbs {#breadcrumbs}

The breadcrumbs show where you are, for example _Tenants › ten_01EXAMPLE_. Choose an earlier step
to go back up.

## The user menu {#user-menu}

Open the user menu with your initials and name at the top right. It contains:

| Entry        | What it does                                                                |
| ------------ | --------------------------------------------------------------------------- |
| **Profile**  | Your account: name, password, active sessions. See [profile](help:profile). |
| **Language** | The interface language. See [below](help:interface#language).               |
| **Theme**    | **Light**, **Dark** or **System**. See [below](help:interface#theme).       |
| **Sign out** | Ends your session. See [signing in and out](help:signing-in#sign-out).      |

### Language {#language}

Choose **Language** in the user menu and pick a language. The change applies immediately. It is
saved in this browser and in your account, so it follows you to other browsers. You can also change
it under **Settings** or, before signing in, on the sign-in page. Without your own choice, Studio
follows the browser's language. Dates, times and numbers are formatted for the chosen language.

> [!NOTE]
> Some texts come from the server and are always English: the names and descriptions of built-in
> roles (for example "Product admin", "Owner"), descriptions in the permission catalog, and the
> server message in an error's technical details.

### Theme {#theme}

Choose **Theme** in the user menu: **Light**, **Dark**, or **System** (follows your operating
system). Like the language, the theme is saved in this browser and in your account.

## The dashboard {#dashboard}

The **Dashboard** is the start page of a product. It shows:

- **Counters**: **Tenants**, **Users**, **API keys**, **Audit events (24 h)**, **Records** and
  **Denied requests (24 h)**. Each counter links to the matching page; its (i) tip says exactly what
  is counted. If the server reports no counters, you see "The server reported no counters for this
  product."
- **Usage and billing** cards, when those modules are enabled and you may read them.
- **System health**: the result of the server's readiness check, with **Details**.
- **Server**: **Server version**, **API version**, **Environment**, **Mode**, **Product ID** and the
  **Modules** with their state (green: enabled, gray: not enabled).

Quick actions at the top right: **New tenant** (with `tenants:create`, module `tenancy`) and **New
API key** (with `api_keys:manage`).

| Counter                    | What is counted                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------- |
| **Tenants**                | All tenants of the product, active and suspended.                                     |
| **Users**                  | Tenant members and product operators, each person once.                               |
| **API keys**               | Keys that are not revoked, including expired ones.                                    |
| **Records**                | Records in all collections and tenants.                                               |
| **Audit events (24 h)**    | Audit events of this product in the last 24 hours.                                    |
| **Denied requests (24 h)** | Refused attempts in the last 24 hours; opens the audit log filtered on denied events. |

> [!TIP]
> The **Server** card answers the most common support question: "Which version runs, and is the
> module even enabled?"

## Lists and forms {#lists-forms}

- **Lists** load page by page: below a table, **Load more** fetches the next entries, and **All
  entries loaded** marks the end. There are no page numbers.
- **Create dialogs** add `?new=1` to the address, so the dialog survives a reload and the browser's
  back button closes it.
- **Slugs** (short, URL-friendly names) are derived from the name until you edit the slug yourself.
- **Save changes** becomes active only when something has changed.
- **Destructive actions** ask for confirmation; deleting a tenant asks you to type its slug.
- **Secrets** (API keys, invitation tokens) are shown once. A secret dialog cannot be closed with
  Escape or by clicking outside; confirm that you stored the secret first.

## Help in Studio {#help-center}

The **Help center** contains all articles, tutorials and reference pages. Open it from the sidebar
(**Help center**), with the help button (?) in the top bar (**Help and documentation**), or from the
link on the sign-in and setup pages; it works without signing in.

- **Search**: type into the search box ("Search help, for example "API key""). Studio searches all
  articles in your language, and each result opens the matching section.
- **Start here**: the articles for new users.
- **Articles** have a table of contents (**On this page**), **Previous** and **Next**, **Related
  topics**, and a button to copy a link to the article. Links work in every language, and switching
  the language keeps the article open.

### Help in every screen {#contextual-help}

- **Page help**: the (?) button next to a page title (**Help for this page**) opens the article for
  that page in a side panel. You keep your place, and a form you are filling in stays as it is.
  Links inside the panel open further articles (**Back** returns), **Open in help center** shows the
  full article, and **Close help** closes the panel.
- **Info tips**: the (i) button next to a field, column or status explains effects, defaults and
  limits. It opens on click, tap, Enter or Space and closes with Escape. **Learn more** in the tip
  opens the related article in the side panel.
- **Learn more** links in messages, empty pages and confirmation dialogs lead to the section that
  explains the situation.

## Keyboard basics {#keyboard}

Everything in Studio works with the keyboard:

| Key                     | Effect                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| Tab / Shift+Tab         | Next / previous control. Focus is always visible.                              |
| Tab right after loading | Reaches **Skip to main content**; Enter jumps past the navigation.             |
| Enter / Space           | Activates buttons, links, checkboxes, switches and info tips.                  |
| Arrow keys              | Move in menus, lists and between tabs.                                         |
| Escape                  | Closes a menu, dialog, info tip or the mobile navigation (not secret dialogs). |
| F8                      | Jumps to the notification area (short messages).                               |

After you open another page, focus moves to its title, so screen readers announce the new page.
More in [keyboard and accessibility](help:keyboard-accessibility).

## Troubleshooting {#troubleshooting}

| Situation                                    | Cause and fix                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| The sidebar shows only a few entries         | No product is selected. Choose one with the product switcher or under **Products**.                                                        |
| An entry shows **Off**                       | The server module is not enabled. Ask the operator; see [modules](help:concepts#modules).                                                  |
| A page says **Not permitted**                | Your roles do not include the permission. See [roles and permissions](help:roles-permissions).                                             |
| **Not yet available in Studio**              | The server has the module, but this Studio release has no screens for it. Use the API or a newer Studio.                                   |
| The product switcher does not list a product | The product is archived, or you have no role in it. Open **Products**.                                                                     |
| Language or theme differ between browsers    | A choice made in a browser is remembered there and wins over the one saved in your account. Choose again in the user menu of that browser. |
| After a server update Studio behaves oddly   | Reload the page; Studio checks the server version only when it loads.                                                                      |
