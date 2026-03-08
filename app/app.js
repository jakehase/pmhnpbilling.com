const CLIENT_TOKEN_KEY = "pmhnp_client_access_token";
const CLIENT_API_BASE_KEY = "pmhnp_client_api_base";

const FALLBACK_SNAPSHOT = {
  generated_at: new Date().toISOString(),
  source: { type: "demo-fallback", run_id: "demo_run", finding_count: 0 },
  truths: {
    live_tebra_oauth: false,
    live_client_auth_provisioning: false,
    claim_auto_submission: false,
    pilot_manual_connection_request: true,
    local_onboarding_packet_builder: true
  },
  dashboard: {
    today_priorities: [
      {
        title: "Authorization Follow-up",
        severity: "high",
        route_to: "authorization_team",
        claim_ref: "claim_demo001",
        recommendation: "Confirm active authorization date range before submit."
      }
    ],
    claims_at_risk: [
      {
        claim_ref: "claim_demo001",
        highest_severity: "high",
        finding_count: 1,
        categories: ["authorization"],
        recommended_next_step: "Confirm active authorization date range before submit."
      }
    ],
    needs_review: []
  },
  ask_agent: {
    suggested_prompts: [
      "What should my biller do first this morning?",
      "What is the highest-risk claim in this dashboard?",
      "What is ready now vs pilot-only in Connect Tebra?"
    ]
  }
};

function severityPillClass(severity) {
  return `severity-pill severity-${String(severity || "low").toLowerCase()}`;
}

function toLocalDate(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getSavedAccessConfig() {
  return {
    token: (window.localStorage.getItem(CLIENT_TOKEN_KEY) || "").trim(),
    apiBase: (window.localStorage.getItem(CLIENT_API_BASE_KEY) || "").trim()
  };
}

function saveAccessConfig(config) {
  if (config.token && config.token.trim()) {
    window.localStorage.setItem(CLIENT_TOKEN_KEY, config.token.trim());
  } else {
    window.localStorage.removeItem(CLIENT_TOKEN_KEY);
  }

  if (config.apiBase && config.apiBase.trim()) {
    window.localStorage.setItem(CLIENT_API_BASE_KEY, config.apiBase.trim());
  } else {
    window.localStorage.removeItem(CLIENT_API_BASE_KEY);
  }
}

function renderAccessStatus(message) {
  const status = document.getElementById("clientAccessStatus");
  status.textContent = message;
}

function wireAccessForm() {
  const form = document.getElementById("clientAccessForm");
  const tokenInput = document.getElementById("clientAccessToken");
  const apiBaseInput = document.getElementById("clientApiBase");
  const clearBtn = document.getElementById("clearClientAccessBtn");

  const current = getSavedAccessConfig();
  tokenInput.value = current.token;
  apiBaseInput.value = current.apiBase;

  if (current.token) {
    renderAccessStatus("Secure token saved. This app will try live dashboard mode first.");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const token = tokenInput.value.trim();
    const apiBase = apiBaseInput.value.trim();

    saveAccessConfig({ token, apiBase });
    renderAccessStatus(token ? "Secure access saved. Reloading live dashboard..." : "No secure token saved. Using local snapshot mode.");
    window.location.reload();
  });

  clearBtn.addEventListener("click", () => {
    saveAccessConfig({ token: "", apiBase: "" });
    tokenInput.value = "";
    apiBaseInput.value = "";
    renderAccessStatus("Secure token cleared. Using local snapshot mode.");
    window.location.reload();
  });
}

function renderPriorities(snapshot) {
  const list = document.getElementById("prioritiesList");
  list.innerHTML = "";

  if (!snapshot.dashboard.today_priorities.length) {
    list.innerHTML = `<li class="stack-item">No priorities loaded.</li>`;
    return;
  }

  snapshot.dashboard.today_priorities.forEach((priority) => {
    const item = document.createElement("li");
    item.className = "stack-item";
    item.innerHTML = `
      <p class="item-title">
        <span class="${severityPillClass(priority.severity)}">${priority.severity}</span>
        ${priority.title}
      </p>
      <p class="item-meta">${priority.claim_ref} · Route: ${priority.route_to}</p>
      <p class="item-recommendation">${priority.recommendation}</p>
    `;
    list.appendChild(item);
  });
}

function renderNeedsReview(snapshot) {
  const list = document.getElementById("needsReviewList");
  list.innerHTML = "";

  if (!snapshot.dashboard.needs_review.length) {
    list.innerHTML = `<li class="stack-item">No open human-review items in this snapshot.</li>`;
    return;
  }

  snapshot.dashboard.needs_review.forEach((item) => {
    const li = document.createElement("li");
    li.className = "stack-item";
    li.innerHTML = `
      <p class="item-title"><span class="${severityPillClass(item.severity)}">${item.severity}</span>${item.claim_ref}</p>
      <p class="item-meta">Queue: ${item.status} · Route: ${item.route_to}</p>
      <p class="item-meta">SLA due: ${toLocalDate(item.sla_due_at)}</p>
    `;
    list.appendChild(li);
  });
}

