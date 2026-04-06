
## خطة: إضافة حماية الصلاحيات على مستوى الصفحات

### المشكلة
حالياً القائمة الجانبية تخفي العناصر بحسب الصلاحيات، لكن المشرف يمكنه الوصول لأي صفحة عبر كتابة الرابط مباشرة في المتصفح (مثلاً `/admin/payments`).

### الحل
إضافة تحقق من الصلاحية في كل صفحة أدمن فرعية. إذا لم يكن للمشرف الصلاحية المطلوبة، يتم إعادة توجيهه إلى `/admin` مع رسالة تنبيه.

### خطوات التنفيذ

#### 1. إنشاء مكوّن `PermissionGate`
مكوّن مشترك يتحقق من الصلاحية ويعيد التوجيه إذا لم تكن موجودة:
- يستقبل `permission` المطلوبة
- يستخدم `useModeratorPermissions` للتحقق
- يعرض رسالة "غير مصرح" ويعيد التوجيه إلى `/admin`

#### 2. تحديث الصفحات الفرعية
إضافة `PermissionGate` داخل كل صفحة:

| الصفحة | الصلاحية المطلوبة |
|--------|-------------------|
| AdminUniversities, AdminColleges, AdminMajors | `universities` |
| AdminStudents | `students` |
| AdminContent | `content` |
| AdminPayments | `payments` |
| AdminPaymentMethods | `payment_methods` |
| AdminSubscriptionPlans | `subscriptions` |
| جميع صفحات التقارير | `reports` |

**ملاحظة:** AdminDashboard لا تحتاج صلاحية خاصة (متاحة لجميع المشرفين). AdminUsers تبقى `useAuth("admin")` فقط.

### الملفات المتأثرة
- **جديد:** `src/components/admin/PermissionGate.tsx`
- **تعديل:** 12 صفحة أدمن فرعية - إضافة غلاف `PermissionGate`

### التفاصيل التقنية
- المكوّن يلتف حول محتوى الصفحة داخل `AdminLayout`
- الأدمن يتجاوز جميع التحققات تلقائياً (عبر `useModeratorPermissions`)
- يستخدم `useNavigate` + `toast` لإعلام المشرف وإعادة توجيهه
