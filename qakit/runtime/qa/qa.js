// Kit page of the Axentra Studio QA kit. Plain DOM code; every value from the server is inserted as text.
'use strict';

const RESULTS = [
  ['pass', 'Bestanden'],
  ['fail', 'Fehlgeschlagen'],
  ['skip', 'Nicht getestet'],
  ['na', 'Nicht anwendbar'],
];
const LABEL = Object.fromEntries(RESULTS);
let checklist = { sections: [] };
let results = {};
let saveTimer = null;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

async function getJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

function showTab() {
  const name = (location.hash || '#start').slice(1);
  const known = ['start', 'checkliste', 'mails', 'integrationen', 'info'];
  const tab = known.includes(name) ? name : 'start';
  for (const k of known) document.getElementById(`tab-${k}`).hidden = k !== tab;
  for (const a of document.querySelectorAll('.tabs a')) {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  if (tab === 'mails') loadMails();
}

function fillUsers(data) {
  const users = Array.isArray(data) ? data : (data?.benutzer ?? []);
  const body = document.querySelector('#users tbody');
  body.replaceChildren();
  if (!users.length) {
    body.append(
      el(
        'tr',
        {},
        el('td', { colspan: '5', text: 'Die Testbenutzer werden beim ersten Start angelegt.' }),
      ),
    );
    return;
  }
  for (const u of users) {
    const roles = Array.isArray(u.roles) ? u.roles.join(', ') : String(u.roles ?? '');
    body.append(
      el(
        'tr',
        {},
        el('td', {}, el('code', { text: u.email ?? '' })),
        el('td', {}, el('code', { text: u.password ?? '' })),
        el('td', { text: u.name ?? '' }),
        el('td', { text: roles }),
        el('td', { text: u.testen ?? u.test_focus ?? '' }),
      ),
    );
  }
}

function fillIntegrations(items) {
  const body = document.querySelector('#integrations tbody');
  body.replaceChildren();
  const badge = { real: 'Echt, lokal', simulated: 'Simuliert', missing: 'Nicht konfiguriert' };
  for (const i of items) {
    body.append(
      el(
        'tr',
        {},
        el('td', { text: i.name }),
        el('td', {}, el('span', { class: `badge ${i.status}`, text: badge[i.status] ?? i.status })),
        el('td', { text: i.detail }),
      ),
    );
  }
}

function fillBuild(build) {
  const dl = document.getElementById('build');
  dl.replaceChildren();
  for (const [k, v] of Object.entries(build))
    dl.append(el('dt', { text: k }), el('dd', { text: String(v) }));
}

async function loadMails() {
  const body = document.querySelector('#mails tbody');
  try {
    const mails = await getJson('api/mails');
    body.replaceChildren();
    if (!mails.length)
      body.append(el('tr', {}, el('td', { colspan: '3', text: 'Noch keine E-Mails.' })));
    for (const m of mails) {
      const row = el(
        'tr',
        { class: 'clickable', tabindex: '0' },
        el('td', { text: m.date }),
        el('td', { text: m.to }),
        el('td', { text: m.subject }),
      );
      const open = () => showMail(m.id);
      row.addEventListener('click', open);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') open();
      });
      body.append(row);
    }
  } catch {
    body.replaceChildren(
      el('tr', {}, el('td', { colspan: '3', text: 'E-Mails konnten nicht geladen werden.' })),
    );
  }
}

async function showMail(id) {
  const m = await getJson(`api/mails/${encodeURIComponent(id)}`);
  document.getElementById('mail-view').hidden = false;
  document.getElementById('mail-subject').textContent = m.headers.Subject ?? '(ohne Betreff)';
  const dl = document.getElementById('mail-headers');
  dl.replaceChildren();
  for (const k of ['From', 'To', 'Date'])
    if (m.headers[k]) dl.append(el('dt', { text: k }), el('dd', { text: m.headers[k] }));
  document.getElementById('mail-text').textContent = m.text || '(nur HTML-Fassung)';
  const link = document.getElementById('mail-html-link');
  link.hidden = !m.has_html;
  link.querySelector('a').href = `api/mails/${encodeURIComponent(id)}/html`;
  document.getElementById('mail-view').scrollIntoView({ behavior: 'smooth' });
}

function allCases() {
  return checklist.sections.flatMap((s) => s.cases.map((c) => ({ ...c, section: s.title })));
}

function updateSummary() {
  const cases = allCases();
  const count = { pass: 0, fail: 0, skip: 0, na: 0 };
  for (const c of cases) {
    const r = results[c.id]?.result;
    if (r in count) count[r] += 1;
  }
  const open = cases.length - count.pass - count.fail - count.skip - count.na;
  document.getElementById('summary').textContent =
    `${cases.length} Prüfpunkte: ${count.pass} bestanden, ${count.fail} fehlgeschlagen, ` +
    `${count.skip} nicht getestet, ${count.na} nicht anwendbar, ${open} noch offen.`;
}

