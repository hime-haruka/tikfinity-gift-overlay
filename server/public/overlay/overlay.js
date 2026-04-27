const clientId = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "default");
const giftStack = document.getElementById("giftStack");
const levelStack = document.getElementById("levelStack");
const seen = new Set();
let lastState = null;

function cssVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function applyColors(settings) {
  const g = settings.gift.colors;
  const l = settings.level.colors;
  cssVar("--gift-text", g.text);
  cssVar("--gift-bg", g.background);
  cssVar("--gift-border", g.border);
  cssVar("--gift-grad-from", g.gradientFrom);
  cssVar("--gift-grad-to", g.gradientTo);
  cssVar("--level-text", l.text);
  cssVar("--level-bg", l.background);
  cssVar("--level-border", l.border);
  cssVar("--level-grad-from", l.gradientFrom);
  cssVar("--level-grad-to", l.gradientTo);
}

function img(src, cls, fallback) {
  if (!src) return `<div class="${cls} empty-img">${fallback}</div>`;
  return `<img class="${cls}" src="${escapeAttr(src)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls} empty-img',textContent:'${fallback}'}))" />`;
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeAttr(v) { return escapeHtml(v).replace(/'/g, "&#039;"); }

function renderGift(item, settings) {
  const cls = settings.gift.colors.useGradient ? "gift-card is-gradient" : "gift-card";
  const profile = settings.gift.showProfileImage ? img(item.profileImage, "avatar", "♡") : "";
  const giftImage = settings.gift.showGiftImage ? img(item.giftImage, "gift-img", "🎁") : "";
  const media = profile || giftImage ? `<div class="media-pair">${profile}${giftImage}</div>` : "";
  const giftName = settings.gift.showGiftName ? `<div class="card-sub">${escapeHtml(item.giftName)}</div>` : "";
  const diamonds = settings.gift.showDiamondValue ? `<div class="card-meta">${Number(item.totalCoins || 0).toLocaleString()} diamonds</div>` : "";
  return `<article class="card ${cls}" data-id="${escapeAttr(item.id)}">
    ${media}
    <div class="card-body">
      <div class="card-title">${escapeHtml(item.nickname)} 님의 선물</div>
      ${giftName}
      <div class="card-value">× ${Number(item.count || 1).toLocaleString()}</div>
      ${diamonds}
    </div>
  </article>`;
}

function renderLevel(item, settings) {
  const cls = settings.level.colors.useGradient ? "level-card is-gradient" : "level-card";
  return `<article class="card ${cls}" data-id="${escapeAttr(item.id)}">
    ${img(item.profileImage, "avatar", "★")}
    <div class="card-body">
      <div class="card-title">${escapeHtml(item.nickname)} 님 레벨업!</div>
      <div class="card-sub">Lv.${Number(item.previousLevel || 0)} → Lv.${Number(item.level || 0)}</div>
      <div class="card-meta">멤버 레벨이 상승했어요</div>
    </div>
  </article>`;
}

function updateStack(el, htmlItems) {
  el.innerHTML = htmlItems.join("");
}

async function poll() {
  try {
    const res = await fetch(`/api/state/${encodeURIComponent(clientId)}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    lastState = state;
    applyColors(state.settings);
    updateStack(giftStack, state.gifts.map((x) => renderGift(x, state.settings)));
    updateStack(levelStack, state.levelCards.map((x) => renderLevel(x, state.settings)));
  } catch (err) {
    console.warn("overlay polling failed", err);
  } finally {
    setTimeout(poll, 800);
  }
}

poll();
