export interface TdkEntry {
  meanings: string[];
  origin?: string;
}

interface TdkRawResponseItem {
  lisan?: string;
  anlamlarListe?: Array<{ anlam?: string }>;
}

const tdkCache = new Map<string, TdkEntry | null>();

/**
 * Kelimenin TDK Güncel Türkçe Sözlük anlamlarını yerel proxy üzerinden çeker.
 */
export async function fetchTdkMeaning(word: string): Promise<TdkEntry | null> {
  const lower = word.toLocaleLowerCase("tr-TR");
  if (tdkCache.has(lower)) {
    return tdkCache.get(lower) ?? null;
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`/api/tdk?ara=${encodeURIComponent(lower)}`, {
      signal: controller.signal,
    });
    window.clearTimeout(timer);

    if (!res.ok) {
      tdkCache.set(lower, null);
      return null;
    }

    const data = (await res.json()) as TdkRawResponseItem[] | { error?: string };
    if (!Array.isArray(data) || data.length === 0) {
      tdkCache.set(lower, null);
      return null;
    }

    const first = data[0];
    const meanings = (first.anlamlarListe ?? [])
      .map((item) => item.anlam?.trim())
      .filter((a): a is string => Boolean(a))
      .slice(0, 2);

    if (meanings.length === 0) {
      tdkCache.set(lower, null);
      return null;
    }

    const entry: TdkEntry = {
      meanings,
      origin: first.lisan?.trim() || undefined,
    };
    tdkCache.set(lower, entry);
    return entry;
  } catch {
    tdkCache.set(lower, null);
    return null;
  }
}

