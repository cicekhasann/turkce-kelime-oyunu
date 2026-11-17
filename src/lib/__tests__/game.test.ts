import { describe, expect, it } from "vitest";
import { parseTurkishKey, sanitizeTurkishWord, toTurkishUpper } from "../turkish";
import { evaluateGuess, generateShareText, mergeKeyboardStates } from "../evaluator";
import { decodeGameConfig, encodeGameConfig } from "../cipher";

describe("Türkçe karakter normalizasyonu", () => {
  it("i ve ı harflerini Türkçe kurallarına göre büyütür", () => {
    expect(toTurkishUpper("istanbul")).toBe("İSTANBUL");
    expect(toTurkishUpper("ışık")).toBe("IŞIK");
    expect(toTurkishUpper("çiçek")).toBe("ÇİÇEK");
    expect(toTurkishUpper("şapkalı: kâğıt rüzgâr îman")).toBe("ŞAPKALI: KAĞIT RÜZGAR İMAN");
  });

  it("NFD birleşik karakterleri NFC'ye indirger ve uzunluğu korur", () => {
    const nfdIstanbul = "I\u0307stanbul"; // I + combining dot above
    const clean = sanitizeTurkishWord(nfdIstanbul);
    expect(clean).toBe("İSTANBUL");
    expect(Array.from(clean).length).toBe(8);
  });

  it("Q, W, X ve rakam/sembolleri filtreler", () => {
    expect(sanitizeTurkishWord("qwxabc123çğ!ıi")).toBe("ABCÇĞIİ");
    expect(parseTurkishKey("q")).toBeNull();
    expect(parseTurkishKey("w")).toBeNull();
    expect(parseTurkishKey("x")).toBeNull();
    expect(parseTurkishKey("i")).toBe("İ");
    expect(parseTurkishKey("ı")).toBe("I");
    expect(parseTurkishKey("ğ")).toBe("Ğ");
  });
});

describe("İki aşamalı harf değerlendirme (Çoklu harf kuralı)", () => {
  it("hedefte 1 tane olan harf tahminde 2 kez geçerse sadece 1'ini işaretler", () => {
    // Hedef: KALEM (1 adet A, 1 adet L)
    // Tahmin: ARABA (3 adet A: 1. yanlış yerde, diğer ikisi gri olmalı)
    expect(evaluateGuess("ARABA", "KALEM")).toEqual([
      "present", // A (hedefte 2. sırada var)
      "absent",  // R
      "absent",  // A (ikinci A gri!)
      "absent",  // B
      "absent",  // A (üçüncü A gri!)
    ]);
  });

  it("tam eşleşme (yeşil) önceliklidir, fazladan önceki harfi sarı yapmaz", () => {
    // Hedef: KASAS (A harfi sadece 2. sırada var; K-A-S-A-S değil: 1 tane E olsun -> KALEM vs SALAL)
    // Hedef: MASAL (2 adet A: 2. ve 4. sırada)
    // Tahmin: ADANA (3 adet A: 1. yanlış konum, 3. yanlış konum, 5. gri)
    expect(evaluateGuess("ADANA", "MASAL")).toEqual([
      "present",
      "absent",
      "present",
      "absent",
      "absent",
    ]);

    // Hedef: KİTAP (1 adet İ: 2. sırada)
    // Tahmin: İKİLİ (2 adet İ: 1. sırada yanlış, 3. sırada yanlış -> 1. sarı, 3. gri; ayrıca 1. yanlış K? Hayır)
    expect(evaluateGuess("İBİKİ", "KİTAP")).toEqual([
      "present", // İ (hedefte 2. sırada var)
      "absent",  // B
      "absent",  // İ (fazla İ -> gri)
      "present", // K (hedefte 1. sırada var)
      "absent",  // İ (fazla İ -> gri)
    ]);

    // Eğer ikinci İ tam yerinde olsaydı (2. konumda): ilk İ gri, ikinci İ yeşil!
    expect(evaluateGuess("İİKLM", "KİTAP")).toEqual([
      "absent",  // 1. İ gri çünkü tek İ 2. konumda tam eşleşti
      "correct", // 2. İ yeşil
      "absent",  // K (hedefte 1. konumda var! -> present!)
      "absent",  // L
      "absent",  // M
    ].map((s, i) => (i === 2 ? "present" : s)));
  });

  it("klavye renk önceliğini Yeşil > Sarı > Gri olarak birleştirir", () => {
    const keys = mergeKeyboardStates(["KABLO", "KALEM"], "KALEM");
    expect(keys["K"]).toBe("correct");
    expect(keys["A"]).toBe("correct");
    expect(keys["L"]).toBe("correct");
    expect(keys["B"]).toBe("absent");
    expect(keys["O"]).toBe("absent");
  });

  it("emoji paylaşım metnini doğru üretir", () => {
    const txt = generateShareText({
      wordLength: 5,
      maxAttempts: 6,
      guesses: ["KABLO", "KALEM"],
      target: "KALEM",
      won: true,
    });
    expect(txt).toContain("Kelimele (5 Harf) 2/6");
    expect(txt).toContain("🟩🟩⬛🟨⬛");
    expect(txt).toContain("🟩🟩🟩🟩🟩");
  });
});

describe("URL Şifreleme / Çözme", () => {
  it("Türkçe karakterli kelimeleri, hak sayısını, süreyi, gizli mesajı ve sözlük ayarını korur", () => {
    const config = {
      word: "GÖKYÜZÜ",
      maxAttempts: 8,
      strictDictionary: true,
      timeLimitSec: 120,
      winMessage: "Bunu bildiysen kahve benden!",
    };
    const token = encodeGameConfig(config);
    expect(token).not.toContain("GÖKYÜZÜ");
    expect(token).not.toContain("kahve");

    const decoded = decodeGameConfig(token);
    expect(decoded).toEqual(config);
  });

  it("bozuk veya kırpılmış token için null döner", () => {
    const token = encodeGameConfig({
      word: "ÇİÇEK",
      maxAttempts: 6,
      strictDictionary: false,
      timeLimitSec: 0,
    });
    expect(decodeGameConfig(token.slice(0, -1))).toBeNull();
    expect(decodeGameConfig("gecersiz-token")).toBeNull();
  });
});
