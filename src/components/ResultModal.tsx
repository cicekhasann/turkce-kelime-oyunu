import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  MessageSquareHeart,
  PlusCircle,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { evaluateGuess, generateShareText, type LetterState } from "../lib/evaluator";
import { generateShareCardBlob } from "../lib/shareCard";
import { fetchTdkMeaning, type TdkEntry } from "../lib/tdk";
import { formatDuration } from "../lib/turkish";
import { type ThemeMode } from "../lib/theme";

interface ResultModalProps {
  open: boolean;
  won: boolean;
  timedOut?: boolean;
  hideAnswerOnLoss?: boolean;
  hardMode?: boolean;
  theme?: ThemeMode;
  dailyDate?: string;
  winMessage?: string;
  targetWord: string;
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  elapsedMs?: number;
  onCreateNew: () => void;
  onClose: () => void;
}

const MINI_TILE_CLASSES: Record<LetterState, string> = {
  correct: "bg-emerald-600 text-white border-emerald-500/80",
  present: "bg-amber-500 text-zinc-950 border-amber-400/80",
  absent: "bg-zinc-800 text-zinc-300 border-zinc-700/80",
  empty: "bg-zinc-900 text-zinc-500 border-zinc-800",
};

function getWittyTitle(
  won: boolean,
  timedOut: boolean | undefined,
  attemptCount: number,
  maxAttempts: number
): string {
  if (!won) {
    if (timedOut) return "Zaman Su Gibi Aktı! ⏳";
    return "Çok Yaklaşmıştın!";
  }
  if (attemptCount === 1) return "Aklımı mı Okudun?! 🤯";
  if (attemptCount === 2) return "Nokta Atışı! 🎯";
  if (attemptCount === maxAttempts) return "Son Nefeste Kurtardın! 😅";
  if (attemptCount <= Math.ceil(maxAttempts / 2)) return "Harika Gidişat! 🔥";
  return "Tebrikler, Bildin! 👏";
}

