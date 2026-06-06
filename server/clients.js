import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");

export const OVERLAY_CATALOG = {
  gift: { id: "gift", name: "기프트 보드", description: "기프트 이벤트 전용 오버레이" },
  level: { id: "level", name: "레벨업 보드", description: "멤버 레벨업 전용 오버레이" },
  all: { id: "all", name: "통합 보드", description: "기프트와 레벨업을 한 화면에 표시" },
  "team-ranking": { id: "team-ranking", name: "팀 레벨 랭킹", description: "퇴장해도 유지되는 팀 레벨 랭킹 보드" },
  "audio-reactive": { id: "audio-reactive", name: "오디오 스펙트럼", description: "투명 배경 오디오 반응형 스펙트럼" },
  support: { id: "support", name: "응원단 오버레이", description: "고액 기프트 시 프로필 부채/응원봉/플래카드/LED 표시" }
};

function safeClientId(clientId) {
  return String(clientId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function ensureClientsFile() {
  if (fs.existsSync(CLIENTS_FILE)) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const initial = {
    client_test_01: {
      name: "테스트 클라이언트",
      status: "active",
      memo: "처음 배포 테스트용 ID입니다. 실제 판매 전 변경/추가해서 사용하세요.",
      createdAt: new Date().toISOString().slice(0, 10),
      entitlements: { gift: true, level: true, all: true, "team-ranking": true, support: true }
    }
  };
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(initial, null, 2));
}

function normalizeClient(client) {
  const entitlements = client?.entitlements && typeof client.entitlements === "object"
    ? client.entitlements
    : { gift: true, level: true, all: true, "team-ranking": true };
  return { ...client, entitlements };
}

function readClients() {
  try {
    ensureClientsFile();
    const json = JSON.parse(fs.readFileSync(CLIENTS_FILE, "utf8"));
    return json && typeof json === "object" ? json : {};
  } catch (err) {
    console.error("[clients] failed to read clients.json", err);
    return {};
  }
}

export function getRegisteredClient(clientIdRaw) {
  const clientId = safeClientId(clientIdRaw);
  if (!clientId) {
    return { ok: false, status: 400, clientId, reason: "Client ID가 비어 있습니다." };
  }

  const clients = readClients();
  const client = clients[clientId];

  if (!client) {
    return { ok: false, status: 404, clientId, reason: "등록되지 않은 Client ID입니다." };
  }

  if (client.status !== "active") {
    return { ok: false, status: 403, clientId, reason: "비활성화된 Client ID입니다." };
  }

  return { ok: true, status: 200, clientId, client: normalizeClient(client) };
}

export function getAllowedOverlays(clientIdRaw, baseUrl = "") {
  const result = getRegisteredClient(clientIdRaw);
  if (!result.ok) return result;
  const entitlements = result.client.entitlements || {};
  const overlays = Object.values(OVERLAY_CATALOG)
    .filter((overlay) => entitlements[overlay.id] === true)
    .map((overlay) => ({
      ...overlay,
      overlayUrl: `${baseUrl}/overlay/${encodeURIComponent(result.clientId)}/${overlay.id}`,
      settingsUrl: `${baseUrl}/settings/${encodeURIComponent(result.clientId)}`
    }));
  return { ok: true, status: 200, clientId: result.clientId, client: result.client, overlays };
}

export function listRegisteredClients() {
  return readClients();
}
