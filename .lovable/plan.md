

# خطة إلغاء تسجيل الدخول نهائياً - تسجيل مباشر بدون OTP

## الفكرة
الطالب يفتح التطبيق → يرى Landing Page → يضغط "ابدأ الآن" → يملأ بياناته الأساسية → يدخل مباشرة إلى لوحة التحكم. بدون أي OTP أو تحقق أو تسجيل دخول.

خلف الكواليس: يتم إنشاء حساب تلقائي (بإيميل وهمي مبني على رقم الجوال) للحفاظ على ربط البيانات بالاشتراكات والاختبارات والدفعات.

## التغييرات المطلوبة

### 1. إنشاء Edge Function جديدة: `register-student`
- تستقبل بيانات الطالب (الاسم، اللقب، الجوال، المحافظة، الجامعة، الكلية)
- تنشئ حساب Auth تلقائي بإيميل وهمي (بدون OTP)
- تحدّث جدول `students` بالبيانات
- ترجع session tokens مباشرة
- لا حاجة لـ OTP نهائياً

### 2. إعادة بناء صفحة التسجيل `/register`
- إزالة كل منطق OTP (الخطوتين form/otp)
- نموذج واحد مباشر: الاسم + اللقب + الجوال + المحافظة + الجامعة + الكلية
- زر "ابدأ الآن" يرسل البيانات مباشرة إلى `register-student`
- عند النجاح: يتم تعيين الجلسة والتوجيه إلى `/dashboard` فوراً

### 3. حذف صفحة تسجيل الدخول `/login`
- حذف محتوى `Login.tsx` واستبداله بإعادة توجيه إلى `/register`
- أي رابط قديم يشير إلى `/login` سيوجه تلقائياً للتسجيل

### 4. تحديث `App.tsx`
- إبقاء route `/login` لكن يوجه إلى `/register`

### 5. تحديث صفحة `Index.tsx`
- التأكد أن زر "ابدأ الآن" يوجه إلى `/register`

### 6. تحديث `useAuth.ts`
- عند عدم وجود مستخدم: التوجيه إلى `/register` بدلاً من `/login`

## التفاصيل التقنية

### Edge Function `register-student`:
```
POST /register-student
Body: { phone, first_name, fourth_name, governorate, university_id, college_id }
Response: { success, session: { access_token, refresh_token } }
```

### الملفات المتأثرة:
- `supabase/functions/register-student/index.ts` — جديد
- `src/pages/Register.tsx` — إعادة بناء بدون OTP
- `src/pages/Login.tsx` — تحويل لإعادة توجيه
- `src/hooks/useAuth.ts` — توجيه إلى `/register`
- `src/App.tsx` — لا تغيير كبير

