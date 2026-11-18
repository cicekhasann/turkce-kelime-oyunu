import { useEffect, useState } from "react";
import { Check, Clock, Copy, Dices, Eye, EyeOff, Link2, MessageSquareHeart, Play, Sparkles } from "lucide-react";
import { encodeGameConfig } from "../lib/cipher";
import { loadWordList, pickRandomWord } from "../lib/dictionary";
import {
  MAX_ATTEMPTS,
  MAX_WORD_LENGTH,
  MIN_ATTEMPTS,
  MIN_WORD_LENGTH,
  sanitizeTurkishWord,
} from "../lib/turkish";

interface GameSetupProps {
  onStartToken: (token: string) => void;
}

export function GameSetup({ onStartToken }: GameSetupProps) {
  const [mode, setMode] = useState<"custom" | "random">("custom");
  const [customWord, setCustomWord] = useState("");
  const [showWord, setShowWord] = useState(false);
  const [randomLength, setRandomLength] = useState(5);
  const [randomWord, setRandomWord] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);

  const [maxAttempts, setMaxAttempts] = useState(6);
  const [attemptsTouched, setAttemptsTouched] = useState(false);
  const [strictDictionary, setStrictDictionary] = useState(true);
  const [hideAnswerOnLoss, setHideAnswerOnLoss] = useState(false);
  const [timeLimitSec, setTimeLimitSec] = useState(0);
  const [winMessage, setWinMessage] = useState("");

  const [inDictionary, setInDictionary] = useState<boolean | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeWord = mode === "custom" ? customWord : randomWord;
  const activeLength = Array.from(activeWord).length;

  // Harf sayısı değiştikçe hak sayısını otomatik orantıla (harf + 1), kullanıcı elle değiştirmediyse
  useEffect(() => {
    if (attemptsTouched) return;
    const targetLen = mode === "random" ? randomLength : activeLength || 5;
    const clamped = Math.min(
      MAX_ATTEMPTS,
      Math.max(MIN_ATTEMPTS, targetLen + 1)
    );
    setMaxAttempts(clamped);
  }, [mode, randomLength, activeLength, attemptsTouched]);

  // Özel kelime yazıldığında sözlükte olup olmadığını kontrol et
  useEffect(() => {
    if (mode !== "custom") {
      setInDictionary(null);
      return;
    }
    if (activeLength < MIN_WORD_LENGTH || activeLength > MAX_WORD_LENGTH) {
      setInDictionary(null);
      return;
    }

    let cancelled = false;
    loadWordList(activeLength)
      .then(({ allowedSet }) => {
        if (!cancelled) {
          setInDictionary(allowedSet.has(customWord));
        }
      })
      .catch(() => {
        if (!cancelled) setInDictionary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, customWord, activeLength]);

  const handlePickRandom = async (len = randomLength) => {
    setLoadingRandom(true);
    setError(null);
    setGeneratedToken(null);
    try {
      const w = await pickRandomWord(len);
      setRandomWord(w);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Rastgele kelime seçilemedi.");
    } finally {
      setLoadingRandom(false);
    }
  };

  useEffect(() => {
    if (mode === "random" && !randomWord) {
      handlePickRandom(randomLength);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleCustomWordChange = (val: string) => {
    const clean = sanitizeTurkishWord(val);
    const chars = Array.from(clean).slice(0, MAX_WORD_LENGTH);
    setCustomWord(chars.join(""));
    setGeneratedToken(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setError(null);
    if (activeLength < MIN_WORD_LENGTH || activeLength > MAX_WORD_LENGTH) {
      setError(
        `Kelime en az ${MIN_WORD_LENGTH}, en fazla ${MAX_WORD_LENGTH} harfli olmalıdır.`
      );
      return;
    }

    if (mode === "custom" && strictDictionary) {
      try {
        const { allowedSet } = await loadWordList(activeLength);
        if (!allowedSet.has(activeWord)) {
          setInDictionary(false);
          setError(
            "Bu kelime Türkçe sözlükte bulunmuyor! Oyunu başlatmak için sözlükte olan bir kelime yazın veya aşağıdaki 'Sözlük Zorunluluğu' seçeneğini kapatın."
          );
          return;
        }
      } catch {
        setError("Sözlük doğrulanamadı, lütfen tekrar deneyin.");
        return;
      }
    }

    const token = encodeGameConfig({
      word: activeWord,
      maxAttempts,
      strictDictionary,
      hideAnswerOnLoss,
      timeLimitSec,
      winMessage,
    });
    setGeneratedToken(token);
    setCopied(false);
  };

  const shareUrl = generatedToken
    ? `${window.location.origin}${window.location.pathname}?c=${generatedToken}`
    : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 sm:py-10">
      <div className="rounded-2xl border border-zinc-800 bg-[#13161f] p-5 shadow-xl sm:p-6">
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
            <Sparkles className="h-3 w-3" />
            <span>Sunucusuz & Şifreli Link</span>
          </div>
          <h2 className="mt-2.5 text-xl font-bold tracking-tight text-zinc-100">
            Yeni Kelime Oyunu Kur
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Hedef kelimeyi ve kuralları belirle, oluşan gizli linki arkadaşlarınla paylaş.
          </p>
        </div>

        {/* Mod Seçimi */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setMode("custom");
              setGeneratedToken(null);
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              mode === "custom"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kendi Kelimemi Yaz
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("random");
              setGeneratedToken(null);
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              mode === "random"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Rastgele Kelime Çek
          </button>
        </div>

        {/* Kelime Giriş / Rastgele Seçim Alanı */}
        {mode === "custom" ? (
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="custom-word"
                className="text-xs font-medium text-zinc-300"
              >
                Hedef Kelime ({MIN_WORD_LENGTH}-{MAX_WORD_LENGTH} Harf)
              </label>
              <span className="font-mono text-[11px] text-zinc-400">
                {activeLength} harf
              </span>
            </div>
            <div className="relative">
              <input
                id="custom-word"
                type={showWord ? "text" : "password"}
                value={customWord}
                onChange={(e) => handleCustomWordChange(e.target.value)}
                placeholder="Örn: GÖKYÜZÜ"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 pr-10 font-mono text-base font-bold tracking-widest text-zinc-100 placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowWord((s) => !s)}
                aria-label={showWord ? "Kelimeyi gizle" : "Kelimeyi göster"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {showWord ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {strictDictionary && inDictionary === false && (
              <p className="text-[11px] text-amber-400/90">
                Bu kelime sözlükte bulunmuyor. Sözlük zorunluluğu açıkken oyunu
                başlatamazsın; aşağıdaki &quot;Sözlük Zorunluluğu&quot; seçeneğini
                kapatabilir veya sözlükte olan bir kelime yazabilirsin.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-5 space-y-3">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-zinc-300">
                Harf Uzunluğu Seç
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[4, 5, 6, 7, 8].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => {
                      setRandomLength(len);
                      handlePickRandom(len);
                    }}
                    className={`rounded-lg border py-2 font-mono text-xs font-bold transition cursor-pointer ${
                      randomLength === len
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2.5">
              <div>
                <div className="text-[11px] text-zinc-400">Seçilen Gizli Kelime</div>
                <div className="mt-0.5 font-mono text-base font-bold tracking-widest text-zinc-100">
                  {loadingRandom
                    ? "Seçiliyor..."
                    : showWord
                      ? randomWord
                      : "•".repeat(randomLength)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowWord((s) => !s)}
                  aria-label="Göster/Gizle"
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  {showWord ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={loadingRandom}
                  onClick={() => handlePickRandom(randomLength)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                >
                  <Dices className="h-4 w-4 text-emerald-400" />
                  <span>Değiştir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hak Sayısı */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300">
              Tahmin Hakkı Sayısı
            </label>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {maxAttempts} Hak
            </span>
          </div>
          <input
            type="range"
            min={MIN_ATTEMPTS}
            max={MAX_ATTEMPTS}
            value={maxAttempts}
            onChange={(e) => {
              setAttemptsTouched(true);
              setMaxAttempts(Number(e.target.value));
              setGeneratedToken(null);
            }}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between font-mono text-[10px] text-zinc-500">
            <span>{MIN_ATTEMPTS}</span>
            <span>Varsayılan: Harf + 1</span>
            <span>{MAX_ATTEMPTS}</span>
          </div>
        </div>

        {/* Süre Sınırı */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              Süre Sınırı
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {timeLimitSec === 0 ? "Süresiz (Kronometre)" : `${timeLimitSec} saniye`}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {[
              { label: "Süresiz", value: 0 },
              { label: "60s", value: 60 },
              { label: "90s", value: 90 },
              { label: "120s", value: 120 },
              { label: "180s", value: 180 },
              { label: "300s", value: 300 },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTimeLimitSec(opt.value);
                  setGeneratedToken(null);
                }}
                className={`rounded-lg border py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer ${
                  timeLimitSec === opt.value
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kazanma Mesajı (Opsiyonel) */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="win-message"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-300"
            >
              <MessageSquareHeart className="h-3.5 w-3.5 text-emerald-400" />
              Başarılı Olursa Mesaj (Opsiyonel)
            </label>
            <span className="font-mono text-[10px] text-zinc-500">
              {winMessage.length}/140
            </span>
          </div>
          <input
            id="win-message"
            type="text"
            maxLength={140}
            value={winMessage}
            onChange={(e) => {
              setWinMessage(e.target.value);
              setGeneratedToken(null);
            }}
            placeholder="Örn: Bunu bildiysen kahveler senden ☕"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Sözlük Zorunluluğu */}
        <label className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-3">
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Sözlük Zorunluluğu
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              Açıkken yalnızca sözlükteki gerçek Türkçe kelimeler kabul edilir.
            </div>
          </div>
          <input
            type="checkbox"
            checked={strictDictionary}
            onChange={(e) => {
              setStrictDictionary(e.target.checked);
              setGeneratedToken(null);
              setError(null);
            }}
            className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
          />
        </label>

        {/* Bilemezse Cevabı Gizle Modu */}
        <label className="mb-5 flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-3">
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Bilemezse Cevabı Gizle
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              Açıkken oyuncu hakları dolduğunda bile doğru kelime gösterilmez.
            </div>
          </div>
          <input
            type="checkbox"
            checked={hideAnswerOnLoss}
            onChange={(e) => {
              setHideAnswerOnLoss(e.target.checked);
              setGeneratedToken(null);
            }}
            className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
          />
        </label>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.99] cursor-pointer"
        >
          <Link2 className="h-4 w-4" />
          <span>Şifreli Oyun Linki Oluştur</span>
        </button>

        {/* Oluşan Link Kutusu */}
        {generatedToken && (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-3">
            <div className="text-xs font-semibold text-emerald-400">
              Oyun Linki Hazır!
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-2 font-mono text-xs text-zinc-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => onStartToken(generatedToken)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span>Bu Linki Şimdi Test Et / Oyna</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

