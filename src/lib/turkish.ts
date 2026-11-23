/**
 * 29 harfli standart Türk alfabesi (Q, W, X hariç).
 */
export const TR_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

const TR_CHAR_SET = new Set(Array.from(TR_ALPHABET));

const CIRCUMFLEX_MAP: Record<string, string> = {
  â: "A",
  Â: "A",
  î: "İ",
  Î: "İ",
  û: "U",
  Û: "U",
};

/**
 * Verilen metni NFC olarak normalize eder, şapkalı harfleri (â, î, û) dönüştürür,
 * Türkçe kurallarına göre (i -> İ, ı -> I) büyük harfe çevirir.
 */
export function toTurkishUpper(input: string): string {
  const nfc = input.normalize("NFC");
  let mapped = "";
  for (const ch of nfc) {
    if (ch in CIRCUMFLEX_MAP) {
      mapped += CIRCUMFLEX_MAP[ch];
    } else if (ch === "i") {
      mapped += "İ";
    } else if (ch === "ı") {
      mapped += "I";
    } else {
      mapped += ch.toLocaleUpperCase("tr-TR");
    }
  }
  return mapped;
}

/**
 * Yalnızca 29 Türkçe büyük harften oluşan temiz bir dize döndürür.
 */
export function sanitizeTurkishWord(input: string): string {
  const upper = toTurkishUpper(input);
  let out = "";
  for (const ch of upper) {
    if (TR_CHAR_SET.has(ch)) {
      out += ch;
    }
  }
  return out;
}

/**
 * Tek bir karakterin geçerli bir Türkçe alfabe harfi olup olmadığını kontrol eder.
 * Geçerliyse normalize edilmiş büyük harfi, değilse null döndürür.
 */
export function parseTurkishKey(key: string): string | null {
  if (!key || key.length > 2) {
    // Bazı tarayıcı IME'leri birleşik karakter gönderebilir; NFC sonrası 1 karakter olmalı
    const nfc = key.normalize("NFC");
    if (Array.from(nfc).length !== 1) return null;
  }
  const upper = toTurkishUpper(key);
  const chars = Array.from(upper);
  if (chars.length === 1 && TR_CHAR_SET.has(chars[0])) {
    return chars[0];
  }
  return null;
}

/**
 * Yalnızca Türkçe Q klavye düzeni (Q, W, X hariç 29 harf + ENTER + BACKSPACE).
 */
export const TR_KEYBOARD_ROWS: readonly (readonly string[])[] = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "BACKSPACE"],
] as const;

export const MIN_WORD_LENGTH = 4;
export const MAX_WORD_LENGTH = 8;
export const MIN_ATTEMPTS = 4;
export const MAX_ATTEMPTS = 10;

/**
 * Saniye cinsinden süreyi okunaklı Türkçe biçime çevirir (örn. 120 -> "2 dk", 135 -> "2 dk 15 sn", 27 -> "27 sn").
 */
export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  if (clamped < 60) return `${clamped} sn`;
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return secs === 0 ? `${mins} dk` : `${mins} dk ${secs} sn`;
}

