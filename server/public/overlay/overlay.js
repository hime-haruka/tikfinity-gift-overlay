const clientId = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "default");
const feedStack = document.getElementById("feedStack");

function cssVar(name, value) { document.documentElement.style.setProperty(name, value); }

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
  cssVar("--gift-font-size", `${Number(settings.gift.fontSize || 28)}px`);
  cssVar("--level-font-size", `${Number(settings.level.fontSize || 26)}px`);
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
    const inner = el.firstElementChild;
    if (!inner) return;
    const diff = inner.scrollWidth - el.clientWidth;
    if (diff > 4) {
      el.classList.add("is-overflow");
      el.style.setProperty("--scroll-distance", `${diff + 18}px`);
    } else {
      el.classList.remove("is-overflow");
      el.style.removeProperty("--scroll-distance");
    }
  });
}

function isGift(item) { return item.feedType === "gift" || item.type === "gift"; }

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
    let node = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const cardClass = gift
      ? `card gift-card ${settings.gift.colors.useGradient ? "is-gradient" : ""}`
      : `card level-card ${settings.level.colors.useGradient ? "is-gradient" : ""}`;

    if (!node) {
      node = document.createElement("article");
      node.dataset.id = id;
      node.className = `${cardClass} enter`;
      node.innerHTML = gift ? giftHtml(item, settings) : levelHtml(item, settings);
      container.insertBefore(node, container.children[index] || null);
      requestAnimationFrame(() => refreshMarquees(node));
      setTimeout(() => node.classList.remove("enter"), 620);
    } else {
      node.className = cardClass;
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
    applyColors(state.settings);
    updateFeed(feedStack, state.feedItems || [...(state.gifts || []), ...(state.levelCards || [])], state.settings);
    requestAnimationFrame(() => refreshMarquees(document));
  } catch (err) {
    console.warn("overlay polling failed", err);
  } finally {
    setTimeout(poll, 800);
  }
}

poll();
