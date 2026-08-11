# PMHNPBilling.com 30-Day Acquisition Release Status

## Metadata

- Project slug: `pmhnpbilling-acquisition-2026-08`
- Canonical plan: `/root/clawd/pmhnpbilling-site/plan.md`
- Decisions log: `/root/clawd/pmhnpbilling-site/DECISIONS.md`
- Last updated: 2026-08-11
- Status: complete
- Current fidelity: production_slice

## Released state

- Privacy hotfix: `7bda29bf0b6cc7254972a10bd8fea42314a385ce`.
- Acquisition release: `7b3f8909bdf95b0719c4cd3a8a630bfdd967371f`.
- Both commits were pushed to `origin/main`.
- GitHub Pages release marker was observed at 2026-08-11T00:34:27-05:00.
- Selected live HTTP verification passed at 2026-08-11T05:35:32Z against the exact acquisition release commit.

## What shipped

- Removed the legacy public operational dashboard, outreach dataset, task notes, and obsolete notification/email scripts from the current public tree.
- Added a tracked-tree privacy guard and GitHub Actions check.
- Added privacy-safe attribution version `2026-08-v2` with random lead IDs, timestamp, source/topic/campaign fields, sanitized landing/referrer data, and explicit prospect/test classification.
- Separated submit attempts, accepted submissions, failures, controlled tests, unclassified legacy success, and accepted prospect `generate_lead` events.
- Preserved the Formspree endpoint `https://formspree.io/f/xkorlzor`; no Formspree settings were changed and no release-test submission was sent.
- Rebuilt the full-service billing and credentialing commercial pages with real-biller ownership, pricing, clinical boundaries, and payer milestone clarity.
- Published PMHNP practice-launch support and an ungated launch-readiness worksheet.
- Added homepage/article links, metadata, parseable JSON-LD, privacy disclosure updates, and sitemap entries.
- Created owner-only private lead operations, response drafts, and day-7/day-14/day-30 measurement instructions outside the public repository.

## Evidence

- Focused smoke: PASS, 91 checks across six release surfaces, exact repo head `7b3f8909bdf95b0719c4cd3a8a630bfdd967371f`.
- Live verification: PASS, 12 selected checks including the homepage, revised/new pages, scripts, thank-you flow, sitemap, privacy notice, and two removed URLs.
- Removed live URLs: `/private-dashboard/` and `/outreach-log.json` both return HTTP 404.
- Restricted archive: 23 files checksum-verified; archive and files are owner-only.
- Plan Doctor: zero plan errors. Its strict command retains unrelated workspace-wide unindexed-plan warnings.
- A managed visual-browser session was unavailable; live HTTP status, exact release markers, content markers, schema parsing, and local-reference checks were used instead.

Restricted evidence root:

```text
/root/clawd/clients/pmhnp-billing/acquisition/artifacts/2026-08-10-launch
```

## Active blockers

- None for this release.

## Measurement cadence

- Day 7: 2026-08-18 — submission/event reconciliation and indexing visibility.
- Day 14: 2026-08-25 — early source, landing, attribution, qualification, and response-SLA evidence.
- Day 30: 2026-09-10 — bounded inquiry, qualification, call, proposal/engagement, and attribution review.

## Truth boundary

Allowed claim:

- The current-tree privacy remediation and approved acquisition package are deployed and mechanically verified.

Not allowed:

- This release does not prove that historical Git copies, third-party caches, forks, or clones were erased.
- Publication does not prove indexing, ranking, traffic growth, lead lift, qualification, conversion improvement, or achievement of the 30-day operating targets.
