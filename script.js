// PMHNP homepage interactions
(function () {
  var prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  window.toggleMenu = function toggleMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (toggle) toggle.classList.toggle('active');
    if (mobileMenu) mobileMenu.classList.toggle('active');
  };

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var targetSelector = this.getAttribute('href');
      var target = targetSelector ? document.querySelector(targetSelector) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  var searchInput = document.getElementById('blogSearch');
  var searchMeta = document.getElementById('blogSearchMeta');
  if (searchInput) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.blog-search-item'));
    if (!items.length) {
      items = Array.prototype.slice.call(document.querySelectorAll('.blog-post'));
    }
    var updateSearch = function () {
      var query = (searchInput.value || '').trim().toLowerCase();
      var visible = 0;
      items.forEach(function (item) {
        var haystack = (item.getAttribute('data-search-text') || item.textContent || '').toLowerCase();
        var match = !query || haystack.indexOf(query) !== -1;
        item.classList.toggle('is-filtered-out', !match);
        if (match) visible += 1;
      });
      if (searchMeta) {
        searchMeta.textContent = query
          ? visible + ' result' + (visible === 1 ? '' : 's') + ' for “' + query + '”.'
          : items.length + ' article card' + (items.length === 1 ? '' : 's') + ' available.';
      }
    };
    searchInput.addEventListener('input', updateSearch);
    updateSearch();
  }

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-reveal], .fade-in'));
  if (revealItems.length) {
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var target = entry.target;
          var delay = Number(target.getAttribute('data-reveal-delay') || 0);
          if (entry.isIntersecting) {
            window.setTimeout(function () {
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
      revealItems.forEach(function (item) { revealObserver.observe(item); });
    } else {
      revealItems.forEach(function (item) { item.classList.add('is-in-view'); });
    }
  }

  if (!prefersReducedMotion) {
    var motionSections = Array.prototype.slice.call(document.querySelectorAll([
      '[data-has-orbs="true"]',
      '.motion-hero-section',
      '.why-work-section',
      '.offer-section',
      '.hero-wrapper--spheres-luxe',
      '.services',
      '.pilot-preview',
      '.trust',
      '.testimonial',
      '.contact',
      '.site-footer'
    ].join(', ')));

    var updateMotion = function () {
      var viewportHeight = window.innerHeight || 1;
      motionSections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var progress = Math.max(-1, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
        section.style.setProperty('--scroll-progress', progress.toFixed(3));
      });
    };
    updateMotion();
    window.addEventListener('scroll', updateMotion, { passive: true });

    Array.prototype.slice.call(document.querySelectorAll([
      '.motion-surface',
      '.motion-hero-section',
      '.why-work-section',
      '.offer-section',
      '.blog-search-panel',
      '.pilot-preview-card',
      '.about-content',
      '.service-card',
      '.faq-item',
      '.trust-item',
      '.testimonial-content',
      '.contact-info',
      '.contact-form',
      '.site-footer__panel',
      '.panel',
      '.card',
      'article'
    ].join(', '))).forEach(function (panel) {
      panel.addEventListener('mousemove', function (event) {
        var rect = panel.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        panel.style.setProperty('--tilt-x', (x * 4).toFixed(2) + 'deg');
        panel.style.setProperty('--tilt-y', (-y * 4).toFixed(2) + 'deg');
      });
      panel.addEventListener('mouseleave', function () {
        panel.style.removeProperty('--tilt-x');
        panel.style.removeProperty('--tilt-y');
      });
    });

    var heroLuxeField = document.getElementById('heroLuxeField');
    var wrapper = document.querySelector('.hero-wrapper--spheres-luxe');
    if (heroLuxeField && wrapper) {
      var resetLuxeField = function () {
        heroLuxeField.style.transform = 'rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';
      };
      wrapper.addEventListener('mousemove', function (event) {
        var rect = wrapper.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        var rotateY = -2 + (x * 4);
        var rotateX = 1.5 - (y * 3);
        var moveX = (x - 0.5) * 8;
        var moveY = (y - 0.5) * 5;
        heroLuxeField.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translate3d(' + moveX + 'px, ' + moveY + 'px, 0)';
      });
      wrapper.addEventListener('mouseleave', resetLuxeField);
      resetLuxeField();
    }
  }
})();
