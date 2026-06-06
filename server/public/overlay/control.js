const parts = location.pathname.split("/").filter(Boolean);
const clientId = decodeURIComponent(parts[parts.indexOf("settings") + 1] || parts.pop() || "default");
const $ = (id) => document.getElementById(id);
const status = $("status");
let currentSettings = null;
let presets = {};
let latestState = null;
let clientEntitlements = {};

const TAB_REQUIREMENTS = {
  gift: ["gift", "all"],
  level: ["level", "all"],
  teamRanking: ["team-ranking"],
  support: ["support"],
  audioReactive: ["audio-reactive"],
  colors: ["gift", "level", "all"],
  pins: ["gift", "level", "all"],
  urls: []
};

function hasEntitlement(keys) {
  if (!keys || !keys.length) return true;
  return keys.some((key) => clientEntitlements[key] === true);
}

function isTabAllowed(tab) {
  return hasEntitlement(TAB_REQUIREMENTS[tab] || []);
}

function applyTabPermissions() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.hidden = !isTabAllowed(btn.dataset.tab);
  });
  document.querySelectorAll(".tab-page").forEach((page) => {
    page.hidden = !isTabAllowed(page.dataset.page);
  });

  const current = document.querySelector(".tab.active:not([hidden])")?.dataset.tab;
  const firstAllowed = document.querySelector(".tab:not([hidden])")?.dataset.tab || "urls";
  switchTab(current || firstAllowed);
}

const COLOR_KEYS = [
  ["text", "텍스트"],
  ["border", "테두리"],
  ["background", "배경"],
  ["gradientFrom", "그라데이션 시작"],
  ["gradientTo", "그라데이션 끝"]
];

$("clientLabel").textContent = `Client ID: ${clientId}`;

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
    const bg = `linear-gradient(135deg, ${g.gradientFrom || g.border || "#ddd"}, ${g.gradientTo || l.gradientTo || "#fff"})`;
    return `<button type="button" class="preset-chip ${key === active ? "active" : ""}" data-preset-key="${escapeHtml(key)}" title="${escapeHtml(preset.label || key)}">
      <span class="preset-dot" style="--preset-bg:${escapeHtml(bg)}"><i style="background:${escapeHtml(l.gradientFrom || l.border || "#ddd")}"></i></span>
      <span>${escapeHtml(preset.label || key)}</span>
    </button>`;
  }).join("");
}

