#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(scriptDir, '..');
const privateRoot = '/root/clawd/clients/pmhnp-billing/acquisition';
const artifactFlag = process.argv.indexOf('--artifact');
const artifactPath = artifactFlag >= 0 ? process.argv[artifactFlag + 1] : '';
const checks = [];

function pass(name, detail = '') {
  checks.push({ name, status: 'pass', detail });
}

function assert(condition, name, detail = '') {
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
  pass(name, detail);
}

function read(rel) {
  return fs.readFileSync(path.join(repo, rel), 'utf8');
}

function matches(text, re) {
  return [...text.matchAll(re)];
}

function run(command, args, cwd = repo) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function pageFacts(rel) {
  const html = read(rel);
  const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
  const description = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
  const canonical = (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [])[1] || '';
  const h1s = matches(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/gi);
  const jsonLd = matches(html, /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi).map((m) => JSON.parse(m[1]));
  return { rel, html, title, description, canonical, h1s, jsonLd };
}

function localTarget(fromRel, raw) {
  const noHash = raw.split('#', 1)[0].split('?', 1)[0];
  if (!noHash || /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(noHash)) return null;
  let resolved;
  if (noHash.startsWith('/')) resolved = path.join(repo, noHash.replace(/^\/+/, ''));
  else resolved = path.resolve(path.dirname(path.join(repo, fromRel)), noHash);
  if (noHash.endsWith('/')) resolved = path.join(resolved, 'index.html');
  return resolved;
}

function analyticsRuntime({ search = '', success = null, conversionSuccess = false, includeForm = false }) {
  const store = new Map();
  if (success) store.set('pmhnp_form_success', JSON.stringify(success));
  const listeners = {};
  const fields = new Map();
  const fieldNames = ['lead_id', 'submitted_at', 'submission_type', 'attribution_version', 'lead_source', 'lead_topic', 'utm_source', 'utm_medium', 'utm_campaign', 'landing_page', 'referrer', 'services'];
  fieldNames.forEach((name) => fields.set(name, { name, value: name === 'lead_topic' ? 'general' : '' }));
  const form = {
    id: 'contact-form',
    querySelector(selector) {
      const match = selector.match(/^\[name=["']([^"']+)["']\]$/);
      return match ? fields.get(match[1]) || null : null;
    },
    addEventListener(name, fn) { listeners[`form:${name}`] = fn; }
  };
  const location = {
    search,
    pathname: conversionSuccess ? '/thank-you.html' : '/',
    hostname: 'pmhnpbilling.com',
    origin: 'https://pmhnpbilling.com'
  };
  const document = {
    referrer: 'https://www.google.com/search?q=private',
    body: { hasAttribute: (name) => conversionSuccess && name === 'data-conversion-success' },
    head: { appendChild() {} },
    createElement() { return {}; },
    addEventListener(name, fn) { listeners[`document:${name}`] = fn; },
    querySelectorAll(selector) { return includeForm && selector === 'form[data-lead-form]' ? [form] : []; }
  };
  const window = {
    PMHNP_ANALYTICS: { measurementId: 'G-TEST123' },
    location,
    sessionStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    dataLayer: [],
    crypto: crypto.webcrypto
  };
  const context = vm.createContext({ window, document, URL, URLSearchParams, Date, Uint8Array, Math, console });
  vm.runInContext(read('assets/analytics.js'), context, { filename: 'assets/analytics.js' });
  const events = window.dataLayer
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === 'event')
    .map((entry) => ({ name: entry[1], params: entry[2] || {} }));
  return { events, store, fields, listeners };
}

