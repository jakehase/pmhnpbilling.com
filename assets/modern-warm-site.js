/* Shared interaction layer for the PMHNP Billing modern-warm theme. */
(() => {
  'use strict';

  const body = document.body;
  if (!body || !body.classList.contains('mw-site')) return;

  const mobileMenu = (() => {
    const nav = body.classList.contains('mw-app')
      ? document.querySelector('.topbar')
      : document.querySelector('body > nav');
    if (!nav) return null;

    const menu = body.classList.contains('mw-app')
      ? nav.querySelector('.topnav')
      : (nav.querySelector('ul') || nav.querySelector('.links'));
    if (!menu) return null;

    const mount = nav.querySelector('.nav-inner, .topbar-inner') || nav;
    if (mount.querySelector('.mw-menu-toggle')) return null;

    if (!menu.id) menu.id = `mw-nav-${Math.random().toString(36).slice(2, 8)}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mw-menu-toggle';
    button.setAttribute('aria-label', 'Open navigation');
    button.setAttribute('aria-controls', menu.id);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span></span>';
    mount.appendChild(button);

    const setOpen = (open) => {
      body.classList.toggle('mw-menu-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };

    button.addEventListener('click', () => setOpen(!body.classList.contains('mw-menu-open')));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setOpen(false);
    }, { passive: true });

    return { button, menu, setOpen };
  })();

  const revealSelectors = body.classList.contains('mw-article')
    ? [
        '.article-header',
        '.mw-legacy-article > h1',
        '.article-content > h2',
        '.article-content > h3',
        '.article-content > table',
        '.article-content > .highlight-box',
        '.article-content > .warning-box',
        '.article-content > .faq-block',
        '.article-content > .cta-section',
        '.article-content > blockquote',
        '.back-to-blog'
      ]
    : body.classList.contains('mw-claim')
      ? ['header.hero .eyebrow', 'header.hero h1', 'header.hero p', 'header.hero .hero-actions', 'main .panel', 'main .card']
      : body.classList.contains('mw-app')
        ? ['main > .hero', 'main > .grid-two > .card', 'main > .card', '.intake-card > .eyebrow', '.intake-card > h1', '.intake-card > .lead', '.wizard-progress', '.wizard-panel']
        : [];

  const seen = new Set();
  const revealNodes = revealSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .filter((node) => {
      if (seen.has(node)) return false;
      seen.add(node);
      return true;
    });

  if (revealNodes.length) {
    document.documentElement.classList.add('mw-motion-ready');
    revealNodes.forEach((node, index) => {
      node.classList.add('mw-reveal');
      node.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    });

    const show = (node) => {
      node.classList.add('is-in-view');
      node.style.transitionDelay = '';
    };

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealNodes.forEach(show);
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
      revealNodes.forEach((node) => observer.observe(node));
    }
  }
})();
