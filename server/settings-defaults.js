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

  cottonCandyDream: {
    label: "캔디 드림",
    gift: color("#ffffff", "#ffeaf6", "#ff9ed0", "#ff9ed0", "#a9b8ff"),
    level: color("#ffffff", "#f1eaff", "#b7a8ff", "#b7a8ff", "#ffb7dc"),
    superFan: color("#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2"),
    giftTiers: tiers(giftRanges, [
      color("#5d3f5c", "#fff3fa", "#ffc3df", "#ffd7ec", "#d9ddff"),
      color("#ffffff", "#ffeaf6", "#ffadd6", "#ffadd6", "#c7ceff"),
      color("#ffffff", "#ffdff1", "#ff92c9", "#ff92c9", "#b4c0ff"),
      color("#ffffff", "#ffd1eb", "#ff72b8", "#ff72b8", "#9faeff"),
      color("#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#5d3f5c", "#f7f1ff", "#cdc2ff", "#f7d5ec", "#d9ddff"),
      color("#ffffff", "#f1eaff", "#b7a8ff", "#b7a8ff", "#ffc3df"),
      color("#ffffff", "#eadfff", "#a192ff", "#a192ff", "#ff92c9"),
      color("#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2")
    ])
  },

  merryGoRound: {
    label: "메리 고 라운드",
    gift: color("#ffffff", "#fff1f6", "#ff8fb1", "#ff8fb1", "#ffc1d6"),
    level: color("#ffffff", "#fff3f7", "#ff9ec2", "#ff9ec2", "#ffd1df"),
    superFan: color("#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5"),
    giftTiers: tiers(giftRanges, [
      color("#74465a", "#fff8fb", "#ffc8dc", "#ffe4ed", "#ffc8dc"),
      color("#ffffff", "#fff1f6", "#ffabc8", "#ffabc8", "#ffd1df"),
      color("#ffffff", "#ffe5ef", "#ff8fb1", "#ff8fb1", "#ffc1d6"),
      color("#ffffff", "#ffd8e7", "#ff6f9f", "#ff6f9f", "#ffb2cc"),
      color("#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#74465a", "#fff8fb", "#ffc8dc", "#ffe4ed", "#ffc8dc"),
      color("#ffffff", "#fff1f6", "#ffabc8", "#ffabc8", "#ffd1df"),
      color("#ffffff", "#ffe5ef", "#ff8fb1", "#ff8fb1", "#ffc1d6"),
      color("#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5")
    ])
  },

  algorithmWitch: {
    label: "알고리즘",
    gift: color("#ffffff", "#fff1ec", "#d8b478", "#d8b478", "#9b7bff"),
    level: color("#ffffff", "#f7efff", "#b8a7ff", "#b8a7ff", "#f0c68f"),
    superFan: color("#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff"),
    giftTiers: tiers(giftRanges, [
      color("#5c4a63", "#fff8f1", "#ead2a6", "#f4ddbd", "#d7ccff"),
      color("#ffffff", "#fff1ec", "#d8b478", "#d8b478", "#c9baff"),
      color("#ffffff", "#f8e8ff", "#b8a7ff", "#b8a7ff", "#f0c68f"),
      color("#ffffff", "#efe4ff", "#9b7bff", "#9b7bff", "#d8b478"),
      color("#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#5c4a63", "#fff8f1", "#ead2a6", "#f4ddbd", "#d7ccff"),
      color("#ffffff", "#fff1ec", "#d8b478", "#d8b478", "#c9baff"),
      color("#ffffff", "#f7efff", "#b8a7ff", "#b8a7ff", "#f0c68f"),
      color("#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff")
    ])
  },

  midnightFox: {
    label: "미드나이트",
    gift: color("#ffffff", "#11112b", "#9d7bff", "#6a00ff", "#00e5ff"),
    level: color("#ffffff", "#151a36", "#7aa8ff", "#7aa8ff", "#d5b7ff"),
    superFan: color("#fffaff", "#0a0820", "#e2d6ff", "#e2d6ff", "#7df9ff"),
    giftTiers: tiers(giftRanges, [
      color("#ffffff", "#24234a", "#b8a7ff", "#b8a7ff", "#7df9ff"),
      color("#ffffff", "#1d1c40", "#9d7bff", "#9d7bff", "#00e5ff"),
      color("#ffffff", "#171735", "#7c5cff", "#7c5cff", "#00c8ff"),
      color("#ffffff", "#11112b", "#6a00ff", "#6a00ff", "#00e5ff"),
      color("#fffaff", "#0a0820", "#e2d6ff", "#e2d6ff", "#7df9ff")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#ffffff", "#24234a", "#b8a7ff", "#b8a7ff", "#7df9ff"),
      color("#ffffff", "#1d1c40", "#7aa8ff", "#7aa8ff", "#d5b7ff"),
      color("#ffffff", "#151a36", "#a86bff", "#a86bff", "#7df9ff"),
      color("#fffaff", "#0a0820", "#e2d6ff", "#e2d6ff", "#7df9ff")
    ])
  },

  moonTiger: {
    label: "월하호랑",
    gift: color("#314052", "#ffffff", "#edf3fa", "#ffffff", "#dfe8f5"),
    level: color("#ffffff", "#ffffff", "#ff6b5f", "#ffffff", "#ff6b5f"),
    superFan: color("#fffaf0", "#2b1515", "#ffd36a", "#ffffff", "#ff4040"),
    giftTiers: tiers(giftRanges, [
      color("#314052", "#ffffff", "#edf3fa", "#ffffff", "#edf3fa"),
      color("#314052", "#ffffff", "#dfe8f5", "#ffffff", "#dfe8f5"),
      color("#ffffff", "#f9fbff", "#cfdced", "#ffffff", "#ff8a7d"),
      color("#ffffff", "#f5f7fb", "#ff6b5f", "#ffffff", "#ff6b5f"),
      color("#fffaf0", "#2b1515", "#ffd36a", "#ffffff", "#ff4040")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#314052", "#ffffff", "#edf3fa", "#ffffff", "#edf3fa"),
      color("#314052", "#ffffff", "#dfe8f5", "#ffffff", "#dfe8f5"),
      color("#ffffff", "#f9fbff", "#ff8a7d", "#ffffff", "#ff8a7d"),
      color("#fffaf0", "#2b1515", "#ffd36a", "#ffffff", "#ff4040")
    ])
  },

  crimsonBloom: {
    label: "크림슨 블룸",
    gift: color("#ffffff", "#fff0f2", "#d93655", "#d93655", "#ff8a9e"),
    level: color("#ffffff", "#fff4f5", "#ff6b7a", "#ff6b7a", "#d93655"),
    superFan: color("#fffaf0", "#3a1018", "#ffd36a", "#d93655", "#ff8a9e"),
    giftTiers: tiers(giftRanges, [
      color("#6e2d38", "#fff7f8", "#f5b7c1", "#ffd9df", "#f5b7c1"),
      color("#ffffff", "#fff0f2", "#ff8a9e", "#ff8a9e", "#ffc2cc"),
      color("#ffffff", "#ffe1e6", "#f2526d", "#f2526d", "#ff9aac"),
      color("#ffffff", "#ffd3dc", "#d93655", "#d93655", "#ff7f95"),
      color("#fffaf0", "#3a1018", "#ffd36a", "#d93655", "#ff8a9e")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#6e2d38", "#fff7f8", "#f5b7c1", "#ffd9df", "#f5b7c1"),
      color("#ffffff", "#fff0f2", "#ff8a9e", "#ff8a9e", "#ffc2cc"),
      color("#ffffff", "#ffe1e6", "#f2526d", "#f2526d", "#ff9aac"),
      color("#fffaf0", "#3a1018", "#ffd36a", "#d93655", "#ff8a9e")
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
