import { useEffect, useRef, useState } from "react";
import { evaluateGuess, type LetterState } from "../lib/evaluator";
import { THEMES, type ThemeMode } from "../lib/theme";

interface GameBoardProps {
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  currentGuess: string;
  targetWord: string;
  shakeRow: boolean;
  wonRowIndex?: number | null;
  theme?: ThemeMode;
}

export function GameBoard({
  wordLength,
  maxAttempts,
  guesses,
  currentGuess,
  targetWord,
  shakeRow,
  wonRowIndex = null,
  theme = "classic",
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tileSize, setTileSize] = useState(52);
  const rows = Array.from({ length: maxAttempts });
  const currentChars = Array.from(currentGuess);
  const palette = THEMES[theme].boardClasses;

  const gap = tileSize >= 48 ? 8 : 5;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const pad = theme !== "classic" ? 28 : 10;
      const availW = Math.max(200, rect.width - pad);
      const availH = Math.max(200, rect.height - pad);
      const g = 7;
      const maxByW = (availW - (wordLength - 1) * g) / wordLength;
      const maxByH = (availH - (maxAttempts - 1) * g) / maxAttempts;
      const next = Math.max(28, Math.min(72, Math.floor(Math.min(maxByW, maxByH))));
      setTileSize(next);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wordLength, maxAttempts, theme]);

  const fontSize = Math.max(14, Math.round(tileSize * 0.44));

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-1 min-h-0 items-center justify-center"
    >
      <div
        style={{ gap: `${gap}px` }}
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          theme === "pop"
            ? "rounded-3xl border-2 border-zinc-950 bg-[#fffaf0] p-2.5 sm:p-3.5 shadow-[5px_5px_0_#09090b]"
            : theme !== "classic"
              ? "rounded-3xl border border-cyan-400/25 bg-[#090d1c]/80 p-2.5 sm:p-3.5 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-sm"
              : ""
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
              style={{ gap: `${gap}px` }}
              className={`flex ${isCurrent && shakeRow ? "animate-shake" : ""}`}
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
                    extraClass =
                      theme === "pop"
                        ? "border-zinc-950 bg-[#fef08a] text-zinc-950 animate-pop"
                        : theme !== "classic"
                          ? "border-cyan-400 border-b-4 bg-[#111936] text-white shadow-[0_0_12px_rgba(34,211,238,0.25)] animate-pop"
                          : "border-zinc-500 bg-zinc-900 animate-pop";
                  }
                }

                return (
                  <div
                    key={colIdx}
                    style={{
                      width: `${tileSize}px`,
                      height: `${tileSize}px`,
                      fontSize: `${fontSize}px`,
                      animationDelay: isSubmitted ? `${colIdx * 70}ms` : undefined,
                    }}
                    className={`flex select-none items-center justify-center border-2 font-bold uppercase tracking-wide transition-all ${
                      theme !== "classic" ? "rounded-2xl" : "rounded-lg"
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
    </div>
  );
}
