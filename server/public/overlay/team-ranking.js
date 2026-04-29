const pathParts = location.pathname.split("/").filter(Boolean);
const clientId = pathParts[1] || "default";
const rankingList = document.getElementById("rankingList");

let previousKeys = new Set();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function initials(name) {
  return String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function renderAvatar(item) {
  if (item.profileImage) {
    return `<img class="avatar-img" src="${escapeHtml(item.profileImage)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
      <span class="avatar-fallback" style="display:none">${escapeHtml(initials(item.nickname))}</span>`;
  }
  return `<span class="avatar-fallback">${escapeHtml(initials(item.nickname))}</span>`;
}

function renderEmpty() {
  rankingList.innerHTML = `<div class="empty">팀 레벨 데이터 수신 대기 중</div>`;
}

function render(state) {
  const settings = state.settings?.teamRanking || {};
  const items = state.teamRanking || [];
  const layout = settings.layout === "card" ? "card" : "list";
  const fontSize = Math.max(12, Math.min(96, Number(settings.fontSize || 28)));

  document.documentElement.style.setProperty("--ranking-font-size", `${fontSize}px`);
  document.body.dataset.layout = layout;
  rankingList.className = `ranking-list ${layout}`;

  if (!items.length) {
    renderEmpty();
    previousKeys = new Set();
    return;
  }

  const nextKeys = new Set(items.map((item) => String(item.userId || item.uniqueId || item.nickname || item.rank)));
  rankingList.innerHTML = items.map((item) => {
    const key = String(item.userId || item.uniqueId || item.nickname || item.rank);
    const isNew = !previousKeys.has(key);
    return `<article class="rank-item ${isNew ? "is-new" : ""}" data-rank="${item.rank}">
      <div class="rank-badge">${escapeHtml(item.rank)}</div>
      <div class="avatar">${renderAvatar(item)}</div>
      <div class="member">
        <strong>${escapeHtml(item.nickname || item.uniqueId || "익명")}</strong>
        <span>${item.uniqueId ? "@" + escapeHtml(item.uniqueId) : "Team Member"}</span>
      </div>
      <div class="level">
        <span>TEAM LV</span>
        <b>${escapeHtml(item.teamLevel || 0)}</b>
      </div>
    </article>`;
  }).join("");
  previousKeys = nextKeys;
}

async function loadState() {
  const res = await fetch(`/api/state/${encodeURIComponent(clientId)}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const state = await res.json();
  render(state);
}

loadState().catch(renderEmpty);
setInterval(() => loadState().catch(() => {}), 1500);
