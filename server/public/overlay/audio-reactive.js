const pathParts = location.pathname.split("/").filter(Boolean);
const params = new URLSearchParams(location.search);

function resolveClientId() {
  const fromQuery = params.get("clientId");
  if (fromQuery) return fromQuery;
  if (pathParts[0] === "overlay" && pathParts[2]) return pathParts[1];
  return "";
}

const clientId = resolveClientId();
const canvas = document.getElementById("audioCanvas");
const ctx = canvas.getContext("2d");
const guide = document.getElementById("permissionGuide");
const startBtn = document.getElementById("startAudioBtn");

let settings = {
  enabled: true,
  type: "bars",
  color: "#ff4da6",
  sensitivity: 1.25,
  noiseGate: 0.18,
  smoothing: 0.82,
  count: 64,
  size: 1,
  speed: 1,
  opacity: 0.92,
  mirror: false,
  glow: true,
  position: "bottom",
};

let dataArray = new Uint8Array(96);
let targetArray = new Uint8Array(96);
let started = true;
let lastAudioAt = 0;
let particles = [];
let twinkles = [];
let lastSettingsSignature = "";
let time = 0;
let energy = 0;
let peak = 0;
let activeEnergy = 0;
let lastActiveEnergy = 0;
let isPolling = false;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function hexToRgb(hex) {
  const raw = String(hex || "#ff4da6").replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbString(rgb, a = 1) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function mix(rgb, amount) {
  const to = amount >= 0 ? 255 : 0;
  const p = Math.abs(amount);
  return {
    r: Math.round(rgb.r + (to - rgb.r) * p),
    g: Math.round(rgb.g + (to - rgb.g) * p),
    b: Math.round(rgb.b + (to - rgb.b) * p),
  };
}

function colorVariants(base) {
  const rgb = hexToRgb(base);
  return [rgb, mix(rgb, 0.22), mix(rgb, 0.42), mix(rgb, -0.18), mix(rgb, 0.72)];
}

function applySettings(next = {}) {
  if (next.type === "bubbles") next.type = "particles";

  settings = {
    ...settings,
    ...next,
    sensitivity: clamp(next.sensitivity ?? settings.sensitivity, 0.2, 4),
    noiseGate: clamp(next.noiseGate ?? settings.noiseGate ?? 0.18, 0, 0.45),
    smoothing: clamp(next.smoothing ?? settings.smoothing, 0, 0.95),
    count: Math.round(clamp(next.count ?? settings.count, 12, 160)),
    size: clamp(next.size ?? settings.size, 0.4, 3),
    speed: clamp(next.speed ?? settings.speed, 0.2, 3),
    opacity: clamp(next.opacity ?? settings.opacity, 0.1, 1),
  };

  const sig = JSON.stringify({
    type: settings.type,
    count: settings.count,
    color: settings.color,
  });

  if (sig !== lastSettingsSignature) {
    particles = [];
    twinkles = [];
    lastSettingsSignature = sig;
  }
}

window.applySettings = applySettings;

async function loadSettings() {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  applySettings(data.settings?.audioReactive || {});
}

async function startAudio() {
  started = true;
  if (guide) guide.hidden = true;
}

function yBase(h) {
  if (settings.position === "top") return h * 0.18;
  if (settings.position === "center") return h * 0.58;
  if (settings.position === "full") return h * 0.86;
  return h * 0.88;
}

function clear() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
}

function prepareDraw(alpha = settings.opacity) {
  const variants = colorVariants(settings.color);
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = settings.glow ? 16 * settings.size : 0;
  ctx.shadowColor = rgbString(variants[1], 0.8);
  return variants;
}

function getLevel(data, index, bins) {
  if (!data?.length) return 0;
  const start = Math.floor((index / bins) * data.length);
  const end = Math.max(start + 1, Math.floor(((index + 1) / bins) * data.length));
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i] || 0;
  return clamp((sum / (end - start) / 255) * settings.sensitivity, 0, 1.6);
}

function getSpawnY(h) {
  if (settings.position === "top") return h * 0.28 + Math.random() * h * 0.12;
  if (settings.position === "center") return h * 0.74 + Math.random() * h * 0.1;
  return h + 30 + Math.random() * h * 0.16;
}

