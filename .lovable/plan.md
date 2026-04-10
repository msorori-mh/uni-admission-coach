

## خطة: إضافة شعار البنك/طريقة الدفع

### الملخص
إضافة حقل لرفع شعار (logo) لكل طريقة دفع من قبل الأدمن، وعرضه بجانب اسم طريقة الدفع في لوحة الإدارة وصفحة الاشتراك.

### التعديلات

**1. قاعدة البيانات:**
- إضافة عمود `logo_url text` إلى جدول `payment_methods`

**2. تخزين الملفات:**
- استخدام نفس bucket `payment-barcodes` الموجود (أو إنشاء bucket جديد `payment-logos`) لتخزين صور الشعارات

**3. صفحة إدارة طرق الدفع (`src/pages/admin/AdminPaymentMethods.tsx`):**
- إضافة `logo_url` للـ interface
- إضافة حقل رفع صورة الشعار في نموذج الإضافة/التعديل (مشابه لحقل الباركود)
- عرض الشعار بجانب اسم طريقة الدفع في كل بطاقة (صورة صغيرة 24x24 بكسل)

**4. صفحة الاشتراك (`src/pages/Subscription.tsx`):**
- تحديث interface `PaymentMethod` لتشمل `logo_url`
- عرض الشعار بجانب اسم طريقة الدفع عند عرض قائمة طرق الدفع

### الملفات المتأثرة
- `src/pages/admin/AdminPaymentMethods.tsx`
- `src/pages/Subscription.tsx`
- قاعدة البيانات (migration + storage bucket)

