const GIFT_TIER_RANGES = [
  { label: "1~499", min: 1, max: 499 },
  { label: "500~4,999", min: 500, max: 4999 },
  { label: "5,000~9,999", min: 5000, max: 9999 },
  { label: "10,000+", min: 10000, max: null }
];

function normalizeGiftTierRanges(settings) {
  settings.gift ||= {};
  const current = Array.isArray(settings.gift.tiers) ? settings.gift.tiers : [];
  let colorSource = current;

  if (current.length === 5) {
    colorSource = [current[0], current[2], current[3], current[4]];
  }

  settings.gift.tiers = GIFT_TIER_RANGES.map((range, index) => ({
    ...range,
    color: colorSource[index]?.color || DEFAULT_SETTINGS.gift.tiers[index]?.color || DEFAULT_SETTINGS.gift.colors
  }));
}

import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "./settings-defaults.js";
import { fetchAllClientStates, isSupabaseEnabled, upsertClientState } from "./supabase.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const REMOTE_SAVE_DELAY_MS = Number(process.env.REMOTE_SAVE_DELAY_MS || 30000);
const LOCAL_SAVE_DELAY_MS = Number(process.env.LOCAL_SAVE_DELAY_MS || 5000);
const MAX_FEED_ITEMS_IN_MEMORY = Number(process.env.MAX_FEED_ITEMS_IN_MEMORY || 60);
const MAX_RECENT_EVENTS = Number(process.env.MAX_RECENT_EVENTS || 20);

function compactPersistentTeamRanking(teamRanking = {}) {
  const entries = Object.entries(teamRanking || {})
    .filter(([, item]) => Number(item?.teamLevel || 0) > 0)
    .map(([key, item]) => [key, {
      userId: item.userId || key,
      uniqueId: item.uniqueId || "",
      nickname: item.nickname || "익명",
      profileImage: item.profileImage || "",
      teamLevel: Number(item.teamLevel || 0),
      lastUpdate: Number(item.lastUpdate || 0),
      createdAt: Number(item.createdAt || item.lastUpdate || Date.now())
    }]);
  return Object.fromEntries(entries);
}

function getPinnedFeedItemsForPersistence(client) {
  const giftPins = new Set((client.settings?.gift?.pinnedIds || []).map(String));
  const levelPins = new Set((client.settings?.level?.pinnedIds || []).map(String));
  return (client.feedItems || [])
    .filter((item) => (isGift(item) && giftPins.has(String(item.id))) || (isLevel(item) && levelPins.has(String(item.id))))
    .map(compactFeedItem)
    .filter(Boolean);
}

function currentKstDayKey() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function cleanupDailyVolatileItems(client) {
  const today = currentKstDayKey();
  if (!client._volatileDay) {
    client._volatileDay = today;
    return;
  }
  if (client._volatileDay === today) return;
  client.feedItems = getPinnedFeedItemsForPersistence(client);
  client.gifts = [];
  client.levelCards = [];
  client.recentEvents = [];
  client.seenEventIds = {};
  client._volatileDay = today;
}

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
let remoteSaveTimer = null;
let remoteSaveInFlight = false;
let remoteSaveQueued = false;
const dirtyClientIds = new Set();

function createClientSnapshot(client) {
  normalizeClientShape(client);
  return {
    settings: client.settings,
    state: {
      // DB 장기 저장은 고정 핀 + 팀 랭킹 중심으로 제한합니다.
      // 일반 기프트/레벨 카드는 메모리에서만 유지되어 재배포/다음날 운영 시 자연스럽게 비워집니다.
      memberLevels: client.memberLevels || {},
      teamRanking: compactPersistentTeamRanking(client.teamRanking || {}),
      feedItems: getPinnedFeedItemsForPersistence(client)
    }
  };
}

function createAllSnapshots() {
  const snapshots = {};
  for (const [clientId, client] of Object.entries(state.clients)) {
    normalizeClientShape(client);
    snapshots[clientId] = createClientSnapshot(client);
  }
  return snapshots;
}

