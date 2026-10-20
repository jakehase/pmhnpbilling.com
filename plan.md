# PMHNPBilling.com 30-Day Acquisition Release Plan

## Plan metadata

- Project slug: `pmhnpbilling-acquisition-2026-08`
- Plan owner: Jake / Cortex
- Created: 2026-08-10
- Last updated: 2026-08-11
- Status: complete
- Fidelity target: production_slice
- Primary stop condition: `release_candidate_green_then_live_release_verified_or_blocker`
- Status file: `STATUS.md`
- Decisions log: `DECISIONS.md`
- Plan index: `/root/clawd/docs/PLAN_INDEX.md`

## 1. Decision summary

Build and publish one production acquisition release in the canonical PMHNPBilling.com repository. Extend the existing Formspree, GA4, and service-page funnels; do not add a second analytics or prospect-tracking system. The release first removes legacy operational artifacts from the public deployment, then adds privacy-safe lead attribution, clearer commercial surfaces, a dedicated PMHNP practice-launch page, private lead-response templates, and a 30-day measurement contract.

This plan can prove that the release is deployed and mechanically observable. It cannot claim that the changes caused more leads until the post-release measurement window supplies evidence.

## 2. Objective and smallest end-to-end transaction

Primary objective: make a qualified visitor's path from commercial intent to a verified Formspree submission measurable without collecting PHI or counting failed/test submissions as real leads.

Smallest meaningful transaction:

1. A visitor lands on a service or practice-launch page.
2. The visitor follows a topic-tagged CTA to the existing contact form.
3. The form includes privacy-safe attribution, a unique lead ID, timestamp, and prospect/test classification.
4. Formspree accepts the submission.
5. Only successful prospect submissions emit the GA4 `generate_lead` event and reach the thank-you flow.
6. Jake reconciles the Formspree notification with the same lead ID in the private lead workflow.

## 3. Scope

In scope:

- Remove current publicly deployed legacy prospect/operational files after preserving a restricted local archive.
- Add repository guardrails preventing private operational paths and common sensitive record patterns from being recommitted.
- Extend `assets/analytics.js`, `script.js`, and the homepage contact form with privacy-safe success-based attribution.
- Strengthen the PMHNP billing and credentialing commercial pages without changing established price truth.
- Add a focused PMHNP practice-launch support page and one high-intent launch-readiness guide/worksheet.
- Add internal links and sitemap entries for the new commercial journey.
- Add restricted, non-PHI private lead-operation and response templates outside the public repository.
- Run one focused release smoke, inspect the exact diff, publish to `origin/main`, and verify the live deployment.
- Record baseline, day-7, day-14, and day-30 measurement instructions.

## 4. Non-goals

- No Formspree account, recipient, routing, or notification changes.
- No prospect email, social post, outreach message, paid ad, or other outbound campaign.
- No patient information, claim data, portal credentials, or PHI in analytics or lead templates.
- No new CRM, database, tag manager, or parallel conversion tracker.
- No clinical CPT or diagnosis selection for providers.
- No Git history rewrite without separate explicit approval.
- No promise of search ranking, payer acceptance, lead volume, client conversion, or causal lift.

## 5. Active paths and boundaries

Public implementation path:

```text
/root/clawd/pmhnpbilling-site
```

Restricted operations path:

```text
/root/clawd/clients/pmhnp-billing/acquisition
```

Evidence path:

```text
/root/clawd/clients/pmhnp-billing/acquisition/artifacts/2026-08-10-launch
```

Only the public website repository may be pushed to GitHub Pages. Lead records, response operations, archives, and measurement notes containing contact details stay under the restricted operations path.

## 6. Prior art decision

Prior-art decision: `extend_existing_or_adapter_required`.

Evidence:

```text
/root/clawd/clients/pmhnp-billing/acquisition/artifacts/2026-08-10-launch/prior-art-gate.json
```

Existing assets to extend:

- Existing Formspree endpoint and contact form.
- Existing `assets/analytics.js` attribution storage and GA4 loader.
- Existing `script.js` successful-submit flow.
- Existing service CTA topic/source parameters.
- Existing client/prospect correspondence ledgers as detailed sources of record.

Duplication guard: the aggregate private pipeline stores only operational status and source references; it does not replace canonical correspondence ledgers or create a public prospect database.

