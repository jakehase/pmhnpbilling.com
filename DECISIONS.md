# PMHNPBilling.com 30-Day Acquisition Release Decisions

Append-only durable decisions for this release.

## Decisions

## 2026-08-10 — Extend the existing acquisition stack

- Decision: Extend the existing Formspree form, attribution script, GA4 stream, service CTAs, and private correspondence ledgers instead of adding a CRM or parallel tracker.
- Reason: The prior-art gate found high-confidence existing capability; a second stack would split submission truth and increase privacy risk.
- Evidence: Restricted prior-art artifact under `clients/pmhnp-billing/acquisition/artifacts/2026-08-10-launch/`.
- Supersedes: Any proposal for a new public prospect database.
- Follow-up: Implement a minimal private aggregate operations template that references canonical correspondence ledgers.

## 2026-08-10 — Remove legacy operational files from the current public tree

- Decision: Preserve an owner-only local archive, then remove the legacy dashboard and outreach dataset from the deployed website tree.
- Reason: The repository is public and GitHub Pages serves these paths; `robots.txt` and `.htaccess` are not access controls there.
- Evidence: Pre-release live HTTP checks returned the deployed files successfully.
- Supersedes: Treating `private-dashboard/` as private because of its name or crawler directives.
- Follow-up: Add a tracked-tree privacy guard and verify the old live paths after publication.

## 2026-08-10 — Do not rewrite Git history in this release

- Decision: Remediate the current deployment and prevent recurrence, but do not rewrite branches/tags/history without separate explicit approval.
- Reason: History rewriting is destructive and has a separate approval and recovery boundary.
- Evidence: User-approved scope authorizes publishing the acquisition package but explicitly excludes unapproved history rewriting.
- Supersedes: n/a
- Follow-up: Record any residual historical-cache risk without overstating removal.

## 2026-08-10 — Count only accepted prospect submissions as GA4 leads

- Decision: Track attempts separately; emit `generate_lead` only after Formspree acceptance and only for `submission_type=prospect`. Controlled tests use a different event.
- Reason: Attempts, failures, and tests must not inflate lead counts.
- Evidence: Existing JavaScript currently distinguishes success late in the flow but emits a submit event before acceptance; the release will correct that boundary.
- Supersedes: Treating a pre-acceptance submit event or thank-you visit alone as a verified lead.
- Follow-up: Verify mechanics in the focused release smoke and reconcile future counts against Formspree notifications.

## 2026-08-10 — Preserve clinical and compliance scope boundaries in acquisition copy

- Decision: Explain biller-owned operations clearly while leaving clinical code/diagnosis selection with the rendering provider and avoiding payer/timeline/payment guarantees.
- Reason: Commercial clarity must not create an inaccurate clinical, enrollment, or reimbursement promise.
- Evidence: Standing PMHNP Billing real-biller scope and correspondence rules.
- Supersedes: Generic copy that either over-audits every clean claim or implies the biller selects unsupported clinical codes.
- Follow-up: Include these boundaries on the revised commercial and practice-launch pages.

## 2026-08-11 — Ship active privacy remediation before the acquisition release

- Decision: Publish the current-tree operational-data removal as hotfix `7bda29b`, then publish the reviewed acquisition release separately.
- Reason: The exposed URLs were returning HTTP 200 and should not wait behind commercial page work.
- Evidence: The hotfix is on `origin/main`; live checks at 2026-08-11T00:17:18-05:00 returned HTTP 404 for `/private-dashboard/` and `/outreach-log.json`.
- Supersedes: The original single-commit publication sequence.
- Follow-up: Keep both commits in the release evidence and do not imply that Git history or third-party caches were erased.

## 2026-08-11 — Use a simulated acceptance smoke instead of a real Formspree test

- Decision: Validate prospect/test event semantics with the focused local runtime harness and do not transmit a test submission to Formspree during release qualification.
- Reason: This proves the public code contract without creating a notification, polluting the prospect inbox, or changing Formspree settings.
- Evidence: The focused smoke exercises accepted prospect, accepted test, unclassified success, direct thank-you, one-time consumption, and attribution initialization branches.
- Supersedes: Any assumption that a production Formspree write is required for the mechanical release gate.
- Follow-up: Reconcile the first naturally accepted prospect submission by `lead_id`; controlled future tests must use `lead_test=1` and remain excluded from `generate_lead`.

## 2026-08-11 — Close the release at mechanical deployment truth

- Decision: Mark the production slice complete after release commit `7b3f890`, the 91-check focused smoke, and the 12-surface live verification passed.
- Reason: The approved implementation and publication contract is satisfied; acquisition efficacy requires later observation rather than more release scope.
- Evidence: Restricted `focused-release-smoke.json`, `live-release-verification.json`, and `release-baseline.json` under the acquisition evidence root.
- Supersedes: Release-candidate status.
- Follow-up: Measure on 2026-08-18, 2026-08-25, and 2026-09-10 without converting operating targets into forecasts or retroactive success claims.
## 2026-10-19 — Close responsive hardening at the declared phone/tablet contract

- Decision: Use shared responsive CSS/JavaScript and cache-busted public templates, then close the addendum after one route-by-breakpoint acceptance contract and live Pages verification.
- Reason: The confirmed defects were shared navigation, touch-target, form/search sizing, menu-state, and footer issues; a parallel mobile site or desktop redesign would add unnecessary divergence.
- Evidence: Product commit `473e0958ce4a83f0fdc5b7c8b244bff48aaaca5a`; acceptance report `/root/clawd/artifacts/pmhnp-responsive-20261019/final-smoke/report.json` (396/396, zero failures/warnings); Pages run `39315979078`; post-deploy live homepage and versioned CSS retrieval.
- Supersedes: Responsive-hardening release-candidate state.
- Follow-up: Treat future device-specific reports as bounded defects; do not claim universal browser/device perfection from this smoke.

## 2026-10-19 — Separate technical SEO health from search-performance outcomes

- Decision: Close the technical SEO addendum after complete sitemap/source validation, successful Pages/IndexNow publication, and live retrieval; keep the current click/CTR decline as an active monitoring signal rather than mislabeling it as a crawl failure.
- Reason: Search Console, robots, sitemap, 60/60 live URLs, and source-level SEO gates are healthy, while current clicks, impressions, and CTR declined despite improved average position.
- Changes: Added missing Open Graph/Twitter images to four indexable service/resource pages, added Article images to the launch-readiness resource, and refreshed the four sitemap `lastmod` values.
- Evidence: Product commit `88e13db22caed4ecb7ae5cbd6ccce74be4279d09`; SEO smoke `/root/clawd/artifacts/pmhnp-seo-check-20261019/report.json` (60 pages, 1,321 internal references, zero failures/warnings); Pages `39363568892`; IndexNow `39363569090`; privacy guard `39363569086`.
- Truth boundary: This proves current technical/on-page delivery for the audited scope, not guaranteed rankings, indexing of every URL, future clicks, or lead volume.
