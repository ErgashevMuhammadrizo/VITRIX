# VITRIX — xavfsizlik tuzatishlari

Sana: 2026-11-07. Ushbu paket yuklangan VITRIX-main(2).zip asosida tayyorlandi. Kod o‘zgartirildi; ishlayotgan Railway serveriga deploy qilinmadi. Hech qanday real email yoki pullik so‘rov yuborilmadi.

## Eng avval bajariladigan ishlar

1. Production bazasi va `/data/media` papkasini zaxiralang. Deploydan oldin nusxani alohida joyda tekshiring.
2. Railway Variables ichida quyidagilarni sozlang. Haqiqiy kalitlarni chatga, GitHub’ga yoki `NEXT_PUBLIC_` o‘zgaruvchilariga yozmang.

| O‘zgaruvchi | Qiymat / talab |
|---|---|
| `DJANGO_DEBUG` | `0` |
| `DJANGO_SECRET_KEY` | Tasodifiy, kamida 50 belgili maxfiy kalit |
| `INTERNAL_PROXY_TOKEN` | Tasodifiy, kamida 32 belgili; Next va Django uchun bir xil |
| `TRUSTED_CLIENT_IP_HEADER` | Railway public ingress uchun `x-real-ip`; boshqa hostingda faqat ingress qayta yozadigan ishonchli header |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,vitrix-production.up.railway.app` va o‘zingizning domeningiz; `*` mumkin emas |
| `DJANGO_SECURE_COOKIES` | `1` |
| `CSRF_TRUSTED_ORIGINS` | Faqat haqiqiy `https://...` frontend domenlari |
| `FRONTEND_URL`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL` | Haqiqiy `https://...` sayt manzili |
| `DJANGO_API_URL` | Bitta konteyner uchun `http://127.0.0.1:9000` |
| `DATABASE_PATH` | `/data/db.sqlite3` — doimiy volume ichida |
| `MEDIA_ROOT` | `/data/media` — doimiy volume ichida |

Ikki kalitni alohida yaratish uchun har safar shu buyruqni bajaring:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
```

`DJANGO_SECRET_KEY`ni mavjud production’da almashtirish sessiyalarni bekor qilishi mumkin. Yangi `INTERNAL_PROXY_TOKEN` esa alohida kalit bo‘lishi kerak. Frontend va backend yangi kod bilan birga yangilansin: eski frontend saqlash uchun kerakli `revision`ni yubormaydi.

3. Deploy qiling. `scripts/start-all.sh` yangi `0008` migratsiyani avtomatik bajaradi. Qo‘lda ishga tushirilsa:

```bash
cd backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

4. Kod yuborish, email-kod bilan kirish/tiklash, katalog, ikki oynada saqlash va tilni almashtirishni staging’da, keyin production’da tekshiring.

## Nimalar tuzatildi

