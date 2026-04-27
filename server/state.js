import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "./settings-defaults.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return structuredClone(base);
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = deepMerge(base?.[key] ?? {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function now() { return Date.now(); }
function safeClientId(clientId) {
  return String(clientId || "default").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "default";
}

const state = { clients: {} };

function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const json = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (json?.clients && typeof json.clients === "object") state.clients = json.clients;
  } catch (err) {
    console.error("[state] failed to load state file", err);
  }
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const compact = { clients: {} };
      for (const [clientId, client] of Object.entries(state.clients)) {
        compact.clients[clientId] = {
          settings: client.settings,
          memberLevels: client.memberLevels || {},
          feedItems: client.feedItems || []
        };
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(compact, null, 2));
    } catch (err) {
      console.error("[state] failed to save state file", err);
    }
  }, 300);
}

loadState();

function normalizeClientShape(client) {
  client.settings = deepMerge(DEFAULT_SETTINGS, client.settings || {});
  client.gifts ||= [];
  client.levelCards ||= [];
  client.feedItems ||= [];
  client.memberLevels ||= {};
  client.recentEvents ||= [];
  client.seenEventIds ||= {};

  // 이전 버전에서 gifts/levelCards만 저장되어 있던 경우를 위해 feedItems를 복원합니다.
  if (client.feedItems.length === 0 && (client.gifts.length || client.levelCards.length)) {
    client.feedItems = [
      ...client.gifts.map((item) => ({ ...item, feedType: "gift" })),
      ...client.levelCards.map((item) => ({ ...item, feedType: "level" }))
    ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

export function getClient(clientIdRaw) {
  const clientId = safeClientId(clientIdRaw);
  if (!state.clients[clientId]) {
    state.clients[clientId] = {
      settings: structuredClone(DEFAULT_SETTINGS),
      gifts: [],
      levelCards: [],
      feedItems: [],
      memberLevels: {},
      recentEvents: [],
      seenEventIds: {}
    };
    scheduleSave();
  }
  const client = state.clients[clientId];
  normalizeClientShape(client);
  return { clientId, client };
}

export function updateSettings(clientIdRaw, patch) {
  const { client } = getClient(clientIdRaw);
  client.settings = deepMerge(client.settings, patch || {});
  scheduleSave();
  return client.settings;
}

function cleanupSeen(client) {
  const cut = now() - 60_000;
  for (const [id, ts] of Object.entries(client.seenEventIds)) {
    if (ts < cut) delete client.seenEventIds[id];
  }
}

export function markSeen(client, eventId) {
  if (!eventId) return false;
  cleanupSeen(client);
  if (client.seenEventIds[eventId]) return true;
  client.seenEventIds[eventId] = now();
  return false;
}

export function pushRecentEvent(client, item) {
  client.recentEvents.unshift({ ...item, at: now() });
  client.recentEvents = client.recentEvents.slice(0, 60);
}

function trimFeed(client) {
  const s = client.settings.gift;
  const max = Math.max(1, Number(s.maxCards || 8));

  client.feedItems = sortFeedItems(client.feedItems, s.sortMode).slice(0, max);
  client.gifts = client.feedItems.filter((item) => item.feedType === "gift" || item.type === "gift");
  client.levelCards = client.feedItems.filter((item) => item.feedType === "level" || item.type === "member_level_up");
}

function sortFeedItems(items, sortMode) {
  const list = [...items];
  if (sortMode === "amount") {
    return list.sort((a, b) => {
      const aIsGift = a.feedType === "gift" || a.type === "gift";
      const bIsGift = b.feedType === "gift" || b.type === "gift";
      // 금액순에서는 선물끼리는 금액 우선, 레벨업 카드는 최신순으로 자연스럽게 섞되 낮은 금액 선물보다 밀리지 않게 보조값을 줍니다.
      const av = aIsGift ? Number(a.totalCoins || 0) : Number.MAX_SAFE_INTEGER;
      const bv = bIsGift ? Number(b.totalCoins || 0) : Number.MAX_SAFE_INTEGER;
      return bv - av || (b.createdAt || 0) - (a.createdAt || 0);
    });
  }
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function addGift(client, gift) {
  const s = client.settings.gift;
  if (Number(gift.totalCoins || 0) < Number(s.minCoins || 0)) return null;

  const item = {
    ...gift,
    feedType: "gift",
    id: gift.id || `gift:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    createdAt: gift.createdAt || now()
  };

  client.feedItems.unshift(item);
  trimFeed(client);
  scheduleSave();
  return item;
}

export function addLevelCard(client, card) {
  if (!client.settings.level.enabled) return null;
  const item = {
    ...card,
    feedType: "level",
    id: card.id || `level:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    createdAt: card.createdAt || now()
  };

  client.feedItems.unshift(item);
  trimFeed(client);
  scheduleSave();
  return item;
}

export function getPublicState(clientIdRaw) {
  const { clientId, client } = getClient(clientIdRaw);
  trimFeed(client);
  return {
    clientId,
    settings: client.settings,
    feedItems: client.feedItems,
    gifts: client.feedItems.filter((item) => item.feedType === "gift" || item.type === "gift"),
    levelCards: client.feedItems.filter((item) => item.feedType === "level" || item.type === "member_level_up"),
    serverTime: now()
  };
}

export function resetClient(clientIdRaw) {
  const { client } = getClient(clientIdRaw);
  client.gifts = [];
  client.levelCards = [];
  client.feedItems = [];
  client.recentEvents = [];
  scheduleSave();
  return getPublicState(clientIdRaw);
}
