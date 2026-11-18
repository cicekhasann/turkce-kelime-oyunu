import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, Flame, Lock, PlusCircle, Trophy } from "lucide-react";
import { ConfettiBurst } from "./components/ConfettiBurst";
import { GameBoard } from "./components/GameBoard";
import { GameSetup } from "./components/GameSetup";
import { Header } from "./components/Header";
import { HelpModal } from "./components/HelpModal";
import { ResultModal } from "./components/ResultModal";
import { TurkishKeyboard } from "./components/TurkishKeyboard";
import { decodeGameConfig, type GameConfig } from "./lib/cipher";
import { loadWordList, pickDailyWord } from "./lib/dictionary";
import { mergeKeyboardStates, validateHardModeGuess } from "./lib/evaluator";
import { loadSessionGame, saveSessionGame, type GameStatus } from "./lib/session";
import { parseTurkishKey } from "./lib/turkish";

type RouteState =
  | { mode: "setup" }
  | { mode: "daily" }
  | { mode: "token"; token: string };

function getRouteFromUrl(): RouteState {
  const params = new URLSearchParams(window.location.search);
  const c = params.get("c");
  if (c) return { mode: "token", token: c };
  if (params.get("daily") === "1") return { mode: "daily" };
  return { mode: "setup" };
}

