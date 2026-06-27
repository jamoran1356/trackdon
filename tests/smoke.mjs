// Smoke tests for trackdon.
// Run while a dev or production server listens at BASE_URL.
//   BASE_URL=http://localhost:3147 node tests/smoke.mjs
// Exit 0 if all checks pass; non-zero on any failure.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3147';

const CHECKS = [
  {
    path: '/',
    expect: ['Cada donación', 'rastro', 'trackdon', 'Donar'],
    minH1: 1
  },
  {
    path: '/publico',
    expect: ['Panel público', 'Total donado', 'Donaciones recientes'],
    minH1: 1
  },
  {
    path: '/donar',
    expect: ['¿Qué quieres donar?', 'Bienes físicos', 'Cripto', 'Transferencia'],
    minH1: 1
  },
  {
    path: '/dashboard/centro',
    expect: ['Centro Norte', 'Inventario actual', 'Inventario por tipo'],
    minH1: 1
  },
  {
    path: '/dashboard/influencer',
    expect: ['Recibido', 'Rendido', 'Pendiente de rendir', 'Rendiciones'],
    minH1: 1
  },
  {
    path: '/sobre',
    expect: ['Sobre trackdon', 'No-monetización', 'Privacidad'],
    minH1: 1
  }
];

const results = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push({ url: page.url(), text: msg.text() });
});

for (const c of CHECKS) {
  const url = BASE + c.path;
  const r = { path: c.path, status: null, missing: [], h1: 0, error: null };
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    r.status = resp?.status() ?? null;
    if (r.status !== 200) {
      r.error = `HTTP ${r.status}`;
    } else {
      const body = (await page.locator('body').innerText()).toLowerCase();
      for (const needle of c.expect) {
        if (!body.includes(needle.toLowerCase())) r.missing.push(needle);
      }
      r.h1 = await page.locator('h1').count();
      if (r.h1 < c.minH1) r.error = `h1 count=${r.h1} (min ${c.minH1})`;
      else if (r.missing.length) r.error = `missing: ${r.missing.join(', ')}`;
    }
  } catch (e) {
    r.error = String(e.message || e).slice(0, 150);
  }
  results.push(r);
}

// Dark-mode toggle sanity
let darkOk = false;
try {
  await page.goto(BASE + '/');
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(200);
  darkOk = await page.evaluate(() => document.documentElement.classList.contains('dark'));
} catch {
  darkOk = false;
}

await browser.close();

// Report
console.log('\n=== Smoke results ===');
let failed = 0;
for (const r of results) {
  const ok = !r.error;
  console.log(`${ok ? '✓' : '✗'} ${r.path}  [${r.status ?? '—'}]  h1=${r.h1}  ${r.error ? '· ' + r.error : ''}`);
  if (!ok) failed++;
}
console.log(`Dark-mode toggle: ${darkOk ? '✓' : '✗'}`);
if (consoleErrors.length) {
  console.log('\nConsole errors:');
  for (const e of consoleErrors.slice(0, 10)) console.log(`  • ${e.url}\n    ${e.text}`);
} else {
  console.log('Console errors: ✓ none');
}

const total = results.length + 1 + (consoleErrors.length ? 1 : 0);
const passed = results.length - failed + (darkOk ? 1 : 0) + (consoleErrors.length ? 0 : 1);
console.log(`\n${passed}/${total} checks passed`);
process.exit(failed === 0 && darkOk && consoleErrors.length === 0 ? 0 : 1);
