# VITRIX Premium MVP — QA

Sana: 2026-11-06. Asos: oldingi VITRIX full-stack MVP. Demo login/parollar qo‘shilmagan.

## Tekshirilganlar

- Django: 46/46 test. Email kodi, password hashing, CSRF, createsuperuser admin logini, tenant izolyatsiyasi, 1000 mahsulot limiti va obuna bloklash oqimlari.
- Yangi backend testlar: server bergan ID; Telegram draftida haqiqiy ID/do‘kon/tarif; operator sozlanmaganida halol 503; env fallback; pending arizani takror bosishda yangilash; admin-only activation; 30 kun uzaytirish; retry muddatni ikki marta bermasligi; UUID boshqa payload bilan 409; muddati tugagan hisobni aktivlashtirish; audit tarixi; generic PATCH bilan obunani almashtirishni bloklash; rang/ustun/boolean validatsiya; matn va pin persistensi; unsafe map URL/koordinata rad etilishi; healthcheck.
- Frontend: 13/13 domain va proxy testi. Palitralar real ranglarni almashtirishi, full width standarti, koordinatalarda nol/diapazon, Google/Yandex parsing va soxta hostlarni rad etish.
- TypeScript noEmit: muvaffaqiyatli.
- Next.js production build: muvaffaqiyatli. Vinext hosted build paketlash vaqtida ham tekshiriladi.
- Django migration drift check: yangi 0005 migratsiyadan tashqari o‘zgarish yo‘q.

## Dizayn tekshiruvining chegarasi

Yangi UI uchun brauzer preview URL’iga ulanish ERR_CONNECTION_REFUSED bilan ochilmadi. Keyingi browser reload ham URL policy tomonidan bloklandi. Yangi dizaynning brauzerdagi vizual ko‘rinishi, real karta/Telegram ilovasi va mobil viewport shu topshirishda tasdiqlanmagan. JSX/TypeScript, model saqlanishi va ikkala production build tekshiruvlari bajarildi. Real serverda smoke va vizual tekshiruvni tugating.

## Tashqi sozlamalar

Haqiqiy Gmail/SMTP xati jo‘natilmadi (Django test mailbox ishlatiladi). Telegram draftini API testi tekshiradi, haqiqiy operatorga xabar yuborilmagan. To‘lov administrator tomonidan tashqarida tekshiriladi, payment gateway yo‘q. Docker image build, real domen/TLS, production PostgreSQL, OSM tarmoq yuklanishi va fizik telefonlar sinovi hali bajarilmagan.

`docs/DEPLOYMENT.md`da yangi o‘rnatish, mavjud bazani yangilash, Telegram, SMTP, healthcheck va backup buyruqlari bor. Paket serverga joylash uchun tayyorlangan; hosting rekvizitlari kiritilgach real ro‘yxatdan o‘tish va to‘lovdan keyingi aktivatsiya smoke sinovi zarur.
