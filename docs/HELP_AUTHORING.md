# Writing help for Axentra Studio

Studio ships its own help center (`/help`), contextual help in the screens (help buttons, info
tips, "Learn more" links) and a full UI translation in six languages: `en`, `de`, `es`, `fr`,
`pt-BR`, `it`. This guide is the contract for everyone who changes a user-facing feature.

## Where things live

| What                                   | Where                                                   |
| -------------------------------------- | ------------------------------------------------------- |
| Chapter and article structure          | `src/help/manifest.ts` (single source of truth)         |
| Article text                           | `src/help/content/<locale>/<articleId>.md`              |
| Help center UI strings, chapter titles | `src/i18n/locales/<locale>/help.json`                   |
| Diagrams                               | `src/help/diagrams/*.tsx` (labels from `help.json`)     |
| Screen texts, tooltips, field help     | `src/i18n/locales/<locale>/<namespace>.json`            |
| Terminology per language               | [i18n/TERMINOLOGY.md](i18n/TERMINOLOGY.md)              |
| Checks                                 | `npm run i18n:check`, `npm run help:check`, Vitest, e2e |

English is the source language. Every other locale is a complete, reviewed translation; there is
no silent fallback: a missing article, key or section fails CI.

## Article format

```markdown
---
title: Tenants
summary: One sentence that says what the article helps with. Shown in lists and search results.
keywords: customer, organization, workspace, suspend
related: members-invitations, users, roles-permissions
---

Two to four sentences: what this is, why you need it, who uses it.

## Create a tenant {#create}

1. Open **Tenants** and choose **New tenant**.
2. ...
```

- **Front matter**: `title`, `summary` and `keywords` are translated. `related` (article ids)
  appears only in the English file; the other locales inherit it.
- **Headings**: no `#` (the title is the h1). Every `##` and `###` heading ends with an explicit,
  English, kebab-case anchor `{#create}`. Anchors are identical in all locales, so links such as
  `tenants#suspend` work in every language. Never rename an anchor that code links to.
- **Callouts** (GitHub syntax, first line of a block quote):
  `> [!NOTE]` background, `> [!TIP]` shortcut or good practice, `> [!IMPORTANT]` prerequisites
  (module, permission, configuration), `> [!WARNING]` side effects, `> [!CAUTION]` irreversible or
  security-relevant actions.
- **Links**: `[text](help:tenants#suspend)` to another article or section;
  `[text](app:tenants)` to a Studio screen in the current product (targets: the ids in
  `src/help/app-links.ts`); `https://` only for external standards (RFC, cron, Prometheus).
- **UI labels** are bold and spelled exactly as the screen shows them in that language
  (**New tenant**, **Neuer Mandant**). Translators take them from the locale JSON files.
- **Code** in fenced blocks with a language (`bash`, `http`, `json`, `python`, `ts`, `text`).
  Use synthetic values only: `prod_01EXAMPLE…`, `acme`, `https://example.com/hooks`, never real
  hosts, keys or secrets.
- **Tables** (GFM) for settings: _Setting · What it does · Allowed values / default_.
- **Diagrams**: a fenced block with the language `diagram` and one diagram name
  (`architecture`, `hierarchy`, `job-lifecycle`, `webhook-delivery`, `key-rotation`).

## Writing rules

1. **The implementation is the truth.** Check every claim (menu path, label, default, limit,
   permission, error) against the Studio source (`src/features/**`) and the Axentra backend
   (`src/axentra/**`, `docs/modules/**`). Do not describe planned features as available; name
   real limitations and point to [limitations](../src/help/content/en/limitations.md).
2. **Progressive disclosure.** Start with what and why in plain words, then the task steps, then
   settings and details, then troubleshooting. Explain a term the first time it appears or link
   the glossary.
3. **Task-oriented headings** ("Rotate an API key", not "Rotation").
4. **Every feature article** has: intro, prerequisites (`[!IMPORTANT]`: module and permission),
   task sections, a settings table where there are settings, "Good to know" limits and a
   `{#troubleshooting}` section with the errors users actually see and what to do.
5. **No filler.** No marketing, no repetition of what the screen already says, no implementation
   details that do not change what the user does.
6. **Address the reader informally** in every language, like the UI: English "you", German
   "du", Spanish "tú", French "tu", Brazilian Portuguese "você", Italian "tu".

## Contextual help in screens

| Need                                                         | Use                                                 |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Name of an icon-only button                                  | `IconButton label` (tooltip comes for free)         |
| One sentence everyone needs to fill a field                  | `FormField help` (always visible)                   |
| Background some users need (effects, defaults, dependencies) | `FormField info` (+ `infoTopic`), an info toggletip |
| Page-level "how does this work?"                             | `PageHeader help="<articleId>"`                     |
| Pointer to details from a text, empty state, alert or dialog | `<HelpLink topic="article#anchor">`                 |

- Info tips are buttons that open on click, tap, Enter or Space and close on Escape; they work
  with keyboard, touch and screen readers. Hover-only tooltips are used only to name icon buttons.
- A tip says what the setting does and what happens if it is changed, never just the label again.
- Error messages answer: what happened, why (if known), what to do now. Keep the request id.
- Help links open the article in a side panel without leaving the form; the panel links to the
  full help center.

## Checklist for a user-facing change

- [ ] Article(s) updated in all six locales (same anchors); `related` still sensible.
- [ ] New or changed fields have `help`/`info` where needed; actions with side effects explain them.
- [ ] New strings exist in all six locale files with the same placeholders and plural forms.
- [ ] New errors are mapped to a translated, actionable message.
- [ ] Tutorials and the limitations page still match the product.
- [ ] `npm run i18n:check`, `npm run help:check`, `npm test` and the e2e suites pass.