function getTopLimit(h) {
  return settings.position === "top" ? -h * 0.06 : -h * 0.18;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBars(data) {
  const w = innerWidth;
  const h = innerHeight;
  const variants = prepareDraw();
  const count = settings.count;
  const barW = w / count;
  const baseY = yBase(h);

  for (let i = 0; i < count; i++) {
    const level = getLevel(data, i, count);
    if (level <= 0.003) continue;

    const barH = Math.max(3, level * h * 0.42 * settings.size);
    const x = i * barW + barW * 0.12;
    const y = settings.position === "top" ? baseY : baseY - barH;

    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, rgbString(variants[2], 0.95));
    grad.addColorStop(1, rgbString(variants[0], 0.45));

    ctx.fillStyle = grad;
    roundRect(x, y, barW * 0.72, barH, Math.min(12, barW * 0.36));
    ctx.fill();

    if (settings.mirror) {
      const mx = w - x - barW * 0.72;
      roundRect(mx, y, barW * 0.72, barH, Math.min(12, barW * 0.36));
      ctx.fill();
    }
  }
}

function pickSymbol(type) {
  if (type === "hearts") return ["♥", "♡", "❤"][Math.floor(Math.random() * 3)];
  if (type === "stars") return ["★", "✦", "✧", "✩"][Math.floor(Math.random() * 4)];
  if (type === "notes") return ["♪", "♫", "♬", "♩"][Math.floor(Math.random() * 4)];
  if (type === "sparkles") return ["✦", "✧", "·"][Math.floor(Math.random() * 3)];
  return "•";
}

function ensureParticles() {
  const target = settings.count;
  const variants = colorVariants(settings.color);

  while (particles.length < target) {
    const i = particles.length;
    particles.push({
      x: Math.random() * innerWidth,
      y: getSpawnY(innerHeight),
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(0.35 + Math.random() * 1.45),
      life: Math.random(),
      symbol: pickSymbol(settings.type),
      color: variants[i % variants.length],
    });
  }

  particles = particles.slice(0, target);
}

function drawParticles(data) {
  const w = innerWidth;
  const h = innerHeight;

  ensureParticles();
  prepareDraw();

  const isQuiet = activeEnergy <= 0.012;

  particles.forEach((p, i) => {
    const level = getLevel(data, i % Math.max(1, settings.count), settings.count);
    const drive = Math.max(level, activeEnergy * 0.8);

    p.life += (isQuiet ? 0.045 : 0.008) * settings.speed + drive * 0.022;
    p.x += p.vx * settings.speed + Math.sin(time * 0.01 + i) * 0.22;
    p.y += p.vy * settings.speed * (1 + activeEnergy * 1.5);

    if (p.life > 1 || p.y < getTopLimit(h) || p.x < -60 || p.x > w + 60) {
      p.x = Math.random() * w;
      p.y = getSpawnY(h);
      p.vx = (Math.random() - 0.5) * 0.85;
      p.vy = -(0.35 + Math.random() * 1.65);
      p.life = isQuiet ? 0.94 : 0;
      p.symbol = pickSymbol(settings.type);
    }

    const quietFade = isQuiet ? 0.035 : 1;
    const alpha = Math.sin(Math.PI * p.life) * settings.opacity * quietFade;
    if (alpha <= 0.01) return;

    const size = (settings.type === "particles" ? 10 : 18) * settings.size * (1 + drive * 1.8);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgbString(p.color, alpha);
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (settings.type === "particles") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, size * 0.22), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillText(p.symbol, p.x, p.y);
    }
  });
}

function spawnTwinkle(strength = activeEnergy) {
  if (twinkles.length >= settings.count) return;

  const variants = colorVariants(settings.color);

  twinkles.push({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    life: 0,
    ttl: 0.38 + Math.random() * 0.45,
    rot: Math.random() * Math.PI,
    size: (5 + Math.random() * 16 + strength * 34) * settings.size,
    color: variants[Math.floor(Math.random() * variants.length)],
  });
}

function drawTwinkles() {
  if (activeEnergy > 0.012) {
    const chance = clamp((activeEnergy * 3.2 + peak * 0.45) * settings.speed, 0, 0.9);
    const burst = Math.min(6, Math.ceil(activeEnergy * 7));

    for (let i = 0; i < burst; i++) {
      if (Math.random() < chance) spawnTwinkle(activeEnergy);
    }
  }

  for (let i = twinkles.length - 1; i >= 0; i--) {
    const t = twinkles[i];
    const progress = clamp(t.life / t.ttl, 0, 1);
    const pulse = Math.sin(Math.PI * progress);
    const a = pulse * settings.opacity;
    const s = t.size * (0.35 + pulse * 0.95);

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rot + time * 0.006);
    ctx.globalAlpha = a;
    ctx.shadowBlur = settings.glow ? s * 1.8 : 0;
    ctx.shadowColor = rgbString(mix(t.color, 0.65), 0.85);
    ctx.strokeStyle = rgbString(mix(t.color, 0.75), 0.9);
    ctx.lineWidth = Math.max(1, s * 0.08);

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.moveTo(-s * 0.45, -s * 0.45);
    ctx.lineTo(s * 0.45, s * 0.45);
    ctx.moveTo(s * 0.45, -s * 0.45);
    ctx.lineTo(-s * 0.45, s * 0.45);
    ctx.stroke();

    ctx.fillStyle = rgbString(mix(t.color, 0.85), 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, s * 0.1), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    t.life += (activeEnergy > 0.012 ? 0.05 : 0.12) * settings.speed;
    if (t.life >= t.ttl) twinkles.splice(i, 1);
  }
}

