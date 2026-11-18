import { Delete } from "lucide-react";
import { type LetterState } from "../lib/evaluator";
import { TR_KEYBOARD_ROWS } from "../lib/turkish";

interface TurkishKeyboardProps {
  keyStates: Record<string, LetterState>;
  onKey: (key: string) => void;
  disabled?: boolean;
  funMode?: boolean;
}

const CLASSIC_KEY_CLASSES: Record<LetterState, string> = {
  correct: "bg-emerald-600 text-white border-emerald-500",
  present: "bg-amber-500 text-zinc-950 border-amber-400",
  absent: "bg-zinc-800/80 text-zinc-500 border-zinc-800",
  empty: "bg-zinc-700/80 text-zinc-100 border-zinc-600/50 hover:bg-zinc-600/80",
};

const FUN_KEY_CLASSES: Record<LetterState, string> = {
  correct:
    "bg-emerald-400 text-zinc-950 border-emerald-600 border-b-4 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  present:
    "bg-amber-400 text-zinc-950 border-amber-600 border-b-4 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
  absent:
    "bg-slate-900/80 text-slate-600 border-slate-950 border-b-2",
  empty:
    "bg-[#121933] text-cyan-50 border-cyan-500/35 border-b-4 hover:bg-[#192347]",
};

export function TurkishKeyboard({
  keyStates,
  onKey,
  disabled = false,
  funMode = false,
}: TurkishKeyboardProps) {
  const palette = funMode ? FUN_KEY_CLASSES : CLASSIC_KEY_CLASSES;

  return (
    <div className="mx-auto shrink-0 w-full max-w-2xl select-none px-1.5 pb-2 pt-0.5 sm:px-3">
      <div className="flex flex-col gap-1.5">
        {TR_KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isEnter = key === "ENTER";
              const isBackspace = key === "BACKSPACE";
              const state: LetterState =
                isEnter || isBackspace ? "empty" : keyStates[key] ?? "empty";

              const actionClass = funMode
                ? `min-w-[44px] flex-[1.5] text-xs sm:text-sm font-bold border-b-4 px-1.5 sm:px-3 ${
                    isEnter
                      ? "bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 border-cyan-700 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                      : "bg-[#1a2242] text-cyan-100 border-slate-950 hover:bg-[#222d54]"
                  }`
                : "min-w-[44px] flex-[1.5] bg-zinc-700 text-xs sm:text-sm text-zinc-100 border-zinc-600 hover:bg-zinc-600 px-1.5 sm:px-3";

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onKey(key)}
                  aria-label={isBackspace ? "Sil" : isEnter ? "Gönder" : key}
                  className={`flex h-12 sm:h-14 items-center justify-center border font-bold transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
                    funMode ? "rounded-xl active:translate-y-0.5 active:border-b-2" : "rounded-lg"
                  } ${
                    isEnter || isBackspace
                      ? actionClass
                      : `flex-1 text-sm sm:text-base md:text-lg ${palette[state]}`
                  }`}
                >
                  {isBackspace ? (
                    <Delete className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : isEnter ? (
                    "GİR"
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
