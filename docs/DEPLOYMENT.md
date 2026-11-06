Railway’da bitta konteyner va Gmail API uchun asosiy yo‘riqnoma: [START_HERE_UZ.md](../START_HERE_UZ.md). Quyida alohida Compose servisli muqobil o‘rnatish berilgan.

# VITRIX — serverga joylash

Talablar: Linux server, domen, Docker Engine + Docker Compose 2.24.4 yoki yangiroq (`!reset` uchun), Node.js 22+. Next.js + Django/Gunicorn + PostgreSQL ishlatiladi. Backend va baza public port ochmaydi; Caddy TLS reverse proxy frontendni chiqaradi.

## 1. Tayyorlash

Arxivni ochib VITRIX papkasiga kiring:

```bash
node scripts/setup-env.mjs
```

Bu mavjud env fayllarni almashtirmaydi; yangi o‘rnatishda sirlar tasodifiy yaratiladi. `.env`da:

```dotenv
VITRIX_DOMAIN=your-domain.uz
NEXT_PUBLIC_SITE_URL=https://your-domain.uz
DJANGO_SECURE_COOKIES=1
```

`backend/.env`da:

```dotenv
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=backend,localhost,127.0.0.1,your-domain.uz
CSRF_TRUSTED_ORIGINS=https://your-domain.uz
FRONTEND_URL=https://your-domain.uz
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=1
EMAIL_HOST_USER=your-account@gmail.com
EMAIL_HOST_PASSWORD=your-google-app-password
DEFAULT_FROM_EMAIL=VITRIX <your-account@gmail.com>
```

`DJANGO_SECRET_KEY` va `POSTGRES_PASSWORD`ni setup yaratgan qiymatda qoldiring. Oldingi ishlayotgan bazaning parolini almashtirmang. Domen A/AAAA yozuvlari serverga yo‘nalsin, 80 va 443 portlari ochiq bo‘lsin. Caddy domen uchun sertifikatni oladi. `NEXT_PUBLIC_SITE_URL` Compose orqali backend `FRONTEND_URL` va frontend `SITE_URL`ga uzatiladi.

## 2. Ishga tushirish

```bash
docker compose -f compose.yaml -f compose.production.yaml up --build -d
docker compose -f compose.yaml -f compose.production.yaml exec backend python manage.py createsuperuser
```

Backend ishga tushganda migratsiyalar va static fayllar avtomatik bajariladi. Healthcheck bazani va boshlang‘ich tarifni tekshiradi. Frontend backend tayyor bo‘lishini kutadi.

`https://your-domain.uz/login`da createsuperuser username/parolini kiriting — `/admin` ochiladi. Demo login yo‘q. `Admin → Platforma sozlamalari → Obunalar uchun Telegram`ga o‘z `@username`ingizni yozib saqlang. Muqobil: `backend/.env`da `SUBSCRIPTION_TELEGRAM=username`; admin paneldagi qiymat ustun turadi. Bot tokeni talab qilinmaydi.

## 3. Obuna oqimi

- User profil/kabinetida server bergan doimiy `VX-000001` ko‘rinishidagi akkaunt ID bor. Bu login yoki maxfiy parol emas.
- Pro/VIP tugmasi Telegram suhbatini ochadi. Tayyor xabarda salomlashish, akkaunt ID, do‘kon, sayt, tarif, narx va 1 oy bor. Xabar avtomatik yuborilmaydi: user Send tugmasini bosadi. Telegram ilova/web versiyasiga qarab draft ko‘rinishi farqlanishi mumkin.
- Admin `/admin/subscriptions`da ID, do‘kon, email yoki telefon bilan qidiradi. To‘lovni tekshirib “Obunani yoqish”ni bosadi.
- Standart 1 oy = 30 kun. 3/6/12 oy ham bor. “Joriy muddatdan uzaytirish” faol hisobda qolgan kunlarni saqlaydi; tugagan obunada bugundan boshlaydi. “Bugundan boshlash” qolgan muddatni hisobga olmaydi; modal yangi sanani ko‘rsatadi.
- Faollashtirish uchun pullik tarif va admin roli serverda tekshiriladi. Bir xil amal kaliti bilan qayta urinish ikkinchi marta uzaytirmaydi. Admin, sana, izoh va oldingi/yangi tugash sanasi tarixga yoziladi.
- Bepul sinov takror berilmaydi. Tariflar: 30 kun bepul / 1000 mahsulot; Pro 49 000 / cheksiz; VIP 99 000 / cheksiz + kengaytirilgan statistika/CSV.

## 4. Dizayn va lokatsiya

`Kabinet → Dizayn`: oq/qora/oq-qora, 6 palitra, mustaqil fon/karta/matn ranglari, shrift, 3 layout uslubi, banner/sarlavha, grid/list, burchak, oraliq, desktop/mobile ustunlar, bo‘limlarni ko‘rsatish/yashirish. To‘liq ekran kengligi standart; “Keng” va “Ixcham” ham mavjud. Natija preview’da ko‘rinadi va saqlangach public katalogga qo‘llanadi.

`Kabinet → Aloqa`: matnli manzil + xaritadan pin, suriladigan marker, koordinatalar yoki xavfsiz xarita havolasi. “Joylashuvimni olish” faqat bosilganda browser ruxsatini so‘raydi va HTTPS talab qiladi. OSM xaritasi internet talab qiladi; koordinata/havola qo‘lda kiritilishi mumkin. Qisqa Google Maps havolasini koordinata uchun avtomatik ochib chiqmaymiz; pin qo‘yish yoki to‘liq koordinatali havola kerak. OSM attribution saqlangan. Public sahifada lokatsiya xarita va tashqi xaritada ochish tugmasi bilan ko‘rinadi.

## 5. Avvalgi versiyani yangilash

Baza va media backupini oling, fayllarni yangilang, mavjud env va volume’larni saqlang. Yuqoridagi `up --build -d`ni qayta bajaring. Yangi `0005` migratsiya qo‘llanadi; akkauntlar va katalog o‘chirilmaydi. Telegram username’ni admin panelda kiriting. `down -v` ishlatmang.

## 6. Serverdagi yakuniy tekshiruv

```bash
docker compose -f compose.yaml -f compose.production.yaml ps
docker compose -f compose.yaml -f compose.production.yaml logs --tail=100 backend frontend caddy
curl -f https://your-domain.uz/api/v1/health/
```

Keyin yangi email bilan ro‘yxatdan o‘ting, real Gmail kodini qabul qiling, dizayn/manzilni saqlang, public havolani oching, Telegram draftini tekshiring, test to‘lov jarayonidan keyin admin obunasini yoqing. SMTP va domen/TLS foydalanuvchining real rekvizitlari bilan yakuniy tekshiriladi.

## 7. Backup

```bash
docker compose -f compose.yaml -f compose.production.yaml exec -T db pg_dump -U vitrix -d vitrix > vitrix-backup.sql
docker compose -f compose.yaml -f compose.production.yaml cp backend:/app/media ./media-backup
```

Backupni serverdan tashqarida ham saqlang; tiklashni alohida bazada tekshiring. `.env` sirlarini himoyalangan joyda saqlang. Healthcheck readiness’ni ko‘rsatadi; SMTP, backup va monitoring uchun o‘z infratuzilmangiz kerak.
