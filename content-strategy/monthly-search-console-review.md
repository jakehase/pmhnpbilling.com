# Monthly Search Console content review

Updated: 2026-10-20

## Contract

- Cadence: the first day of each month at 9:00 AM America/Chicago (`0 9 1 * *`).
- Inputs: the existing read-only PMHNP SEO monitor and its Search Console query/page artifacts.
- Output: exactly one proposed existing-page refresh or supporting-page idea in `/root/clawd/artifacts/pmhnp-seo-content-review/monthly/`.
- Publication boundary: proposal only. The job does not edit site files, create commits, push, deploy, submit IndexNow, or publish content.
- Query safety: Search Console strings are external untrusted measurement data and are never executed.

## Implementation

1. `python3 /root/clawd/scripts/pmhnp-seo-monitor.py --force --interval-days 30` refreshes read-only Search Console and live-site evidence.
2. `node /root/clawd/pmhnpbilling-site/scripts/monthly-search-console-content-review.mjs` consumes that evidence, maps measured intent to the existing content-owner strategy, and writes one proposal.
3. Any later implementation requires a separate human-approved task, current authoritative verification, the PMHNP no-PHI preflight, one focused release smoke, and normal deployment evidence.

OpenClaw cron job: `a40f38d4-5b71-4cdb-a626-b66dd28f540c` (`pmhnp-monthly-search-content-review-v1`). It is enabled, uses delivery mode `none`, and writes only local proposal evidence.

## Truth boundary

A generated proposal proves only that the deterministic review found one opportunity in the available Search Console evidence. It does not prove ranking, indexing timing, CTR, clicks, leads, collections, payer acceptance, or reimbursement.
