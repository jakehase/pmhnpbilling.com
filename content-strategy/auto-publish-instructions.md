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
- Use a concrete, search-intent-friendly title.
- Include internal links to relevant service pages and related blog posts when appropriate.
- Keep the article honest: do not promise payer behavior or automation that the site cannot actually deliver.
- Avoid fluff. Prefer checklists, workflows, pitfalls, documentation rules, payer readiness steps, and denial-prevention details.

## Required sitewide design shell

Every new article must inherit the production modern-warm design rather than copying a standalone legacy layout:

- Add `mw-site mw-article` to the `<body>` classes.
- Load `../assets/modern-warm-site.css` after any article-specific styles.
- Load `../assets/modern-warm-site.js` with `defer` before `</body>` so mobile navigation and reduced-motion-safe scroll reveals work.
- Use the current article navigation and footer markup from a recently published indexed article.
- Keep the structural classes `article-container`, `article-header`, `article-title`, `article-subtitle`, `article-meta`, and `article-content` so the shared editorial template applies consistently.
- Verify desktop and mobile layout, no horizontal overflow, working navigation, and no browser-console errors before committing.

## End-of-run report

At the end, report:

- title
- filename
- topic strategy / why it was chosen
- commit hash
- push result
- expected performance tier (`high`, `medium`, or `experimental`)
