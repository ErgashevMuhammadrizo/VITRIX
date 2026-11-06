# VITRIX — mavjud Railway loyihasini yangilash

Ushbu paketda Next.js, Django va SQLite bitta konteynerda ishlaydi. Mavjud foydalanuvchi, do‘kon, mahsulot va obunalar bazada saqlanadi. Avval bazaning va media papkasining zaxira nusxasini oling.

1. GitHub loyihangizdagi kodni ushbu paketdagi kod bilan yangilang. O‘zingizdagi `.env`, OAuth tokenlari va boshqa maxfiy fayllarni GitHub’ga yubormang. Railway Variables ichidagi ishlayotgan Gmail API qiymatlarini saqlang.
2. Railway Volume `/data` manziliga ulanganini tekshiring. `DATABASE_PATH=/data/db.sqlite3`, `MEDIA_ROOT=/data/media` bo‘lsin. Volume bo‘lmasa redeploydan keyin SQLite va rasmlar yo‘qolishi mumkin.
3. Railway Dockerfile orqali build qilsin. Alohida Start Command qo‘yilgan bo‘lsa olib tashlang: Dockerfile `scripts/start-all.sh`ni ishlatadi. Public port `8080`; `PORT=8080`, `DJANGO_API_URL=http://127.0.0.1:9000`. Django 9000 — konteyner ichidagi xususiy port.
4. Commit va push qiling. Redeploy vaqtida migratsiyalar avtomatik bajariladi. 0006 uch tildagi kontent maydonlarini, 0007 Pro 49 000 va VIP 99 000 narxlarini kiritadi. Amaldagi obunalar muddati o‘zgarmaydi.
5. Mavjud administrator hisobingizdan foydalaning. Yangi o‘rnatishda SSH: `cd /app/backend` va `/opt/venv/bin/python manage.py createsuperuser`.
6. Ro‘yxatdan o‘tish kodi, login, uch til, do‘kon yaratish, dizaynni saqlash/qaytarish, public katalog va admin orqali obunani faollashtirishni tekshiring.

## Gmail API

`EMAIL_BACKEND=accounts.gmail_backend.GmailAPIBackend`; `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` va `DEFAULT_FROM_EMAIL` mavjud ishlaydigan qiymatlar bo‘lib qolsin. Misol uchun `railway.env.example` mavjud; uni haqiqiy qiymatlarni yo‘qotib, ko‘r-ko‘rona almashtirmang. OAuth loyihasi Testing holatida bo‘lsa Gmail scope bilan olingan refresh token odatda 7 kundan keyin tugaydi; uzoq ishlash uchun Google OAuth nashr holatini moslang va kerak bo‘lsa qayta ruxsat oling. Sirlarni log yoki xabarlarda ulashmang.

## Yangiliklar

- Panel va saytning tizim matnlari UZ/RU/EN. Tashrif buyuruvchi tilni mustaqil tanlaydi.
- Do‘kon, kategoriya va mahsulot matnlari uchun uch tildagi kontent muharriri. Foydalanuvchi yozgan matn avtomatik tarjima qilinmaydi: kerakli tarjimalarni muharrirga kiriting. Bo‘sh tarjimada asosiy matn chiqadi.
- Dizayn: ortga, oldinga, oxirgi saqlangan ko‘rinish, standart holat. Standartga qaytarish mahsulot, kontakt, logotip va obunani o‘chirmaydi. Natijani saytga chiqarish uchun Saqlash bosing.
- DEALS brendingi; kabinet bosh sahifasi va Obuna bo‘limida amaldagi tarif.
- Bosh sahifada obuna narxlari yo‘q. Tariflar faqat hisobga kirgandan keyin ko‘rinadi. Bepul sinov 30 kun, 1000 mahsulot; Pro/VIP cheksiz mahsulot.

`compose.yaml` — alohida frontend, Django va PostgreSQL servisli ixtiyoriy usul. Uning frontend image’i `Dockerfile.frontend`; Railway uchun ildizdagi `Dockerfile` ishlatiladi.
