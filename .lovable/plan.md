

# خطة تحديث الهوية البصرية: من "مفاضلة" إلى "قَبُول | Qubool"

## ملخص
تغيير الاسم والألوان والشعارات في جميع واجهات التطبيق لتعكس الهوية الجديدة.

---

## التغييرات المطلوبة

### 1. تحديث لوحة الألوان (`src/index.css`)
- **الأزرق الداكن الرسمي** `#1A237E` → يصبح اللون الأساسي (primary) بدلاً من الأزرق الحالي
- **أخضر النجاح** `#2E7D32` → يصبح لون accent/success
- تحديث جميع المتغيرات في الوضع الفاتح والمظلم
- تحديث الـ gradients (gradient-primary, gradient-hero, text-gradient)

### 2. استبدال الاسم في جميع الملفات
استبدال كل ذكر لـ "مفاضلة" بـ "قَبُول" في الملفات التالية:
- `index.html` — العنوان والوصف والـ meta tags
- `src/pages/Index.tsx` — العنوان الرئيسي + الشعار اللفظي + الفوتر
- `src/pages/Login.tsx` — شعار صفحة الدخول
- `src/pages/Register.tsx` — شعار صفحة التسجيل
- `src/pages/Dashboard.tsx` — الهيدر
- `src/pages/Notifications.tsx` — الهيدر
- `src/pages/StudentProfile.tsx` — الهيدر
- `src/pages/ExamSimulator.tsx` — النص الوصفي
- `src/components/admin/AdminLayout.tsx` — الشريط الجانبي
- `src/components/ChatWidget.tsx` — اسم المساعد "مساعد قَبُول"
- `supabase/functions/chat/index.ts` — System Prompt
- `src/main.tsx` — تغيير storageKey من `mufadala-theme` إلى `qubool-theme`

### 3. تحديث الشعار اللفظي
في صفحة Index (Hero):
- العنوان: **قَبُول**
- الوصف: **"قَبُول.. خطوتك الأولى نحو كليات القمة."**

### 4. إضافة شعارات ثابتة حسب الواجهة
- صفحة الاختبارات: "تدرب بذكاء.. لتضمن القبول."
- صفحة الاشتراك: "لأن المقاعد محدودة.. 'قَبُول' هو سلاحك للتفوق."
- الداشبورد: شريط علوي يعرض رسالة تحفيزية عشوائية

---

## الملفات المتأثرة (13 ملف)
`index.html`, `src/index.css`, `src/main.tsx`, `src/pages/Index.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Notifications.tsx`, `src/pages/StudentProfile.tsx`, `src/pages/ExamSimulator.tsx`, `src/components/admin/AdminLayout.tsx`, `src/components/ChatWidget.tsx`, `supabase/functions/chat/index.ts`

---

## ملاحظات تقنية
- الخط Cairo موجود بالفعل — لا يحتاج تغيير
- الوضع المظلم (Dark Mode) موجود — سيتم تحديث ألوانه ليتوافق مع اللوحة الجديدة
- لن يتم تغيير أي منطق برمجي، فقط النصوص والألوان

