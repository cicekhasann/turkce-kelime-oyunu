import { CalendarDays, HelpCircle, PlusCircle, Sparkles } from "lucide-react";
import { THEMES, type ThemeMode } from "../lib/theme";

interface HeaderProps {
  onOpenSetup?: () => void;
  onOpenDaily?: () => void;
  onOpenHelp: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
  subtitle?: string;
  isDaily?: boolean;
}

export function Header({
  onOpenSetup,
  onOpenDaily,
  onOpenHelp,
  theme,
  onCycleTheme,
  subtitle,
  isDaily = false,
}: HeaderProps) {
  const meta = THEMES[theme];
  const isLight = meta.isLight;

  return (
    <header
      className={`w-full shrink-0 border-b backdrop-blur-md transition-colors duration-300 ${meta.headerClass}`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold shadow-sm transition-all ${
              theme === "pop"
                ? "border-2 border-zinc-950 bg-[#facc15] text-zinc-950 shadow-[2px_2px_0_#09090b]"
                : theme === "arcade"
                  ? "rounded-xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(34,211,238,0.45)]"
                  : theme === "iznik"
                    ? "border border-amber-300/60 bg-gradient-to-br from-cyan-400 to-amber-400 text-zinc-950"
                    : "bg-emerald-500 text-zinc-950"
            }`}
          >
            K
          </div>
          <div>
            <h1 className={`text-base font-bold tracking-tight leading-none ${isLight ? "text-zinc-950" : "text-zinc-100"}`}>
              Kelimele
            </h1>
            {subtitle && (
              <p className={`mt-0.5 text-[11px] font-medium leading-none ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onCycleTheme}
            title="Tema değiştir (Klasik → Pop-Art → Arcade → İznik)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              theme === "pop"
                ? "border-2 border-zinc-950 bg-[#facc15] text-zinc-950 shadow-[2px_2px_0_#09090b] hover:bg-[#fde047]"
                : theme === "arcade"
                  ? "border-fuchsia-400/80 bg-gradient-to-r from-fuchsia-500/30 via-purple-500/25 to-cyan-500/30 text-white shadow-[0_0_14px_rgba(217,70,239,0.4)]"
                  : theme === "iznik"
                    ? "border-amber-400/60 bg-cyan-500/20 text-amber-100 hover:bg-cyan-500/30"
                    : "border-zinc-700/80 bg-zinc-800/70 text-zinc-200 hover:border-cyan-400/50 hover:text-cyan-200"
            }`}
          >
            {theme === "classic" ? (
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            ) : (
              <span>{meta.emoji}</span>
            )}
            <span className="hidden sm:inline">
              {theme === "classic" ? "Tema: Klasik" : meta.shortLabel}
            </span>
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
