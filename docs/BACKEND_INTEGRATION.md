# VITRIX — ishlaydigan backend kontrakti

Frontend endi lokal database’ni saqlamaydi. Brauzer localStorage faqat til va rang rejimiga ishlatiladi. Hisob, parol, session roli, mahsulot, kategoriya va obunalar server manbadan olinadi.

## Endpointlar

Baza: `/api/v1`. Frontend Next proxy orqali Django’ga murojaat qiladi.

| HTTP | Endpoint | Ruxsat |
| --- | --- | --- |
| GET | `/auth/csrf/` | CSRF token va cookie |
| POST | `/auth/request-code/` | Email + register/reset maqsadi |
| POST | `/auth/register/` | Maydonlar + 6 xonali kod |
| POST | `/auth/login/` | Username/email, password, remember |
| POST | `/auth/logout/` | Session tugatish |
| GET | `/auth/me/` | Joriy autentifikatsiya |
| PATCH | `/auth/profile/` | Ism/familiya/telefon |
| POST | `/auth/reset-password/` | Email + kod + yangi parol |
| GET/PATCH | `/workspace/` | Autentifikatsiya va tenant ruxsatlari |
| GET | `/health/` | Database/readiness |
| POST | `/subscriptions/telegram/` | Owner; planId → Telegram draft URL; pending request |
| POST | `/admin/businesses/:id/subscription/` | Superadmin; audited activation + UUID idempotencyKey |
| GET | `/plans/` | Faqat autentifikatsiya qilingan hisob |
| GET | `/public/config/` | Public brend/kontaktlar; plans bo‘sh |
| GET | `/public/businesses/:slug/` | Login talab qilmaydi |
| POST | `/public/businesses/:slug/events/` | Visit/phone/telegram; CSRF bilan |
| POST | `/subscriptions/request/` | Faqat o‘z biznesi uchun Pro/VIP arizasi |
| POST | `/admin/subscriptions/:id/review/` | Faqat superadmin; approve true/false |
| GET | `/admin/users/` | Faqat superadmin |
| PATCH/DELETE | `/admin/users/:id/` | Faqat superadmin; o‘z hisobini o‘chira olmaydi |

## Workspace CRUD

`GET /workspace/` `Database` kontraktini qaytaradi: users, businesses, categories, products, plans, events, activities, subscriptionRequests, platform. Owner faqat o‘z biznesini ko‘radi; admin barcha bizneslarni ko‘radi. Analytics tarixlari tarif bo‘yicha serverda filtrlanadi.

Saqlash:

```json
{"changes":[{"entity":"products","op":"upsert","record":{"id":"new-uuid","businessId":"own-business-id","name":"Mahsulot","slug":"mahsulot","price":20000,"oldPrice":0,"categoryId":"","image":"","images":[],"status":"published","availability":"available","order":0,"featured":false,"description":"","shortDescription":""}}]}
```

O‘chirish: `{"entity":"products","op":"delete","id":"uuid"}`. Ruxsat etilgan entity’lar: businesses, products, categories, plans, platform. User va subscription huquqlari alohida endpointlarda.

Butun batch transaction bilan bajariladi; bitta amal rad etilsa hammasi bekor bo‘ladi. Owner boshqa tenant ID’sini ishlata olmaydi, mahsulotni boshqa biznesga ko‘chira olmaydi yoki boshqa tenant kategoriyasiga ulay olmaydi. Plan/expiry/owner o‘zgarishi server tomonidan cheklanadi. Mahsulot qo‘shishda biznes lock qilinadi va tarif limiti tekshiriladi.

Frontend forma saqlash muvaffaqiyati faqat server javobidan keyin ko‘rsatiladi. Saqlashlar navbat orqali ketma-ket yuboriladi.

## Media

Frontend preview uchun FileReader ishlatadi. Saqlashda data URL serverda MIME, hajm va haqiqiy image dekoder orqali tekshiriladi, fayl `MEDIA_ROOT`ga yoziladi va DB’da `/media/uploads/...` manzili qoladi. Keyingi o‘qishlarda rasm browser xotirasiga bog‘liq emas.

MVPda media Django orqali uzatiladi. Trafik oshganda S3-compatible saqlash/CDN yoki Nginx media-serving qo‘shish mumkin. Yuklangan rasmlarni va bazani birga backup qiling.

## Obuna

