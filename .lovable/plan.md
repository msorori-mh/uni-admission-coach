

## إصلاح مشكلة تكرار ظهور صفحة الدخول

### المشكلة الجذرية
كل صفحة (Dashboard, LessonDetail, Admin pages...) تتحقق من الجلسة بشكل مستقل عند كل تحميل. عند التنقل بين الصفحات، يُعاد التحقق من الجلسة في كل مرة. إذا أطلق `onAuthStateChange` حدث `INITIAL_SESSION` قبل استعادة الجلسة من التخزين، يتم إعادة التوجيه إلى `/login` بشكل خاطئ.

```text
المستخدم يفتح /dashboard
→ onAuthStateChange يطلق INITIAL_SESSION مع session=null
→ navigate("/login") ← خطأ!
→ getSession يستعيد الجلسة بعد ذلك ← متأخر
```

### الحل: مركزة حالة المصادقة في Context واحد

**1. إنشاء ملف `src/contexts/AuthContext.tsx`**
- إنشاء React Context يحتوي على حالة المصادقة (user, roles, loading, isAdmin, isModerator, isStaff)
- التحقق من الجلسة **مرة واحدة فقط** عند تحميل التطبيق عبر `getSession`
- الاستماع لتغييرات المصادقة عبر `onAuthStateChange` مع تجاهل `INITIAL_SESSION` (لأن `getSession` يتولى ذلك)
- توفير hook `useAuthContext()` للاستخدام في الصفحات

**2. تعديل `src/App.tsx`**
- لف التطبيق بـ `AuthProvider`
- إضافة مكون `AuthGate` يعرض شاشة تحميل حتى تتم استعادة الجلسة

**3. تعديل `src/hooks/useAuth.ts`**
- تحويله ليقرأ من AuthContext بدلاً من التحقق المستقل
- الإبقاء على منطق `requiredRole` للتوجيه حسب الصلاحيات
- إزالة استدعاءات `getSession` و `onAuthStateChange` المكررة

**4. تعديل `src/pages/Dashboard.tsx`**
- إزالة كود التحقق من الجلسة المضمّن (سطور 45-49) واستخدام `useAuthContext()` بدلاً منه
- الإبقاء على باقي منطق جلب البيانات كما هو

**5. تعديل باقي الصفحات التي تستخدم `supabase.auth` مباشرة**
- مراجعة الصفحات التي تتحقق من الجلسة بشكل مستقل وتحويلها لاستخدام Context

### النتيجة
- التحقق من الجلسة يتم **مرة واحدة** عند فتح التطبيق
- التنقل بين الصفحات لا يعيد التحقق
- لا يظهر شاشة الدخول للمستخدم الذي سبق له تسجيل الدخول

