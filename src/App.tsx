import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, Flame, Lock, PlusCircle, Trophy } from "lucide-react";
import { ConfettiBurst } from "./components/ConfettiBurst";
import { GameBoard } from "./components/GameBoard";
import { GameSetup } from "./components/GameSetup";
import { Header } from "./components/Header";
import { HelpModal } from "./components/HelpModal";
import { PreGameModal } from "./components/PreGameModal";
import { ResultModal } from "./components/ResultModal";
import { GameInfoPanel, WailingWallPanel } from "./components/SidePanels";
import { TurkishKeyboard } from "./components/TurkishKeyboard";
import { decodeGameConfig, type GameConfig } from "./lib/cipher";
import { loadWordList, pickDailyWord } from "./lib/dictionary";
import { evaluateGuess, mergeKeyboardStates, validateHardModeGuess } from "./lib/evaluator";
import { loadSessionGame, saveSessionGame, type GameStatus } from "./lib/session";
import { getNextTheme, pickFunReaction, THEMES, type ThemeMode } from "./lib/theme";
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
  const [theme, setTheme] = useState<ThemeMode>("classic");

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
      className={`flex flex-col transition-colors duration-300 ${
        isGameView ? "h-dvh overflow-hidden" : "min-h-dvh"
      } ${THEMES[theme].pageBg}`}
    >
      <Header
        onOpenSetup={route.mode !== "setup" ? navigateToSetup : undefined}
        onOpenDaily={navigateToDaily}
        onOpenHelp={() => setHelpOpen(true)}
        theme={theme}
        onCycleTheme={() => setTheme((t) => getNextTheme(t))}
        subtitle={subtitle}
        isDaily={route.mode === "daily"}
      />

      <main className={`flex flex-1 flex-col ${isGameView ? "min-h-0" : ""}`}>
        {route.mode === "setup" && (
          <GameSetup
            onStartToken={navigateToToken}
            onStartDaily={navigateToDaily}
            theme={theme}
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
            theme={theme}
            requireStartModal
            onCreateNew={navigateToSetup}
          />
        )}

        {route.mode === "daily" && (
          <DailyGameLoader theme={theme} onCreateNew={navigateToSetup} />
        )}
      </main>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function DailyGameLoader({
  theme,
  onCreateNew,
}: {
  theme: ThemeMode;
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
      theme={theme}
      onCreateNew={onCreateNew}
    />
  );
}

