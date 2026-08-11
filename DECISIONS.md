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