## 7. Target architecture

### Public capture layer

- Contact form fields collect ordinary business contact/scope information and retain the existing no-PHI warning.
- Hidden fields carry only `lead_id`, `submitted_at`, `submission_type`, `attribution_version`, source/topic/UTM values, landing page, and referrer.
- `lead_test=1` explicitly marks controlled validation submissions as tests.

### Success truth layer

- A submit attempt is not a lead.
- A Formspree 2xx acceptance is a successful form submission.
- `generate_lead` is emitted only after successful acceptance and only when `submission_type=prospect`.
- Controlled test success uses a distinct non-key event.
- The thank-you page receives only the privacy-safe success record.

### Private operations layer

- Formspree notifications remain the verified submission source.
- GA4 remains aggregate behavioral evidence, not the submission source of truth.
- Canonical correspondence ledgers remain the detailed history.
- A restricted aggregate pipeline supports response SLA and outcome measurement without patient data.

## 8. Surface matrix

| Surface | Primary files | Acceptance condition |
|---|---|---|
| Public privacy cleanup | legacy operational paths, `.gitignore`, deployment guard | private paths absent from current tree and live URLs no longer return their prior content |
| Attribution | `assets/analytics.js`, `script.js`, `index.html`, `thank-you.html` | success-only lead event; prospect/test separation; hidden metadata present; no PHI fields |
| Full-service billing | `services/pmhnp-billing-services.html` | pricing/scope/ownership/next step are clear and internally linked |
| Credentialing | `services/pmhnp-credentialing-services.html` | payer-enrollment boundaries and first-paid-claim handoff are clear; no timeline guarantee |
| Practice launch | new service page | launch-stage problem, sequence, deliverables, boundaries, CTA, schema, and canonical metadata present |
| High-intent resource | new guide/worksheet | useful ungated workflow, no fabricated claims, links to launch and core services |
| Discovery | homepage links, blog/service links, `sitemap.xml` | new pages discoverable and sitemap-valid |
| Private lead operations | restricted acquisition folder | no-PHI pipeline, response templates, SLA, and measurement cadence present |
| Release proof | focused smoke + live HTTP checks | local smoke green, pushed SHA observed remotely, live assets/pages match release |

## 9. Execution strategy

This is a bounded static-site release, so one local implementation owner is appropriate. No heavy remote execution or multi-agent campaign is required. Shared files are edited serially. Because the legacy operational URLs were actively public, the privacy removal shipped first as hotfix `7bda29b`; the reviewed acquisition release follows after the focused smoke passes.

## 10. Execution phases

### Phase A — Plan and privacy containment

- Preserve an owner-only archive with checksum manifest.
- Remove legacy operational data from the current public tree.
- Add a current-tree recurrence guard.

Acceptance: archive exists with restricted permissions; sensitive current-tree paths are absent.

### Phase B — Attribution and private operations

- Extend existing capture metadata.
- Correct attempt-versus-success semantics.
- Create private pipeline, response templates, and measurement instructions.

Acceptance: one focused static/runtime smoke demonstrates the contract without transmitting a real form.

### Phase C — Commercial acquisition surfaces

- Rewrite the two approved commercial pages for decision clarity.
- Add practice-launch service page and high-intent resource.
- Add internal links and sitemap entries.

Acceptance: metadata/schema/CTA/local-link checks are green.

### Phase D — Release

- Inspect diff for privacy, pricing, claim, and scope integrity.
- Commit and push approved public changes.
- Verify the pushed SHA and live publication, including removal of old operational URLs.
- Freeze the baseline and start the 30-day cadence.

Acceptance: production endpoints and assets match the release; status and evidence record the exact truth boundary.

## 11. Detailed implementation sequence

