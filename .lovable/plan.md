

## توقيع ملف APK للنشر على Google Play Store

هذه العملية تتم بالكامل على جهازك المحلي باستخدام Android Studio وأدوات Java. لا تحتاج تعديلات على الكود.

### الخطوات

**1. إنشاء مفتاح التوقيع (Keystore)**

افتح Terminal على جهازك ونفذ:
```bash
keytool -genkey -v -keystore mufadala-release.keystore -alias mufadala -keyalg RSA -keysize 2048 -validity 10000
```
سيطلب منك:
- كلمة مرور للـ Keystore (احفظها جيداً)
- اسمك، اسم المؤسسة، المدينة، الدولة

> **مهم جداً**: احتفظ بنسخة احتياطية من ملف `mufadala-release.keystore` وكلمة المرور. فقدانهما يعني عدم القدرة على تحديث التطبيق مستقبلاً.

**2. بناء APK موقّع من Android Studio**

1. افتح المشروع في Android Studio (`npx cap open android`)
2. اذهب إلى **Build → Generate Signed Bundle / APK**
3. اختر **APK** (أو **Android App Bundle** وهو الأفضل لـ Google Play)
4. اضغط **Next** واختر ملف الـ Keystore الذي أنشأته
5. أدخل كلمة المرور والـ Alias
6. اختر **release** كـ Build Variant
7. اضغط **Finish**

الملف الموقّع سيكون في:
```
android/app/release/app-release.apk
```

**3. النشر على Google Play (اختياري: App Bundle)**

Google Play يفضل **AAB** (Android App Bundle) بدلاً من APK:
- في الخطوة 3 أعلاه، اختر **Android App Bundle** بدلاً من APK
- الملف سيكون `app-release.aab`

**4. رفع التطبيق على Google Play Console**

1. أنشئ حساب مطور على [Google Play Console](https://play.google.com/console) (رسوم تسجيل $25 مرة واحدة)
2. أنشئ تطبيق جديد واملأ بيانات التطبيق (الاسم، الوصف، لقطات الشاشة، الأيقونة)
3. اذهب إلى **Release → Production → Create new release**
4. ارفع ملف AAB أو APK الموقّع
5. أكمل متطلبات المتجر (سياسة الخصوصية، تصنيف المحتوى، إلخ)
6. أرسل للمراجعة

### ملاحظات مهمة

- **Google Play App Signing**: عند رفع أول إصدار، يمكنك تفعيل "Google Play App Signing" ليقوم Google بإدارة مفتاح التوقيع النهائي (موصى به)
- **الحد الأدنى لـ targetSdkVersion**: Google Play يتطلب حالياً API 34 كحد أدنى
- **سياسة الخصوصية**: مطلوبة إذا كان التطبيق يجمع بيانات المستخدمين

