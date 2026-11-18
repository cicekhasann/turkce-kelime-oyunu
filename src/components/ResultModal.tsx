import { useState } from "react";
import { Check, Lock, MessageSquareHeart, PlusCircle, Share2, Trophy, XCircle } from "lucide-react";
import { evaluateGuess, generateShareText } from "../lib/evaluator";

interface ResultModalProps {
  open: boolean;
  won: boolean;
  timedOut?: boolean;
  hideAnswerOnLoss?: boolean;
  winMessage?: string;
  targetWord: string;
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  elapsedMs?: number;
  onCreateNew: () => void;
  onClose: () => void;
}

const EMOJI_MAP = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
  empty: "⬜",
} as const;

export function ResultModal({
  open,
  won,
  timedOut,
  hideAnswerOnLoss,
  winMessage,
  targetWord,
  wordLength,
  maxAttempts,
  guesses,
  elapsedMs,
  onCreateNew,
  onClose,
}: ResultModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const emojiRows = guesses.map((g) =>
    evaluateGuess(g, targetWord)
      .map((s) => EMOJI_MAP[s])
      .join("")
  );

  const handleShare = async () => {
    const text = generateShareText({
      wordLength,
      maxAttempts,
      guesses,
      target: targetWord,
      won,
      gameUrl: window.location.href,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const seconds = elapsedMs ? Math.max(1, Math.round(elapsedMs / 1000)) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#13161f] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
          {won ? (
            <Trophy className="h-6 w-6 text-emerald-400" />
          ) : (
            <XCircle className="h-6 w-6 text-rose-400" />
          )}
        </div>

        <h2 className="text-xl font-bold text-zinc-100">
          {won
            ? "Tebrikler, Bildin!"
            : timedOut
              ? "Süren Doldu!"
              : "Tahmin Hakkın Bitti"}
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          {won
            ? `${guesses.length}/${maxAttempts} denemede çözüldü${seconds ? ` (${seconds} sn)` : ""}.`
            : timedOut
              ? "Süre dolduğu için oyun sona erdi."
              : "Bir sonraki oyunda bol şans!"}
        </p>

        {won && winMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <MessageSquareHeart className="h-3.5 w-3.5" />
              <span>Oyunu Kuranın Mesajı</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-100">
              {winMessage}
            </p>
          </div>
        )}

        <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-900/80 py-3 px-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">
            Hedef Kelime
          </div>
          {!won && hideAnswerOnLoss ? (
            <div className="mt-1.5 flex flex-col items-center gap-1 text-zinc-300">
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-amber-400">
                <Lock className="h-4 w-4" />
                <span>Cevap Gizli</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Gizli Cevap Modu aktif olduğu için bilemediğinde doğru kelime gösterilmez.
              </p>
            </div>
          ) : (
            <div className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-emerald-400">
              {targetWord}
            </div>
          )}
        </div>

        <div className="mb-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 font-mono text-base leading-snug tracking-widest">
          {emojiRows.map((row, idx) => (
            <div key={idx}>{row}</div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Panoya Kopyalandı!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Sonucu Paylaş</span>
              </>
            )}
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

