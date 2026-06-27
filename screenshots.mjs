// Screenshot all main pages at mobile + desktop viewports.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'publico', path: '/publico' },
  { name: 'donar', path: '/donar' },
  { name: 'dashboard-centro', path: '/dashboard/centro' },
  { name: 'dashboard-influencer', path: '/dashboard/influencer' },
  { name: 'sobre', path: '/sobre' }
];

const BASE = process.env.BASE_URL || 'http://localhost:3147';
const OUT = path.resolve('./.screenshots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(viewport, suffix, theme) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: theme
  });
  const page = await ctx.newPage();
  for (const r of ROUTES) {
    await page.goto(BASE + r.path, { waitUntil: 'networkidle', timeout: 30000 });
    if (theme === 'dark') {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('trackdon-theme', 'dark'); } catch {}
      });
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(800);
    const file = path.join(OUT, `${r.name}-${suffix}-${theme}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  ✓ ${r.name} (${suffix}, ${theme})`);
  }
  await ctx.close();
}

console.log('Mobile (390x844)...');
await shoot({ width: 390, height: 844 }, 'mobile', 'light');
await shoot({ width: 390, height: 844 }, 'mobile', 'dark');
console.log('Desktop (1280x900)...');
await shoot({ width: 1280, height: 900 }, 'desktop', 'light');
await shoot({ width: 1280, height: 900 }, 'desktop', 'dark');
await browser.close();
console.log(`\nDone → ${OUT}/`);
