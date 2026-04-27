const clientId = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "default");
const giftStack = document.getElementById("giftStack");
const levelStack = document.getElementById("levelStack");

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

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeAttr(v) { return escapeHtml(v).replace(/'/g, "&#039;"); }

function imageHtml(src, cls, fallback) {
  if (!src) return `<div class="${cls} empty-img">${fallback}</div>`;
  return `<img class="${cls}" src="${escapeAttr(src)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls} empty-img',textContent:'${fallback}'}))" />`;
}

function giftHtml(item, settings) {
  const cls = settings.gift.colors.useGradient ? "gift-card is-gradient" : "gift-card";
  const profile = settings.gift.showProfileImage ? imageHtml(item.profileImage, "avatar", "테") : "";
  const giftImage = settings.gift.showGiftImage ? imageHtml(item.giftImage, "gift-img", "🎁") : "";
  const media = profile || giftImage ? `<div class="media-pair">${profile}${giftImage}</div>` : "";
  const giftName = settings.gift.showGiftName ? `<div class="card-sub">${escapeHtml(item.giftName || "Gift")}</div>` : "";
  const diamonds = settings.gift.showDiamondValue ? `<div class="card-meta">${Number(item.totalCoins || 0).toLocaleString()} diamonds</div>` : "";
  const count = Number(item.count || 1).toLocaleString();
  return `${media}
    <div class="card-body">
      <div class="card-title">${escapeHtml(item.nickname || item.username || "익명")}</div>
      ${giftName}
    </div>
    <div class="card-value">${escapeHtml(item.giftName || "Gift")} × ${count}</div>
    ${diamonds}`;
}

function levelHtml(item, settings) {
  const cls = settings.level.colors.useGradient ? "level-card is-gradient" : "level-card";
  return `${imageHtml(item.profileImage, "avatar", "★")}
    <div class="card-body">
      <div class="card-title">${escapeHtml(item.nickname || "익명")} 님 레벨업!</div>
      <div class="card-sub">Lv.${Number(item.previousLevel || 0)} → Lv.${Number(item.level || 0)}</div>
    </div>
    <div class="card-value">LEVEL UP</div>`;
}

function updateList(container, items, settings, type) {
  const incomingIds = new Set(items.map((item) => String(item.id)));

  [...container.children].forEach((node) => {
    if (!incomingIds.has(node.dataset.id)) {
      node.classList.add("exit");
      setTimeout(() => node.remove(), 260);
    }
  });

  items.forEach((item, index) => {
    const id = String(item.id);
    let node = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const cardClass = type === "gift"
      ? `card ${settings.gift.colors.useGradient ? "gift-card is-gradient" : "gift-card"}`
      : `card ${settings.level.colors.useGradient ? "level-card is-gradient" : "level-card"}`;

    if (!node) {
      node = document.createElement("article");
      node.dataset.id = id;
      node.className = `${cardClass} enter`;
      node.innerHTML = type === "gift" ? giftHtml(item, settings) : levelHtml(item, settings);
      container.insertBefore(node, container.children[index] || null);
      setTimeout(() => node.classList.remove("enter"), 620);
    } else {
      node.className = cardClass;
      node.innerHTML = type === "gift" ? giftHtml(item, settings) : levelHtml(item, settings);
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
    updateList(giftStack, state.gifts, state.settings, "gift");
    updateList(levelStack, state.levelCards, state.settings, "level");
  } catch (err) {
    console.warn("overlay polling failed", err);
  } finally {
    setTimeout(poll, 800);
  }
}

poll();
