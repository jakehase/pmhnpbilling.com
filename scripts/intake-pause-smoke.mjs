#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = process.env.INTAKE_PAUSE_ARTIFACT_ROOT || '/root/clawd/artifacts/pmhnp-intake-pause-20261103';
const checks = [];
const failures = [];

function check(name, condition, detail = '') {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walkHtml(dir, relative = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'mockups') continue;
    const absolute = path.join(dir, entry.name);
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(absolute, nextRelative));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(nextRelative);
  }
  return out;
}

const index = read('index.html');
const thankYou = read('thank-you.html');
const analytics = read('assets/analytics.js');
const script = read('script.js');
const htmlFiles = walkHtml(root);
const publicHtml = htmlFiles.map((file) => ({ file, text: read(file) }));
const stalePhrases = [
  'Request a billing-fit review',
  'No-pressure fit review',
  'respond within one business day',
  'New PMHNP Billing website inquiry'
];
const staleHits = [];
for (const { file, text } of publicHtml) {
  for (const phrase of stalePhrases) {
    if (text.includes(phrase)) staleHits.push({ file, phrase });
  }
}

check('all active public intake CTAs remove stale fit-review promises', staleHits.length === 0, JSON.stringify(staleHits));
check('site-wide availability CTA is present', publicHtml.filter(({ text }) => text.includes('View current availability')).length >= 50);
check('homepage shows at-capacity notice', index.includes('PMHNP Billing is not accepting additional clients'));
check('homepage preserves current-client boundary', index.includes('Existing client work and previously accepted engagements continue'));
check('homepage does not promise reopening date', index.includes('does not reserve a place or guarantee a reopening date'));
check('form keeps canonical Formspree endpoint', index.includes('action="https://formspree.io/f/xkorlzor"') && index.includes('method="POST"'));
check('form keeps required email recipient field', /name="email"[^>]*required/.test(index));
check('form is minimized to business contact fields', !/name="phone"/.test(index) && !/name="services"/.test(index) && !/name="message"/.test(index));
check('form preserves no-PHI warning', index.includes('Please do not include patient information or protected health information'));
check('form classifies availability requests', index.includes('name="submission_type" value="availability_request"'));
check('form uses availability subject and button', index.includes('PMHNP Billing availability request') && index.includes('Send availability request'));
check('thank-you page states capacity pause', thankYou.includes('not accepting additional clients or scheduling new-client consultations'));
check('thank-you page removes response-time promise', !thankYou.includes('one business day'));
check('analytics preserves declared submission type', analytics.includes("var declaredType = clean((form.querySelector('[name=\"submission_type\"]') || {}).value || 'prospect', 20);"));
check('controlled tests still override declared type', analytics.includes("params.get('lead_test') === '1' ? 'test' : declaredType"));
check('availability requests do not emit generate_lead', analytics.includes("success.submission_type === 'availability_request'") && analytics.includes("availability_request_success"));
check('form status uses availability wording', script.includes('Sending your availability request…') && script.includes("submitButton.textContent = 'Send availability request'"));

for (const relativePath of ['script.js', 'assets/analytics.js', 'scripts/intake-pause-smoke.mjs']) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, relativePath)], { stdio: 'pipe' });
    check(`JavaScript syntax: ${relativePath}`, true);
  } catch (error) {
    check(`JavaScript syntax: ${relativePath}`, false, String(error.stderr || error.message));
  }
}

try {
  execFileSync('git', ['diff', '--check'], { cwd: root, stdio: 'pipe' });
  check('git diff --check', true);
} catch (error) {
  check('git diff --check', false, String(error.stdout || error.stderr || error.message));
}

const result = {
  schemaVersion: 'pmhnp.intake-pause-smoke.v1',
  passed: failures.length === 0,
  checksPassed: checks.filter((item) => item.passed).length,
  checksTotal: checks.length,
  publicHtmlFiles: publicHtml.length,
  availabilityCtaPages: publicHtml.filter(({ text }) => text.includes('View current availability')).length,
  formspreeEndpoint: 'xkorlzor',
  submissionType: 'availability_request',
  formspreeAutoresponseConfigured: false,
  truthBoundary: 'This smoke proves local website intake-pause mechanics only. It does not prove deployment or Formspree autoresponse delivery.',
  checks,
  failures
};
fs.mkdirSync(artifactRoot, { recursive: true });
fs.writeFileSync(path.join(artifactRoot, 'smoke.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ passed: result.passed, checksPassed: result.checksPassed, checksTotal: result.checksTotal, artifact: path.join(artifactRoot, 'smoke.json') }));
if (!result.passed) process.exit(1);
