export type GameStatus = "playing" | "won" | "lost";

export interface SessionGameState {
  guesses: string[];
  status: GameStatus;
  startedAt: number;
  finishedAt?: number;
  timedOut?: boolean;
}

const SESSION_PREFIX = "kelimele:tab:";

/**
 * Yalnızca aktif tarayıcı sekmesi içinde (F5 veya mobil arka plan uyanması için)
 * geçici oyun durumunu korur. Kalıcı localStorage kullanmaz; sekme kapanınca silinir.
 */
export function loadSessionGame(key: string): SessionGameState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionGameState;
    if (!Array.isArray(parsed.guesses) || typeof parsed.status !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSessionGame(key: string, state: SessionGameState): void {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(state));
  } catch {
    // Oturum depolaması kısıtlıysa sessizce yoksay
  }
}

