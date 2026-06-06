const parts = location.pathname.split("/").filter(Boolean);
const overlayIndex = parts.indexOf("overlay");
const clientId = decodeURIComponent(parts[overlayIndex + 1] || "default");
const overlayMode = String(parts[overlayIndex + 2] || "all").toLowerCase();
const feedStack = document.getElementById("feedStack");
const supportStage = document.getElementById("supportStage");

function cssVar(name, value) { document.documentElement.style.setProperty(name, value); }

function applySizing(settings) {
  cssVar("--gift-font-size", `${Number(settings.gift.fontSize || 24)}px`);
  cssVar("--level-font-size", `${Number(settings.level.fontSize || 24)}px`);
  cssVar("--gift-card-height", `${Number(settings.gift.cardHeight || 50)}px`);
  cssVar("--level-card-height", `${Number(settings.level.cardHeight || 50)}px`);
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeAttr(v) { return escapeHtml(v).replace(/'/g, "&#039;"); }

function imageHtml(src, cls, fallback) {
  if (!src) return `<div class="${cls} empty-img">${fallback}</div>`;
  return `<img class="${cls}" src="${escapeAttr(src)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls} empty-img',textContent:'${fallback}'}))" />`;
}

function marqueeText(text, className = "") {
  const safe = escapeHtml(text || "익명");
  return `<span class="marquee ${className}"><span class="marquee-track"><span class="marquee-main">${safe}</span><span class="marquee-gap">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="marquee-clone" aria-hidden="true">${safe}</span></span></span>`;
}

function isGift(item) { return item.feedType === "gift" || item.type === "gift"; }
function isLevel(item) { return item.feedType === "level" || item.type === "member_level_up"; }

function colorByTier(value, tiers, fallback) {
  const n = Number(value || 0);
  const tier = [...(tiers || [])]
    .sort((a, b) => Number(b.min || 0) - Number(a.min || 0))
    .find((t) => n >= Number(t.min || 0) && (t.max === null || t.max === undefined || n <= Number(t.max)));
  return tier?.color || fallback;
}

function styleForItem(item, settings) {
  const gift = isGift(item);
  const base = gift ? settings.gift.colors : settings.level.colors;
  let c = base;
  if (gift) {
    c = colorByTier(item.totalCoins, settings.gift.tiers, base);
  } else {
    c = colorByTier(item.level, settings.level.tiers, base);
  }
  return {
    text: c.text || base.text,
    background: c.background || base.background,
    border: c.border || base.border,
    gradientFrom: c.gradientFrom || base.gradientFrom,
    gradientTo: c.gradientTo || base.gradientTo,
    useGradient: c.useGradient !== false
  };
}

function applyCardStyle(node, style) {
  node.style.setProperty("--card-text", style.text);
  node.style.setProperty("--card-bg", style.background);
  node.style.setProperty("--card-border", style.border);
  node.style.setProperty("--card-grad-from", style.gradientFrom);
  node.style.setProperty("--card-grad-to", style.gradientTo);
}

function giftHtml(item, settings) {
  const profile = settings.gift.showProfileImage ? imageHtml(item.profileImage, "avatar", "테") : "";
  const giftImage = settings.gift.showGiftImage ? imageHtml(item.giftImage, "gift-img", "🎁") : "";
  const giftName = settings.gift.showGiftName ? escapeHtml(item.giftName || "Gift") : "";
  const count = Number(item.count || 1).toLocaleString();
  const diamonds = settings.gift.showDiamondValue ? `<span class="diamond">💎 ${Number(item.totalCoins || 0).toLocaleString()}</span>` : "";
  return `
    ${profile ? `<div class="profile-slot">${profile}</div>` : ""}
    <div class="name-slot">${marqueeText(item.nickname || item.username || "익명", "nickname-text")}</div>
    ${giftImage ? `<div class="gift-slot">${giftImage}</div>` : ""}
    <div class="gift-info">
      <div class="gift-line">
        ${giftName ? `<span class="gift-name">${giftName}</span>` : ""}
        <span class="gift-count">× ${count}</span>
        ${diamonds}
      </div>
    </div>`;
}

function levelHtml(item, settings) {
  const profile = settings.gift.showProfileImage ? imageHtml(item.profileImage, "avatar", "★") : "";
  return `
    ${profile ? `<div class="profile-slot">${profile}</div>` : ""}
    <div class="level-message">
      ${marqueeText(item.nickname || "익명", "nickname-text")}
      <span class="level-tail">님이 레벨 업! <b>Lv.${Number(item.level || 0)}</b></span>
    </div>`;
}

function refreshMarquees(root = document) {
  root.querySelectorAll(".marquee").forEach((el) => {
    const track = el.querySelector(".marquee-track");
    const main = el.querySelector(".marquee-main");
    if (!track || !main) return;

    const available = Math.round(el.clientWidth || 0);
    const textWidth = Math.ceil(main.scrollWidth || 0);
    const text = main.textContent || "";
    const key = `${available}:${textWidth}:${text}`;
    if (el.dataset.marqueeKey === key) return;
    el.dataset.marqueeKey = key;

    track.style.animation = "none";
    track.style.transform = "translateX(0)";
    el.classList.remove("is-overflow");
    void track.offsetWidth;

    if (available > 0 && textWidth > available + 2) {
      const gapWidth = 48;
      const distance = textWidth + gapWidth;
      const duration = Math.max(7, Math.min(18, distance / 34));
      el.style.setProperty("--marquee-distance", `${distance}px`);
      el.style.setProperty("--marquee-duration", `${duration}s`);
      el.classList.add("is-overflow");
      track.style.animation = "";
      track.style.transform = "";
    } else {
      el.style.removeProperty("--marquee-distance");
      el.style.removeProperty("--marquee-duration");
    }
  });
}

function selectItems(state) {
  if (overlayMode === "gift") return state.gifts || [];
  if (overlayMode === "level") return state.levelCards || [];
  if (overlayMode === "support") return state.gifts || state.feedItems || [];
  return state.feedItems || [...(state.gifts || []), ...(state.levelCards || [])];
}

function signatureForItem(item, settings) {
  if (isGift(item)) {
    return JSON.stringify({
      type: "gift",
      nickname: item.nickname || item.username || "익명",
      profileImage: settings.gift.showProfileImage ? item.profileImage || "" : "",
      giftImage: settings.gift.showGiftImage ? item.giftImage || "" : "",
      giftName: settings.gift.showGiftName ? item.giftName || "Gift" : "",
      count: item.count || 1,
      totalCoins: settings.gift.showDiamondValue ? item.totalCoins || 0 : 0
    });
  }
  return JSON.stringify({
    type: "level",
    nickname: item.nickname || "익명",
    profileImage: settings.gift.showProfileImage ? item.profileImage || "" : "",
    level: item.level || 0,
    previousLevel: item.previousLevel || 0
  });
}


const SUPPORT_THEMES = ["fan", "lightstick", "placard", "led"];
const SUPPORT_LIFETIME_MS = 4300;
let supportBooted = false;
let supportSeenGiftIds = new Set();
let supportNodeSeq = 0;

function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n || 0))); }
function pickSupportTheme(selected) {
  if (selected === "random") return SUPPORT_THEMES[Math.floor(Math.random() * SUPPORT_THEMES.length)];
  return SUPPORT_THEMES.includes(selected) ? selected : "fan";
}
function supportLabel(theme) {
  return ({ fan: "응원", lightstick: "ON", placard: "CHEER", led: "THANK YOU" })[theme] || "응원";
}
function supportStyleVars(index) {
  const x = Math.round(4 + Math.random() * 88);
  const y = Math.round(Math.random() * 22);
  const scale = (0.86 + Math.random() * 0.28).toFixed(2);
  const tilt = Math.round(-10 + Math.random() * 20);
  const delay = (Math.random() * 0.34).toFixed(2);
  const z = 10 + index;
  return `--x:${x}%; --rise:${y}px; --scale:${scale}; --tilt:${tilt}deg; --delay:${delay}s; --z:${z};`;
}
function supportUnitHtml(item, theme, index) {
  const profile = imageHtml(item.profileImage, "support-print-img", "★");
  const nickname = escapeHtml(item.nickname || item.username || "익명");
  const label = theme === "placard" || theme === "led" ? nickname : supportLabel(theme);
  return `<div class="support-unit support-${theme}" style="${supportStyleVars(index)}" title="${escapeAttr(nickname)}">
    <div class="support-prop">
      <div class="support-print">${profile}</div>
      <span>${label}</span>
    </div>
  </div>`;
}
function buildSupportUnitsFromGift(item, settings) {
  const fan = settings?.gift?.fanOverlay || {};
  if (fan.enabled === false || !isGift(item)) return [];
  const coinsPerUnit = Math.max(1, Number(fan.coinsPerUnit || 100));
  const maxUnits = clamp(fan.maxUnits || 30, 1, 80);
  const count = clamp(Math.floor(Number(item.totalCoins || item.coins || 0) / coinsPerUnit), 0, maxUnits);
  const selectedTheme = fan.theme || "fan";
  return Array.from({ length: count }, () => ({ item, theme: pickSupportTheme(selectedTheme) }));
}
function removeSupportNode(node) {
  if (!node || !node.parentNode) return;
  node.classList.add("support-leave");
  setTimeout(() => node.remove(), 520);
}
function spawnSupportBurst(gift, settings) {
  if (!supportStage) return;
  const units = buildSupportUnitsFromGift(gift, settings);
  if (!units.length) return;
  supportStage.hidden = false;
  const fragment = document.createDocumentFragment();
  units.forEach(({ item, theme }) => {
    const wrap = document.createElement("div");
    supportNodeSeq += 1;
    wrap.innerHTML = supportUnitHtml(item, theme, supportNodeSeq).trim();
    const node = wrap.firstElementChild;
    fragment.appendChild(node);
    setTimeout(() => removeSupportNode(node), SUPPORT_LIFETIME_MS + Math.random() * 550);
  });
  supportStage.appendChild(fragment);
}
function updateSupportStage(items, settings) {
  if (!supportStage) return;
  const gifts = (items || []).filter(isGift);
  const currentIds = new Set(gifts.map((item) => String(item.id)));
  if (!gifts.length) {
    supportSeenGiftIds.clear();
    supportStage.innerHTML = "";
    supportStage.hidden = true;
    supportBooted = true;
    return;
  }

  if (!supportBooted) {
    supportSeenGiftIds = currentIds;
    supportBooted = true;
    return;
  }

  gifts
    .slice()
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
    .forEach((gift) => {
      const id = String(gift.id);
      if (supportSeenGiftIds.has(id)) return;
      supportSeenGiftIds.add(id);
      spawnSupportBurst(gift, settings);
    });

  if (!supportStage.children.length) supportStage.hidden = true;
}