1. Freeze the pre-release commit and live endpoint observations in restricted evidence.
2. Copy the legacy operational directory and outreach dataset into an owner-only archive; generate a SHA-256 manifest; verify owner-only permissions.
3. Remove those files from the tracked public tree; add path-level ignore rules plus a focused GitHub Actions privacy guard.
4. Extend the existing analytics module with a privacy-safe lead ID, timestamp, prospect/test classification, attribution version, first landing page, and referrer.
5. Extend the existing form handler so an attempt is distinct from Formspree acceptance; emit `generate_lead` only for accepted prospect submissions; preserve a native `_next` fallback.
6. Update the thank-you flow to consume only the one-time success record and avoid re-counting refreshes.
7. Create restricted aggregate pipeline, response templates, and day-7/day-14/day-30 measurement instructions outside the public repository.
8. Strengthen full-service billing copy around exact scope, 5% pricing, direct ownership, provider-owned clinical decisions, onboarding, and the fit-review CTA.
9. Strengthen credentialing copy around application/enrollment/effective-date distinctions, billing handoff, first-paid-claim readiness, and non-guaranteed payer timing.
10. Add the practice-launch service page with unique metadata, Service/FAQ/Breadcrumb schema, launch sequence, responsibilities, boundaries, and topic-tagged CTA.
11. Add an ungated launch-readiness guide/worksheet with practical setup sequencing and links back to the launch, billing, and credentialing pages.
12. Add homepage/service/article internal links and exactly one sitemap entry per new page.
13. Run the single focused release smoke and inspect the exact diff for privacy, price, claim, and scope integrity.
14. Commit and push the acquisition release after the already-deployed privacy hotfix; verify the remote SHA and live pages/assets/removals; record the release baseline and measurement dates.

## 12. Acceptance checks

### Privacy containment

- Restricted archive contains every removed source file and a checksum manifest.
- Archive directories are mode `0700` and files are mode `0600`.
- Prohibited operational paths are absent from `git ls-files`.
- The focused privacy guard passes on the release tree.
- After deployment, prior operational URLs do not return the removed content.

### Attribution transaction

- Form action remains `https://formspree.io/f/xkorlzor`; no Formspree configuration is changed.
- No-PHI warning remains visible beside the form.
- Hidden fields include the declared privacy-safe metadata and do not include message, name, email, phone, patient, claim, or clinical values in analytics events.
- Pre-acceptance attempts cannot emit `generate_lead`.
- Accepted controlled tests cannot emit `generate_lead`.
- Accepted prospect submissions produce a one-time success record and the intended GA4 lead event.

### Commercial surfaces

- Each changed/new commercial page has one unique title, description, canonical URL, H1, CTA topic, and parseable JSON-LD.
- Billing price remains 5% of collections, no setup fee, no monthly minimum; prior authorization price remains $25 where stated.
- Credentialing and launch copy make payer timelines/effective dates non-guaranteed.
- Clinical code and diagnosis selection remain provider-owned.
- New pages resolve locally, are discoverable through internal links, and appear exactly once in the sitemap.

### Release

- `git diff --check` is clean.
- The single focused smoke exits zero and writes its evidence record.
- The release commit is present on `origin/main`.
- Selected live pages and versioned assets match the release content.
- No email, Formspree configuration change, or unapproved external action occurred.

## 13. Focused smoke contract

One release smoke must check only the intended transaction and release surfaces:

- no prohibited operational paths or sensitive lead-record patterns in the tracked current tree;
- form endpoint/method/no-PHI warning/hidden attribution fields;
- JavaScript syntax and success/test event contract;
- unique canonical/title/description/H1 and parseable JSON-LD on changed/new pages;
- new pages linked internally and present once in the sitemap;
- local references from changed/new HTML resolve;
- private templates remain outside Git tracking;
- `git diff --check` passes.

This smoke proves mechanical release readiness, not broad site efficacy or lead lift.

## 14. Release and rollback

Release:

1. Preserve the already-deployed privacy hotfix as a separate auditable commit.
2. Create the reviewed acquisition release commit on `main`.
3. Push `main` to `origin`.
4. Poll the public site for the release marker/content and verify exact live endpoints.

Rollback:

- Website code can be reverted with a new commit.
- The restricted archive preserves the removed current-tree operational material.
- Formspree settings are unchanged, so no provider rollback is required.
- Historical Git treatment is outside this release and requires separate approval.

## 15. Measurement contract

Baseline window: 2026-07-09 through 2026-07-27, with known GA4 start on 2026-07-10 and known pollution caveats.

Post-release checkpoints:

- Day 7: mechanics and indexing visibility.
- Day 14: early source/landing/query movement and verified inquiry count.
- Day 30: verified non-test inquiries, qualified inquiries, response SLA, discovery calls, proposals/engagements, source coverage, and conversion-path evidence.

Primary operating targets (targets, not forecasts):

