# VITRIX — xavfsizlik va Digital Clarity yangilanishi

Avval quyidagi tartibda yangilang. Mavjud hisoblar, mahsulotlar, tariflar va obuna muddatlari saqlanadi. Ushbu ZIP serverga avtomatik deploy qilinmagan.

## 1. Mavjud bazani zaxiralash

Eski image’da ham ishlaydigan backup — Railway SSH’da:

```bash
/opt/venv/bin/python - <<'PYBACKUP'
import os,sqlite3,shutil
from pathlib import Path
source=Path(os.environ.get('DATABASE_PATH','/data/db.sqlite3'))
media=Path(os.environ.get('MEDIA_ROOT','/data/media'))
target=Path('/data/backups/before-hardening')
if not source.is_file(): raise SystemExit('Baza topilmadi: DATABASE_PATH ni tekshiring')
target.mkdir(parents=True,exist_ok=False)
with sqlite3.connect(source) as src,sqlite3.connect(target/'db.sqlite3') as dst:
    src.backup(dst)
    assert dst.execute('pragma integrity_check').fetchone()[0]=='ok'
if media.exists(): shutil.copytree(media,target/'media')
print('Backup va integrity tekshiruvi tayyor')
PYBACKUP
```

Backup manzili oldindan mavjud bo‘lsa, yangi nom tanlang. Uni konteynerdan tashqarida ham saqlang. Faol SQLite faylini oddiy `cp` bilan ko‘chirish yetarli emas. Yangi koddagi `backup_sqlite` va `verify_backup` buyruqlari keyingi zaxiralar uchun SHA256 manifest ham yaratadi. Backup ustiga production bazani yozishdan avval alohida nusxada tiklashni mashq qiling.

`audit_identities` yangi koddagi preflight buyrug‘i. Uni yangi kod nusxasida mavjud bazaning backupi bilan ishga tushiring. Eski image’da dublikatlar sonini Django shell orqali ham tekshirish mumkin:

```bash
cd /app/backend
/opt/venv/bin/python manage.py shell -c "from django.contrib.auth import get_user_model; from django.db.models import Count; from django.db.models.functions import Lower; U=get_user_model(); print({f:U.objects.exclude(**{f:''}).annotate(k=Lower(f)).values('k').annotate(n=Count('id')).filter(n__gt=1).count() for f in ['username','email']})"
```

Ikkala natija ham 0 bo‘lishi kerak.

`audit_identities` dublikat topsa, migratsiyani boshlamang. Hisob egasi bilan to‘g‘ri email/username’ni aniqlab, dublikatni ongli ravishda tuzating. Dastur hisoblarni avtomatik birlashtirmaydi yoki o‘chirmaydi.

## 2. Kod va Railway

- GitHub loyihangizga paketdagi kodni yangilang. O‘zingizning `.env`, Gmail OAuth va boshqa maxfiy fayllaringizni yubormang. Mavjud Railway Variables’ni saqlang.
- Railway Volume `/data`ga mount bo‘lsin. `DATABASE_PATH=/data/db.sqlite3`, `MEDIA_ROOT=/data/media`.
- `PORT=8080`, `DJANGO_API_URL=http://127.0.0.1:9000`. Bu bitta konteyner ichidagi Django manzili; public domen HTTPS bo‘lib qoladi.
- Root `Dockerfile` orqali build. Alohida Start Command’ni o‘rniga image’dagi `scripts/start-all.sh` ishlasin. U migratsiya, static, media Nginx, Django va Next’ni boshlaydi.
- `DJANGO_DEBUG=0`, kuchli mavjud `DJANGO_SECRET_KEY`, to‘g‘ri `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` va `FRONTEND_URL` bo‘lsin.
- `TRUST_PROXY_IP=0` standart. Ingress X-Forwarded-For’ni ishonchli almashtirishini tekshirmasdan uni 1 qilmang. Account limiter bu sozlamasiz ham server bazasida ishlaydi.

0008 migratsiya revision, limiter, dizayn tarixi va slug tarixini qo‘shadi. 0009 case-insensitive identity index qo‘shadi. 0010 eski avtomatik underscore manzillarni normallashtirib, eski havolalarni yo‘naltiradi. Eski dublikat bo‘lsa, u hisoblarni saqlagan holda xavfsiz to‘xtaydi. Oldin qo‘llangan 0007 Pro 49 000 / VIP 99 000 narxlarini saqlaydi; amaldagi obuna muddatlari qayta boshlanmaydi.

## 3. Gmail API va kirish

Ishlayotgan `EMAIL_BACKEND=accounts.gmail_backend.GmailAPIBackend`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `DEFAULT_FROM_EMAIL` qiymatlarini saqlang. `railway.env.example` faqat misol, haqiqiy Variables o‘rniga ko‘r-ko‘rona qo‘ymang. OAuth Testing token muddati cheklangan bo‘lishi mumkin; real yuborishni qayta tekshiring.

Mavjud administrator hisobingizdan foydalaning. Yangi o‘rnatishda:

```bash
cd /app/backend
/opt/venv/bin/python manage.py createsuperuser
```

Tayyor demo loginlar yoki production baza ZIPga qo‘shilmagan. `/login`da superuser hisobidan kirsangiz admin panel ochiladi.

## 4. Yangilangandan keyin tekshiring

Ro‘yxatdan o‘tish kodi, UZ/RU/EN xatlar, login/reset/logout, mahsulot qo‘shish/tahrirlash, kategoriyalar pageri, uch tilli public katalog, mahsulot havolasi, rasmlar, ikki oynadagi saqlash konflikti, dizayn tarixidan tiklash va Telegram arizasidan keyingi admin aktivatsiyasi.

Eski ochiq tabni to‘liq yangilang. Eski klient revision yubormasa saqlash 409 bilan to‘xtaydi; bu ma’lumotni ustiga yozishni oldini oladi.

## 5. Texnik xizmat

```bash
cd /app/backend
/opt/venv/bin/python manage.py cleanup_data
# Natijani ko‘rib, backupdan keyin:
/opt/venv/bin/python manage.py cleanup_data --apply
```

Kod va test tafsilotlari: `docs/AUDIT_CLOSURE.md`, `docs/QA_REPORT.md`. Brand hujjatlari: `docs/brand/`. Mahsulot tarjimalari avtomatik emas, UZ/RU/EN muharririda kiritiladi.
