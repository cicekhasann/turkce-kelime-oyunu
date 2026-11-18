import { evaluateGuess, type LetterState } from "./evaluator";

interface ShareCardOptions {
  wordLength: number;
  maxAttempts: number;
  guesses: string[];
  target: string;
  won: boolean;
  elapsedSec?: number;
  dailyDate?: string;
  hardMode?: boolean;
  funMode?: boolean;
}

const CLASSIC_TILE_COLORS: Record<LetterState, { fill: string; border: string }> = {
  correct: { fill: "#10b981", border: "#34d399" },
  present: { fill: "#f59e0b", border: "#fbbf24" },
  absent: { fill: "#27272a", border: "#3f3f46" },
  empty: { fill: "#18181b", border: "#27272a" },
};

const FUN_TILE_COLORS: Record<LetterState, { fill: string; border: string }> = {
  correct: { fill: "#10b981", border: "#34d399" },
  present: { fill: "#f59e0b", border: "#fbbf24" },
  absent: { fill: "#1e293b", border: "#334155" },
  empty: { fill: "#0f172a", border: "#1e293b" },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Spoiler'sız, yüksek çözünürlüklü PNG sonuç kartı üretir.
 */
export async function generateShareCardBlob(opts: ShareCardOptions): Promise<Blob> {
  const {
    wordLength,
    maxAttempts,
    guesses,
    target,
    won,
    elapsedSec,
    dailyDate,
    hardMode,
    funMode,
  } = opts;

  const tileSize = wordLength >= 7 ? 52 : 60;
  const gap = 10;
  const gridWidth = wordLength * tileSize + (wordLength - 1) * gap;
  const gridHeight = guesses.length * tileSize + Math.max(0, guesses.length - 1) * gap;

  const width = Math.max(540, gridWidth + 140);
  const height = 220 + gridHeight + 90;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor.");

  // Arka plan
  ctx.fillStyle = funMode ? "#060913" : "#0b0d13";
  ctx.fillRect(0, 0, width, height);

  // İç kart çerçevesi
  const cardPad = 24;
  drawRoundedRect(ctx, cardPad, cardPad, width - cardPad * 2, height - cardPad * 2, 24);
  ctx.fillStyle = funMode ? "#090d1c" : "#13161f";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = funMode ? "rgba(34, 211, 238, 0.4)" : "#27272a";
  ctx.stroke();

  // Başlık: KELİMELE
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(funMode ? "✨ KELİMELE" : "KELİMELE", width / 2, 78);

  // Alt başlık (Skor + Süre + Mod)
  const score = won ? `${guesses.length}/${maxAttempts}` : `X/${maxAttempts}`;
  const parts = [
    dailyDate ? `Günlük (${dailyDate})` : `${wordLength} Harf`,
    score,
    elapsedSec ? `${elapsedSec} sn` : null,
    hardMode ? "Zor Mod" : null,
  ].filter(Boolean);

  ctx.fillStyle = won ? (funMode ? "#22d3ee" : "#34d399") : "#fb7185";
  ctx.font = "600 18px ui-monospace, SFMono-Regular, monospace";
  ctx.fillText(parts.join("  •  "), width / 2, 112);

  // Spoiler'sız renkli kareler
  const startX = (width - gridWidth) / 2;
  const startY = 148;
  const paletteMap = funMode ? FUN_TILE_COLORS : CLASSIC_TILE_COLORS;

  guesses.forEach((guess, rIdx) => {
    const states = evaluateGuess(guess, target);
    states.forEach((state, cIdx) => {
      const x = startX + cIdx * (tileSize + gap);
      const y = startY + rIdx * (tileSize + gap);
      const palette = paletteMap[state];

      drawRoundedRect(ctx, x, y, tileSize, tileSize, funMode ? 14 : 10);
      ctx.fillStyle = palette.fill;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = palette.border;
      ctx.stroke();
    });
  });

  // Alt bilgi (Site adresi)
  ctx.fillStyle = "#71717a";
  ctx.font = "500 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("wordle.hasancicek.dev", width / 2, height - 48);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Görsel oluşturulamadı."));
    }, "image/png");
  });
}

