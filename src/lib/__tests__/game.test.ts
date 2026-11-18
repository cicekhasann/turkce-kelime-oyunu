import { describe, expect, it } from "vitest";
import { parseTurkishKey, sanitizeTurkishWord, toTurkishUpper } from "../turkish";
import {
  evaluateGuess,
  generateShareText,
  mergeKeyboardStates,
  validateHardModeGuess,
} from "../evaluator";
import { decodeGameConfig, encodeGameConfig } from "../cipher";

describe("Türkçe karakter normalizasyonu", () => {
  it("i ve ı harflerini Türkçe kurallarına göre büyütür", () => {
    expect(toTurkishUpper("istanbul")).toBe("İSTANBUL");
    expect(toTurkishUpper("ışık")).toBe("IŞIK");
    expect(toTurkishUpper("çiçek")).toBe("ÇİÇEK");
    expect(toTurkishUpper("şapkalı: kâğıt rüzgâr îman")).toBe("ŞAPKALI: KAĞIT RÜZGAR İMAN");
  });

  it("NFD birleşik karakterleri NFC'ye indirger ve uzunluğu korur", () => {
    const nfdIstanbul = "I\u0307stanbul";
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
    expect(evaluateGuess("ARABA", "KALEM")).toEqual([
      "present",
      "absent",
      "absent",
      "absent",
      "absent",
    ]);
  });

  it("tam eşleşme (yeşil) önceliklidir, fazladan önceki harfi sarı yapmaz", () => {
    expect(evaluateGuess("ADANA", "MASAL")).toEqual([
      "present",
      "absent",
      "present",
      "absent",
      "absent",
    ]);

    expect(evaluateGuess("İBİKİ", "KİTAP")).toEqual([
      "present",
      "absent",
      "absent",
      "present",
      "absent",
    ]);

    expect(evaluateGuess("İİKLM", "KİTAP")).toEqual([
      "absent",
      "correct",
      "present",
      "absent",
      "absent",
    ]);
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

  it("Zor Mod kuralını doğrular (yeşil konum ve sarı harf zorunluluğu)", () => {
    expect(validateHardModeGuess("SABİT", ["KABLO"], "KALEM")).toContain("1. harf 'K' olmalı");
    expect(validateHardModeGuess("KASAP", ["KABLO"], "KALEM")).toContain("'L' harfi bulunmalı");
    expect(validateHardModeGuess("KALEM", ["KABLO"], "KALEM")).toBeNull();
  });
});

describe("URL Şifreleme / Çözme", () => {
  it("Türkçe karakterli kelimeleri, hak sayısını, süreyi, modları ve gizli mesajı korur", () => {
    const config = {
      word: "GÖKYÜZÜ",
      maxAttempts: 8,
      strictDictionary: true,
      hideAnswerOnLoss: true,
      hardMode: true,
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
