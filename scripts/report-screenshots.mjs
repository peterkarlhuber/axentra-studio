#!/usr/bin/env node
/**
 * Screenshots for docs/AXENTRA_STUDIO_IMPLEMENTATION_REPORT.md, taken against a REAL Axentra.
 *
 *   export AXENTRA_E2E_PG_URL=postgresql://postgres:pg@127.0.0.1:5432/postgres
 *   scripts/e2e-backend.sh up --ref pinned --install --worker   # backend at api/BACKEND_REF
 *   eval "$(scripts/e2e-backend.sh env)"
 *   npm run build
 *   node scripts/report-screenshots.mjs                          # writes docs/screenshots/*.png
 *   scripts/e2e-backend.sh down
 *
 * What it does:
 * 1. serves `dist/` with `vite preview` on AXENTRA_E2E_PORT (proxying /v1 to AXENTRA_E2E_API),
 *    unless STUDIO_URL points to a Studio that is already running;
 * 2. signs in as the e2e admin and creates a product "Acme Projects" with tenants, users,
 *    members, a custom role, API keys, files, jobs, a schedule, events, webhooks (one local
 *    receiver started by this script, one unreachable target), a usage meter with usage events,
 *    plans with subscriptions and a notification template with one sent message. Everything goes
 *    through the public HTTP API, exactly as Studio itself would do it; nothing is mocked. Extra
 *    users come from the e2e worker's fixture job `studio.e2e.create_user`
 *    (e2e/fixtures/axentra_e2e_jobs.py), because Axentra has no API to create users, so the
 *    backend must run with `--worker`. If the product already exists, seeding is skipped;
 * 3. takes English screenshots (light theme 1440 x 900, one dark-theme page, two 360 px phone
 *    views) and, when Python with Pillow is available, re-encodes them as palette PNGs so each
 *    stays well under 300 KB.
 *
 * Options: --out DIR (default docs/screenshots), --only name[,name] (take only these shots),
 * --slug SLUG (product slug to seed or reuse, default acme-projects).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const OUT = resolve(ROOT, argValue('--out', 'docs/screenshots'));
const ONLY = argValue('--only', '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const API = process.env.AXENTRA_E2E_API;
const EMAIL = process.env.AXENTRA_E2E_EMAIL;
const PASSWORD = process.env.AXENTRA_E2E_PASSWORD;
const PORT = Number(process.env.AXENTRA_E2E_PORT ?? 4173);
const STUDIO = process.env.STUDIO_URL ?? `http://127.0.0.1:${PORT}`;
if (!API || !EMAIL || !PASSWORD) {
  console.error(
    'Set AXENTRA_E2E_API, AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD: eval "$(scripts/e2e-backend.sh env)"',
  );
  process.exit(2);
}
if (process.env.AXENTRA_E2E_WORKER !== '1') {
  console.error('The backend must run with a worker (scripts/e2e-backend.sh up --worker).');
  process.exit(2);
}

const log = (message) => console.log(`[screenshots] ${message}`);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function reachable(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

/** Stops a child started with `detached: true` together with its descendants. */
function stopGroup(child) {
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill();
  }
}

/** Starts `vite preview` unless a Studio already answers on STUDIO_URL. */
async function startStudio() {
  if (await reachable(STUDIO)) return null;
  if (process.env.STUDIO_URL) throw new Error(`no Studio at STUDIO_URL=${STUDIO}`);
  if (!existsSync(join(ROOT, 'dist/index.html'))) throw new Error('run `npm run build` first');
  log(`starting vite preview on ${STUDIO} (API ${API})`);
  const child = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    // Own process group, so that stopping it also stops vite below npx.
    { cwd: ROOT, env: { ...process.env, AXENTRA_API_URL: API }, stdio: 'ignore', detached: true },
  );
  for (let i = 0; i < 100; i += 1) {
    if (await reachable(STUDIO)) return child;
    await sleep(200);
  }
  stopGroup(child);
  throw new Error('vite preview did not start');
}

/** A local webhook receiver that accepts every delivery with 204. */
function startReceiver() {
  return new Promise((done) => {
    const server = createServer((request, response) => {
      request.resume();
      request.on('end', () => {
        response.statusCode = 204;
        response.end();
      });
    });
    server.listen(0, '127.0.0.1', () => done(server));
  });
}

