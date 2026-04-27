const { app, BrowserWindow, ipcMain, shell, clipboard } = require("electron");
const path = require("path");
const WebSocket = require("ws");
const Store = require("electron-store");

const store = new Store({
  defaults: {
    serverUrl: "https://YOUR-RENDER-APP.onrender.com",
    clientId: "client-a",
    autoStart: false,
    tikfinityWsUrl: "ws://localhost:21213/"
  }
});

let mainWindow = null;
let ws = null;
let reconnectTimer = null;
let running = false;
let lastHealthTimer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 680,
    minWidth: 760,
    minHeight: 580,
    title: "TikFinity Gift Receiver",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, "renderer.html"));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function log(message, data) {
  send("log", { time: new Date().toLocaleTimeString(), message, data });
}

function getConfig() {
  const serverUrl = String(store.get("serverUrl") || "").replace(/\/+$/, "");
  const clientId = String(store.get("clientId") || "default").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "default";
  const tikfinityWsUrl = String(store.get("tikfinityWsUrl") || "ws://localhost:21213/");
  return { serverUrl, clientId, tikfinityWsUrl, autoStart: Boolean(store.get("autoStart")) };
}

async function postEvent(payload) {
  const { serverUrl, clientId } = getConfig();
  if (!serverUrl || serverUrl.includes("YOUR-RENDER-APP")) {
    throw new Error("Render 서버 URL을 먼저 입력하세요.");
  }
  const res = await fetch(`${serverUrl}/api/events/${encodeURIComponent(clientId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Render 전송 실패: HTTP ${res.status}`);
  return res.json();
}

