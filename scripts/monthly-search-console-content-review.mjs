#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(scriptDir, '..');
const workspace = '/root/clawd';
const statePath = path.join(workspace, 'state/pmhnp-seo-monitor.json');
const latestSummaryPath = path.join(workspace, 'artifacts/pmhnp-seo-monitoring/latest-summary.json');
const reportRoot = path.join(workspace, 'artifacts/pmhnp-seo-content-review/monthly');
const dryRun = process.argv.includes('--dry-run');
const externalPattern = /---\n([\s\S]*?)\n<<<END_EXTERNAL_UNTRUSTED_CONTENT/;

const clusters = [
  {
    id: 'coding-90791-90792',
    pattern: /\b(?:90791|90792|90833|90836|90838)\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'blog/pmhnp-billing-90791-90792-em-psychotherapy-add-on-coding-guide-2026.html',
    owner: '90791/90792 and psychotherapy add-on guide',
    recommendation: 'Refresh the existing 90791/90792 guide around the strongest measured direct-answer intent without creating a competing coding page.'
  },
  {
    id: 'psychiatric-cpt-matrix',
    pattern: /\b(?:psychiatr(?:ic|y)\s+(?:billing\s+)?codes?|psychiatr(?:ic|y)\s+cpt|pmhnp\s+cpt)\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'blog/pmhnp-billing-psychiatric-cpt-coding-matrix-documentation-audit-checklist-2026.html',
    owner: 'psychiatric CPT coding matrix',
    recommendation: 'Refresh the existing psychiatric CPT matrix around the measured code-list and documentation intent; do not add another overlapping coding article.'
  },
  {
    id: 'billing-cost',
    pattern: /\b(?:billing\s+(?:cost|fee|price|pricing)|how\s+much.*billing|percent.*collections|5\s*%|five\s+percent)\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'resources/pmhnp-billing-cost-calculator.html',
    owner: '5% billing cost calculator',
    recommendation: 'Refresh the existing cost calculator and its service-page links around the measured pricing question; keep the established fee and scope unchanged.'
  },
  {
    id: 'credentialing',
    pattern: /\b(?:credential|enroll|caqh|pecos|npi|taxonomy|roster)\w*\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'services/pmhnp-credentialing-services.html',
    owner: 'PMHNP credentialing service page',
    recommendation: 'Refresh the existing credentialing owner and one supporting guide around the measured intent before considering a new page.'
  },
  {
    id: 'prior-authorization',
    pattern: /\b(?:prior\s+auth|authorization|retro.?auth)\w*\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'services/prior-authorization-support.html',
    owner: 'prior-authorization support page',
    recommendation: 'Refresh the existing prior-authorization owner around the measured workflow question rather than creating another overlapping service page.'
  },
  {
    id: 'telehealth',
    pattern: /\b(?:telehealth|telepsychiatry|pos\s*(?:02|10)|modifier\s*(?:93|95|gt)|audio.?only)\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'services/telehealth-billing-compliance-support.html',
    owner: 'telehealth billing support page',
    recommendation: 'Refresh the existing telehealth owner and the closest supporting guide around the measured query; retain payer-specific verification boundaries.'
  },
  {
    id: 'denials-and-claims',
    pattern: /\b(?:denial|appeal|rejection|claim|clearinghouse|timely\s+filing|co-?\d+)\w*\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'services/denial-management-appeals-pmhnp.html',
    owner: 'denial management and appeals page',
    recommendation: 'Refresh the existing denial-management owner around the strongest measured exception intent before adding another denial article.'
  },
  {
    id: 'pmhnp-billing-services',
    pattern: /\b(?:pmhnp|psychiatric|mental\s+health)\s+(?:medical\s+)?billing(?:\s+services?|\s+company|\s+provider)?\b/i,
    kind: 'refresh_existing_page',
    targetPath: 'services/pmhnp-billing-services.html',
    owner: 'full-service PMHNP billing page',
    recommendation: 'Refresh the existing full-service billing owner around the strongest measured commercial phrase; do not create a duplicate service page.'
  }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function unwrap(value) {
  const match = externalPattern.exec(String(value || ''));
  return (match ? match[1] : String(value || '')).trim().replace(/\s+/g, ' ').slice(0, 160);
}

function loadEvidence() {
  const state = readJson(statePath);
  const summary = readJson(latestSummaryPath);
  const queryPath = path.join(state.latestArtifactRoot || '', 'gsc-current-queries.json');
  if (!state.latestArtifactRoot || !fs.existsSync(queryPath)) {
    throw new Error('Latest Search Console query artifact is unavailable; no proposal was generated.');
  }
  const payload = readJson(queryPath);
  const rows = (payload.rows || [])
    .map((row) => ({
      query: unwrap((row.keys || [])[0]),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0)
    }))
    .filter((row) => row.query && row.impressions > 0 && !/^tencent\d+/i.test(row.query));
  if (!rows.length) throw new Error('Latest Search Console query artifact contains no usable rows; no proposal was generated.');
  return { state, summary, queryPath, rows };
}

