import { type LetterState } from "./evaluator";

export type ThemeMode = "classic" | "pop" | "arcade" | "iznik";

export const THEME_ORDER: readonly ThemeMode[] = ["classic", "pop", "arcade", "iznik"];

export interface ThemeMeta {
  id: ThemeMode;
  label: string;
  shortLabel: string;
  emoji: string;
  isLight: boolean;
  pageBg: string;
  headerClass: string;
  hudClass: string;
  panelClass: string;
  cardInnerClass: string;
  modalClass: string;
  boardClasses: Record<LetterState, string>;
  keyClasses: Record<LetterState, string>;
  shareCard: {
    bg: string;
    cardBg: string;
    cardBorder: string;
    titleColor: string;
    winColor: string;
    lossColor: string;
    tiles: Record<LetterState, { fill: string; border: string }>;
  };
}

export const THEMES: Record<ThemeMode, ThemeMeta> = {
  classic: {
    id: "classic",
    label: "Klasik Koyu",
    shortLabel: "Klasik",
    emoji: "🌙",
    isLight: false,
    pageBg: "bg-[#0b0d13] text-zinc-100",
    headerClass: "border-zinc-800/80 bg-[#0b0d13]/90",
    hudClass: "border-zinc-800/90 bg-[#13161f]/90",
    panelClass: "border-zinc-800/90 bg-[#13161f]/95",
    cardInnerClass: "border-zinc-800/80 bg-zinc-900/75",
    modalClass: "border-zinc-800 bg-[#13161f]",
    boardClasses: {
      correct: "border-emerald-500 bg-emerald-600 text-white",
      present: "border-amber-500 bg-amber-500 text-zinc-950",
      absent: "border-zinc-700 bg-zinc-800 text-zinc-300",
      empty: "border-zinc-800 bg-zinc-900/50 text-zinc-100",
    },
    keyClasses: {
      correct: "bg-emerald-600 text-white border-emerald-500",
      present: "bg-amber-500 text-zinc-950 border-amber-400",
      absent: "bg-zinc-800/80 text-zinc-500 border-zinc-800",
      empty: "bg-zinc-700/80 text-zinc-100 border-zinc-600/50 hover:bg-zinc-600/80",
    },
    shareCard: {
      bg: "#0b0d13",
      cardBg: "#13161f",
      cardBorder: "#27272a",
      titleColor: "#f8fafc",
      winColor: "#34d399",
      lossColor: "#fb7185",
      tiles: {
        correct: { fill: "#10b981", border: "#34d399" },
        present: { fill: "#f59e0b", border: "#fbbf24" },
        absent: { fill: "#27272a", border: "#3f3f46" },
        empty: { fill: "#18181b", border: "#27272a" },
      },
    },
  },

  pop: {
    id: "pop",
    label: "Pop-Art",
    shortLabel: "Pop-Art",
    emoji: "🎨",
    isLight: true,
    pageBg: "bg-[#f6f1e7] text-zinc-950",
    headerClass: "border-b-2 border-zinc-950 bg-[#fffaf0]/95",
    hudClass: "border-2 border-zinc-950 bg-white shadow-[3px_3px_0_#09090b] text-zinc-950",
    panelClass: "border-2 border-zinc-950 bg-[#fffaf0] shadow-[4px_4px_0_#09090b] text-zinc-950",
    cardInnerClass: "border-2 border-zinc-950 bg-white text-zinc-950",
    modalClass: "border-2 border-zinc-950 bg-[#fffaf0] shadow-[6px_6px_0_#09090b] text-zinc-950",
    boardClasses: {
      correct: "border-2 border-zinc-950 bg-[#22c55e] text-zinc-950 shadow-[3px_3px_0_#09090b]",
      present: "border-2 border-zinc-950 bg-[#facc15] text-zinc-950 shadow-[3px_3px_0_#09090b]",
      absent: "border-2 border-zinc-950 bg-[#e4e4e7] text-zinc-500 shadow-[2px_2px_0_#09090b]",
      empty: "border-2 border-zinc-950 bg-white text-zinc-950 shadow-[2px_2px_0_#09090b]",
    },
    keyClasses: {
      correct: "bg-[#22c55e] text-zinc-950 border-2 border-zinc-950 shadow-[2px_2px_0_#09090b]",
      present: "bg-[#facc15] text-zinc-950 border-2 border-zinc-950 shadow-[2px_2px_0_#09090b]",
      absent: "bg-[#d4d4d8] text-zinc-500 border-2 border-zinc-950",
      empty: "bg-white text-zinc-950 border-2 border-zinc-950 shadow-[2px_2px_0_#09090b] hover:bg-[#fef08a]",
    },
    shareCard: {
      bg: "#f6f1e7",
      cardBg: "#fffaf0",
      cardBorder: "#09090b",
      titleColor: "#09090b",
      winColor: "#16a34a",
      lossColor: "#e11d48",
      tiles: {
        correct: { fill: "#22c55e", border: "#09090b" },
        present: { fill: "#facc15", border: "#09090b" },
        absent: { fill: "#d4d4d8", border: "#09090b" },
        empty: { fill: "#ffffff", border: "#09090b" },
      },
    },
  },

  arcade: {
    id: "arcade",
    label: "Retro Arcade",
    shortLabel: "Arcade",
    emoji: "🕹️",
    isLight: false,
    pageBg: "bg-[#090818] bg-cyber-grid text-zinc-100",
    headerClass: "border-b-2 border-fuchsia-500/40 bg-[#0c0a24]/95",
    hudClass: "border-2 border-cyan-400/50 bg-[#121033]/95 shadow-[0_0_18px_rgba(34,211,238,0.18)]",
    panelClass: "border-2 border-fuchsia-500/40 bg-[#100e2b]/95 shadow-[0_0_24px_rgba(217,70,239,0.16)]",
    cardInnerClass: "border border-cyan-400/25 bg-[#17143d]/90",
    modalClass: "border-2 border-cyan-400/60 bg-[#100e2b] shadow-[0_0_40px_rgba(34,211,238,0.22)]",
    boardClasses: {
      correct: "border-emerald-300 border-b-4 bg-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(52,211,153,0.45)]",
      present: "border-amber-200 border-b-4 bg-amber-400 text-zinc-950 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
      absent: "border-purple-900 border-b-4 bg-[#1c1642] text-purple-300/60",
      empty: "border-cyan-400/45 border-b-4 bg-[#141138] text-cyan-50",
    },
    keyClasses: {
      correct: "bg-emerald-400 text-zinc-950 border-emerald-700 border-b-4",
      present: "bg-amber-400 text-zinc-950 border-amber-700 border-b-4",
      absent: "bg-[#19143a] text-purple-400/50 border-[#0d0a22] border-b-2",
      empty: "bg-[#221c52] text-cyan-50 border-cyan-400/45 border-b-4 hover:bg-[#2d256b]",
    },
    shareCard: {
      bg: "#090818",
      cardBg: "#100e2b",
      cardBorder: "#22d3ee",
      titleColor: "#f8fafc",
      winColor: "#34d399",
      lossColor: "#fb7185",
      tiles: {
        correct: { fill: "#34d399", border: "#6ee7b7" },
        present: { fill: "#fbbf24", border: "#fde68a" },
        absent: { fill: "#1c1642", border: "#581c87" },
        empty: { fill: "#141138", border: "#22d3ee" },
      },
    },
  },

  iznik: {
    id: "iznik",
    label: "İznik Çini",
    shortLabel: "İznik",
    emoji: "🏺",
    isLight: false,
    pageBg: "bg-[#07142b] text-amber-50",
    headerClass: "border-b border-amber-400/30 bg-[#091a38]/95",
    hudClass: "border border-amber-400/35 bg-[#0c2147]/95 shadow-[0_4px_20px_rgba(6,182,212,0.12)]",
    panelClass: "border border-amber-400/35 bg-[#0b1d3d]/95",
    cardInnerClass: "border border-cyan-400/20 bg-[#0f2752]/85",
    modalClass: "border border-amber-400/45 bg-[#0b1d3d] shadow-[0_0_40px_rgba(245,158,11,0.18)]",
    boardClasses: {
      correct: "border-cyan-300 bg-gradient-to-b from-cyan-400 to-teal-600 text-zinc-950 shadow-[0_0_14px_rgba(34,211,238,0.35)]",
      present: "border-amber-300 bg-gradient-to-b from-amber-300 to-amber-500 text-zinc-950 shadow-[0_0_14px_rgba(245,158,11,0.35)]",
      absent: "border-[#1e3a6e] bg-[#0e2247] text-blue-200/50",
      empty: "border-amber-400/25 bg-[#0a1c3d] text-amber-50",
    },
    keyClasses: {
      correct: "bg-cyan-400 text-zinc-950 border-teal-700 border-b-4",
      present: "bg-amber-400 text-zinc-950 border-amber-700 border-b-4",
      absent: "bg-[#0c1d3d] text-blue-300/40 border-[#071226] border-b-2",
      empty: "bg-[#132d5e] text-amber-50 border-amber-400/30 border-b-4 hover:bg-[#1a3c7a]",
    },
    shareCard: {
      bg: "#07142b",
      cardBg: "#0b1d3d",
      cardBorder: "#f59e0b",
      titleColor: "#fef3c7",
      winColor: "#22d3ee",
      lossColor: "#fb7185",
      tiles: {
        correct: { fill: "#06b6d4", border: "#67e8f9" },
        present: { fill: "#f59e0b", border: "#fcd34d" },
        absent: { fill: "#0e2247", border: "#1e3a6e" },
        empty: { fill: "#0a1c3d", border: "#f59e0b" },
      },
    },
  },
};

export function getNextTheme(current: ThemeMode): ThemeMode {
  const idx = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
}

export function pickFunReaction(
  greens: number,
  yellows: number,
  wordLength: number,
  attemptNumber: number,
  maxAttempts: number,
  won: boolean
): string | null {
  if (won) {
    if (attemptNumber === 1) return "🤯 TEK ATIMDA! AKLIMI MI OKUDUN?!";
    if (attemptNumber === maxAttempts) return "😅 SON NEFESTE KURTARDIN!";
    return "🔥 ŞAHANE ÇÖZÜM!";
  }
  if (attemptNumber === maxAttempts - 1) return "😬 SON HAKKIN KALDI, DİKKAT!";
  if (greens >= Math.max(3, wordLength - 1)) return "⚡ KLAVYE ALEV ALDI, ÇOK YAKIN!";
  if (greens === 0 && yellows === 0) return "🧊 BUZ GİBİ... SIFIR İSABET!";
  if (greens + yellows >= 3) return "👀 GÜZEL İPUCU TOPLADIN!";
  return null;
}
