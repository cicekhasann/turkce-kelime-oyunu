interface WordFilePayload {
  answers: string[];
  extra: string[];
}

export interface LoadedDictionary {
  answers: string[];
  allowedSet: Set<string>;
}

const cache = new Map<number, Promise<LoadedDictionary>>();

/**
 * Yalnızca istenen harf uzunluğuna (4-8) ait kelime veri setini yükler ve önbelleğe alır.
 */
export function loadWordList(length: number): Promise<LoadedDictionary> {
  const cached = cache.get(length);
  if (cached) return cached;

  const promise = (async () => {
    const res = await fetch(`/words/${length}.json`);
    if (!res.ok) {
      throw new Error(`${length} harfli sözlük yüklenemedi.`);
    }
    const data = (await res.json()) as WordFilePayload;
    const allowedSet = new Set<string>([...data.answers, ...data.extra]);
    return {
      answers: data.answers,
      allowedSet,
    };
  })();

  cache.set(length, promise);
  return promise;
}

/**
 * Verilen harf uzunluğu için çekirdek havuzdan rastgele bir Türkçe kelime seçer.
 */
export async function pickRandomWord(length: number): Promise<string> {
  const { answers } = await loadWordList(length);
  if (answers.length === 0) {
    throw new Error(`${length} harfli kelime havuzu boş.`);
  }
  const index = Math.floor(Math.random() * answers.length);
  return answers[index];
}

/**
 * Türkiye saat dilimine (Europe/Istanbul) göre YYYY-MM-DD tarih dizesi döndürür.
 */
export function getIstanbulDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function hashDateSeed(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Ek karıştırma (Avalanche)
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Günün tarihine göre deterministik olarak (herkes için aynı) 5 harfli Türkçe kelime seçer.
 */
export async function pickDailyWord(length = 5): Promise<{ word: string; dateStr: string }> {
  const { answers } = await loadWordList(length);
  if (answers.length === 0) {
    throw new Error("Günlük kelime havuzu boş.");
  }
  const dateStr = getIstanbulDateString();
  const seed = hashDateSeed(`kelimele-daily:${dateStr}`);
  const index = seed % answers.length;
  return {
    word: answers[index],
    dateStr,
  };
}