| Muammo / xavf | Natija va koddagi joy |
|---|---|
| Yangi brauzer sessiyasi bilan login limitini chetlab o‘tish | `SecurityBucket` bazada saqlanadi; barcha workerlar va sessiyalar uchun umumiy. `accounts/security.py`, `views.py` |
| Login/email orqali bir xil hisobni turlicha yozib chetlab o‘tish | Bir xil mavjud hisobning ID’si limit kaliti bo‘ladi |
| Turli username bilan parol taxmin qilish | IP bo‘yicha ham cheklov bor |
| Login/OTP/tiklash so‘rovlari oqimi | Endpointlar bo‘yicha alohida cheklovlar; kod yuborish email bo‘yicha ham cheklanadi |
| Limit vaqtini cheksiz uzaytirish | Oynalar belgilangan muddatda tugaydi; taqiqlangan urinishlar muddatni uzaytirmaydi |
| Email kodining eskirishi va takror ishlatilishi | Mavjud bir martalik kod va 5 urinish himoyasi saqlandi; SQLite uchun IMMEDIATE tranzaksiyalar qo‘shildi |
| Kechikkan email xatosi yangi kodni o‘chirishi | Faqat o‘sha yuborishdagi digest mos kelsa o‘chiriladi |
| `password: null` va boshqa noto‘g‘ri turlar | 500 o‘rniga 400, parol o‘zgarmaydi |
| Juda uzun parol/profil maydonlari | Hashlash va saqlashdan oldin uzunlik va tur tekshiriladi |
| Eski nusxa bilan boshqa oynadagi ishni bosib yozish | Mavjud yozuvni o‘zgartirish/o‘chirish uchun server `revision`i majburiy; eskirgan yoki yo‘q token → 409 |
| Parallel yozish va limit tekshirish | Bazadagi yozish qulfidan foydalaniladi; SQLite’da faqat `select_for_update()`ga tayanilmaydi |
| Bir paketdagi yarim saqlash | Konflikt bo‘lsa butun o‘zgarishlar tranzaksiyasi bekor qilinadi |
| 20 000 hodisadan keyin analitika to‘xtashi | Cheklangan xom ro‘yxat o‘rniga bazada UTC kun / biznes / hodisa bo‘yicha `count` hisoblanadi. UI jami qiymatni hisoblaydi; CSV kunlik jamlanma chiqaradi |
| Til Django’ga bormasligi | Proksi `Accept-Language`ni uzatadi; yangi xabarlarga RU/EN tarjimalari qo‘shildi |
| Katalogning to‘liq yuklanishi | Ochiq katalog 100 tadan; qidiruv va kategoriya filtri serverda; “Yana yuklash” tugmasi |
| Katta ishchi javoblar | Workspace’da bizneslar, foydalanuvchilar, mahsulotlar va kategoriyalar 200 tadan uzatiladi. Hozirgi editor ularni sahifalar bo‘yicha yig‘adi |
| Statistikani yangi sessiyalar bilan oshirish | Tashrif/bosilish uchun bazadagi qisqa takrorlash oynasi va IP limiti |
| Ochiq API’da hisob ma’lumotlari | Ochiq biznes javobidan owner/account ID, tarif, obuna sanalari olib tashlandi |
| Rasm orqali zararli yoki keraksiz ma’lumot saqlash | Faqat JPEG/PNG/WebP dekoderlari, o‘lcham/hajm tekshiruvi, qayta kodlash, metadata va qo‘shimcha payloadni olib tashlash |
| Media’dan tasodifiy fayl ochish | Faqat `uploads/<32 hex>.jpg/png/webp` ruxsat etiladi |
| Juda katta yoki noto‘g‘ri so‘rov | Next proksi oqimni o‘qishda ham 12 MB limit qo‘yadi; Django limiti, noto‘g‘ri JSON/turlar nazorati saqlandi |
| CSRF va sessiya | CSRF o‘chirilmagan; HttpOnly, SameSite va production Secure cookie saqlandi |
| Ishonchsiz forwarded IP | Faqat maxfiy ichki proksi tokeni bilan uzatilgan IP qabul qilinadi. Oddiy X-Forwarded-For qabul qilinmaydi |
| Brauzer himoya headerlari | CSP base/object/frame/form cheklovlari, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, production HSTS |
| Production’da xavfli sozlamalar | DEBUG standart qiymati 0; zaif kalit, yo‘q proksi kaliti, wildcard host yoki insecure cookie bilan production ishga tushmaydi |
| Django admin loginini taxmin qilish | Admin POST so‘rovlari uchun server cheklovi |
| Eskirgan bog‘liqliklar | Next 16.4.1, React/RSC 19.2.8, Zod 4.6.6, Pillow 13 va lockfile’dagi tuzatilgan transitiv bog‘liqliklar |

Bu ro‘yxat ushbu paketda bajarilgan ishlar ro‘yxati. Suhbatda tilga olingan avvalgi 20 bandli hujjatning to‘liq matni ilovada yo‘q edi; u bilan bandma-band bir xillik da’vo qilinmaydi.

## Tekshiruvlar

| Tekshiruv | Natija |
|---|---|
| Django testlari | 77/77 |
| Frontend testlari | 23/23 |
| TypeScript | Xatosiz |
| Next production build | Muvaffaqiyatli |
| Vinext build (`pnpm build`) | Muvaffaqiyatli |
| ESLint | 0 xato, 37 ogohlantirish |
| npm audit — production va development | 0 ma’lum zaiflik |
| Python requirements auditi | 0 ma’lum zaiflik |
| Mustaqil jarayonlarda cheklov | 8 jarayondan aynan 3 tasi ruxsat oldi |
| Parallel saqlash | Bir xil revision bilan bir so‘rov 200, ikkinchisi 409 |
| Haqiqiy Next → Django HTTP | Cookie, CSRF, login, til, 409 va null-parol tekshiruvlari o‘tdi |
| SQLite backup | Alohida test bazasida nusxa va `integrity_check` muvaffaqiyatli |
| Migratsiyalar | Yetishmayotgan o‘zgarish aniqlanmadi |

Audit — ishlatilgan ma’lumotlar bazasida ayni tekshiruv vaqtida topilgan zaifliklar haqida. U kelajakdagi yoki hali e’lon qilinmagan zaifliklarni yo‘q deb kafolatlamaydi. Natijalar `evidence/` papkasida.

`manage.py check --deploy` 3 ta ogohlantirish beradi: HSTS subdomain va preload o‘chirilgan; HTTPS redirect Railway edge’da bajariladi. Bular yashirilmagan. Boshqa hostingda butun ommaviy sayt uchun HTTPS redirectni alohida sozlang. Subdomain/preloadni barcha subdomainlar HTTPS bilan tayyor bo‘lgandagina yoqing.

