import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, PlusCircle, Trophy } from "lucide-react";
import { GameBoard } from "./components/GameBoard";
import { GameSetup } from "./components/GameSetup";
import { Header } from "./components/Header";
import { HelpModal } from "./components/HelpModal";
import { ResultModal } from "./components/ResultModal";
import { TurkishKeyboard } from "./components/TurkishKeyboard";
import { decodeGameConfig, type GameConfig } from "./lib/cipher";
import { loadWordList } from "./lib/dictionary";
import { mergeKeyboardStates } from "./lib/evaluator";
import { loadSavedGame, saveGameState, type GameStatus } from "./lib/storage";
import { parseTurkishKey } from "./lib/turkish";

function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("c");
}

export function App() {
  const [token, setToken] = useState<string | null>(() => getTokenFromUrl());
  const [helpOpen, setHelpOpen] = useState(false);

  // URL değişimlerini (Geri/İleri) dinle
  useEffect(() => {
    const onPopState = () => setToken(getTokenFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateToSetup = useCallback(() => {
    window.history.pushState({}, "", window.location.pathname);
    setToken(null);
  }, []);

  const navigateToToken = useCallback((nextToken: string) => {
    const url = `${window.location.pathname}?c=${nextToken}`;
    window.history.pushState({}, "", url);
    setToken(nextToken);
  }, []);

  const decoded = useMemo(() => {
    if (!token) return { status: "setup" as const };
    const config = decodeGameConfig(token);
    if (!config) return { status: "invalid" as const };
    return { status: "ready" as const, config, token };
  }, [token]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0e1015] text-zinc-100">
      <Header
        onOpenSetup={decoded.status !== "setup" ? navigateToSetup : undefined}
        onOpenHelp={() => setHelpOpen(true)}
        subtitle={
          decoded.status === "ready"
            ? `${Array.from(decoded.config.word).length} Harf • ${
                decoded.config.strictDictionary ? "Sözlüklü" : "Serbest"
              }${decoded.config.hideAnswerOnLoss ? " • Gizli Cevap" : ""}`
            : "Arkadaş Grubuna Özel"
        }
      />

      <main className="flex flex-1 flex-col">
        {decoded.status === "setup" && (
          <GameSetup onStartToken={navigateToToken} />
        )}

        {decoded.status === "invalid" && (
          <div className="mx-auto my-auto max-w-sm px-4 text-center">
            <div className="rounded-2xl border border-rose-500/30 bg-[#13161f] p-6 shadow-xl">
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-rose-400" />
              <h2 className="text-lg font-bold text-zinc-100">
                Geçersiz Oyun Linki
              </h2>
              <p className="mt-1.5 text-xs text-zinc-400">
                Paylaşılan bağlantı eksik kopyalanmış veya bozulmuş görünüyor.
              </p>
              <button
                type="button"
                onClick={navigateToSetup}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Yeni Oyun Oluştur</span>
              </button>
            </div>
          </div>
        )}

        {decoded.status === "ready" && (
          <ActiveGame
            key={decoded.token}
            token={decoded.token}
            config={decoded.config}
            onCreateNew={navigateToSetup}
          />
        )}
      </main>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

interface ActiveGameProps {
  token: string;
  config: GameConfig;
  onCreateNew: () => void;
}

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ActiveGame({ token, config, onCreateNew }: ActiveGameProps) {
  const wordLength = Array.from(config.word).length;
  const saved = useMemo(() => loadSavedGame(token), [token]);

  const [guesses, setGuesses] = useState<string[]>(() => saved?.guesses ?? []);
  const [status, setStatus] = useState<GameStatus>(() => saved?.status ?? "playing");
  const [startedAt] = useState<number>(() => saved?.startedAt ?? Date.now());
  const [finishedAt, setFinishedAt] = useState<number | undefined>(() => saved?.finishedAt);
  const [timedOut, setTimedOut] = useState<boolean>(() => saved?.timedOut ?? false);
  const [now, setNow] = useState<number>(() => Date.now());

  const [currentGuess, setCurrentGuess] = useState("");
  const [shakeRow, setShakeRow] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(
    () => saved?.status !== undefined && saved.status !== "playing"
  );
  const [allowedSet, setAllowedSet] = useState<Set<string> | null>(null);
  const [dictLoading, setDictLoading] = useState(config.strictDictionary);

  const toastTimerRef = useRef<number | null>(null);

  // Canlı kronometre / geri sayım sayacı
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (config.timeLimitSec > 0) {
        const elapsedSec = (current - startedAt) / 1000;
        if (elapsedSec >= config.timeLimitSec) {
          setStatus("lost");
          setTimedOut(true);
          setFinishedAt(current);
          setResultOpen(true);
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [status, config.timeLimitSec, startedAt]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  const triggerShake = useCallback(() => {
    setShakeRow(false);
    requestAnimationFrame(() => setShakeRow(true));
    window.setTimeout(() => setShakeRow(false), 450);
  }, []);

  // Yalnızca bu oyunun harf uzunluğuna ait sözlüğü yükle
  useEffect(() => {
    if (!config.strictDictionary) {
      setDictLoading(false);
      return;
    }
    let cancelled = false;
    setDictLoading(true);
    loadWordList(wordLength)
      .then((dict) => {
        if (!cancelled) {
          setAllowedSet(dict.allowedSet);
          setDictLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          showToast("Sözlük yüklenemedi, serbest moda geçildi.");
          setDictLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config.strictDictionary, wordLength, showToast]);

  // Oyun durumunu kaydet
  useEffect(() => {
    saveGameState(token, { guesses, status, startedAt, finishedAt, timedOut });
  }, [token, guesses, status, startedAt, finishedAt, timedOut]);

  const handleSubmit = useCallback(() => {
    if (status !== "playing") return;

    const chars = Array.from(currentGuess);
    if (chars.length < wordLength) {
      triggerShake();
      showToast("Yetersiz harf!");
      return;
    }

    if (config.strictDictionary && allowedSet) {
      // Hedef kelime özel/sözlük dışı olsa bile doğru tahmin her zaman kabul edilir
      if (currentGuess !== config.word && !allowedSet.has(currentGuess)) {
        triggerShake();
        showToast("Kelime sözlükte bulunamadı!");
        return;
      }
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess("");

    if (currentGuess === config.word) {
      const doneAt = Date.now();
      setStatus("won");
      setFinishedAt(doneAt);
      window.setTimeout(() => setResultOpen(true), wordLength * 70 + 380);
    } else if (nextGuesses.length >= config.maxAttempts) {
      const doneAt = Date.now();
      setStatus("lost");
      setFinishedAt(doneAt);
      window.setTimeout(() => setResultOpen(true), wordLength * 70 + 380);
    }
  }, [
    status,
    currentGuess,
    wordLength,
    config.strictDictionary,
    config.word,
    config.maxAttempts,
    allowedSet,
    guesses,
    triggerShake,
    showToast,
  ]);

  const handleInputKey = useCallback(
    (key: string) => {
      if (status !== "playing" || dictLoading) return;

      if (key === "ENTER") {
        handleSubmit();
        return;
      }

      if (key === "BACKSPACE") {
        setCurrentGuess((prev) => {
          const chars = Array.from(prev);
          chars.pop();
          return chars.join("");
        });
        return;
      }

      const parsed = parseTurkishKey(key);
      if (!parsed) return;

      setCurrentGuess((prev) => {
        const chars = Array.from(prev);
        if (chars.length >= wordLength) return prev;
        return prev + parsed;
      });
    },
    [status, dictLoading, handleSubmit, wordLength]
  );

  // Fiziksel klavye dinleyicisi
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleInputKey("ENTER");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleInputKey("BACKSPACE");
      } else {
        const parsed = parseTurkishKey(e.key);
        if (parsed) {
          e.preventDefault();
          handleInputKey(parsed);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleInputKey]);

  const keyStates = useMemo(
    () => mergeKeyboardStates(guesses, config.word),
    [guesses, config.word]
  );

  const elapsedSec = Math.max(0, ((finishedAt ?? now) - startedAt) / 1000);
  const remainingSec =
    config.timeLimitSec > 0 ? Math.max(0, Math.ceil(config.timeLimitSec - elapsedSec)) : null;
  const isUrgent = remainingSec !== null && remainingSec <= 10 && status === "playing";
  const isWarning = remainingSec !== null && remainingSec <= 25 && !isUrgent && status === "playing";

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-between px-2 py-2 sm:justify-center sm:gap-5 sm:px-4 sm:py-6">
      {/* Bildirim Toast */}
      {toast && (
        <div className="pointer-events-none fixed top-16 z-40 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg">
          {toast}
        </div>
      )}

      {/* Üst Bilgi Çubuğu (HUD) */}
      <div className="flex w-full max-w-xl items-center justify-between rounded-xl border border-zinc-800/90 bg-[#13161f]/90 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm shadow-sm">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-zinc-400">Deneme:</span>
          <span className="font-bold text-zinc-100">
            {guesses.length}/{config.maxAttempts}
          </span>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono font-bold ${
            isUrgent
              ? "animate-pulse bg-rose-500/20 text-rose-400 border border-rose-500/40"
              : isWarning
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-zinc-900 text-emerald-400 border border-zinc-800"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>
            {remainingSec !== null
              ? formatTime(remainingSec)
              : formatTime(elapsedSec)}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <span>{wordLength} Harf</span>
          <span>•</span>
          <span>{config.strictDictionary ? "Sözlüklü" : "Serbest"}</span>
        </div>
      </div>

      {dictLoading ? (
        <div className="my-auto text-xs text-zinc-400">
          {wordLength} harfli Türkçe sözlük yükleniyor...
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center">
          <GameBoard
            wordLength={wordLength}
            maxAttempts={config.maxAttempts}
            guesses={guesses}
            currentGuess={currentGuess}
            targetWord={config.word}
            shakeRow={shakeRow}
          />
          {status !== "playing" && !resultOpen && (
            <button
              type="button"
              onClick={() => setResultOpen(true)}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Sonucu Göster / Paylaş</span>
            </button>
          )}
        </div>
      )}

      <TurkishKeyboard
        keyStates={keyStates}
        onKey={handleInputKey}
        disabled={status !== "playing" || dictLoading}
      />

      <ResultModal
        open={resultOpen}
        won={status === "won"}
        timedOut={timedOut}
        hideAnswerOnLoss={config.hideAnswerOnLoss}
        winMessage={config.winMessage}
        targetWord={config.word}
        wordLength={wordLength}
        maxAttempts={config.maxAttempts}
        guesses={guesses}
        elapsedMs={finishedAt ? finishedAt - startedAt : undefined}
        onCreateNew={onCreateNew}
        onClose={() => setResultOpen(false)}
      />
    </div>
  );
}

