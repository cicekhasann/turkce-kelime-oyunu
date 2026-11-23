import { BookOpen, Flame, Lock, Play, Sparkles, Timer } from "lucide-react";
import { type GameConfig } from "../lib/cipher";
import { THEMES, type ThemeMode } from "../lib/theme";
import { formatDuration } from "../lib/turkish";

interface PreGameModalProps {
  open: boolean;
  config: GameConfig;
  wordLength: number;
  theme: ThemeMode;
  onStart: () => void;
}

export function PreGameModal({
  open,
  config,
  wordLength,
  theme,
  onStart,
}: PreGameModalProps) {
  if (!open) return null;
  const meta = THEMES[theme];
  const isLight = meta.isLight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className={`w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl ${meta.modalClass}`}>
        <div
          className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${
            theme === "pop"
              ? "border-2 border-zinc-950 bg-[#facc15] text-zinc-950"
              : theme !== "classic"
                ? "border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 text-cyan-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className={`text-xl font-bold ${isLight ? "text-zinc-950" : "text-zinc-100"}`}>Meydan Okuma Hazır!</h2>
        <p className={`mt-1 text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
          Arkadaşın senin için özel bir kelime oyunu kurdu. Başla dediğinde süre ve tahminler başlar.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs">
          <div className={`rounded-xl border p-3 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Kelime</div>
            <div className="mt-0.5 font-bold">
              {wordLength} Harf • {config.maxAttempts} Hak
            </div>
          </div>
          <div className={`rounded-xl border p-3 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Sözlük Kuralı</div>
            <div className="mt-0.5 flex items-center gap-1 font-bold">
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              <span>{config.strictDictionary ? "Sözlüklü" : "Serbest Mod"}</span>
            </div>
          </div>
          <div className={`rounded-xl border p-3 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Süre Limiti</div>
            <div className="mt-0.5 flex items-center gap-1 font-bold">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {config.timeLimitSec > 0 ? formatDuration(config.timeLimitSec) : "Süresiz"}
              </span>
            </div>
          </div>
          <div className={`rounded-xl border p-3 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Ekstra Kurallar</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-bold">
              {!config.hardMode && !config.hideAnswerOnLoss && <span>Standart</span>}
              {config.hardMode && (
                <span className="inline-flex items-center gap-0.5 text-rose-500">
                  <Flame className="h-3 w-3" /> Zor
                </span>
              )}
              {config.hideAnswerOnLoss && (
                <span className="inline-flex items-center gap-0.5 text-amber-500">
                  <Lock className="h-3 w-3" /> Gizli
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition cursor-pointer ${
            theme === "pop"
              ? "border-2 border-zinc-950 bg-[#22c55e] text-zinc-950 shadow-[3px_3px_0_#09090b] hover:bg-[#4ade80]"
              : theme !== "classic"
                ? "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.4)] hover:brightness-110"
                : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          }`}
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Oyuna Başla</span>
        </button>
      </div>
    </div>
  );
}
