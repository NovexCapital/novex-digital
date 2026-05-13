const TOKEN_KEY = "novex-crm-token";
const state = {
  view: "leads",
  search: "",
  records: { leads: [], deals: [], tasks: [], contacts: [] },
  dashboard: {},
  deferredInstall: null
};

const views = {
  leads: {
    label: "Lead",
    fields: [
      ["name", "Name", "text", true],
      ["email", "Email", "email"],
      ["phone", "Phone", "tel"],
      ["company", "Company", "text"],
      ["service", "Service", "text"],
      ["value", "Value", "number"],
      ["priority", "Priority", "select", false, ["normal", "hot"]],
      ["notes", "Notes", "textarea"]
    ],
    actions: ["new", "contacted", "qualified", "won", "lost"]
  },
  deals: {
    label: "Deal",
    fields: [
      ["title", "Title", "text", true],
      ["company", "Company", "text"],
      ["value", "Value", "number"],
      ["stage", "Stage", "select", false, ["qualified", "proposal", "won", "lost"]],
      ["probability", "Probability", "number"],
      ["closeDate", "Close date", "date"],
      ["notes", "Notes", "textarea"]
    ],
    actions: ["qualified", "proposal", "won", "lost"]
  },
  tasks: {
    label: "Task",
    fields: [
      ["title", "Title", "text", true],
      ["relatedType", "Related", "select", false, ["lead", "contact", "deal"]],
      ["relatedId", "Related ID", "text"],
      ["dueAt", "Due", "datetime-local"],
      ["priority", "Priority", "select", false, ["normal", "hot"]],
      ["status", "Status", "select", false, ["open", "done"]],
      ["notes", "Notes", "textarea"]
    ],
    actions: ["open", "done"]
  },
  contacts: {
    label: "Contact",
    fields: [
      ["name", "Name", "text", true],
      ["email", "Email", "email"],
      ["phone", "Phone", "tel"],
      ["company", "Company", "text"],
      ["role", "Role", "text"],
      ["status", "Status", "select", false, ["active", "paused"]],
      ["notes", "Notes", "textarea"]
    ],
    actions: ["active", "paused"]
  }
};

const elements = {
  list: document.querySelector("#recordList"),
  syncStatus: document.querySelector("#syncStatus"),
  statusDot: document.querySelector("#statusDot"),
  searchInput: document.querySelector("#searchInput"),
  installButton: document.querySelector("#installButton"),
  recordDialog: document.querySelector("#recordDialog"),
  recordForm: document.querySelector("#recordForm"),
  recordFields: document.querySelector("#recordFields"),
  dialogTitle: document.querySelector("#dialogTitle"),
  tokenDialog: document.querySelector("#tokenDialog"),
  tokenForm: document.querySelector("#tokenForm"),
  tokenInput: document.querySelector("#tokenInput")
};

