import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { addGift, addLevelCard, getClient, getPublicState, hydrateStateFromSupabase, markSeen, pushRecentEvent, recordTeamRanking, resetClient, resetTeamRanking, setPinned, updateSettings } from "./state.js";
import { extractEventName, getMemberLevelFromAnyEvent, normalizeGift, normalizeMemberLevelChange } from "./event-normalizer.js";
import { getAllowedOverlays, getRegisteredClient } from "./clients.js";
import { COLOR_PRESETS } from "./settings-defaults.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));


const wsClients = new Map();
const WS_PING_INTERVAL_MS = 30000;

function normalizeWsMode(mode) {
  const value = String(mode || "all").toLowerCase();
  return value === "team-ranking" ? "team-ranking" : value;
}

function wsKey(clientId, mode = "all") {
  return `${clientId}:${normalizeWsMode(mode)}`;
}

function addWsClient(clientId, mode, ws) {
  const key = wsKey(clientId, mode);
  if (!wsClients.has(key)) wsClients.set(key, new Set());
  wsClients.get(key).add(ws);
  ws.on("close", () => wsClients.get(key)?.delete(ws));
}

function sendWs(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  try { ws.send(JSON.stringify(payload)); } catch {}
}

function sendState(ws, clientId, mode = "all") {
  sendWs(ws, { type: "state", mode: normalizeWsMode(mode), state: getPublicState(clientId, { mode }) });
}

function broadcastState(clientId, reason = "update") {
  for (const [key, sockets] of wsClients.entries()) {
    const [keyClientId, mode] = key.split(":");
    if (keyClientId !== clientId) continue;
    const payload = { type: "state", reason, mode, state: getPublicState(clientId, { mode }) };
    for (const ws of [...sockets]) sendWs(ws, payload);
  }
}