function renderClaims(snapshot) {
  const body = document.getElementById("claimsTableBody");
  body.innerHTML = "";

  if (!snapshot.dashboard.claims_at_risk.length) {
    body.innerHTML = `<tr><td colspan="5">No claim risk rows available.</td></tr>`;
    return;
  }

  snapshot.dashboard.claims_at_risk.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.claim_ref}</td>
      <td><span class="${severityPillClass(row.highest_severity)}">${row.highest_severity}</span></td>
      <td>${row.finding_count}</td>
      <td>${row.categories.join(", ")}</td>
      <td>${row.recommended_next_step}</td>
    `;
    body.appendChild(tr);
  });
}

function answerQuestion(question, snapshot) {
  const normalized = question.trim().toLowerCase();
  const top = snapshot.dashboard.today_priorities[0];
  const openReviewCount = snapshot.dashboard.needs_review.length;

  if (!normalized) {
    return "Please enter a question first.";
  }

  if (normalized.includes("first") || normalized.includes("priority") || normalized.includes("morning")) {
    if (!top) return "No current priorities available in this snapshot.";

    return [
      `Start with ${top.title} (${top.severity}) on ${top.claim_ref}.`,
      `Why: ${top.recommendation}`,
      `Route this to: ${top.route_to}.`,
      "Reminder: keep actions in draft mode until human review is complete."
    ].join("\n");
  }

  if (normalized.includes("highest") || normalized.includes("risk")) {
    const risk = snapshot.dashboard.claims_at_risk[0];
    if (!risk) return "No claims-at-risk records available.";
    return [
      `Highest-risk claim: ${risk.claim_ref} (${risk.highest_severity}).`,
      `Findings: ${risk.finding_count}. Categories: ${risk.categories.join(", ")}.`,
      `Recommended next step: ${risk.recommended_next_step}`
    ].join("\n");
  }

  if (normalized.includes("needs review") || normalized.includes("review")) {
    return `Needs Review currently has ${openReviewCount} open human-review item(s). Prioritize critical/high severity before medium.`;
  }

  if (normalized.includes("tebra") || normalized.includes("onboard") || normalized.includes("connect")) {
    return [
      "Connect Tebra status:",
      "• Working now: onboarding intake + local packet generation + pilot-assisted connection requests.",
      "• Not yet live: direct in-app Tebra OAuth.",
      "• Safety: no automatic claim submission from this app shell."
    ].join("\n");
  }

  if (snapshot.ask_agent.top_finding_preview) {
    const preview = snapshot.ask_agent.top_finding_preview;
    return [
      preview.what_happened,
      `Why it matters: ${preview.why_it_matters}`,
      `Next steps: ${preview.recommended_next_steps.join("; ")}`,
      `Confidence: ${preview.confidence}. Uncertainty: ${preview.main_uncertainty}`
    ].join("\n");
  }

  return "I can summarize priorities, claims at risk, needs review, or Connect Tebra readiness for this snapshot.";
}

function renderPrompts(snapshot) {
  const container = document.getElementById("suggestedPrompts");
  const questionInput = document.getElementById("agentQuestion");
  container.innerHTML = "";

  (snapshot.ask_agent.suggested_prompts || []).forEach((prompt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = prompt;
    btn.addEventListener("click", () => {
      questionInput.value = prompt;
      questionInput.focus();
    });
    container.appendChild(btn);
  });
}

function wireAskForm(snapshot) {
  const form = document.getElementById("askAgentForm");
  const questionInput = document.getElementById("agentQuestion");
  const responseEl = document.getElementById("agentResponse");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    responseEl.textContent = answerQuestion(questionInput.value, snapshot);
  });
}

function renderSourceLine(snapshot) {
  const sourceLine = document.getElementById("dataSourceLine");
  let sourceType = "demo fallback";

  if (snapshot.source.type === "pmhnp-denial-copilot-state") {
    sourceType = "local backend snapshot";
  } else if (snapshot.source.type === "operational-api-client-live") {
    sourceType = "live client portal";
  }

  sourceLine.textContent = `Mode: ${sourceType} · Run: ${snapshot.source.run_id} · Findings: ${snapshot.source.finding_count} · Generated: ${toLocalDate(snapshot.generated_at)}`;
}

async function loadLiveSnapshot() {
  const { token, apiBase } = getSavedAccessConfig();
  if (!token) return null;

  const base = apiBase || window.location.origin;
  const snapshotUrl = new URL("/client/snapshot", base).toString();

  const response = await fetch(snapshotUrl, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`live snapshot failed (${response.status})`);
  }

  const payload = await response.json();
  if (!payload || !payload.dashboard) {
    throw new Error("live snapshot format invalid");
  }

  return payload;
}

async function loadSnapshot() {
  try {
    const live = await loadLiveSnapshot();
    if (live) {
      renderAccessStatus("Live secure access connected.");
      return live;
    }
  } catch (_error) {
    renderAccessStatus("Secure token found, but live dashboard did not load. Showing local snapshot fallback.");
  }

  try {
    const response = await fetch("./data/dashboard-snapshot.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`snapshot fetch failed (${response.status})`);
    }

    const payload = await response.json();
    if (!payload || !payload.dashboard) {
      throw new Error("snapshot format invalid");
    }

    return payload;
  } catch (_error) {
    return FALLBACK_SNAPSHOT;
  }
}

async function bootstrap() {
  wireAccessForm();

  const snapshot = await loadSnapshot();
  renderSourceLine(snapshot);
  renderPriorities(snapshot);
  renderNeedsReview(snapshot);
  renderClaims(snapshot);
  renderPrompts(snapshot);
  wireAskForm(snapshot);

  document.getElementById("reloadSnapshotBtn").addEventListener("click", () => {
    window.location.reload();
  });
}

bootstrap();
