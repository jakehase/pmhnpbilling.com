# IndexNow integration

PMHNPBilling.com notifies IndexNow after a successful GitHub Pages deployment.

## Default path

- `.github/workflows/indexnow.yml` runs only after the canonical Pages deployment succeeds on `main`.
- `scripts/submit-indexnow.py` compares the deployed commit with its parent.
- Added, modified, renamed, and deleted HTML URLs are considered.
- Pages carrying `noindex` are skipped.
- The workflow sends nothing when a deployment has no changed indexable HTML.
- A successful HTTP `200` or `202` means IndexNow received the notification; it does not guarantee crawling, indexing, or rankings.

Configuration is in `scripts/indexnow-config.json`. The ownership key file is intentionally public at the site root because IndexNow fetches it to verify the domain.

## Local dry run

```bash
python3 scripts/submit-indexnow.py --base HEAD^ --head HEAD
```

## Approved manual submission

Use explicit URLs only when they were recently added, updated, or deleted:

```bash
python3 scripts/submit-indexnow.py \
  --url https://pmhnpbilling.com/changed-page.html \
  --submit
```

Do not submit the entire sitemap repeatedly. IndexNow is a change-notification protocol, not a general ranking or indexing guarantee.
