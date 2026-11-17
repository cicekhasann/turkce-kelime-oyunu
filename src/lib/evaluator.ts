export type LetterState = "correct" | "present" | "absent" | "empty";

const STATE_PRIORITY: Record<LetterState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

/**
 * İki aşamalı Wordle değerlendirme algoritması (çoklu harf kuralı uyumlu):
 * 1. Aşama: Tam konumdaki eşleşmeleri ("correct" / Yeşil) bulur ve havuzdan düşer.
 * 2. Aşama: Kalan harf havuzunda varsa ("present" / Sarı), yoksa ("absent" / Gri) işaretler.
 */
export function evaluateGuess(guess: string, target: string): LetterState[] {
  const guessChars = Array.from(guess);
  const targetChars = Array.from(target);
  const result: LetterState[] = new Array(targetChars.length).fill("absent");
  const remainingCounts = new Map<string, number>();

  // 1. Aşama: Tam eşleşmeler
  for (let i = 0; i < targetChars.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
    } else {
      const ch = targetChars[i];
      remainingCounts.set(ch, (remainingCounts.get(ch) ?? 0) + 1);
    }
  }

  // 2. Aşama: Yanlış konumdaki eşleşmeler
  for (let i = 0; i < targetChars.length; i++) {
    if (result[i] === "correct") continue;
    const ch = guessChars[i];
    const count = remainingCounts.get(ch) ?? 0;
    if (count > 0) {
      result[i] = "present";
      remainingCounts.set(ch, count - 1);
    }
  }

  return result;
}

/**
 * Tüm tahmin geçmişine göre sanal klavye tuşlarının en yüksek öncelikli rengini hesaplar.
 * Öncelik: Yeşil (correct) > Sarı (present) > Gri (absent)
 */
export function mergeKeyboardStates(
  guesses: string[],
  target: string
): Record<string, LetterState> {
  const keyStates: Record<string, LetterState> = {};

  for (const guess of guesses) {
    const chars = Array.from(guess);
    const states = evaluateGuess(guess, target);
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const nextState = states[i];
      const prevState = keyStates[ch] ?? "empty";
      if (STATE_PRIORITY[nextState] > STATE_PRIORITY[prevState]) {
        keyStates[ch] = nextState;
      }
    }
  }

  return keyStates;
}

const EMOJI_MAP: Record<LetterState, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
  empty: "⬜",
};

/**
 * Sohbet uygulamalarında paylaşılabilir emoji ızgaralı sonuç metni üretir.
 */
export function generateShareText(params: {
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  target: string;
  won: boolean;
  gameUrl?: string;
}): string {
  const { wordLength, maxAttempts, guesses, target, won, gameUrl } = params;
  const score = won ? `${guesses.length}/${maxAttempts}` : `X/${maxAttempts}`;
  const header = `Kelimele (${wordLength} Harf) ${score}`;

  const grid = guesses
    .map((g) =>
      evaluateGuess(g, target)
        .map((s) => EMOJI_MAP[s])
        .join("")
    )
    .join("\n");

  return gameUrl ? `${header}\n\n${grid}\n\n${gameUrl}` : `${header}\n\n${grid}`;
}

