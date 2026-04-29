const color = (text, background, border, gradientFrom, gradientTo, useGradient = true) => ({
  text,
  background,
  border,
  gradientFrom,
  gradientTo,
  useGradient
});

const tint = (base, steps) => steps.map((c, i) => ({ ...c, label: base[i]?.label, min: base[i]?.min, max: base[i]?.max }));

const giftRanges = [
  { label: "0~99", min: 0, max: 99 },
  { label: "100~499", min: 100, max: 499 },
  { label: "500~999", min: 500, max: 999 },
  { label: "1,000~4,999", min: 1000, max: 4999 },
  { label: "5,000+", min: 5000, max: null }
];
const levelRanges = [
  { label: "Lv.0~9", min: 0, max: 9 },
  { label: "Lv.10~19", min: 10, max: 19 },
  { label: "Lv.20~29", min: 20, max: 29 },
  { label: "Lv.30+", min: 30, max: null }
];
const tiers = (ranges, colors) => ranges.map((r, i) => ({ ...r, color: colors[i] || colors.at(-1) }));

export const COLOR_PRESETS = {
  cottonCandy: {
    label: "코튼 캔디",
    gift: color("#ffffff", "#ffe4f0", "#ff9ec8", "#ff9ec8", "#b9a7ff"),
    level: color("#ffffff", "#fff1e6", "#ffbd8a", "#ffbd8a", "#ff8fb8"),
    superFan: color("#fffaf8", "#4d2441", "#ffd1e6", "#ffd36a", "#ff6fb5"),
    giftTiers: tiers(giftRanges, [
      color("#ffffff", "#ffeaf4", "#ffb6d5", "#ffb6d5", "#d7c8ff"),
      color("#ffffff", "#ffdfef", "#ff9cc9", "#ff9cc9", "#c6b0ff"),
      color("#ffffff", "#ffd2e8", "#ff7fb8", "#ff7fb8", "#b69cff"),
      color("#ffffff", "#ffc2df", "#ff5fa5", "#ff5fa5", "#9f8cff"),
      color("#fffaf8", "#4d2441", "#ffd1e6", "#ffd36a", "#ff6fb5")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#ffffff", "#fff1e6", "#ffbd8a", "#ffbd8a", "#ff8fb8"),
      color("#ffffff", "#ffe4f0", "#ff9ec8", "#ff9ec8", "#c6b0ff"),
      color("#ffffff", "#f0e8ff", "#b69cff", "#b69cff", "#ff7fb8"),
      color("#fffaf8", "#4d2441", "#ffd1e6", "#ffd36a", "#ff6fb5")
    ])
  },
  skyCloud: {
    label: "스카이 클라우드",
    gift: color("#ffffff", "#e9f7ff", "#8ccfff", "#8ccfff", "#b8e7ff"),
    level: color("#ffffff", "#eef3ff", "#9fb7ff", "#9fb7ff", "#8be4ff"),
    superFan: color("#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff"),
    giftTiers: tiers(giftRanges, [
      color("#31506d", "#eef9ff", "#b8e7ff", "#d9f3ff", "#b8e7ff"),
      color("#ffffff", "#dff3ff", "#8ccfff", "#8ccfff", "#b8e7ff"),
      color("#ffffff", "#cbeaff", "#62bdff", "#62bdff", "#93dfff"),
      color("#ffffff", "#b9ddff", "#428dff", "#428dff", "#8be4ff"),
      color("#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#31506d", "#eef3ff", "#bdd1ff", "#dbe8ff", "#b8e7ff"),
      color("#ffffff", "#dce7ff", "#9fb7ff", "#9fb7ff", "#8be4ff"),
      color("#ffffff", "#cad7ff", "#7d9cff", "#7d9cff", "#72d6ff"),
      color("#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff")
    ])
  },
  mintSoda: {
    label: "민트 소다",
    gift: color("#ffffff", "#dcfbf3", "#73dbc6", "#73dbc6", "#7bbcff"),
    level: color("#ffffff", "#e6f6ff", "#7bbcff", "#7bbcff", "#a8b5ff"),
    superFan: color("#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff"),
    giftTiers: tiers(giftRanges, [
      color("#315e56", "#effffb", "#a9eadc", "#d9fff7", "#bde8ff"),
      color("#ffffff", "#dcfbf3", "#73dbc6", "#73dbc6", "#9ee8ff"),
      color("#ffffff", "#c9f7ec", "#45caa9", "#45caa9", "#7bbcff"),
      color("#ffffff", "#b7f0e3", "#2db997", "#2db997", "#55a8ff"),
      color("#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#315e56", "#e6f6ff", "#a8dcff", "#d9fff7", "#bde8ff"),
      color("#ffffff", "#d8f0ff", "#7bbcff", "#7bbcff", "#a8b5ff"),
      color("#ffffff", "#d8f8ff", "#58d4ef", "#58d4ef", "#73dbc6"),
      color("#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff")
    ])
  },
  purpleDream: {
    label: "퍼플 드림",
    gift: color("#ffffff", "#efe9ff", "#b79cff", "#b79cff", "#ffb1dd"),
    level: color("#ffffff", "#eee8ff", "#9f8cff", "#9f8cff", "#72d6ff"),
    superFan: color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8"),
    giftTiers: tiers(giftRanges, [
      color("#ffffff", "#f3efff", "#c9b7ff", "#c9b7ff", "#ffd1e8"),
      color("#ffffff", "#efe9ff", "#b79cff", "#b79cff", "#ffb1dd"),
      color("#ffffff", "#e4dcff", "#a283ff", "#a283ff", "#ff93cf"),
      color("#ffffff", "#d8cbff", "#8f6dff", "#8f6dff", "#ff74bf"),
      color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#ffffff", "#eee8ff", "#b79cff", "#b79cff", "#bde8ff"),
      color("#ffffff", "#e5dcff", "#9f8cff", "#9f8cff", "#72d6ff"),
      color("#ffffff", "#d9ccff", "#866bff", "#866bff", "#ff93cf"),
      color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8")
    ])
  },
  peachCream: {
    label: "피치 크림",
    gift: color("#ffffff", "#fff0e6", "#ffb888", "#ffb888", "#ff7aa7"),
    level: color("#ffffff", "#fff6dc", "#ffd06a", "#ffd06a", "#ff9d86"),
    superFan: color("#fffaf0", "#4a2d1e", "#ffd36a", "#ffd36a", "#ff8f70"),
    giftTiers: tiers(giftRanges, [
      color("#6c4c3f", "#fff7ef", "#ffd3b4", "#ffd3b4", "#ffc4d8"),
      color("#ffffff", "#fff0e6", "#ffb888", "#ffb888", "#ff9dbd"),
      color("#ffffff", "#ffe5d3", "#ff9d68", "#ff9d68", "#ff7aa7"),
      color("#ffffff", "#ffd8be", "#ff8548", "#ff8548", "#ff5f96"),
      color("#fffaf0", "#4a2d1e", "#ffd36a", "#ffd36a", "#ff8f70")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#6c4c3f", "#fff6dc", "#ffe3a8", "#ffe3a8", "#ffc4d8"),
      color("#ffffff", "#fff0c9", "#ffd06a", "#ffd06a", "#ff9d86"),
      color("#ffffff", "#ffe2b1", "#ffb84d", "#ffb84d", "#ff7aa7"),
      color("#fffaf0", "#4a2d1e", "#ffd36a", "#ffd36a", "#ff8f70")
    ])
  },
  roseGold: {
    label: "로즈 골드",
    gift: color("#fff8f4", "#3b2228", "#f5b0a2", "#f5b0a2", "#d9a86c"),
    level: color("#fff8f4", "#3b2630", "#e7a2c1", "#e7a2c1", "#d9a86c"),
    superFan: color("#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99"),
    giftTiers: tiers(giftRanges, [
      color("#fff8f4", "#5a3540", "#f7c8bd", "#f7c8bd", "#e6c38b"),
      color("#fff8f4", "#4f2d36", "#f5b0a2", "#f5b0a2", "#d9a86c"),
      color("#fff8f4", "#462832", "#ef9a9a", "#ef9a9a", "#d9a86c"),
      color("#fff8f4", "#3b2228", "#ef7d99", "#ef7d99", "#ffd36a"),
      color("#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#fff8f4", "#5a3540", "#f7c8bd", "#f7c8bd", "#e6c38b"),
      color("#fff8f4", "#4f2d36", "#e7a2c1", "#e7a2c1", "#d9a86c"),
      color("#fff8f4", "#462832", "#d987b4", "#d987b4", "#ffd36a"),
      color("#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99")
    ])
  },
  premiumGold: {
    label: "프리미엄 골드",
    gift: color("#fffaf0", "#3b2a17", "#ffd36a", "#ffd36a", "#ff8f70"),
    level: color("#fffaf0", "#3a2433", "#ffb86b", "#ffb86b", "#ff5e9f"),
    superFan: color("#fffaf0", "#2c1b0b", "#ffe694", "#ffe694", "#ff6f61"),
    giftTiers: tiers(giftRanges, [
      color("#fffaf0", "#5b4325", "#ffe0a0", "#ffe0a0", "#ffbc7a"),
      color("#fffaf0", "#4f381f", "#ffd36a", "#ffd36a", "#ff9e70"),
      color("#fffaf0", "#49321a", "#ffc340", "#ffc340", "#ff8f70"),
      color("#fffaf0", "#3b2a17", "#ffb800", "#ffb800", "#ff6f61"),
      color("#fffaf0", "#2c1b0b", "#ffe694", "#ffe694", "#ff6f61")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#fffaf0", "#5b4325", "#ffe0a0", "#ffe0a0", "#ffbc7a"),
      color("#fffaf0", "#4f381f", "#ffd36a", "#ffd36a", "#ff9e70"),
      color("#fffaf0", "#3a2433", "#ffb86b", "#ffb86b", "#ff5e9f"),
      color("#fffaf0", "#2c1b0b", "#ffe694", "#ffe694", "#ff6f61")
    ])
  },
  neonNight: {
    label: "네온 나이트",
    gift: color("#ffffff", "#16142a", "#7df9ff", "#7df9ff", "#ff4fd8"),
    level: color("#ffffff", "#171b34", "#8cff9e", "#8cff9e", "#6aa8ff"),
    superFan: color("#ffffff", "#100818", "#fff95f", "#fff95f", "#ff4fd8"),
    giftTiers: tiers(giftRanges, [
      color("#ffffff", "#252243", "#7df9ff", "#7df9ff", "#8b8cff"),
      color("#ffffff", "#201d3d", "#60dfff", "#60dfff", "#b46aff"),
      color("#ffffff", "#1c1836", "#8b8cff", "#8b8cff", "#ff4fd8"),
      color("#ffffff", "#16142a", "#ff4fd8", "#ff4fd8", "#7df9ff"),
      color("#ffffff", "#100818", "#fff95f", "#fff95f", "#ff4fd8")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#ffffff", "#252243", "#8cff9e", "#8cff9e", "#6aa8ff"),
      color("#ffffff", "#201d3d", "#6aa8ff", "#6aa8ff", "#7df9ff"),
      color("#ffffff", "#171b34", "#ff4fd8", "#ff4fd8", "#8cff9e"),
      color("#ffffff", "#100818", "#fff95f", "#fff95f", "#ff4fd8")
    ])
  },
  monochrome: {
    label: "모노크롬",
    gift: color("#ffffff", "#2f3440", "#cbd5e1", "#64748b", "#111827"),
    level: color("#ffffff", "#374151", "#d1d5db", "#6b7280", "#111827"),
    superFan: color("#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15"),
    giftTiers: tiers(giftRanges, [
      color("#ffffff", "#64748b", "#cbd5e1", "#94a3b8", "#64748b"),
      color("#ffffff", "#475569", "#cbd5e1", "#64748b", "#475569"),
      color("#ffffff", "#334155", "#e2e8f0", "#475569", "#334155"),
      color("#ffffff", "#1f2937", "#f8fafc", "#374151", "#111827"),
      color("#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#ffffff", "#64748b", "#cbd5e1", "#94a3b8", "#64748b"),
      color("#ffffff", "#475569", "#cbd5e1", "#64748b", "#475569"),
      color("#ffffff", "#334155", "#e2e8f0", "#475569", "#334155"),
      color("#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15")
    ])
  }
};

const defaultPreset = COLOR_PRESETS.purpleDream;

export const DEFAULT_SETTINGS = {
  activePreset: "purpleDream",
  gift: {
    showGiftName: true,
    showGiftImage: true,
    showProfileImage: true,
    showDiamondValue: true,
    sortMode: "latest",
    minCoins: 0,
    maxCards: 8,
    fontSize: 28,
    cardHeight: 96,
    pinnedIds: [],
    colors: defaultPreset.gift,
    superFanColor: defaultPreset.superFan,
    tiers: defaultPreset.giftTiers
  },
  level: {
    enabled: true,
    maxCards: 4,
    fontSize: 26,
    cardHeight: 90,
    pinnedIds: [],
    colors: defaultPreset.level,
    tiers: defaultPreset.levelTiers
  }
};
