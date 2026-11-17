import { X } from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#13161f] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Nasıl Oynanır?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
          <p>
            Gizli Türkçe kelimeyi verilen tahmin hakkı içinde bulmaya çalış. Her
            tahminden sonra kutucukların rengi, harflerin doğruluğuna göre değişir:
          </p>

          <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-bold text-white">
                K
              </span>
              <span>
                <strong className="text-emerald-400">Yeşil:</strong> Harf kelimede
                var ve tam doğru konumda.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500 font-bold text-zinc-950">
                A
              </span>
              <span>
                <strong className="text-amber-400">Sarı:</strong> Harf kelimede
                var ama yanlış konumda.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 font-bold text-zinc-300">
                Z
              </span>
              <span>
                <strong className="text-zinc-400">Gri:</strong> Harf kelimede hiç
                yok (veya o harfin tüm hakları zaten eşleşti).
              </span>
            </div>
          </div>

          <p className="text-zinc-400">
            <strong>Çoklu Harf Kuralı:</strong> Hedef kelimede bir harf tek kez
            geçiyorsa ve tahmininde iki kez yazdıysan, yalnızca eşleşen harf
            renklenir; fazladan olan gri kalır.
          </p>
        </div>
      </div>
    </div>
  );
}