async function checkServerHealth() {
  const { serverUrl } = getConfig();
  if (!serverUrl || serverUrl.includes("YOUR-RENDER-APP")) {
    send("server-status", { ok: false, message: "서버 URL 필요" });
    return false;
  }
  try {
    const res = await fetch(`${serverUrl}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    send("server-status", { ok: true, message: "Render 연결 정상" });
    return true;
  } catch (err) {
    send("server-status", { ok: false, message: err.message });
    return false;
  }
}

function normalizeForLog(payload) {
  return {
    event: payload?.event || payload?.type || payload?.data?.event || "unknown",
    uniqueId: payload?.data?.uniqueId || payload?.data?.username || payload?.uniqueId || "",
    giftName: payload?.data?.giftName || payload?.data?.gift?.name || "",
    repeatCount: payload?.data?.repeatCount || payload?.data?.count || ""
  };
}

function scheduleReconnect() {
  if (!running) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connectTikfinity(), 1200);
}

function connectTikfinity() {
  const { tikfinityWsUrl } = getConfig();
  if (!running) return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  send("tikfinity-status", { ok: false, message: "TikFinity 연결 중..." });
  log(`TikFinity 연결 시도: ${tikfinityWsUrl}`);

  ws = new WebSocket(tikfinityWsUrl);

  ws.on("open", () => {
    send("tikfinity-status", { ok: true, message: "TikFinity 연결 정상" });
    log("TikFinity WebSocket 연결 성공");
  });

  ws.on("message", async (buf) => {
    let payload;
    try {
      payload = JSON.parse(buf.toString());
    } catch (err) {
      log("수신 JSON 파싱 실패", err.message);
      return;
    }

    const small = normalizeForLog(payload);
    log(`수신: ${small.event}${small.uniqueId ? ` @${small.uniqueId}` : ""}${small.giftName ? ` / ${small.giftName} x${small.repeatCount || 1}` : ""}`);

    try {
      const result = await postEvent(payload);
      if (result.giftAdded || result.levelAdded) {
        log(`Render 표시 이벤트 생성: ${result.giftAdded ? "gift " : ""}${result.levelAdded ? "level" : ""}`.trim());
      }
      send("server-status", { ok: true, message: "Render 전송 정상" });
    } catch (err) {
      send("server-status", { ok: false, message: err.message });
      log("Render 전송 실패", err.message);
    }
  });

  ws.on("close", () => {
    send("tikfinity-status", { ok: false, message: "TikFinity 연결 끊김" });
    log("TikFinity 연결 끊김. 자동 재연결 예정");
    ws = null;
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    send("tikfinity-status", { ok: false, message: "TikFinity 연결 실패" });
    log("TikFinity 연결 오류", err.message);
    try { ws?.close(); } catch {}
    ws = null;
    scheduleReconnect();
  });
}

function startReceiver() {
  running = true;
  clearInterval(lastHealthTimer);
  checkServerHealth();
  lastHealthTimer = setInterval(checkServerHealth, 10_000);
  connectTikfinity();
  send("running", true);
}

function stopReceiver() {
  running = false;
  clearTimeout(reconnectTimer);
  clearInterval(lastHealthTimer);
  try { ws?.close(); } catch {}
  ws = null;
  send("running", false);
  send("tikfinity-status", { ok: false, message: "정지됨" });
  log("Receiver 정지");
}

ipcMain.handle("get-config", () => getConfig());
ipcMain.handle("save-config", (event, cfg) => {
  if (cfg.serverUrl !== undefined) store.set("serverUrl", String(cfg.serverUrl).replace(/\/+$/, ""));
  if (cfg.clientId !== undefined) store.set("clientId", String(cfg.clientId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "default");
  if (cfg.tikfinityWsUrl !== undefined) store.set("tikfinityWsUrl", String(cfg.tikfinityWsUrl));
  if (cfg.autoStart !== undefined) store.set("autoStart", Boolean(cfg.autoStart));
  log("설정 저장 완료");
  return getConfig();
});
ipcMain.handle("start", () => startReceiver());
ipcMain.handle("stop", () => stopReceiver());
ipcMain.handle("check-server", () => checkServerHealth());
function getClientUrls() {
  const { serverUrl, clientId } = getConfig();
  const safeServerUrl = serverUrl || "";
  const safeClientId = encodeURIComponent(clientId || "default");
  return {
    overlayUrl: safeServerUrl ? `${safeServerUrl}/overlay/${safeClientId}` : "",
    controlUrl: safeServerUrl ? `${safeServerUrl}/control/${safeClientId}` : ""
  };
}

ipcMain.handle("get-client-urls", () => getClientUrls());
ipcMain.handle("copy-overlay-url", () => {
  const { overlayUrl } = getClientUrls();
  if (!overlayUrl) throw new Error("Render 서버 URL을 먼저 입력하세요.");
  clipboard.writeText(overlayUrl);
  log("오버레이 URL 복사 완료", overlayUrl);
  return overlayUrl;
});
ipcMain.handle("copy-control-url", () => {
  const { controlUrl } = getClientUrls();
  if (!controlUrl) throw new Error("Render 서버 URL을 먼저 입력하세요.");
  clipboard.writeText(controlUrl);
  log("설정 페이지 URL 복사 완료", controlUrl);
  return controlUrl;
});
ipcMain.handle("open-overlay", () => {
  const { overlayUrl } = getClientUrls();
  shell.openExternal(overlayUrl);
});
ipcMain.handle("open-control", () => {
  const { controlUrl } = getClientUrls();
  shell.openExternal(controlUrl);
});
ipcMain.handle("send-test-gift", async () => {
  const { serverUrl, clientId } = getConfig();
  const res = await fetch(`${serverUrl}/api/test/${encodeURIComponent(clientId)}/gift`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coins: 10, count: 2 }) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  log("테스트 기프트 전송");
  return res.json();
});

app.whenReady().then(() => {
  createWindow();
  if (store.get("autoStart")) setTimeout(startReceiver, 900);
});

app.on("window-all-closed", () => {
  stopReceiver();
  if (process.platform !== "darwin") app.quit();
});
