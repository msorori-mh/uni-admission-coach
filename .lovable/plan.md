

## خطة: نظام خطط اشتراك متعددة + أكواد الخصم + فترة التجربة

### الوضع الحالي
النظام يدعم خطة اشتراك واحدة فقط بسعر ثابت (حسب المنطقة). جدول `subscription_settings` يحتوي سعر واحد + عملة + وصف.

### التغييرات المطلوبة

#### 1. جدول `subscription_plans` (جديد - Migration)
```sql
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- "طبيب المستقبل"
  slug text NOT NULL UNIQUE,       -- "medical", "engineering", "vip", "free"
  description text DEFAULT '',
  features text[] DEFAULT '{}',    -- مصفوفة الميزات المعروضة
  price_zone_a numeric NOT NULL DEFAULT 0,
  price_zone_b numeric NOT NULL DEFAULT 0,
  price_default numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'YER',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  -- أي تخصصات يفتحها هذا الاشتراك (null = الكل مثل VIP)
  allowed_major_ids uuid[] DEFAULT NULL,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### 2. جدول `promo_codes` (جديد - Migration)
```sql
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 0,  -- 10 = 10%
  max_uses integer DEFAULT NULL,                -- null = غير محدود
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### 3. تحديث جدول `subscriptions`
```sql
ALTER TABLE public.subscriptions 
  ADD COLUMN plan_id uuid REFERENCES subscription_plans(id),
  ADD COLUMN trial_ends_at timestamptz DEFAULT NULL;
```

#### 4. إضافة عمود `promo_code_id` لـ `payment_requests`
```sql
ALTER TABLE public.payment_requests
  ADD COLUMN promo_code_id uuid REFERENCES promo_codes(id);
```

#### 5. دالة التجربة المجانية (24 ساعة)
Trigger عند تسجيل طالب جديد → إنشاء اشتراك تجريبي تلقائياً بمدة 24 ساعة (status = 'trial').

تحديث `has_active_subscription` ليشمل حالة trial.

### الملفات المتأثرة

#### صفحات جديدة/معدلة:
- **`AdminSubscriptionPlans.tsx`** — تحويل من إعدادات واحدة إلى CRUD لخطط متعددة + إدارة أكواد الخصم
- **`Subscription.tsx`** — عرض البطاقات (مجاني / طبي / هندسة / VIP) بدلاً من سعر واحد + حقل إدخال كود الخصم
- **`useSubscription.ts`** — إرجاع `planId` و `planSlug` + التحقق من trial

#### تحديث منطق الوصول:
- **`LessonDetail.tsx`** + **`LessonsList.tsx`** — التحقق من أن خطة الاشتراك تغطي تخصص الدرس (أو VIP)
- **دالة `has_active_subscription` في SQL** — تحديث لتشمل trial + التحقق من الخطة

### تفاصيل واجهة المستخدم

**صفحة الاشتراك (الطالب):**
- عرض 3-4 بطاقات أفقية (مجاني / طبي / هندسة / VIP) مع قائمة الميزات وسعر كل خطة
- حقل "كود الخصم" يظهر عند اختيار خطة → يطبق الخصم على السعر
- باقي التدفق كما هو (اختيار طريقة الدفع → رفع السند)
- شارة "تجربة مجانية" في الأعلى إذا كان الطالب في فترة التجربة

**صفحة الأدمن:**
- جدول لعرض الخطط مع إمكانية إضافة/تعديل/تعطيل
- تبويب ثاني لأكواد الخصم مع إنشاء/تعطيل + عرض عدد الاستخدامات

### ملاحظات
- الخطة المجانية (is_free=true) لا تحتاج دفع — الطالب يشترك فيها مباشرة
- `allowed_major_ids` تحدد أي تخصصات يفتحها الاشتراك. NULL = جميع التخصصات (VIP)
- فترة التجربة 24 ساعة تُمنح تلقائياً عند أول تسجيل فقط

