---
title: Keyboard and accessibility
summary: How to use Studio with the keyboard, a screen reader, zoom, reduced motion and light or dark theme, and which gaps are known.
keywords: accessibility, a11y, keyboard, shortcuts, tab, focus, screen reader, NVDA, JAWS, VoiceOver, zoom, magnification, contrast, dark mode, light mode, theme, reduced motion, WCAG
related: interface, profile, limitations, glossary, faq
---

Studio is designed to meet WCAG 2.1 level AA. Every function works with the keyboard, the page
structure is announced correctly by screen readers, and Studio follows your system settings for
color scheme and motion. Each release is checked automatically with the axe-core accessibility
engine on every page, in the light and dark theme, on a desktop screen and on a 360-pixel-wide
phone screen.

## Keyboard use {#keyboard}

| Key                                   | What it does                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| **Tab** / **Shift+Tab**               | Move to the next or previous control.                                        |
| **Tab** right after a page loads      | Reaches **Skip to main content** first; **Enter** jumps past the navigation. |
| **Enter**                             | Follow a link, press a button, submit a form.                                |
| **Space**                             | Press a button, tick a checkbox, toggle a switch.                            |
| **Arrow keys**                        | Move within menus, select lists and tabs; **Enter** or **Space** chooses.    |
| **Escape**                            | Close a dialog, drawer, menu, info tip or the mobile navigation.             |
| **F8**                                | Jump to the notification area (the messages in the corner of the screen).    |
| **Enter** in an **Event types** field | Adds the typed event type to the list.                                       |

Good to know:

- **Dialogs keep the focus inside** while they are open and return it to the button that opened
  them when they close.
- **One-time secret dialogs do not close with Escape.** API key and webhook secrets are shown
  only once, so the dialog stays open until you confirm **I have stored the secret securely**.
  This prevents losing a secret by accident.
- **Dangerous actions** ask for confirmation; some, such as revoking an API key, also ask you to
  type a name (**Type … to confirm**). This protects against accidental key presses.
- **Info tips** (the small (i) buttons next to labels) open with **Enter** or **Space** and
  close with **Escape**. They work with keyboard, touch and screen readers, not only on hover.
- **Tables** with many columns scroll inside their own labeled area. Focus the area with
  **Tab** and scroll it with the arrow keys.

## Focus {#focus}

The control that has keyboard focus always shows a visible ring (violet, with at least 3:1
contrast against its background). After you open another page, Studio moves the focus to the
page's main heading, so you start at the new content and screen readers announce the new page.

## Screen readers {#screen-readers}

- **Landmarks:** each page has a header, the main navigation and the main content, and exactly
  one main heading.
- **Breadcrumbs** and the **Main navigation** are labeled. Sidebar areas of switched-off modules
  are announced as "module not enabled".
- **Forms:** every field has a visible label; required fields are announced; error messages are
  connected to their field.
- **Tables** have captions and column headers, and sortable columns announce their sort
  direction. The "Showing N entries" count is announced when more rows load.
- **Status messages** (copied to clipboard, loading, notifications) are announced through live
  regions. Error notifications are announced immediately.
- **Charts** have a text summary, and **Show data table** displays the same values as a table.
- **Email previews** are shown in a sandboxed frame; their text content is readable as usual.

## Zoom and text size {#zoom}

You can zoom the browser to 200 % without losing content or functions. On narrow windows (and
when zoomed in), the layout adapts:

| Window width      | Layout                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| 1200 px and wider | Full sidebar, multi-column pages                                           |
| 960 to 1199 px    | Full or collapsed sidebar                                                  |
| below 960 px      | The sidebar becomes a drawer opened with **Open navigation**               |
| below 640 px      | Less important table columns are hidden, page actions wrap below the title |

Standard buttons are at least 36 pixels high and large buttons 44 pixels; some compact buttons
in tables and toolbars are smaller. On desktop you can collapse the sidebar to icons with
**Collapse sidebar**; Studio remembers this per browser.

## Reduced motion {#reduced-motion}

If your operating system asks apps to reduce motion, Studio turns off its animations and
transitions (for example for dialogs, menus and loading indicators).

## Light, dark and system theme {#themes}

Open the user menu (your name in the top bar) and choose **Theme**: **Light**, **Dark** or
**System** (follows your operating system). Both themes are checked for sufficient contrast. Your
choice is saved in the browser and in your profile; a browser where you have not chosen a theme
yet adopts the one from your profile after you sign in.

## Language {#language}

Choose the language in the user menu under **Language**, or on the sign-in page. While signed in,
the choice is saved to your profile. Dates, times and numbers follow the selected language. Some
texts come from the server and stay in English, for example the descriptions of built-in roles and
permissions and the **Server message** in error details.

## Known gaps {#known-gaps}

- **Automatic checks cover the first view of each page.** Open dialogs, menus, drawers,
  notifications and form errors are checked only in some areas.
- **Only Chromium is tested automatically.** Firefox and Safari (WebKit) are not covered by the
  automated tests.
- **Windows high-contrast mode** (forced colors) is not specifically tested.
- **Charts are pointer-oriented.** Hovering shows details for single points; keyboard and screen
  reader users get the same values through **Show data table**.
- **Server texts** such as permission descriptions and server messages are English only.

If you find a barrier, report it to your operator with the page address and the steps that led to
it.

## Troubleshooting {#troubleshooting}

| Situation                           | What to do                                                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The focus ring is not visible       | Use **Tab** (the ring appears for keyboard focus, not for mouse clicks). Check that no browser extension overrides page styles.                                   |
| A dialog does not close with Escape | It shows a one-time secret. Copy and store it, then confirm **I have stored the secret securely**.                                                                |
| Animations still play               | Turn on "reduce motion" in your operating system's accessibility settings and reload Studio.                                                                      |
| The theme changes back              | Browser storage may be blocked (for example in private mode), so the choice is not remembered locally; Studio then falls back to the theme saved in your profile. |
| Content is cut off at high zoom     | Wide tables scroll inside their own area; focus it with **Tab** and use the arrow keys.                                                                           |