function token() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function apiHeaders() {
  const headers = { accept: "application/json", "content-type": "application/json" };
  if (token()) headers.authorization = `Bearer ${token()}`;
  return headers;
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { ...apiHeaders(), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
}

function money(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function relativeTime(value) {
  if (!value) return "";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function metric(id, value) {
  document.querySelector(id).textContent = value;
}

function setStatus(text, mode = "") {
  elements.syncStatus.textContent = text;
  elements.statusDot.className = `status-dot ${mode}`.trim();
}

function currentRecords() {
  const query = state.search.trim().toLowerCase();
  return state.records[state.view].filter((record) => {
    return !query || Object.values(record).join(" ").toLowerCase().includes(query);
  });
}

function primary(record) {
  return record.name || record.title || "Untitled";
}

function secondary(record) {
  return [record.company, record.email, record.phone, record.service].filter(Boolean).join(" - ");
}

function badge(record) {
  return record.status || record.stage || record.priority || "";
}

function renderMetrics() {
  metric("#newLeads", state.dashboard.newLeads || 0);
  metric("#pipelineValue", money(state.dashboard.pipelineValue || 0));
  metric("#openTasks", state.dashboard.openTasks || 0);
  metric("#contactsCount", state.dashboard.contacts || 0);
}

function renderActions(record) {
  const key = state.view === "deals" ? "stage" : "status";
  return views[state.view].actions.map((action) => {
    const active = record[key] === action ? " active" : "";
    return `<button class="mini-button${active}" type="button" data-action="${action}">${escapeHtml(action)}</button>`;
  }).join("");
}

function renderList() {
  renderMetrics();
  const records = currentRecords();

  if (!records.length) {
    elements.list.innerHTML = `<div class="empty">No ${state.view} yet.</div>`;
    return;
  }

  elements.list.innerHTML = records.map((record) => `
    <article class="record-card" data-id="${escapeHtml(record.id)}">
      <header>
        <div>
          <h3>${escapeHtml(primary(record))}</h3>
          <p class="meta">${escapeHtml(secondary(record))}</p>
        </div>
        <span class="badge">${escapeHtml(badge(record))}</span>
      </header>
      <div class="record-facts">
        ${record.value ? `<span>${money(record.value)}</span>` : ""}
        ${record.dueAt ? `<span>Due ${escapeHtml(new Date(record.dueAt).toLocaleString())}</span>` : ""}
        ${record.updatedAt ? `<span>${relativeTime(record.updatedAt)}</span>` : ""}
      </div>
      ${record.notes ? `<p class="note">${escapeHtml(record.notes)}</p>` : ""}
      <div class="record-actions">${renderActions(record)}</div>
    </article>
  `).join("");
}

function fieldMarkup(field) {
  const [name, label, type, required, options = []] = field;

  if (type === "textarea") {
    return `<label>${label}<textarea name="${name}" rows="3"${required ? " required" : ""}></textarea></label>`;
  }

  if (type === "select") {
    return `<label>${label}<select name="${name}"${required ? " required" : ""}>${options.map((option) => `<option value="${option}">${option}</option>`).join("")}</select></label>`;
  }

  return `<label>${label}<input name="${name}" type="${type}"${required ? " required" : ""}></label>`;
}

function openRecordDialog() {
  elements.dialogTitle.textContent = `New ${views[state.view].label}`;
  elements.recordFields.innerHTML = views[state.view].fields.map(fieldMarkup).join("");
  elements.recordDialog.showModal();
}

async function refresh() {
  setStatus("Syncing", "warn");

  try {
    const [dashboard, leads, deals, tasks, contacts] = await Promise.all([
      api("/api/dashboard"),
      api("/api/leads"),
      api("/api/deals"),
      api("/api/tasks"),
      api("/api/contacts")
    ]);

    state.dashboard = dashboard;
    state.records.leads = leads.leads || [];
    state.records.deals = deals.deals || [];
    state.records.tasks = tasks.tasks || [];
    state.records.contacts = contacts.contacts || [];
    setStatus(dashboard.storage?.persistent ? "Synced" : "Local storage", dashboard.storage?.persistent ? "" : "warn");
    renderList();
  } catch (error) {
    setStatus(error.message.includes("Unauthorized") ? "Token required" : error.message, "error");
    renderList();
  }
}

async function saveRecord(values) {
  await api(`/api/${state.view}`, {
    method: "POST",
    body: JSON.stringify(values)
  });
  await refresh();
}

async function patchRecord(id, action) {
  const body = state.view === "deals" ? { id, stage: action } : { id, status: action };
  await api(`/api/${state.view}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
  await refresh();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.deferredInstall = event;
  elements.installButton.hidden = false;
});

elements.installButton.addEventListener("click", async () => {
  if (!state.deferredInstall) return;
  state.deferredInstall.prompt();
  await state.deferredInstall.userChoice;
  state.deferredInstall = null;
});

document.querySelector("#newRecordButton").addEventListener("click", openRecordDialog);
document.querySelector("#syncButton").addEventListener("click", refresh);
document.querySelector("#tokenButton").addEventListener("click", () => {
  elements.tokenInput.value = token();
  elements.tokenDialog.showModal();
});

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderList();
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.view = button.dataset.view;
    renderList();
  });
});

elements.recordForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  await saveRecord(Object.fromEntries(new FormData(elements.recordForm).entries()));
  elements.recordForm.reset();
  elements.recordDialog.close();
});

elements.tokenForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  localStorage.setItem(TOKEN_KEY, elements.tokenInput.value.trim());
  elements.tokenDialog.close();
  refresh();
});

elements.list.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = event.target.closest(".record-card");
  if (!card) return;

  await patchRecord(card.dataset.id, button.dataset.action);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/crm/sw.js").catch(() => {});
}

renderList();
refresh();
