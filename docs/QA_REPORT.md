# VITRIX — yakuniy QA

2026-11-07. Kod bazasi: oldingi VITRIX_MVP v4, audit A01–A20 va Digital Clarity brend hujjatlari asosida yangilandi.

| Tekshiruv | Natija |
|---|---|
| Django regression testlari | 82/82 o‘tdi |
| Frontend/domain/proxy/SSR testlari | 24/24 o‘tdi |
| Next.js 16.4.5 production build | O‘tdi |
| TypeScript noEmit | 0 xato |
| ESLint, src/app/tests | 0 xato, 0 ogohlantirish |
| Django migration drift | No changes detected |
| Python dependency audit | Ma’lum zaiflik topilmadi |
| Node production dependency audit | Ma’lum zaiflik topilmadi |
| Source credential pattern scan | Topilmadi |
| Bash startup sintaksisi | O‘tdi |

## Qo‘shimcha tekshiruvlar

- **Faylli SQLite, ikki mustaqil jarayon:** limiter 80 urinishdan aynan 50tasini qabul qildi; OTP bir marta ishlatildi; bir idempotencyKey bilan obuna ikki marta uzaymadi; bitta mahsulot kvotasida parallel ikki yozuvdan bittasi qabul qilindi.
- **20 001 hodisa:** oxirgi Telegram hodisasi agregatda bor; CSV 20 001 hodisa + header qaytardi.
- **Backup/restore:** SQLite online backup, media daraxti va hash manifest, integrity tekshiruvi; alohida tiklangan nusxada /health/ 200.
- **Eski sxemadan migratsiya:** 0007 sxemasiga hisob, parol hash’i, mahsulot, rang/uslub, trial va VIP muddati yozildi. 0008–0010ga yangilangach ular saqlandi; legacy underscore slug tuzatilib, redirect qo‘shildi; narxlar 49 000 / 99 000 qoldi.
- **Live Next → Django:** haqiqiy lokal production Next server, Django va alohida SQLite bilan health, CSRF/cookie, EN/RU xabari, test fayliga yuborilgan email kodi, register, login sessiyasi, auth-only plans, revision/409, pager, public DTO, qayta kodlangan WebP/media cache, analitika, alohida product URL, hreflang va sitemap o‘tdi. `scripts/run-local-smoke.sh` buni qayta ishga tushiradi.
- **Brauzer:** 390/768/1366px frame viewportlarda home va katalog; gorizontal overflow yo‘q; uchta namuna mahsulot ko‘rindi. UZ/RU/EN, mobil menyu, til tanlash va yangi brending tekshirildi. Bu fizik qurilma sinovi emas.

## Muhim chegaralar

Haqiqiy Railway xizmatiga bu ish doirasida deploy qilinmadi. Docker/Nginx image build/launch, production TLS/ingress, real Gmail yetkazilishi va haqiqiy trafikdagi p95/RAM hali shu muhitda tekshirilmagan. Live email testi lokal file backend orqali bajarildi, hech kimga real xat yuborilmadi. Hosted Vinext preview faqat dizayn QA uchun ishlatildi; haqiqiy auth/ma’lumot oqimi alohida Next+Django production smoke’da tekshirildi.

Kutubxona auditi — audit bajarilgan paytdagi ma’lum advisorylar tekshiruvi, to‘liq penetration test emas. CI va Dependabot kelgusi regressiya/yangilanishlarni kuzatishga yordam beradi. Productiondan oldin `START_HERE_UZ.md` bo‘yicha backup va post-deploy smoke bajaring.
