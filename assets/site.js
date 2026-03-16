(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const searchInput = document.getElementById('blogSearch');
  const searchMeta = document.getElementById('blogSearchMeta');
  if (searchInput) {
    const items = [...document.querySelectorAll('.blog-search-item')];
    const update = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const haystack = (item.getAttribute('data-search-text') || item.textContent || '').toLowerCase();
        const match = !query || haystack.includes(query);
        item.classList.toggle('is-filtered-out', !match);
        if (match) visible += 1;
      });
      if (searchMeta) {
        searchMeta.textContent = query
          ? `${visible} result${visible === 1 ? '' : 's'} for “${query}”.`
          : `${items.length} article card${items.length === 1 ? '' : 's'} available.`;
      }
    };

    searchInput.addEventListener('input', update);
    update();
  }

  const revealItems = [...document.querySelectorAll('[data-scroll-reveal]')];
  if (!prefersReducedMotion && revealItems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        const delay = Number(target.getAttribute('data-reveal-delay') || 0);
        if (entry.isIntersecting) {
          window.setTimeout(() => {
            target.classList.add('is-in-view');
          }, delay);
        } else {
          target.classList.remove('is-in-view');
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px'
    });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-in-view'));
  }

  if (!prefersReducedMotion) {
    const orbSections = [...document.querySelectorAll('[data-has-orbs="true"], .motion-hero, .why-work-section, .offer-section')];
    const onScroll = () => {
      const viewportHeight = window.innerHeight || 1;
      orbSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
        section.style.setProperty('--scroll-progress', progress.toFixed(3));
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    document.querySelectorAll('.motion-hero, .why-work-section, .offer-section, .blog-search-panel, .hy-panel, .hy-card, .hy-feature').forEach((panel) => {
      panel.addEventListener('mousemove', (event) => {
        const rect = panel.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        panel.style.setProperty('--tilt-x', `${(x * 4).toFixed(2)}deg`);
        panel.style.setProperty('--tilt-y', `${(-y * 4).toFixed(2)}deg`);
      });
      panel.addEventListener('mouseleave', () => {
        panel.style.removeProperty('--tilt-x');
        panel.style.removeProperty('--tilt-y');
      });
    });
  }
})();
