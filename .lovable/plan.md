

## خطة تجهيز التطبيق للعمل كتطبيق APK على الجوال

التطبيق لديه بالفعل إعداد Capacitor أساسي. الخطة تركز على إضافة ما ينقص لضمان تجربة أصلية بدون مشاكل.

---

### ما هو جاهز بالفعل
- Capacitor مُعَدّ مع `capacitor.config.ts`
- حزم `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, `@capacitor/splash-screen` مثبتة
- شريط التنقل السفلي للجوال موجود
- دعم Safe Area موجود في CSS

### ما سيتم إضافته

#### 1. إضافة مكتبة Status Bar
تثبيت `@capacitor/status-bar` لتنسيق شريط الحالة العلوي مع ألوان التطبيق (أزرق داكن `#1A237E`) وتعيين النص الأبيض.

#### 2. إنشاء ملف تهيئة Capacitor المركزي
إنشاء `src/lib/capacitor.ts` يحتوي على:
- ضبط لون Status Bar عند تشغيل التطبيق كتطبيق أصلي
- إخفاء Splash Screen بعد تحميل التطبيق
- كشف ما إذا كان التطبيق يعمل في بيئة أصلية (native)

#### 3. تفعيل التهيئة في `App.tsx`
استدعاء دالة التهيئة عند بدء التطبيق داخل `useEffect`.

#### 4. إخفاء مكوّن InstallAppPrompt في البيئة الأصلية
عند تشغيل التطبيق كـ APK، لا حاجة لعرض رسالة "ثبّت التطبيق" - سيتم إخفاؤها تلقائياً.

#### 5. تحسينات CSS للتطبيق الأصلي
- إضافة `padding-top` لـ Safe Area العلوية (status bar) لتجنب تداخل المحتوى
- التأكد من أن جميع العناصر الثابتة (bottom nav, overlays) تحترم مناطق الأمان

#### 6. تحديث `capacitor.config.ts`
إضافة إعدادات إضافية مثل:
- `backgroundColor` للتطبيق
- إعدادات Android للتعامل مع الروابط و keyboard

---

### ما يحتاج المستخدم فعله بعد التنفيذ
1. نقل المشروع إلى GitHub عبر زر "Export to Github"
2. `git pull` ثم `npm install`
3. `npx cap add android`
4. `npm run build && npx cap sync`
5. `npx cap run android` لتشغيل التطبيق على جهاز أو محاكي

