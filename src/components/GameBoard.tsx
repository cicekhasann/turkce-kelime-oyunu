import { evaluateGuess, type LetterState } from "../lib/evaluator";

interface GameBoardProps {
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  currentGuess: string;
  targetWord: string;
  shakeRow: boolean;
  wonRowIndex?: number | null;
  funMode?: boolean;
}

const CLASSIC_CLASSES: Record<LetterState, string> = {
  correct: "border-emerald-500 bg-emerald-600 text-white",
  present: "border-amber-500 bg-amber-500 text-zinc-950",
  absent: "border-zinc-700 bg-zinc-800 text-zinc-300",
  empty: "border-zinc-800 bg-zinc-900/50 text-zinc-100",
};

const FUN_CLASSES: Record<LetterState, string> = {
  correct:
    "border-emerald-400 border-b-4 bg-gradient-to-b from-emerald-400 to-emerald-600 text-zinc-950 shadow-[0_0_16px_rgba(16,185,129,0.4)]",
  present:
    "border-amber-300 border-b-4 bg-gradient-to-b from-amber-300 to-amber-500 text-zinc-950 shadow-[0_0_14px_rgba(245,158,11,0.35)]",
  absent:
    "border-[#3a2a6b] border-b-4 bg-[#221742] text-purple-200/70",
  empty:
    "border-[#3b2970] bg-[#191038]/80 text-purple-100",
};

export function GameBoard({
  wordLength,
  maxAttempts,
  guesses,
  currentGuess,
  targetWord,
  shakeRow,
  wonRowIndex = null,
  funMode = false,
}: GameBoardProps) {
  const rows = Array.from({ length: maxAttempts });
  const currentChars = Array.from(currentGuess);
  const palette = funMode ? FUN_CLASSES : CLASSIC_CLASSES;

  const tileSizeStyle = {
    width: `min(72px, calc((100vw - 32px - ${(wordLength - 1) * 8}px) / ${wordLength}), calc((100dvh - 320px - ${(maxAttempts - 1) * 8}px) / ${maxAttempts}))`,
    height: `min(72px, calc((100vw - 32px - ${(wordLength - 1) * 8}px) / ${wordLength}), calc((100dvh - 320px - ${(maxAttempts - 1) * 8}px) / ${maxAttempts}))`,
    fontSize: wordLength >= 7 ? "clamp(1rem, 2.5vw, 1.5rem)" : "clamp(1.25rem, 3vw, 1.875rem)",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 ${
        funMode
          ? "rounded-3xl border border-purple-500/25 bg-[#160d33]/75 p-3 sm:p-4 shadow-[0_0_40px_rgba(139,92,246,0.12)]"
          : "py-1 sm:py-2"
      }`}
    >
      {rows.map((_, rowIdx) => {
        const isSubmitted = rowIdx < guesses.length;
        const isCurrent = rowIdx === guesses.length;
        const guess = guesses[rowIdx] ?? "";
        const states = isSubmitted ? evaluateGuess(guess, targetWord) : null;
        const guessChars = isSubmitted ? Array.from(guess) : [];

        return (
          <div
            key={rowIdx}
            className={`flex gap-1.5 sm:gap-2 ${isCurrent && shakeRow ? "animate-shake" : ""}`}
          >
            {Array.from({ length: wordLength }).map((__, colIdx) => {
              let letter = "";
              let state: LetterState = "empty";
              let extraClass = "";

              if (isSubmitted) {
                letter = guessChars[colIdx] ?? "";
                state = states ? states[colIdx] : "empty";
                extraClass = wonRowIndex === rowIdx ? "animate-wave" : "animate-flip";
              } else if (isCurrent) {
                letter = currentChars[colIdx] ?? "";
                if (letter) {
                  extraClass = funMode
                    ? "border-fuchsia-400 border-b-4 bg-[#261754] text-white animate-pop"
                    : "border-zinc-500 bg-zinc-900 animate-pop";
                }
              }

              return (
                <div
                  key={colIdx}
                  style={{
                    ...tileSizeStyle,
                    animationDelay: isSubmitted ? `${colIdx * 70}ms` : undefined,
                  }}
                  className={`flex select-none items-center justify-center border-2 font-bold uppercase tracking-wide transition-all ${
                    funMode ? "rounded-2xl" : "rounded-lg"
                  } ${palette[state]} ${extraClass}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
