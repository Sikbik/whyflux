// A copy of the working script that lives in /tmp/whyflux-tools (next to its node_modules, which hold
// playwright-core). To use it from a fresh machine: mkdir /tmp/whyflux-tools && cd /tmp/whyflux-tools &&
// npm init -y && npm i playwright-core, copy this file there, and point CHROMIUM at a system chromium.
#!/usr/bin/env node
// Headless Chromium screenshot helper (outside the project; playwright-core + system chromium).
// usage: node shot.mjs <url> <out.png> [--w 1440] [--h 900] [--dpr 1] [--mobile] [--wait 2500]
//        [--scroll Y|#selector] [--eval "js"] [--full] [--fps] [--noanim] [--reduced]
//        [--hover "selector"] [--click "selector"] [--steps '[{"scroll":1200,"wait":800,"out":"a.png"}]']
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const [url, out] = argv;
if (!url || !out) {
  console.error('usage: node shot.mjs <url> <out.png> [options]');
  process.exit(2);
}
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const flag = (n) => argv.includes(`--${n}`);

const mobile = flag('mobile');
const width = Number(opt('w', mobile ? 390 : 1440));
const height = Number(opt('h', mobile ? 844 : 900));
const dpr = Number(opt('dpr', mobile ? 2 : 1));
const wait = Number(opt('wait', 2500));
const exe = process.env.CHROMIUM || ['/usr/bin/chromium', '/usr/bin/google-chrome-stable'].find(existsSync);

const gl = flag('gpu')
  ? ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const browser = await chromium.launch({ executablePath: exe, headless: true, args: gl });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: dpr,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
  userAgent: mobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : undefined,
});
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) logs.push(`[console.${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch((e) => logs.push(`[goto] ${e.message}`));
await page.waitForTimeout(wait);

const evalJs = opt('eval', null);
if (evalJs) {
  const r = await page.evaluate(evalJs).catch((e) => `EVAL ERROR ${e.message}`);
  if (r !== undefined) console.log('eval:', JSON.stringify(r));
}

const doScroll = async (s) => {
  // The page sets scroll-behavior: smooth, so jump instantly or the shot lands mid-scroll.
  if (typeof s === 'string' && Number.isNaN(Number(s))) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    }, s);
  } else {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Number(s));
  }
};

const steps = opt('steps', null);
if (steps) {
  for (const st of JSON.parse(steps)) {
    if (st.scroll !== undefined) await doScroll(st.scroll);
    if (st.hover) await page.hover(st.hover).catch((e) => logs.push(`[hover] ${e.message}`));
    if (st.click) await page.click(st.click).catch((e) => logs.push(`[click] ${e.message}`));
    if (st.eval) await page.evaluate(st.eval).catch((e) => logs.push(`[eval] ${e.message}`));
    await page.waitForTimeout(st.wait ?? 700);
    if (st.out) await page.screenshot({ path: st.out, fullPage: false });
  }
} else {
  const scroll = opt('scroll', null);
  if (scroll) {
    await doScroll(scroll);
    await page.waitForTimeout(900);
  }
  const hover = opt('hover', null);
  if (hover) {
    await page.hover(hover).catch((e) => logs.push(`[hover] ${e.message}`));
    await page.waitForTimeout(500);
  }
  const click = opt('click', null);
  if (click) {
    await page.click(click).catch((e) => logs.push(`[click] ${e.message}`));
    await page.waitForTimeout(800);
  }
  const clipArg = opt('clip', null);
  const clip = clipArg ? (() => { const [x, y, w, h] = String(clipArg).split(',').map(Number); return { x, y, width: w, height: h }; })() : undefined;
  await page.screenshot({ path: out, fullPage: flag('full'), clip });
}

if (flag('fps')) {
  const fps = await page.evaluate(
    () =>
      new Promise((res) => {
        let n = 0;
        const t0 = performance.now();
        const tick = () => {
          n++;
          if (performance.now() - t0 > 3000) res(Math.round((n / (performance.now() - t0)) * 1000));
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  console.log(`fps(sw-gl, 3s): ${fps}`);
}

const metrics = await page.evaluate(() => ({
  scrollH: document.documentElement.scrollHeight,
  scrollW: document.documentElement.scrollWidth,
  innerW: innerWidth,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  title: document.title,
}));
console.log('page:', JSON.stringify(metrics));
if (logs.length) console.log(logs.slice(0, 25).join('\n'));
else console.log('console: clean');
await browser.close();
