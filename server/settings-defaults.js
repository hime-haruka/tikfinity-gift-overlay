const color = (text, background, border, gradientFrom, gradientTo, useGradient = true) => ({
  text,
  background,
  border,
  gradientFrom,
  gradientTo,
  useGradient
});

export const COLOR_PRESETS = {
  cottonCandy: {
    label: "코튼 캔디",
    gift: color("#ffffff", "#ffe4f0", "#ff9ec8", "#ff9ec8", "#b9a7ff"),
    level: color("#ffffff", "#fff1e6", "#ffbd8a", "#ffbd8a", "#ff8fb8")
  },
  mintSoda: {
    label: "민트 소다",
    gift: color("#ffffff", "#dcfbf3", "#73dbc6", "#73dbc6", "#7bbcff"),
    level: color("#ffffff", "#e6f6ff", "#7bbcff", "#7bbcff", "#a8b5ff")
  },
  purpleDream: {
    label: "퍼플 드림",
    gift: color("#ffffff", "#efe9ff", "#b79cff", "#b79cff", "#ffb1dd"),
    level: color("#ffffff", "#eee8ff", "#9f8cff", "#9f8cff", "#72d6ff")
  },
  premiumGold: {
    label: "프리미엄 골드",
    gift: color("#fffaf0", "#3b2a17", "#ffd36a", "#ffd36a", "#ff8f70"),
    level: color("#fffaf0", "#3a2433", "#ffb86b", "#ffb86b", "#ff5e9f")
  },
  neonNight: {
    label: "네온 나이트",
    gift: color("#ffffff", "#16142a", "#7df9ff", "#7df9ff", "#ff4fd8"),
    level: color("#ffffff", "#171b34", "#8cff9e", "#8cff9e", "#6aa8ff")
  }
};

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
    superFanIds: [],
    colors: {
      text: "#ffffff",
      background: "#efe9ff",
      border: "#b79cff",
      useGradient: true,
      gradientFrom: "#b9a7ff",
      gradientTo: "#ffd2e8"
    },
    superFanColor: {
      text: "#fffaf0",
      background: "#3b2a17",
      border: "#ffd36a",
      useGradient: true,
      gradientFrom: "#ffd36a",
      gradientTo: "#ff6fae"
    },
    tiers: [
      { label: "0~99", min: 0, max: 99, color: color("#ffffff", "#efe9ff", "#b79cff", "#b9a7ff", "#ffd2e8") },
      { label: "100~499", min: 100, max: 499, color: color("#ffffff", "#e5f7ff", "#8ccfff", "#8ccfff", "#b9a7ff") },
      { label: "500~999", min: 500, max: 999, color: color("#ffffff", "#e7fff5", "#74d9b8", "#74d9b8", "#7bbcff") },
      { label: "1,000~4,999", min: 1000, max: 4999, color: color("#ffffff", "#fff1e6", "#ffb36c", "#ffb36c", "#ff7aa7") },
      { label: "5,000+", min: 5000, max: null, color: color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8") }
    ]
  },
  level: {
    enabled: true,
    maxCards: 4,
    fontSize: 26,
    cardHeight: 90,
    pinnedIds: [],
    colors: {
      text: "#ffffff",
      background: "#fff1e6",
      border: "#ffbd8a",
      useGradient: true,
      gradientFrom: "#ffbd8a",
      gradientTo: "#ff8fb8"
    },
    tiers: [
      { label: "Lv.0~9", min: 0, max: 9, color: color("#ffffff", "#fff1e6", "#ffbd8a", "#ffbd8a", "#ff8fb8") },
      { label: "Lv.10~19", min: 10, max: 19, color: color("#ffffff", "#e5f7ff", "#82caff", "#82caff", "#a8b5ff") },
      { label: "Lv.20~29", min: 20, max: 29, color: color("#ffffff", "#efe9ff", "#b79cff", "#b79cff", "#ff9ec8") },
      { label: "Lv.30+", min: 30, max: null, color: color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8") }
    ]
  }
};
