(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toggle = document.querySelector('[data-nav-toggle]');
  const body = document.body;
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

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if (!prefersReducedMotion && revealItems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.getAttribute('data-delay') || 0);
        window.setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  if (!prefersReducedMotion) {
    document.querySelectorAll('[data-parallax]').forEach((panel) => {
      panel.addEventListener('mousemove', (event) => {
        const rect = panel.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        panel.style.transform = `translateY(-3px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.6).toFixed(2)}deg)`;
      });
      panel.addEventListener('mouseleave', () => {
        panel.style.transform = '';
      });
    });
  }
})();