export function App() {
  const [route, setRoute] = useState<RouteState>(() => getRouteFromUrl());
  const [helpOpen, setHelpOpen] = useState(false);
  const [funMode, setFunMode] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateToSetup = useCallback(() => {
    window.history.pushState({}, "", window.location.pathname);
    setRoute({ mode: "setup" });
  }, []);

  const navigateToToken = useCallback((nextToken: string) => {
    const url = `${window.location.pathname}?c=${nextToken}`;
    window.history.pushState({}, "", url);
    setRoute({ mode: "token", token: nextToken });
  }, []);

  const navigateToDaily = useCallback(() => {
    const url = `${window.location.pathname}?daily=1`;
    window.history.pushState({}, "", url);
    setRoute({ mode: "daily" });
  }, []);

  const tokenConfig = useMemo(() => {
    if (route.mode !== "token") return null;
    return decodeGameConfig(route.token);
  }, [route]);

  const subtitle = useMemo(() => {
    if (route.mode === "daily") return "Günün Kelimesi • 5 Harf";
    if (route.mode === "token" && tokenConfig) {
      return `${Array.from(tokenConfig.word).length} Harf • ${
        tokenConfig.strictDictionary ? "Sözlüklü" : "Serbest"
      }${tokenConfig.hardMode ? " • Zor Mod" : ""}`;
    }
    return "Arkadaş Grubuna Özel";
  }, [route, tokenConfig]);

  const isGameView =
    (route.mode === "token" && tokenConfig !== null) || route.mode === "daily";

  return (
    <div
      className={`flex flex-col text-zinc-100 transition-colors duration-300 ${
        isGameView ? "h-dvh overflow-hidden" : "min-h-dvh"
      } ${
        funMode
          ? "bg-[#060913] bg-cyber-grid"
          : "bg-[#0b0d13]"
      }`}
    >
      <Header
        onOpenSetup={route.mode !== "setup" ? navigateToSetup : undefined}
        onOpenDaily={navigateToDaily}
        onOpenHelp={() => setHelpOpen(true)}
        funMode={funMode}
        onToggleFunMode={() => setFunMode((f) => !f)}
        subtitle={subtitle}
        isDaily={route.mode === "daily"}
      />

      <main className={`flex flex-1 flex-col ${isGameView ? "min-h-0" : ""}`}>
        {route.mode === "setup" && (
          <GameSetup
            onStartToken={navigateToToken}
            onStartDaily={navigateToDaily}
            funMode={funMode}
          />
        )}

        {route.mode === "token" && !tokenConfig && (
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

        {route.mode === "token" && tokenConfig && (
          <ActiveGame
            key={route.token}
            sessionKey={route.token}
            config={tokenConfig}
            funMode={funMode}
            onCreateNew={navigateToSetup}
          />
        )}

        {route.mode === "daily" && (
          <DailyGameLoader funMode={funMode} onCreateNew={navigateToSetup} />
        )}
      </main>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function DailyGameLoader({
  funMode,
  onCreateNew,
}: {
  funMode: boolean;
  onCreateNew: () => void;
}) {
  const [daily, setDaily] = useState<{ config: GameConfig; dateStr: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    pickDailyWord(5)
      .then(({ word, dateStr }) => {
        if (!cancelled) {
          setDaily({
            dateStr,
            config: {
              word,
              maxAttempts: 6,
              strictDictionary: true,
              timeLimitSec: 0,
            },
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Günlük kelime yüklenemedi.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="my-auto text-center text-xs text-rose-400">{error}</div>
    );
  }

  if (!daily) {
    return (
      <div className="my-auto text-center text-xs text-zinc-400">
        Günün kelimesi hazırlanıyor...
      </div>
    );
  }

  return (
    <ActiveGame
      key={`daily-${daily.dateStr}`}
      sessionKey={`daily-${daily.dateStr}`}
      config={daily.config}
      dailyDate={daily.dateStr}
      funMode={funMode}
      onCreateNew={onCreateNew}
    />
  );
}

interface ActiveGameProps {
  sessionKey: string;
  config: GameConfig;
  dailyDate?: string;
  funMode: boolean;
  onCreateNew: () => void;
}

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ActiveGame({
  sessionKey,
  config,
  dailyDate,
  funMode,
  onCreateNew,
}: ActiveGameProps) {
  const wordLength = Array.from(config.word).length;
  const saved = useMemo(() => loadSessionGame(sessionKey), [sessionKey]);

  const [guesses, setGuesses] = useState<string[]>(() => saved?.guesses ?? []);
  const [status, setStatus] = useState<GameStatus>(() => saved?.status ?? "playing");
  const [startedAt] = useState<number>(() => saved?.startedAt ?? Date.now());
  const [finishedAt, setFinishedAt] = useState<number | undefined>(() => saved?.finishedAt);
  const [timedOut, setTimedOut] = useState(() => saved?.timedOut ?? false);
  const [now, setNow] = useState<number>(() => Date.now());

  const [currentGuess, setCurrentGuess] = useState("");
  const [shakeRow, setShakeRow] = useState(false);
  const [wonRowIndex, setWonRowIndex] = useState<number | null>(() =>
    saved?.status === "won" ? saved.guesses.length - 1 : null
  );
  const [celebrating, setCelebrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(
    () => saved?.status !== undefined && saved.status !== "playing"
  );
  const [allowedSet, setAllowedSet] = useState<Set<string> | null>(null);
  const [dictLoading, setDictLoading] = useState(config.strictDictionary);

  // Aktif sekme yenilemesine karşı sessionStorage senkronizasyonu (kalıcı localStorage değil)
  useEffect(() => {
    saveSessionGame(sessionKey, { guesses, status, startedAt, finishedAt, timedOut });
  }, [sessionKey, guesses, status, startedAt, finishedAt, timedOut]);

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
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
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

  const handleSubmit = useCallback(() => {
    if (status !== "playing") return;

    const chars = Array.from(currentGuess);
    if (chars.length < wordLength) {
      triggerShake();
      showToast("Yetersiz harf!");
      return;
    }

    if (config.strictDictionary && allowedSet) {
      if (currentGuess !== config.word && !allowedSet.has(currentGuess)) {
        triggerShake();
        showToast("Kelime sözlükte bulunamadı!");
        return;
      }
    }

    if (config.hardMode) {
      const hardError = validateHardModeGuess(currentGuess, guesses, config.word);
      if (hardError) {
        triggerShake();
        showToast(hardError);
        return;
      }
    }

    const rowIdx = guesses.length;
    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess("");

    if (currentGuess === config.word) {
      const doneAt = Date.now();
      setStatus("won");
      setFinishedAt(doneAt);
      const flipFinishDelay = wordLength * 70 + 360;
      window.setTimeout(() => {
        setWonRowIndex(rowIdx);
        setCelebrating(true);
      }, flipFinishDelay);
      window.setTimeout(() => setResultOpen(true), flipFinishDelay + 650);
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
    config.hardMode,
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
    <div className="relative mx-auto flex h-full w-full max-w-2xl flex-1 min-h-0 flex-col items-center justify-between gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
      <ConfettiBurst active={celebrating} />

      {/* Bildirim Toast */}
      {toast && (
        <div className="pointer-events-none fixed top-16 z-40 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg">
          {toast}
        </div>
      )}

      {/* Üst Bilgi Çubuğu (HUD) */}
      <div
        className={`flex shrink-0 w-full max-w-xl items-center justify-between rounded-xl border px-3.5 py-2 sm:px-4 text-xs sm:text-sm shadow-sm transition-colors ${
          funMode
            ? "border-cyan-500/30 bg-[#090d1c]/90 backdrop-blur-sm"
            : "border-zinc-800/90 bg-[#13161f]/90"
        }`}
      >
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
                : funMode
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
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

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-zinc-400">
          {dailyDate && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
              {dailyDate}
            </span>
          )}
          {config.hardMode && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">
              <Flame className="h-3 w-3" /> Zor
            </span>
          )}
          {config.hideAnswerOnLoss && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
              <Lock className="h-3 w-3" /> Gizli
            </span>
          )}
          {!dailyDate && !config.hardMode && !config.hideAnswerOnLoss && (
            <span>
              {wordLength} Harf • {config.strictDictionary ? "Sözlüklü" : "Serbest"}
            </span>
          )}
        </div>
      </div>

      {dictLoading ? (
        <div className="my-auto text-xs text-zinc-400">
          {wordLength} harfli Türkçe sözlük yükleniyor...
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center">
          <GameBoard
            wordLength={wordLength}
            maxAttempts={config.maxAttempts}
            guesses={guesses}
            currentGuess={currentGuess}
            targetWord={config.word}
            shakeRow={shakeRow}
            wonRowIndex={wonRowIndex}
            funMode={funMode}
          />
          {status !== "playing" && !resultOpen && (
            <button
              type="button"
              onClick={() => setResultOpen(true)}
              className="mt-2 shrink-0 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
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
        funMode={funMode}
      />

      <ResultModal
        open={resultOpen}
        won={status === "won"}
        timedOut={timedOut}
        hideAnswerOnLoss={config.hideAnswerOnLoss}
        hardMode={config.hardMode}
        funMode={funMode}
        dailyDate={dailyDate}
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