Brauzerning vizual/interaktiv testi bajarilmadi: muhitda Chromium yo‘q, yuklash esa yaroqsiz arxiv qaytardi. Real HTTP integratsiya va render/build testlari bajarildi. Mobil/desktop UI’ni staging’da tekshirish kerak.

## Muhim amaliy chegaralar

- Bu paket “barcha hujumlardan 100% himoya” kafolati emas. Production infratuzilmasi, real email, katta yuklama va PostgreSQL alohida tekshirilishi kerak.
- DDoS trafik bazaga yetmasidan Railway/Cloudflare yoki boshqa edge qatlamida to‘xtatilishi kerak. Ilovadagi cheklov buning to‘liq o‘rnini bosmaydi.
- Django’ni bitta konteynerda faqat loopback’da yoki yopiq private network’da qoldiring. Ommaviy kirish Next/edge orqali bo‘lsin. `backend/start.sh` alohida xizmat uchun 0.0.0.0’da tinglaydi: uni public domain’ga ochmang.
- `TRUSTED_CLIENT_IP_HEADER` noto‘g‘ri yoki bo‘sh bo‘lsa, proksi ortidagi tashrifchilar umumiy manzilga birlashib, bir-birining limitiga ta’sir qilishi mumkin. Railway misolida `x-real-ip` sozlangan. O‘z ingressingizda foydalanuvchi yuborgan header qayta yozilishini tekshiring.
- IP bo‘yicha 10 soniyalik analitika deduplikatsiyasi bitta NAT ortidagi ayrim haqiqiy tashriflarni ham birlashtirishi mumkin. Bu tashriflar mutlaq aniqligi yoki botlardan to‘liq himoya degani emas.
- Workspace transporti sahifalangan, lekin editor hali barcha mahsulotlarni mijoz xotirasida yig‘adi. Juda katta katalog uchun keyingi qadam — editorni faqat ochilgan sahifani yuklaydigan holatga o‘tkazish. OFFSET paging parallel qo‘shish/o‘chirish paytida mutlaq barqaror snapshot emas; revision nazorati eski yozuv bilan saqlashni to‘xtatadi.
- SQLite’da yozuvlar ketma-ket bajariladi. Yuqori trafikda PostgreSQLga o‘tish va yuklama testi kerak. Global workspace yozish qulfi xavfsiz saqlashni ta’minlaydi, lekin yozish throughput’ini cheklaydi.
- Hozir CSP bazaviy cheklovlar bilan berilgan; nonce asosidagi to‘liq script siyosati, MFA va bot challenge bu paketda qo‘shilmagan.
- Eski media fayllari qayta kodlanmagan. Faqat yangi yuklamalar qayta kodlanadi. Eski fayllarni ko‘chirishdan oldin nomlari yangi allow-listga mosligini tekshiring.

## Texnik xizmat va zaxira

Har kuni backend muhitida:

```bash
python manage.py security_cleanup
```

Baza nusxasi (mavjud fayl ustidan yozmaydi; media ichiga saqlashni taqiqlaydi; ruxsat 0600):

```bash
python manage.py backup_sqlite /data/private-backups/vitrix-YYYY-MM-DD.sqlite3
```

Papka oldindan yaratilgan va faqat administrator uchun ochiq bo‘lsin. Nusxani shu serverdan tashqaridagi yopiq saqlashga ko‘chiring; `/data/media`ni ham alohida zaxiralang. DB va rasmlar bir vaqtning izchil nusxasi bo‘lishi kerak bo‘lsa, ikkalasini olish davomida yozishni maintenance rejimida to‘xtating.

Tiklash mashqi: production faylini almashtirmasdan yangi alohida SQLite yo‘lida nusxani oching; `PRAGMA integrity_check`, foydalanuvchi/biznes/mahsulot sonlari, rasmlar va loginni staging’da tekshiring. Shundan keyingina maintenance oynasida tiklash mumkin. Real production bazasi bilan tiklash mashqi bu ishda bajarilmadi.

Mahalliy testlar:

```bash
DJANGO_DEBUG=1 python backend/manage.py test accounts
DJANGO_DEBUG=1 python scripts/security-concurrency.py
pnpm typecheck
pnpm test
pnpm lint
pnpm build:next
pnpm audit
pip-audit -r backend/requirements.txt
```

HTTP test: alohida staging hisob bilan `SECURITY_TEST_URL`, `SECURITY_TEST_USERNAME`, `SECURITY_TEST_PASSWORD`ni vaqtinchalik sozlab `node scripts/security-http.mjs`ni ishga tushiring. Test biznes nomiga ` check` qo‘shadi, shuning uchun faqat tashlab yuboriladigan test hisobidan foydalaning.

Manbalar: [Django security](https://docs.djangoproject.com/en/5.2/topics/security/), [Django deployment checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/), [Railway public networking](https://docs.railway.com/networking/public-networking/specs-and-limits). Bog‘liqliklar npm audit va pip-audit orqali tekshirildi.
