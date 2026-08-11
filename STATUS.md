# PMHNPBilling.com 30-Day Acquisition Release Status

## Metadata

- Project slug: `pmhnpbilling-acquisition-2026-08`
- Canonical plan: `/root/clawd/pmhnpbilling-site/plan.md`
- Decisions log: `/root/clawd/pmhnpbilling-site/DECISIONS.md`
- Last updated: 2026-08-11
- Status: release_candidate
- Current fidelity: production_slice

## Current checkpoint

- Privacy hotfix commit `7bda29bf0b6cc7254972a10bd8fea42314a385ce` is on `origin/main`.
- Live verification at 2026-08-11T00:17:18-05:00 returned HTTP 404 for both `/private-dashboard/` and `/outreach-log.json`.
- The restricted archive remains under the private acquisition root with owner-only permissions; no history rewrite was performed.
- Success-only attribution, explicit prospect/test classification, commercial page revisions, practice-launch service, launch-readiness worksheet, internal links, schema, and sitemap changes are implemented in the release worktree.
- Restricted private lead operations, response drafts, and the 30-day measurement cadence exist outside the public repository with owner-only permissions.
- Focused acquisition smoke is green: 91 mechanical checks across six release surfaces. The smoke did not transmit a Formspree submission.
- Plan Doctor reports zero plan errors. Its strict command still exits nonzero because of pre-existing workspace-wide unindexed-plan warnings outside this release.

## Active blockers

- None for publication.
- Historical Git copies and third-party caches remain outside the approved current-tree remediation scope.

## Remaining release actions

1. Inspect and commit the exact acquisition diff.
2. Push `main` and verify the remote commit.
3. Verify the versioned live assets, two new pages, revised commercial pages, attribution marker, sitemap, and continued 404 removal state.
4. Record the final release commit and baseline evidence.

## Do not use / superseded

- `private-dashboard/` and `outreach-log.json` — removed legacy public-tree operational artifacts; not a private system.
- `.htaccess` inside GitHub Pages content — not an access control on GitHub Pages.
- Pre-release GA4 `generate_lead` events — not accepted-submission truth under the new contract.

## Truth boundary

Allowed now:

- The current public deployment no longer serves the two verified operational-data URLs, and the acquisition release candidate passed its focused mechanical smoke.

Not allowed yet:

- The acquisition release is not claimed live until its exact public commit and selected production surfaces are verified.
- No traffic, ranking, lead-volume, qualification, or conversion improvement has been demonstrated.
