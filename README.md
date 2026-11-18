# Kelimele — Türkçe Kelime Tahmin Oyunu

Arkadaş grubu içinde şifreli paylaşım linkleriyle oynanabilen, dinamik harf sayısına (4–8 harf) sahip, **tamamen sunucusuz (stateless)** Türkçe kelime tahmin oyunu (Wordle klonu).

🌐 **Canlı Demo:** [wordle.hasancicek.dev](https://wordle.hasancicek.dev)

## Özellikler

* **Tam Türkçe Alfabesi ve Kuralları:** `Ç, Ğ, İ, Ö, Ş, Ü` ve `I/ı` büyük-küçük harf dönüşümleri (`i -> İ`, `ı -> I`), NFC Unicode normalizasyonu ve yalnızca 29 Türkçe harfli sanal Q klavye.
* **Dinamik Harf Sayısı & Tahmin Hakkı:** 4'ten 8 harfe kadar özelleştirilebilir ızgara yapısı ve ayarlanabilir tahmin hakkı (4–10).
* **İki Aşamalı Değerlendirme Algoritması:** Çoklu harf kuralını tam uygular (hedefte tek olan harf tahminde iki kez yazılırsa yalnızca doğru/ilk hak renklenir, fazlası gri kalır).
* **Parçalanmış Yerel Türkçe Sözlük:** 4–8 harfli kelimeler uzunluklarına göre ayrı JSON dosyalarında tutulur; oyun başladığında yalnızca ilgili harf uzunluğunun sözlüğü yüklenir.
* **Sunucusuz Şifreli Oyun Linki:** Hedef kelime, hak sayısı, sözlük zorunluluğu, süre sınırı ve gizli kazanma mesajı URL parametresi (`?c=...`) içinde şifrelenerek taşınır; veritabanı gerektirmez.
* **Süre Sınırı & Gizli Mesaj:** İsteğe bağlı geri sayım sayacı ve oyunu kazanan arkadaşa özel gizli mesaj bırakma desteği.
* **Sonuç Paylaşımı:** Tahmin geçmişini `🟩 🟨 ⬛` emoji ızgarası olarak tek tıkla panoya kopyalama.

## Teknoloji Yığını

* **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons
* **Test:** Vitest
* **Dağıtım:** Multi-stage Docker (`node:22-alpine` → `nginx:1.27-alpine`)

## Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Birim testlerini çalıştır
npm test

# Üretim derlemesi al
npm run build
```

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. Kelime veri seti açık kaynak Türkçe kelime listesi (`mertemin/turkish-word-list`, MIT) temel alınarak uzunluklarına göre ayrıştırılmıştır.

