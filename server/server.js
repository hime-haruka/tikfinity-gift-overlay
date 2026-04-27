import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { addGift, addLevelCard, getClient, getPublicState, markSeen, pushRecentEvent, resetClient, updateSettings } from "./state.js";
import { extractEventName, normalizeGift, normalizeMemberLevelChange } from "./event-normalizer.js";
import { getRegisteredClient } from "./clients.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function requireRegisteredClient(req, res, next) {
  const result = getRegisteredClient(req.params.clientId);
  if (!result.ok) {
    return res.status(result.status).json({ ok: false, clientId: result.clientId, error: result.reason });
  }
  req.clientId = result.clientId;
  req.clientMeta = result.client;
  next();
}

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><title>TikFinity Gift Overlay</title></head><body style="font-family:sans-serif;padding:32px"><h1>TikFinity Gift Overlay Server</h1><p>Overlay: <code>/overlay/CLIENT_ID</code></p><p>Settings: <code>/settings/CLIENT_ID</code></p><p>Health: <a href="/health">/health</a></p></body></html>`);
});

app.get("/health", (req, res) => res.json({ ok: true, time: Date.now() }));

app.get("/api/client/:clientId", requireRegisteredClient, (req, res) => {
  res.json({ ok: true, clientId: req.clientId, client: req.clientMeta });
});

app.get("/overlay/:clientId", requireRegisteredClient, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay", "overlay.html"));
});

app.get("/control/:clientId", requireRegisteredClient, (req, res) => {
  res.redirect(302, `/settings/${encodeURIComponent(req.clientId)}`);
});

app.get("/settings/:clientId", requireRegisteredClient, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay", "control.html"));
});

app.get("/api/state/:clientId", requireRegisteredClient, (req, res) => {
  res.json(getPublicState(req.clientId));
});

app.get("/api/settings/:clientId", requireRegisteredClient, (req, res) => {
  const { clientId, client } = getClient(req.clientId);
  res.json({ clientId, settings: client.settings });
});

app.post("/api/settings/:clientId", requireRegisteredClient, (req, res) => {
  const settings = updateSettings(req.clientId, req.body || {});
  res.json({ ok: true, settings });
});

app.post("/api/reset/:clientId", requireRegisteredClient, (req, res) => {
  res.json({ ok: true, state: resetClient(req.clientId) });
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

  const levelCard = normalizeMemberLevelChange(client, payload);
  let levelAdded = null;
  if (levelCard && !markSeen(client, levelCard.id)) {
    levelAdded = addLevelCard(client, levelCard);
  }

  res.json({
    ok: true,
    clientId,
    received: eventName,
    giftAdded: Boolean(giftAdded),
    levelAdded: Boolean(levelAdded)
  });
});

app.post("/api/test/:clientId/gift", requireRegisteredClient, (req, res) => {
  const { client } = getClient(req.clientId);
  const body = req.body || {};
  const gift = {
    id: `testgift:${Date.now()}`,
    type: "gift",
    userId: "test-user",
    uniqueId: "test_user",
    nickname: body.nickname || "테스트 후원자",
    profileImage: body.profileImage || "",
    giftId: "test-gift",
    giftName: body.giftName || "Rose",
    giftImage: body.giftImage || "",
    coins: Number(body.coins || 1),
    count: Number(body.count || 1),
    totalCoins: Number(body.coins || 1) * Number(body.count || 1),
    createdAt: Date.now()
  };
  res.json({ ok: true, gift: addGift(client, gift) });
});

app.post("/api/test/:clientId/level", requireRegisteredClient, (req, res) => {
  const { client } = getClient(req.clientId);
  const body = req.body || {};
  const card = {
    id: `testlevel:${Date.now()}`,
    type: "member_level_up",
    userId: "test-user",
    uniqueId: "test_user",
    nickname: body.nickname || "테스트 멤버",
    profileImage: body.profileImage || "",
    previousLevel: Number(body.previousLevel || 1),
    level: Number(body.level || 2),
    createdAt: Date.now()
  };
  res.json({ ok: true, level: addLevelCard(client, card) });
});

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
});
