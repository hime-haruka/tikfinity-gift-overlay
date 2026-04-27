const clientId = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "default");
const $ = (id) => document.getElementById(id);
const status = $("status");

$("clientLabel").textContent = `Client ID: ${clientId}`;
$("overlayLink").href = `/overlay/${encodeURIComponent(clientId)}`;

function setStatus(msg) { status.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`; }
function getChecked(id) { return $(id).checked; }
function getValue(id) { return $(id).value; }
function getNum(id) { return Number($(id).value || 0); }
function setChecked(id, v) { $(id).checked = Boolean(v); }

function colorToHex(value) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return "#" + raw.slice(1).split("").map((c) => c + c).join("");
  }
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    return "#" + [m[1], m[2], m[3]]
      .map((n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0"))
      .join("");
  }
  return "#000000";
}

function setValue(id, v) {
  const el = $(id);
  el.value = el.type === "color" ? colorToHex(v) : (v ?? "");
}

async function loadSettings() {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}`);
  const { settings } = await res.json();
  setChecked("showGiftName", settings.gift.showGiftName);
  setChecked("showGiftImage", settings.gift.showGiftImage);
  setChecked("showProfileImage", settings.gift.showProfileImage);
  setChecked("showDiamondValue", settings.gift.showDiamondValue);
  setValue("sortMode", settings.gift.sortMode);
  setValue("minCoins", settings.gift.minCoins);
  setValue("maxCards", settings.gift.maxCards);
  setValue("giftDuration", settings.gift.displayDurationMs);
  setChecked("giftUseGradient", settings.gift.colors.useGradient);
  setValue("giftText", settings.gift.colors.text);
  setValue("giftBorder", settings.gift.colors.border);
  setValue("giftBg", settings.gift.colors.background);
  setValue("giftGradFrom", settings.gift.colors.gradientFrom);
  setValue("giftGradTo", settings.gift.colors.gradientTo);

  setChecked("levelEnabled", settings.level.enabled);
  setValue("levelMaxCards", settings.level.maxCards);
  setValue("levelDuration", settings.level.displayDurationMs);
  setChecked("levelUseGradient", settings.level.colors.useGradient);
  setValue("levelText", settings.level.colors.text);
  setValue("levelBorder", settings.level.colors.border);
  setValue("levelBg", settings.level.colors.background);
  setValue("levelGradFrom", settings.level.colors.gradientFrom);
  setValue("levelGradTo", settings.level.colors.gradientTo);
  setStatus("설정을 불러왔습니다.");
}

function collectSettings() {
  return {
    gift: {
      showGiftName: getChecked("showGiftName"),
      showGiftImage: getChecked("showGiftImage"),
      showProfileImage: getChecked("showProfileImage"),
      showDiamondValue: getChecked("showDiamondValue"),
      sortMode: getValue("sortMode"),
      minCoins: getNum("minCoins"),
      maxCards: getNum("maxCards"),
      displayDurationMs: getNum("giftDuration"),
      colors: {
        useGradient: getChecked("giftUseGradient"),
        text: getValue("giftText"),
        border: getValue("giftBorder"),
        background: getValue("giftBg"),
        gradientFrom: getValue("giftGradFrom"),
        gradientTo: getValue("giftGradTo")
      }
    },
    level: {
      enabled: getChecked("levelEnabled"),
      maxCards: getNum("levelMaxCards"),
      displayDurationMs: getNum("levelDuration"),
      colors: {
        useGradient: getChecked("levelUseGradient"),
        text: getValue("levelText"),
        border: getValue("levelBorder"),
        background: getValue("levelBg"),
        gradientFrom: getValue("levelGradFrom"),
        gradientTo: getValue("levelGradTo")
      }
    }
  };
}

$("saveBtn").addEventListener("click", async () => {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectSettings())
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  setStatus("저장 완료. 오버레이에 곧 반영됩니다.");
});

$("testGiftBtn").addEventListener("click", async () => {
  await fetch(`/api/test/${encodeURIComponent(clientId)}/gift`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coins: 10, count: 3 }) });
  setStatus("테스트 기프트를 보냈습니다.");
});
$("testLevelBtn").addEventListener("click", async () => {
  await fetch(`/api/test/${encodeURIComponent(clientId)}/level`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ previousLevel: 3, level: 4 }) });
  setStatus("테스트 레벨업을 보냈습니다.");
});
$("resetBtn").addEventListener("click", async () => {
  await fetch(`/api/reset/${encodeURIComponent(clientId)}`, { method: "POST" });
  setStatus("화면 상태를 초기화했습니다.");
});

loadSettings().catch((err) => setStatus(`설정 로드 실패: ${err.message}`));