Trial 30 kun va 1 000 mahsulot. Pro/VIP uchun `limit: null` — cheksiz. Frontend matni va server tekshiruvi shu qiymatdan foydalanadi. Bepul sinovni owner qayta boshlay olmaydi.

Pro — 7 kunlik analytics; VIP — 90 kungacha va CSV. Obuna arizasi darhol tarif bermaydi: admin tasdiqlashi kerak. Ariza faqat bir marta tasdiqlanadi. To‘lovni dastur tashqarisida tekshirish administrator vazifasi; avtomatik payment gateway yo‘q.

## Public SSR

Next server `DJANGO_API_URL` orqali biznesni slug bilan oladi. Public metadata, katalog va favicon shu real manbaga bog‘langan. Topilmagan/yashirilgan biznes 404; muddati tugagan biznes API’da 410, sayt ko‘rinishida 404. Boshqa browserdan ham bir xil server ma’lumotlari ochiladi.


## Premium konfiguratsiya

Business qo‘shimcha maydonlari: `colorMode`, `backgroundColor`, `surfaceColor`, `textColor`, `surfaceTextColor`, `mutedColor`, `heroStyle`, `heroTitle`, `contentWidth`, `productColumns`, `mobileColumns`, `cornerStyle`, `density`, `showHero/showSearch/showCategories/showPrices/showContacts/showLocation`, `latitude/longitude`, `mapUrl`. Ranglar faqat hex; koordinata juftligi va diapazoni tekshiriladi, xarita havolasi ruxsat etilgan HTTPS host bo‘lishi kerak. Bular workspace CRUD orqali saqlanadi, public API orqali qaytadi. `showPrices` katalogning ko‘rinishini boshqaradi; narxni maxfiy ma’lumot deb hisoblamang, API’da bor.

Identity va business snapshot’da read-only `accountId` bor. Public API biznes egasining shu ochiq qo‘llab-quvvatlash ID’sini qaytaradi; bu autentifikatsiya siri emas. Platforma `subscriptionTelegram` (username)ni qaytaradi. `subscriptionActivations` faqat superadmin snapshot’ida bor.

Activation JSON: `{"planId":"pro","months":1,"mode":"extend","note":"Payment checked","idempotencyKey":"UUID"}`. 1/3/6/12 oy, har oy 30 kun. `extend` joriy sana yoki aktiv expiry’dan; `restart` bugundan. Bir xil UUID/payload takror qaytsa o‘zgartirmaydi, boshqa payload bilan shu UUID 409. Client retry davomida UUIDni saqlaydi. Oddiy workspace PATCH orqali admin ham plan/expiryni almashtirmaydi. Eski request/review endpointlari orqaga moslik uchun saqlangan; yangi UI barcha aktivatsiyani maxsus endpointdan bajaradi.

## Uch til

Frontend `Accept-Language: uz/ru/en` yuboradi; JSON detail va tasdiqlash emaili shu tilda chiqadi. Business/Product/Category `translations` JSON maydoni `{ "ru": { "name": "..." }, "en": { "name": "..." } }` ko‘rinishida; faqat ruxsat etilgan matn maydonlari qabul qilinadi. Public katalog til tanlovini do‘kon bo‘yicha eslab qoladi; matnlar tanlangan tilga mos fallback bilan chiqariladi.

## Hardening kontrakti

Mavjud yozuvni o‘zgartirish yoki o‘chirishda `change.revision` majburiy. U GET qaytargan revision bilan teng bo‘lsin; aks holda 409. Yangi yozuvda revision kerak emas. PATCH faqat o‘zgargan maydonlar bilan yuboriladi va `acknowledged` / `deleted` qaytaradi. Admin orqali activation business revision’ni ham oshiradi.

- `/workspace/` bounded boshlang‘ich dataset; `/workspace/?view=summary` faqat counts/analytics/collections.
- `/collections/products|categories|businesses|users/`: page, pageSize (max 100), q va tegishli filtrlar; items + pagination.
- `/collections/activations/`: admin-only, sahifalangan activation tarixi.
- `/businesses/:id/analytics/?days=7`: tenant-scoped aggregate, Asia/Tashkent.
- `/businesses/:id/events.csv?days=90`: VIP/admin to‘liq stream.
- `/businesses/:id/designs/`: GET oxirgi versiyalar; POST versionId/revision bilan tiklash.
- Public katalog page/pageSize/q/category/product/categoryPage qabul qiladi; private account/plan maydonlari chiqarilmaydi.
