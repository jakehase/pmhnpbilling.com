#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

const exactForbidden = new Set([
  'outreach-log.json',
  'dual-notification-system.js',
  'dynamic-task-system.js',
  'pmhnp-email-monitor.js',
  'pmhnp-email-webhook-system.js'
]);

const forbiddenBasenames = new Set([
  '.htpasswd',
  'prospects.json',
  'current-tasks.json',
  'live-alerts.json',
  'outreach.json'
]);

const forbiddenPathFragments = [
  'private-dashboard/',
  'clients/',
  'attachments/',
  'tasks/'
];

const pathFailures = tracked.filter((file) => {
  const normalized = file.replaceAll('\\', '/').toLowerCase();
  const basename = path.posix.basename(normalized);
  return exactForbidden.has(normalized)
    || forbiddenBasenames.has(basename)
    || forbiddenPathFragments.some((fragment) => normalized.startsWith(fragment))
    || normalized.includes('lead-database')
    || normalized.includes('prospect-research');
});

// Markers are assembled so the guard does not match its own source text.
const privateRecordMarkers = [
  ['prospect', 'Url'].join(''),
  ['contact', 'Email'].join(''),
  ['hot', 'Prospects'].join(''),
  ['PMHNP', '_LEAD_', 'DATABASE'].join(''),
  ['Lead Score', ':'].join(''),
  ['Hot Score', ':'].join('')
];

const contentFailures = [];
for (const file of tracked) {
  const absolute = path.join(root, file);
  let size;
  try {
    size = statSync(absolute).size;
  } catch {
    continue;
  }
  if (size > 2_000_000) continue;
  let text;
  try {
    text = readFileSync(absolute, 'utf8');
  } catch {
    continue;
  }
  const matched = privateRecordMarkers.filter((marker) => text.includes(marker));
  if (matched.length) contentFailures.push({ file, matched });
}

if (pathFailures.length || contentFailures.length) {
  console.error('public-tree-privacy-check: FAIL');
  for (const file of pathFailures) console.error(`forbidden path: ${file}`);
  for (const failure of contentFailures) {
    console.error(`private-record marker in ${failure.file}: ${failure.matched.join(', ')}`);
  }
  process.exit(1);
}

console.log(`public-tree-privacy-check: PASS tracked=${tracked.length}`);
console.log('truth-boundary: current tracked tree only; Git history and third-party caches are not scanned');
