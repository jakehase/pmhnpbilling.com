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
      var hoverRotateX = 0;
      var hoverRotateY = 0;
      var hoverMoveX = 0;
      var hoverMoveY = 0;
      var interactiveRotateX = 0;
      var interactiveRotateY = 0;
      var interactiveMoveX = 0;
      var interactiveMoveY = 0;
      var velocityRotateX = 0;
      var velocityRotateY = 0;
      var velocityMoveX = 0;
      var velocityMoveY = 0;
      var activePointerId = null;
      var lastPointerX = 0;
      var lastPointerY = 0;
      var startPointerX = 0;
      var startPointerY = 0;
      var pointerType = '';
      var dragStarted = false;
      var rafId = 0;

      var clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
      };

      var applyHeroTransform = function () {
        var rotateX = hoverRotateX + interactiveRotateX;
        var rotateY = hoverRotateY + interactiveRotateY;
        var moveX = hoverMoveX + interactiveMoveX;
        var moveY = hoverMoveY + interactiveMoveY;
        heroLuxeField.style.transform = 'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translate3d(' + moveX.toFixed(2) + 'px, ' + moveY.toFixed(2) + 'px, 0)';
      };

      var tickHeroMotion = function () {
        rafId = 0;
        if (activePointerId === null) {
          interactiveRotateX += velocityRotateX;
          interactiveRotateY += velocityRotateY;
          interactiveMoveX += velocityMoveX;
          interactiveMoveY += velocityMoveY;

          velocityRotateX *= 0.92;
          velocityRotateY *= 0.92;
          velocityMoveX *= 0.90;
          velocityMoveY *= 0.90;

          interactiveRotateX *= 0.965;
          interactiveRotateY *= 0.965;
          interactiveMoveX *= 0.93;
          interactiveMoveY *= 0.93;
        }

        interactiveRotateX = clamp(interactiveRotateX, -14, 14);
        interactiveRotateY = clamp(interactiveRotateY, -18, 18);
        interactiveMoveX = clamp(interactiveMoveX, -24, 24);
        interactiveMoveY = clamp(interactiveMoveY, -18, 18);

        applyHeroTransform();

        if (
          activePointerId !== null ||
          Math.abs(velocityRotateX) > 0.01 ||
          Math.abs(velocityRotateY) > 0.01 ||
          Math.abs(velocityMoveX) > 0.01 ||
          Math.abs(velocityMoveY) > 0.01 ||
          Math.abs(interactiveRotateX) > 0.02 ||
          Math.abs(interactiveRotateY) > 0.02 ||
          Math.abs(interactiveMoveX) > 0.02 ||
          Math.abs(interactiveMoveY) > 0.02
        ) {
          rafId = window.requestAnimationFrame(tickHeroMotion);
        }
      };

      var ensureHeroAnimation = function () {
        if (!rafId) {
          rafId = window.requestAnimationFrame(tickHeroMotion);
        }
      };

      var updateHoverState = function (clientX, clientY) {
        var rect = wrapper.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = (clientX - rect.left) / rect.width;
        var y = (clientY - rect.top) / rect.height;
        hoverRotateY = -2 + (x * 4);
        hoverRotateX = 1.5 - (y * 3);
        hoverMoveX = (x - 0.5) * 8;
        hoverMoveY = (y - 0.5) * 5;
        applyHeroTransform();
      };

      var releaseHeroPointer = function () {
        activePointerId = null;
        dragStarted = false;
        wrapper.classList.remove('is-dragging');
        ensureHeroAnimation();
      };

      wrapper.addEventListener('mousemove', function (event) {
        if (activePointerId !== null) return;
        updateHoverState(event.clientX, event.clientY);
      });

      wrapper.addEventListener('mouseleave', function () {
        if (activePointerId !== null) return;
        hoverRotateX = 0;
        hoverRotateY = 0;
        hoverMoveX = 0;
        hoverMoveY = 0;
        ensureHeroAnimation();
      });

      wrapper.addEventListener('pointerdown', function (event) {
        if (event.target && event.target.closest('a, button, input, textarea, select')) return;
        activePointerId = event.pointerId;
        pointerType = event.pointerType || '';
        startPointerX = lastPointerX = event.clientX;
        startPointerY = lastPointerY = event.clientY;
        dragStarted = false;
        velocityRotateX = 0;
        velocityRotateY = 0;
        velocityMoveX = 0;
        velocityMoveY = 0;
        hoverRotateX = 0;
        hoverRotateY = 0;
        hoverMoveX = 0;
        hoverMoveY = 0;
        if (wrapper.setPointerCapture) {
          try { wrapper.setPointerCapture(event.pointerId); } catch (error) {}
        }
        ensureHeroAnimation();
      });

      wrapper.addEventListener('pointermove', function (event) {
        if (event.pointerId !== activePointerId) return;

        var totalDx = event.clientX - startPointerX;
        var totalDy = event.clientY - startPointerY;
        if (!dragStarted) {
          if (Math.abs(totalDx) < 8 && Math.abs(totalDy) < 8) return;
          if (pointerType === 'touch' && Math.abs(totalDy) > Math.abs(totalDx) * 1.15) {
            if (wrapper.releasePointerCapture) {
              try { wrapper.releasePointerCapture(event.pointerId); } catch (error) {}
            }
            releaseHeroPointer();
            return;
          }
          dragStarted = true;
          wrapper.classList.add('is-dragging');
        }

        var dx = event.clientX - lastPointerX;
        var dy = event.clientY - lastPointerY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;

        interactiveRotateY = clamp(interactiveRotateY + dx * 0.12, -18, 18);
        interactiveRotateX = clamp(interactiveRotateX - dy * 0.10, -14, 14);
        interactiveMoveX = clamp(interactiveMoveX + dx * 0.18, -24, 24);
        interactiveMoveY = clamp(interactiveMoveY + dy * 0.10, -18, 18);

        velocityRotateY = dx * 0.035;
        velocityRotateX = -dy * 0.03;
        velocityMoveX = dx * 0.06;
        velocityMoveY = dy * 0.035;

        applyHeroTransform();
      });

      var finishPointerInteraction = function (event) {
        if (event.pointerId !== activePointerId) return;

        if (!dragStarted) {
          var rect = wrapper.getBoundingClientRect();
          if (rect.width && rect.height) {
            var tapX = (event.clientX - rect.left) / rect.width - 0.5;
            var tapY = (event.clientY - rect.top) / rect.height - 0.5;
            velocityRotateY += clamp(tapX * 1.8, -0.9, 0.9);
            velocityRotateX += clamp(-tapY * 1.4, -0.7, 0.7);
            velocityMoveX += clamp(tapX * 3.2, -1.2, 1.2);
            velocityMoveY += clamp(tapY * 2.2, -0.9, 0.9);
          }
        }

        if (wrapper.releasePointerCapture) {
          try { wrapper.releasePointerCapture(event.pointerId); } catch (error) {}
        }
        releaseHeroPointer();
      };

      wrapper.addEventListener('pointerup', finishPointerInteraction);
      wrapper.addEventListener('pointercancel', finishPointerInteraction);
      wrapper.addEventListener('pointerleave', function (event) {
        if (event.pointerId === activePointerId && dragStarted) {
          finishPointerInteraction(event);
        }
      });

      applyHeroTransform();
    }
  }
})();
