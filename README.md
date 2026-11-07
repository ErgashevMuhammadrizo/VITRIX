# VITRIX — kichik biznes uchun onlayn katalog

Next.js frontend va Python Django backend bir paketda. Demo loginlar yo‘q. Ma’lumotlar bazasi, email kodi bilan ro‘yxatdan o‘tish, server tekshiradigan rollar va tenant izolyatsiyasi mavjud.

Railway’dagi mavjud loyihani yangilash uchun avval **[START_HERE_UZ.md](START_HERE_UZ.md)** faylini o‘qing.

## Digital Clarity va xavfsizlik yangilanishi

Mahsulotlaringiz. Bitta havola. Oq-ko‘k platforma dizayni, serverdagi login/OTP limiter, revision konfliktlari, sahifalangan katalog, agregat analitika, saqlangan dizaynlar tarixi va backup buyruqlari. Auditning 20 bandi: [docs/AUDIT_CLOSURE.md](docs/AUDIT_CLOSURE.md).

## Imkoniyatlar

- To‘liq ekran kengligi: noutbukda ortiqcha yon bo‘shliqlar qisqartirilgan. Merchant ixcham/keng/to‘liq ekran variantini tanlaydi.
- Oq, qora, oq-qora va 6 palitra; mustaqil ranglar, shrift, banner, ustunlar, oraliq, burchak va bo‘limlar ko‘rinishi.
- Matnli manzil + xarita pini, koordinatalar, xarita havolasi va ixtiyoriy geolokatsiya.
- Doimiy akkaunt ID; ID/do‘kon orqali admin qidiruvi.
- Obuna tugmasi operator Telegram’iga ID va tarif yozilgan tayyor xabar bilan o‘tadi.
- Admin tasdiqlaydigan 1/3/6/12 oylik obuna, takroriy amal himoyasi va faollashtirish tarixi.

**Serverga o‘rnatish, HTTPS, Telegram va yangilash:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Tariflar

| Tarif | Narx | Mahsulotlar | Farqi |
| --- | --- | --- | --- |
| Bepul sinov | Birinchi 30 kun — 0 so‘m | 1 000 ta | Asosiy katalog, barcha dizaynlar, 7 kunlik statistika |
| Pro | 49 000 so‘m / oy (30 kun) | Cheksiz | Cheksiz katalog, brending, 7 kunlik statistika |
| VIP | 99 000 so‘m / oy (30 kun) | Cheksiz | Pro + 7/30/90 kunlik tahlil, davr ko‘rsatkichlari va CSV eksport |

Barcha tariflarda kategoriyalar cheklanmagan, telefon/Telegram aloqalari, 3 ta layout uslubi va keng dizayn sozlamalari bor. “Cheksiz” tarifda sun’iy mahsulot kvotasi yo‘qligini anglatadi; amaliy sig‘im server resurslariga bog‘liq.

Sinov muddati serverdagi birinchi ro‘yxatdan o‘tishdan hisoblanadi. Uni foydalanuvchi qayta yoqolmaydi. Muddati tugaganda kabinetdan obunaga ariza berish mumkin; katalogni o‘zgartirish va public sayt to‘xtaydi. Pro/VIP arizasini administrator to‘lovni tekshirib tasdiqlaydi. Onlayn to‘lov integratsiyasi yo‘q, pul dastur orqali yechilmaydi.

## Ishga tushirish — Docker

Talablar: Docker Compose va environment tayyorlash uchun Node.js.

```bash
node scripts/setup-env.mjs
```

Bu buyruq mavjud fayllarni almashtirmasdan `.env`, `backend/.env` hamda tasodifiy Django va database sirlarini yaratadi. Sirlarni terminalga chiqarmaydi.

`backend/.env`da Gmail SMTP sozlamalarini to‘ldiring:

```dotenv
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=1
EMAIL_HOST_USER=your-account@gmail.com
EMAIL_HOST_PASSWORD=your-google-app-password
DEFAULT_FROM_EMAIL=VITRIX <your-account@gmail.com>
```