- 4+ verified non-test qualified inquiries.
- Attribution present for at least 80% of verified inquiries.
- Response within one business day.
- At least 2 discovery calls.
- At least 1 proposal or engagement.

## 16. Time, token, compute, and execution budget estimates

- Expected implementation elapsed time: one bounded release session, approximately 2–4 hours including GitHub Pages propagation.
- Expected model budget: one primary-agent implementation pass; no subagent or model-worker farm.
- Expected compute: local text/static-site edits, one focused Node smoke, Git operations, and lightweight HTTP/browser verification.
- Execution placement: local control-plane host is acceptable because there is no heavy build, browser farm, or repo-scale test campaign.
- External API budget: one Git push plus passive GitHub Pages/live HTTP verification; no Formspree write/config API and no prospect messaging.

## 17. Confusion-prevention rules

- `Formspree accepted` is submission truth; GA4 is behavioral evidence only.
- `generate_lead` never means a pre-acceptance attempt or controlled test.
- The public website repository never stores lead rows, correspondence, credentials, PHI, or private operations artifacts.
- The aggregate private pipeline never replaces canonical client/prospect ledgers.
- Credentialing application, credentialing approval, contracting, enrollment/loading, effective date, claim acceptance, and payment remain distinct milestones.
- Billing staff own operational claim work; providers own clinical code/diagnosis selection and signed-note support.
- Publishing a page is not evidence it ranks or converts.
- Current-tree deletion is not historical eradication; no history-clean claim is allowed.
- Draft response templates are not sent messages.
- One focused smoke is mechanical evidence only, not broad regression or efficacy proof.

## 18. Open decisions before code starts

Resolved before implementation:

- Use the existing Formspree endpoint and GA4 stream: yes.
- Preserve the homepage contact form and low-friction field count: yes.
- Mark controlled validation through `lead_test=1`: yes.
- Store private operations outside the public repo: yes.
- Preserve an owner-only archive before removal: yes.
- Rewrite Git history: no; separate approval required.
- Change Formspree account settings or send prospect messages: no.

No unresolved decision blocks the approved release.

## 19. Current milestone

Current milestone: complete. Privacy hotfix `7bda29b` and acquisition release `7b3f890` are on `origin/main`; the focused 91-check smoke and selected 12-endpoint live verification passed. Day-7/day-14/day-30 measurement is ongoing operations, not unfinished release implementation.

## 20. Truth boundary and stop condition

Claim allowed on release: the package was implemented, one focused smoke passed, the exact commit was pushed, selected live pages/assets were verified, and old current-tree operational URLs no longer expose their prior content.

Claim not allowed until measured: the release increased traffic, caused leads, achieved the 30-day targets, or improved conversion rate. Current-tree removal also does not prove historical Git copies, third-party caches, forks, or prior clones were erased.

Stop condition reached on 2026-08-11: the release is live and verified with a recorded baseline and measurement cadence. No efficacy claim is made before post-release evidence exists.

---

## 21. 2026-10-19 mobile and tablet responsive-hardening addendum

### Objective and fidelity

- Reply anchor: Jake's 2026-10-19 request to make the tablet and mobile versions of PMHNPBilling.com fully polished.
- Active path: `/root/clawd/pmhnpbilling-site` on `main`.
- Fidelity: `parity_for_scope` for the public site's phone and tablet presentation; no desktop redesign or copy rewrite.
- Stop condition: `responsive_smoke_green_and_live_release_verified_or_blocker`.
- Truth boundary: one focused automated smoke plus representative screenshot inspection can prove the tested responsive contract, not flawless rendering on every possible browser/device combination.

### Scope and surface matrix

| Surface | Coverage | Acceptance condition |
|---|---|---|
| Public routes | Every same-origin URL in `sitemap.xml`, plus legal/utility pages linked from the public tree | HTTP success and no route-specific horizontal overflow at tested breakpoints |
| Homepage | Header/nav, hero, trust/proof, services, CTA, form, footer, decorative layers | No clipping/overlap; menu and CTAs usable; text and form controls remain legible |
| Service/resource templates | Representative service and resource pages plus route-wide geometry checks | Content, cards, tables/lists, CTAs, and footer remain within the viewport |
| Blog templates | Blog index and representative long-form article plus route-wide geometry checks | Article typography, media, callouts, and navigation remain readable and unbroken |
| Legal/utility templates | Privacy, terms, editorial policy, thank-you | No overflow or controls hidden behind fixed elements |
| Breakpoints | 360×800, 390×844, 430×932, 768×1024, 820×1180, and 1024×768 | Phone and portrait/landscape tablet layouts satisfy the same mechanical checks |