function requireRegisteredClient(req, res, next) {
  const result = getRegisteredClient(req.params.clientId);
  if (!result.ok) {
    return res.status(result.status).json({ ok: false, clientId: result.clientId, error: result.reason });
  }
  req.clientId = result.clientId;
  req.clientMeta = result.client;
  next();
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function requireOverlayAccess(req, res, next) {
  const mode = String(req.params.mode || "all").toLowerCase();
  const allowed = getAllowedOverlays(req.params.clientId, getBaseUrl(req));
  if (!allowed.ok) return res.status(allowed.status).json({ ok: false, error: allowed.reason });
  if (!allowed.overlays.some((overlay) => overlay.id === mode)) {
    return res.status(403).type("html").send("이 Client ID에서 사용할 수 없는 오버레이입니다.");
  }
  req.clientId = allowed.clientId;
  req.clientMeta = allowed.client;
  req.overlayMode = mode;
  next();
}

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><title>TikFinity Overlay Server</title></head><body style="font-family:sans-serif;padding:32px"><h1>TikFinity Overlay Server</h1><p>Gift: <code>/overlay/CLIENT_ID/gift</code></p><p>Level: <code>/overlay/CLIENT_ID/level</code></p><p>Team Ranking: <code>/overlay/CLIENT_ID/team-ranking</code></p><p>Settings: <code>/settings/CLIENT_ID</code></p><p>Health: <a href="/health">/health</a></p></body></html>`);
});

app.get("/health", (req, res) => res.json({ ok: true, time: Date.now() }));

app.get("/api/debug/routes", (req, res) => {
  res.json({
    ok: true,
    audioApi: false,
    apiAudioPost: false,
    apiAudioGet: false,
    routes: [
      "GET /api/debug/routes",
      "GET /api/client/:clientId/overlays",
      "GET /api/settings/:clientId",
      "POST /api/settings/:clientId",
      "POST /api/events/:clientId"
    ],
    time: Date.now()
  });
});

app.get("/api/client/:clientId", requireRegisteredClient, (req, res) => {
  res.json({ ok: true, clientId: req.clientId, client: req.clientMeta });
});

app.get("/api/client/:clientId/overlays", requireRegisteredClient, (req, res) => {
  const result = getAllowedOverlays(req.clientId, getBaseUrl(req));
  res.json({ ok: true, clientId: req.clientId, client: req.clientMeta, overlays: result.overlays });
});

app.get("/api/presets", (req, res) => {
  res.json({ ok: true, presets: COLOR_PRESETS });
});

app.get("/overlay/:clientId", requireRegisteredClient, (req, res) => {
  res.redirect(302, `/overlay/${encodeURIComponent(req.clientId)}/all`);
});

app.get("/overlay/:clientId/:mode", requireOverlayAccess, (req, res) => {
  const fileName = req.overlayMode === "team-ranking" ? "team-ranking.html" : (req.overlayMode === "audio-reactive" ? "audio-reactive.html" : "overlay.html");
  res.sendFile(path.join(__dirname, "public", "overlay", fileName));
});

app.get("/control/:clientId", requireRegisteredClient, (req, res) => {
  res.redirect(302, `/settings/${encodeURIComponent(req.clientId)}`);
});

app.get("/settings/:clientId", requireRegisteredClient, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay", "control.html"));
});

app.get("/api/state/:clientId", requireRegisteredClient, (req, res) => {
  res.json(getPublicState(req.clientId, { mode: req.query.mode, full: req.query.full === "1" }));
});

app.get("/api/settings/:clientId", requireRegisteredClient, (req, res) => {
  const { clientId, client } = getClient(req.clientId);
  res.json({ clientId, settings: client.settings, presets: COLOR_PRESETS });
});

app.post("/api/settings/:clientId", requireRegisteredClient, (req, res) => {
  const settings = updateSettings(req.clientId, req.body || {});
  broadcastState(req.clientId, "settings");
  res.json({ ok: true, settings });
});

app.post("/api/pins/:clientId", requireRegisteredClient, (req, res) => {
  const { type, id, pinned } = req.body || {};
  if (!["gift", "level"].includes(type) || !id) {
    return res.status(400).json({ ok: false, error: "type(gift|level)과 id가 필요합니다." });
  }
  const state = setPinned(req.clientId, type, id, Boolean(pinned));
  broadcastState(req.clientId, "pin");
  res.json({ ok: true, state });
});

app.post("/api/reset/:clientId", requireRegisteredClient, (req, res) => {
  const state = resetClient(req.clientId);
  broadcastState(req.clientId, "reset");
  res.json({ ok: true, state });
});

app.post("/api/reset/:clientId/team-ranking", requireRegisteredClient, (req, res) => {
  const state = resetTeamRanking(req.clientId);
  broadcastState(req.clientId, "reset-team-ranking");
  res.json({ ok: true, state });
});

app.post("/api/events/:clientId", requireRegisteredClient, (req, res) => {
  const { clientId, client } = getClient(req.clientId);
  const payload = req.body || {};
  const eventName = extractEventName(payload);

  pushRecentEvent(client, { event: eventName || "unknown" });

  const gift = normalizeGift(payload);
  let giftAdded = null;
  if (gift && !markSeen(client, gift.id)) {
    giftAdded = addGift(client, gift);
  }

  const teamLevelInfo = getMemberLevelFromAnyEvent(payload);
  const teamRankingUpdated = teamLevelInfo ? recordTeamRanking(client, teamLevelInfo) : null;

  const levelCard = normalizeMemberLevelChange(client, payload);
  let levelAdded = null;
  if (levelCard && !markSeen(client, levelCard.id)) {
    levelAdded = addLevelCard(client, levelCard);
  }

  if (giftAdded || levelAdded || teamRankingUpdated) broadcastState(clientId, "event");

  res.json({
    ok: true,
    clientId,
    received: eventName,
    giftAdded: Boolean(giftAdded),
    levelAdded: Boolean(levelAdded),
    teamRankingUpdated: Boolean(teamRankingUpdated)
  });
});


// 오디오 리액티브: Receiver 앱이 전송한 주파수 데이터를 메모리에 저장/조회합니다.
// Render 무료 환경에서도 바로 동작하도록 DB 저장이 아닌 최신 프레임 캐시 방식입니다.
const audioState = new Map();

function requireAudioReactiveAccess(req, res, next) {
  const entitlements = req.clientMeta?.entitlements || {};
  if (entitlements["audio-reactive"] !== true) {
    return res.status(403).json({ ok: false, error: "audio-reactive 권한이 없습니다." });
  }
  next();
}

app.post("/api/audio/:clientId", (req, res) => {
  res.status(410).json({ ok: false, error: "audio-reactive disabled" });
});

app.get("/api/audio/:clientId", (req, res) => {
  res.status(410).json({ ok: false, error: "audio-reactive disabled" });
});

app.post("/api/test/:clientId/gift", requireRegisteredClient, (req, res) => {
  const { client } = getClient(req.clientId);
  const body = req.body || {};
  const gift = {
    id: `testgift:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    type: "gift",
    userId: body.userId || "test-user",
    uniqueId: body.uniqueId || "test_user",
    nickname: body.nickname || "엄청긴닉네임_테스트후원자_전광판확인용",
    profileImage: body.profileImage || "",
    giftId: "test-gift",
    giftName: body.giftName || "Rose",
    giftImage: body.giftImage || "",
    coins: Number(body.coins || 100),
    count: Number(body.count || 1),
    totalCoins: Number(body.coins || 100) * Number(body.count || 1),
    createdAt: Date.now()
  };
  const added = addGift(client, gift);
  if (added) broadcastState(req.clientId, "test-gift");
  res.json({ ok: true, gift: added });
});

