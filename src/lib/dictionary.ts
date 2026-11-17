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

