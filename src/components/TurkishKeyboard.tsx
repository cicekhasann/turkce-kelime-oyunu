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
    "bg-emerald-500 text-zinc-950 border-emerald-700 border-b-4 shadow-[0_0_10px_rgba(16,185,129,0.35)]",
  present:
    "bg-amber-400 text-zinc-950 border-amber-600 border-b-4 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
  absent:
    "bg-[#1b1236] text-purple-300/40 border-[#120b26] border-b-2",
  empty:
    "bg-[#2d1e5c] text-purple-100 border-[#4a328f] border-b-4 hover:bg-[#382670]",
};

export function TurkishKeyboard({
  keyStates,
  onKey,
  disabled = false,
  funMode = false,
}: TurkishKeyboardProps) {
  const palette = funMode ? FUN_KEY_CLASSES : CLASSIC_KEY_CLASSES;

  return (
    <div className="mx-auto w-full max-w-2xl select-none px-1.5 pb-3 pt-1 sm:px-3">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {TR_KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isEnter = key === "ENTER";
              const isBackspace = key === "BACKSPACE";
              const state: LetterState =
                isEnter || isBackspace ? "empty" : keyStates[key] ?? "empty";

              const actionClass = funMode
                ? "min-w-[44px] flex-[1.5] bg-gradient-to-b from-fuchsia-500 to-purple-600 text-xs sm:text-sm text-white border-purple-800 border-b-4 hover:from-fuchsia-400 hover:to-purple-500 px-1.5 sm:px-3"
                : "min-w-[44px] flex-[1.5] bg-zinc-700 text-xs sm:text-sm text-zinc-100 border-zinc-600 hover:bg-zinc-600 px-1.5 sm:px-3";

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onKey(key)}
                  aria-label={isBackspace ? "Sil" : isEnter ? "Gönder" : key}
                  className={`flex h-12 sm:h-14 md:h-[58px] items-center justify-center border font-bold transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
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
