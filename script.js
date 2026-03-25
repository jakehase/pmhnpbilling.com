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
  var canEnhanceReveals = !prefersReducedMotion && 'IntersectionObserver' in window;
  var isHomepageMotion = !!(document.body && document.body.id === 'top' && document.querySelector('.hero-wrapper--spheres-luxe'));
  if (revealItems.length) {
    if (isHomepageMotion) {
      revealItems.forEach(function (item) { item.classList.add('is-in-view'); });
    } else if (canEnhanceReveals) {
      document.documentElement.classList.add('js-motion-ready');
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          var target = entry.target;
          var delay = Number(target.getAttribute('data-reveal-delay') || 0);
          if (entry.isIntersecting) {
            window.setTimeout(function () {
              target.classList.add('is-in-view');
              observer.unobserve(target);
            }, delay);
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

  {
    if (!prefersReducedMotion) {
      var motionSections = Array.prototype.slice.call(document.querySelectorAll([
      '[data-has-orbs="true"]',
      '.motion-hero-section',
      '.why-work-section',
      '.offer-section',
      '.hero-wrapper--spheres-luxe',
      '.services',
      '.about',
      '.faq',
      '.pilot-preview',
      '.trust',
      '.testimonial',
      '.contact',
      '.site-footer'
    ].join(', ')));

    var motionFrame = 0;
    var updateMotion = function () {
      motionFrame = 0;
      var viewportHeight = window.innerHeight || 1;
      var viewportCenter = viewportHeight / 2;
      motionSections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var sectionCenter = rect.top + (rect.height / 2);
        var travelRange = Math.max(1, (viewportHeight / 2) + (rect.height / 2));
        var signedProgress = (sectionCenter - viewportCenter) / travelRange;
        signedProgress = Math.max(-1, Math.min(1, signedProgress));
        var intensity = 1 - Math.min(1, Math.abs(signedProgress));
        section.style.setProperty('--scroll-progress', signedProgress.toFixed(3));
        section.style.setProperty('--scroll-intensity', intensity.toFixed(3));
      });
    };
    var scheduleMotionUpdate = function () {
      if (motionFrame) return;
      motionFrame = window.requestAnimationFrame(updateMotion);
    };
    updateMotion();
    window.addEventListener('scroll', scheduleMotionUpdate, { passive: true });
    window.addEventListener('resize', scheduleMotionUpdate);

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
    }

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
      var lastHeroBurstAt = 0;

      var clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
      };

      var applyHeroTransform = function () {
        var rotateX = hoverRotateX + interactiveRotateX;
        var rotateY = hoverRotateY + interactiveRotateY;
        var moveX = hoverMoveX + interactiveMoveX;
        var moveY = hoverMoveY + interactiveMoveY;
        var energy = clamp(
          (Math.abs(velocityRotateX) + Math.abs(velocityRotateY) + Math.abs(velocityMoveX * 0.35) + Math.abs(velocityMoveY * 0.35) + Math.abs(interactiveRotateX * 0.04) + Math.abs(interactiveRotateY * 0.04)) / 6,
          0,
          0.85
        );

        heroLuxeField.style.transform = 'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translate3d(' + moveX.toFixed(2) + 'px, ' + moveY.toFixed(2) + 'px, 0)';
        wrapper.style.setProperty('--hero-orb-tilt-x', (rotateX * 1.45).toFixed(2) + 'deg');
        wrapper.style.setProperty('--hero-orb-tilt-y', (rotateY * 1.5).toFixed(2) + 'deg');
        wrapper.style.setProperty('--hero-orb-drift-x', (moveX * 1.65).toFixed(2) + 'px');
        wrapper.style.setProperty('--hero-orb-drift-y', (moveY * 1.4).toFixed(2) + 'px');
        wrapper.style.setProperty('--hero-ring-spin', (rotateY * 0.8).toFixed(2) + 'deg');
        wrapper.style.setProperty('--hero-shadow-pulse', (energy * 0.18).toFixed(3));
        wrapper.style.setProperty('--hero-orb-energy', energy.toFixed(3));
      };

      var tickHeroMotion = function () {
        rafId = 0;
        if (activePointerId === null) {
          interactiveRotateX += velocityRotateX;
          interactiveRotateY += velocityRotateY;
          interactiveMoveX += velocityMoveX;
          interactiveMoveY += velocityMoveY;

          velocityRotateX *= 0.95;
          velocityRotateY *= 0.95;
          velocityMoveX *= 0.94;
          velocityMoveY *= 0.94;

          interactiveRotateX *= 0.978;
          interactiveRotateY *= 0.978;
          interactiveMoveX *= 0.958;
          interactiveMoveY *= 0.958;
        }

        interactiveRotateX = clamp(interactiveRotateX, -26, 26);
        interactiveRotateY = clamp(interactiveRotateY, -34, 34);
        interactiveMoveX = clamp(interactiveMoveX, -42, 42);
        interactiveMoveY = clamp(interactiveMoveY, -28, 28);

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
        hoverRotateY = -3.5 + (x * 7);
        hoverRotateX = 2.4 - (y * 4.8);
        hoverMoveX = (x - 0.5) * 14;
        hoverMoveY = (y - 0.5) * 9;
        applyHeroTransform();
      };

      var interactionMode = '';

      var clearHeroInteraction = function () {
        activePointerId = null;
        interactionMode = '';
        dragStarted = false;
        wrapper.classList.remove('is-dragging');
        ensureHeroAnimation();
      };

      var beginHeroInteraction = function (clientX, clientY, mode) {
        interactionMode = mode;
        startPointerX = lastPointerX = clientX;
        startPointerY = lastPointerY = clientY;
        dragStarted = false;
        velocityRotateX = 0;
        velocityRotateY = 0;
        velocityMoveX = 0;
        velocityMoveY = 0;
        hoverRotateX = 0;
        hoverRotateY = 0;
        hoverMoveX = 0;
        hoverMoveY = 0;
        ensureHeroAnimation();
      };

      var nudgeHeroFromPoint = function (clientX, clientY, strength) {
        var rect = wrapper.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var tapX = (clientX - rect.left) / rect.width - 0.5;
        var tapY = (clientY - rect.top) / rect.height - 0.5;
        var factor = strength || 1;

        interactiveRotateY = clamp(interactiveRotateY + tapX * 9.5 * factor, -34, 34);
        interactiveRotateX = clamp(interactiveRotateX - tapY * 7.2 * factor, -26, 26);
        interactiveMoveX = clamp(interactiveMoveX + tapX * 15 * factor, -42, 42);
        interactiveMoveY = clamp(interactiveMoveY + tapY * 10 * factor, -28, 28);

        velocityRotateY += clamp(tapX * 4.2 * factor, -2.8 * factor, 2.8 * factor);
        velocityRotateX += clamp(-tapY * 3.1 * factor, -2.1 * factor, 2.1 * factor);
        velocityMoveX += clamp(tapX * 7.5 * factor, -4.2 * factor, 4.2 * factor);
        velocityMoveY += clamp(tapY * 5.2 * factor, -3.2 * factor, 3.2 * factor);

        lastHeroBurstAt = Date.now();
        applyHeroTransform();
        ensureHeroAnimation();
      };

      var moveHeroInteraction = function (clientX, clientY, mode, event) {
        if (interactionMode !== mode) return false;

        var totalDx = clientX - startPointerX;
        var totalDy = clientY - startPointerY;
        if (!dragStarted) {
          var threshold = mode === 'touch' ? 3 : 5;
          if (Math.abs(totalDx) < threshold && Math.abs(totalDy) < threshold) return false;
          if (mode === 'touch' && Math.abs(totalDy) > Math.abs(totalDx) * 0.92 && Math.abs(totalDy) > 8) {
            clearHeroInteraction();
            return false;
          }
          dragStarted = true;
          wrapper.classList.add('is-dragging');
        }

        if (mode === 'touch' && event && event.cancelable) {
          event.preventDefault();
        }

        var dx = clientX - lastPointerX;
        var dy = clientY - lastPointerY;
        lastPointerX = clientX;
        lastPointerY = clientY;

        var rotateFactorX = mode === 'touch' ? 0.34 : 0.26;
        var rotateFactorY = mode === 'touch' ? 0.28 : 0.20;
        var moveFactorX = mode === 'touch' ? 0.46 : 0.34;
        var moveFactorY = mode === 'touch' ? 0.24 : 0.18;
        var velocityFactorRotateY = mode === 'touch' ? 0.12 : 0.085;
        var velocityFactorRotateX = mode === 'touch' ? 0.09 : 0.062;
        var velocityFactorMoveX = mode === 'touch' ? 0.19 : 0.14;
        var velocityFactorMoveY = mode === 'touch' ? 0.10 : 0.075;

        interactiveRotateY = clamp(interactiveRotateY + dx * rotateFactorX, -34, 34);
        interactiveRotateX = clamp(interactiveRotateX - dy * rotateFactorY, -26, 26);
        interactiveMoveX = clamp(interactiveMoveX + dx * moveFactorX, -42, 42);
        interactiveMoveY = clamp(interactiveMoveY + dy * moveFactorY, -28, 28);

        velocityRotateY = dx * velocityFactorRotateY;
        velocityRotateX = -dy * velocityFactorRotateX;
        velocityMoveX = dx * velocityFactorMoveX;
        velocityMoveY = dy * velocityFactorMoveY;

        applyHeroTransform();
        return true;
      };

      var finishHeroInteraction = function (clientX, clientY, mode, shouldNudge, strength) {
        if (interactionMode !== mode) return;
        if (!dragStarted && shouldNudge) {
          nudgeHeroFromPoint(clientX, clientY, strength || 1);
        }
        clearHeroInteraction();
      };

      wrapper.addEventListener('mousemove', function (event) {
        if (interactionMode) return;
        updateHoverState(event.clientX, event.clientY);
      });

      wrapper.addEventListener('mouseleave', function () {
        if (interactionMode) return;
        hoverRotateX = 0;
        hoverRotateY = 0;
        hoverMoveX = 0;
        hoverMoveY = 0;
        ensureHeroAnimation();
      });

      wrapper.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'touch') return;
        if (event.target && event.target.closest('a, button, input, textarea, select')) return;
        activePointerId = event.pointerId;
        pointerType = event.pointerType || 'pointer';
        beginHeroInteraction(event.clientX, event.clientY, 'pointer');
        if (wrapper.setPointerCapture) {
          try { wrapper.setPointerCapture(event.pointerId); } catch (error) {}
        }
      });

      wrapper.addEventListener('pointermove', function (event) {
        if (interactionMode !== 'pointer' || event.pointerId !== activePointerId) return;
        moveHeroInteraction(event.clientX, event.clientY, 'pointer', event);
      });

      var finishPointerInteraction = function (event, shouldNudge) {
        if (interactionMode !== 'pointer' || event.pointerId !== activePointerId) return;
        if (wrapper.releasePointerCapture) {
          try { wrapper.releasePointerCapture(event.pointerId); } catch (error) {}
        }
        finishHeroInteraction(event.clientX, event.clientY, 'pointer', shouldNudge !== false, 1);
      };

      wrapper.addEventListener('pointerup', function (event) {
        finishPointerInteraction(event, true);
      });
      wrapper.addEventListener('pointercancel', function (event) {
        finishPointerInteraction(event, false);
      });
      wrapper.addEventListener('pointerleave', function (event) {
        if (interactionMode === 'pointer' && event.pointerId === activePointerId && dragStarted) {
          finishPointerInteraction(event, false);
        }
      });

      wrapper.addEventListener('touchstart', function (event) {
        if (!event.changedTouches || !event.changedTouches.length) return;
        if (event.target && event.target.closest('a, button, input, textarea, select')) return;
        var touch = event.changedTouches[0];
        activePointerId = 'touch';
        pointerType = 'touch';
        beginHeroInteraction(touch.clientX, touch.clientY, 'touch');
      }, { passive: true });

      wrapper.addEventListener('touchmove', function (event) {
        if (interactionMode !== 'touch') return;
        var touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
        if (!touch) return;
        moveHeroInteraction(touch.clientX, touch.clientY, 'touch', event);
      }, { passive: false });

      wrapper.addEventListener('touchend', function (event) {
        if (interactionMode !== 'touch') return;
        var touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;
        finishHeroInteraction(touch.clientX, touch.clientY, 'touch', true, 1.35);
      }, { passive: true });

      wrapper.addEventListener('touchcancel', function (event) {
        if (interactionMode !== 'touch') return;
        var touch = event.changedTouches && event.changedTouches[0];
        if (touch) {
          finishHeroInteraction(touch.clientX, touch.clientY, 'touch', false, 1);
        } else {
          clearHeroInteraction();
        }
      }, { passive: true });

      wrapper.addEventListener('click', function (event) {
        if (event.target && event.target.closest('a, button, input, textarea, select')) return;
        if (Date.now() - lastHeroBurstAt < 700) return;
        nudgeHeroFromPoint(event.clientX, event.clientY, 2.1);
      });

      applyHeroTransform();
    }
  }
})();