export function ResultModal({
  open,
  won,
  timedOut,
  hideAnswerOnLoss,
  hardMode,
  theme = "classic",
  dailyDate,
  winMessage,
  targetWord,
  wordLength,
  maxAttempts,
  guesses,
  elapsedMs,
  onCreateNew,
  onClose,
}: ResultModalProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [cardStatus, setCardStatus] = useState<"idle" | "busy" | "copied" | "downloaded">("idle");
  const [tdk, setTdk] = useState<TdkEntry | null>(null);
  const [tdkLoading, setTdkLoading] = useState(false);

  const canRevealAnswer = won || !hideAnswerOnLoss;

  useEffect(() => {
    if (!open || !canRevealAnswer) return;
    let cancelled = false;
    setTdkLoading(true);
    fetchTdkMeaning(targetWord)
      .then((entry) => {
        if (!cancelled) setTdk(entry);
      })
      .finally(() => {
        if (!cancelled) setTdkLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, canRevealAnswer, targetWord]);

  if (!open) return null;

  const seconds = elapsedMs ? Math.max(1, Math.round(elapsedMs / 1000)) : undefined;

  const handleShareText = async () => {
    const text = generateShareText({
      wordLength,
      maxAttempts,
      guesses,
      target: targetWord,
      won,
      dailyDate,
      hardMode,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleShareCard = async (forceDownload = false) => {
    setCardStatus("busy");
    try {
      const blob = await generateShareCardBlob({
        wordLength,
        maxAttempts,
        guesses,
        target: targetWord,
        won,
        elapsedSec: seconds,
        dailyDate,
        hardMode,
        theme,
      });

      const file = new File([blob], "kelimele-sonuc.png", { type: "image/png" });

      if (!forceDownload && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Kelimele Sonucum",
        });
        setCardStatus("idle");
        return;
      }

      if (!forceDownload && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCardStatus("copied");
          setTimeout(() => setCardStatus("idle"), 2500);
          return;
        } catch {
          // İndirmeye düş
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kelimele-sonuc.png";
      a.click();
      URL.revokeObjectURL(url);
      setCardStatus("downloaded");
      setTimeout(() => setCardStatus("idle"), 2500);
    } catch {
      setCardStatus("idle");
    }
  };

  const title = getWittyTitle(won, timedOut, guesses.length, maxAttempts);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative my-auto w-full max-w-md rounded-2xl border p-5 sm:p-6 text-center shadow-2xl ${
          theme !== "classic"
            ? "border-cyan-500/30 bg-[#090d1c] text-zinc-100 shadow-[0_0_50px_rgba(34,211,238,0.15)]"
            : "border-zinc-800 bg-[#13161f] text-zinc-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
          {won ? (
            <Trophy className="h-6 w-6 text-emerald-400" />
          ) : (
            <XCircle className="h-6 w-6 text-rose-400" />
          )}
        </div>

        <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
        <p className="mt-1 text-xs text-zinc-400">
          {won
            ? `${guesses.length}/${maxAttempts} denemede çözüldü${seconds ? ` • ${formatDuration(seconds)}` : ""}${hardMode ? " • Zor Mod" : ""}`
            : timedOut
              ? "Süre dolduğu için oyun sona erdi."
              : `${maxAttempts} tahmin hakkı kullanıldı.`}
        </p>

        {won && winMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <MessageSquareHeart className="h-3.5 w-3.5" />
              <span>Oyunu Kuranın Mesajı</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-100">{winMessage}</p>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Hedef Kelime
            </span>
            {canRevealAnswer && (
              <a
                href={`https://sozluk.gov.tr/?ara=${encodeURIComponent(targetWord.toLocaleLowerCase("tr-TR"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:underline"
              >
                <span>TDK&apos;da Gör</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>

          {!canRevealAnswer ? (
            <div className="mt-2 flex flex-col items-center gap-1 py-1 text-center">
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-amber-400">
                <Lock className="h-4 w-4" />
                <span>Cevap Gizli</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Gizli Cevap Modu aktif olduğu için bilemediğinde doğru kelime gösterilmez.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold tracking-[0.18em] text-emerald-400">
                  {targetWord}
                </span>
                {tdk?.origin && (
                  <span className="text-[11px] italic text-zinc-500">({tdk.origin})</span>
                )}
              </div>

              {tdkLoading ? (
                <p className="mt-1.5 text-[11px] text-zinc-500">TDK anlamı getiriliyor...</p>
              ) : tdk && tdk.meanings.length > 0 ? (
                <div className="mt-2 space-y-1 border-t border-zinc-800/80 pt-2">
                  {tdk.meanings.map((m, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-300">
                      <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400/80" />
                      <span>
                        {tdk.meanings.length > 1 ? `${i + 1}. ` : ""}
                        {m}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-zinc-500">Sözlük tanımı alınamadı.</p>
              )}
            </>
          )}
        </div>

        {guesses.length > 0 && (
          <div className="mt-4 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <span>Tahmin Geçmişin</span>
              <span>{guesses.length} satır</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              {guesses.map((g, rowIdx) => {
                const chars = Array.from(g);
                const states = evaluateGuess(g, targetWord);
                return (
                  <div key={rowIdx} className="flex items-center gap-1">
                    {chars.map((ch, colIdx) => (
                      <span
                        key={colIdx}
                        className={`flex h-7 w-7 items-center justify-center rounded-md border font-mono text-xs font-bold ${
                          MINI_TILE_CLASSES[states[colIdx]]
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cardStatus === "busy"}
              onClick={() => handleShareCard(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60 cursor-pointer"
            >
              {cardStatus === "copied" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Görsel Kopyalandı (Ctrl+V)!</span>
                </>
              ) : cardStatus === "downloaded" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Kart İndirildi!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  <span>Görsel Kart Paylaş</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={cardStatus === "busy"}
              onClick={() => handleShareCard(true)}
              title="PNG olarak indir"
              className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-zinc-200 transition hover:bg-zinc-700 cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareText}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 cursor-pointer"
          >
            {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedText ? "Metin Panoya Kopyalandı!" : "Metin / Emoji Olarak Kopyala"}</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-emerald-400" />
            <span>Sen de Arkadaşına Oyun Kur</span>
          </button>
        </div>
      </div>
    </div>
  );
}
