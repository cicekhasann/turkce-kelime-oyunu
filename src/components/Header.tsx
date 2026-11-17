import { HelpCircle, PlusCircle } from "lucide-react";

interface HeaderProps {
  onOpenSetup?: () => void;
  onOpenHelp: () => void;
  subtitle?: string;
}

export function Header({ onOpenSetup, onOpenHelp, subtitle }: HeaderProps) {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#0e1015]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-zinc-950 shadow-sm">
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

        <div className="flex items-center gap-2">
          {onOpenSetup && (
            <button
              type="button"
              onClick={onOpenSetup}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/70 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700/80 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Yeni Oyun</span>
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