function writeLocalStateFile(snapshots) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const compact = { clients: {} };
  for (const [clientId, snapshot] of Object.entries(snapshots)) {
    compact.clients[clientId] = {
      settings: snapshot.settings,
      memberLevels: snapshot.state.memberLevels || {},
      teamRanking: snapshot.state.teamRanking || {},
      feedItems: snapshot.state.feedItems || []
    };
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(compact, null, 2));
}

async function saveRemoteDirtyClients() {
  if (!isSupabaseEnabled()) return;
  if (remoteSaveInFlight) {
    remoteSaveQueued = true;
    return;
  }
  const ids = [...dirtyClientIds];
  dirtyClientIds.clear();
  if (!ids.length) return;

  remoteSaveInFlight = true;
  try {
    for (const clientId of ids) {
      const client = state.clients[clientId];
      if (!client) continue;
      await upsertClientState(clientId, createClientSnapshot(client));
    }
  } catch (err) {
    console.error('[state] failed to save Supabase state', err);
    for (const clientId of ids) dirtyClientIds.add(clientId);
  } finally {
    remoteSaveInFlight = false;
    if (remoteSaveQueued || dirtyClientIds.size) {
      remoteSaveQueued = false;
      clearTimeout(remoteSaveTimer);
      remoteSaveTimer = setTimeout(saveRemoteDirtyClients, REMOTE_SAVE_DELAY_MS);
    }
  }
}

function scheduleSave(clientIdRaw = null) {
  const clientId = clientIdRaw ? safeClientId(clientIdRaw) : null;
  if (clientId) dirtyClientIds.add(clientId);
  else for (const id of Object.keys(state.clients)) dirtyClientIds.add(id);

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const snapshots = createAllSnapshots();
      writeLocalStateFile(snapshots);
    } catch (err) {
      console.error('[state] failed to save local state', err);
    }
  }, LOCAL_SAVE_DELAY_MS);

  clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(saveRemoteDirtyClients, REMOTE_SAVE_DELAY_MS);
}

loadState();

function applyPersistedClient(client, persisted) {
  if (!persisted || typeof persisted !== 'object') return;
  if (persisted.settings && typeof persisted.settings === 'object') {
    client.settings = persisted.settings;
  }
  const persistedState = persisted.state && typeof persisted.state === 'object' ? persisted.state : persisted;
  client.memberLevels = persistedState.memberLevels || client.memberLevels || {};
  client.teamRanking = compactPersistentTeamRanking(persistedState.teamRanking || client.teamRanking || {});
  // DB에는 고정 핀만 저장하므로 복원 feedItems도 고정 카드 위주입니다.
  client.feedItems = Array.isArray(persistedState.feedItems) ? persistedState.feedItems : [];
  client.gifts = [];
  client.levelCards = [];
}

export async function hydrateStateFromSupabase() {
  if (!isSupabaseEnabled()) {
    console.log('[state] Supabase env not set. Using local memory/file state only.');
    return { ok: false, enabled: false };
  }
  try {
    const rows = await fetchAllClientStates();
    for (const row of rows) {
      const clientId = safeClientId(row.client_id);
      if (!clientId) continue;
      state.clients[clientId] ||= {
        settings: structuredClone(DEFAULT_SETTINGS),
        gifts: [],
        levelCards: [],
        feedItems: [],
        memberLevels: {},
        teamRanking: {},
        recentEvents: [],
        seenEventIds: {}
      };
      applyPersistedClient(state.clients[clientId], { settings: row.settings, state: row.state });
      normalizeClientShape(state.clients[clientId]);
    }
    console.log(`[state] Supabase hydrated ${rows.length} client state row(s).`);
    return { ok: true, enabled: true, count: rows.length };
  } catch (err) {
    console.error('[state] failed to hydrate Supabase state', err);
    return { ok: false, enabled: true, error: err.message };
  }
}