function updateFeed(container, items, settings) {
  const incomingIds = new Set(items.map((item) => String(item.id)));

  [...container.children].forEach((node) => {
    if (!incomingIds.has(node.dataset.id)) {
      node.classList.add("exit");
      setTimeout(() => node.remove(), 260);
    }
  });

  items.forEach((item, index) => {
    const id = String(item.id);
    const gift = isGift(item);
    const style = styleForItem(item, settings);
    let node = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const premium = gift && Number(item.totalCoins || item.coins || 0) >= 5000;
    const cardClass = `${gift ? "gift-card" : "level-card"} ${style.useGradient ? "is-gradient" : ""} ${item.pinned ? "is-pinned" : ""} ${premium ? "is-premium" : ""}`;
    const sig = signatureForItem(item, settings);

    if (!node) {
      node = document.createElement("article");
      node.dataset.id = id;
      node.className = `card ${cardClass} enter`;
      applyCardStyle(node, style);
      node.dataset.sig = sig;
      node.innerHTML = gift ? giftHtml(item, settings) : levelHtml(item, settings);
      container.insertBefore(node, container.children[index] || null);
      requestAnimationFrame(() => refreshMarquees(node));
      setTimeout(() => node.classList.remove("enter"), 620);
    } else {
      node.className = `card ${cardClass}`;
      applyCardStyle(node, style);
      if (node.dataset.sig !== sig) {
        node.dataset.sig = sig;
        node.innerHTML = gift ? giftHtml(item, settings) : levelHtml(item, settings);
        requestAnimationFrame(() => refreshMarquees(node));
      }
      const currentIndex = [...container.children].indexOf(node);
      if (currentIndex !== index) container.insertBefore(node, container.children[index] || null);
    }
  });
}

