import { Delete } from "lucide-react";
import { type LetterState } from "../lib/evaluator";
import { TR_KEYBOARD_ROWS } from "../lib/turkish";

interface TurkishKeyboardProps {
  keyStates: Record<string, LetterState>;
  onKey: (key: string) => void;
  disabled?: boolean;
}

const KEY_STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-emerald-600 text-white border-emerald-500",
  present: "bg-amber-500 text-zinc-950 border-amber-400",
  absent: "bg-zinc-800/80 text-zinc-500 border-zinc-800",
  empty: "bg-zinc-700/80 text-zinc-100 border-zinc-600/50 hover:bg-zinc-600/80",
};

export function TurkishKeyboard({
  keyStates,
  onKey,
  disabled = false,
}: TurkishKeyboardProps) {
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

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onKey(key)}
                  aria-label={isBackspace ? "Sil" : isEnter ? "Gönder" : key}
                  className={`flex h-12 sm:h-14 md:h-[58px] items-center justify-center rounded-lg border font-semibold transition active:scale-95 disabled:opacity-60 cursor-pointer ${
                    isEnter || isBackspace
                      ? "min-w-[44px] flex-[1.5] bg-zinc-700 text-xs sm:text-sm text-zinc-100 border-zinc-600 hover:bg-zinc-600 px-1.5 sm:px-3"
                      : `flex-1 text-sm sm:text-base md:text-lg ${KEY_STATE_CLASSES[state]}`
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

