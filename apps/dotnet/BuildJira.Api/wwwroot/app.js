const state = {
  projects: [],
  selectedProjectKey: "ATLAS",
  board: null,
  selectedIssueId: null,
  query: "",
  actorId: ""
};

const statusTone = {
  BACKLOG: "neutral",
  TODO: "blue",
  IN_PROGRESS: "amber",
  IN_REVIEW: "purple",
  DONE: "green"
};

const priorityLabel = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

const el = {
  projects: document.querySelector("#projects"),
  breadcrumb: document.querySelector("#breadcrumb"),
  title: document.querySelector("#project-title"),
  metrics: document.querySelector("#metrics"),
  kanban: document.querySelector("#kanban"),
  panel: document.querySelector("#issue-panel"),
  message: document.querySelector("#message"),
  search: document.querySelector("#search"),
  actor: document.querySelector("#actor-select")
};

el.search.addEventListener("input", event => {
  state.query = event.target.value;
  renderBoard();
});

el.actor.addEventListener("change", event => {
  state.actorId = event.target.value;
});

await boot();

async function boot() {
  showMessage("Loading workspace", "state-row");
  try {
    state.projects = await request("/api/projects");
    state.selectedProjectKey = state.projects.find(project => project.key === state.selectedProjectKey)?.key ?? state.projects[0]?.key ?? "ATLAS";
    await loadBoard();
  } catch (error) {
    showMessage(error.message, "error-row");
  }
}

async function loadBoard() {
  state.board = await request(`/api/projects/${state.selectedProjectKey}/board`);
  state.selectedIssueId = state.board.issues[0]?.id ?? null;
  if (!state.actorId) {
    state.actorId = state.board.team[0]?.id ?? "";
  }
  clearMessage();
  render();
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(state.actorId ? { "x-user-id": state.actorId } : {}),
      ...(options.headers ?? {})
    }
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload;
}

function render() {
  renderProjects();
  renderActor();
  renderHeader();
  renderMetrics();
  renderBoard();
}

function renderProjects() {
  el.projects.innerHTML = "";
  for (const project of state.projects) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `project-pill ${project.key === state.selectedProjectKey ? "selected" : ""}`;
    button.innerHTML = `<span>${escapeHtml(project.key)}</span><small>${escapeHtml(project.health.replace("_", " ").toLowerCase())}</small>`;
    button.addEventListener("click", async () => {
      state.selectedProjectKey = project.key;
      await loadBoard();
    });
    el.projects.append(button);
  }
}

function renderActor() {
  if (!state.board) return;
  el.actor.innerHTML = "";
  for (const user of state.board.team) {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.name} (${user.role.replace("_", " ").toLowerCase()})`;
    option.selected = user.id === state.actorId;
    el.actor.append(option);
  }
}

function renderHeader() {
  const project = state.projects.find(item => item.key === state.selectedProjectKey);
  el.breadcrumb.textContent = `Projects / ${project?.key ?? state.selectedProjectKey}`;
  el.title.textContent = project?.name ?? "Project board";
}

function renderMetrics() {
  if (!state.board) return;
  const metrics = [
    ["Issues", state.board.project.issueCount],
    ["Done", state.board.project.doneCount],
    ["Lead", state.board.project.lead.name],
    ["Sprint", state.board.activeSprint?.name ?? "Planning"]
  ];
  el.metrics.innerHTML = metrics.map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("");
}

function renderBoard() {
  if (!state.board) return;
  const normalized = state.query.trim().toLowerCase();
  const issues = normalized
    ? state.board.issues.filter(issue => `${issue.key} ${issue.title} ${issue.assignee?.name ?? ""}`.toLowerCase().includes(normalized))
    : state.board.issues;

  el.kanban.innerHTML = "";
  for (const column of state.board.columns) {
    const columnIssues = issues.filter(issue => issue.status === column.status);
    const section = document.createElement("section");
    section.className = "column";
    section.innerHTML = `
      <div class="column-header">
        <div>
          <h2>${escapeHtml(column.name)}</h2>
          <span>${columnIssues.length} issues</span>
        </div>
        ${column.wipLimit ? `<span class="${columnIssues.length > column.wipLimit ? "wip danger" : "wip"}">${column.wipLimit}</span>` : ""}
      </div>
      <div class="issue-stack"></div>
    `;
    const stack = section.querySelector(".issue-stack");
    for (const issue of columnIssues) {
      stack.append(issueCard(issue));
    }
    el.kanban.append(section);
  }

  renderPanel();
}

function issueCard(issue) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `issue-card ${issue.id === state.selectedIssueId ? "selected" : ""}`;
  button.innerHTML = `
    <div class="issue-card-header">
      <span class="status-dot ${statusTone[issue.status]}"></span>
      <span>${escapeHtml(issue.key)}</span>
      <strong>${escapeHtml(priorityLabel[issue.priority])}</strong>
    </div>
    <h3>${escapeHtml(issue.title)}</h3>
    <div class="issue-meta">
      <span>${escapeHtml(issue.type)}</span>
      <span>${issue.storyPoints ?? 0} pts</span>
      <span>${escapeHtml(issue.assignee?.name ?? "Unassigned")}</span>
    </div>
  `;
  button.addEventListener("click", () => {
    state.selectedIssueId = issue.id;
    renderBoard();
  });
  return button;
}

function renderPanel() {
  const issue = state.board.issues.find(item => item.id === state.selectedIssueId);
  if (!issue) {
    el.panel.className = "issue-panel empty";
    el.panel.textContent = "Select an issue";
    return;
  }

  el.panel.className = "issue-panel";
  el.panel.innerHTML = `
    <div class="panel-heading"><span>${escapeHtml(issue.key)}</span></div>
    <h2>${escapeHtml(issue.title)}</h2>
    <p>${escapeHtml(issue.description ?? "")}</p>
    <label>Status <select data-field="status">${state.board.columns.map(column => option(column.status, column.name, issue.status)).join("")}</select></label>
    <label>Assignee <select data-field="assigneeId"><option value="">Unassigned</option>${state.board.team.map(user => option(user.id, user.name, issue.assignee?.id ?? "")).join("")}</select></label>
    <label>Priority <select data-field="priority">${Object.entries(priorityLabel).map(([value, label]) => option(value, label, issue.priority)).join("")}</select></label>
    <label>Story points <input data-field="storyPoints" type="number" min="0" max="100" value="${issue.storyPoints ?? 0}" /></label>
  `;

  for (const control of el.panel.querySelectorAll("[data-field]")) {
    control.addEventListener("change", () => saveIssue(issue, control));
  }
}

async function saveIssue(issue, control) {
  const field = control.dataset.field;
  const value = field === "storyPoints" ? Number(control.value) : control.value || null;
  try {
    const nextIssue = await request(`/api/issues/${issue.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: value })
    });
    state.board.issues = state.board.issues.map(item => item.id === nextIssue.id ? nextIssue : item);
    state.board.project.doneCount = state.board.issues.filter(item => item.status === "DONE").length;
    state.selectedIssueId = nextIssue.id;
    clearMessage();
    render();
  } catch (error) {
    showMessage(error.message, "error-row");
    renderPanel();
  }
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function showMessage(message, className) {
  el.message.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;
}

function clearMessage() {
  el.message.innerHTML = "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