const POLL_INTERVAL_ACTIVE = 30000;
const POLL_INTERVAL_HIDDEN = 60000;
const WS_CONNECT_TIMEOUT = 6000;
const WS_RECONNECT_MIN = 2000;
const WS_RECONNECT_MAX = 30000;
let pollTimer = null;
let ws = null;
let wsConnectTimer = null;
let wsReconnectTimer = null;
let wsReconnectDelay = WS_RECONNECT_MIN;
let usingWebSocket = false;
let lastStateSignature = "";

function getStateSignature(state) {
  const items = selectItems(state).map((item) => `${item.id}:${item.pinned ? 1 : 0}:${item.count || ""}:${item.totalCoins || ""}:${item.level || ""}`).join("|");
  const settingsKey = JSON.stringify({
    gift: state.settings?.gift,
    fanOverlay: state.settings?.gift?.fanOverlay,
    level: state.settings?.level,
    activePreset: state.settings?.activePreset
  });
  return `${items}::${settingsKey}`;
}

function applyState(state) {
  if (!state?.settings) return;
  const signature = getStateSignature(state);
  if (signature === lastStateSignature) return;
  lastStateSignature = signature;
  const items = selectItems(state);
  applySizing(state.settings);
  if (overlayMode === "support") {
    feedStack.innerHTML = "";
  } else {
    updateFeed(feedStack, items, state.settings);
  }
  updateSupportStage(items, state.settings);
  requestAnimationFrame(() => refreshMarquees(document));
}