function renderColorEditors(settings) {
  $("giftBaseColorGrid").innerHTML = colorInputs("giftBase");
  $("levelBaseColorGrid").innerHTML = colorInputs("levelBase");

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

const TEAM_COLOR_KEYS = ["text", "background", "background2", "border", "accent", "second", "third"];
function setTeamRankingColors(colors = {}) {
  TEAM_COLOR_KEYS.forEach((key) => setValue(`teamRankingColor_${key}`, colors[key]));
}
function getTeamRankingColors() {
  return Object.fromEntries(TEAM_COLOR_KEYS.map((key) => [key, getValue(`teamRankingColor_${key}`)]));
}
function setAudioSettings(audio = {}) {
  setValue("audioType", audio.type === "bubbles" ? "particles" : (audio.type || "bars"));
  setValue("audioColor", audio.color || "#ff4da6");
  setValue("audioSensitivity", audio.sensitivity ?? 1.25);
  setValue("audioNoiseGate", audio.noiseGate ?? 0.10);
  setValue("audioSmoothing", audio.smoothing ?? 0.82);
  setValue("audioCount", audio.count ?? 64);
  setValue("audioSize", audio.size ?? 1);
  setValue("audioSpeed", audio.speed ?? 1);
  setValue("audioOpacity", audio.opacity ?? 0.92);
  setValue("audioPosition", audio.position || "bottom");
  setChecked("audioMirror", audio.mirror);
  setChecked("audioGlow", audio.glow !== false);
  renderAudioPreview();
}
function getAudioSettings() {
  return {
    enabled: true,
    type: getValue("audioType"),
    color: getValue("audioColor"),
    sensitivity: getNum("audioSensitivity"),
    noiseGate: getNum("audioNoiseGate"),
    smoothing: getNum("audioSmoothing"),
    count: getNum("audioCount"),
    size: getNum("audioSize"),
    speed: getNum("audioSpeed"),
    opacity: getNum("audioOpacity"),
    position: getValue("audioPosition"),
    mirror: getChecked("audioMirror"),
    glow: getChecked("audioGlow")
  };
}
function renderAudioPreview() {
  const el = $("audioValuePreview");
  if (!el) return;
  const v = getAudioSettings();
  el.textContent = `현재값 · 타입 ${v.type} / 감도 ${v.sensitivity} / 노이즈 컷 ${v.noiseGate} / 부드러움 ${v.smoothing} / 개수 ${v.count} / 크기 ${v.size} / 속도 ${v.speed} / 투명도 ${v.opacity}`;
}

async function loadSettings() {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  currentSettings = data.settings;
  presets = data.presets || {};

  const clientRes = await fetch(`/api/client/${encodeURIComponent(clientId)}`, { cache: "no-store" });
  if (clientRes.ok) {
    const clientData = await clientRes.json();
    clientEntitlements = clientData.client?.entitlements || {};
  }
  applyTabPermissions();

  setValue("activePreset", currentSettings.activePreset || "purpleDream");
  renderPresetPalette();

  setChecked("showGiftName", currentSettings.gift.showGiftName);
  setChecked("showGiftImage", currentSettings.gift.showGiftImage);
  setChecked("showProfileImage", currentSettings.gift.showProfileImage);
  setChecked("showDiamondValue", currentSettings.gift.showDiamondValue);
  setValue("sortMode", currentSettings.gift.sortMode);
  setValue("minCoins", currentSettings.gift.minCoins);
  setValue("maxCards", currentSettings.gift.maxCards);
  setValue("giftFontSize", currentSettings.gift.fontSize || 24);
  setValue("giftCardHeight", currentSettings.gift.cardHeight || 50);
  const fanOverlay = currentSettings.gift.fanOverlay || {};
  setChecked("fanOverlayEnabled", fanOverlay.enabled !== false);
  setValue("fanOverlayTheme", fanOverlay.theme || "fan");
  setValue("fanOverlayCoinsPerUnit", fanOverlay.coinsPerUnit || 100);
  setValue("fanOverlayMaxUnits", fanOverlay.maxUnits || 30);

  setChecked("levelEnabled", currentSettings.level.enabled);
  setValue("levelMaxCards", currentSettings.level.maxCards);
  setValue("levelSortMode", currentSettings.level.sortMode || "latest");
  setValue("levelMinLevel", currentSettings.level.minLevel || 0);
  setValue("levelFontSize", currentSettings.level.fontSize || 24);
  setValue("levelCardHeight", currentSettings.level.cardHeight || 50);

  setValue("teamRankingLayout", currentSettings.teamRanking?.layout || "list");
  setValue("teamRankingMaxItems", currentSettings.teamRanking?.maxItems || 5);
  setValue("teamRankingFontSize", currentSettings.teamRanking?.fontSize || 24);
  setTeamRankingColors(currentSettings.teamRanking?.colors || {});
  setAudioSettings(currentSettings.audioReactive || {});

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
      fanOverlay: {
        enabled: getChecked("fanOverlayEnabled"),
        theme: getValue("fanOverlayTheme") || "fan",
        coinsPerUnit: Math.max(1, getNum("fanOverlayCoinsPerUnit") || 100),
        maxUnits: Math.max(1, getNum("fanOverlayMaxUnits") || 30)
      },
      pinnedIds: currentSettings.gift.pinnedIds || [],
      colors: getColor("giftBase"),
      tiers: giftTiers
    },
    level: {
      enabled: getChecked("levelEnabled"),
      maxCards: getNum("levelMaxCards"),
      sortMode: getValue("levelSortMode"),
      minLevel: getNum("levelMinLevel"),
      fontSize: getNum("levelFontSize"),
      cardHeight: getNum("levelCardHeight"),
      pinnedIds: currentSettings.level.pinnedIds || [],
      colors: getColor("levelBase"),
      tiers: levelTiers
    },
    teamRanking: {
      layout: getValue("teamRankingLayout") === "card" ? "card" : "list",
      maxItems: getNum("teamRankingMaxItems") || 5,
      fontSize: getNum("teamRankingFontSize") || 24,
      colors: getTeamRankingColors()
    },
    audioReactive: getAudioSettings()
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
  renderTeamRankingPreview(latestState.teamRanking || []);
}

