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

function now() {
  return Date.now();
}

function safeClientId(clientId) {
  return String(clientId || "default").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "default";
}

const state = {
  clients: {}
};

function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const json = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (json?.clients && typeof json.clients === "object") {
      state.clients = json.clients;
    }
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
          memberLevels: client.memberLevels || {}
        };
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(compact, null, 2));
    } catch (err) {
      console.error("[state] failed to save state file", err);
    }
  }, 300);
}

loadState();

export function getClient(clientIdRaw) {
  const clientId = safeClientId(clientIdRaw);
  if (!state.clients[clientId]) {
    state.clients[clientId] = {
      settings: structuredClone(DEFAULT_SETTINGS),
      gifts: [],
      levelCards: [],
      memberLevels: {},
      recentEvents: [],
      seenEventIds: {}
    };
    scheduleSave();
  }
  const client = state.clients[clientId];
  client.settings = deepMerge(DEFAULT_SETTINGS, client.settings || {});
  client.gifts ||= [];
  client.levelCards ||= [];
  client.memberLevels ||= {};
  client.recentEvents ||= [];
  client.seenEventIds ||= {};
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

export function addGift(client, gift) {
  const s = client.settings.gift;
  if (Number(gift.totalCoins || 0) < Number(s.minCoins || 0)) return null;

  const item = {
    ...gift,
    id: gift.id || `gift:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    createdAt: gift.createdAt || now()
  };

  client.gifts.unshift(item);
  const max = Math.max(1, Number(s.maxCards || 8));

  if (client.gifts.length > max) {
    if (s.sortMode === "amount") {
      client.gifts = client.gifts
        .sort((a, b) => (b.totalCoins || 0) - (a.totalCoins || 0) || (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, max);
    } else {
      client.gifts = client.gifts
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, max);
    }
  }

  return item;
}

export function addLevelCard(client, card) {
  if (!client.settings.level.enabled) return null;
  const item = {
    ...card,
    id: card.id || `level:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    createdAt: card.createdAt || now()
  };
  client.levelCards.unshift(item);
  const max = Math.max(1, Number(client.settings.level.maxCards || 4));
  client.levelCards = client.levelCards
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, max);
  return item;
}

export function getPublicState(clientIdRaw) {
  const { clientId, client } = getClient(clientIdRaw);
  const t = now();

  // 표시 시간으로 자동 제거하지 않습니다.
  // 새 이벤트가 들어오면 정렬/최대 카드 수 기준으로 오래된 카드만 교체됩니다.
  const giftMax = Math.max(1, Number(client.settings.gift.maxCards || 8));
  const levelMax = Math.max(1, Number(client.settings.level.maxCards || 4));

  const sortMode = client.settings.gift.sortMode;
  const gifts = [...client.gifts].sort((a, b) => {
    if (sortMode === "amount") return (b.totalCoins || 0) - (a.totalCoins || 0) || (b.createdAt || 0) - (a.createdAt || 0);
    return (b.createdAt || 0) - (a.createdAt || 0);
  }).slice(0, giftMax);

  const levelCards = [...client.levelCards]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, levelMax);

  return {
    clientId,
    settings: client.settings,
    gifts,
    levelCards,
    serverTime: t
  };
}

export function resetClient(clientIdRaw) {
  const { client } = getClient(clientIdRaw);
  client.gifts = [];
  client.levelCards = [];
  client.recentEvents = [];
  return getPublicState(clientIdRaw);
}
