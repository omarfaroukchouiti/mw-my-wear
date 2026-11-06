# الرفع إلى GitHub ثم Vercel

هذا الدليل موجز ومقصود: نفّذ الأوامر بالترتيب.

## 1) ثبّت Git (مرة واحدة)

على Windows:

```powershell
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
```

أغلق نافذة الطرفية وافتحها من جديد، ثم تأكد:

```powershell
git --version
```

## 2) أنشئ المستودع على GitHub

- افتح <https://github.com/new>
- الاسم المقترح: `mw-my-wear`
- اختر **Private** أو **Public**
- **لا** تضف README أو .gitignore أو License (المشروع يحتويها بالفعل)

## 3) ارفع المشروع

من داخل مجلد النسخة النظيفة `mw-git`:

```powershell
cd "C:\Users\Omar Farouk\Documents\Default Project\mw-git"

git init
git add .
git commit -m "Initial commit: MW — My Wear storefront"
git branch -M main
git remote add origin https://github.com/USERNAME/mw-my-wear.git
git push -u origin main
```

استبدل `USERNAME` باسم حسابك على GitHub.

> إن ظهر طلب تسجيل الدخول، استخدم المتصفح أو Personal Access Token. لا تضع كلمة مرورك في أي ملف.

## 4) انشر على Vercel

1. افتح <https://vercel.com/new> واختر **Import Git Repository**.
2. اختر مستودع `mw-my-wear`.
3. اترك إعدادات Next.js كما هي (Build Command: `npm run build`).
4. أضف متغيرات البيئة من **Settings → Environment Variables** (Production وPreview):

| المتغير | مطلوب |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | لا — اتركه فارغاً لاستخدام دومين Vercel المجاني، أو اضبطه عند ربط دومين مخصص |
| `SITE_URL` | اسم قديم اختياري، ما زال مدعوماً |
| `SUPABASE_URL` | نعم لاستقبال الطلبات |
| `SUPABASE_SERVICE_ROLE_KEY` | نعم — سرّي، خادمي فقط |
| `ADMIN_PASSWORD` | نعم للوحة الإدارة |
| `ADMIN_SECRET` | نعم — 32 حرفاً عشوائياً على الأقل |
| `ADMIN_SESSION_HOURS` | اختياري |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | اختياري لكن موصى به |

5. اضغط **Deploy**.
6. بعد ربط الدومين النهائي، حدّث `NEXT_PUBLIC_SITE_URL` ثم أعد النشر.

## تحذيرات

- **لا ترفع `.env.local`** ولا أي ملف يحتوي مفاتيح حقيقية. النسخة النظيفة تستثنيه، و`.gitignore` يمنع إضافته.
- `SUPABASE_SERVICE_ROLE_KEY` و`ADMIN_SECRET` و`ADMIN_PASSWORD` أسرار خادمية: لا تضعها في `NEXT_PUBLIC_*` ولا في أي كود يعمل في المتصفح.
- الصور/الخطوط/الشعار تُرفع مع المستودع؛ لا حاجة لخدمة تخزين خارجية لها.
