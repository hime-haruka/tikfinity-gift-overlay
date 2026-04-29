const pathParts = location.pathname.split("/").filter(Boolean);
const clientId = pathParts[1] || "default";
const rankingList = document.getElementById("rankingList");

let previousKeys = new Set();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function cssValue(value, fallback) {
  const v = String(value || "").trim();
  return v || fallback;
}

function initials(name) {
  return String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function applyRankingColors(settings) {
  const base = settings.level?.colors || settings.gift?.colors || {};
  const superFan = settings.gift?.superFanColor || {};
  const root = document.documentElement;
  root.style.setProperty("--rank-text", cssValue(base.text, "#fffaff"));
  root.style.setProperty("--rank-border", "rgba(255,255,255,.18)");
  root.style.setProperty("--rank-bg", "rgba(0,0,0,.56)");
  root.style.setProperty("--rank-grad-from", "rgba(0,0,0,.18)");
  root.style.setProperty("--rank-grad-to", "rgba(0,0,0,.04)");
  root.style.setProperty("--rank-accent", cssValue(superFan.gradientFrom || superFan.border || base.border || base.gradientTo, "#ffd36a"));
}

function marqueeName(text) {
  const safe = escapeHtml(text || "익명");
  return `<span class="nickname-marquee"><span class="nickname-track"><span class="nickname-main">${safe}</span><span class="nickname-gap" aria-hidden="true"></span><span class="nickname-copy" aria-hidden="true">${safe}</span></span></span>`;
}

function refreshMarquees(root = document) {
  root.querySelectorAll(".nickname-marquee").forEach((el) => {
    const track = el.querySelector(".nickname-track");
    const main = el.querySelector(".nickname-main");
    if (!track || !main) return;

    const available = Math.round(el.clientWidth || 0);
    const textWidth = Math.ceil(main.scrollWidth || 0);
    const key = `${available}:${textWidth}:${main.textContent || ""}`;
    if (el.dataset.key === key) return;
    el.dataset.key = key;

    el.classList.remove("is-overflow");
    track.style.animation = "none";
    track.style.transform = "translateX(0)";
    void track.offsetWidth;

    if (available > 0 && textWidth > available + 2) {
      const gap = 42;
      const distance = textWidth + gap;
      const duration = Math.max(6, Math.min(16, distance / 32));
      el.style.setProperty("--marquee-distance", `${distance}px`);
      el.style.setProperty("--marquee-duration", `${duration}s`);
      el.classList.add("is-overflow");
      track.style.animation = "";
      track.style.transform = "";
    }
  });
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
  const fontSize = Math.max(12, Math.min(48, Number(settings.fontSize || 24)));

  document.documentElement.style.setProperty("--ranking-font-size", `${fontSize}px`);
  document.documentElement.style.setProperty("--card-columns", String(Math.max(1, items.length || 1)));
  applyRankingColors(state.settings || {});
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
        <strong>${marqueeName(item.nickname || "익명")}</strong>
      </div>
      <div class="level">
        <span>LV</span>
        <b>${escapeHtml(item.teamLevel || 0)}</b>
      </div>
    </article>`;
  }).join("");
  previousKeys = nextKeys;
  requestAnimationFrame(() => refreshMarquees(rankingList));
}

async function loadState() {
  const res = await fetch(`/api/state/${encodeURIComponent(clientId)}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const state = await res.json();
  render(state);
}

loadState().catch(renderEmpty);
setInterval(() => loadState().catch(() => {}), 1500);
window.addEventListener("resize", () => requestAnimationFrame(() => refreshMarquees(rankingList)));
