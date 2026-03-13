# Edge Handoff: Force HTTP → HTTPS + Canonical Host

This repo does not contain the active root web server/edge runtime for `pmhnpbilling.com`.
To enforce protocol canonicalization at the edge, apply the included Cloudflare redirect ruleset:

- `edge-handoff/cloudflare-https-redirect-ruleset.json`

## What it does
1. Redirects any `http://` request to `https://` (301).
2. Redirects `https://www.pmhnpbilling.com/*` to `https://pmhnpbilling.com/*` (301).

## Where to apply
Cloudflare Dashboard → Rules → Transform/Redirect Rules (or Rulesets API) on zone `pmhnpbilling.com`.

## Validation checks
After deploy:

```bash
curl -I http://pmhnpbilling.com/
curl -I http://www.pmhnpbilling.com/
curl -I https://www.pmhnpbilling.com/blog/
```

Expected result: `301` (or `308`) to `https://pmhnpbilling.com/...`.
