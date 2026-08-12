// PMHNP homepage interactions
(function () {
  var prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  window.toggleMenu = function toggleMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (toggle) {
      var isOpen = toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    }
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
  var isHomepageMotion = !!(document.body && document.body.id === 'top' && document.querySelector('.hero-wrapper'));
  var allowContinuousHomepageMotion = isHomepageMotion || !prefersReducedMotion;
  if (isHomepageMotion) {
    document.documentElement.classList.add('homepage-scroll-motion');
  }

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

  var letterWaveHeading = document.querySelector('[data-letter-wave]');
  if (letterWaveHeading && !prefersReducedMotion) {
    var letterWaveText = (letterWaveHeading.textContent || '').trim();
    var letterWaveWords = letterWaveText.split(/\s+/);
    var letterWaveIndex = 0;
    letterWaveHeading.textContent = '';
    letterWaveHeading.setAttribute('aria-label', letterWaveText);
    letterWaveWords.forEach(function (word, wordIndex) {
      var wordElement = document.createElement('span');
      wordElement.className = 'letter-wave__word';
      wordElement.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach(function (letter) {
        var letterElement = document.createElement('span');
        letterElement.className = 'letter-wave__char';
        letterElement.style.setProperty('--letter-index', String(letterWaveIndex));
        letterElement.textContent = letter;
        wordElement.appendChild(letterElement);
        letterWaveIndex += 1;
      });
      letterWaveHeading.appendChild(wordElement);
      if (wordIndex < letterWaveWords.length - 1) {
        letterWaveHeading.appendChild(document.createTextNode(' '));
      }
    });
    letterWaveHeading.classList.add('letter-wave--prepared');

    var letterWaveReplayDelay = 7000;
    var letterWaveHasPlayed = false;
    var letterWaveIsVisible = false;
    var letterWaveLeftAt = 0;
    var playLetterWave = function (restart) {
      if (!restart && letterWaveHeading.classList.contains('is-animated')) return;
      if (restart) {
        letterWaveHeading.classList.remove('is-animated');
        void letterWaveHeading.offsetWidth;
      }
      window.requestAnimationFrame(function () {
        letterWaveHeading.classList.add('is-animated');
      });
      letterWaveHasPlayed = true;
    };
    if ('IntersectionObserver' in window) {
      var letterWaveObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var isVisible = entry.intersectionRatio >= 0.45;
          if (isVisible && !letterWaveIsVisible) {
            var wasAwayLongEnough = letterWaveLeftAt > 0
              && Date.now() - letterWaveLeftAt >= letterWaveReplayDelay;
            playLetterWave(letterWaveHasPlayed && wasAwayLongEnough);
            letterWaveLeftAt = 0;
          } else if (!isVisible && letterWaveIsVisible) {
            letterWaveLeftAt = Date.now();
          }
          letterWaveIsVisible = isVisible;
        });
      }, {
        threshold: [0, 0.45],
        rootMargin: '0px 0px -8% 0px'
      });
      letterWaveObserver.observe(letterWaveHeading);
    } else {
      playLetterWave(false);
    }
  }

  {
    if (allowContinuousHomepageMotion) {
      var motionSections = Array.prototype.slice.call(document.querySelectorAll([
      '[data-has-orbs="true"]',
      '.motion-hero-section',
      '.why-work-section',
      '.offer-section',
      '.hero-wrapper',
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

  }

  var leadForm = document.querySelector('form[data-lead-form]');
  if (leadForm) {
    var topicField = leadForm.querySelector('[name="lead_topic"]');
    var formStatus = leadForm.querySelector('.form-status');
    var submitButton = leadForm.querySelector('[type="submit"]');

    leadForm.addEventListener('submit', function (event) {
      if (leadForm.dataset.submitting === 'true') {
        event.preventDefault();
        return;
      }
      if (!window.fetch || !window.FormData) return;

      event.preventDefault();
      var submissionMeta = window.pmhnpPrepareLeadSubmission
        ? window.pmhnpPrepareLeadSubmission(leadForm)
        : {
            lead_id: (leadForm.querySelector('[name="lead_id"]') || {}).value || '',
            submission_type: (leadForm.querySelector('[name="submission_type"]') || {}).value || 'prospect',
            attribution_version: (leadForm.querySelector('[name="attribution_version"]') || {}).value || '',
            lead_topic: topicField ? topicField.value : 'general',
            lead_source: (leadForm.querySelector('[name="lead_source"]') || {}).value || 'website'
          };

      leadForm.dataset.submitting = 'true';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending…';
      }
      if (formStatus) {
        formStatus.textContent = 'Sending your message securely…';
        formStatus.classList.remove('form-status--error');
      }
      if (window.pmhnpTrack) {
        window.pmhnpTrack('form_submit_attempt', {
          form_id: leadForm.id || 'contact-form',
          lead_topic: submissionMeta.lead_topic,
          submission_type: submissionMeta.submission_type
        });
      }

      window.fetch(leadForm.action, {
        method: 'POST',
        body: new FormData(leadForm),
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (!response.ok) throw new Error('Formspree rejected the submission with status ' + response.status);
        if (window.pmhnpTrack) {
          window.pmhnpTrack('form_submit_success', {
            form_id: leadForm.id || 'contact-form',
            lead_topic: submissionMeta.lead_topic,
            submission_type: submissionMeta.submission_type
          });
        }
        try {
          window.sessionStorage.setItem('pmhnp_form_success', JSON.stringify({
            completed: true,
            accepted_at: new Date().toISOString(),
            lead_id: submissionMeta.lead_id,
            submission_type: submissionMeta.submission_type,
            attribution_version: submissionMeta.attribution_version,
            lead_topic: submissionMeta.lead_topic,
            lead_source: submissionMeta.lead_source
          }));
        } catch (_) {}
        window.location.assign('/thank-you.html');
      }).catch(function () {
        leadForm.dataset.submitting = 'false';
        if (window.pmhnpTrack) {
          window.pmhnpTrack('form_submit_error', {
            form_id: leadForm.id || 'contact-form',
            lead_topic: submissionMeta.lead_topic,
            submission_type: submissionMeta.submission_type
          });
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Request a billing-fit review';
        }
        if (formStatus) {
          formStatus.textContent = 'Your message did not send. Please check your connection and try again.';
          formStatus.classList.add('form-status--error');
        }
      });
    });
  }
})();

// Tactile claim-story sequence for the canonical homepage.
(function () {
  var card = document.querySelector('[data-claim-story]');
  var visual = document.querySelector('.claim-story-visual');
  var replay = document.querySelector('.claim-story-replay');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!card || !visual) return;

  var hasPlayed = false;
  var play = function () {
    if (reduce) {
      card.classList.add('is-story-active', 'is-story-complete');
      hasPlayed = true;
      return;
    }
    card.classList.remove('is-story-active', 'is-story-complete');
    void card.offsetWidth;
    window.requestAnimationFrame(function () {
      card.classList.add('is-story-active');
      window.setTimeout(function () { card.classList.add('is-story-complete'); }, 3700);
    });
    hasPlayed = true;
  };

  if ('IntersectionObserver' in window && !reduce) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !hasPlayed) {
          play();
          observer.disconnect();
        }
      });
    }, { threshold: .34 });
    observer.observe(card);
  } else {
    play();
  }

  if (replay) replay.addEventListener('click', play);

  if (!reduce && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    visual.addEventListener('pointermove', function (event) {
      var rect = visual.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = ((event.clientX - rect.left) / rect.width - .5) * 8;
      var y = ((event.clientY - rect.top) / rect.height - .5) * 7;
      visual.style.setProperty('--story-parallax-x', x.toFixed(2) + 'px');
      visual.style.setProperty('--story-parallax-y', y.toFixed(2) + 'px');
    });
    visual.addEventListener('pointerleave', function () {
      visual.style.setProperty('--story-parallax-x', '0px');
      visual.style.setProperty('--story-parallax-y', '0px');
    });
  }
})();
