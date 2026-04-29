const parts = location.pathname.split("/").filter(Boolean);
const clientId = decodeURIComponent(parts[parts.indexOf("settings") + 1] || parts.pop() || "default");
const $ = (id) => document.getElementById(id);
const status = $("status");
let currentSettings = null;
let presets = {};
let latestState = null;

const COLOR_KEYS = [
  ["text", "텍스트"],
  ["border", "보더"],
  ["background", "배경"],
  ["gradientFrom", "그라데이션 시작"],
  ["gradientTo", "그라데이션 끝"]
];

$("clientLabel").textContent = `Client ID: ${clientId}`;
$("giftOverlayLink").href = `/overlay/${encodeURIComponent(clientId)}/gift`;
$("levelOverlayLink").href = `/overlay/${encodeURIComponent(clientId)}/level`;
$("allOverlayLink").href = `/overlay/${encodeURIComponent(clientId)}/all`;

function setStatus(msg) { status.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`; }
function getChecked(id) { return $(id).checked; }
function getValue(id) { return $(id).value; }
function getNum(id) { return Number($(id).value || 0); }
function setChecked(id, v) { $(id).checked = Boolean(v); }

function colorToHex(value) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  if (/^#[0-9a-f]{3}$/i.test(raw)) return "#" + raw.slice(1).split("").map((c) => c + c).join("");
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return "#" + [m[1], m[2], m[3]].map((n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0")).join("");
  return "#000000";
}
function setValue(id, v) { const el = $(id); el.value = el.type === "color" ? colorToHex(v) : (v ?? ""); }
function escapeHtml(v) { return String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function colorInputs(prefix) {
  return `
    <label class="toggle"><input id="${prefix}_useGradient" type="checkbox"><span>그라데이션</span></label>
    ${COLOR_KEYS.map(([key, label]) => `<label class="color-field">${label}<input id="${prefix}_${key}" type="color"></label>`).join("")}
  `;
}

function renderPresetPalette() {
  const active = currentSettings?.activePreset || "purpleDream";
  $("presetPalette").innerHTML = Object.entries(presets).map(([key, preset]) => {
    const g = preset.gift || {};
    const l = preset.level || {};
    const sf = preset.superFan || g;
    const bg = `linear-gradient(135deg, ${g.gradientFrom || g.border || "#ddd"}, ${g.gradientTo || l.gradientTo || "#fff"})`;
    return `<button type="button" class="preset-chip ${key === active ? "active" : ""}" data-preset-key="${escapeHtml(key)}" title="${escapeHtml(preset.label || key)}">
      <span class="preset-dot" style="--preset-bg:${escapeHtml(bg)}"><i style="background:${escapeHtml(l.gradientFrom || l.border || "#ddd")}"></i><b style="background:${escapeHtml(sf.gradientFrom || sf.border || "#ffd36a")}"></b></span>
      <span>${escapeHtml(preset.label || key)}</span>
    </button>`;
  }).join("");
}

function renderColorEditors(settings) {
  $("giftBaseColorGrid").innerHTML = colorInputs("giftBase");
  $("levelBaseColorGrid").innerHTML = colorInputs("levelBase");
  $("superFanColorGrid").innerHTML = colorInputs("superFan");

  $("giftTierGrid").innerHTML = (settings.gift.tiers || []).map((tier, i) => `
    <article class="tier-card">
      <h4>${escapeHtml(tier.label || `${tier.min}+`)}</h4>
      <div class="mini-colors">${colorInputs(`giftTier_${i}`)}</div>
    </article>
  `).join("");

  $("levelTierGrid").innerHTML = (settings.level.tiers || []).map((tier, i) => `
    <article class="tier-card">
      <h4>${escapeHtml(tier.label || `${tier.min}+`)}</h4>
      <div class="mini-colors">${colorInputs(`levelTier_${i}`)}</div>
    </article>
  `).join("");

  setColor("giftBase", settings.gift.colors);
  setColor("levelBase", settings.level.colors);
  setColor("superFan", settings.gift.superFanColor);
  (settings.gift.tiers || []).forEach((tier, i) => setColor(`giftTier_${i}`, tier.color));
  (settings.level.tiers || []).forEach((tier, i) => setColor(`levelTier_${i}`, tier.color));
}

function setColor(prefix, color = {}) {
  setChecked(`${prefix}_useGradient`, color.useGradient !== false);
  COLOR_KEYS.forEach(([key]) => setValue(`${prefix}_${key}`, color[key]));
}
function getColor(prefix) {
  return {
    useGradient: getChecked(`${prefix}_useGradient`),
    text: getValue(`${prefix}_text`),
    border: getValue(`${prefix}_border`),
    background: getValue(`${prefix}_background`),
    gradientFrom: getValue(`${prefix}_gradientFrom`),
    gradientTo: getValue(`${prefix}_gradientTo`)
  };
}

async function loadSettings() {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  currentSettings = data.settings;
  presets = data.presets || {};

  setValue("activePreset", currentSettings.activePreset || "purpleDream");
  renderPresetPalette();

  setChecked("showGiftName", currentSettings.gift.showGiftName);
  setChecked("showGiftImage", currentSettings.gift.showGiftImage);
  setChecked("showProfileImage", currentSettings.gift.showProfileImage);
  setChecked("showDiamondValue", currentSettings.gift.showDiamondValue);
  setValue("sortMode", currentSettings.gift.sortMode);
  setValue("minCoins", currentSettings.gift.minCoins);
  setValue("maxCards", currentSettings.gift.maxCards);
  setValue("giftFontSize", currentSettings.gift.fontSize || 28);
  setValue("giftCardHeight", currentSettings.gift.cardHeight || 96);

  setChecked("levelEnabled", currentSettings.level.enabled);
  setValue("levelSortMode", currentSettings.level.sortMode || "latest");
  setValue("minLevel", currentSettings.level.minLevel || 0);
  setValue("levelMaxCards", currentSettings.level.maxCards);
  setValue("levelFontSize", currentSettings.level.fontSize || 26);
  setValue("levelCardHeight", currentSettings.level.cardHeight || 90);

  renderColorEditors(currentSettings);
  await loadState();
  await loadUrls();
  setStatus("설정을 불러왔습니다.");
}

function collectSettings() {
  const giftTiers = (currentSettings.gift.tiers || []).map((tier, i) => ({ ...tier, color: getColor(`giftTier_${i}`) }));
  const levelTiers = (currentSettings.level.tiers || []).map((tier, i) => ({ ...tier, color: getColor(`levelTier_${i}`) }));
  return {
    activePreset: getValue("activePreset"),
    gift: {
      showGiftName: getChecked("showGiftName"),
      showGiftImage: getChecked("showGiftImage"),
      showProfileImage: getChecked("showProfileImage"),
      showDiamondValue: getChecked("showDiamondValue"),
      sortMode: getValue("sortMode"),
      minCoins: getNum("minCoins"),
      maxCards: getNum("maxCards"),
      fontSize: getNum("giftFontSize"),
      cardHeight: getNum("giftCardHeight"),
      pinnedIds: currentSettings.gift.pinnedIds || [],
      colors: getColor("giftBase"),
      superFanColor: getColor("superFan"),
      tiers: giftTiers
    },
    level: {
      enabled: getChecked("levelEnabled"),
      sortMode: getValue("levelSortMode"),
      minLevel: getNum("minLevel"),
      maxCards: getNum("levelMaxCards"),
      fontSize: getNum("levelFontSize"),
      cardHeight: getNum("levelCardHeight"),
      pinnedIds: currentSettings.level.pinnedIds || [],
      colors: getColor("levelBase"),
      tiers: levelTiers
    }
  };
}

async function saveSettings() {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectSettings())
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  currentSettings = data.settings;
  renderPresetPalette();
  setStatus("저장 완료. 오버레이에 곧 반영됩니다.");
  await loadState();
}

function applyPresetToUI(key = getValue("activePreset")) {
  const preset = presets[key];
  if (!preset) return;
  setValue("activePreset", key);
  currentSettings.activePreset = key;
  setColor("giftBase", preset.gift);
  setColor("levelBase", preset.level);
  setColor("superFan", preset.superFan || preset.gift);
  (currentSettings.gift.tiers || []).forEach((tier, i) => setColor(`giftTier_${i}`, preset.giftTiers?.[i]?.color || preset.gift));
  (currentSettings.level.tiers || []).forEach((tier, i) => setColor(`levelTier_${i}`, preset.levelTiers?.[i]?.color || preset.level));
  renderPresetPalette();
  setStatus("프리셋을 화면에 적용했습니다. 저장 버튼을 눌러 반영하세요.");
}

async function loadState() {
  const res = await fetch(`/api/state/${encodeURIComponent(clientId)}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  latestState = await res.json();
  currentSettings = latestState.settings;
  renderPresetPalette();
  renderPinList("gift", latestState.gifts || []);
  renderPinList("level", latestState.levelCards || []);
}

