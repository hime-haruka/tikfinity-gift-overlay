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

function boolOrUndefined(v) {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function hasSuperFanBadge(data) {
  const badges = Array.isArray(data?.userBadges) ? data.userBadges : [];
  const sceneTypes = Array.isArray(data?.userSceneTypes) ? data.userSceneTypes : [];
  return badges.some((badge) => Number(badge?.badgeSceneType) === 10) || sceneTypes.some((type) => Number(type) === 10);
}

function hasDirectSuperFanFlag(data) {
  return data?.isSubscriber === true || data?.isMember === true || data?.isSuperFan === true || data?.subscriber === true || data?.superFan === true;
}

function hasSuperFanSignal(data) {
  return hasDirectSuperFanFlag(data) || hasSuperFanBadge(data);
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

  // 중요: count/amount/totalCount 계열은 누적값으로 들어오는 경우가 있어 수량이 튈 수 있습니다.
  // 예: 장미 1개가 2개, 20개가 137개처럼 표시되는 문제.
  // 표시 수량은 TikFinity의 repeatCount만 사용하고, 없으면 1개로 처리합니다.
  const rawRepeatCount = numOrNull(data.repeatCount, data.repeat_count, data.repeat?.count);
  const count = Math.max(1, Math.floor(rawRepeatCount ?? 1));

  // 연속 선물은 중간 이벤트가 여러 번 들어오므로, 완료 이벤트만 카드로 만듭니다.
  // repeatEnd가 아예 없는 이벤트는 일반 선물로 보고 1회 수신합니다.
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
    superFan: hasSuperFanSignal(data),
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

  // First observation is baseline only. Do not show a card.
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

export function normalizeSuperFanEvent(payload) {
  const eventName = extractEventName(payload).replace(/[_\-\s]/g, "").toLowerCase();
  const data = extractData(payload);
  const user = data.user || data.sender || data.member || data.owner || data.envelopeInfo?.user || {};

  // 슈퍼팬 판정 기준을 엄격하게 제한합니다.
  // teamMemberLevel은 팀 레벨 랭킹용 값이라 슈퍼팬 판정에 쓰지 않습니다.
  const superFanEvents = new Set([
    "superfan",
    "superfanjoin",
    "superfanbox",
    "subscribe",
    "subscription",
    "subscriber",
    "memberjoin",
    "membershipjoin"
  ]);
  const eventSignal = superFanEvents.has(eventName);
  const flagSignal = hasDirectSuperFanFlag(data);
  const badgeSignal = hasSuperFanBadge(data);

  if (!eventSignal && !flagSignal && !badgeSignal) return null;

  const userId = str(
    data.userId,
    data.user_id,
    data.uniqueId,
    data.username,
    data.nickname,
    user.userId,
    user.user_id,
    user.uniqueId,
    user.username,
    user.nickname
  );
  if (!userId) return null;

  return {
    type: eventName === "superfanbox" ? "super_fan_box" : "super_fan",
    eventName: eventName || "superfanbadge",
    userId,
    uniqueId: str(data.uniqueId, data.username, user.uniqueId, user.username),
    nickname: str(data.nickname, data.displayName, user.nickname, user.displayName, data.uniqueId, data.username, "익명"),
    profileImage: str(data.profilePictureUrl, data.profileImage, data.avatar, user.profilePictureUrl, user.profileImage, user.avatar),
    content: str(data.content?.defaultPattern, data.commonBarrageContent?.defaultPattern),
    source: eventSignal ? "event" : flagSignal ? "flag" : "badgeSceneType10",
    verified: true,
    createdAt: Date.now()
  };
}
