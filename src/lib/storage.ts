export type GameStatus = "playing" | "won" | "lost";

export interface SavedGameState {
  guesses: string[];
  status: GameStatus;
  startedAt: number;
  finishedAt?: number;
  timedOut?: boolean;
}

const STORAGE_PREFIX = "kelimele:v1:";

export function loadSavedGame(token: string): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + token);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    if (!Array.isArray(parsed.guesses) || typeof parsed.status !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveGameState(token: string, state: SavedGameState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + token, JSON.stringify(state));
  } catch {
    // Depolama kotası veya gizli sekme kısıtında oyunu bozma
  }
}

