const parts = location.pathname.split("/").filter(Boolean);
const overlayIndex = parts.indexOf("overlay");
const clientId = decodeURIComponent(parts[overlayIndex + 1] || "default");
const overlayMode = String(parts[overlayIndex + 2] || "all").toLowerCase();
const feedStack = document.getElementById("feedStack");

function cssVar(name, value) { document.documentElement.style.setProperty(name, value); }

function applySizing(settings) {
  cssVar("--gift-font-size", `${Number(settings.gift.fontSize || 28)}px`);
  cssVar("--level-font-size", `${Number(settings.level.fontSize || 26)}px`);
  cssVar("--gift-card-height", `${Number(settings.gift.cardHeight || 96)}px`);
  cssVar("--level-card-height", `${Number(settings.level.cardHeight || 90)}px`);
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
  return `<span class="marquee ${className}"><span>${escapeHtml(text)}</span></span>`;
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
    if (item.isSuperFan) c = settings.gift.superFanColor || c;
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
  const pin = item.pinned ? `<span class="pin-badge">고정</span>` : "";

  return `
    ${profile ? `<div class="profile-slot">${profile}</div>` : ""}
    <div class="name-slot">${marqueeText(item.nickname || item.username || "익명", "nickname-text")}</div>
    ${giftImage ? `<div class="gift-slot">${giftImage}</div>` : ""}
    <div class="gift-info">
      <div class="gift-line">
        ${pin}
        ${item.isSuperFan ? `<span class="superfan-badge">슈퍼팬</span>` : ""}
        ${giftName ? `<span class="gift-name">${giftName}</span>` : ""}
        <span class="gift-count">× ${count}</span>
        ${diamonds}
      </div>
    </div>`;
}

function levelHtml(item, settings) {
  const profile = settings.gift.showProfileImage ? imageHtml(item.profileImage, "avatar", "★") : "";
  const pin = item.pinned ? `<span class="pin-badge">고정</span>` : "";
  return `
    ${profile ? `<div class="profile-slot">${profile}</div>` : ""}
    <div class="level-message">
      ${pin}
      ${marqueeText(item.nickname || "익명", "nickname-text")}
      <span class="level-tail">님이 레벨 업! <b>Lv.${Number(item.level || 0)}</b></span>
    </div>`;
}

function refreshMarquees(root = document) {
  root.querySelectorAll(".marquee").forEach((el) => {
    const inner = el.firstElementChild;
    if (!inner) return;
    const diff = inner.scrollWidth - el.clientWidth;
    if (diff > 4) {
      el.classList.add("is-overflow");
      el.style.setProperty("--scroll-distance", `${diff + 22}px`);
    } else {
      el.classList.remove("is-overflow");
      el.style.removeProperty("--scroll-distance");
    }
  });
}

function selectItems(state) {
  if (overlayMode === "gift") return state.gifts || [];
  if (overlayMode === "level") return state.levelCards || [];
  return state.feedItems || [...(state.gifts || []), ...(state.levelCards || [])];
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
    const cardClass = `${gift ? "gift-card" : "level-card"} ${style.useGradient ? "is-gradient" : ""} ${item.pinned ? "is-pinned" : ""}`;

    if (!node) {
      node = document.createElement("article");
      node.dataset.id = id;
      node.className = `card ${cardClass} enter`;
      applyCardStyle(node, style);
      node.innerHTML = gift ? giftHtml(item, settings) : levelHtml(item, settings);
      container.insertBefore(node, container.children[index] || null);
      requestAnimationFrame(() => refreshMarquees(node));
      setTimeout(() => node.classList.remove("enter"), 620);
    } else {
      node.className = `card ${cardClass}`;
      applyCardStyle(node, style);
      node.innerHTML = gift ? giftHtml(item, settings) : levelHtml(item, settings);
      requestAnimationFrame(() => refreshMarquees(node));
      const currentIndex = [...container.children].indexOf(node);
      if (currentIndex !== index) container.insertBefore(node, container.children[index] || null);
    }
  });
}

async function poll() {
  try {
    const res = await fetch(`/api/state/${encodeURIComponent(clientId)}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    applySizing(state.settings);
    updateFeed(feedStack, selectItems(state), state.settings);
    requestAnimationFrame(() => refreshMarquees(document));
  } catch (err) {
    console.warn("overlay polling failed", err);
  } finally {
    setTimeout(poll, 800);
  }
}

poll();
