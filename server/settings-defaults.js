const color = (text, background, border, gradientFrom, gradientTo, useGradient = true) => ({
  text,
  background,
  border,
  gradientFrom,
  gradientTo,
  useGradient
});

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
const c = (a) => color(...a);
const makePreset = ({ label, gift, level, superFan, giftTiers, levelTiers }) => ({
  label,
  gift: c(gift),
  level: c(level),
  superFan: c(superFan),
  giftTiers: tiers(giftRanges, giftTiers.map(c)),
  levelTiers: tiers(levelRanges, levelTiers.map(c))
});

export const COLOR_PRESETS = {
  cottonCandyDream: makePreset({
    label: "캔디 드림",
    gift: ["#4b3550", "#fff0f8", "#ff9ed0", "#ffe3f2", "#dce2ff"],
    level: ["#493a67", "#f4efff", "#b7a8ff", "#eee8ff", "#ffd9eb"],
    superFan: ["#fffdf7", "#5a2350", "#ffd36a", "#ffd36a", "#ff78c2"],
    giftTiers: [
      ["#5d3f5c", "#fff7fb", "#ffc3df", "#fff7fb", "#edf0ff"],
      ["#4b3550", "#fff0f8", "#ffadd6", "#ffeaf6", "#dfe4ff"],
      ["#ffffff", "#ff92c9", "#ff92c9", "#ff92c9", "#b4c0ff"],
      ["#ffffff", "#ff72b8", "#ff72b8", "#ff72b8", "#9faeff"],
      ["#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2"]
    ],
    levelTiers: [
      ["#493a67", "#f8f4ff", "#cdc2ff", "#f8f4ff", "#ffe7f2"],
      ["#493a67", "#f1eaff", "#b7a8ff", "#f1eaff", "#ffc3df"],
      ["#ffffff", "#a192ff", "#a192ff", "#a192ff", "#ff92c9"],
      ["#fffaff", "#4a2445", "#ffd6ec", "#ffd36a", "#ff78c2"]
    ]
  }),

  merryGoRound: makePreset({
    label: "메리 고 라운드",
    gift: ["#65364a", "#fff1f6", "#ff8fb1", "#ffe5ef", "#ffc1d6"],
    level: ["#65364a", "#fff3f7", "#ff9ec2", "#ffe8f0", "#ffd1df"],
    superFan: ["#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5"],
    giftTiers: [
      ["#74465a", "#fff8fb", "#ffc8dc", "#fff8fb", "#ffe4ed"],
      ["#65364a", "#fff1f6", "#ffabc8", "#ffeaf2", "#ffd1df"],
      ["#ffffff", "#ff8fb1", "#ff8fb1", "#ff8fb1", "#ffc1d6"],
      ["#ffffff", "#ff6f9f", "#ff6f9f", "#ff6f9f", "#ffb2cc"],
      ["#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5"]
    ],
    levelTiers: [
      ["#74465a", "#fff8fb", "#ffc8dc", "#fff8fb", "#ffe4ed"],
      ["#65364a", "#fff1f6", "#ffabc8", "#ffeaf2", "#ffd1df"],
      ["#ffffff", "#ff8fb1", "#ff8fb1", "#ff8fb1", "#ffc1d6"],
      ["#fffaff", "#6a2d45", "#ffd6e5", "#ff75a8", "#ffd6a5"]
    ]
  }),

  algorithmWitch: makePreset({
    label: "알고리즘",
    gift: ["#4a3760", "#fff4ee", "#d8b478", "#fff0e5", "#d8ccff"],
    level: ["#4a3760", "#f5efff", "#a995ff", "#f8e8ff", "#f0c68f"],
    superFan: ["#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff"],
    giftTiers: [
      ["#5c4a63", "#fff8f1", "#ead2a6", "#fff8f1", "#ece6ff"],
      ["#4a3760", "#fff1ec", "#d8b478", "#fff1ec", "#dcd3ff"],
      ["#ffffff", "#b8a7ff", "#b8a7ff", "#b8a7ff", "#f0c68f"],
      ["#ffffff", "#8e73ee", "#9b7bff", "#9b7bff", "#d8b478"],
      ["#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff"]
    ],
    levelTiers: [
      ["#5c4a63", "#fff8f1", "#ead2a6", "#fff8f1", "#ece6ff"],
      ["#4a3760", "#f7efff", "#b8a7ff", "#f7efff", "#f0c68f"],
      ["#ffffff", "#9579ff", "#9579ff", "#9579ff", "#f0c68f"],
      ["#fffaf0", "#2b1c3a", "#ffd879", "#ffd879", "#b8a7ff"]
    ]
  }),

  midnightFox: makePreset({
    label: "미드나이트",
    gift: ["#ffffff", "#1c1438", "#a983ff", "#5130c8", "#b889ff"],
    level: ["#ffffff", "#20173f", "#c2a8ff", "#6b46d9", "#d9b8ff"],
    superFan: ["#fffaff", "#120a27", "#e2d6ff", "#a983ff", "#ff87e7"],
    giftTiers: [
      ["#ffffff", "#34255f", "#c2a8ff", "#3b2a6f", "#7a5cff"],
      ["#ffffff", "#2a1e51", "#b394ff", "#5130c8", "#9d7bff"],
      ["#ffffff", "#211742", "#a983ff", "#6a00ff", "#b889ff"],
      ["#ffffff", "#1a1038", "#c65cff", "#7a2cff", "#ff7df1"],
      ["#fffaff", "#120a27", "#e2d6ff", "#a983ff", "#ff87e7"]
    ],
    levelTiers: [
      ["#ffffff", "#34255f", "#c2a8ff", "#3b2a6f", "#7a5cff"],
      ["#ffffff", "#2a1e51", "#b394ff", "#5130c8", "#9d7bff"],
      ["#ffffff", "#211742", "#a983ff", "#6a00ff", "#d9b8ff"],
      ["#fffaff", "#120a27", "#e2d6ff", "#a983ff", "#ff87e7"]
    ]
  }),

  moonTiger: makePreset({
    label: "월하호랑",
    gift: ["#8f3a46", "#f7fbff", "#c9d9ee", "#ffffff", "#dce9f8"],
    level: ["#8f3a46", "#f6fbff", "#b8cde8", "#ffffff", "#dce9f8"],
    superFan: ["#9a3340", "#eef7ff", "#ffd1d8", "#ffffff", "#c8ddf5"],
    giftTiers: [
      ["#8f3a46", "#ffffff", "#edf3fa", "#ffffff", "#edf3fa"],
      ["#8f3a46", "#f7fbff", "#dfe8f5", "#ffffff", "#dfe8f5"],
      ["#9a3340", "#edf7ff", "#c9d9ee", "#ffffff", "#d7e9ff"],
      ["#9a3340", "#dfefff", "#ffd1d8", "#ffffff", "#c8ddf5"],
      ["#9a3340", "#eef7ff", "#ffd1d8", "#ffffff", "#c8ddf5"]
    ],
    levelTiers: [
      ["#8f3a46", "#ffffff", "#edf3fa", "#ffffff", "#edf3fa"],
      ["#8f3a46", "#f7fbff", "#dfe8f5", "#ffffff", "#dfe8f5"],
      ["#9a3340", "#edf7ff", "#ffd1d8", "#ffffff", "#d7e9ff"],
      ["#9a3340", "#eef7ff", "#ffd1d8", "#ffffff", "#c8ddf5"]
    ]
  }),

  monochrome: makePreset({ label: "모노크롬", gift: ["#ffffff", "#2f3440", "#cbd5e1", "#64748b", "#111827"], level: ["#ffffff", "#374151", "#d1d5db", "#6b7280", "#111827"], superFan: ["#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15"], giftTiers: [["#ffffff", "#64748b", "#cbd5e1", "#94a3b8", "#64748b"],["#ffffff", "#475569", "#cbd5e1", "#64748b", "#475569"],["#ffffff", "#334155", "#e2e8f0", "#475569", "#334155"],["#ffffff", "#1f2937", "#f8fafc", "#374151", "#111827"],["#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15"]], levelTiers: [["#ffffff", "#64748b", "#cbd5e1", "#94a3b8", "#64748b"],["#ffffff", "#475569", "#cbd5e1", "#64748b", "#475569"],["#ffffff", "#334155", "#e2e8f0", "#475569", "#334155"],["#111827", "#f8fafc", "#facc15", "#f8fafc", "#facc15"]] }),
  gothicCrimson: makePreset({ label: "고딕 크림슨", gift: ["#fff5f7", "#35131b", "#b91c3a", "#5a1724", "#b91c3a"], level: ["#fff5f7", "#3b1725", "#d94666", "#4a1628", "#8b1d34"], superFan: ["#fffaf0", "#2b0d14", "#f6c75e", "#8b1d34", "#f6c75e"], giftTiers: [["#fff5f7", "#5b2632", "#d45a74", "#5b2632", "#8b1d34"],["#fff5f7", "#4a1b29", "#c43f5a", "#4a1b29", "#9f1f3c"],["#fff5f7", "#3b1725", "#d94666", "#3b1725", "#b91c3a"],["#fff5f7", "#2f1019", "#ff6d8f", "#2f1019", "#b91c3a"],["#fffaf0", "#2b0d14", "#f6c75e", "#8b1d34", "#f6c75e"]], levelTiers: [["#fff5f7", "#5b2632", "#d45a74", "#5b2632", "#8b1d34"],["#fff5f7", "#4a1b29", "#c43f5a", "#4a1b29", "#9f1f3c"],["#fff5f7", "#3b1725", "#d94666", "#3b1725", "#b91c3a"],["#fffaf0", "#2b0d14", "#f6c75e", "#8b1d34", "#f6c75e"]] }),
  emeraldSignal: makePreset({ label: "에메랄드 시그널", gift: ["#15483a", "#ecfff7", "#22c98a", "#ddfff1", "#8fffe0"], level: ["#15483a", "#f0fff8", "#58d68d", "#e6fff3", "#b9ffd8"], superFan: ["#f8fff8", "#0d2f24", "#d6ff7f", "#22c98a", "#8fffe0"], giftTiers: [["#245747", "#f5fff9", "#b9ffd8", "#f5fff9", "#dfffee"],["#15483a", "#ecfff7", "#8fffe0", "#ecfff7", "#b9ffd8"],["#ffffff", "#22c98a", "#22c98a", "#22c98a", "#60f0c2"],["#ffffff", "#0e9f72", "#0e9f72", "#0e9f72", "#42e0ad"],["#f8fff8", "#0d2f24", "#d6ff7f", "#22c98a", "#8fffe0"]], levelTiers: [["#245747", "#f5fff9", "#b9ffd8", "#f5fff9", "#dfffee"],["#15483a", "#ecfff7", "#8fffe0", "#ecfff7", "#b9ffd8"],["#ffffff", "#22c98a", "#22c98a", "#22c98a", "#60f0c2"],["#f8fff8", "#0d2f24", "#d6ff7f", "#22c98a", "#8fffe0"]] }),
  mintSoda: makePreset({ label: "민트 소다", gift: ["#1c554d", "#dcfbf3", "#73dbc6", "#eafffa", "#9ee8ff"], level: ["#1c4b5a", "#e6f6ff", "#7bbcff", "#ecfbff", "#a8b5ff"], superFan: ["#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff"], giftTiers: [["#315e56", "#effffb", "#a9eadc", "#effffb", "#d9fff7"],["#1c554d", "#dcfbf3", "#73dbc6", "#dcfbf3", "#9ee8ff"],["#ffffff", "#45caa9", "#45caa9", "#45caa9", "#7bbcff"],["#ffffff", "#2db997", "#2db997", "#2db997", "#55a8ff"],["#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff"]], levelTiers: [["#315e56", "#effffb", "#a9eadc", "#effffb", "#d9fff7"],["#1c4b5a", "#e6f6ff", "#7bbcff", "#ecfbff", "#a8b5ff"],["#ffffff", "#58d4ef", "#58d4ef", "#58d4ef", "#73dbc6"],["#f8fffb", "#12382f", "#b5ffe6", "#b5ffe6", "#68bfff"]] }),
  honeyBeige: makePreset({ label: "허니 베이지", gift: ["#5a432b", "#fff8ea", "#e8b86d", "#fff1d4", "#ffe3a3"], level: ["#5a432b", "#fff9ef", "#f0c987", "#fff4df", "#ffdca0"], superFan: ["#fffaf0", "#4a321c", "#ffe08a", "#ffe08a", "#e8b86d"], giftTiers: [["#5a432b", "#fffdf7", "#f4dfb8", "#fffdf7", "#fff2d6"],["#5a432b", "#fff8ea", "#f0c987", "#fff8ea", "#ffe3a3"],["#5a432b", "#fff1d4", "#e8b86d", "#fff1d4", "#ffd480"],["#ffffff", "#d99a3d", "#d99a3d", "#d99a3d", "#ffc96b"],["#fffaf0", "#4a321c", "#ffe08a", "#ffe08a", "#e8b86d"]], levelTiers: [["#5a432b", "#fffdf7", "#f4dfb8", "#fffdf7", "#fff2d6"],["#5a432b", "#fff8ea", "#f0c987", "#fff8ea", "#ffe3a3"],["#5a432b", "#fff1d4", "#e8b86d", "#fff1d4", "#ffd480"],["#fffaf0", "#4a321c", "#ffe08a", "#ffe08a", "#e8b86d"]] }),
  champagneGold: makePreset({ label: "샴페인 골드", gift: ["#5f4a21", "#fffaf0", "#f7d77a", "#fff7df", "#f0c45c"], level: ["#5f4a21", "#fffdf4", "#ffe08a", "#fff8df", "#f0c45c"], superFan: ["#fffaf0", "#3c2a10", "#fff2b8", "#fff2b8", "#d8a83f"], giftTiers: [["#5f4a21", "#fffef8", "#f8e7b4", "#fffef8", "#fff8dc"],["#5f4a21", "#fffaf0", "#ffe08a", "#fffaf0", "#f7d77a"],["#5f4a21", "#fff4d6", "#f7d77a", "#fff4d6", "#d8a83f"],["#ffffff", "#c8912f", "#c8912f", "#f0c45c", "#c8912f"],["#fffaf0", "#3c2a10", "#fff2b8", "#fff2b8", "#d8a83f"]], levelTiers: [["#5f4a21", "#fffef8", "#f8e7b4", "#fffef8", "#fff8dc"],["#5f4a21", "#fffaf0", "#ffe08a", "#fffaf0", "#f7d77a"],["#5f4a21", "#fff4d6", "#f7d77a", "#fff4d6", "#d8a83f"],["#fffaf0", "#3c2a10", "#fff2b8", "#fff2b8", "#d8a83f"]] }),
  skyCloud: makePreset({ label: "스카이 클라우드", gift: ["#244761", "#e9f7ff", "#8ccfff", "#f2fbff", "#b8e7ff"], level: ["#2e436a", "#eef3ff", "#9fb7ff", "#f4f7ff", "#8be4ff"], superFan: ["#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff"], giftTiers: [["#31506d", "#eef9ff", "#b8e7ff", "#eef9ff", "#d9f3ff"],["#244761", "#dff3ff", "#8ccfff", "#dff3ff", "#b8e7ff"],["#ffffff", "#62bdff", "#62bdff", "#62bdff", "#93dfff"],["#ffffff", "#428dff", "#428dff", "#428dff", "#8be4ff"],["#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff"]], levelTiers: [["#31506d", "#eef3ff", "#bdd1ff", "#eef3ff", "#b8e7ff"],["#2e436a", "#dce7ff", "#9fb7ff", "#dce7ff", "#8be4ff"],["#ffffff", "#7d9cff", "#7d9cff", "#7d9cff", "#72d6ff"],["#ffffff", "#12335a", "#9be7ff", "#9be7ff", "#7d9cff"]] }),
  indigoOrbit: makePreset({ label: "인디고 오빗", gift: ["#ffffff", "#1d2451", "#6c7cff", "#283a8f", "#6c63ff"], level: ["#ffffff", "#222658", "#8d7cff", "#29318f", "#b388ff"], superFan: ["#fffaff", "#141633", "#d9dcff", "#4f5dff", "#ff8fe5"], giftTiers: [["#34395f", "#f8f8ff", "#c6ccff", "#f8f8ff", "#dfe2ff"],["#ffffff", "#343b83", "#9fa8ff", "#343b83", "#6c63ff"],["#ffffff", "#29318f", "#6c7cff", "#29318f", "#8d7cff"],["#ffffff", "#1d2451", "#8d7cff", "#1d2451", "#4f5dff"],["#fffaff", "#141633", "#d9dcff", "#4f5dff", "#ff8fe5"]], levelTiers: [["#34395f", "#f8f8ff", "#c6ccff", "#f8f8ff", "#dfe2ff"],["#ffffff", "#343b83", "#9fa8ff", "#343b83", "#6c63ff"],["#ffffff", "#29318f", "#6c7cff", "#29318f", "#8d7cff"],["#fffaff", "#141633", "#d9dcff", "#4f5dff", "#ff8fe5"]] }),
  purpleDream: makePreset({ label: "퍼플 드림", gift: ["#ffffff", "#5636a3", "#b79cff", "#7b61ff", "#ff9ed0"], level: ["#ffffff", "#4c3a90", "#9f8cff", "#765dff", "#72d6ff"], superFan: ["#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8"], giftTiers: [["#4b3b72", "#f3efff", "#c9b7ff", "#f3efff", "#ffd1e8"],["#ffffff", "#7b61ff", "#b79cff", "#7b61ff", "#ffb1dd"],["#ffffff", "#6d4eff", "#a283ff", "#6d4eff", "#ff93cf"],["#ffffff", "#5636a3", "#8f6dff", "#5636a3", "#ff74bf"],["#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8"]], levelTiers: [["#4b3b72", "#eee8ff", "#b79cff", "#eee8ff", "#bde8ff"],["#ffffff", "#7b61ff", "#9f8cff", "#7b61ff", "#72d6ff"],["#ffffff", "#5636a3", "#866bff", "#5636a3", "#ff93cf"],["#fffaf0", "#34223d", "#ffd36a", "#ffd36a", "#ff4fd8"]] }),
  orangePop: makePreset({ label: "오렌지 팝", gift: ["#653116", "#fff0e2", "#ff8a3d", "#ffe1c8", "#ff9f6e"], level: ["#653116", "#fff4e8", "#ff9f4a", "#ffe7d0", "#ffb56e"], superFan: ["#fffaf0", "#4a2410", "#ffd36a", "#ff8a3d", "#ffd36a"], giftTiers: [["#653116", "#fff7ef", "#ffbc8a", "#fff7ef", "#ffd9bd"],["#653116", "#fff0e2", "#ff9f6e", "#fff0e2", "#ffbc8a"],["#ffffff", "#ff8a3d", "#ff8a3d", "#ff8a3d", "#ffb56e"],["#ffffff", "#e8631e", "#e8631e", "#e8631e", "#ff9f4a"],["#fffaf0", "#4a2410", "#ffd36a", "#ff8a3d", "#ffd36a"]], levelTiers: [["#653116", "#fff7ef", "#ffbc8a", "#fff7ef", "#ffd9bd"],["#653116", "#fff0e2", "#ff9f6e", "#fff0e2", "#ffbc8a"],["#ffffff", "#ff8a3d", "#ff8a3d", "#ff8a3d", "#ffb56e"],["#fffaf0", "#4a2410", "#ffd36a", "#ff8a3d", "#ffd36a"]] }),
  lemonSpark: makePreset({ label: "레몬 스파크", gift: ["#5c4a0f", "#fffbe5", "#f6d84a", "#fffbe5", "#ffe37a"], level: ["#5c4a0f", "#fff9dc", "#ffd84d", "#fff9dc", "#ffeaa0"], superFan: ["#fffdf0", "#443600", "#fff28a", "#fff28a", "#ffcf33"], giftTiers: [["#5c4a0f", "#fffdf0", "#f9e99f", "#fffdf0", "#fff4bd"],["#5c4a0f", "#fffbe5", "#f6d84a", "#fffbe5", "#ffe37a"],["#5c4a0f", "#fff4bd", "#f2c90f", "#fff4bd", "#ffe37a"],["#ffffff", "#dcae00", "#dcae00", "#dcae00", "#ffcf33"],["#fffdf0", "#443600", "#fff28a", "#fff28a", "#ffcf33"]], levelTiers: [["#5c4a0f", "#fffdf0", "#f9e99f", "#fffdf0", "#fff4bd"],["#5c4a0f", "#fffbe5", "#f6d84a", "#fffbe5", "#ffe37a"],["#5c4a0f", "#fff4bd", "#f2c90f", "#fff4bd", "#ffe37a"],["#fffdf0", "#443600", "#fff28a", "#fff28a", "#ffcf33"]] }),
  pastelMix: makePreset({ label: "파스텔 믹스", gift: ["#5a4a6d", "#fff5fb", "#ffb7dc", "#fff5fb", "#d9f3ff"], level: ["#4b5b6d", "#f6fbff", "#aee6ff", "#f6fbff", "#ffd6e8"], superFan: ["#5a4a6d", "#fff5fb", "#ffd36a", "#fff5fb", "#ffd36a"], giftTiers: [["#5a4a6d", "#fff8fb", "#ffd6e8", "#fff8fb", "#e8f7ff"],["#5a4a6d", "#fff5fb", "#ffb7dc", "#fff5fb", "#d9f3ff"],["#4b5b6d", "#e8f7ff", "#aee6ff", "#e8f7ff", "#ffd6e8"],["#ffffff", "#8f86ff", "#8f86ff", "#8f86ff", "#ff9ed0"],["#5a4a6d", "#fff5fb", "#ffd36a", "#fff5fb", "#ffd36a"]], levelTiers: [["#5a4a6d", "#fff8fb", "#ffd6e8", "#fff8fb", "#e8f7ff"],["#5a4a6d", "#fff5fb", "#ffb7dc", "#fff5fb", "#d9f3ff"],["#ffffff", "#8f86ff", "#8f86ff", "#8f86ff", "#ff9ed0"],["#5a4a6d", "#fff5fb", "#ffd36a", "#fff5fb", "#ffd36a"]] }),
  roseGold: makePreset({ label: "로즈 골드", gift: ["#fff8f4", "#3b2228", "#f5b0a2", "#5a3540", "#d9a86c"], level: ["#fff8f4", "#3b2630", "#e7a2c1", "#5a3540", "#d9a86c"], superFan: ["#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99"], giftTiers: [["#fff8f4", "#5a3540", "#f7c8bd", "#5a3540", "#e6c38b"],["#fff8f4", "#4f2d36", "#f5b0a2", "#4f2d36", "#d9a86c"],["#fff8f4", "#462832", "#ef9a9a", "#462832", "#d9a86c"],["#fff8f4", "#3b2228", "#ef7d99", "#3b2228", "#ffd36a"],["#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99"]], levelTiers: [["#fff8f4", "#5a3540", "#f7c8bd", "#5a3540", "#e6c38b"],["#fff8f4", "#4f2d36", "#e7a2c1", "#4f2d36", "#d9a86c"],["#fff8f4", "#462832", "#d987b4", "#462832", "#ffd36a"],["#fff8f4", "#2f1d20", "#ffd36a", "#ffd36a", "#ef7d99"]] }),
  royalBlue: makePreset({
    label: "로열 블루",
    gift: ["#ffffff", "#12345d", "#64b5ff", "#1d4ed8", "#64b5ff"],
    level: ["#ffffff", "#17335f", "#93c5fd", "#1e40af", "#7dd3fc"],
    superFan: ["#ffffff", "#0f2545", "#bfdbfe", "#60a5fa", "#fde68a"],
    giftTiers: [
      ["#244761", "#eff6ff", "#bfdbfe", "#eff6ff", "#dbeafe"],
      ["#ffffff", "#2563eb", "#93c5fd", "#2563eb", "#60a5fa"],
      ["#ffffff", "#1d4ed8", "#64b5ff", "#1d4ed8", "#38bdf8"],
      ["#ffffff", "#12345d", "#93c5fd", "#12345d", "#2563eb"],
      ["#ffffff", "#0f2545", "#bfdbfe", "#60a5fa", "#fde68a"]
    ],
    levelTiers: [
      ["#244761", "#eff6ff", "#bfdbfe", "#eff6ff", "#dbeafe"],
      ["#ffffff", "#2563eb", "#93c5fd", "#2563eb", "#60a5fa"],
      ["#ffffff", "#12345d", "#93c5fd", "#12345d", "#2563eb"],
      ["#ffffff", "#0f2545", "#bfdbfe", "#60a5fa", "#fde68a"]
    ]
  }),

  berryBlack: makePreset({
    label: "베리 블랙",
    gift: ["#fff4fb", "#21111d", "#cc5a9d", "#2d1227", "#8b1d5b"],
    level: ["#fff4fb", "#271729", "#b879ff", "#351b4d", "#cc5a9d"],
    superFan: ["#fff4fb", "#180914", "#ffd36a", "#8b1d5b", "#ffd36a"],
    giftTiers: [
      ["#fff4fb", "#412036", "#d889b8", "#412036", "#6d234d"],
      ["#fff4fb", "#33192d", "#cc5a9d", "#33192d", "#8b1d5b"],
      ["#fff4fb", "#2d1227", "#e46bb2", "#2d1227", "#a32870"],
      ["#fff4fb", "#21111d", "#ff8ccf", "#21111d", "#8b1d5b"],
      ["#fff4fb", "#180914", "#ffd36a", "#8b1d5b", "#ffd36a"]
    ],
    levelTiers: [
      ["#fff4fb", "#412036", "#d889b8", "#412036", "#6d234d"],
      ["#fff4fb", "#33192d", "#cc5a9d", "#33192d", "#8b1d5b"],
      ["#fff4fb", "#2d1227", "#e46bb2", "#2d1227", "#a32870"],
      ["#fff4fb", "#180914", "#ffd36a", "#8b1d5b", "#ffd36a"]
    ]
  })

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
    sortMode: "latest",
    minLevel: 0,
    maxCards: 4,
    fontSize: 26,
    cardHeight: 90,
    pinnedIds: [],
    colors: defaultPreset.level,
    tiers: defaultPreset.levelTiers
  }
};
