/* Privacy-conscious conversion attribution and optional GA4 loader. */
(function () {
  'use strict';

  var config = window.PMHNP_ANALYTICS || {};
  var measurementId = typeof config.measurementId === 'string' ? config.measurementId.trim() : '';
  var storageKey = 'pmhnp_lead_attribution';
  var successKey = 'pmhnp_form_success';
  var allowedKeys = ['lead_source', 'lead_topic', 'utm_source', 'utm_medium', 'utm_campaign'];

  function readJson(key) {
    try { return JSON.parse(window.sessionStorage.getItem(key) || '{}'); } catch (_) { return {}; }
  }

  function writeJson(key, value) {
    try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function clean(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength || 180);
  }

  var params = new URLSearchParams(window.location.search);
  var attribution = readJson(storageKey);
  allowedKeys.forEach(function (key) {
    if (params.has(key)) attribution[key] = clean(params.get(key), 120);
  });
  if (!attribution.landing_page) attribution.landing_page = clean(window.location.pathname, 180);
  if (!attribution.referrer && document.referrer) attribution.referrer = clean(document.referrer, 300);
  writeJson(storageKey, attribution);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.pmhnpTrack = function (eventName, eventParams) {
    if (!measurementId) return;
    window.gtag('event', eventName, eventParams || {});
  };

  if (/^G-[A-Z0-9]+$/.test(measurementId)) {
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(tag);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true
    });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-conversion-link]');
    if (!link) return;
    window.pmhnpTrack('conversion_cta_click', {
      lead_topic: clean(link.getAttribute('data-lead-topic') || '', 80),
      link_url: clean(link.getAttribute('href') || '', 220),
      page_path: window.location.pathname
    });
  });

  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    Object.keys(attribution).forEach(function (key) {
      var field = form.querySelector('[name="' + key + '"]');
      if (field) field.value = clean(attribution[key], field.name === 'referrer' ? 300 : 180);
    });

    var topicToService = {
      billing: 'full-service',
      denials: 'denials-appeals',
      credentialing: 'credentialing',
      telehealth: 'telehealth',
      'prior-auth': 'prior-auth'
    };
    var topicField = form.querySelector('[name="lead_topic"]');
    var serviceField = form.querySelector('[name="services"]');
    if (topicField && serviceField && !serviceField.value && topicToService[topicField.value]) {
      serviceField.value = topicToService[topicField.value];
    }

    var started = false;
    form.addEventListener('focusin', function () {
      if (started) return;
      started = true;
      window.pmhnpTrack('form_start', {
        form_id: form.id || 'contact-form',
        lead_topic: attribution.lead_topic || 'general',
        page_path: window.location.pathname
      });
    });
  });

  if (document.body && document.body.hasAttribute('data-conversion-success')) {
    var success = readJson(successKey);
    if (success.completed) {
      window.pmhnpTrack('generate_lead', {
        form_id: 'contact-form',
        lead_topic: clean(success.lead_topic || attribution.lead_topic || 'general', 80),
        lead_source: clean(success.lead_source || attribution.lead_source || 'website', 80)
      });
      try { window.sessionStorage.removeItem(successKey); } catch (_) {}
    }
  }
})();