function renderPinList(type, items) {
  const el = type === "gift" ? $("giftPinList") : $("levelPinList");
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<div class="pin-empty">현재 표시 중인 ${type === "gift" ? "기프트" : "레벨업"} 카드가 없습니다.</div>`;
    return;
  }
  el.innerHTML = items.map((item) => {
    const title = type === "gift"
      ? `${item.nickname || "익명"} / ${item.giftName || "Gift"}`
      : `${item.nickname || "익명"} / Lv.${item.previousLevel || 0} → Lv.${item.level || 0}`;
    const sub = type === "gift"
      ? `${Number(item.totalCoins || 0).toLocaleString()}코인 · ${new Date(item.createdAt || Date.now()).toLocaleTimeString()}`
      : `${new Date(item.createdAt || Date.now()).toLocaleTimeString()}`;
    return `<label class="pin-row">
      <input type="checkbox" data-pin-type="${type}" data-pin-id="${escapeHtml(item.id)}" ${item.pinned ? "checked" : ""}>
      <span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(sub)}</span></span>
      <em>${item.pinned ? "고정중" : "일반"}</em>
    </label>`;
  }).join("");
}


function renderTeamRankingPreview(items) {
  const el = $("teamRankingPreview");
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<div class="pin-empty">아직 수신된 팀 레벨 데이터가 없습니다.</div>`;
    return;
  }
  el.innerHTML = items.map((item) => `
    <div class="pin-row">
      <span><strong>#${escapeHtml(item.rank)} ${escapeHtml(item.nickname || "익명")} / Team Lv.${escapeHtml(item.teamLevel || 0)}</strong><span>마지막 갱신: ${escapeHtml(new Date(item.lastUpdate || Date.now()).toLocaleTimeString())}</span></span>
      <em>${escapeHtml(item.uniqueId || item.userId || "")}</em>
    </div>
  `).join("");
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
  renderTeamRankingPreview(latestState.teamRanking || []);
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


function remoteValue(id) {
  const el = $(id);
  if (!el) return "";
  if (el.type === "checkbox") return el.checked;
  return String(el.value ?? "").trim();
}
function remoteNum(id, fallback = 0) {
  const n = Number(remoteValue(id));
  return Number.isFinite(n) ? n : fallback;
}

function renderRemote(tab) {
  const panel = $("remotePanel");
  if (!panel) return;

  if (!["gift", "level", "teamRanking", "support", "pins"].includes(tab) || !isTabAllowed(tab)) {
    panel.hidden = true;
    document.body.classList.remove("has-remote");
    panel.innerHTML = "";
    return;
  }

  panel.hidden = false;
  document.body.classList.add("has-remote");

  if (tab === "teamRanking") {
    panel.innerHTML = `
      <div class="remote-head"><span>🏆</span><strong>팀 랭킹 테스트</strong></div>
      <p>팀 랭킹 오버레이에만 테스트 데이터를 보냅니다.</p>
      <label>닉네임<input id="teamNickname" type="text" value="팀랭킹_테스트유저"></label>
      <label>팀 레벨<input id="teamLevel" type="number" min="0" step="1" value="25"></label>
      <button type="button" data-remote-action="teamRanking">팀 랭킹 추가</button>
      <button type="button" class="ghost danger" data-remote-action="resetTeamRanking">팀랭킹 초기화</button>
      <button type="button" class="ghost" data-remote-action="reset">화면 초기화</button>
    `;
    return;
  }

  if (tab === "support") {
    const coinsPerUnit = Math.max(1, Number(currentSettings?.gift?.fanOverlay?.coinsPerUnit || 100));
    const sampleCoins = coinsPerUnit * 10;
    panel.innerHTML = `
      <div class="remote-head"><span>📣</span><strong>응원단 테스트</strong></div>
      <p>응원단 오버레이에 실제 기프트 이벤트와 같은 형식의 테스트 데이터를 보냅니다.</p>
      <label>닉네임<input id="giftNickname" type="text" value="응원단_테스트유저"></label>
      <div class="remote-row">
        <label>금액<input id="giftCoins" type="number" min="0" step="1" value="${sampleCoins}"></label>
        <label>수량<input id="giftCount" type="number" min="1" step="1" value="1"></label>
      </div>
      <button type="button" data-remote-action="gift">테스트 기프트</button>
      <button type="button" class="ghost" data-remote-action="reset">화면 초기화</button>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="remote-head"><span>🎛️</span><strong>테스트 리모콘</strong></div>
    <p>기프트/레벨업 통합 오버레이 테스트용입니다.</p>
    <label>기프트 닉네임<input id="giftNickname" type="text" value="테스트_기프트유저"></label>
    <div class="remote-row">
      <label>금액<input id="giftCoins" type="number" min="0" step="1" value="5000"></label>
      <label>수량<input id="giftCount" type="number" min="1" step="1" value="1"></label>
    </div>
    <button type="button" data-remote-action="gift">테스트 기프트</button>
    <hr>
    <label>레벨업 닉네임<input id="levelNickname" type="text" value="테스트_레벨업유저"></label>
    <div class="remote-row">
      <label>이전<input id="previousLevel" type="number" min="0" step="1" value="19"></label>
      <label>현재<input id="levelValue" type="number" min="0" step="1" value="20"></label>
    </div>
    <button type="button" data-remote-action="level">테스트 레벨업</button>
    <button type="button" class="ghost" data-remote-action="reset">화면 초기화</button>
  `;
}

function switchTab(tab) {
  if (!isTabAllowed(tab)) {
    tab = document.querySelector(".tab:not([hidden])")?.dataset.tab || "urls";
  }
  document.querySelectorAll(".tab").forEach((btn) => btn.classList.toggle("active", !btn.hidden && btn.dataset.tab === tab));
  document.querySelectorAll(".tab-page").forEach((page) => page.classList.toggle("active", !page.hidden && page.dataset.page === tab));
  renderRemote(tab);
}

document.querySelector(".tabs").addEventListener("click", (event) => {
  const btn = event.target.closest(".tab");
  if (btn && !btn.hidden) switchTab(btn.dataset.tab);
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
  const remoteBtn = event.target.closest("[data-remote-action]");
  if (remoteBtn) {
    await runRemoteAction(remoteBtn.dataset.remoteAction).catch((err) => setStatus(`테스트 실패: ${err.message}`));
    return;
  }
  if (openBtn) window.open(openBtn.dataset.openUrl, "_blank");
  if (copyBtn) {
    await navigator.clipboard.writeText(copyBtn.dataset.copyUrl);
    setStatus("URL을 복사했습니다.");
  }
  if (presetBtn) applyPresetToUI(presetBtn.dataset.presetKey);
});

$("saveBtn").addEventListener("click", () => saveSettings().catch((err) => setStatus(`저장 실패: ${err.message}`)));
$("reloadStateBtn").addEventListener("click", () => loadState().then(() => setStatus("목록을 새로고침했습니다.")).catch((err) => setStatus(`목록 로드 실패: ${err.message}`)));

let liveSaveTimer = null;
function scheduleLiveSave() {
  clearTimeout(liveSaveTimer);
  liveSaveTimer = setTimeout(() => saveSettings().catch((err) => setStatus(`자동 저장 실패: ${err.message}`)), 450);
}
["audioType", "audioColor", "audioSensitivity", "audioNoiseGate", "audioSmoothing", "audioCount", "audioSize", "audioSpeed", "audioOpacity", "audioPosition", "audioMirror", "audioGlow", "teamRankingLayout", "teamRankingMaxItems", "teamRankingFontSize", "fanOverlayEnabled", "fanOverlayTheme", "fanOverlayCoinsPerUnit", "fanOverlayMaxUnits", ...TEAM_COLOR_KEYS.map((key) => `teamRankingColor_${key}`)]
  .forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => { if (id.startsWith("audio")) renderAudioPreview(); scheduleLiveSave(); });
    el.addEventListener("change", () => { if (id.startsWith("audio")) renderAudioPreview(); scheduleLiveSave(); });
  });