function schedulePoll(delay) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(poll, delay);
}

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null;
}

async function poll() {
  if (usingWebSocket) return;
  try {
    const url = `/api/state/${encodeURIComponent(clientId)}?mode=${encodeURIComponent(overlayMode)}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) throw new Error("API returned non-JSON response");

    applyState(await res.json());
  } catch (err) {
    console.warn("overlay polling failed", err);
  } finally {
    if (!usingWebSocket) schedulePoll(document.hidden ? POLL_INTERVAL_HIDDEN : POLL_INTERVAL_ACTIVE);
  }
}

function websocketUrl() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams({ clientId, mode: overlayMode });
  return `${protocol}//${location.host}/ws?${params.toString()}`;
}

function startPollingFallback(delay = 500) {
  usingWebSocket = false;
  stopPolling();
  schedulePoll(delay);
}

function connectWebSocket() {
  clearTimeout(wsReconnectTimer);
  clearTimeout(wsConnectTimer);

  try { ws?.close(); } catch {}
  ws = null;

  try {
    ws = new WebSocket(websocketUrl());
  } catch (err) {
    console.warn("overlay websocket unavailable", err);
    startPollingFallback(500);
    return;
  }

  wsConnectTimer = setTimeout(() => {
    if (!usingWebSocket) {
      try { ws?.close(); } catch {}
      startPollingFallback(500);
    }
  }, WS_CONNECT_TIMEOUT);

  ws.addEventListener("open", () => {
    usingWebSocket = true;
    wsReconnectDelay = WS_RECONNECT_MIN;
    clearTimeout(wsConnectTimer);
    stopPolling();
  });

  ws.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "state" && payload.state) applyState(payload.state);
    } catch (err) {
      console.warn("overlay websocket message ignored", err);
    }
  });

  ws.addEventListener("close", () => {
    clearTimeout(wsConnectTimer);
    usingWebSocket = false;
    startPollingFallback(500);
    wsReconnectTimer = setTimeout(connectWebSocket, wsReconnectDelay);
    wsReconnectDelay = Math.min(WS_RECONNECT_MAX, Math.round(wsReconnectDelay * 1.7));
  });

  ws.addEventListener("error", () => {
    // close 이벤트에서 polling fallback과 재연결을 처리합니다.
  });
}

document.addEventListener("visibilitychange", () => {
  if (usingWebSocket) return;
  schedulePoll(document.hidden ? POLL_INTERVAL_HIDDEN : 500);
});

connectWebSocket();
startPollingFallback(1200);
