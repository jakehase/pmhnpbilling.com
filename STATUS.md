# PMHNPBilling.com 30-Day Acquisition Release Status

## Metadata

- Project slug: `pmhnpbilling-acquisition-2026-08`
- Canonical plan: `/root/clawd/pmhnpbilling-site/plan.md`
- Decisions log: `/root/clawd/pmhnpbilling-site/DECISIONS.md`
- Last updated: 2026-10-19
- Status: complete — SEO technical health verified and metadata gaps deployed (responsive and 2026-08 acquisition releases remain complete)
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

## Responsive-hardening evidence (2026-10-19)

- Baseline browser audit: 66 routes × 6 phone/tablet viewports; 29 failing route/viewport checks identified.
- Implemented shared fixes for touch targets, phone form/search sizing, portrait-tablet navigation, menu state/scroll locking, conversion controls, footer links, and cache-busting.
- Focused acceptance smoke: PASS, 396/396 route/viewport checks, zero failures and zero warnings.
- Representative homepage, service, blog, article, resource, and legal screenshots were inspected at phone and tablet widths.
- Evidence root: `/root/clawd/artifacts/pmhnp-responsive-20261019/`; acceptance report: `final-smoke/report.json`.
- Product release commit: `473e0958ce4a83f0fdc5b7c8b244bff48aaaca5a`, pushed to `origin/main`.
- GitHub Pages deployment run `39315979078` completed successfully.
- The live homepage and versioned responsive CSS were retrieved after deployment and contained the new responsive release markers and rules.

## SEO health checkpoint (2026-10-19)

- Fresh read-only Search Console window: 25 clicks, 1,585 impressions, 1.58% CTR, and weighted average position 8.86 for 2026-09-19 through 2026-10-16.
- Search Console is functioning and downloaded the sitemap on 2026-10-19; submitted/live sitemap count is 60.
- Live monitor: homepage, robots, sitemap, and 60/60 sitemap URLs healthy; no crawl errors reported by the monitor.
- Performance attention: clicks fell 39.0%, impressions 15.6%, and CTR 27.7% versus the preceding 28 days, while weighted average position improved from 12.45 to 8.86. This is a traffic/CTR issue, not evidence of a crawl outage.
- Fixed missing Open Graph/Twitter images on four indexable service/resource pages and refreshed their sitemap `lastmod` dates.
- Focused source smoke: PASS, 60/60 sitemap pages, 1,321 internal references, zero failures or warnings. Evidence: `/root/clawd/artifacts/pmhnp-seo-check-20261019/`.
- Product release commit: `88e13db22caed4ecb7ae5cbd6ccce74be4279d09` on `origin/main`.
- GitHub Pages run `39363568892`, IndexNow run `39363569090`, and public-tree privacy run `39363569086` completed successfully.
- Live post-deploy retrieval confirmed the affected service page and the sitemap with all four refreshed `2026-10-19` entries.

## Active blockers

- None. The SEO metadata addendum stop condition is reached. Search-performance monitoring remains active because clicks/CTR declined in the current 28-day window.

## Measurement cadence

- Day 7: 2026-08-18 — submission/event reconciliation and indexing visibility.
- Day 14: 2026-08-25 — early source, landing, attribution, qualification, and response-SLA evidence.
- Day 30: 2026-09-10 — bounded inquiry, qualification, call, proposal/engagement, and attribution review.

## Truth boundary

Allowed claim:

- The current-tree privacy remediation and approved acquisition package are deployed and mechanically verified.
- The responsive hardening release is deployed. Its declared 66-route, six-viewport mechanical contract passed locally, and the live homepage/versioned responsive asset were verified after the successful Pages deployment.
- Technical SEO delivery and Search Console connectivity are healthy. Search traffic is under performance attention; rankings and future clicks are not guaranteed by source-level validation.

Not allowed:

- This release does not prove that historical Git copies, third-party caches, forks, or clones were erased.
- Publication does not prove indexing, ranking, traffic growth, lead lift, qualification, conversion improvement, or achievement of the 30-day operating targets.
