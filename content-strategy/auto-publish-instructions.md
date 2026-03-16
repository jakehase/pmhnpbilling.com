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
- Favor Chicago / Illinois / PMHNP-specific search intent when it fits naturally.
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
- Use a concrete, search-intent-friendly title.
- Include internal links to relevant service pages and related blog posts when appropriate.
- Keep the article honest: do not promise payer behavior or automation that the site cannot actually deliver.
- Avoid fluff. Prefer checklists, workflows, pitfalls, documentation rules, payer readiness steps, and denial-prevention details.

## End-of-run report

At the end, report:

- title
- filename
- topic strategy / why it was chosen
- commit hash
- push result
- expected performance tier (`high`, `medium`, or `experimental`)