/** JSON calls with the page's session cookie, the CSRF token and the Studio origin. */
async function apiClient(page) {
  const session = await (await page.request.get(`${STUDIO}/v1/auth/session`)).json();
  const base = { 'X-Axentra-CSRF': session.csrf_token, Origin: new URL(STUDIO).origin };
  const call = async (method, path, data, headers = {}, multipart) => {
    const response = await page.request.fetch(`${STUDIO}${path}`, {
      method,
      headers: { ...base, ...headers },
      data,
      multipart,
    });
    const text = await response.text();
    if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${text}`);
    return text ? JSON.parse(text) : null;
  };
  return {
    get: (path) => call('GET', path),
    post: (path, data, headers) => call('POST', path, data, headers),
    patch: (path, data, headers) => call('PATCH', path, data, headers),
    upload: (path, multipart) => call('POST', path, undefined, {}, multipart),
  };
}

async function poll(fn, what, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await fn();
    if (value) return value;
    await sleep(500);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const PRODUCT_SLUG = argValue('--slug', 'acme-projects');
const TENANTS = [
  { name: 'Blue Harbor Studio', slug: 'blue-harbor' },
  { name: 'Pinecrest Labs', slug: 'pinecrest-labs' },
  { name: 'Riverbend Logistics', slug: 'riverbend-logistics' },
  { name: 'Summit Dental', slug: 'summit-dental', suspend: true },
];
const USERS = [
  { name: 'Mara Klein', email: 'mara.klein@example.com', tenant: 0, role: 'tenant_admin' },
  { name: 'Jonas Weber', email: 'jonas.weber@example.com', tenant: 0, role: 'member' },
  { name: 'Lena Fischer', email: 'lena.fischer@example.com', tenant: 1, role: 'tenant_owner' },
  { name: 'Tom Becker', email: 'tom.becker@example.com', tenant: 2, role: 'viewer' },
];

/** Creates the screenshot data through the public API; returns the ids the shots need. */
async function seed(page, receiverUrl) {
  const api = await apiClient(page);
  const me = await api.get('/v1/me');
  const existing = (await api.get('/v1/products')).find((p) => p.slug === PRODUCT_SLUG);
  if (existing) {
    log('product exists, skipping seeding');
    const tenants = (await api.get(`/v1/products/${existing.id}/tenants`)).items;
    const webhooks = await api.get(`/v1/products/${existing.id}/webhooks`);
    return {
      productId: existing.id,
      tenantId: tenants.find((t) => t.slug === TENANTS[0].slug).id,
      webhookId: (webhooks.items ?? webhooks)[0]?.id,
    };
  }
  log('seeding product "Acme Projects"');
  const product = await api.post('/v1/products', {
    name: 'Acme Projects',
    slug: PRODUCT_SLUG,
    description: 'Project management SaaS (screenshot data for the implementation report)',
  });
  const pid = product.id;
  const P = `/v1/products/${pid}`;

  const tenants = [];
  for (const spec of TENANTS) {
    tenants.push(await api.post(`${P}/tenants`, { name: spec.name, slug: spec.slug }));
  }
  const T = (index) => `${P}/tenants/${tenants[index].id}`;
  await api.post(`${T(0)}/members`, { user_id: me.user.id, role: 'tenant_owner' });

  // Users: Axentra has no user-creation API; the e2e worker's fixture job creates them.
  for (const user of USERS) {
    const job = await api.post(`${P}/jobs`, {
      kind: 'studio.e2e.create_user',
      payload: { email: user.email, password: `pw-${user.email}-Report-1`, name: user.name },
    });
    const done = await poll(async () => {
      const current = await api.get(`${P}/jobs/${job.id}`);
      return current.status === 'succeeded' ? current : null;
    }, `user ${user.email}`);
    user.id = done.result.user_id;
    await api.post(`${T(user.tenant)}/members`, { user_id: user.id, role: user.role });
  }
  await api.post(`${P}/members`, { user_id: USERS[0].id, role: 'product_support' });
  await api.post(`${T(1)}/invitations`, { email: 'new.hire@example.com', role: 'member' });

  for (const spec of TENANTS.filter((t) => t.suspend)) {
    const tenant = tenants[TENANTS.indexOf(spec)];
    const current = await api.get(`${P}/tenants/${tenant.id}`);
    await api.patch(
      `${P}/tenants/${tenant.id}`,
      { status: 'suspended' },
      { 'If-Match': String(current.version) },
    );
  }

  await api.post(`${P}/roles`, {
    key: 'support_agent',
    name: 'Support agent',
    scope: 'tenant',
    description: 'Reads tenant data and files, sends notifications',
    permissions: ['tenant:read', 'members:read', 'records:read', 'files:read', 'notify:send'],
  });
  await api.post(`${P}/api-keys`, {
    name: 'CI deploy pipeline',
    permissions: ['product:read', 'jobs:read', 'jobs:manage'],
  });
  await api.post(`${P}/api-keys`, {
    name: 'Blue Harbor mobile app',
    tenant_id: tenants[0].id,
    permissions: ['tenant:read', 'records:read', 'records:write', 'files:read'],
  });

  const files = [
    {
      name: 'project-plan.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'task,owner,due\nKick-off,Mara,2026-11-03\nDesign review,Jonas,2026-11-10\n',
      ),
    },
    {
      name: 'meeting-notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Weekly sync\n- Release 2.4 on track\n- Invoice export ready for QA\n'),
    },
    {
      name: 'logo-mark.png',
      mimeType: 'image/png',
      buffer: readFileSync(join(ROOT, 'public/branding/axentra-mark.png')),
    },
  ];
  for (const file of files) {
    await api.upload(`${T(0)}/files`, { file });
  }

  await api.post(`${P}/usage/meters`, {
    key: 'api_calls',
    name: 'API calls',
    unit: 'calls',
    aggregation: 'sum',
    default_limit: 50000,
    default_enforcement: 'soft',
  });
  const now = Date.now();
  for (let day = 20; day >= 0; day -= 1) {
    for (let index = 0; index < 3; index += 1) {
      const quantity = [1200, 860, 430][index] + ((day * 137 + index * 59) % 400);
      const occurred = new Date(now - day * 86_400_000 - index * 3_600_000).toISOString();
      const body = { meter: 'api_calls', quantity, occurred_at: occurred };
      try {
        await api.post(`${T(index)}/usage/events`, body, {
          'Idempotency-Key': `rep-${day}-${index}`,
        });
      } catch {
        // The server may refuse timestamps outside the current period: record them now instead.
        await api.post(
          `${T(index)}/usage/events`,
          { meter: 'api_calls', quantity },
          { 'Idempotency-Key': `rep-now-${day}-${index}` },
        );
      }
    }
  }

  await api.post(`${P}/billing/plans`, {
    key: 'free',
    name: 'Free',
    description: 'For small teams getting started',
    entitlements: { 'feature.sso': false, 'limit.api_calls': 10000 },
  });
  const pro = await api.post(`${P}/billing/plans`, {
    key: 'pro',
    name: 'Pro',
    description: 'Unlimited projects and priority support',
    prices: [
      { amount_minor: 2900, currency: 'EUR', interval: 'month' },
      { amount_minor: 29000, currency: 'EUR', interval: 'year' },
    ],
    trial_days: 14,
    entitlements: { 'feature.sso': true, 'limit.api_calls': 100000 },
  });
  const priceId = (interval) => pro.prices.find((price) => price.interval === interval).id;
  await api.post(`${T(0)}/billing/subscription`, { plan: 'pro', price_id: priceId('month') });
  await api.post(`${T(1)}/billing/subscription`, { plan: 'free' });
  await api.post(`${T(2)}/billing/subscription`, { plan: 'pro', price_id: priceId('year') });

  const webhook = await api.post(`${P}/webhooks`, {
    url: receiverUrl,
    event_types: ['project.*'],
    description: 'Project sync service',
  });
  await api.post(`${P}/webhooks`, {
    url: 'http://127.0.0.1:9/unreachable',
    event_types: ['invoice.paid'],
    description: 'Legacy accounting bridge (unreachable)',
  });

  for (const [index, type, data] of [
    [0, 'project.created', { project: 'Website relaunch' }],
    [0, 'project.updated', { project: 'Website relaunch', field: 'due_date' }],
    [1, 'project.created', { project: 'Lab inventory' }],
    [2, 'invoice.paid', { invoice: 'INV-2026-0042', amount_minor: 2900 }],
    [0, 'project.archived', { project: 'Q3 campaign' }],
  ]) {
    await api.post(`${T(index)}/events`, { type, data });
  }

  for (let index = 0; index < 4; index += 1) {
    await api.post(`${P}/jobs`, {
      kind: 'studio.e2e.ok',
      tenant_id: tenants[index % 3].id,
      payload: { report: 'nightly-export', part: index + 1 },
    });
  }
  await api.post(`${P}/jobs`, {
    kind: 'studio.e2e.flaky',
    tenant_id: tenants[1].id,
    payload: { report: 'sync' },
  });
  await api.post(`${P}/schedules`, {
    name: 'Nightly export',
    kind: 'studio.e2e.ok',
    cron: '0 2 * * *',
    payload: { report: 'nightly-export' },
  });
  await api.post(`${P}/schedules`, {
    name: 'Usage sweep',
    kind: 'studio.e2e.ok',
    interval_seconds: 3600,
    payload: { task: 'usage-sweep' },
  });

  await api.post(`${P}/notify/templates`, {
    key: 'project.invite',
    name: 'Project invitation',
    category: 'collaboration',
    variables: ['name', 'project'],
    sample_data: { name: 'Mara', project: 'Website relaunch' },
    variants: {
      en: {
        subject: '{{ name }}, you were added to {{ project }}',
        text: 'Hi {{ name }}, you now have access to {{ project }}.',
        html: '<h1>Welcome to {{ project }}</h1><p>Hi {{ name }}, you now have access to <strong>{{ project }}</strong>.</p><p>Open Acme Projects to get started.</p>',
      },
      de: {
        subject: '{{ name }}, Sie wurden zu {{ project }} hinzugefügt',
        text: 'Hallo {{ name }}, Sie haben jetzt Zugriff auf {{ project }}.',
        html: '<h1>Willkommen bei {{ project }}</h1><p>Hallo {{ name }}, Sie haben jetzt Zugriff auf <strong>{{ project }}</strong>.</p>',
      },
    },
  });
  await api.post(
    `${T(0)}/notify/send`,
    {
      template_key: 'project.invite',
      to: { user_id: USERS[0].id },
      variables: { name: 'Mara', project: 'Website relaunch' },
    },
    { 'Idempotency-Key': `rep-notify-${pid}` },
  );

  // Let the worker and the dispatcher finish the jobs, deliveries and the message.
  await poll(
    async () => {
      const stats = await api.get(`${P}/jobs/stats`);
      const text = JSON.stringify(stats);
      return !/"(queued|running)":\s*[1-9]/.test(text);
    },
    'jobs to finish',
    90_000,
  ).catch((error) => log(`note: ${error.message}`));
  await sleep(4000);
  return { productId: pid, tenantId: tenants[0].id, webhookId: webhook.endpoint?.id ?? webhook.id };
}

/** Waits until the route rendered its heading and no skeleton or busy region is left. */
async function settle(page) {
  await page.locator('main h1').first().waitFor({ timeout: 20_000 });
  await page
    .waitForFunction(
      () => document.querySelectorAll('[aria-busy="true"], [class*="skeleton" i]').length === 0,
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => log(`note: ${page.url()} still shows loading placeholders`));
  await page.evaluate(() => document.fonts.ready);
  await sleep(600);
}

function optimize(file) {
  const python = spawnSync(
    'python3',
    [
      '-c',
      'import sys\nfrom PIL import Image\np=sys.argv[1]\nim=Image.open(p).convert("RGB")\nim.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(p, optimize=True)',
      file,
    ],
    { encoding: 'utf8' },
  );
  if (python.status !== 0)
    log(`note: not optimized (${(python.stderr || '').trim().split('\n').pop()})`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const preview = await startStudio();
  const receiver = await startReceiver();
  const receiverUrl = `http://127.0.0.1:${receiver.address().port}/hooks/acme`;
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  const taken = [];
  try {
    const newContext = (options) =>
      browser.newContext({ baseURL: STUDIO, locale: 'en-US', ...options }).then(async (context) => {
        const theme = options.colorScheme ?? 'light';
        await context.addInitScript((t) => {
          localStorage.setItem('axentra.studio.locale', 'en');
          localStorage.setItem('axentra.studio.theme', t);
        }, theme);
        return context;
      });
    const wanted = (name) => ONLY.length === 0 || ONLY.includes(name);
    const shoot = async (page, name, path, before) => {
      if (!wanted(name)) return;
      if (path) await page.goto(path);
      await settle(page);
      if (before) await before(page);
      await page.evaluate(() => document.activeElement?.blur?.());
      const file = join(OUT, `${name}.png`);
      await page.screenshot({ path: file });
      optimize(file);
      taken.push({ name, kb: Math.round(statSync(file).size / 1024) });
      log(`${name}.png (${taken.at(-1).kb} KB)`);
    };
    const signIn = async (page) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(EMAIL);
      await page.getByLabel(/password/i).fill(PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL((url) => !url.pathname.startsWith('/login'));
    };

    const desktop = await newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    const page = await desktop.newPage();
    if (wanted('login')) {
      await page.goto('/login');
      await page.getByLabel(/email/i).waitFor();
      await shoot(page, 'login', null);
    }
    await signIn(page);
    const ids = await seed(page, receiverUrl);
    const P = `/p/${ids.productId}`;
    await shoot(page, 'dashboard', `${P}/dashboard`);
    await shoot(page, 'tenants', `${P}/tenants`);
    await shoot(page, 'tenant-members', `${P}/tenants/${ids.tenantId}`, async (p) => {
      const tab = p.getByRole('tab', { name: /members/i });
      if (await tab.count()) {
        await tab.first().click();
        await settle(p);
      }
    });
    await shoot(page, 'users', `${P}/users`);
    await shoot(page, 'roles', `${P}/roles`);
    await shoot(page, 'api-keys', `${P}/api-keys`);
    await shoot(page, 'files', `${P}/files?tenant=${ids.tenantId}`);
    await shoot(page, 'jobs', `${P}/jobs`);
    await shoot(page, 'events', `${P}/events`);
    await shoot(page, 'webhook-detail', `${P}/webhooks/${ids.webhookId}`);
    await shoot(page, 'usage', `${P}/usage`);
    await shoot(page, 'plans', `${P}/plans`);
    await shoot(page, 'subscription', `${P}/subscriptions/${ids.tenantId}`);
    await shoot(
      page,
      'notification-template',
      `${P}/notifications/templates/project.invite`,
      async (p) => {
        await p
          .locator('iframe')
          .first()
          .waitFor({ timeout: 15_000 })
          .catch(() => {});
        await sleep(800);
      },
    );
    await shoot(page, 'audit', '/audit');
    await shoot(page, 'settings', '/settings');
    await desktop.close();

    const dark = await newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const darkPage = await dark.newPage();
    await signIn(darkPage);
    await shoot(darkPage, 'dashboard-dark', `${P}/dashboard`);
    await shoot(darkPage, 'usage-dark', `${P}/usage`);
    await dark.close();

    const phone = await newContext({
      viewport: { width: 360, height: 740 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'light',
    });
    const phonePage = await phone.newPage();
    await signIn(phonePage);
    await shoot(phonePage, 'mobile-tenants', `${P}/tenants`);
    await shoot(phonePage, 'mobile-navigation', `${P}/dashboard`, async (p) => {
      await p
        .getByRole('button', { name: /open navigation/i })
        .first()
        .click();
      await sleep(500);
    });
    await phone.close();
  } finally {
    await browser.close();
    receiver.close();
    if (preview) stopGroup(preview);
  }
  const large = taken.filter((shot) => shot.kb > 300);
  if (large.length) log(`warning: over 300 KB: ${large.map((s) => s.name).join(', ')}`);
  log(`done: ${taken.length} screenshots in ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
