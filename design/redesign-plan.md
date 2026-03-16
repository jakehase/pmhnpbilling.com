# PMHNP Billing — 10/10 Redesign Plan

## Goal

Move the site from **credible builder-led operator site** to a **premium, design-led, conversion-focused healthcare B2B experience** that feels unified across marketing, blog, and product surfaces.

## Success definition

A successful redesign should make the site feel:

- visually cohesive across home, blog, services, AI page, and app
- more trustworthy at first glance
- clearer about who the service is for and what happens next
- more polished in states, spacing, typography, and hierarchy
- easier to maintain as new blog posts are published

## Core design moves

### 1) Create one shared design system

Introduce a single source of truth for:

- typography scale
- spacing system
- brand colors + neutrals
- button styles
- surface/card treatments
- header/footer/navigation
- content widths
- form styling
- article/service/dashboard patterns

Implementation:

- `assets/site.css`
- `assets/site.js`
- `app/styles.css` rebuilt as an extension of the shared system

### 2) Clarify the conversion story on the homepage

The homepage should answer, within seconds:

- who this is for
- what PMHNP Billing actually does
- what outcomes it improves
- what happens after someone reaches out
- why the company is believable

Implementation:

- stronger hero with one primary CTA path
- proof / trust strip
- service pillars with outcome language
- process section
- AI operations section with safety framing
- featured insights section
- polished contact section

### 3) Unify public marketing + product surfaces

Right now the site feels like separate properties. The redesign should make:

- homepage
- services
- blog index
- AI agent page
- app pages

feel like one system.

Implementation:

- shared navigation and footer
- consistent hero language
- matching surface styles and spacing
- unified CTA patterns
- consistent brand voice

### 4) Make blog content look like part of the product brand

Search visitors often land on articles first, so the posts must feel premium too.

Implementation:

- restyle article pages via shared CSS
- modernize article navigation, container, tables, callouts, and CTAs
- rebuild blog index as an editorial surface
- add a reusable blog post template for future auto-published posts

### 5) Improve app and intake UX

The app should feel intentional and product-grade, not like an internal pilot dashboard exposed to users.

Implementation:

- clearer portal framing
- improved hero and access panels
- more polished cards, tables, and form states
- intake flow rewritten as a guided onboarding request
- better success/failure messaging

## Pages to redesign now

- `/index.html`
- `/blog/index.html`
- all existing `/blog/*.html` posts (shared styling upgrade)
- `/ai-agent.html`
- `/services/*.html`
- `/app/index.html`
- `/app/intake.html`
- `/app/styles.css`

## Maintainability upgrades

- add a reusable blog post template
- update the content auto-publish instructions to preserve the new design language
- keep blog index structure easy for future automated updates

## Acceptance criteria

- one coherent visual system across major site surfaces
- homepage conversion story is stronger and clearer
- blog posts no longer look like a separate older product
- intake form feels customer-facing and polished
- app surface looks meaningfully more product-grade
- site remains static-host friendly and GitHub Pages compatible
