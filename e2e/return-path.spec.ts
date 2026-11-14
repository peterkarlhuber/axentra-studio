import { expect, test, type Page } from '@playwright/test';
import {
  e2e,
  SIGNED_OUT_CONSOLE_ALLOW,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  trackConsoleErrors,
} from './support';

/**
 * H-C1: the sign-in page's `return_to` is an open-redirect vector. `safeReturnPath`
 * (src/app/auth.ts) only accepts a same-origin path: it refuses `//host`, backslashes (browsers
 * read `/\host` as `//host`), whitespace and control characters (browsers drop tabs and line
 * breaks from URLs, so `/<TAB>/host` becomes `//host`) and anything that does not start with `/`.
 * The Vitest cases check the function; this spec drives the real sign-in in a browser against a
 * real backend and checks where the browser ends up after the password sign-in.
 *
 * Every request to the attacker host is answered locally (no DNS needed) and recorded: a refused
 * return path must leave the browser on the Studio origin, and none may reach that host.
 * Without the backslash and control-character check, the backslash, tab, newline and carriage
 * return cases fail: the router is handed a URL on another origin, so the sign-in never leaves
 * the login page (Chromium with React Router 8 ends on Studio's error page; a router that falls
 * back to a full navigation would follow it to the attacker host).
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);

const EVIL_HOST = 'evil.example';

/**
 * Raw query strings for `/login?…`, as an attacker would put them into a link. The comments say
 * what the page reads from `return_to` (URLSearchParams decodes once).
 */
const MALICIOUS: { name: string; query: string }[] = [
  { name: 'backslash', query: `return_to=/\\${EVIL_HOST}` }, // /\evil.example
  { name: 'encoded backslash', query: `return_to=/%5C${EVIL_HOST}` }, // /\evil.example
  { name: 'fully encoded backslash', query: `return_to=%2F%5C${EVIL_HOST}` }, // /\evil.example
  { name: 'protocol-relative', query: `return_to=//${EVIL_HOST}` }, // //evil.example
  { name: 'encoded protocol-relative', query: `return_to=%2F%2F${EVIL_HOST}` }, // //evil.example
  { name: 'encoded tab', query: `return_to=/%09/${EVIL_HOST}` }, // /<TAB>/evil.example
  { name: 'literal tab', query: `return_to=/\t/${EVIL_HOST}` }, // the browser drops the tab
  { name: 'encoded newline', query: `return_to=/%0A/${EVIL_HOST}` }, // /<LF>/evil.example
  { name: 'encoded carriage return', query: `return_to=/%0D/${EVIL_HOST}` }, // /<CR>/evil.example
  { name: 'backslash after tab', query: `return_to=/%09%5C${EVIL_HOST}` }, // /<TAB>\evil.example
  { name: 'javascript: URL', query: `return_to=javascript:alert(document.domain)` },
  { name: 'absolute URL', query: `return_to=https://${EVIL_HOST}/` },
];

/** Answers every request to the attacker host locally and records it. */
async function watchEvilHost(page: Page) {
  const hits: string[] = [];
  await page.context().route(
    (url) => url.hostname === EVIL_HOST || url.hostname.endsWith(`.${EVIL_HOST}`),
    async (route) => {
      hits.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>evil</h1>' });
    },
  );
  return hits;
}

async function signInVia(page: Page, query: string) {
  await page.goto(`/login?${query}`);
  await page.getByLabel(/email/i).fill(e2e.email ?? '');
  await page.getByLabel(/password/i).fill(e2e.password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

for (const { name, query } of MALICIOUS) {
  test(`return_to with ${name}: the browser stays on the Studio origin`, async ({
    page,
    baseURL,
  }) => {
    const studio = new URL(baseURL ?? '').origin;
    const hits = await watchEvilHost(page);
    const consoleErrors = trackConsoleErrors(page, SIGNED_OUT_CONSOLE_ALLOW);
    let dialog = '';
    page.on('dialog', (event) => {
      dialog = event.message();
      void event.dismiss();
    });

    await signInVia(page, query);
    // The refused path falls back to Studio's start page, which shows a signed-in page heading.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const landed = new URL(page.url());
    expect(landed.origin, `left the Studio origin: ${page.url()}`).toBe(studio);
    expect(landed.pathname, `kept the refused return path: ${page.url()}`).not.toContain(EVIL_HOST);
    expect(hits, 'requests to the attacker host').toEqual([]);
    expect(dialog, 'a javascript: return path ran').toBe('');
    consoleErrors.assertNone();
  });
}

test('a legitimate deep link is honored after the sign-in', async ({ page, baseURL }) => {
  const studio = new URL(baseURL ?? '').origin;
  const hits = await watchEvilHost(page);
  const target = '/settings?from=return-path-e2e';

  await signInVia(page, `return_to=${encodeURIComponent(target)}`);

  await expect(page).toHaveURL(`${studio}${target}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(hits).toEqual([]);
});