function normalizeClientShape(client) {
  client.settings = deepMerge(DEFAULT_SETTINGS, client.settings || {});
  normalizeGiftTierRanges(client.settings);
  client.settings.gift.pinnedIds ||= [];
  client.settings.level.pinnedIds ||= [];
  client.settings.level.sortMode ||= "latest";
  client.settings.level.minLevel ??= 0;
  if (client.settings.gift.superFanIds) delete client.settings.gift.superFanIds;
  if (client.settings.gift.superFanColor) delete client.settings.gift.superFanColor;
  client.teamRanking ||= {};
  client.settings.teamRanking = deepMerge(DEFAULT_SETTINGS.teamRanking, client.settings.teamRanking || {});
  client.settings.audioReactive = deepMerge(DEFAULT_SETTINGS.audioReactive, client.settings.audioReactive || {});
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
  cleanupDailyVolatileItems(client);
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
      teamRanking: {},
      recentEvents: [],
      seenEventIds: {}
    };
    scheduleSave(clientId);
  }
  const client = state.clients[clientId];
  client._clientId = clientId;
  normalizeClientShape(client);
  return { clientId, client };
}

export function updateSettings(clientIdRaw, patch) {
  const { client } = getClient(clientIdRaw);
  client.settings = deepMerge(client.settings, patch || {});
  normalizeGiftTierRanges(client.settings);
  client.settings.gift.pinnedIds = sanitizePinnedIds(client.settings.gift.pinnedIds, client.feedItems, "gift");
  client.settings.level.pinnedIds = sanitizePinnedIds(client.settings.level.pinnedIds, client.feedItems, "level");
  scheduleSave(clientIdRaw);
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
  client.recentEvents = client.recentEvents.slice(0, MAX_RECENT_EVENTS);
}

function isGift(item) { return item.feedType === "gift" || item.type === "gift"; }
function isLevel(item) { return item.feedType === "level" || item.type === "member_level_up"; }

