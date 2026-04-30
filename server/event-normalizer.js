function num(...values) {
for (const value of values) {
const n = Number(value);
if (Number.isFinite(n)) return n;
}
return 0;
}

function numOrNull(...values) {
for (const value of values) {
if (value === undefined || value === null || value === "") continue;
const n = Number(value);
if (Number.isFinite(n)) return n;
}
return null;
}

function str(...values) {
for (const value of values) {
if (value !== undefined && value !== null && String(value).trim() !== "") return String(value);
}
return "";
}

// ✅ 추가된 부분 (에러 원인 해결)
function boolOrUndefined(value) {
if (value === undefined || value === null || value === '') return undefined;
if (typeof value === 'boolean') return value;
if (typeof value === 'string') {
const v = value.trim().toLowerCase();
if (v === 'true' || v === '1' || v === 'yes') return true;
if (v === 'false' || v === '0' || v === 'no') return false;
}
if (typeof value === 'number') return value !== 0;
return undefined;
}

export function extractEventName(payload) {
return String(payload?.event || payload?.type || payload?.data?.event || "").toLowerCase();
}

export function extractData(payload) {
return payload?.data && typeof payload.data === "object" ? payload.data : payload || {};
}

export function getMemberLevelFromAnyEvent(payload) {
const data = extractData(payload);
const userId = str(data.userId, data.user_id, data.uniqueId, data.username, data.nickname);
const level = num(
data.teamMemberLevel,
data.user?.teamMemberLevel,
data.memberLevel,
data.member_level,
data.level,
data.user?.memberLevel
);
if (!userId || level <= 0) return null;
return {
userId,
uniqueId: str(data.uniqueId, data.username, data.user?.uniqueId),
nickname: str(data.nickname, data.displayName, data.uniqueId, data.username, "익명"),
profileImage: str(data.profilePictureUrl, data.profileImage, data.avatar, data.user?.profilePictureUrl),
level
};
}

export function normalizeGift(payload) {
const eventName = extractEventName(payload);
if (eventName !== "gift") return null;
const data = extractData(payload);

const giftId = str(data.giftId, data.gift_id, data.gift?.id, data.gift?.gift_id, data.id);
const giftName = str(data.giftName, data.gift_name, data.gift?.name, data.name, "Unknown Gift");
const userId = str(data.userId, data.user_id, data.uniqueId, data.username, data.nickname);
const uniqueId = str(data.uniqueId, data.username, data.user?.uniqueId);
const nickname = str(data.nickname, data.displayName, data.uniqueId, data.username, "익명");
const profileImage = str(data.profilePictureUrl, data.profileImage, data.avatar, data.user?.profilePictureUrl);
const giftImage = str(data.giftPictureUrl, data.giftImage, data.imageUrl, data.gift?.image?.url, data.gift?.pictureUrl);
const coins = num(data.coins, data.diamondCount, data.diamond_count, data.gift?.diamond_count, data.gift?.coins);

const repeatEnd = boolOrUndefined(data.repeatEnd ?? data.repeat_end ?? data.gift?.repeatEnd);
const giftType = num(data.giftType, data.gift_type, data.gift?.type);

const rawRepeatCount = numOrNull(data.repeatCount, data.repeat_count, data.repeat?.count);
const count = Math.max(1, Math.floor(rawRepeatCount ?? 1));

if (giftType === 1 && repeatEnd === false) return null;

const msgId = str(data.msgId, data.messageId, data.eventId, data.id);
const createdAt = num(data.timestamp, data.createTime, Date.now());

const id = msgId
? `gift:${msgId}`
: `gift:${userId}:${giftId}:${count}:${Math.floor(createdAt / 1000)}`;

return {
id,
type: "gift",
userId,
uniqueId,
nickname,
profileImage,
giftId,
giftName,
giftImage,
coins,
count,
totalCoins: coins * count,
giftType,
repeatEnd,
createdAt: Date.now()
};
}

export function normalizeMemberLevelChange(client, payload) {
const info = getMemberLevelFromAnyEvent(payload);
if (!info) return null;

const prev = client.memberLevels[info.userId];
client.memberLevels[info.userId] = info.level;

if (prev === undefined || prev === null) return null;
if (info.level <= Number(prev)) return null;

return {
type: "member_level_up",
id: `level:${info.userId}:${prev}->${info.level}:${Date.now()}`,
userId: info.userId,
uniqueId: info.uniqueId,
nickname: info.nickname,
profileImage: info.profileImage,
previousLevel: Number(prev),
level: info.level,
createdAt: Date.now()
};
}
