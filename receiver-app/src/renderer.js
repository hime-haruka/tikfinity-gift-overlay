const $ = (id) => document.getElementById(id);
const logEl = $("log");

function setStatus(id, ok, msg) {
  const el = $(id);
  el.textContent = msg;
  el.className = ok ? "good" : "bad";
}

function addLog(row) {
  const div = document.createElement("div");
  div.className = "log-row";
  div.innerHTML = `<b>${row.time}</b> ${escapeHtml(row.message)}${row.data ? ` <span>${escapeHtml(typeof row.data === "string" ? row.data : JSON.stringify(row.data))}</span>` : ""}`;
  logEl.prepend(div);
  while (logEl.children.length > 160) logEl.removeChild(logEl.lastChild);
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function refreshUrls() {
  const urls = await window.receiver.getClientUrls();
  $("overlayUrl").value = urls.overlayUrl || "";
  $("controlUrl").value = urls.controlUrl || "";
}

async function load() {
  const cfg = await window.receiver.getConfig();
  $("clientId").value = cfg.clientId;
  $("tikfinityWsUrl").value = cfg.tikfinityWsUrl;
  $("autoStart").checked = cfg.autoStart;
  await refreshUrls();
}

async function save() {
  const cfg = await window.receiver.saveConfig({
    clientId: $("clientId").value.trim(),
    tikfinityWsUrl: $("tikfinityWsUrl").value.trim(),
    autoStart: $("autoStart").checked
  });
  $("clientId").value = cfg.clientId;
  $("tikfinityWsUrl").value = cfg.tikfinityWsUrl;
  $("autoStart").checked = cfg.autoStart;
  await refreshUrls();
}

let autosaveTimer = null;
function queueAutoSave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => save().catch((err) => addLog({ time: new Date().toLocaleTimeString(), message: "자동 저장 실패", data: err.message })), 450);
}

["clientId", "tikfinityWsUrl", "autoStart"].forEach((id) => {
  $(id).addEventListener(id === "autoStart" ? "change" : "input", queueAutoSave);
});

$("saveBtn").addEventListener("click", () => save());
$("checkBtn").addEventListener("click", async () => { await save(); await window.receiver.checkServer(); });
$("startBtn").addEventListener("click", async () => { await save(); await window.receiver.start(); });
$("stopBtn").addEventListener("click", () => window.receiver.stop());
$("openOverlayBtn").addEventListener("click", async () => { await save(); await window.receiver.openOverlay(); });
$("openControlBtn").addEventListener("click", async () => { await save(); await window.receiver.openControl(); });
$("copyOverlayBtn").addEventListener("click", async () => { await save(); await window.receiver.copyOverlayUrl(); });
$("copyControlBtn").addEventListener("click", async () => { await save(); await window.receiver.copyControlUrl(); });
$("testGiftBtn").addEventListener("click", async () => { await save(); await window.receiver.sendTestGift(); });

window.receiver.onLog(addLog);
window.receiver.onTikfinityStatus((s) => setStatus("tikfinityStatus", s.ok, s.message));
window.receiver.onServerStatus((s) => setStatus("serverStatus", s.ok, s.message));
window.receiver.onRunning((running) => setStatus("runningStatus", running, running ? "실행 중" : "정지됨"));

load();
