import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");

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
      createdAt: new Date().toISOString().slice(0, 10)
    }
  };
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(initial, null, 2));
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

  return { ok: true, status: 200, clientId, client };
}

export function listRegisteredClients() {
  return readClients();
}
