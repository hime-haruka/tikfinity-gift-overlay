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
    gift: color("#5b3b58", "#fff1fa", "#ffadd6", "#ffd7ec", "#c7ceff"),
    level: color("#5b3b58", "#f7f1ff", "#b7a8ff", "#eadfff", "#ffc3df"),
    superFan: color("#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2"),
    giftTiers: tiers(giftRanges, [
      color("#5b3b58", "#fff7fc", "#ffcfe6", "#fff0f8", "#e4e8ff"),
      color("#5b3b58", "#fff1fa", "#ffadd6", "#ffd7ec", "#c7ceff"),
      color("#ffffff", "#ffdff1", "#ff92c9", "#ff92c9", "#b4c0ff"),
      color("#ffffff", "#ffd1eb", "#ff72b8", "#ff72b8", "#9faeff"),
      color("#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#5b3b58", "#f9f5ff", "#cdc2ff", "#f7d5ec", "#d9ddff"),
      color("#5b3b58", "#f1eaff", "#b7a8ff", "#eadfff", "#ffc3df"),
      color("#ffffff", "#eadfff", "#a192ff", "#a192ff", "#ff92c9"),
      color("#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2")
    ])
  },
  merryGoRound: {
    label: "메리 고 라운드",
    gift: color("#70445a", "#fff1f6", "#ff8fb1", "#ffabc8", "#ffc1d6"),
    level: color("#70445a", "#fff3f7", "#ff9ec2", "#ffb8d0", "#ffd1df"),
    superFan: color("#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5"),
    giftTiers: tiers(giftRanges, [
      color("#74465a", "#fff8fb", "#ffc8dc", "#ffe4ed", "#ffc8dc"),
      color("#70445a", "#fff1f6", "#ffabc8", "#ffabc8", "#ffd1df"),
      color("#ffffff", "#ffe5ef", "#ff8fb1", "#ff8fb1", "#ffc1d6"),
      color("#ffffff", "#ffd8e7", "#ff6f9f", "#ff6f9f", "#ffb2cc"),
      color("#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#74465a", "#fff8fb", "#ffc8dc", "#ffe4ed", "#ffc8dc"),
      color("#70445a", "#fff1f6", "#ffabc8", "#ffabc8", "#ffd1df"),
      color("#ffffff", "#ffe5ef", "#ff8fb1", "#ff8fb1", "#ffc1d6"),
      color("#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5")
    ])
  },
  algorithmWitch: {
    label: "알고리즘",
    gift: color("#514068", "#fff6ef", "#d5b16f", "#f2d9a6", "#c8b7ff"),
    level: color("#514068", "#f7efff", "#ad98ff", "#d8c8ff", "#f2c98b"),
    superFan: color("#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff"),
    giftTiers: tiers(giftRanges, [
      color("#5c4a63", "#fffaf5", "#ead2a6", "#f8e6c8", "#e2dcff"),
      color("#514068", "#fff6ef", "#d5b16f", "#f2d9a6", "#c8b7ff"),
      color("#ffffff", "#f3eaff", "#ad98ff", "#c7b6ff", "#efc079"),
      color("#ffffff", "#ece0ff", "#9271ff", "#9271ff", "#d5b16f"),
      color("#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#5c4a63", "#fffaf5", "#ead2a6", "#f8e6c8", "#e2dcff"),
      color("#514068", "#fff6ef", "#d5b16f", "#f2d9a6", "#c8b7ff"),
      color("#ffffff", "#f7efff", "#ad98ff", "#d8c8ff", "#f2c98b"),
      color("#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff")
    ])
  },
  midnightFox: {
    label: "미드나이트",
    gift: color("#ffffff", "#1b1438", "#b38cff", "#8f5cff", "#d8b7ff"),
    level: color("#ffffff", "#211845", "#c4a1ff", "#9d7bff", "#ff9de4"),
    superFan: color("#fffaff", "#120a28", "#f0d6ff", "#b38cff", "#ff9de4"),
    giftTiers: tiers(giftRanges, [
      color("#ffffff", "#31275b", "#cbb8ff", "#cbb8ff", "#ede2ff"),
      color("#ffffff", "#271f4d", "#b38cff", "#b38cff", "#d8b7ff"),
      color("#ffffff", "#211845", "#9d7bff", "#9d7bff", "#c994ff"),
      color("#ffffff", "#1b1438", "#8f5cff", "#8f5cff", "#ff9de4"),
      color("#fffaff", "#120a28", "#f0d6ff", "#b38cff", "#ff9de4")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#ffffff", "#31275b", "#cbb8ff", "#cbb8ff", "#ede2ff"),
      color("#ffffff", "#271f4d", "#b38cff", "#b38cff", "#d8b7ff"),
      color("#ffffff", "#211845", "#9d7bff", "#9d7bff", "#ff9de4"),
      color("#fffaff", "#120a28", "#f0d6ff", "#b38cff", "#ff9de4")
    ])
  },
  moonTiger: {
    label: "월하호랑",
    gift: color("#7a4a4a", "#f8fbff", "#d9e6f5", "#ffffff", "#dceaff"),
    level: color("#8a4b4b", "#f2f7ff", "#c9d9ee", "#ffffff", "#dfeaff"),
    superFan: color("#fff7f4", "#273548", "#ffb1a7", "#ffffff", "#bcd5ff"),
    giftTiers: tiers(giftRanges, [
      color("#7a4a4a", "#ffffff", "#e8f1fb", "#ffffff", "#f0f6ff"),
      color("#7a4a4a", "#f8fbff", "#d9e6f5", "#ffffff", "#dceaff"),
      color("#8a4b4b", "#f2f7ff", "#c9d9ee", "#ffffff", "#ffd8d2"),
      color("#ffffff", "#4a5b72", "#ffb1a7", "#6d829e", "#ffb1a7"),
      color("#fff7f4", "#273548", "#ffb1a7", "#ffffff", "#bcd5ff")
    ]),
    levelTiers: tiers(levelRanges, [
      color("#7a4a4a", "#ffffff", "#e8f1fb", "#ffffff", "#f0f6ff"),
      color("#7a4a4a", "#f8fbff", "#d9e6f5", "#ffffff", "#dceaff"),
      color("#8a4b4b", "#f2f7ff", "#c9d9ee", "#ffffff", "#ffd8d2"),
      color("#fff7f4", "#273548", "#ffb1a7", "#ffffff", "#bcd5ff")
    ])
  },
  monochrome: {
    label: "모노크롬",
    gift: color("#ffffff", "#2f3440", "#cbd5e1", "#64748b", "#111827"),
    level: color("#ffffff", "#374151", "#d1d5db", "#6b7280", "#111827"),
    superFan: color("#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15"),
    giftTiers: tiers(giftRanges, [color("#ffffff", "#64748b", "#cbd5e1", "#94a3b8", "#64748b"), color("#ffffff", "#475569", "#cbd5e1", "#64748b", "#475569"), color("#ffffff", "#334155", "#e2e8f0", "#475569", "#334155"), color("#ffffff", "#1f2937", "#f8fafc", "#374151", "#111827"), color("#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15")]),
    levelTiers: tiers(levelRanges, [color("#ffffff", "#64748b", "#cbd5e1", "#94a3b8", "#64748b"), color("#ffffff", "#475569", "#cbd5e1", "#64748b", "#475569"), color("#ffffff", "#334155", "#e2e8f0", "#475569", "#334155"), color("#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15")])
  },
  gothicCrimson: {
    label: "고딕 크림슨",
    gift: color("#fff4f5", "#3a1018", "#9f1239", "#5b0b18", "#be123c"),
    level: color("#fff4f5", "#421320", "#e11d48", "#74111f", "#be123c"),
    superFan: color("#fffaf0", "#2a0a10", "#ffd36a", "#7f1d1d", "#ffd36a"),
    giftTiers: tiers(giftRanges, [color("#7a1f2d", "#fff1f2", "#fecdd3", "#fff1f2", "#fecdd3"), color("#fff4f5", "#881337", "#fb7185", "#9f1239", "#fb7185"), color("#fff4f5", "#4c0519", "#e11d48", "#4c0519", "#be123c"), color("#fff4f5", "#3a1018", "#be123c", "#5b0b18", "#be123c"), color("#fffaf0", "#2a0a10", "#ffd36a", "#7f1d1d", "#ffd36a")]),
    levelTiers: tiers(levelRanges, [color("#7a1f2d", "#fff1f2", "#fecdd3", "#fff1f2", "#fecdd3"), color("#fff4f5", "#881337", "#fb7185", "#9f1239", "#fb7185"), color("#fff4f5", "#4c0519", "#e11d48", "#4c0519", "#be123c"), color("#fffaf0", "#2a0a10", "#ffd36a", "#7f1d1d", "#ffd36a")])
  },
  emeraldSignal: {
    label: "에메랄드 시그널",
    gift: color("#14513e", "#ecfff7", "#22c98a", "#8fffe0", "#22c98a"),
    level: color("#14513e", "#f0fff8", "#58d68d", "#b9ffd8", "#58d68d"),
    superFan: color("#f8fff8", "#0d2f24", "#d6ff7f", "#22c98a", "#8fffe0"),
    giftTiers: tiers(giftRanges, [color("#245747", "#f5fff9", "#b9ffd8", "#dfffee", "#b9ffd8"), color("#14513e", "#ecfff7", "#8fffe0", "#8fffe0", "#b9ffd8"), color("#ffffff", "#0f8b68", "#58d68d", "#0f8b68", "#8fffe0"), color("#ffffff", "#0b6b52", "#22c98a", "#0b6b52", "#60f0c2"), color("#f8fff8", "#0d2f24", "#d6ff7f", "#22c98a", "#8fffe0")]),
    levelTiers: tiers(levelRanges, [color("#245747", "#f5fff9", "#b9ffd8", "#dfffee", "#b9ffd8"), color("#14513e", "#ecfff7", "#8fffe0", "#8fffe0", "#b9ffd8"), color("#ffffff", "#0f8b68", "#58d68d", "#0f8b68", "#8fffe0"), color("#f8fff8", "#0d2f24", "#d6ff7f", "#22c98a", "#8fffe0")])
  },
  mintSoda: {
    label: "민트 소다",
    gift: color("#215a52", "#dcfbf3", "#73dbc6", "#a9eadc", "#7bbcff"),
    level: color("#245066", "#e6f6ff", "#7bbcff", "#7bbcff", "#a8b5ff"),
    superFan: color("#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff"),
    giftTiers: tiers(giftRanges, [color("#315e56", "#effffb", "#a9eadc", "#d9fff7", "#bde8ff"), color("#215a52", "#dcfbf3", "#73dbc6", "#73dbc6", "#9ee8ff"), color("#ffffff", "#119c84", "#45caa9", "#119c84", "#7bbcff"), color("#ffffff", "#0d7e6e", "#2db997", "#0d7e6e", "#55a8ff"), color("#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff")]),
    levelTiers: tiers(levelRanges, [color("#315e56", "#e6f6ff", "#a8dcff", "#d9fff7", "#bde8ff"), color("#245066", "#d8f0ff", "#7bbcff", "#7bbcff", "#a8b5ff"), color("#ffffff", "#15708b", "#58d4ef", "#15708b", "#73dbc6"), color("#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff")])
  },
  honeyBeige: {
    label: "허니 베이지",
    gift: color("#5a432b", "#fff8ea", "#e8b86d", "#f0c987", "#ffe3a3"),
    level: color("#5a432b", "#fff9ef", "#f0c987", "#f0c987", "#ffdca0"),
    superFan: color("#fffaf0", "#4a321c", "#ffe08a", "#ffe08a", "#e8b86d"),
    giftTiers: tiers(giftRanges, [color("#5a432b", "#fffdf7", "#f4dfb8", "#fff2d6", "#f4dfb8"), color("#5a432b", "#fff8ea", "#f0c987", "#f0c987", "#ffe3a3"), color("#ffffff", "#a56f2a", "#e8b86d", "#a56f2a", "#ffd480"), color("#ffffff", "#80541f", "#d99a3d", "#80541f", "#ffc96b"), color("#fffaf0", "#4a321c", "#ffe08a", "#ffe08a", "#e8b86d")]),
    levelTiers: tiers(levelRanges, [color("#5a432b", "#fffdf7", "#f4dfb8", "#fff2d6", "#f4dfb8"), color("#5a432b", "#fff8ea", "#f0c987", "#f0c987", "#ffe3a3"), color("#ffffff", "#a56f2a", "#e8b86d", "#a56f2a", "#ffd480"), color("#fffaf0", "#4a321c", "#ffe08a", "#ffe08a", "#e8b86d")])
  },
  champagneGold: {
    label: "샴페인 골드",
    gift: color("#5f4a21", "#fffaf0", "#f7d77a", "#fff2b8", "#d8a83f"),
    level: color("#5f4a21", "#fffdf4", "#ffe08a", "#fff2b8", "#f0c45c"),
    superFan: color("#fffaf0", "#3c2a10", "#fff2b8", "#fff2b8", "#d8a83f"),
    giftTiers: tiers(giftRanges, [color("#5f4a21", "#fffef8", "#f8e7b4", "#fff8dc", "#f8e7b4"), color("#5f4a21", "#fffaf0", "#ffe08a", "#fff2b8", "#f7d77a"), color("#ffffff", "#9c711f", "#f7d77a", "#9c711f", "#d8a83f"), color("#ffffff", "#765014", "#f0c45c", "#765014", "#c8912f"), color("#fffaf0", "#3c2a10", "#fff2b8", "#fff2b8", "#d8a83f")]),
    levelTiers: tiers(levelRanges, [color("#5f4a21", "#fffef8", "#f8e7b4", "#fff8dc", "#f8e7b4"), color("#5f4a21", "#fffaf0", "#ffe08a", "#fff2b8", "#f7d77a"), color("#ffffff", "#9c711f", "#f7d77a", "#9c711f", "#d8a83f"), color("#fffaf0", "#3c2a10", "#fff2b8", "#fff2b8", "#d8a83f")])
  },
  royalBlue: {
    label: "로열 블루",
    gift: color("#ffffff", "#123a70", "#5ba7ff", "#2f80ed", "#63d8ff"),
    level: color("#ffffff", "#163d7a", "#7aa8ff", "#4f8cff", "#8fe5ff"),
    superFan: color("#ffffff", "#08224a", "#d4ecff", "#5ba7ff", "#ffffff"),
    giftTiers: tiers(giftRanges, [color("#214d78", "#edf7ff", "#b9dcff", "#edf7ff", "#b9dcff"), color("#ffffff", "#1f5f9f", "#8ec5ff", "#2f80ed", "#8fe5ff"), color("#ffffff", "#164b8f", "#5ba7ff", "#2f80ed", "#63d8ff"), color("#ffffff", "#123a70", "#2f80ed", "#123a70", "#63d8ff"), color("#ffffff", "#08224a", "#d4ecff", "#5ba7ff", "#ffffff")]),
    levelTiers: tiers(levelRanges, [color("#214d78", "#edf7ff", "#b9dcff", "#edf7ff", "#b9dcff"), color("#ffffff", "#1f5f9f", "#8ec5ff", "#2f80ed", "#8fe5ff"), color("#ffffff", "#164b8f", "#5ba7ff", "#2f80ed", "#63d8ff"), color("#ffffff", "#08224a", "#d4ecff", "#5ba7ff", "#ffffff")])
  },
  indigoOrbit: {
    label: "인디고 오빗",
    gift: color("#ffffff", "#17205a", "#6c63ff", "#3949d6", "#9d7bff"),
    level: color("#ffffff", "#1c2666", "#7d7cff", "#4f5dff", "#b388ff"),
    superFan: color("#fffaff", "#141633", "#d9dcff", "#4f5dff", "#ff8fe5"),
    giftTiers: tiers(giftRanges, [color("#34395f", "#f8f8ff", "#c6ccff", "#dfe2ff", "#c6ccff"), color("#ffffff", "#25307f", "#9fa8ff", "#4f5dff", "#c4b5ff"), color("#ffffff", "#1c2666", "#6c63ff", "#3949d6", "#b388ff"), color("#ffffff", "#17205a", "#4f5dff", "#17205a", "#9d7bff"), color("#fffaff", "#141633", "#d9dcff", "#4f5dff", "#ff8fe5")]),
    levelTiers: tiers(levelRanges, [color("#34395f", "#f8f8ff", "#c6ccff", "#dfe2ff", "#c6ccff"), color("#ffffff", "#25307f", "#9fa8ff", "#4f5dff", "#c4b5ff"), color("#ffffff", "#1c2666", "#6c63ff", "#3949d6", "#b388ff"), color("#fffaff", "#141633", "#d9dcff", "#4f5dff", "#ff8fe5")])
  },
  purpleDream: {
    label: "퍼플 드림",
    gift: color("#ffffff", "#4b2b7f", "#b79cff", "#7c5cff", "#ff9de4"),
    level: color("#ffffff", "#3d2a74", "#9f8cff", "#866bff", "#72d6ff"),
    superFan: color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8"),
    giftTiers: tiers(giftRanges, [color("#5c3b75", "#f6efff", "#c9b7ff", "#e8ddff", "#ffd1e8"), color("#ffffff", "#5f3aa0", "#b79cff", "#7c5cff", "#ffb1dd"), color("#ffffff", "#4b2b7f", "#a283ff", "#7c5cff", "#ff93cf"), color("#ffffff", "#3e236a", "#8f6dff", "#3e236a", "#ff74bf"), color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8")]),
    levelTiers: tiers(levelRanges, [color("#5c3b75", "#f6efff", "#c9b7ff", "#e8ddff", "#ffd1e8"), color("#ffffff", "#5f3aa0", "#b79cff", "#7c5cff", "#ffb1dd"), color("#ffffff", "#4b2b7f", "#a283ff", "#7c5cff", "#ff93cf"), color("#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8")])
  },
  orangePop: {
    label: "오렌지 팝",
    gift: color("#ffffff", "#a44914", "#ff8a3d", "#ff8a3d", "#ffd36a"),
    level: color("#ffffff", "#9a3f18", "#ffa15d", "#ffa15d", "#ffcf70"),
    superFan: color("#fffaf0", "#4a220e", "#ffd36a", "#ff8a3d", "#fff0a3"),
    giftTiers: tiers(giftRanges, [color("#6a3d22", "#fff4ea", "#ffc9a6", "#fff4ea", "#ffdca3"), color("#ffffff", "#c9692b", "#ffad73", "#ff8a3d", "#ffd36a"), color("#ffffff", "#a44914", "#ff8a3d", "#ff8a3d", "#ffd36a"), color("#ffffff", "#80340f", "#ff6f20", "#80340f", "#ffc247"), color("#fffaf0", "#4a220e", "#ffd36a", "#ff8a3d", "#fff0a3")]),
    levelTiers: tiers(levelRanges, [color("#6a3d22", "#fff4ea", "#ffc9a6", "#fff4ea", "#ffdca3"), color("#ffffff", "#c9692b", "#ffad73", "#ff8a3d", "#ffd36a"), color("#ffffff", "#a44914", "#ff8a3d", "#ff8a3d", "#ffd36a"), color("#fffaf0", "#4a220e", "#ffd36a", "#ff8a3d", "#fff0a3")])
  },
  lemonSpark: {
    label: "레몬 스파크",
    gift: color("#5a4b14", "#fff8bf", "#ffe75a", "#fff6a8", "#ffe75a"),
    level: color("#5a4b14", "#fff9cf", "#ffe66d", "#fff6a8", "#ffd95a"),
    superFan: color("#2e2600", "#fff4a3", "#fff176", "#fffef0", "#ffd400"),
    giftTiers: tiers(giftRanges, [color("#5a4b14", "#fffde6", "#fff2a3", "#fffde6", "#fff2a3"), color("#5a4b14", "#fff8bf", "#ffe75a", "#fff6a8", "#ffe75a"), color("#ffffff", "#a98d00", "#ffdf2e", "#a98d00", "#fff176"), color("#ffffff", "#806a00", "#ffd400", "#806a00", "#fff176"), color("#2e2600", "#fff4a3", "#fff176", "#fffef0", "#ffd400")]),
    levelTiers: tiers(levelRanges, [color("#5a4b14", "#fffde6", "#fff2a3", "#fffde6", "#fff2a3"), color("#5a4b14", "#fff8bf", "#ffe75a", "#fff6a8", "#ffe75a"), color("#ffffff", "#a98d00", "#ffdf2e", "#a98d00", "#fff176"), color("#2e2600", "#fff4a3", "#fff176", "#fffef0", "#ffd400")])
  },
  pastelMix: {
    label: "파스텔 믹스",
    gift: color("#5d4d68", "#fff4fb", "#ffc8e0", "#ffd7ec", "#c7f0ff"),
    level: color("#5d4d68", "#f4f0ff", "#cbbcff", "#e6dbff", "#c8ffe2"),
    superFan: color("#5d4d68", "#fff8e8", "#ffd36a", "#ffd36a", "#ffb7dc"),
    giftTiers: tiers(giftRanges, [color("#5d4d68", "#fffaff", "#ffd7ec", "#fff0f8", "#e7f8ff"), color("#5d4d68", "#fff4fb", "#ffc8e0", "#ffd7ec", "#c7f0ff"), color("#5d4d68", "#f4f0ff", "#cbbcff", "#cbbcff", "#c8ffe2"), color("#ffffff", "#7d66a6", "#b79cff", "#7d66a6", "#ffb7dc"), color("#5d4d68", "#fff8e8", "#ffd36a", "#ffd36a", "#ffb7dc")]),
    levelTiers: tiers(levelRanges, [color("#5d4d68", "#fffaff", "#ffd7ec", "#fff0f8", "#e7f8ff"), color("#5d4d68", "#fff4fb", "#ffc8e0", "#ffd7ec", "#c7f0ff"), color("#5d4d68", "#f4f0ff", "#cbbcff", "#cbbcff", "#c8ffe2"), color("#5d4d68", "#fff8e8", "#ffd36a", "#ffd36a", "#ffb7dc")])
  },
  roseGold: {
    label: "로즈 골드",
    gift: color("#fff8f4", "#3b2228", "#f5b0a2", "#f5b0a2", "#d9a86c"),
    level: color("#fff8f4", "#3b2630", "#e7a2c1", "#e7a2c1", "#d9a86c"),
    superFan: color("#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99"),
    giftTiers: tiers(giftRanges, [color("#fff8f4", "#5a3540", "#f7c8bd", "#f7c8bd", "#e6c38b"), color("#fff8f4", "#4f2d36", "#f5b0a2", "#f5b0a2", "#d9a86c"), color("#fff8f4", "#462832", "#ef9a9a", "#ef9a9a", "#d9a86c"), color("#fff8f4", "#3b2228", "#ef7d99", "#ef7d99", "#ffd36a"), color("#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99")]),
    levelTiers: tiers(levelRanges, [color("#fff8f4", "#5a3540", "#f7c8bd", "#f7c8bd", "#e6c38b"), color("#fff8f4", "#4f2d36", "#e7a2c1", "#e7a2c1", "#d9a86c"), color("#fff8f4", "#462832", "#d987b4", "#d987b4", "#ffd36a"), color("#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99")])
  },
  berryBlack: {
    label: "베리 블랙",
    gift: color("#ffffff", "#2b0f2b", "#8b1b62", "#2b0f2b", "#8b1b62"),
    level: color("#ffffff", "#351234", "#a21caf", "#351234", "#be185d"),
    superFan: color("#fff4fb", "#160718", "#ff8fd8", "#8b1b62", "#ff8fd8"),
    giftTiers: tiers(giftRanges, [color("#6b315e", "#fff1fb", "#e9b5d8", "#fff1fb", "#e9b5d8"), color("#ffffff", "#5b174e", "#c05a9d", "#5b174e", "#c05a9d"), color("#ffffff", "#42113d", "#a21caf", "#42113d", "#be185d"), color("#ffffff", "#2b0f2b", "#8b1b62", "#2b0f2b", "#8b1b62"), color("#fff4fb", "#160718", "#ff8fd8", "#8b1b62", "#ff8fd8")]),
    levelTiers: tiers(levelRanges, [color("#6b315e", "#fff1fb", "#e9b5d8", "#fff1fb", "#e9b5d8"), color("#ffffff", "#5b174e", "#c05a9d", "#5b174e", "#c05a9d"), color("#ffffff", "#42113d", "#a21caf", "#42113d", "#be185d"), color("#fff4fb", "#160718", "#ff8fd8", "#8b1b62", "#ff8fd8")])
  },
  skyCloud: {
    label: "스카이 클라우드",
    gift: color("#31506d", "#eef9ff", "#8ccfff", "#d9f3ff", "#8ccfff"),
    level: color("#31506d", "#eef3ff", "#9fb7ff", "#dbe8ff", "#8be4ff"),
    superFan: color("#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff"),
    giftTiers: tiers(giftRanges, [color("#31506d", "#eef9ff", "#b8e7ff", "#d9f3ff", "#b8e7ff"), color("#31506d", "#dff3ff", "#8ccfff", "#8ccfff", "#b8e7ff"), color("#ffffff", "#2f7bbd", "#62bdff", "#2f7bbd", "#93dfff"), color("#ffffff", "#225f9f", "#428dff", "#225f9f", "#8be4ff"), color("#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff")]),
    levelTiers: tiers(levelRanges, [color("#31506d", "#eef3ff", "#bdd1ff", "#dbe8ff", "#b8e7ff"), color("#31506d", "#dce7ff", "#9fb7ff", "#9fb7ff", "#8be4ff"), color("#ffffff", "#3558a8", "#7d9cff", "#3558a8", "#72d6ff"), color("#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff")])
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
    fontSize: 24,
    cardHeight: 50,
    pinnedIds: [],
    colors: defaultPreset.gift,
    superFanColor: defaultPreset.superFan,
    tiers: defaultPreset.giftTiers
  },
  level: {
    enabled: true,
    maxCards: 4,
    sortMode: "latest",
    minLevel: 0,
    fontSize: 24,
    cardHeight: 50,
    pinnedIds: [],
    colors: defaultPreset.level,
    tiers: defaultPreset.levelTiers
  },
  teamRanking: {
    layout: "list",
    maxItems: 5,
    fontSize: 24
  }
};
