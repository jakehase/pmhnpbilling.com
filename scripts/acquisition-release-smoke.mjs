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
  const description = (html.match(/<meta\s+name=["']description["']\s+content="([^"]+)"/i) || html.match(/<meta\s+name=["']description["']\s+content='([^']+)'/i) || [])[1] || '';
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

function calculatorRuntime() {
  const listeners = new Map();
  const attributes = new Map();
  const classNames = new Set();
  const makeInput = () => {
    const input = {
      value: '',
      focused: false,
      get validity() {
        if (!input.value.trim()) return { valid: true };
        const number = Number(input.value);
        const decimals = (input.value.split('.')[1] || '').length;
        return { valid: Number.isFinite(number) && number >= 0 && decimals <= 2 };
      },
      setAttribute(name, value) { attributes.set(`${input.id}:${name}`, String(value)); },
      addEventListener(name, fn) { listeners.set(`${input.id}:${name}`, fn); },
      focus() { input.focused = true; }
    };
    return input;
  };
  const insurance = makeInput();
  insurance.id = 'insurance-collections';
  const patient = makeInput();
  patient.id = 'patient-collections';
  const makeOutput = () => ({ value: '', textContent: '', focused: false, focus() { this.focused = true; } });
  const outputs = {
    '#calculated-total-collections': makeOutput(),
    '#calculated-monthly-fee': makeOutput(),
    '#calculated-annual-fee': makeOutput(),
    '#calculated-remaining-collections': makeOutput()
  };
  const status = {
    textContent: '',
    classList: {
      add(name) { classNames.add(name); },
      remove(name) { classNames.delete(name); }
    }
  };
  const reset = { addEventListener(name, fn) { listeners.set(`reset:${name}`, fn); } };
  const form = {
    querySelector(selector) {
      if (selector === '#insurance-collections') return insurance;
      if (selector === '#patient-collections') return patient;
      if (selector === '#calculator-status') return status;
      if (selector === '[data-calculator-reset]') return reset;
      return outputs[selector] || null;
    },
    querySelectorAll() { return []; },
    addEventListener(name, fn) { listeners.set(`form:${name}`, fn); }
  };
  const document = { querySelector: (selector) => selector === '[data-billing-cost-form]' ? form : null };
  const context = vm.createContext({ document, Intl, Number, Object, String, console });
  vm.runInContext(read('assets/billing-cost-calculator.js'), context, { filename: 'assets/billing-cost-calculator.js' });
  return {
    insurance,
    patient,
    outputs,
    status,
    attributes,
    classNames,
    submit() { listeners.get('form:submit')({ preventDefault() {} }); },
    reset() { listeners.get('reset:click')(); }
  };
}

try {
  const privacyOutput = run('node', ['scripts/public-tree-privacy-check.mjs']);
  assert(privacyOutput.includes('PASS'), 'tracked public tree privacy guard passes');

  run('node', ['--check', 'assets/analytics.js']);
  run('node', ['--check', 'assets/modern-warm-site.js']);
  run('node', ['--check', 'assets/billing-cost-calculator.js']);
  run('node', ['--check', 'scripts/monthly-search-console-content-review.mjs']);
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
    'resources/pmhnp-billing-cost-calculator.html': 'https://pmhnpbilling.com/resources/pmhnp-billing-cost-calculator.html',
    'resources/pmhnp-practice-launch-readiness-checklist.html': 'https://pmhnpbilling.com/resources/pmhnp-practice-launch-readiness-checklist.html',
    'blog/starting-private-practice-pmhnp-billing-roadmap.html': 'https://pmhnpbilling.com/blog/starting-private-practice-pmhnp-billing-roadmap.html',
    'blog/pmhnp-billing-90791-90792-em-psychotherapy-add-on-coding-guide-2026.html': 'https://pmhnpbilling.com/blog/pmhnp-billing-90791-90792-em-psychotherapy-add-on-coding-guide-2026.html',
    'blog/pmhnp-billing-psychiatric-cpt-coding-matrix-documentation-audit-checklist-2026.html': 'https://pmhnpbilling.com/blog/pmhnp-billing-psychiatric-cpt-coding-matrix-documentation-audit-checklist-2026.html'
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
    'resources/pmhnp-billing-cost-calculator.html',
    'resources/pmhnp-practice-launch-readiness-checklist.html'
  ].includes(page.rel));
  sharedShellPages.forEach((page) => {
    assert(/<nav[^>]+aria-label=["']Primary navigation["'][^>]*>[\s\S]*?<div class=["']nav-inner["']>[\s\S]*?<ul class=["']nav-links["']>/i.test(page.html), `shared navigation shell is structurally compatible: ${page.rel}`);
    assert(!/<div class=["']nav-links["']>/i.test(page.html), `navigation links use semantic list rather than unstyled div: ${page.rel}`);
    assert(page.html.includes('/assets/modern-warm-site.js?v=20261019responsive'), `mobile navigation controller is loaded: ${page.rel}`);
    assert(page.html.includes('/assets/modern-warm-site.css?v=20261019responsive'), `navigation CSS cache version is current: ${page.rel}`);
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

  const calculator = pages.find((page) => page.rel === 'resources/pmhnp-billing-cost-calculator.html');
  const calculatorJs = read('assets/billing-cost-calculator.js');
  const calculatorCss = read('assets/billing-cost-calculator.css');
  assert(/<form[^>]+data-billing-cost-form[^>]+method=["']get["'][^>]*>/i.test(calculator.html), 'calculator has a semantic form and Enter-key submit path');
  assert(/<button[^>]+type=["']submit["'][^>]+data-calculator-calculate/i.test(calculator.html), 'calculator primary action is a submit button');
  assert((calculator.html.match(/aria-live=/g) || []).length === 1 && /id=["']calculator-status["'][^>]+role=["']status["'][^>]+aria-live=["']polite["']/i.test(calculator.html), 'calculator uses one bounded live status region');
  assert(!/<div[^>]+class=["'][^"']*calculator-results[^"']*["'][^>]+aria-live=/i.test(calculator.html), 'calculator does not announce the entire results panel');
  assert((calculator.html.match(/step=["']0\.01["']/g) || []).length === 2, 'calculator inputs accept cent precision');
  assert(!/<input[^>]+name=["'](?:insurance_collections|patient_collections)["']/i.test(calculator.html), 'calculator values cannot be serialized by the fallback form navigation');
  assert((calculator.html.match(/<output[^>]+for=["']insurance-collections patient-collections["']/g) || []).length === 4, 'all calculator outputs identify their source inputs');
  assert(/<caption>Examples using the published 5% full-service billing fee<\/caption>/i.test(calculator.html) && (calculator.html.match(/<th scope=["']row["']>/g) || []).length === 3, 'example table has a caption and row headers');
  assert(calculatorCss.includes('.calculator-status--error') && calculatorCss.includes('input[aria-invalid="true"]'), 'calculator CSS exposes invalid-input feedback');
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB']) {
    assert(!calculatorJs.includes(forbidden), `calculator runtime does not use ${forbidden}`);
  }

  const calculatorRun = calculatorRuntime();
  calculatorRun.insurance.value = '20000.55';
  calculatorRun.patient.value = '5000.45';
  calculatorRun.submit();
  assert(calculatorRun.outputs['#calculated-total-collections'].textContent === '$25,001.00', 'calculator totals cent-precision collections correctly');
  assert(calculatorRun.outputs['#calculated-monthly-fee'].textContent === '$1,250.05', 'calculator applies the 5% monthly fee correctly');
  assert(calculatorRun.outputs['#calculated-annual-fee'].textContent === '$15,000.60' && calculatorRun.outputs['#calculated-remaining-collections'].textContent === '$23,750.95', 'calculator annual and remaining estimates are correct');
  calculatorRun.insurance.value = '-1';
  calculatorRun.submit();
  assert(calculatorRun.outputs['#calculated-monthly-fee'].textContent === '$0.00' && /positive dollar amount/i.test(calculatorRun.status.textContent), 'invalid input clears stale results and shows a visible error');
  assert(calculatorRun.attributes.get('insurance-collections:aria-invalid') === 'true' && calculatorRun.classNames.has('calculator-status--error'), 'invalid input exposes accessible error state');

  const calculatorGraph = calculator.jsonLd.flatMap((block) => block['@graph'] || [block]);
  const calculatorFaq = calculatorGraph.find((entry) => entry['@type'] === 'FAQPage');
  const schemaFaqNames = (calculatorFaq?.mainEntity || []).map((entry) => entry.name);
  const visibleFaqNames = matches(calculator.html, /<details><summary>([^<]+)<\/summary>/g).map((match) => match[1]);
  assert(JSON.stringify(schemaFaqNames) === JSON.stringify(visibleFaqNames), 'calculator FAQ schema matches the visible FAQ exactly');
  assert(calculator.html.includes('<a href="/#contact">Contact</a>') && read('services/pmhnp-billing-services.html').includes('<a href="/#contact">Contact</a>'), 'calculator and billing-service footers retain Contact');

  const coding = pages.find((page) => page.rel === 'blog/pmhnp-billing-90791-90792-em-psychotherapy-add-on-coding-guide-2026.html');
  const matrix = pages.find((page) => page.rel === 'blog/pmhnp-billing-psychiatric-cpt-coding-matrix-documentation-audit-checklist-2026.html');
  assert(coding.html.includes('"dateModified": "2026-10-20"') && coding.html.includes('id="90791-description"') && coding.html.includes('id="psychotherapy-add-ons"'), '90791/90792 guide has current metadata and intent-aligned direct navigation');
  const codingFaqSection = (coding.html.match(/<h2 id="coding-faq">[\s\S]*?<h2>Related reads<\/h2>/) || [])[0] || '';
  const codingVisibleFaqNames = matches(codingFaqSection, /<h3>([^<]+)<\/h3>/g).map((match) => match[1]);
  const codingFaq = coding.jsonLd.find((entry) => entry['@type'] === 'FAQPage');
  const codingSchemaFaqNames = (codingFaq?.mainEntity || []).map((entry) => entry.name);
  assert(JSON.stringify(codingSchemaFaqNames) === JSON.stringify(codingVisibleFaqNames), '90791/90792 FAQ schema matches visible direct answers');
  assert(matrix.html.includes('"dateModified": "2026-10-20"') && matrix.html.includes('id="psychiatric-cpt-matrix"') && matrix.html.includes('psychiatric billing codes'), 'psychiatric coding matrix has current metadata and measured-intent wording');

  const blogIndex = read('blog/index.html');
  const intentMap = read('content-strategy/commercial-intent-map.md');
  const performance = read('content-strategy/blog-performance.md');
  assert(index.includes('/resources/pmhnp-billing-cost-calculator.html') && read('services/pmhnp-billing-services.html').includes('/resources/pmhnp-billing-cost-calculator.html') && blogIndex.includes('/resources/pmhnp-billing-cost-calculator.html'), 'calculator is linked from homepage, service, and blog discovery surfaces');
  assert(intentMap.includes('| PMHNP billing cost / 5% fee calculator |') && intentMap.includes('proposal-only'), 'commercial-intent map owns the calculator and preserves the no-publish boundary');
  assert(performance.includes('2026-10-20 Search Console intent checkpoint') && performance.includes('23 impressions'), 'content strategy records the measured coding intent and refresh decision');

  const monthlyScript = read('scripts/monthly-search-console-content-review.mjs');
  const monthlyContract = read('content-strategy/monthly-search-console-review.md');
  assert(monthlyContract.includes('proposal only') && monthlyContract.includes('does not edit site files, create commits, push, deploy, submit IndexNow, or publish content'), 'monthly review contract forbids unattended publication');
  assert(!monthlyScript.includes("node:child_process") && !monthlyScript.includes('fetch(') && !monthlyScript.includes('http.request') && !monthlyScript.includes('https.request'), 'monthly review consumes existing evidence without its own network or command path');
  const monthlyDryRun = JSON.parse(run('node', ['scripts/monthly-search-console-content-review.mjs', '--dry-run']));
  assert(monthlyDryRun.reviewMode === 'read_only_proposal_only' && monthlyDryRun.publicationAllowed === false && monthlyDryRun.siteMutationPerformed === false, 'monthly review is mechanically proposal-only');
  assert(monthlyDryRun.proposal && !monthlyDryRun.proposals && fs.existsSync(path.join(repo, monthlyDryRun.proposal.targetPath)), 'monthly review emits exactly one proposal mapped to an existing owner');

  const sitemap = read('sitemap.xml');
  const sitemapUrls = matches(sitemap, /<loc>([^<]+)<\/loc>/g).map((m) => m[1]);
  assert(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap contains no duplicate URLs');
  for (const url of [expectedPages['services/pmhnp-practice-launch-support.html'], expectedPages['resources/pmhnp-practice-launch-readiness-checklist.html'], expectedPages['resources/pmhnp-billing-cost-calculator.html']]) {
    assert(sitemapUrls.filter((entry) => entry === url).length === 1, `sitemap contains new page exactly once: ${url}`);
  }
  for (const rel of ['blog/pmhnp-billing-90791-90792-em-psychotherapy-add-on-coding-guide-2026.html', 'blog/pmhnp-billing-psychiatric-cpt-coding-matrix-documentation-audit-checklist-2026.html']) {
    const url = expectedPages[rel];
    assert(new RegExp(`<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>\\s*<lastmod>2026-10-20<\\/lastmod>`).test(sitemap), `sitemap records refreshed lastmod: ${rel}`);
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
