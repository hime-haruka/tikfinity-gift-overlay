import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { addGift, addLevelCard, getClient, getPublicState, markSeen, pushRecentEvent, resetClient, updateSettings } from "./state.js";
import { extractEventName, normalizeGift, normalizeMemberLevelChange } from "./event-normalizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><title>TikFinity Gift Overlay</title></head><body style="font-family:sans-serif;padding:32px"><h1>TikFinity Gift Overlay Server</h1><p>Overlay: <code>/overlay/CLIENT_ID</code></p><p>Control: <code>/control/CLIENT_ID</code></p><p>Health: <a href="/health">/health</a></p></body></html>`);
});

app.get("/health", (req, res) => res.json({ ok: true, time: Date.now() }));

app.get("/overlay/:clientId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay", "overlay.html"));
});

app.get("/control/:clientId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay", "control.html"));
});

app.get("/api/state/:clientId", (req, res) => {
  res.json(getPublicState(req.params.clientId));
});

app.get("/api/settings/:clientId", (req, res) => {
  const { clientId, client } = getClient(req.params.clientId);
  res.json({ clientId, settings: client.settings });
});

app.post("/api/settings/:clientId", (req, res) => {
  const settings = updateSettings(req.params.clientId, req.body || {});
  res.json({ ok: true, settings });
});

app.post("/api/reset/:clientId", (req, res) => {
  res.json({ ok: true, state: resetClient(req.params.clientId) });
});

app.post("/api/events/:clientId", (req, res) => {
  const { clientId, client } = getClient(req.params.clientId);
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

app.post("/api/test/:clientId/gift", (req, res) => {
  const { client } = getClient(req.params.clientId);
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

app.post("/api/test/:clientId/level", (req, res) => {
  const { client } = getClient(req.params.clientId);
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
