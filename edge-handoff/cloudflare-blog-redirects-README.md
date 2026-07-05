# Cloudflare blog redirect handoff — 2026-05-30

These files convert the old Chicago-heavy PMHNP blog URLs to their national/state-specific destination URLs with HTTP 301 redirects.

Files:

- `cloudflare-blog-redirect-ruleset.json` — Rulesets API payload for the `http_request_dynamic_redirect` phase.
- `cloudflare-blog-bulk-redirects.csv` — dashboard/API-friendly bulk redirect list.

Redirect count: 27

Current live fallback pages already have `noindex, follow`, meta refresh, and canonical tags. These Cloudflare redirects are the stronger edge/server-side SEO migration signal.
