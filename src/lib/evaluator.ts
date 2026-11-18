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

/**
 * Zor Mod doğrulaması:
 * Önceki tahminlerde açığa çıkan tüm yeşil (doğru konum) ve sarı (var olan)
 * harflerin yeni tahminde kullanılıp kullanılmadığını kontrol eder.
 */
export function validateHardModeGuess(
  guess: string,
  previousGuesses: string[],
  target: string
): string | null {
  if (previousGuesses.length === 0) return null;

  const guessChars = Array.from(guess);
  const lastGuess = previousGuesses[previousGuesses.length - 1];
  const lastChars = Array.from(lastGuess);
  const lastStates = evaluateGuess(lastGuess, target);

  // 1. Doğru konumdaki (Yeşil) harfler aynı konumda olmalı
  for (let i = 0; i < lastStates.length; i++) {
    if (lastStates[i] === "correct" && guessChars[i] !== lastChars[i]) {
      return `${i + 1}. harf '${lastChars[i]}' olmalı!`;
    }
  }

  // 2. Son tahminde açılan tüm sarı + yeşil harf sayıları korunmalı
  const requiredCounts = new Map<string, number>();
  for (let i = 0; i < lastStates.length; i++) {
    if (lastStates[i] === "correct" || lastStates[i] === "present") {
      requiredCounts.set(lastChars[i], (requiredCounts.get(lastChars[i]) ?? 0) + 1);
    }
  }

  const guessCounts = new Map<string, number>();
  for (const ch of guessChars) {
    guessCounts.set(ch, (guessCounts.get(ch) ?? 0) + 1);
  }

  for (const [ch, reqCount] of requiredCounts.entries()) {
    if ((guessCounts.get(ch) ?? 0) < reqCount) {
      return `Tahminde '${ch}' harfi bulunmalı!`;
    }
  }

  return null;
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
  dailyDate?: string;
  hardMode?: boolean;
  gameUrl?: string;
}): string {
  const { wordLength, maxAttempts, guesses, target, won, dailyDate, hardMode, gameUrl } = params;
  const score = won ? `${guesses.length}/${maxAttempts}` : `X/${maxAttempts}`;
  const modeSuffix = hardMode ? "*" : "";
  const header = dailyDate
    ? `Kelimele Günlük (${dailyDate}) ${score}${modeSuffix}`
    : `Kelimele (${wordLength} Harf) ${score}${modeSuffix}`;

  const grid = guesses
    .map((g) =>
      evaluateGuess(g, target)
        .map((s) => EMOJI_MAP[s])
        .join("")
    )
    .join("\n");

  return gameUrl ? `${header}\n\n${grid}\n\n${gameUrl}` : `${header}\n\n${grid}`;
}

