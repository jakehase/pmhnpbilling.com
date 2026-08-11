/* Privacy-safe lead attribution and optional GA4 loader. */
(function () {
  'use strict';

  var config = window.PMHNP_ANALYTICS || {};
  var measurementId = typeof config.measurementId === 'string' ? config.measurementId.trim() : '';
  var storageKey = 'pmhnp_lead_attribution';
  var successKey = 'pmhnp_form_success';
  var attributionVersion = '2026-08-v2';
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

  function safeUrlPath(value, maxLength) {
    try {
      var url = new URL(value, window.location.origin);
      return clean(url.origin + url.pathname, maxLength || 300);
    } catch (_) {
      return '';
    }
  }

  function classifyReferrer(value) {
    if (!value) return 'direct';
    try {
      var host = new URL(value, window.location.origin).hostname.toLowerCase();
      if (!host || host === window.location.hostname.toLowerCase()) return 'website';
      if (/(^|\.)(google|bing|yahoo|duckduckgo)\./.test(host)) return 'organic-search';
      if (/(^|\.)(chatgpt|openai|perplexity|claude|gemini)\./.test(host)) return 'ai-assistant';
      return 'referral';
    } catch (_) {
      return 'direct';
    }
  }

  function createLeadId() {
    var date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    var random = '';
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        random = window.crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      } else if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        var bytes = new Uint8Array(8);
        window.crypto.getRandomValues(bytes);
        random = Array.prototype.map.call(bytes, function (byte) {
          return byte.toString(16).padStart(2, '0');
        }).join('').slice(0, 12);
      }
    } catch (_) {}
    if (!random) random = Math.random().toString(36).slice(2, 14).padEnd(12, '0');
    return 'web-' + date + '-' + random;
  }

  function setField(form, name, value, maxLength) {
    var field = form.querySelector('[name="' + name + '"]');
    if (field) field.value = clean(value, maxLength || 180);
  }

  var params = new URLSearchParams(window.location.search);
  var attribution = readJson(storageKey);
  allowedKeys.forEach(function (key) {
    if (params.has(key)) attribution[key] = clean(params.get(key), 120);
  });
  if (!attribution.landing_page) attribution.landing_page = clean(window.location.pathname, 180);
  if (!attribution.referrer && document.referrer) attribution.referrer = safeUrlPath(document.referrer, 300);
  if (!attribution.lead_source) {
    attribution.lead_source = attribution.utm_source ? 'campaign' : classifyReferrer(document.referrer);
  }
  attribution.attribution_version = attributionVersion;
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

  window.pmhnpPrepareLeadSubmission = function (form) {
    if (!form) return {};
    var leadIdField = form.querySelector('[name="lead_id"]');
    var leadId = leadIdField && leadIdField.value ? clean(leadIdField.value, 80) : createLeadId();
    var submissionType = params.get('lead_test') === '1' ? 'test' : 'prospect';
    setField(form, 'lead_id', leadId, 80);
    setField(form, 'submitted_at', new Date().toISOString(), 40);
    setField(form, 'submission_type', submissionType, 20);
    setField(form, 'attribution_version', attributionVersion, 40);
    setField(form, 'landing_page', attribution.landing_page || window.location.pathname, 180);
    setField(form, 'referrer', attribution.referrer || '', 300);
    allowedKeys.forEach(function (key) {
      setField(form, key, attribution[key] || '', 120);
    });
    return {
      lead_id: leadId,
      submission_type: submissionType,
      attribution_version: attributionVersion,
      lead_topic: clean((form.querySelector('[name="lead_topic"]') || {}).value || 'general', 80),
      lead_source: clean((form.querySelector('[name="lead_source"]') || {}).value || 'website', 80)
    };
  };

  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    window.pmhnpPrepareLeadSubmission(form);

    var topicToService = {
      billing: 'full-service',
      denials: 'denials-appeals',
      credentialing: 'credentialing',
      telehealth: 'telehealth',
      'prior-auth': 'prior-auth',
      'practice-launch': 'practice-launch'
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
        lead_topic: clean((topicField || {}).value || 'general', 80),
        page_path: window.location.pathname
      });
    });
  });

  if (document.body && document.body.hasAttribute('data-conversion-success')) {
    var success = readJson(successKey);
    if (success.completed) {
      var eventParams = {
        form_id: 'contact-form',
        lead_id: clean(success.lead_id || '', 80),
        lead_topic: clean(success.lead_topic || attribution.lead_topic || 'general', 80),
        lead_source: clean(success.lead_source || attribution.lead_source || 'website', 80),
        attribution_version: clean(success.attribution_version || attributionVersion, 40)
      };
      if (success.submission_type === 'test') {
        window.pmhnpTrack('form_test_success', eventParams);
      } else if (success.submission_type === 'prospect') {
        window.pmhnpTrack('generate_lead', eventParams);
      } else {
        window.pmhnpTrack('form_unclassified_success', eventParams);
      }
      try { window.sessionStorage.removeItem(successKey); } catch (_) {}
    }
  }
})();