try {
  const privacyOutput = run('node', ['scripts/public-tree-privacy-check.mjs']);
  assert(privacyOutput.includes('PASS'), 'tracked public tree privacy guard passes');

  run('node', ['--check', 'assets/analytics.js']);
  run('node', ['--check', 'assets/modern-warm-site.js']);
  run('node', ['--check', 'script.js']);
  assert(true, 'JavaScript syntax checks pass');

  const index = read('index.html');
  const handler = read('script.js');
  const analytics = read('assets/analytics.js');
  assert(/<form[^>]+action=["']https:\/\/formspree\.io\/f\/xkorlzor["'][^>]+method=["']POST["'][^>]+data-lead-form/i.test(index), 'Formspree endpoint and POST method preserved');
  assert(/Please do not include patient information or protected health information/i.test(index), 'public form retains no-PHI warning');
  const requiredHidden = ['_next', 'lead_id', 'submitted_at', 'submission_type', 'attribution_version', 'lead_source', 'lead_topic', 'utm_source', 'utm_medium', 'utm_campaign', 'landing_page', 'referrer'];
  requiredHidden.forEach((name) => assert(new RegExp(`<input[^>]+type=["']hidden["'][^>]+name=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(index), `hidden field present: ${name}`));
  assert(!handler.includes('generate_lead'), 'pre-acceptance form handler cannot emit generate_lead');
  assert(handler.indexOf('response.ok') < handler.indexOf("window.sessionStorage.setItem('pmhnp_form_success'"), 'success record is written only after response acceptance check');
  assert(handler.includes("pmhnpTrack('form_submit_attempt'") && handler.includes("pmhnpTrack('form_submit_success'") && handler.includes("pmhnpTrack('form_submit_error'"), 'attempt, accepted, and error events are distinct');
  assert((analytics.match(/'generate_lead'/g) || []).length === 1, 'generate_lead has one controlled emission site');
  assert(!/(?:name|email|phone|message):\s*clean\(/.test(analytics), 'analytics event payload excludes contact and message fields');

  const prospect = analyticsRuntime({ conversionSuccess: true, success: { completed: true, submission_type: 'prospect', lead_id: 'web-20260811-abcdef123456', lead_topic: 'billing', lead_source: 'organic-search', attribution_version: '2026-08-v2' } });
  assert(prospect.events.filter((event) => event.name === 'generate_lead').length === 1, 'accepted prospect produces one generate_lead event');
  assert(!prospect.store.has('pmhnp_form_success'), 'success record is consumed once');

  const test = analyticsRuntime({ conversionSuccess: true, success: { completed: true, submission_type: 'test', lead_id: 'web-20260811-test12345678', lead_topic: 'practice-launch', lead_source: 'qa', attribution_version: '2026-08-v2' } });
  assert(test.events.some((event) => event.name === 'form_test_success'), 'accepted controlled test produces test-success event');
  assert(!test.events.some((event) => event.name === 'generate_lead'), 'accepted controlled test does not produce generate_lead');

  const unclassified = analyticsRuntime({ conversionSuccess: true, success: { completed: true, lead_id: 'legacy' } });
  assert(unclassified.events.some((event) => event.name === 'form_unclassified_success') && !unclassified.events.some((event) => event.name === 'generate_lead'), 'unclassified success cannot produce generate_lead');

  const direct = analyticsRuntime({ conversionSuccess: true });
  assert(!direct.events.some((event) => event.name === 'generate_lead'), 'direct thank-you visit cannot produce generate_lead');

  const initializedTest = analyticsRuntime({ search: '?lead_test=1&lead_source=qa&lead_topic=practice-launch&utm_campaign=release-smoke', includeForm: true });
  assert(initializedTest.fields.get('submission_type').value === 'test', 'lead_test=1 initializes explicit test classification');
  assert(/^web-\d{8}-[a-z0-9]{12}$/i.test(initializedTest.fields.get('lead_id').value), 'privacy-safe unique lead ID is initialized');
  assert(initializedTest.fields.get('lead_topic').value === 'practice-launch' && initializedTest.fields.get('services').value === 'practice-launch', 'practice-launch attribution maps to form topic and service');
  assert(initializedTest.fields.get('referrer').value === 'https://www.google.com/search', 'referrer query and fragment are removed');

  const expectedPages = {
    'index.html': 'https://pmhnpbilling.com/',
    'services/pmhnp-billing-services.html': 'https://pmhnpbilling.com/services/pmhnp-billing-services.html',
    'services/pmhnp-credentialing-services.html': 'https://pmhnpbilling.com/services/pmhnp-credentialing-services.html',
    'services/pmhnp-practice-launch-support.html': 'https://pmhnpbilling.com/services/pmhnp-practice-launch-support.html',
    'resources/pmhnp-practice-launch-readiness-checklist.html': 'https://pmhnpbilling.com/resources/pmhnp-practice-launch-readiness-checklist.html',
    'blog/starting-private-practice-pmhnp-billing-roadmap.html': 'https://pmhnpbilling.com/blog/starting-private-practice-pmhnp-billing-roadmap.html'
  };
  const pages = Object.entries(expectedPages).map(([rel, canonical]) => ({ ...pageFacts(rel), expectedCanonical: canonical }));
  pages.forEach((page) => {
    assert(page.title.length > 20 && page.title.length <= 70, `title present and bounded: ${page.rel}`, `${page.title.length} chars`);
    assert(page.description.length >= 100 && page.description.length <= 180, `description present and bounded: ${page.rel}`, `${page.description.length} chars`);
    assert(page.canonical === page.expectedCanonical, `canonical matches intended URL: ${page.rel}`);
    assert(page.h1s.length === 1, `exactly one H1: ${page.rel}`);
    assert(page.jsonLd.length >= 1, `JSON-LD parses: ${page.rel}`, `${page.jsonLd.length} block(s)`);
  });

  const sharedShellPages = pages.filter((page) => [
    'services/pmhnp-billing-services.html',
    'services/pmhnp-credentialing-services.html',
    'services/pmhnp-practice-launch-support.html',
    'resources/pmhnp-practice-launch-readiness-checklist.html'
  ].includes(page.rel));
  sharedShellPages.forEach((page) => {
    assert(/<nav[^>]+aria-label=["']Primary navigation["'][^>]*>[\s\S]*?<div class=["']nav-inner["']>[\s\S]*?<ul class=["']nav-links["']>/i.test(page.html), `shared navigation shell is structurally compatible: ${page.rel}`);
    assert(!/<div class=["']nav-links["']>/i.test(page.html), `navigation links use semantic list rather than unstyled div: ${page.rel}`);
    assert(page.html.includes('/assets/modern-warm-site.js?v=20260811b'), `mobile navigation controller is loaded: ${page.rel}`);
    assert(page.html.includes('/assets/modern-warm-site.css?v=20260811b'), `navigation CSS cache version is current: ${page.rel}`);
  });
  const sharedCss = read('assets/modern-warm-site.css');
  assert(sharedCss.includes('body.mw-site .skip-link') && sharedCss.includes('body.mw-site .skip-link:focus'), 'skip link is visually hidden until keyboard focus');
  assert(sharedCss.includes('body.mw-site nav ul a.nav-cta') && sharedCss.includes('body.mw-menu-open nav ul a.nav-cta'), 'desktop and mobile navigation CTA styles are present');

  const allHtml = [];
  function walkHtml(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkHtml(full);
      else if (entry.name.endsWith('.html')) allHtml.push(full);
    }
  }
  walkHtml(repo);
  const allTitles = allHtml.map((file) => ((fs.readFileSync(file, 'utf8').match(/<title>([^<]+)<\/title>/i) || [])[1] || '').trim());
  pages.forEach((page) => assert(allTitles.filter((title) => title === page.title).length === 1, `title is unique site-wide: ${page.rel}`));

  for (const page of pages) {
    const refs = matches(page.html, /\b(?:href|src)=["']([^"']+)["']/gi).map((m) => m[1]);
    const missing = [];
    for (const ref of refs) {
      const target = localTarget(page.rel, ref);
      if (target && !fs.existsSync(target)) missing.push(ref);
    }
    assert(missing.length === 0, `local references resolve: ${page.rel}`, missing.join(', '));
  }

  assert(index.includes('/services/pmhnp-practice-launch-support.html') && index.includes('/resources/pmhnp-practice-launch-readiness-checklist.html'), 'homepage links both new acquisition pages');
  const roadmap = read('blog/starting-private-practice-pmhnp-billing-roadmap.html');
  assert(roadmap.includes('/services/pmhnp-practice-launch-support.html') && roadmap.includes('/resources/pmhnp-practice-launch-readiness-checklist.html'), 'high-intent roadmap links launch page and checklist');

  const sitemap = read('sitemap.xml');
  const sitemapUrls = matches(sitemap, /<loc>([^<]+)<\/loc>/g).map((m) => m[1]);
  assert(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap contains no duplicate URLs');
  for (const url of [expectedPages['services/pmhnp-practice-launch-support.html'], expectedPages['resources/pmhnp-practice-launch-readiness-checklist.html']]) {
    assert(sitemapUrls.filter((entry) => entry === url).length === 1, `sitemap contains new page exactly once: ${url}`);
  }

  const htmlWithOldAnalytics = allHtml.filter((file) => fs.readFileSync(file, 'utf8').includes('/assets/analytics.js?v=20260709a'));
  assert(htmlWithOldAnalytics.length === 0, 'legacy analytics asset version is absent from HTML');

  const privateFiles = ['README.md', 'lead-pipeline.csv', 'RESPONSE_TEMPLATES.md', 'MEASUREMENT_CADENCE.md'];
  assert(path.relative(repo, privateRoot).startsWith('..'), 'private operations root is outside public repository');
  privateFiles.forEach((name) => {
    const full = path.join(privateRoot, name);
    assert(fs.existsSync(full), `private operations file exists: ${name}`);
    assert((fs.statSync(full).mode & 0o077) === 0, `private operations file is owner-only: ${name}`);
  });
  assert((fs.statSync(privateRoot).mode & 0o077) === 0, 'private operations directory is owner-only');
  const tracked = run('git', ['ls-files', '-z']).split('\0').filter(Boolean);
  assert(!tracked.some((name) => /(?:lead-pipeline\.csv|RESPONSE_TEMPLATES\.md|MEASUREMENT_PLAN\.md)$/.test(name)), 'private operations templates are not tracked publicly');

  run('git', ['diff', '--check']);
  assert(true, 'git diff --check passes');

  const summary = {
    schemaVersion: 1,
    result: 'pass',
    generatedAt: new Date().toISOString(),
    repoHead: run('git', ['rev-parse', 'HEAD']),
    checksPassed: checks.length,
    pagesChecked: pages.map((page) => page.rel),
    truthBoundary: 'Mechanical release smoke only. No Formspree submission was transmitted and no traffic, ranking, lead, or conversion improvement is claimed.',
    checks
  };
  if (artifactPath) {
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
    fs.chmodSync(artifactPath, 0o600);
  }
  console.log(`acquisition-release-smoke: PASS checks=${checks.length} pages=${pages.length}`);
  if (artifactPath) console.log(`artifact=${artifactPath}`);
  console.log(summary.truthBoundary);
} catch (error) {
  console.error(`acquisition-release-smoke: FAIL ${error.message}`);
  process.exit(1);
}