app.post("/api/test/:clientId/team-ranking", requireRegisteredClient, (req, res) => {
  const { client } = getClient(req.clientId);
  const body = req.body || {};
  const userId = body.userId || `test-team-user-${Date.now()}`;
  const item = recordTeamRanking(client, {
    userId,
    uniqueId: body.uniqueId || userId,
    nickname: body.nickname || "팀랭킹_테스트유저",
    profileImage: body.profileImage || "",
    level: Number(body.teamLevel || body.level || 25)
  });
  if (item) broadcastState(req.clientId, "test-team-ranking");
  res.json({ ok: true, teamRanking: item });
});

app.post("/api/test/:clientId/level", requireRegisteredClient, (req, res) => {
  const { client } = getClient(req.clientId);
  const body = req.body || {};
  const card = {
    id: `testlevel:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    type: "member_level_up",
    userId: body.userId || "test-user",
    uniqueId: body.uniqueId || "test_user",
    nickname: body.nickname || "엄청긴닉네임_레벨업멤버_전광판확인용",
    profileImage: body.profileImage || "",
    previousLevel: Number(body.previousLevel || 9),
    level: Number(body.level || 10),
    createdAt: Date.now()
  };
  const added = addLevelCard(client, card);
  if (added) broadcastState(req.clientId, "test-level");
  res.json({ ok: true, level: added });
});

await hydrateStateFromSupabase();

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const clientId = String(url.searchParams.get("clientId") || "default");
    const mode = normalizeWsMode(url.searchParams.get("mode") || "all");
    const access = getRegisteredClient(clientId);
    if (!access.ok) {
      sendWs(ws, { type: "error", error: access.reason });
      ws.close(1008, access.reason);
      return;
    }
    addWsClient(access.clientId, mode, ws);
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });
    sendState(ws, access.clientId, mode);
  } catch (err) {
    sendWs(ws, { type: "error", error: err.message || "websocket error" });
    ws.close(1011, "websocket error");
  }
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch { ws.terminate(); }
  }
}, WS_PING_INTERVAL_MS).unref?.();

server.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
  console.log(`[server] websocket enabled at /ws?clientId=CLIENT_ID&mode=all`);
});