### Implementation sequence

1. Capture the exact repository/live baseline and enumerate public routes.
2. Run a browser-backed audit on the remote execution plane, recording overflow, out-of-bounds elements, navigation state, form geometry, and representative screenshots.
3. Fix only confirmed responsive defects in the canonical shared CSS/JavaScript or the affected product page.
4. Run exactly one focused responsive smoke across the defined route/breakpoint matrix and inspect representative screenshots.
5. Inspect the diff, commit, push `main`, and verify the public site serves the release and passes the focused live smoke.

### Confusion-prevention rules

- Do not treat a desktop screenshot or HTTP 200 as mobile/tablet proof.
- Do not hide content merely to silence overflow; preserve content and functionality.
- Do not alter pricing, clinical/payer claims, analytics semantics, or the Formspree endpoint.
- Do not count preview-only CSS as the live responsive implementation unless the public HTML imports it.
- A single focused smoke is mechanical evidence only; avoid claims of universal device/browser perfection.

### Estimate

- Elapsed time: approximately 1–3 hours, including live publication propagation.
- Compute: browser-backed route/breakpoint audit on Hetzner; lightweight edits and Git operations on the control plane.
- External writes: one repository push/deployment after the focused smoke passes; no form submissions or customer communications.

### Acceptance checkpoint

- Baseline: 66 routes × 6 viewports, 396 checks, 29 failing route/viewport combinations.
- Implemented: responsive navigation through 900px, 44px-or-larger touch targets, 16px phone form/search controls, safer menu state/scroll locking, 48px conversion controls, footer legibility/touch sizing, and shared-asset cache-busting.
- Focused acceptance smoke: PASS, 396/396 checks, zero failures, zero warnings.
- Evidence: `/root/clawd/artifacts/pmhnp-responsive-20261019/final-smoke/report.json` and representative captures under `final-smoke/screenshots/`.
- Product release commit `473e0958ce4a83f0fdc5b7c8b244bff48aaaca5a` was pushed to `origin/main`.
- GitHub Pages deployment run `39315979078` completed successfully; the live homepage and versioned responsive CSS were retrieved with the release markers/rules present.
- Stop condition reached: `responsive_smoke_green_and_live_release_verified_or_blocker` resolved green.

## 22. SEO health and social-discovery hardening addendum (2026-10-19)

### Anchor and scope

- Reply anchor: Jake asked, “Can you make sure the SEO is working on the website?”
- Target: canonical `/root/clawd/pmhnpbilling-site` and read-only Search Console/weekly-monitor evidence.
- Fidelity: `parity_for_scope` for technical/on-page SEO and current search-health observation; not a ranking guarantee.

### Execution and acceptance

1. Refresh read-only Search Console and live monitor evidence.
2. Validate robots, sitemap, indexability, canonical metadata, social metadata, JSON-LD, H1s, internal references, images, uniqueness, and homepage reachability across all sitemap pages.
3. Repair objective source defects only; do not rewrite medical/coding content merely to chase traffic.
4. Publish after the focused smoke passes, then verify Pages deployment and the live metadata/sitemap.

Stop condition: `seo_smoke_green_and_live_release_verified_or_blocker`.

### Checkpoint

- Fresh live monitor: homepage/robots/sitemap healthy; 60/60 sitemap URLs passed; GSC sitemap count 60 and no monitor errors.
- Source defects repaired: four indexable pages missing Open Graph/Twitter images; sitemap freshness updated for those pages.
- Focused smoke: PASS, 60 pages, 1,321 internal references, zero failures/warnings.
- Performance truth: current clicks/visibility declined versus the prior 28-day window even though average position improved; technical green does not prove traffic growth.
- Product release commit `88e13db22caed4ecb7ae5cbd6ccce74be4279d09` is on `origin/main`.
- GitHub Pages run `39363568892`, IndexNow run `39363569090`, and public-tree privacy run `39363569086` completed successfully.
- Live retrieval confirmed the affected service page and the sitemap with all four refreshed `2026-10-19` entries.
- Stop condition reached: `seo_smoke_green_and_live_release_verified_or_blocker` resolved green.