function sortItems(items, sortMode) {
  const list = [...items];
  if (sortMode === "amount") {
    return list.sort((a, b) => Number(b.totalCoins || 0) - Number(a.totalCoins || 0) || (b.createdAt || 0) - (a.createdAt || 0));
  }
  if (sortMode === "level") {
    return list.sort((a, b) => Number(b.level || 0) - Number(a.level || 0) || (b.createdAt || 0) - (a.createdAt || 0));
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
  let all = client.feedItems.filter(isWanted);
  if (type === "level") {
    all = all.filter((item) => Number(item.level || 0) >= Number(settings.minLevel || 0));
  }
  const max = Math.max(1, Number(settings.maxCards || (type === "gift" ? 8 : 4)));
  const sortMode = type === "gift" ? client.settings.gift.sortMode : (client.settings.level.sortMode || "latest");
  const { pinned, normal } = splitPinned(all, settings.pinnedIds, sortMode);
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
    .slice(0, MAX_FEED_ITEMS_IN_MEMORY);

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
  scheduleSave(client._clientId);
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
  scheduleSave(client._clientId);
  return item;
}


export function recordTeamRanking(client, info) {
  if (!info?.userId) return null;
  client.teamRanking ||= {};
  const key = String(info.userId);
  const prev = client.teamRanking[key] || {};
  const nextLevel = Number(info.level || info.teamLevel || 0);
  if (!Number.isFinite(nextLevel) || nextLevel <= 0) return null;

  const previousLevel = Number(prev.teamLevel || 0);
  if (previousLevel === nextLevel && (info.nickname || "") === (prev.nickname || "") && (info.profileImage || "") === (prev.profileImage || "")) {
    return null;
  }
  client.teamRanking[key] = {
    userId: key,
    uniqueId: info.uniqueId || prev.uniqueId || "",
    nickname: info.nickname || prev.nickname || "익명",
    profileImage: info.profileImage || prev.profileImage || "",
    teamLevel: nextLevel,
    lastUpdate: now(),
    createdAt: prev.createdAt || now()
  };
  scheduleSave(client._clientId);
  return client.teamRanking[key];
}

export function getTeamRankingList(client) {
  const settings = client.settings?.teamRanking || {};
  const max = Math.max(1, Math.min(100, Number(settings.maxItems || 5)));
  return Object.values(client.teamRanking || {})
    .filter((item) => Number(item.teamLevel || 0) > 0)
    .sort((a, b) => Number(b.teamLevel || 0) - Number(a.teamLevel || 0) || Number(b.lastUpdate || 0) - Number(a.lastUpdate || 0))
    .slice(0, max)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function setPinned(clientIdRaw, type, id, pinned) {
  const { client } = getClient(clientIdRaw);
  const key = type === "level" ? "level" : "gift";
  const ids = new Set((client.settings[key].pinnedIds || []).map(String));
  if (pinned) ids.add(String(id));
  else ids.delete(String(id));
  client.settings[key].pinnedIds = [...ids];
  trimFeed(client);
  scheduleSave(clientIdRaw);
  return getPublicState(clientIdRaw);
}

function compactGift(item) {
  return {
    id: item.id,
    feedType: "gift",
    type: item.type || "gift",
    nickname: item.nickname || item.username || "익명",
    username: item.username || item.uniqueId || "",
    profileImage: item.profileImage || "",
    giftName: item.giftName || "Gift",
    giftImage: item.giftImage || "",
    coins: Number(item.coins || 0),
    count: Number(item.count || 1),
    totalCoins: Number(item.totalCoins || 0),
    createdAt: item.createdAt || 0,
    pinned: Boolean(item.pinned)
  };
}

function compactLevel(item) {
  return {
    id: item.id,
    feedType: "level",
    type: item.type || "member_level_up",
    nickname: item.nickname || "익명",
    profileImage: item.profileImage || "",
    previousLevel: Number(item.previousLevel || 0),
    level: Number(item.level || 0),
    createdAt: item.createdAt || 0,
    pinned: Boolean(item.pinned)
  };
}

function compactFeedItem(item) {
  return isGift(item) ? compactGift(item) : compactLevel(item);
}

function compactTeamRankingItem(item) {
  return {
    rank: Number(item.rank || 0),
    userId: item.userId || "",
    uniqueId: item.uniqueId || "",
    nickname: item.nickname || "익명",
    profileImage: item.profileImage || "",
    teamLevel: Number(item.teamLevel || 0),
    lastUpdate: item.lastUpdate || 0
  };
}

export function getPublicState(clientIdRaw, options = {}) {
  const { clientId, client } = getClient(clientIdRaw);
  const mode = String(options.mode || "all").toLowerCase();
  trimFeed(client);
  const gifts = displayItems(client, "gift").map(compactGift);
  const levelCards = displayItems(client, "level").map(compactLevel);
  const feedItems = [...gifts, ...levelCards].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.feedType !== b.feedType) return a.feedType === "gift" ? -1 : 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  }).map(compactFeedItem);
  const teamRanking = getTeamRankingList(client).map(compactTeamRankingItem);

  const state = {
    clientId,
    settings: client.settings,
    serverTime: now()
  };

  if (mode === "gift") {
    state.gifts = gifts;
    state.feedItems = gifts;
  } else if (mode === "level") {
    state.levelCards = levelCards;
    state.feedItems = levelCards;
  } else if (mode === "team-ranking") {
    state.teamRanking = teamRanking;
  } else {
    state.feedItems = feedItems;
    state.gifts = gifts;
    state.levelCards = levelCards;
    state.teamRanking = teamRanking;
  }

  if (options.full === true) {
    state.allItems = client.feedItems.map(compactFeedItem);
  }

  return state;
}

export function resetClient(clientIdRaw) {
  const { client } = getClient(clientIdRaw);

  const pinnedGiftIds = new Set((client.settings.gift.pinnedIds || []).map(String));
  const pinnedLevelIds = new Set((client.settings.level.pinnedIds || []).map(String));

  client.feedItems = (client.feedItems || []).filter((item) => {
    const id = String(item.id);
    if (isGift(item)) return pinnedGiftIds.has(id);
    if (isLevel(item)) return pinnedLevelIds.has(id);
    return false;
  });

  client.settings.gift.pinnedIds = sanitizePinnedIds(client.settings.gift.pinnedIds, client.feedItems, "gift");
  client.settings.level.pinnedIds = sanitizePinnedIds(client.settings.level.pinnedIds, client.feedItems, "level");
  client.gifts = displayItems(client, "gift");
  client.levelCards = displayItems(client, "level");
  client.recentEvents = [];
  scheduleSave(clientIdRaw);
  return getPublicState(clientIdRaw);
}

export function resetTeamRanking(clientIdRaw) {
  const { client } = getClient(clientIdRaw);
  client.teamRanking = {};
  scheduleSave(clientIdRaw);
  return getPublicState(clientIdRaw);
}
