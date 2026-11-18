import { CalendarDays, HelpCircle, PlusCircle, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenSetup?: () => void;
  onOpenDaily?: () => void;
  onOpenHelp: () => void;
  funMode: boolean;
  onToggleFunMode: () => void;
  subtitle?: string;
  isDaily?: boolean;
}

export function Header({
  onOpenSetup,
  onOpenDaily,
  onOpenHelp,
  funMode,
  onToggleFunMode,
  subtitle,
  isDaily = false,
}: HeaderProps) {
  return (
    <header
      className={`w-full border-b backdrop-blur-md transition-colors duration-300 ${
        funMode
          ? "border-purple-500/30 bg-[#140b2e]/90"
          : "border-zinc-800/80 bg-[#0e1015]/90"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold shadow-sm transition-all ${
              funMode
                ? "rounded-xl bg-gradient-to-br from-fuchsia-500 to-emerald-400 text-zinc-950 shadow-[0_0_14px_rgba(217,70,239,0.5)]"
                : "bg-emerald-500 text-zinc-950"
            }`}
          >
            K
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-100 leading-none">
              Kelimele
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-[11px] font-medium text-zinc-400 leading-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleFunMode}
            title="Görünüm Modunu Değiştir (Klasik / Fun)"
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition cursor-pointer ${
              funMode
                ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.25)]"
                : "border-zinc-700/80 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/80"
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${funMode ? "text-fuchsia-300" : "text-zinc-400"}`} />
            <span className="hidden sm:inline">{funMode ? "Fun Mod" : "Klasik"}</span>
          </button>

          {!isDaily && onOpenDaily && (
            <button
              type="button"
              onClick={onOpenDaily}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20 cursor-pointer"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Günün Kelimesi</span>
              <span className="sm:hidden">Günlük</span>
            </button>
          )}
          {onOpenSetup && (
            <button
              type="button"
              onClick={onOpenSetup}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/70 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700/80 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden xs:inline sm:inline">Yeni Oyun</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="Nasıl Oynanır?"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
