# PMHNP Blog Auto-Publish Instructions

This file is the operating brief for the recurring PMHNP blog content job.

## Goal

Publish a new SEO-focused PMHNP billing post to `pmhnpbilling.com` on a recurring schedule without duplicating weak topics or breaking site structure.

## Before writing

1. Read `content-strategy/blog-performance.md`.
2. Read `blog/index.html` to see the newest published posts and avoid near-duplicates.
3. Read `sitemap.xml` so the new post is added consistently.
4. Skim the newest 3–5 blog posts in `blog/` to match tone, structure, and internal-link style.

## Topic selection rules

- Double down on topics already showing strong intent:
  - PMHNP credentialing
  - telehealth billing
  - claim denials and appeals
  - psychiatric CPT / E/M / add-on coding
  - front-end eligibility and authorization workflows
- Prefer practical, operational angles over generic thought pieces.
- Avoid publishing a topic that is materially the same as one of the most recent posts unless you have a clearly different angle.
- Favor national PMHNP-specific search intent first; use Illinois or Chicago only when the rule set or audience is genuinely local.
- If performance data is thin, prioritize keyword gaps and revenue-cycle execution topics.

## Required output

For each run:

1. Create **one** new HTML blog post in `blog/`.
2. Use a filename derived from the title, lowercase, hyphenated, and ending in `-2026.html` when appropriate.
3. Update `blog/index.html` and add the new post at the top.
4. Update `sitemap.xml` with the new blog URL and current `lastmod` date.
5. Add a short entry to `content-strategy/blog-performance.md` documenting:
   - date
   - title
   - URL
   - target keywords
   - why this topic was chosen
6. Commit the changes in git.
7. Push to `origin main`.

## Quality bar

- The article should be useful enough that an actual PMHNP owner or biller could apply it.
- Use a concrete, search-intent-friendly title, a unique title tag, and a useful meta description. Keep the title tag concise enough to communicate the core query in a search result; the visible H1 may be longer when clarity requires it.
- Include internal links to relevant service pages and related blog posts when appropriate. Link to primary external sources for time-sensitive rules.
- Use `content-strategy/commercial-intent-map.md` to select exactly one owning service page. Do not create or reinforce a competing commercial landing page for the same intent.
- Keep the current attributed conversion CTA near the end of the article. Its contact link must include `lead_source=article` plus the topic-specific `lead_topic`; do not replace it with a generic “contact us” link.
- Keep the article honest: do not promise payer behavior or automation that the site cannot actually deliver.
- Never publish unsupported revenue estimates, turnaround times, approval windows, visit thresholds, modifier rules, denial-rate benchmarks, clean-claim targets, or universal payer instructions. Scope every rule to the source, payer product, jurisdiction, and effective date that support it.
- Prefer current primary sources: CMS, state Medicaid agencies, regulators, official payer manuals or bulletins, and current code-set authorities. Check every external URL before publishing and record material sources in the article.
- Clearly separate educational operations guidance from legal, clinical, compliance, and coding decisions. Never alter clinical or claim facts merely to obtain payment.
- FAQPage structured data is allowed only when every marked-up question and answer appears visibly on the page with materially identical wording. Remove the markup if that check fails.
- Do not expose internal content strategy, keyword-gap notes, performance hypotheses, or “why this topic was chosen” sections on the public article. Put that evidence only in `content-strategy/blog-performance.md`.
- Avoid fluff. Prefer checklists, workflows, pitfalls, documentation rules, payer readiness steps, and denial-prevention details.

## Required metadata and trust signals

Every indexed article must include:

- a self-referencing canonical URL and `index,follow,max-image-preview:large` robots directive;
- Open Graph and Twitter metadata, including the production 1200×630 social image and descriptive image alt text;
- a visible organizational byline (`PMHNP Billing editorial team`), published date, and updated date when materially revised;
- valid Article JSON-LD with canonical `mainEntityOfPage`, ISO publication/update dates, organization author/publisher, and 1:1, 4:3, and 16:9 image variants;
- valid BreadcrumbList JSON-LD;
- one visible H1, semantic `<main>`, descriptive link text, and meaningful image alt text;
- footer links to the editorial policy, privacy notice, and website terms.

## Required sitewide design shell

Every new article must inherit the production modern-warm design rather than copying a standalone legacy layout:

- Add `mw-site mw-article` to the `<body>` classes.
- Load `../assets/modern-warm-site.css` after any article-specific styles.
- Load `../assets/modern-warm-site.js` with `defer` before `</body>` so mobile navigation and reduced-motion-safe scroll reveals work.
- Use the current article navigation and footer markup from a recently published indexed article.
- Keep the structural classes `article-container`, `article-header`, `article-title`, `article-subtitle`, `article-meta`, and `article-content` so the shared editorial template applies consistently.
- Verify desktop and mobile layout, no horizontal overflow, working navigation, and no browser-console errors before committing.

## Pre-publish validation

Before committing, validate the new page and the files it changes:

1. Parse every JSON-LD block as JSON and confirm required fields use valid types.
2. Confirm FAQ schema questions and answers match visible content exactly.
3. Check title, description, canonical, robots, H1, main landmark, byline, Article schema, breadcrumb schema, social-image metadata, and image dimensions.
4. Check every new internal and external link; do not publish known 404s.
5. Confirm the page appears once in the blog index and sitemap, with the correct canonical URL and current `lastmod`.
6. Render desktop and mobile views; confirm no horizontal overflow, hidden content, layout breakage, or browser-console errors.
7. Run the repository's SEO/content audit. A green generic SEO score does not override factual, schema, trust, or source failures.

## End-of-run report

At the end, report:

- title
- filename
- topic strategy / why it was chosen
- primary sources checked
- validation results
- commit hash
- push result
- expected performance tier (`high`, `medium`, or `experimental`), clearly labeled as an estimate rather than a ranking guarantee
