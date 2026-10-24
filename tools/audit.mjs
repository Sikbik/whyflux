#!/usr/bin/env node
// House-rules audit for the rendered page (docs/DESIGN.md, copy and accuracy rules). Loads the real page in headless Chromium,
// scrolls it end to end so every chapter mounts and reveals, then checks the DOM and computed styles:
//   periods     visible headings, buttons, links, labels and captions that contain a sentence period
//   gradients   computed background-image gradients that are not solid (a gradient of one colour is a
//               hairline trick and passes); masks are reported separately (plate fades are allowed)
//   glows       text-shadow, blurred box-shadow, filter blur/drop-shadow
//   chips       small uppercase text inside a bordered or filled capsule
//   words       "FIG x.x", em dashes, banned claims, competitor names outside #arena and #cost
//   console     errors and page errors
// usage (playwright-core must resolve, e.g. run from /tmp/whyflux-tools):
//   node audit.mjs [url] [--json]
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:5190/';
const asJson = process.argv.includes('--json');
const exe = process.env.CHROMIUM || ['/usr/bin/chromium', '/usr/bin/google-chrome-stable'].find(existsSync);

const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 240)));
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 240)}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const step = Math.round(innerHeight * 0.6);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 140));
  }
  await new Promise((r) => setTimeout(r, 1200));
});

const report = await page.evaluate(() => {
  const out = { periods: [], gradients: [], masks: [], glows: [], chips: [], words: [] };
  const chapterOf = (el) => el.closest('section[id]')?.id ?? el.closest('header,nav,footer')?.tagName.toLowerCase() ?? 'page';
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"] .sr-only');
  };
  const isSrOnly = (el) => !!el.closest('.sr-only, .visually-hidden');
  const where = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
    return `${chapterOf(el)} ${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`;
  };

  // Periods: short UI text. A period counts when it ends the text or ends a sentence mid-text.
  const UI = 'h1,h2,h3,h4,h5,h6,button,a,label,legend,summary,figcaption,th,[role="tab"],[role="button"],[class*="eyebrow" i],[class*="title" i],[class*="kicker" i],[class*="caption" i],[class*="headline" i]';
  const sentencePeriod = /(^|[^.\d])\.(\s+[A-Z]|\s*$)/;
  for (const el of document.querySelectorAll(UI)) {
    if (!visible(el) || isSrOnly(el)) continue;
    const t = (el.innerText ?? '').trim().replace(/\s+/g, ' ');
    if (!t || t.length > 160) continue;
    const stripped = t.replace(/\b(e\.g|i\.e|etc|vs|U\.S|Inc|Ltd|No)\./g, '$1');
    if (sentencePeriod.test(stripped) || /…|\.\.\./.test(t)) out.periods.push(`${where(el)}: "${t.slice(0, 90)}"`);
  }

  // Styles.
  const colorsIn = (s) => (s.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|transparent/gi) ?? []).map((c) => c.replace(/\s+/g, ''));
  for (const el of document.querySelectorAll('body *')) {
    if (!(el instanceof HTMLElement || el instanceof SVGElement)) continue;
    const cs = getComputedStyle(el);
    for (const pseudo of [null, '::before', '::after']) {
      const s = pseudo ? getComputedStyle(el, pseudo) : cs;
      if (pseudo && (s.content === 'none' || s.content === 'normal')) continue;
      const bg = s.backgroundImage;
      if (bg && bg.includes('gradient')) {
        for (const g of bg.split(/,(?![^(]*\))(?=\s*(?:linear|radial|conic|repeating|url))/)) {
          if (!g.includes('gradient')) continue;
          const cols = new Set(colorsIn(g));
          const solidLine = cols.size <= 1;
          const ticks = /repeating-/.test(g) && cols.has('transparent') && cols.size === 2; // rulers: 1px solid ticks
          if (!solidLine && !ticks) out.gradients.push(`${where(el)}${pseudo ?? ''}: ${g.slice(0, 120)}`);
        }
      }
      const mask = s.maskImage || s.webkitMaskImage;
      if (mask && mask.includes('gradient')) out.masks.push(`${where(el)}${pseudo ?? ''}`);
      if (s.textShadow && s.textShadow !== 'none') out.glows.push(`${where(el)}${pseudo ?? ''}: text-shadow ${s.textShadow.slice(0, 60)}`);
      if (s.filter && /blur|drop-shadow/.test(s.filter)) out.glows.push(`${where(el)}${pseudo ?? ''}: filter ${s.filter.slice(0, 60)}`);
      if (s.backdropFilter && /blur/.test(s.backdropFilter)) out.glows.push(`${where(el)}${pseudo ?? ''}: backdrop ${s.backdropFilter.slice(0, 40)} (frosted)`);
      if (s.boxShadow && s.boxShadow !== 'none') {
        // "rgb(...) 0px 0px 12px 0px": the third length is the blur radius.
        for (const sh of s.boxShadow.split(/,(?![^(]*\))/)) {
          const lens = sh.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) ?? [];
          if (lens.length >= 3 && Number.parseFloat(lens[2]) > 0) out.glows.push(`${where(el)}${pseudo ?? ''}: box-shadow ${sh.trim().slice(0, 70)}`);
        }
      }
    }
    // Chips: small uppercase text in a capsule with a border or a fill.
    if (el instanceof HTMLElement && visible(el) && !isSrOnly(el)) {
      const t = el.innerText?.trim() ?? '';
      const r = el.getBoundingClientRect();
      if (t && t.length <= 28 && r.height <= 34 && cs.textTransform === 'uppercase') {
        const bordered = Number.parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
        const filled = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
        if (bordered || filled) out.chips.push(`${where(el)}: "${t}"`);
      }
    }
  }

  // Words.
  const RIVALS = /\b(Akash|io\.net|Aethir|Internet Computer|ICP|Render Network|Fluence|Golem|Theta|Phala|AWS|Amazon Web Services|Azure|DigitalOcean|Vercel|Google Cloud|Hetzner)\b/;
  const BANNED = /(can['’]t spy|end-to-end|confidential computing|attestation|unhackable|zero downtime|thousands of operators|every continent|3\+ nodes|hardware enclave)/i;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || !visible(el)) continue;
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const ch = chapterOf(el);
    const key = (msg) => {
      const k = `${ch}|${msg}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.words.push(`${ch}: ${msg}`);
      }
    };
    if (/\bFIG\.?\s*\d/i.test(t)) key(`FIG label "${t.slice(0, 60)}"`);
    if (t.includes('—')) key(`em dash "${t.slice(0, 60)}"`);
    const b = t.match(BANNED);
    if (b) key(`banned "${b[0]}" in "${t.slice(0, 80)}"`);
    const r = t.match(RIVALS);
    if (r && ch !== 'arena' && ch !== 'cost') key(`rival "${r[0]}" in "${t.slice(0, 80)}"`);
  }
  return out;
});

await browser.close();
const result = { url, ...report, console: [...new Set(consoleErrors)] };
if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const [k, v] of Object.entries(result)) {
    if (k === 'url') continue;
    console.log(`\n== ${k} (${v.length})`);
    for (const line of v.slice(0, 60)) console.log(`  ${line}`);
    if (v.length > 60) console.log(`  ... ${v.length - 60} more`);
  }
}