function opportunity(row) {
  const positionWeight = row.position >= 4 ? Math.min(row.position, 50) / 10 : 0.2;
  const noClickWeight = row.clicks === 0 ? 1.25 : 1;
  return row.impressions * positionWeight * noClickWeight;
}

function chooseProposal(rows) {
  const candidates = clusters.map((cluster) => {
    const evidence = rows.filter((row) => cluster.pattern.test(row.query));
    return {
      ...cluster,
      evidence,
      impressions: evidence.reduce((sum, row) => sum + row.impressions, 0),
      clicks: evidence.reduce((sum, row) => sum + row.clicks, 0),
      score: evidence.reduce((sum, row) => sum + opportunity(row), 0)
    };
  }).filter((candidate) => candidate.evidence.length && fs.existsSync(path.join(repo, candidate.targetPath)));

  candidates.sort((a, b) => b.score - a.score || b.impressions - a.impressions || a.id.localeCompare(b.id));
  if (!candidates.length) throw new Error('No measured query cluster maps to a canonical content owner; no proposal was generated.');
  const selected = candidates[0];
  const evidenceQueries = [...selected.evidence]
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, 8);
  return {
    clusterId: selected.id,
    kind: selected.kind,
    targetPath: selected.targetPath,
    contentOwner: selected.owner,
    recommendation: selected.recommendation,
    clusterImpressions: selected.impressions,
    clusterClicks: selected.clicks,
    evidenceQueries,
    requiredChecksBeforeAnyFuturePublication: [
      'Inspect the complete current page and content-owner map.',
      'Verify every new material coding, payer, platform, pricing, compliance, or workflow claim against current authoritative sources.',
      'Run the PMHNP no-PHI response preflight and the focused release smoke.',
      'Require a human-approved implementation task; this review does not authorize publication.'
    ]
  };
}

function markdown(report) {
  const p = report.proposal;
  const evidence = p.evidenceQueries.map((row) => `- \`${row.query}\`: ${row.impressions} impressions, ${row.clicks} clicks, position ${row.position.toFixed(2)}`).join('\n');
  return `# Monthly PMHNP Search Console content proposal\n\nGenerated: ${report.generatedAt}\nMode: read-only, proposal-only\n\n## One proposed action\n\n- Type: ${p.kind}\n- Target: \`${p.targetPath}\`\n- Owner: ${p.contentOwner}\n- Recommendation: ${p.recommendation}\n- Cluster evidence: ${p.clusterImpressions} impressions and ${p.clusterClicks} clicks in the available window\n\n## Measured query evidence\n\n${evidence}\n\n## Required checks before any future publication\n\n${p.requiredChecksBeforeAnyFuturePublication.map((item) => `- ${item}`).join('\n')}\n\n## Truth boundary\n\n${report.truthBoundary}\n`;
}

try {
  const evidence = loadEvidence();
  const proposal = chooseProposal(evidence.rows);
  const generatedAt = new Date().toISOString();
  const report = {
    schemaVersion: 'pmhnp.monthly-search-content-proposal.v1',
    generatedAt,
    reviewMode: 'read_only_proposal_only',
    publicationAllowed: false,
    siteMutationPerformed: false,
    sourceWindow: evidence.summary.windows?.current || null,
    sourceRefs: {
      summary: latestSummaryPath,
      queries: evidence.queryPath
    },
    proposal,
    truthBoundary: 'This artifact proves one deterministic proposal from the available Search Console evidence. It does not publish content or prove ranking, indexing timing, CTR, clicks, leads, collections, payer acceptance, or reimbursement.'
  };

  if (!dryRun) {
    const month = generatedAt.slice(0, 7);
    const directory = path.join(reportRoot, month);
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const jsonPath = path.join(directory, 'proposal.json');
    const markdownPath = path.join(directory, 'proposal.md');
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    fs.writeFileSync(markdownPath, markdown(report), { mode: 0o600 });
    fs.mkdirSync(reportRoot, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(reportRoot, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    console.log(`Monthly PMHNP SEO proposal: ${proposal.kind} ${proposal.targetPath}`);
    console.log(`Evidence: ${proposal.clusterImpressions} impressions, ${proposal.clusterClicks} clicks in ${proposal.clusterId}.`);
    console.log(`Report: ${markdownPath}`);
    console.log('No site files were changed and nothing was published.');
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
} catch (error) {
  console.error(`monthly-search-console-content-review: BLOCKED ${error.message}`);
  process.exit(2);
}
