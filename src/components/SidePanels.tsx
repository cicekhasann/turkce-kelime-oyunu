import { useEffect, useState } from "react";
import {
  BookOpen,
  Flame,
  HelpCircle,
  Info,
  Lock,
  MessageCircleHeart,
  Send,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { type GameConfig } from "../lib/cipher";
import { THEMES, type ThemeMode } from "../lib/theme";
import { formatDuration } from "../lib/turkish";

interface WailingEntry {
  id: string;
  text: string;
  tag: string;
  cries: number;
}

const DEFAULT_WAILING_ENTRIES: WailingEntry[] = [
  { id: "w1", text: "Klavye kaydı vallahi, yoksa ilk tahminde biliyordum.", tag: "Bahane #1", cries: 14 },
  { id: "w2", text: "Bu kelime TDK'da var mı gerçekten ya?", tag: "Şüphe", cries: 9 },
  { id: "w3", text: "Ğ harfini koyanı Allah'a havale ediyorum.", tag: "Türkçe Özel", cries: 21 },
  { id: "w4", text: "Son harfi yazacaktım süre bitti 😭", tag: "Süre Mağduru", cries: 7 },
  { id: "w5", text: "Kesin bilerek en gıcık kelimeyi seçti.", tag: "Sitem", cries: 12 },
];

const STORAGE_KEY = "kelimele_wailing_wall_v1";

export function WailingWallPanel({
  theme,
  guessesCount,
  maxAttempts,
  status,
  inModal = false,
  onClose,
}: {
  theme: ThemeMode;
  guessesCount: number;
  maxAttempts: number;
  status: "playing" | "won" | "lost";
  inModal?: boolean;
  onClose?: () => void;
}) {
  const meta = THEMES[theme];
  const isLight = meta.isLight;
  const [entries, setEntries] = useState<WailingEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WAILING_ENTRIES;
  });
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 12)));
    } catch {}
  }, [entries]);

  const addEntry = () => {
    const clean = draft.trim();
    if (!clean) return;
    setEntries((prev) => [
      { id: `${Date.now()}`, text: clean.slice(0, 110), tag: "Senin Sitemin", cries: 1 },
      ...prev.slice(0, 11),
    ]);
    setDraft("");
  };

  const bumpCry = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, cries: e.cries + 1 } : e))
    );
  };

  const liveMood =
    status === "lost"
      ? "Bir bardak soğuk su ikram edelim..."
      : status === "won"
        ? "Şov yaptın, duvar bugün boş kaldı!"
        : guessesCount >= Math.max(2, maxAttempts - 2)
          ? "Terleme başladı, duvar seni bekliyor 👀"
          : "Şimdilik sakin, gözyaşı yok.";

  return (
    <aside
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 transition-colors ${
        inModal
          ? "w-full max-w-md max-h-[82dvh]"
          : "hidden xl:flex h-full max-h-[calc(100dvh-5.5rem)]"
      } overflow-hidden ${meta.panelClass}`}
    >
      <div className={`flex items-start justify-between gap-2 border-b pb-3 ${isLight ? "border-zinc-900/20" : "border-zinc-800/80"}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">😭</span>
          <div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isLight ? "text-zinc-950" : "text-zinc-100"}`}>
              Ağlama Duvarı
            </h2>
            <p className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>{liveMood}</p>
          </div>
        </div>
        {inModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-y-auto pr-1">
        {entries.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-3 text-xs sm:text-[13px] transition-colors ${meta.cardInnerClass}`}
          >
            <p className={`leading-relaxed ${isLight ? "text-zinc-900" : "text-zinc-200"}`}>&ldquo;{item.text}&rdquo;</p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={`rounded px-2 py-0.5 ${isLight ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800/90 text-zinc-300"}`}>
                {item.tag}
              </span>
              <button
                type="button"
                onClick={() => bumpCry(item.id)}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 cursor-pointer ${
                  isLight
                    ? "border-zinc-950 bg-amber-100 text-zinc-900 hover:bg-amber-200"
                    : "border-zinc-700/70 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/80"
                }`}
                title="Ben de ağlıyorum"
              >
                <span>🫠</span>
                <span className="font-mono">{item.cries}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEntry();
              }
            }}
            maxLength={110}
            placeholder="Bahaneni yaz..."
            className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={addEntry}
            disabled={!draft.trim()}
            aria-label="Duvara ekle"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[11px] leading-snug text-zinc-500">
          Sunucusuz çalışır: buraya yazdıkların hiçbir sunucuda veya veritabanında tutulmaz, yalnızca bu tarayıcıda saklanır.
        </p>
      </div>
    </aside>
  );
}

export function GameInfoPanel({
  config,
  wordLength,
  isDaily,
  theme,
  inModal = false,
  onClose,
}: {
  config: GameConfig;
  wordLength: number;
  isDaily: boolean;
  theme: ThemeMode;
  inModal?: boolean;
  onClose?: () => void;
}) {
  const meta = THEMES[theme];
  const isLight = meta.isLight;

  return (
    <aside
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:p-5 transition-colors ${
        inModal
          ? "w-full max-w-md max-h-[82dvh]"
          : "hidden xl:flex h-full max-h-[calc(100dvh-5.5rem)]"
      } overflow-y-auto ${meta.panelClass}`}
    >
      {/* Şu Anki Oyun Modu */}
      <div className={`border-b pb-3.5 ${isLight ? "border-zinc-900/20" : "border-zinc-800/80"}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${isLight ? "text-zinc-950" : "text-zinc-100"}`}>
            <Info className="h-4 w-4 text-emerald-500" />
            <span>Aktif Oyun Bilgisi</span>
          </div>
          {inModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className={`rounded-xl border px-3 py-2 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Format</div>
            <div className="mt-0.5 font-semibold">
              {isDaily ? "Günün Kelimesi" : `${wordLength} Harf • ${config.maxAttempts} Hak`}
            </div>
          </div>
          <div className={`rounded-xl border px-3 py-2 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Sözlük</div>
            <div className="mt-0.5 font-semibold">
              {config.strictDictionary ? "Sözlüklü" : "Serbest"}
            </div>
          </div>
          <div className={`rounded-xl border px-3 py-2 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Süre</div>
            <div className="mt-0.5 font-semibold">
              {config.timeLimitSec > 0 ? formatDuration(config.timeLimitSec) : "Süresiz"}
            </div>
          </div>
          <div className={`rounded-xl border px-3 py-2 ${meta.cardInnerClass}`}>
            <div className={`text-[10px] uppercase ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Tema</div>
            <div className="mt-0.5 font-semibold">
              {meta.emoji} {meta.label}
            </div>
          </div>
        </div>

        {(config.hardMode || config.hideAnswerOnLoss) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
            {config.hardMode && (
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-300">
                <Flame className="h-3 w-3" /> Zor Mod
              </span>
            )}
            {config.hideAnswerOnLoss && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
                <Lock className="h-3 w-3" /> Gizli Cevap
              </span>
            )}
          </div>
        )}
      </div>

      {/* Nasıl Oynanır */}
      <div className={`border-b pb-3.5 space-y-2.5 ${isLight ? "border-zinc-900/20" : "border-zinc-800/80"}`}>
        <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${isLight ? "text-zinc-950" : "text-zinc-100"}`}>
          <HelpCircle className="h-4 w-4 text-amber-500" />
          <span>Nasıl Oynanır?</span>
        </div>
        <div className={`space-y-2 text-xs ${isLight ? "text-zinc-800" : "text-zinc-300"}`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-bold text-white">K</span>
            <span>Harf kelimede var ve <strong>doğru yerde</strong>.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500 font-bold text-zinc-950">E</span>
            <span>Harf kelimede var ama <strong>yanlış yerde</strong>.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800 font-bold text-zinc-300 border border-zinc-700">L</span>
            <span>Harf kelimede <strong>hiç yok</strong>.</span>
          </div>
        </div>
      </div>

      {/* Modlar Rehberi */}
      <div className={`space-y-2.5 text-xs leading-relaxed ${isLight ? "text-zinc-700" : "text-zinc-400"}`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-zinc-950" : "text-zinc-200"}`}>
          Oyun Modları & Temalar
        </div>
        <p className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span><strong className={isLight ? "text-zinc-950" : "text-zinc-200"}>Sözlüklü:</strong> Sadece gerçek Türkçe kelimeler kabul edilir.</span>
        </p>
        <p className="flex items-start gap-2">
          <MessageCircleHeart className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
          <span><strong className={isLight ? "text-zinc-950" : "text-zinc-200"}>Serbest:</strong> Özel isimler, lakaplar dahil her şey yazılabilir.</span>
        </p>
        <p className="flex items-start gap-2">
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <span><strong className={isLight ? "text-zinc-950" : "text-zinc-200"}>Zor Mod:</strong> Bulduğun yeşil ve sarı harfleri sonraki tahminde kullanman gerekir.</span>
        </p>
        <p className="flex items-start gap-2">
          <Timer className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span><strong className={isLight ? "text-zinc-950" : "text-zinc-200"}>Süreli:</strong> Süre dolmadan kelimeyi çözmen gerekir.</span>
        </p>
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
          <span><strong className={isLight ? "text-zinc-950" : "text-zinc-200"}>Temalar:</strong> Pop-Art 🎨, Retro Arcade 🕹️, İznik Çini 🏺 ve eğlenceli tepkiler!</span>
        </p>
      </div>
    </aside>
  );
}