function save() {
  clearTimeout(saveTimer);
  const state = document.getElementById('save-state');
  state.textContent = 'Speichert …';
  saveTimer = setTimeout(async () => {
    try {
      const r = await fetch('api/results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      });
      state.textContent = r.ok
        ? 'Gespeichert.'
        : 'Speichern fehlgeschlagen. Läuft Axentra Studio noch?';
    } catch {
      state.textContent = 'Speichern fehlgeschlagen. Läuft Axentra Studio noch?';
    }
  }, 400);
}

function record(id, patch) {
  results[id] = { ...(results[id] ?? {}), ...patch, updated: new Date().toISOString() };
  save();
  updateSummary();
}

function renderChecklist() {
  const root = document.getElementById('checklist');
  root.replaceChildren();
  for (const s of checklist.sections) {
    const card = el(
      'div',
      { class: 'card', 'data-section': s.id },
      el('h2', { text: `${s.id} · ${s.title}` }),
    );
    if (s.intro) card.append(el('p', { class: 'muted', text: s.intro }));
    for (const c of s.cases) {
      const r = results[c.id] ?? {};
      const box = el('div', { class: 'case', 'data-result': r.result ?? '', id: `case-${c.id}` });
      box.append(el('h3', { text: `${c.id} – ${c.title}` }));
      if (c.user) box.append(el('p', { class: 'meta', text: `Als: ${c.user}` }));
      const steps = el('ol');
      for (const step of c.steps ?? []) steps.append(el('li', { text: step }));
      box.append(
        steps,
        el('p', { class: 'expect' }, el('strong', { text: 'Erwartet: ' }), c.expected ?? ''),
        el('p', { class: 'expect' }, el('strong', { text: 'Fehler, wenn: ' }), c.failure ?? ''),
      );
      const fs = el('fieldset', { class: 'result' }, el('legend', { text: 'Ergebnis' }));
      for (const [value, label] of RESULTS) {
        const input = el('input', { type: 'radio', name: `r-${c.id}`, value });
        if (r.result === value) input.checked = true;
        input.addEventListener('change', () => {
          box.dataset.result = value;
          record(c.id, { result: value });
        });
        fs.append(el('label', {}, input, label));
      }
      const note = el('textarea', {
        rows: '2',
        'aria-label': `Notiz zu ${c.id}`,
        placeholder: 'Notiz: was ist passiert?',
      });
      note.value = r.note ?? '';
      note.addEventListener('input', () => record(c.id, { note: note.value }));
      const shot = el('input', {
        type: 'text',
        'aria-label': `Screenshot-Datei zu ${c.id}`,
        placeholder: 'Screenshot-Datei (z. B. B-03-fehler.png)',
      });
      shot.value = r.screenshot ?? '';
      shot.addEventListener('input', () => record(c.id, { screenshot: shot.value }));
      box.append(fs, el('div', { class: 'notes' }, note, shot));
      card.append(box);
    }
    root.append(card);
  }
  applyFilter();
  updateSummary();
}

function applyFilter() {
  const mode = document.getElementById('filter').value;
  for (const box of document.querySelectorAll('.case')) {
    const r = box.dataset.result;
    box.hidden = (mode === 'open' && r) || (mode === 'fail' && r !== 'fail');
  }
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
}

function exportMarkdown() {
  const lines = [
    '# Ergebnis der QA-Abnahme: Axentra Studio (lokale Testversion)',
    '',
    document.getElementById('summary').textContent,
    '',
  ];
  for (const s of checklist.sections) {
    lines.push(`## ${s.id} · ${s.title}`, '');
    for (const c of s.cases) {
      const r = results[c.id] ?? {};
      lines.push(`- **${c.id} ${c.title}**: ${LABEL[r.result] ?? 'offen'}`);
      if (r.note) lines.push(`  - Notiz: ${r.note.replace(/\n/g, ' ')}`);
      if (r.screenshot) lines.push(`  - Screenshot: ${r.screenshot}`);
    }
    lines.push('');
  }
  download(`QA-Ergebnis-${stamp()}.md`, lines.join('\n'), 'text/markdown;charset=utf-8');
}

function exportCsv() {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['ID', 'Bereich', 'Titel', 'Ergebnis', 'Notiz', 'Screenshot-Datei'].map(q).join(';'),
  ];
  for (const c of allCases()) {
    const r = results[c.id] ?? {};
    rows.push(
      [c.id, c.section, c.title, LABEL[r.result] ?? 'offen', r.note, r.screenshot].map(q).join(';'),
    );
  }
  download(`QA-Ergebnis-${stamp()}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
}

async function init() {
  window.addEventListener('hashchange', showTab);
  showTab();
  document.getElementById('reload-mails').addEventListener('click', loadMails);
  document.getElementById('filter').addEventListener('change', applyFilter);
  document.getElementById('export-md').addEventListener('click', exportMarkdown);
  document.getElementById('export-csv').addEventListener('click', exportCsv);
  try {
    const info = await getJson('api/info');
    fillUsers(info.users);
    fillIntegrations(info.integrations);
    fillBuild(info.build);
  } catch {
    fillUsers([]);
  }
  try {
    [checklist, results] = await Promise.all([getJson('api/checklist'), getJson('api/results')]);
  } catch {
    checklist = { sections: [] };
  }
  renderChecklist();
}

init();
