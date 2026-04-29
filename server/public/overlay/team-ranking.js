const pathParts = location.pathname.split("/").filter(Boolean);
const clientId = pathParts[1] || "default";
const rankingList = document.getElementById("rankingList");

let previousKeys = new Set();
let lastRenderSignature = "";
let currentLayout = "";
let currentFontSize = "";
let isFirstRender = true;
let isLoading = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function initials(name) {
  return String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function applyRankingColors(settings) {
  const root = document.documentElement;
  // 랭킹 보드는 방송 화면에서 흔들리지 않게 불투명 다크 카드로 고정합니다.
  root.style.setProperty("--rank-text", "#fffaf0");
  root.style.setProperty("--rank-border", "rgba(255,255,255,.10)");
  root.style.setProperty("--rank-bg", "#141719");
  root.style.setProperty("--rank-bg-2", "#1a1d20");
  root.style.setProperty("--rank-accent", "#ffd84d");
  root.style.setProperty("--rank-second", "#c8d0dc");
  root.style.setProperty("--rank-third", "#d97a43");
}

function getItemKey(item) {
  return String(item.userId || item.uniqueId || item.nickname || item.rank);
}

function getSignature(layout, fontSize, items) {
  return JSON.stringify({
    layout,
    fontSize,
    items: items.map((item) => ({
      rank: Number(item.rank || 0),
      userId: item.userId || "",
      uniqueId: item.uniqueId || "",
      nickname: item.nickname || "",
      profileImage: item.profileImage || "",
      teamLevel: Number(item.teamLevel || 0)
    }))
  });
}

function createNicknameEl(text) {
  const wrap = document.createElement("span");
  wrap.className = "nickname-marquee";

  const track = document.createElement("span");
  track.className = "nickname-track";

  const main = document.createElement("span");
  main.className = "nickname-main";
  main.textContent = text || "익명";

  const gap = document.createElement("span");
  gap.className = "nickname-gap";
  gap.setAttribute("aria-hidden", "true");

  const copy = document.createElement("span");
  copy.className = "nickname-copy";
  copy.setAttribute("aria-hidden", "true");
  copy.textContent = text || "익명";

  track.append(main, gap, copy);
  wrap.append(track);
  return wrap;
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

function updateAvatar(article, item, rank) {
  const avatar = article.querySelector(".avatar");
  if (!avatar) return;

  const imageUrl = item.profileImage || "";
  const existingImg = avatar.querySelector(".avatar-img");
  const existingFallback = avatar.querySelector(".avatar-fallback");
  const existingCrown = avatar.querySelector(".crown");

  if (Number(rank) === 1) {
    if (!existingCrown) {
      const crown = document.createElement("span");
      crown.className = "crown";
      crown.setAttribute("aria-hidden", "true");
      crown.textContent = "👑";
      avatar.prepend(crown);
    }
  } else if (existingCrown) {
    existingCrown.remove();
  }

  if (imageUrl) {
    if (existingImg && existingImg.dataset.src === imageUrl) {
      existingImg.style.display = "block";
      if (existingFallback) existingFallback.style.display = "none";
      return;
    }

    avatar.querySelectorAll(".avatar-img,.avatar-fallback").forEach((el) => el.remove());

    const img = document.createElement("img");
    img.className = "avatar-img";
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.dataset.src = imageUrl;
    img.src = imageUrl;

    const fallback = document.createElement("span");
    fallback.className = "avatar-fallback";
    fallback.style.display = "none";
    fallback.textContent = initials(item.nickname);

    img.addEventListener("error", () => {
      img.style.display = "none";
      fallback.style.display = "grid";
    });

    avatar.append(img, fallback);
    return;
  }

  avatar.querySelectorAll(".avatar-img,.avatar-fallback").forEach((el) => el.remove());
  const fallback = document.createElement("span");
  fallback.className = "avatar-fallback";
  fallback.textContent = initials(item.nickname);
  avatar.append(fallback);
}

function createRankItem(item, isNew) {
  const article = document.createElement("article");
  article.className = `rank-item${isNew ? " is-new" : ""}`;
  article.dataset.key = getItemKey(item);

  const badge = document.createElement("div");
  badge.className = "rank-badge";

  const avatar = document.createElement("div");
  avatar.className = "avatar";

  const member = document.createElement("div");
  member.className = "member";
  const strong = document.createElement("strong");
  member.append(strong);

  const level = document.createElement("div");
  level.className = "level";
  const lvText = document.createElement("span");
  lvText.textContent = "LV";
  const lvValue = document.createElement("b");
  level.append(lvText, lvValue);

  article.append(badge, avatar, member, level);
  updateRankItem(article, item);

  if (isNew) {
    window.setTimeout(() => article.classList.remove("is-new"), 260);
  }
  return article;
}

function updateRankItem(article, item) {
  const rank = Number(item.rank || 0);
  const nickname = item.nickname || "익명";
  const teamLevel = Number(item.teamLevel || 0);

  article.dataset.rank = String(rank);
  article.dataset.key = getItemKey(item);

  const badge = article.querySelector(".rank-badge");
  if (badge && badge.textContent !== String(rank)) badge.textContent = String(rank);

  updateAvatar(article, item, rank);

  const strong = article.querySelector(".member strong");
  if (strong && strong.dataset.nickname !== nickname) {
    strong.dataset.nickname = nickname;
    strong.replaceChildren(createNicknameEl(nickname));
  }

  const lvValue = article.querySelector(".level b");
  if (lvValue && lvValue.textContent !== String(teamLevel)) lvValue.textContent = String(teamLevel);
}

function renderEmpty() {
  if (rankingList.dataset.empty === "true") return;
  rankingList.dataset.empty = "true";
  rankingList.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = "팀 레벨 데이터 수신 대기 중";
  rankingList.append(empty);
}

function clearEmptyState() {
  if (rankingList.dataset.empty === "true") {
    rankingList.dataset.empty = "false";
    rankingList.replaceChildren();
  }
}

function render(state) {
  const settings = state.settings?.teamRanking || {};
  const items = Array.isArray(state.teamRanking) ? state.teamRanking : [];
  const layout = settings.layout === "card" ? "card" : "list";
  const fontSize = Math.max(12, Math.min(48, Number(settings.fontSize || 24)));

  applyRankingColors(state.settings || {});

  const fontValue = `${fontSize}px`;
  if (currentFontSize !== fontValue) {
    document.documentElement.style.setProperty("--ranking-font-size", fontValue);
    currentFontSize = fontValue;
  }

  const columns = String(Math.max(1, items.length || 1));
  document.documentElement.style.setProperty("--card-columns", columns);

  if (currentLayout !== layout) {
    document.body.dataset.layout = layout;
    rankingList.className = `ranking-list ${layout}`;
    currentLayout = layout;
    // 레이아웃이 바뀌는 경우에만 전체 재측정이 필요합니다.
    requestAnimationFrame(() => refreshMarquees(rankingList));
  }

  if (!items.length) {
    lastRenderSignature = "__empty__";
    previousKeys = new Set();
    renderEmpty();
    return;
  }

  const signature = getSignature(layout, fontSize, items);
  if (signature === lastRenderSignature) {
    requestAnimationFrame(() => refreshMarquees(rankingList));
    return;
  }
  lastRenderSignature = signature;
  clearEmptyState();

  const oldNodes = new Map();
  rankingList.querySelectorAll(".rank-item").forEach((node) => {
    if (node.dataset.key) oldNodes.set(node.dataset.key, node);
  });

  const fragment = document.createDocumentFragment();
  const nextKeys = new Set();

  items.forEach((item) => {
    const key = getItemKey(item);
    nextKeys.add(key);
    let node = oldNodes.get(key);
    const isNew = !previousKeys.has(key) && !isFirstRender;

    if (!node) {
      node = createRankItem(item, isNew);
    } else {
      updateRankItem(node, item);
      if (isNew) {
        node.classList.add("is-new");
        window.setTimeout(() => node.classList.remove("is-new"), 260);
      }
    }

    fragment.append(node);
  });

  // 기존 DOM을 통째로 innerHTML 교체하지 않고 노드만 재배치합니다.
  // 이미지 재로딩/입장 애니메이션 반복이 줄어서 OBS에서 깜빡임이 훨씬 적습니다.
  rankingList.replaceChildren(fragment);

  previousKeys = nextKeys;
  isFirstRender = false;
  requestAnimationFrame(() => refreshMarquees(rankingList));
}

async function loadState() {
  if (isLoading) return;
  isLoading = true;
  try {
    const res = await fetch(`/api/state/${encodeURIComponent(clientId)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    render(state);
  } finally {
    isLoading = false;
  }
}

loadState().catch(renderEmpty);
setInterval(() => loadState().catch(() => {}), 1500);
window.addEventListener("resize", () => requestAnimationFrame(() => refreshMarquees(rankingList)));
