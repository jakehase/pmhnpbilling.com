#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.argv[2] || join(repoRoot, 'artifacts', 'calculator-discoverability-smoke'));
const calculatorPath = '/resources/pmhnp-billing-cost-calculator.html';
const chromeBin = process.env.CHROME_BIN || '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const checks = [];
let server;
let chrome;
let profileDir;
let ws;

function check(name, passed, detail = '') {
  checks.push({ name, passed: Boolean(passed), detail });
}

function wait(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitForFile(path, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { return await readFile(path, 'utf8'); } catch {}
    await wait(50);
  }
  throw new Error(`Timed out waiting for ${path}`);
}

async function startStaticServer() {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const inspect = (chunk) => {
      const text = chunk.toString();
      output += text;
      const match = text.match(/port (\d+)/i);
      if (match) resolvePromise({ child, port: Number(match[1]) });
    };
    child.stdout.on('data', inspect);
    child.stderr.on('data', inspect);
    child.on('error', reject);
    child.on('exit', (code) => reject(new Error(`Static server exited ${code}: ${output}`)));
  });
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve: resolvePending, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolvePending(message.result);
  });
  return {
    socket,
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolvePromise, reject) => {
        pending.set(id, { resolve: resolvePromise, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function waitForReady(send) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await send('Runtime.evaluate', {
      expression: 'document.readyState',
      returnByValue: true,
    });
    if (result.result.value === 'complete') return;
    await wait(50);
  }
  throw new Error('Page did not reach readyState=complete');
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result.value;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const staticServer = await startStaticServer();
  server = staticServer.child;
  const homepageUrl = `http://127.0.0.1:${staticServer.port}/`;

  profileDir = await mkdtemp(join(tmpdir(), 'pmhnp-calculator-discovery-'));
  chrome = spawn(chromeBin, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const activePort = await waitForFile(join(profileDir, 'DevToolsActivePort'));
  const debugPort = Number(activePort.split(/\r?\n/)[0]);
  const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(homepageUrl)}`, { method: 'PUT' });
  if (!targetResponse.ok) throw new Error(`Could not create Chrome target: HTTP ${targetResponse.status}`);
  const target = await targetResponse.json();
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  ws = cdp.socket;
  const { send } = cdp;

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: homepageUrl });
  await waitForReady(send);
  await wait(300);

  const desktop = await evaluate(send, `(() => {
    const path = ${JSON.stringify(calculatorPath)};
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const nav = document.querySelector('.nav-links a[href="' + path + '"]');
    const hero = document.querySelector('.modern-hero-actions a[href="' + path + '"]');
    const pricing = document.querySelector('.proof-calculator-link[href="' + path + '"]');
    const faq = document.querySelector('#faq a[href="' + path + '"]');
    const footer = document.querySelector('.site-footer__links a[href="' + path + '"]');
    const navList = document.querySelector('.nav-links').getBoundingClientRect();
    const contact = document.querySelector('.nav-intake-btn').getBoundingClientRect();
    return {
      nav: { text: nav?.textContent.trim(), visible: visible(nav) },
      hero: { text: hero?.textContent.trim(), visible: visible(hero) },
      pricing: { text: pricing?.textContent.trim(), visible: visible(pricing) },
      faq: { text: faq?.textContent.trim(), visible: visible(faq) },
      footer: { text: footer?.textContent.trim(), visible: visible(footer) },
      navDoesNotOverlapContact: navList.right + 8 <= contact.left,
      linkCount: document.querySelectorAll('a[href="' + path + '"]').length,
    };
  })()`);

  check('desktop navigation exposes Calculator', desktop.nav.visible && desktop.nav.text === 'Calculator', JSON.stringify(desktop.nav));
  check('hero exposes Estimate your fee', desktop.hero.visible && desktop.hero.text === 'Estimate your fee', JSON.stringify(desktop.hero));
  check('pricing strip exposes Calculate your fee', desktop.pricing.visible && desktop.pricing.text.includes('Calculate your fee'), JSON.stringify(desktop.pricing));
  check('FAQ calculator link remains available', desktop.faq.visible, JSON.stringify(desktop.faq));
  check('footer exposes Cost calculator', desktop.footer.visible && desktop.footer.text === 'Cost calculator', JSON.stringify(desktop.footer));
  check('desktop navigation does not overlap Contact', desktop.navDoesNotOverlapContact, JSON.stringify({ navDoesNotOverlapContact: desktop.navDoesNotOverlapContact }));
  check('homepage has at least six canonical calculator links', desktop.linkCount >= 6, `count=${desktop.linkCount}`);

  const desktopShot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(join(outputDir, 'desktop-homepage.png'), Buffer.from(desktopShot.data, 'base64'));

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: homepageUrl });
  await waitForReady(send);
  await wait(300);
  const mobileBefore = await evaluate(send, `(() => {
    const toggle = document.querySelector('.menu-toggle');
    const rect = toggle.getBoundingClientRect();
    return {
      toggleVisible: getComputedStyle(toggle).display !== 'none' && rect.width >= 44 && rect.height >= 44,
      desktopNavHidden: getComputedStyle(document.querySelector('.nav-links')).display === 'none',
    };
  })()`);
  check('mobile menu control is visible and at least 44px', mobileBefore.toggleVisible, JSON.stringify(mobileBefore));
  check('desktop nav is hidden at mobile width', mobileBefore.desktopNavHidden, JSON.stringify(mobileBefore));

  await evaluate(send, `document.querySelector('.menu-toggle').click(); true`);
  await wait(200);
  const mobileAfter = await evaluate(send, `(() => {
    const path = ${JSON.stringify(calculatorPath)};
    const menu = document.querySelector('#mobileMenu');
    const link = menu.querySelector('a[href="' + path + '"]');
    const menuStyle = getComputedStyle(menu);
    const linkRect = link.getBoundingClientRect();
    return {
      menuOpen: menu.classList.contains('active') && menuStyle.display !== 'none',
      calculatorText: link?.textContent.trim(),
      calculatorVisible: linkRect.width > 0 && linkRect.height >= 44 && getComputedStyle(link).visibility !== 'hidden',
      calculatorHref: link?.getAttribute('href'),
    };
  })()`);
  check('mobile menu opens', mobileAfter.menuOpen, JSON.stringify(mobileAfter));
  check('mobile menu exposes a 44px Calculator link', mobileAfter.calculatorVisible && mobileAfter.calculatorText === 'Calculator', JSON.stringify(mobileAfter));
  check('mobile Calculator uses the canonical path', mobileAfter.calculatorHref === calculatorPath, JSON.stringify(mobileAfter));

  const mobileShot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(join(outputDir, 'mobile-homepage-menu.png'), Buffer.from(mobileShot.data, 'base64'));

  const failed = checks.filter((item) => !item.passed);
  const report = {
    schemaVersion: 'pmhnp.calculator-discoverability-smoke.v1',
    generatedAt: new Date().toISOString(),
    status: failed.length === 0 ? 'pass' : 'fail',
    homepageUrl,
    canonicalCalculatorPath: calculatorPath,
    checksPassed: checks.length - failed.length,
    checksFailed: failed.length,
    checks,
    screenshots: ['desktop-homepage.png', 'mobile-homepage-menu.png'],
  };
  await writeFile(join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, checksPassed: report.checksPassed, checksFailed: report.checksFailed, outputDir }, null, 2));
  if (failed.length) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error.stack || String(error));
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  if (chrome && !chrome.killed) chrome.kill('SIGTERM');
  if (server && !server.killed) server.kill('SIGTERM');
  if (profileDir) await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
