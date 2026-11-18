import {
  MAX_ATTEMPTS,
  MAX_WORD_LENGTH,
  MIN_ATTEMPTS,
  MIN_WORD_LENGTH,
  sanitizeTurkishWord,
} from "./turkish";

export interface GameConfig {
  word: string;
  maxAttempts: number;
  strictDictionary: boolean;
  timeLimitSec: number; // 0 = süresiz, > 0 = saniye cinsinden geri sayım
  winMessage?: string;
  hideAnswerOnLoss?: boolean;
}

const STREAM_KEY = new Uint8Array([
  0x5a, 0x91, 0x3c, 0xe7, 0x18, 0xa4, 0x6f, 0x2d,
  0xc3, 0x7b, 0x0e, 0x85, 0x49, 0xd2, 0xb6, 0x11,
]);

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    const padded =
      str.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((str.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function computeChecksum(data: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) & 0xffff;
}

/**
 * Oyun ayarlarını (kelime, hak, sözlük, süre sınırı ve kazanma mesajı)
 * kompakt byte dizisine paketler, şifreler ve Base64URL token döndürür.
 */
export function encodeGameConfig(config: GameConfig): string {
  const cleanWord = sanitizeTurkishWord(config.word);
  const wordBytes = new TextEncoder().encode(cleanWord);
  const attempts = Math.min(MAX_ATTEMPTS, Math.max(MIN_ATTEMPTS, config.maxAttempts));
  const flags =
    (attempts & 0x0f) |
    (config.strictDictionary ? 0x10 : 0x00) |
    (config.hideAnswerOnLoss ? 0x20 : 0x00);

  const timeLimitSec = Math.max(0, Math.min(3600, Math.round(config.timeLimitSec || 0)));
  const trimmedMsg = (config.winMessage ?? "").trim().slice(0, 140);
  const msgBytes = new TextEncoder().encode(trimmedMsg);

  const nonce = Math.floor(Math.random() * 256);

  // v2 Payload: [version(1)=0x02, flags(1), timeHi(1), timeLo(1), wordLenBytes(1), ...wordBytes, ...msgBytes]
  const payload = new Uint8Array(5 + wordBytes.length + msgBytes.length);
  payload[0] = 0x02;
  payload[1] = flags;
  payload[2] = (timeLimitSec >> 8) & 0xff;
  payload[3] = timeLimitSec & 0xff;
  payload[4] = wordBytes.length & 0xff;
  payload.set(wordBytes, 5);
  payload.set(msgBytes, 5 + wordBytes.length);

  const checksum = computeChecksum(payload);

  const plainWithCheck = new Uint8Array(payload.length + 2);
  plainWithCheck.set(payload, 0);
  plainWithCheck[payload.length] = (checksum >> 8) & 0xff;
  plainWithCheck[payload.length + 1] = checksum & 0xff;

  const output = new Uint8Array(1 + plainWithCheck.length);
  output[0] = nonce;
  for (let i = 0; i < plainWithCheck.length; i++) {
    const keyByte =
      STREAM_KEY[(i + nonce) % STREAM_KEY.length] ^ ((nonce * 31 + i * 17) & 0xff);
    output[i + 1] = plainWithCheck[i] ^ keyByte;
  }

  return toBase64Url(output);
}

/**
 * URL token'ını çözer, bütünlük kontrolünü doğrular ve geçersizse null döndürür.
 */
export function decodeGameConfig(token: string): GameConfig | null {
  if (!token || token.length < 6) return null;
  const raw = fromBase64Url(token.trim());
  if (!raw || raw.length < 7) return null;

  const nonce = raw[0];
  const encrypted = raw.slice(1);
  const plain = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    const keyByte =
      STREAM_KEY[(i + nonce) % STREAM_KEY.length] ^ ((nonce * 31 + i * 17) & 0xff);
    plain[i] = encrypted[i] ^ keyByte;
  }

  const payload = plain.slice(0, plain.length - 2);
  const expectedHi = plain[plain.length - 2];
  const expectedLo = plain[plain.length - 1];
  const actualChecksum = computeChecksum(payload);

  if (
    ((actualChecksum >> 8) & 0xff) !== expectedHi ||
    (actualChecksum & 0xff) !== expectedLo
  ) {
    return null;
  }

  const version = payload[0];
  if (version !== 0x01 && version !== 0x02) return null;

  const flags = payload[1];
  const maxAttempts = flags & 0x0f;
  const strictDictionary = (flags & 0x10) !== 0;
  const hideAnswerOnLoss = (flags & 0x20) !== 0;

  let timeLimitSec = 0;
  let wordBytes: Uint8Array;
  let winMessage: string | undefined;

  if (version === 0x01) {
    wordBytes = payload.slice(2);
  } else {
    if (payload.length < 6) return null;
    timeLimitSec = (payload[2] << 8) | payload[3];
    const wordByteLen = payload[4];
    if (5 + wordByteLen > payload.length) return null;
    wordBytes = payload.slice(5, 5 + wordByteLen);
    const msgBytes = payload.slice(5 + wordByteLen);
    if (msgBytes.length > 0) {
      try {
        winMessage = new TextDecoder("utf-8", { fatal: true }).decode(msgBytes);
      } catch {
        return null;
      }
    }
  }

  let decodedWord = "";
  try {
    decodedWord = new TextDecoder("utf-8", { fatal: true }).decode(wordBytes);
  } catch {
    return null;
  }

  const cleanWord = sanitizeTurkishWord(decodedWord);
  const charLen = Array.from(cleanWord).length;
  if (
    cleanWord !== decodedWord ||
    charLen < MIN_WORD_LENGTH ||
    charLen > MAX_WORD_LENGTH ||
    maxAttempts < MIN_ATTEMPTS ||
    maxAttempts > MAX_ATTEMPTS
  ) {
    return null;
  }

  return {
    word: cleanWord,
    maxAttempts,
    strictDictionary,
    timeLimitSec,
    ...(hideAnswerOnLoss ? { hideAnswerOnLoss: true } : {}),
    ...(winMessage ? { winMessage } : {}),
  };
}
