import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "./settings-defaults.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return structuredClone(base);
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      out[key] = value;
    } else if (value && typeof value === "object") {
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
  client.settings.gift.pinnedIds ||= [];
  client.settings.level.pinnedIds ||= [];
  client.settings.gift.superFanIds ||= [];
  client.gifts ||= [];
  client.levelCards ||= [];
  client.feedItems ||= [];
  client.memberLevels ||= {};
  client.recentEvents ||= [];
  client.seenEventIds ||= {};

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
  client.settings.gift.pinnedIds = sanitizePinnedIds(client.settings.gift.pinnedIds, client.feedItems, "gift");
  client.settings.level.pinnedIds = sanitizePinnedIds(client.settings.level.pinnedIds, client.feedItems, "level");
  scheduleSave();
  return client.settings;
}

function sanitizePinnedIds(ids, feedItems, type) {
  const allowed = new Set(feedItems.filter((item) => item.feedType === type).map((item) => String(item.id)));
  return [...new Set((ids || []).map(String))].filter((id) => allowed.has(id));
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

function isGift(item) { return item.feedType === "gift" || item.type === "gift"; }
function isLevel(item) { return item.feedType === "level" || item.type === "member_level_up"; }

function sortItems(items, sortMode) {
  const list = [...items];
  if (sortMode === "amount") {
    return list.sort((a, b) => Number(b.totalCoins || 0) - Number(a.totalCoins || 0) || (b.createdAt || 0) - (a.createdAt || 0));
  }
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function splitPinned(items, pinnedIds, sortMode) {
  const pinSet = new Set((pinnedIds || []).map(String));
  const pinned = items.filter((item) => pinSet.has(String(item.id))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const normal = sortItems(items.filter((item) => !pinSet.has(String(item.id))), sortMode);
  return { pinned, normal };
}

function displayItems(client, type) {
  const isWanted = type === "gift" ? isGift : isLevel;
  const settings = client.settings[type];
  const all = client.feedItems.filter(isWanted);
  const max = Math.max(1, Number(settings.maxCards || (type === "gift" ? 8 : 4)));
  const { pinned, normal } = splitPinned(all, settings.pinnedIds, type === "gift" ? client.settings.gift.sortMode : "latest");
  return [...pinned.map((item) => ({ ...item, pinned: true })), ...normal.slice(0, max).map((item) => ({ ...item, pinned: false }))];
}

function trimFeed(client) {
  client.settings.gift.pinnedIds = sanitizePinnedIds(client.settings.gift.pinnedIds, client.feedItems, "gift");
  client.settings.level.pinnedIds = sanitizePinnedIds(client.settings.level.pinnedIds, client.feedItems, "level");

  const keepIds = new Set([
    ...client.settings.gift.pinnedIds.map(String),
    ...client.settings.level.pinnedIds.map(String)
  ]);

  const recent = [...client.feedItems]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 120);

  const pinned = client.feedItems.filter((item) => keepIds.has(String(item.id)));
  const merged = [...pinned, ...recent];
  const seen = new Set();
  client.feedItems = merged.filter((item) => {
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  client.gifts = displayItems(client, "gift");
  client.levelCards = displayItems(client, "level");
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

export function setPinned(clientIdRaw, type, id, pinned) {
  const { client } = getClient(clientIdRaw);
  const key = type === "level" ? "level" : "gift";
  const ids = new Set((client.settings[key].pinnedIds || []).map(String));
  if (pinned) ids.add(String(id));
  else ids.delete(String(id));
  client.settings[key].pinnedIds = [...ids];
  trimFeed(client);
  scheduleSave();
  return getPublicState(clientIdRaw);
}

export function getPublicState(clientIdRaw) {
  const { clientId, client } = getClient(clientIdRaw);
  trimFeed(client);
  const gifts = displayItems(client, "gift");
  const levelCards = displayItems(client, "level");
  const feedItems = [...gifts, ...levelCards].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.feedType !== b.feedType) return a.feedType === "gift" ? -1 : 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  return {
    clientId,
    settings: client.settings,
    feedItems,
    gifts,
    levelCards,
    allItems: client.feedItems,
    serverTime: now()
  };
}

export function resetClient(clientIdRaw) {
  const { client } = getClient(clientIdRaw);
  client.gifts = [];
  client.levelCards = [];
  client.feedItems = [];
  client.recentEvents = [];
  client.settings.gift.pinnedIds = [];
  client.settings.level.pinnedIds = [];
  scheduleSave();
  return getPublicState(clientIdRaw);
}
