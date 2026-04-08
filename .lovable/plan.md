

## تشخيص المشكلة

المشكلة الجذرية في مكانين:

1. **`planCoversLesson` يبدأ بـ `true` افتراضياً** (سطر 44 في LessonDetail.tsx) — عندما يكون المستخدم في فترة تجريبية (trial) بدون `planId`، لا يتم تغيير هذه القيمة أبداً، فتبقى `true`
2. **الفترة التجريبية (24 ساعة) تُعامل كاشتراك نشط** — `isActive` يكون `true` أثناء التجربة، مما يعني `canAccess = true` لجميع الدروس

### سلسلة الخطأ:
```text
تسجيل جديد → trial تلقائي → hasActiveSubscription = true
→ planId = null → planCoversLesson يبقى true (الافتراضي)
→ canAccess = true → جميع الدروس مفتوحة!
```

## الإصلاح المطلوب

**ملف: `src/pages/LessonDetail.tsx`**
- تغيير القيمة الافتراضية لـ `planCoversLesson` إلى `false`
- تعديل منطق التحقق: عندما لا يوجد `planId` (اشتراك تجريبي بدون خطة)، يبقى `planCoversLesson = false` — أي لا يُفتح المحتوى المدفوع
- عندما يوجد `planId` ولكن بدون `allowed_major_ids` (أو المصفوفة فارغة)، يعني الخطة تغطي جميع التخصصات → `planCoversLesson = true`

**ملف: `src/pages/LessonsList.tsx`**
- تعديل منطق `isLocked` ليأخذ بعين الاعتبار أن الفترة التجريبية بدون خطة لا تفتح المحتوى المدفوع
- إضافة تحقق من `planId` و `allowed_major_ids` لتحديد الدروس المقفلة بدقة

**ملف: `src/hooks/useSubscription.ts`**
- إضافة خاصية `allowedMajorIds` إلى واجهة `SubscriptionStatus` لتسهيل التحقق في الصفحات
- جلب `allowed_major_ids` عند وجود `planId`

### النتيجة المتوقعة:
- الدروس المجانية (`is_free = true`) متاحة للجميع
- الدروس المدفوعة مقفلة ما لم يكن لدى المستخدم اشتراك نشط مع خطة تغطي تخصص الدرس
- الفترة التجريبية بدون خطة لا تفتح المحتوى المدفوع

