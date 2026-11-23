import { Delete } from "lucide-react";
import { type LetterState } from "../lib/evaluator";
import { THEMES, type ThemeMode } from "../lib/theme";
import { TR_KEYBOARD_ROWS } from "../lib/turkish";

interface TurkishKeyboardProps {
  keyStates: Record<string, LetterState>;
  onKey: (key: string) => void;
  disabled?: boolean;
  theme?: ThemeMode;
}

export function TurkishKeyboard({
  keyStates,
  onKey,
  disabled = false,
  theme = "classic",
}: TurkishKeyboardProps) {
  const palette = THEMES[theme].keyClasses;

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

              const actionClass =
                theme === "pop"
                  ? `min-w-[44px] flex-[1.5] text-xs sm:text-sm font-bold border-2 border-zinc-950 shadow-[2px_2px_0_#09090b] px-1.5 sm:px-3 ${
                      isEnter
                        ? "bg-[#22c55e] text-zinc-950 hover:bg-[#4ade80]"
                        : "bg-[#fde047] text-zinc-950 hover:bg-[#fef08a]"
                    }`
                  : theme !== "classic"
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
                    theme !== "classic" ? "rounded-xl active:translate-y-0.5 active:border-b-2" : "rounded-lg"
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
