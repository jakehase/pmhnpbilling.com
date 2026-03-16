(() => {
  const body = document.body;

  const toggle = document.querySelector('[data-nav-toggle]');
  if (toggle) {
    const closeMenu = () => {
      body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.querySelectorAll('.site-nav a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  const yearNodes = document.querySelectorAll('[data-current-year]');
  yearNodes.forEach((node) => { node.textContent = new Date().getFullYear(); });

  const searchInput = document.querySelector('[data-blog-filter]');
  if (searchInput) {
    const cards = Array.from(document.querySelectorAll('[data-blog-card]'));
    const empty = document.querySelector('[data-blog-empty]');
    const applyFilter = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const haystack = (card.dataset.search || card.textContent || '').toLowerCase();
        const match = !query || haystack.includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
    };
    searchInput.addEventListener('input', applyFilter);
    applyFilter();
  }

  if (body.dataset.template === 'blog-post') {
    upgradeBlogPost();
  }

  function upgradeBlogPost() {
    const title = document.querySelector('h1')?.textContent?.trim() || document.title.replace(/\s*\|.*$/, '');
    const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    const publishedText = findPublishedText();
    const existingNodes = Array.from(body.children);
    const header = createSiteHeader('blog');
    const footer = createSiteFooter();

    const articleContainer = document.createElement('main');
    articleContainer.className = 'article-container';

    const intro = document.createElement('section');
    intro.className = 'article-featured';
    intro.innerHTML = `
      <div class="eyebrow">PMHNP billing guide</div>
      <h1 class="article-title">${escapeHtml(title)}</h1>
      <p class="article-subtitle">${escapeHtml(metaDescription || 'Execution-focused guidance for psychiatric billing, credentialing, denials, and compliance.')}</p>
      <div class="badge-row">
        <span class="badge badge--light">Operational guidance</span>
        <span class="badge badge--light">PMHNP-focused</span>
        <a class="button button--ghost" href="/app/intake.html">Start intake</a>
      </div>
    `;

    const articleHeader = document.createElement('div');
    articleHeader.className = 'article-header';
    articleHeader.innerHTML = `
      <div class="back-to-blog"><a href="/blog/">← Back to PMHNP Billing blog</a></div>
      <p class="article-meta">${escapeHtml(publishedText)} · <a class="muted-link" href="${canonical}">Permalink</a></p>
    `;

    const articleContent = document.createElement('article');
    articleContent.className = 'article-content';

    existingNodes.forEach((node) => {
      if (node.tagName === 'SCRIPT') return;
      if (node.tagName === 'H1') return;
      const text = node.textContent?.trim() || '';
      if (!text) return;
      if (node.tagName === 'P' && /published|updated/i.test(text) && text.length < 140) return;
      articleContent.appendChild(node);
    });

    const progression = document.createElement('section');
    progression.className = 'article-progression';
    progression.innerHTML = `
      <div class="cta-section">
        <h3>Need implementation help, not just reading?</h3>
        <p>PMHNP Billing supports psychiatric practices with credentialing, claims operations, denial recovery, telehealth compliance, and onboarding workflow support.</p>
        <div class="inline-actions">
          <a class="button button--primary" href="/#contact">Request a consult</a>
          <a class="button button--secondary" href="/services/pmhnp-billing-services.html">Explore services</a>
        </div>
      </div>
      <div class="grid-two">
        <div class="card">
          <h3>Popular next reads</h3>
          <ul class="check-list">
            <li><a href="/blog/pmhnp-billing-chicago-claim-denial-appeals-playbook-2026.html">Claim denial appeals playbook</a></li>
            <li><a href="/blog/pmhnp-billing-chicago-90791-90792-em-psychotherapy-add-on-coding-guide-2026.html">Psychiatric coding guide</a></li>
            <li><a href="/blog/illinois-telehealth-billing-guide.html">Illinois telehealth billing guide</a></li>
          </ul>
        </div>
        <div class="card">
          <h3>Next operational step</h3>
          <p>If you want PMHNP Billing to review your workflow, start with the onboarding intake. It preserves pilot guardrails and routes requests for human review.</p>
          <div class="inline-actions">
            <a class="button button--secondary" href="/app/">Open client app</a>
            <a class="button button--secondary" href="/app/intake.html">Start onboarding intake</a>
          </div>
        </div>
      </div>
    `;

    body.innerHTML = '';
    body.append(header, articleContainer, footer);
    articleContainer.append(intro, articleHeader, articleContent, progression);
  }

  function createSiteHeader(current) {
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="site-header__inner">
        <a href="/" class="site-brand">
          <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <defs><linearGradient id="site-grad" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>
            <rect width="48" height="48" rx="12" fill="url(#site-grad)"/>
            <path d="M10 12h9a6 6 0 010 12h-9V12zm3 3v6h6a3 3 0 000-6h-6z" fill="white"/>
            <path d="M26 12h9a6 6 0 014.24 10.24L26 36V12zm3 3v12.5l7-7.5a3 3 0 00-4-4h-3z" fill="white" fill-opacity="0.85"/>
          </svg>
          <span class="brand-lockup"><strong>PMHNP Billing</strong><span>Billing operations for psychiatric practices</span></span>
        </a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="Toggle navigation" aria-expanded="false">☰</button>
        <nav class="site-nav">
          <a href="/" ${current === 'home' ? 'aria-current="page"' : ''}>Home</a>
          <a href="/services/pmhnp-billing-services.html" ${current === 'services' ? 'aria-current="page"' : ''}>Services</a>
          <a href="/blog/" ${current === 'blog' ? 'aria-current="page"' : ''}>Blog</a>
          <a href="/ai-agent.html" ${current === 'ai' ? 'aria-current="page"' : ''}>AI Agent</a>
          <a href="/app/">Client App</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div class="site-header__actions">
          <a href="/app/intake.html" class="button button--secondary">Start intake</a>
        </div>
      </div>
    `;
    return header;
  }

  function createSiteFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="site-footer__inner">
        <div class="footer-grid">
          <div>
            <h4>PMHNP Billing</h4>
            <p>Premium billing, credentialing, denial management, and workflow support for psychiatric practices.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><a href="/services/pmhnp-billing-services.html">Billing services</a></li>
              <li><a href="/services/pmhnp-credentialing-services.html">Credentialing</a></li>
              <li><a href="/blog/">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4>Client flow</h4>
            <ul>
              <li><a href="/app/">Client app</a></li>
              <li><a href="/app/intake.html">Onboarding intake</a></li>
              <li><a href="/ai-agent.html">AI agent pilot</a></li>
            </ul>
          </div>
        </div>
        <div class="hr"></div>
        <p>© <span data-current-year></span> PMHNP Billing. Human-reviewed operations for psychiatric practices.</p>
      </div>
    `;
    footer.querySelector('[data-current-year]').textContent = new Date().getFullYear();
    return footer;
  }

  function findPublishedText() {
    const candidates = Array.from(document.querySelectorAll('p, div, span')).map((node) => node.textContent?.trim()).filter(Boolean);
    return candidates.find((text) => /published|updated/i.test(text)) || 'Operational article';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
