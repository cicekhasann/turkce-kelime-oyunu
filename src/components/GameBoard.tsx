import { evaluateGuess, type LetterState } from "../lib/evaluator";

interface GameBoardProps {
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  currentGuess: string;
  targetWord: string;
  shakeRow: boolean;
}

const STATE_CLASSES: Record<LetterState, string> = {
  correct: "border-emerald-500 bg-emerald-600 text-white",
  present: "border-amber-500 bg-amber-500 text-zinc-950",
  absent: "border-zinc-700 bg-zinc-800 text-zinc-300",
  empty: "border-zinc-800 bg-zinc-900/50 text-zinc-100",
};

export function GameBoard({
  wordLength,
  maxAttempts,
  guesses,
  currentGuess,
  targetWord,
  shakeRow,
}: GameBoardProps) {
  const rows = Array.from({ length: maxAttempts });
  const currentChars = Array.from(currentGuess);

  // Hem mobilde (genişlik + yükseklik) hem masaüstünde (daha iri kutucuklar) taşmadan tam oturan dinamik boyut
  const tileSizeStyle = {
    width: `min(72px, calc((100vw - 32px - ${(wordLength - 1) * 8}px) / ${wordLength}), calc((100dvh - 320px - ${(maxAttempts - 1) * 8}px) / ${maxAttempts}))`,
    height: `min(72px, calc((100vw - 32px - ${(wordLength - 1) * 8}px) / ${wordLength}), calc((100dvh - 320px - ${(maxAttempts - 1) * 8}px) / ${maxAttempts}))`,
    fontSize: wordLength >= 7 ? "clamp(1rem, 2.5vw, 1.5rem)" : "clamp(1.25rem, 3vw, 1.875rem)",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-1 sm:py-2">
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
                extraClass = "animate-flip";
              } else if (isCurrent) {
                letter = currentChars[colIdx] ?? "";
                if (letter) {
                  extraClass = "border-zinc-500 bg-zinc-900 animate-pop";
                }
              }

              return (
                <div
                  key={colIdx}
                  style={{
                    ...tileSizeStyle,
                    animationDelay: isSubmitted ? `${colIdx * 70}ms` : undefined,
                  }}
                  className={`flex select-none items-center justify-center rounded-lg border-2 font-bold uppercase tracking-wide transition-colors ${
                    STATE_CLASSES[state]
                  } ${extraClass}`}
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