async function runRemoteAction(action) {
  if (action === "gift") {
    const nickname = remoteValue("giftNickname") || "테스트 닉네임";
    const coins = remoteNum("giftCoins", 500);
    const count = remoteNum("giftCount", 1);
    const userId = `test-user-${Date.now()}`;
    await fetch(`/api/test/${encodeURIComponent(clientId)}/gift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, uniqueId: userId, nickname, coins, count })
    });
    await loadState();
    setStatus("테스트 기프트를 보냈습니다.");
    return;
  }
  if (action === "level") {
    const nickname = remoteValue("levelNickname") || "테스트 닉네임";
    const previousLevel = remoteNum("previousLevel", 9);
    const level = remoteNum("levelValue", 10);
    await fetch(`/api/test/${encodeURIComponent(clientId)}/level`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, previousLevel, level })
    });
    await loadState();
    setStatus("테스트 레벨업을 보냈습니다.");
    return;
  }
  if (action === "teamRanking") {
    const nickname = remoteValue("teamNickname") || "팀랭킹_테스트유저";
    const level = remoteNum("teamLevel", 25);
    const userId = `test-team-user-${Date.now()}`;
    await fetch(`/api/test/${encodeURIComponent(clientId)}/team-ranking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, uniqueId: userId, nickname, teamLevel: level })
    });
    await loadState();
    setStatus("테스트 팀랭킹 데이터를 보냈습니다.");
    return;
  }
  if (action === "resetTeamRanking") {
    if (!confirm("팀랭킹 기록을 모두 초기화할까요?")) return;
    await fetch(`/api/reset/${encodeURIComponent(clientId)}/team-ranking`, { method: "POST" });
    await loadState();
    setStatus("팀랭킹 기록을 초기화했습니다.");
    return;
  }
  if (action === "reset") {
    await fetch(`/api/reset/${encodeURIComponent(clientId)}`, { method: "POST" });
    await loadState();
    setStatus("화면 상태를 초기화했습니다. 고정된 핀, 팀랭킹 기록과 설정은 유지됩니다.");
  }
}


loadSettings().catch((err) => setStatus(`설정 로드 실패: ${err.message}`));
setInterval(() => { if (!document.hidden) loadState().catch(() => {}); }, 30000);