interface ActiveGameProps {
  sessionKey: string;
  config: GameConfig;
  dailyDate?: string;
  theme: ThemeMode;
  requireStartModal?: boolean;
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
  theme,
  requireStartModal = false,
  onCreateNew,
}: ActiveGameProps) {
  const meta = THEMES[theme];
  const wordLength = Array.from(config.word).length;
  const saved = useMemo(() => loadSessionGame(sessionKey), [sessionKey]);

  const [readyToStart, setReadyToStart] = useState<boolean>(
    () => !requireStartModal || Boolean(saved)
  );
  const [guesses, setGuesses] = useState<string[]>(() => saved?.guesses ?? []);
  const [status, setStatus] = useState<GameStatus>(() => saved?.status ?? "playing");
  const [startedAt, setStartedAt] = useState<number>(() => saved?.startedAt ?? Date.now());
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
  const [mobilePanel, setMobilePanel] = useState<"wall" | "info" | null>(null);
  const [resultOpen, setResultOpen] = useState(
    () => saved?.status !== undefined && saved.status !== "playing"
  );
  const [allowedSet, setAllowedSet] = useState<Set<string> | null>(null);
  const [dictLoading, setDictLoading] = useState(config.strictDictionary);

  // Aktif sekme yenilemesine karşı sessionStorage senkronizasyonu (kalıcı localStorage değil)
  useEffect(() => {
    if (!readyToStart) return;
    saveSessionGame(sessionKey, { guesses, status, startedAt, finishedAt, timedOut });
  }, [readyToStart, sessionKey, guesses, status, startedAt, finishedAt, timedOut]);

  const toastTimerRef = useRef<number | null>(null);

  // Canlı kronometre / geri sayım sayacı
  useEffect(() => {
    if (!readyToStart || status !== "playing") return;
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
      if (theme !== "classic") {
        const msg = pickFunReaction(wordLength, 0, wordLength, nextGuesses.length, config.maxAttempts, true);
        if (msg) showToast(msg);
      }
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
    } else if (theme !== "classic") {
      const evalRes = evaluateGuess(currentGuess, config.word);
      const greens = evalRes.filter((s) => s === "correct").length;
      const yellows = evalRes.filter((s) => s === "present").length;
      const msg = pickFunReaction(greens, yellows, wordLength, nextGuesses.length, config.maxAttempts, false);
      if (msg) showToast(msg);
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
    theme,
    triggerShake,
    showToast,
  ]);

  const handleInputKey = useCallback(
    (key: string) => {
      if (!readyToStart || status !== "playing" || dictLoading) return;

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

  const elapsedSec = readyToStart ? Math.max(0, ((finishedAt ?? now) - startedAt) / 1000) : 0;
  const remainingSec =
    config.timeLimitSec > 0 ? Math.max(0, Math.ceil(config.timeLimitSec - elapsedSec)) : null;
  const isUrgent = remainingSec !== null && remainingSec <= 10 && status === "playing";
  const isWarning = remainingSec !== null && remainingSec <= 25 && !isUrgent && status === "playing";

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-1 min-h-0 flex-col xl:grid xl:grid-cols-[340px_minmax(0,1fr)_340px] xl:items-stretch xl:gap-6 px-2 py-2 sm:px-5 sm:py-3">
      <div className="hidden xl:flex xl:flex-col">
        <WailingWallPanel
          theme={theme}
          guessesCount={guesses.length}
          maxAttempts={config.maxAttempts}
          status={status}
        />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-2xl flex-1 min-h-0 flex-col items-center justify-between gap-2 sm:gap-3">
        <ConfettiBurst active={celebrating} />

      {/* Bildirim Toast */}
      {toast && (
        <div className="pointer-events-none fixed top-16 z-40 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg">
          {toast}
        </div>
      )}

      {/* Üst Bilgi Çubuğu (HUD) */}
      <div
        className={`flex shrink-0 w-full max-w-xl items-center justify-between rounded-xl border px-3.5 py-2 sm:px-4 text-xs sm:text-sm shadow-sm transition-colors ${meta.hudClass}`}
      >
        <div className="flex items-center gap-2 font-mono">
          <span className={meta.isLight ? "text-zinc-600" : "text-zinc-400"}>Deneme:</span>
          <span className={`font-bold ${meta.isLight ? "text-zinc-950" : "text-zinc-100"}`}>
            {guesses.length}/{config.maxAttempts}
          </span>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono font-bold ${
            isUrgent
              ? "animate-pulse bg-rose-500/20 text-rose-400 border border-rose-500/40"
              : isWarning
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : meta.isLight
                  ? "bg-zinc-950 text-[#facc15] border border-zinc-950"
                  : theme !== "classic"
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

      {/* Mobil / Tablet Hızlı Panel Butonları */}
      <div className="flex xl:hidden shrink-0 w-full max-w-xl items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setMobilePanel("wall")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer ${meta.cardInnerClass}`}
        >
          <span>😭</span>
          <span>Ağlama Duvarı</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel("info")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer ${meta.cardInnerClass}`}
        >
          <span>ℹ️</span>
          <span>Oyun Bilgisi & Modlar</span>
        </button>
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
            theme={theme}
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
        disabled={!readyToStart || status !== "playing" || dictLoading}
        theme={theme}
      />

      <PreGameModal
        open={!readyToStart}
        config={config}
        wordLength={wordLength}
        theme={theme}
        onStart={() => {
          const t = Date.now();
          setStartedAt(t);
          setNow(t);
          setReadyToStart(true);
        }}
      />

      <ResultModal
        open={resultOpen}
        won={status === "won"}
        timedOut={timedOut}
        hideAnswerOnLoss={config.hideAnswerOnLoss}
        hardMode={config.hardMode}
        theme={theme}
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

      <div className="hidden xl:flex xl:flex-col">
        <GameInfoPanel
          config={config}
          wordLength={wordLength}
          isDaily={Boolean(dailyDate)}
          theme={theme}
        />
      </div>

      {mobilePanel && (
        <div
          className="fixed inset-0 z-50 flex xl:hidden items-center justify-center bg-black/80 p-3 backdrop-blur-xs"
          onClick={() => setMobilePanel(null)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {mobilePanel === "wall" ? (
              <WailingWallPanel
                theme={theme}
                guessesCount={guesses.length}
                maxAttempts={config.maxAttempts}
                status={status}
                inModal
                onClose={() => setMobilePanel(null)}
              />
            ) : (
              <GameInfoPanel
                config={config}
                wordLength={wordLength}
                isDaily={Boolean(dailyDate)}
                theme={theme}
                inModal
                onClose={() => setMobilePanel(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
