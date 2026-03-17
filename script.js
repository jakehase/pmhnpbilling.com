// PMHNP live-template blog search + bidirectional motion layer
(function () {
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    var motionSections = Array.prototype.slice.call(document.querySelectorAll('[data-has-orbs="true"], .motion-hero-section, .why-work-section, .offer-section'));
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

    Array.prototype.slice.call(document.querySelectorAll('.motion-surface, .motion-hero-section, .why-work-section, .offer-section, .blog-search-panel, .service-card, .card, article, .faq-item, .trust-item, .testimonial-content, .contact-info, .contact-form, .panel')).forEach(function (panel) {
      panel.addEventListener('mousemove', function (event) {
        var rect = panel.getBoundingClientRect();
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
  }
})();