Google akkauntning oddiy paroli o‘rniga [App Password](https://support.google.com/accounts/answer/185833) ishlatiladi. Uni yaratish uchun akkauntda ikki bosqichli tekshiruv yoqilgan bo‘lishi kerak. Bu qiymatlarni kodga yoki Git’ga qo‘shmang.

```bash
docker compose up --build -d
docker compose exec backend python manage.py createsuperuser
```

`createsuperuser`da o‘zingiz username, email va parol tanlaysiz. Tayyor admin yoki user paroli mavjud emas.

Sayt: `http://localhost:3000`. `/login`da shu superadmin hisobi bilan kirsangiz `/admin` ochiladi. Oddiy foydalanuvchilar `/register`da emailiga kelgan 6 xonali kodni tasdiqlaydi.

Compose PostgreSQL va rasmlar uchun alohida doimiy volume ishlatadi. `docker compose down -v` ma’lumotlar va rasmlarni o‘chiradi; odatiy to‘xtatish uchun `docker compose down` yetarli.

## Lokal ishlab chiqish — Linux

Birinchi terminal:

```bash
node scripts/setup-env.mjs
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py createsuperuser
backend/.venv/bin/python backend/manage.py runserver 127.0.0.1:8000
```

Ikkinchi terminal:

```bash
npm install
npm run dev:next
```

Frontend `http://localhost:3000`, backend `http://127.0.0.1:8000`. `DJANGO_API_URL` backendning origin manzili; oxiriga `/api/v1` yozilmaydi. API va media so‘rovlari frontendning shu origin’dagi proxy marshrutlaridan o‘tadi. Shuning uchun browserda cross-origin cookie konfiguratsiyasi talab qilinmaydi.

Lokal variant odatda SQLite ishlatadi. Bir nechta workerli ishlab chiqarish muhiti uchun PostgreSQL tavsiya etiladi; Compose shu bilan tayyorlangan.

## Production konfiguratsiyasi

Tayyor HTTPS varianti: `compose.yaml` + `compose.production.yaml`; to‘liq buyruqlar [deployment yo‘riqnomasida](docs/DEPLOYMENT.md).

Docker Compose shu holatda lokal HTTP uchun. Internetga chiqarishda:

- TLS reverse proxy qo‘ying; `DJANGO_SECURE_COOKIES=1`, `DJANGO_DEBUG=0` ishlating.
- `DJANGO_ALLOWED_HOSTS` va `CSRF_TRUSTED_ORIGINS`ni haqiqiy frontend/backend domenlariga moslang.
- `NEXT_PUBLIC_SITE_URL`ni public frontend domeniga, `DJANGO_API_URL`ni yetib boriladigan Django origin’iga o‘rnating.
- Gmail SMTP yoki tanlangan email xizmatini sozlang va haqiqiy yuborishni tekshiring.
- PostgreSQL va media volume uchun backup rejimini sozlang.
- Administrator kontaktlari, huquqiy matnlar va to‘lovni tasdiqlash jarayonini biznesingizga moslang.

Bu paketda backend uchun Dockerfile va Gunicorn bor. Oldingi hosted frontend preview o‘z-o‘zidan Python serveriga aylanmaydi: Django’ni Python/Docker hostingda ishga tushirib uning manzilini frontendga ulash kerak.

## Qanday ishlaydi

1. Foydalanuvchi ro‘yxatdan o‘tish ma’lumotlarini kiritadi.
2. Server emailga vaqtinchalik kod yuboradi. Kod API javobida qaytarilmaydi, bazada hash holatida saqlanadi.
3. Kod to‘g‘ri bo‘lsa foydalanuvchi va uning biznesi yaratiladi. 30 kunlik sinov boshlanadi.
4. Mahsulot, kategoriya, rasm, dizayn va biznes ma’lumotlari Django/PostgreSQL yoki SQLite’da saqlanadi.
5. `/:businessSlug` katalogi login so‘ramaydi, faqat tegishli biznesning e’lon qilingan mahsulotlarini ko‘rsatadi.
6. Pro/VIP tugmasi Telegram’da ID/do‘kon/tarifli xabarni tayyorlaydi va admin uchun pending ariza yaratadi. User xabarni yuboradi; admin to‘lovdan keyin ID orqali obunani yoqadi. Bir xil amal kaliti bilan retry muddatni qayta uzaytirmaydi.

## Funksiyalar

- Email kodini so‘rash, 60 soniyadan keyin qayta yuborish, 10 daqiqalik amal qilish, ko‘pi bilan 5 ta tekshirish urinishi.
- Email tasdig‘isiz hisob yaratilmaydi. Serverda parol hash’i va Django session autentifikatsiyasi.
- Username yoki email bilan login; remember me; logout; email kodi orqali parol tiklash.
- `createsuperuser` orqali yaratilgan admin va oddiy hisoblar server tomonidan ajratiladi.
- Mahsulot CRUD, publish/draft/archive, rasmlar, qo‘shimcha galereya, narx, tavsif, tartib va mavjudlik.
- Kategoriyalar, qidiruv, filtrlar, grid/table, sorting, pagination.
- Minimal/Modern/Elegant, brend ranglari, shrift, layout va jonli telefon preview’i.
- Business slug va metadata: haqiqiy backenddan SSR, Open Graph, biznes favicon’i va server 404.
- Telefon/Telegram tugmalari; tanlangan mahsulot nomi bilan Telegram xabari.
- Real server hodisalari va tarifga mos analitika. VIP CSV eksporti.
- Superadmin foydalanuvchilari, bizneslar, tariflar, obuna arizalari, mahsulot monitoringi va platforma sozlamalari.
- Muhim o‘zgarishlar uchun audit yozuvlari.
- Rasmlar serverda tekshiriladi va media saqlashga yoziladi: JPG/PNG/WebP, har fayl 2 MB gacha.
- Dark/light, responsive layout, UZ/RU/EN navigatsiya va public UI lug‘atlari. Ayrim admin/forma matnlari hali o‘zbekcha.

Savatcha, marketplace, checkout va onlayn to‘lov yaratilmagan.

## Sahifalar

| Guruh | Yo‘llar |
| --- | --- |
| Marketing | `/`, `/pricing`, `/features`, `/about`, `/contact`, `/terms`, `/privacy` |
| Hisob | `/login`, `/register`, `/forgot-password` |
| Kabinet | `/dashboard`, `/dashboard/website`, `/dashboard/products`, `/dashboard/categories`, `/dashboard/design`, `/dashboard/contacts`, `/dashboard/settings`, `/dashboard/analytics`, `/dashboard/subscription`, `/dashboard/profile` |
| Superadmin | `/admin`, `/admin/users`, `/admin/businesses`, `/admin/subscriptions`, `/admin/products`, `/admin/settings` |
| Public sayt | `/:businessSlug` |
| Namuna | `/demo` — faqat namunaviy katalog, login hisobi yo‘q |
| Django ichki admin | Backendda `/django-admin/` |

## Asosiy tuzilma

| Papka | Vazifa |
| --- | --- |
| `app` | Next App Router, SSR metadata, API va media proxy |
| `src/features` | Marketing, auth, owner va superadmin ekranlari |
| `src/components` | Umumiy UI va public biznes sayti |
| `src/services/auth.ts` | CSRF bilan autentifikatsiya HTTP klienti |
| `src/services/workspace.ts` | Server ma’lumotlari, CRUD delta va obuna endpointlari |
| `src/stores/app-store.tsx` | Server bilan tasdiqlangan holat, ketma-ket saqlash |
| `src/mocks` | Faqat `/demo` namunasi va boshlang‘ich tarif matnlari; demo akkaunt yo‘q |
| `backend/accounts` | Modellar, auth, email kodlari, tenant CRUD, public katalog, obuna, testlar |
| `backend/config` | Django settings, URL va WSGI |
| `backend/accounts/migrations` | Schema va boshlang‘ich tariflar |
| `tests` | Frontend domain va proxy testlari |
| `compose.yaml` | Next.js + Django/Gunicorn + PostgreSQL + media volume |
| `docs` | API, tekshiruv natijalari va MVP cheklovlari |

## Tekshirish

```bash
npm run typecheck
npm test
npm run build:next
backend/.venv/bin/python backend/manage.py test accounts
backend/.venv/bin/python backend/manage.py check
```

`npm run build` va `npm run dev` hosted preview uchun Vinext compatibility runtime’ini ishlatadi. Standart Next.js deployment uchun `build:next`, `start:next`, `dev:next` ishlatiladi.

Backend va frontend ishlayotganida qo‘shimcha smoke tekshiruv:

```bash
node scripts/smoke.mjs http://localhost:3000
```

Bu topshirishda haqiqiy Gmail akkauntidan xat jo‘natilmagan. Email oqimi Django’ning test mailbox’i bilan tekshiriladi; SMTP ma’lumotlarini egasi kiritadi. Docker image qurilishi, real domen/TLS va fizik iPhone/Android qurilmalarida sinash alohida deployment tekshiruvlaridir.
