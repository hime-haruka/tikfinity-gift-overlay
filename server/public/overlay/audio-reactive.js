const pathParts = location.pathname.split("/").filter(Boolean);
const clientId = pathParts[1] || "default";
const canvas = document.getElementById("audioCanvas");
const ctx = canvas.getContext("2d");
const guide = document.getElementById("permissionGuide");
const startBtn = document.getElementById("startAudioBtn");

let settings = {
  enabled: true,
  type: "bars",
  color: "#ff4da6",
  sensitivity: 1.25,
  smoothing: 0.82,
  count: 64,
  size: 1,
  speed: 1,
  opacity: 0.92,
  mirror: false,
  glow: true,
  position: "bottom"
};

let audioCtx = null;
let analyser = null;
let dataArray = null;
let started = false;
let particles = [];
let lastSettingsSignature = "";
let time = 0;

function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n) || 0)); }
function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function hexToRgb(hex) {
  const raw = String(hex || "#ff4da6").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbString(rgb, alpha = 1) { return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`; }
function mix(rgb, amount) {
  const to = amount >= 0 ? 255 : 0;
  const p = Math.abs(amount);
  return {
    r: Math.round(rgb.r + (to - rgb.r) * p),
    g: Math.round(rgb.g + (to - rgb.g) * p),
    b: Math.round(rgb.b + (to - rgb.b) * p)
  };
}
function colorVariants(base) {
  const rgb = hexToRgb(base);
  return [rgb, mix(rgb, .22), mix(rgb, .42), mix(rgb, -.18), mix(rgb, .62)];
}
function applySettings(next = {}) {
  settings = {
    ...settings,
    ...next,
    sensitivity: clamp(next.sensitivity ?? settings.sensitivity, .2, 4),
    smoothing: clamp(next.smoothing ?? settings.smoothing, 0, .95),
    count: Math.round(clamp(next.count ?? settings.count, 12, 160)),
    size: clamp(next.size ?? settings.size, .4, 3),
    speed: clamp(next.speed ?? settings.speed, .2, 3),
    opacity: clamp(next.opacity ?? settings.opacity, .1, 1)
  };
  const sig = JSON.stringify({ type: settings.type, count: settings.count, color: settings.color });
  if (sig !== lastSettingsSignature) {
    particles = [];
    lastSettingsSignature = sig;
  }
  if (analyser) analyser.smoothingTimeConstant = settings.smoothing;
}
window.applySettings = applySettings;

async function loadSettings() {
  const res = await fetch(`/api/settings/${encodeURIComponent(clientId)}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  applySettings(data.settings?.audioReactive || {});
}
async function startAudio() {
  if (started) return;
  await loadSettings().catch(() => {});
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = settings.smoothing;
  source.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  started = true;
  guide.hidden = true;
}
function getLevel(data, index, bins) {
  if (!data?.length) return 0;
  const start = Math.floor((index / bins) * data.length);
  const end = Math.max(start + 1, Math.floor(((index + 1) / bins) * data.length));
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i] || 0;
  return clamp((sum / (end - start) / 255) * settings.sensitivity, 0, 1.6);
}
function yBase(height) {
  if (settings.position === "top") return height * 0.18;
  if (settings.position === "center") return height * 0.5;
  if (settings.position === "full") return height * 0.5;
  return height * 0.84;
}
function clear() { ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
function prepareDraw(alpha = settings.opacity) {
  const variants = colorVariants(settings.color);
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = settings.glow ? 16 * settings.size : 0;
  ctx.shadowColor = rgbString(variants[1], .8);
  return variants;
}
function drawBars(data) {
  const w = window.innerWidth, h = window.innerHeight;
  const variants = prepareDraw();
  const count = settings.count;
  const barW = w / count;
  const baseY = yBase(h);
  for (let i = 0; i < count; i++) {
    const level = getLevel(data, i, count);
    const barH = Math.max(3, level * h * 0.42 * settings.size);
    const x = i * barW + barW * .12;
    const y = settings.position === "top" ? baseY : baseY - barH;
    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, rgbString(variants[2], .95));
    grad.addColorStop(1, rgbString(variants[0], .45));
    ctx.fillStyle = grad;
    roundRect(x, y, barW * .72, barH, Math.min(12, barW * .36));
    ctx.fill();
    if (settings.mirror) {
      const mx = w - x - barW * .72;
      roundRect(mx, y, barW * .72, barH, Math.min(12, barW * .36));
      ctx.fill();
    }
  }
}
function drawBubbles(data) {
  const w = window.innerWidth, h = window.innerHeight;
  const variants = prepareDraw();
  const count = settings.count;
  const baseY = yBase(h);
  for (let i = 0; i < count; i++) {
    const level = getLevel(data, i, count);
    const x = (i + .5) / count * w;
    const drift = Math.sin(time * .02 * settings.speed + i) * 18 * settings.size;
    const y = settings.position === "full" ? (i * 97 % h) : baseY - level * 160 * settings.size + drift;
    const r = Math.max(2, (5 + level * 22) * settings.size);
    ctx.beginPath();
    ctx.fillStyle = rgbString(variants[i % variants.length], .36 + level * .42);
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
function ensureParticles(data) {
  const target = settings.count;
  const variants = colorVariants(settings.color);
  while (particles.length < target) {
    const i = particles.length;
    particles.push({
      x: Math.random() * window.innerWidth,
      y: yBase(window.innerHeight) + (Math.random() - .5) * 80,
      vx: (Math.random() - .5) * .7,
      vy: -(.4 + Math.random() * 1.5),
      life: Math.random(),
      symbol: pickSymbol(settings.type),
      color: variants[i % variants.length]
    });
  }
  particles = particles.slice(0, target);
}
function pickSymbol(type) {
  if (type === "hearts") return ["♥", "♡", "❤"][Math.floor(Math.random() * 3)];
  if (type === "stars") return ["★", "✦", "✧", "✩"][Math.floor(Math.random() * 4)];
  if (type === "notes") return ["♪", "♫", "♬", "♩"][Math.floor(Math.random() * 4)];
  if (type === "sparkles") return ["✦", "✧", "·"][Math.floor(Math.random() * 3)];
  return "•";
}
function drawParticles(data) {
  const w = window.innerWidth, h = window.innerHeight;
  const avg = data?.length ? data.reduce((a, b) => a + b, 0) / data.length / 255 * settings.sensitivity : .1;
  ensureParticles(data);
  prepareDraw();
  particles.forEach((p, i) => {
    const level = getLevel(data, i % Math.max(1, settings.count), settings.count);
    p.life += .008 * settings.speed + level * .014;
    p.x += p.vx * settings.speed + Math.sin(time * .01 + i) * .18;
    p.y += p.vy * settings.speed * (1 + avg);
    if (p.life > 1 || p.y < -40 || p.x < -40 || p.x > w + 40) {
      p.x = Math.random() * w;
      p.y = settings.position === "top" ? h * .22 : (settings.position === "center" ? h * .62 : h + 30);
      p.vx = (Math.random() - .5) * .8;
      p.vy = -(.3 + Math.random() * 1.4);
      p.life = 0;
      p.symbol = pickSymbol(settings.type);
    }
    const alpha = Math.sin(Math.PI * p.life) * settings.opacity;
    const size = (settings.type === "particles" ? 10 : 18) * settings.size * (1 + level * 1.8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgbString(p.color, alpha);
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (settings.type === "particles") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, size * .22), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillText(p.symbol, p.x, p.y);
    }
  });
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
function draw() {
  requestAnimationFrame(draw);
  time += 1;
  clear();
  if (!settings.enabled) return;
  if (!started || !analyser || !dataArray) return;
  analyser.getByteFrequencyData(dataArray);
  ctx.save();
  if (settings.type === "bars") drawBars(dataArray);
  else if (settings.type === "bubbles") drawBubbles(dataArray);
  else drawParticles(dataArray);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

startBtn.addEventListener("click", () => startAudio().catch((err) => {
  guide.hidden = false;
  guide.querySelector("span").textContent = `오디오 시작 실패: ${err.message}`;
}));
window.addEventListener("resize", resize);
resize();
draw();
loadSettings().catch(() => {});
setInterval(() => loadSettings().catch(() => {}), 1000);
// 브라우저가 자동 권한을 허용하는 환경이면 바로 시작을 시도합니다.
startAudio().catch(() => { guide.hidden = false; });
