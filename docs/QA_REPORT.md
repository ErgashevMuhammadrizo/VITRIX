# VITRIX — yangilanish tekshiruvi

Tekshiruv: 2026-11-06. Demo login/parollar kiritilmagan.

- Django: 55/55 test. Auth/CSRF, email kodi, foydalanuvchi rollari, tenant izolyatsiyasi, mahsulot limitlari, obuna/admin aktivatsiyasi va audit, lokatsiya, kontent tarjimalari, lokalizatsiya, anonim tarif API uchun 401 va public config’da narxlar yo‘qligi.
- Gmail API: mock HTTPS orqali OAuth refresh, MIME xabar manzili/kodi, muvaffaqiyat va xato natijalari tekshirildi. Haqiqiy Gmail xati ushbu tekshiruvda yuborilmadi.
- Frontend: 21/21 test. Domain/proxy, tillar katalogi, RU/EN forma va CTA, uch tilli public katalog, tarjima fallback, dizaynni standartga qaytarishda kontentning saqlanishi, yangi narxlar va limitlar.
- ESLint: tekshirilgan frontend bo‘limlarida 0 error; img optimizatsiyasi, ayrim foydalanilmagan importlar va effect dependency bo‘yicha ogohlantirishlar mavjud.
- TypeScript noEmit: muvaffaqiyatli.
- Next.js production build: muvaffaqiyatli.
- Django makemigrations --check --dry-run: o‘zgarish aniqlanmadi.
- start-all.sh: bash sintaksis tekshiruvi muvaffaqiyatli.
- Brauzer: home UZ/RU/EN, tarjima qilingan sarlavha/nav/FAQ/CTA/footer, obuna narxlari yo‘qligi; demo katalog tillari, mahsulot/kategoriya/kontakt tarjimalari, tashrif buyuruvchi tilining paneldan mustaqilligi va tungi palitra tekshirildi.

Chegaralar: bu tekshiruv foydalanuvchining Railway xizmatiga redeploy qilmadi. Docker image build, haqiqiy SMTP/Gmail yetkazilishi, domen/TLS va fizik telefonlar sinovi bu muhitda bajarilmadi. ZIPni push/redeploy qilgach o‘zingizning bazangiz va Variables bilan register/login, email kodi, rasmlar va obuna aktivatsiyasini smoke tekshiring.

Mahsulot va biznes matnlari avtomatik tarjima qilinmaydi. Tarjimalar kontent muharririda kiritiladi; bo‘sh maydon asosiy matnga qaytadi. 0006 va 0007 migratsiyalarini ishga tushirish kerak; start-all.sh buni avtomatik bajaradi. SQLite va media uchun /data persistent Volume talab qilinadi.