function processLevels(levels) {
  const src = levels.slice(0, 160).map((v) => clamp(v, 0, 255));
  const arr = new Uint8Array(src.length || 96);

  if (!src.length) {
    activeEnergy = 0;
    return arr;
  }

  const avgRaw = src.reduce((a, b) => a + b, 0) / src.length / 255;
  const peakRaw = Math.max(...src) / 255;
  const gate = settings.noiseGate ?? 0.18;
  const peakGate = gate * 1.35;

  let openAmount = clamp(
    Math.max(
      (avgRaw - gate) / Math.max(0.001, 1 - gate),
      (peakRaw - peakGate) / Math.max(0.001, 1 - peakGate)
    ),
    0,
    1
  );

  if (openAmount < 0.01) openAmount = 0;

  energy = avgRaw;
  peak = peakRaw;
  activeEnergy = openAmount * settings.sensitivity;

  for (let i = 0; i < src.length; i++) {
    const normalized = src[i] / 255;
    const cut = clamp((normalized - gate) / Math.max(0.001, 1 - gate), 0, 1);
    const shaped = Math.pow(cut, 0.64) * openAmount;
    arr[i] = Math.round(clamp(shaped * 255 * settings.sensitivity, 0, 255));
  }

  if (openAmount <= 0.002) {
    for (let i = 0; i < arr.length; i++) arr[i] = 0;
  }

  return arr;
}

function draw() {
  requestAnimationFrame(draw);
  time += 1;
  clear();

  if (!settings.enabled || !started || !dataArray) return;

  // Ultra-low-latency response:
  // - Attack: immediate
  // - Release: fast but not visually broken
  for (let i = 0; i < targetArray.length; i++) {
    const current = dataArray[i] || 0;
    const target = targetArray[i] || 0;

    if (target > current) {
      dataArray[i] = target;
    } else if (target > 0) {
      dataArray[i] = Math.round(lerp(current, target, 0.62));
    } else {
      dataArray[i] = Math.round(current * 0.48);
      if (dataArray[i] < 3) dataArray[i] = 0;
    }
  }

  lastActiveEnergy = activeEnergy;

  ctx.save();

  if (settings.type === "bars") {
    drawBars(dataArray);
  } else if (settings.type === "twinkles") {
    drawTwinkles(dataArray);
  } else {
    drawParticles(dataArray);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

async function pollAudio() {
  try {
    const res = await fetch(`/api/audio/${encodeURIComponent(clientId)}?t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const levels = Array.isArray(data.levels) ? data.levels : [];

    if (levels.length) {
      targetArray = processLevels(levels);
      lastAudioAt = Date.now();

      if (guide) guide.hidden = true;
    } else if (Date.now() - lastAudioAt > 2500 && guide) {
      targetArray = new Uint8Array(96);
      activeEnergy = 0;
      guide.hidden = false;
      guide.querySelector("strong").textContent = "오디오 리시버 대기 중";
      guide.querySelector("span").textContent = "Receiver 앱에서 오디오 시작을 누르면 스펙트럼이 표시됩니다.";
      if (startBtn) startBtn.hidden = true;
    }
  } catch (err) {
    targetArray = new Uint8Array(96);
    activeEnergy = 0;

    if (Date.now() - lastAudioAt > 2500 && guide) {
      guide.hidden = false;
      guide.querySelector("strong").textContent = "오디오 데이터 수신 실패";
      guide.querySelector("span").textContent = err.message;
      if (startBtn) startBtn.hidden = true;
    }
  }
}

async function pollLoop() {
  if (isPolling) return;
  isPolling = true;

  while (true) {
    await pollAudio();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

if (startBtn) {
  startBtn.hidden = true;
  startBtn.addEventListener("click", () => startAudio().catch(() => {}));
}

addEventListener("resize", resize);
resize();

draw();
loadSettings().catch(() => {});
setInterval(() => loadSettings().catch(() => {}), 1000);

startAudio().catch(() => {});
pollLoop();
pollAudio();