function renderPinList(type, items) {
  const el = type === "gift" ? $("giftPinList") : $("levelPinList");
  if (!items.length) {
    el.innerHTML = `<div class="pin-empty">현재 표시 중인 ${type === "gift" ? "기프트" : "레벨업"} 카드가 없습니다.</div>`;
    return;
  }
  el.innerHTML = items.map((item) => {
    const title = type === "gift"
      ? `${item.nickname || "익명"} / ${item.giftName || "Gift"}`
      : `${item.nickname || "익명"} / Lv.${item.previousLevel || 0} → Lv.${item.level || 0}`;
    const sub = type === "gift"
      ? `${item.isSuperFan ? "슈퍼팬 · " : ""}${Number(item.totalCoins || 0).toLocaleString()}코인 · ${new Date(item.createdAt || Date.now()).toLocaleTimeString()}`
      : `${new Date(item.createdAt || Date.now()).toLocaleTimeString()}`;
    return `<label class="pin-row">
      <input type="checkbox" data-pin-type="${type}" data-pin-id="${escapeHtml(item.id)}" ${item.pinned ? "checked" : ""}>
      <span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(sub)}</span></span>
      <em>${item.pinned ? "고정중" : "일반"}</em>
    </label>`;
  }).join("");
}

async function togglePin(type, id, pinned) {
  const res = await fetch(`/api/pins/${encodeURIComponent(clientId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id, pinned })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  latestState = data.state;
  currentSettings = latestState.settings;
  renderPinList("gift", latestState.gifts || []);
  renderPinList("level", latestState.levelCards || []);
  setStatus(pinned ? "카드를 상단 고정했습니다." : "고정을 해제했습니다.");
}

async function loadUrls() {
  const res = await fetch(`/api/client/${encodeURIComponent(clientId)}/overlays`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  $("urlList").innerHTML = (data.overlays || []).map((overlay) => `
    <div class="url-card">
      <b>${escapeHtml(overlay.name)}</b>
      <input readonly value="${escapeHtml(overlay.overlayUrl)}">
      <button type="button" data-open-url="${escapeHtml(overlay.overlayUrl)}">열기</button>
      <button type="button" data-copy-url="${escapeHtml(overlay.overlayUrl)}">복사</button>
    </div>
  `).join("");
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  document.querySelectorAll(".tab-page").forEach((page) => page.classList.toggle("active", page.dataset.page === tab));
}

document.querySelector(".tabs").addEventListener("click", (event) => {
  const btn = event.target.closest(".tab");
  if (btn) switchTab(btn.dataset.tab);
});

document.body.addEventListener("change", async (event) => {
  const input = event.target.closest("input[data-pin-id]");
  if (!input) return;
  await togglePin(input.dataset.pinType, input.dataset.pinId, input.checked).catch((err) => setStatus(`고정 변경 실패: ${err.message}`));
});

document.body.addEventListener("click", async (event) => {
  const openBtn = event.target.closest("[data-open-url]");
  const copyBtn = event.target.closest("[data-copy-url]");
  const presetBtn = event.target.closest("[data-preset-key]");
  if (openBtn) window.open(openBtn.dataset.openUrl, "_blank");
  if (copyBtn) {
    await navigator.clipboard.writeText(copyBtn.dataset.copyUrl);
    setStatus("URL을 복사했습니다.");
  }
  if (presetBtn) applyPresetToUI(presetBtn.dataset.presetKey);
});

$("saveBtn").addEventListener("click", () => saveSettings().catch((err) => setStatus(`저장 실패: ${err.message}`)));
$("reloadStateBtn").addEventListener("click", () => loadState().then(() => setStatus("목록을 새로고침했습니다.")).catch((err) => setStatus(`목록 로드 실패: ${err.message}`)));
function getTestPayload() {
  const nickname = getValue("testNickname") || "엄청긴닉네임_전광판테스트_닉네임이흘러가야함";
  return {
    userId: "test-user",
    uniqueId: "test_user",
    nickname,
    coins: getNum("testGiftCoins") || 0,
    count: Math.max(1, getNum("testGiftCount") || 1),
    level: getNum("testLevelValue") || 0,
    previousLevel: Math.max(0, (getNum("testLevelValue") || 0) - 1),
    superFan: getChecked("testIsSuperFan")
  };
}

$("testGiftBtn").addEventListener("click", async () => {
  await fetch(`/api/test/${encodeURIComponent(clientId)}/gift`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getTestPayload())
  });
  await loadState();
  setStatus("테스트 기프트를 보냈습니다.");
});

$("testLevelBtn").addEventListener("click", async () => {
  await fetch(`/api/test/${encodeURIComponent(clientId)}/level`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getTestPayload())
  });
  await loadState();
  setStatus("테스트 레벨업을 보냈습니다.");
});

$("testSuperFanBtn").addEventListener("click", async () => {
  const payload = getTestPayload();
  await fetch(`/api/test/${encodeURIComponent(clientId)}/superfan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  await loadState();
  setStatus("테스트 유저를 슈퍼팬으로 등록했습니다.");
});
$("resetBtn").addEventListener("click", async () => {
  await fetch(`/api/reset/${encodeURIComponent(clientId)}`, { method: "POST" });
  await loadState();
  setStatus("화면 상태를 초기화했습니다. 슈퍼팬 기록과 설정은 유지됩니다.");
});

loadSettings().catch((err) => setStatus(`설정 로드 실패: ${err.message}`));
setInterval(() => loadState().catch(() => {}), 3000);