## 23. Commercial-intent SEO content package (2026-10-20)

### Anchor and contract

- Reply anchor: Jake approved all four recommendations from the 2026-10-20 SEO analysis.
- Target path: `/root/clawd/pmhnpbilling-site`.
- Fidelity: `production_slice` for two existing-page CTR refreshes, one canonical commercial-intent calculator page, and a recurring review workflow that drafts recommendations but does not publish unattended.
- Implementation surface: product HTML/CSS/JavaScript, sitemap/internal links/schema, SEO monitoring/review scheduling, and release evidence.
- Stop condition: `coding_refresh_and_calculator_green_live_verified_or_blocker`.

### Scope

1. Refresh the existing 90791/90792 and psychiatric coding-matrix pages around their proven Search Console query intent without changing provider-owned coding responsibility or making payer guarantees.
2. Add a canonical utility page answering “How much does PMHNP billing cost?” with a 5% collections calculator, realistic examples, clear included/excluded scope, FAQ/schema, and a privacy-safe contact path.
3. Add the page to the sitemap and relevant internal-link surfaces without creating a second pricing system or duplicating an existing article.
4. Establish a monthly read-only Search Console/content review that produces a recommendation or draft only; no autonomous publication.

### Non-goals and safety boundaries

- Do not promise reimbursement, payer acceptance, collections growth, or savings.
- Do not replace provider-selected coding or payer-specific verification with generic web copy.
- Do not infer commercial terms beyond the established 5% of actual insurance and patient collections, no setup fee, no monthly minimum, and separately priced prior authorizations where already published.
- Do not collect PHI in the calculator or contact flow.
- Do not auto-publish future content.

### Prior-art decision

- Decision: `extend_existing`.
- Evidence: `/root/clawd/artifacts/pmhnp-seo-content-20261020/prior-art-gate-final.json`.
- Reuse the canonical static-site templates, published pricing, provider-owned coding boundary, sitemap, Search Console monitor, IndexNow workflow, and GitHub Pages release path.

### Implementation sequence and acceptance

1. Verify commercial terms and current primary coding sources.
2. Update titles, descriptions, structured data dates, and above-the-fold direct answers on the two existing pages.
3. Build the calculator page with keyboard-accessible input, deterministic 5% arithmetic, monthly/annual examples, inclusions/exclusions, no-PHI language, and a service CTA.
4. Add canonical metadata, WebPage/WebApplication/FAQ/Breadcrumb structured data, sitemap entry, blog/resource discovery, and internal links from relevant service/pricing surfaces.
5. Run one focused smoke covering metadata/schema/link integrity, calculator math and edge cases, responsive layout, accessibility-critical controls, and unchanged contact/privacy boundaries.
6. Publish the exact release commit, verify Pages/IndexNow/privacy workflows, retrieve the live page/metadata/sitemap, and record evidence.
7. Create a monthly read-only review job that reports GSC page/query changes and proposes one new page or existing-page refresh without publishing.

### Truth boundary

- A green release proves the declared technical/content package and deterministic calculator behavior.
- It does not prove future rankings, indexation timing, CTR improvement, clicks, leads, reimbursement, or revenue outcomes.

### Evidence checkpoint

- Prior-art gate: `extend_existing`; the existing acquisition, sitemap, Search Console, privacy, and release machinery was extended rather than duplicated.
- PMHNP no-PHI response preflight: `PASS`; evidence at `/root/clawd/artifacts/pmhnp-seo-content-20261020/pmhnp-response-preflight.json`.
- Current-source boundary: canonical pricing evidence was verified. Cortex browser retrieval of the CMS references failed twice, so coding edits were deliberately limited to metadata, direct-answer presentation, navigation, accessibility, and schema alignment; no new coding rule was added.
- Focused package smoke: `PASS`, 169 checks across 9 pages; artifact at `/root/clawd/artifacts/pmhnp-seo-content-20261020/package-smoke.json`.
- Monthly review: enabled OpenClaw job `a40f38d4-5b71-4cdb-a626-b66dd28f540c`, schedule `0 9 1 * *` in `America/Chicago`, delivery `none`; it reads existing GSC evidence and writes one local proposal without publishing.
