# VITRIX — audit bo‘yicha o‘zgarishlar

2026-11-07. Asos: taqdim etilgan Growth System auditidagi A01–A20 va Brand & Marketing v1.0. Bu hujjat koddagi tuzatishlarni, tekshiruvlarni va productionda tekshiriladigan chegaralarni ajratadi. «Hech qanday kelajakdagi bug bo‘lmaydi» kafolati berilmaydi.

| Band | Tuzatish | Tekshiruv |
|---|---|---|
| A01 | Next API proxy Accept-Language’ni o‘tkazadi. Panel API tili preview tilidan mustaqil. | Proxy header testi; Django xati va detail RU/EN; live proxy smoke. |
| A02 | HMAC kalitli DB RateBucket: hisob va IP bo‘yicha login/OTP cheklovi; Django admin login ham qamralgan. Cookie almashtirish cheklovni bekor qilmaydi. XFF standartda ishonchsiz. | Yangi Client, soxta XFF, ikki mustaqil jarayon, admin yo‘li testlari. |
| A03 | Login/register/reset/profile turlari va uzunligi tekshiriladi. null/list/dict/number parolga 400 qaytadi. API body 12 MiB bilan chegaralangan. | Malformed-input matritsasi. |
| A04 | Hodisalar ro‘yxati o‘rniga serverda kun/tur bo‘yicha agregatlar. CSV iterator bilan to‘liq davrni chiqaradi. | 20 001 hodisa, oxirgi telegram hodisasi va CSV qatorlari. |
| A05 | Business/Product/Category/Plan/Platform revision; eski yoki versiyasiz yozuvga 409, butun batch rollback. Frontend faqat o‘zgargan maydonlarni yuboradi. | Ikki eskirgan nusxa testi; source revision testi; live proxy smoke. |
| A06 | SQLite IMMEDIATE + timeout 20 s; qisqa atomik yozishlar. OTP faqat bir marta ishlatiladi, subscription idempotency saqlangan. | Vaqtinchalik faylli SQLite’da ikki jarayon: limiter, OTP, activation va quota. |
| A07 | Email yuborish xatosida faqat o‘sha urinishning digest’i o‘chadi. | Ustma-ust yuborish simulyatsiyasi yangi kodni saqlaydi. |
| A08 | Public biznes DTO allowlist; owner/email/account/plan/expiry/revision chiqarilmaydi. | Public payload maxfiy maydonlar testi. |
| A09 | Boshlang‘ich snapshot 50 yozuv; public 24 mahsulot. Server pagination/search, kabinet listlarida server pager, maksimum sahifa 100. PATCH kompakt acknowledgement; keyingi metadata yangilanishi yozuvlarni qayta yuklamaydi. Client cache 200 yozuvgacha. | 125 mahsulotda oxirgi sahifa, tenant filtri, yirik sahifa offseti, summary DTO testi. |
| A10 | UUID media immutable cache; Next media proxy; bir konteynerda Nginx media worker. API no-store. | Next media yo‘li va cache kontrakti; Nginx image ishga tushishi real deployda tekshiriladi. |
| A11 | JPG/PNG/WebP format allowlist; 2 MB/25 MP limit; EXIF yo‘qotilgan WebP va 1600px nusxa; rollback fayllari o‘chadi; eski orphan fayllarni dry-run cleanup. | Metadata/resize, transaction rollback va shared-reference saqlanishi. |
| A12 | auth_user uchun lowercase username/email DB unique index, bo‘sh email istisno. Dublikat bo‘lsa migratsiya hisoblarni o‘zgartirmasdan to‘xtaydi. | DB IntegrityError testi; audit_identities preflight. |
| A13 | Asia/Tashkent kun chegarasi, locale hafta kuni; qolgan status/loading matnlari tarjima qilindi. Mobil tildan foydalanish tiklandi. | UTC/Toshkent yarim tun testi; brauzer UZ/RU/EN. |
| A14 | Umumiy emas, davrdagi tashriflar va davr kunlari. Public holati active + expiry; admin count ham expiry/ownerActive’ni hisobga oladi. | Expired public sayt testi va UI davr yozuvi. |
| A15 | Bosilishlar/tashriflar alohida ko‘rsatkich. Bu xarid yoki tasdiqlangan mijoz konversiyasi deyilmaydi. | Marketing va analytics matnlari qayta ko‘rib chiqildi. |
| A16 | Contact form faqat email ilovasida tayyor xabar ochilishini aytadi; yetkazilgan ariza deb ko‘rsatmaydi. | Formada «Xabaringiz tayyor», mailto ochish izohi. |
| A17 | showPrices=false bo‘lsa public JSON’da ham price/oldPrice yo‘q. showContacts/showLocation ham public ma’lumotni cheklaydi. | Public payload testi. |
| A18 | Serverda saqlangan design versiyalari, revision bilan tiklash. Mahsulot, kontakt, owner va obuna tiklashga kirmaydi. | Saqlashdan keyingi restore va boshqa tenant versiyasini rad etish. |
| A19 | requirements.lock va pnpm lock; CI test/build/migration/secret/dependency audit; Dependabot. Next 16.4.5, React 19.3.1, Zod 4.6.7, Pillow 13.0.0 va patched transitivlar. | pip-audit va pnpm audit’da ma’lum zaiflik topilmadi; kod secret scan. |
| A20 | /slug/p/product URL, locale metadata/canonical/hreflang, paginated sitemap index, robots, biznes slug tarixi va redirect. | Public product allowlist, eski slug redirect; production HTTP smoke va build. |

## Live tekshiruvda topilgan qo‘shimcha xato

Username ichidagi `_` avtomatik sayt slugiga o‘tib, keyingi business save validatsiyasini buzgan. `ensure_business` endi takroriy ajratkichlarni ham normallashtiradi va get_or_create bilan bir martalik yaratiladi. 0010 migratsiya legacy sluglarni tuzatadi va eski URLni redirect orqali saqlaydi. Regression va migration rehearsal qo‘shilgan.

## Operatsion ishlar

- Django/Gmail HTTPS backend saqlangan; SMTP majburiy emas. Real Gmail tokenlari bu paketga qo‘shilmagan. Xat yetib kelishini o‘z Railway muhitingizda tekshiring.
- backup_sqlite SQLite online backup API’dan foydalanadi, media va SHA256 manifest yaratadi. verify_backup hash/integrity tekshiradi; alohida nusxada app health qayta ochildi.
- cleanup_data avval dry-run, keyin --apply. Events 100 kun saqlanadi (eng katta analytics davri 90 kun), expired buckets/kodlar tozalanadi. Avtomatik tashqi scheduler bu paket orqali ishga tushirilmagan.
- Request ID va status/duration loglari bor; parol, OTP, token va request body loglanmaydi.
- Yangi katalog sahifalari, categories/users/businesses va activation history serverda sahifalanadi. Mahsulot/kategoriya cache’i authoritative baza emas.

## Qolgan production tekshiruvlari

Docker/Nginx image ishga tushishi, real TLS/ingress, Gmail yetkazilishi va haqiqiy trafikdagi p95/RAM ushbu mahalliy testlarning o‘rnini bosmaydi. Bir service/SQLite uchun bir Gunicorn worker va to‘rtta thread standart. Katta trafikni ochishdan avval server hajmida yuklama sinovi o‘tkazing. IP header ishonchi faqat ingress X-Forwarded-For’ni almashtirishi tekshirilgach yoqiladi; hisob limiteri bunisiz ham ishlaydi. Fizik telefon/planshet o‘rniga brauzerda 390/768/1366px viewport tekshirildi.
