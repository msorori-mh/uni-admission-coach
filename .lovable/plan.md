

## تعديل مسمى حقل "اسم صاحب الحساب"

### التغيير
في ملف `src/pages/admin/AdminPaymentMethods.tsx` سطر 313، تعديل الشرط بحيث عندما يكون النوع `bank` يظهر النص "ايداع الى حساب" بدلاً من "اسم صاحب الحساب":

```
{type === "network_transfer" ? "تحويل بأسم (اسم المستلم)" : type === "bank" ? "ايداع الى حساب" : "اسم صاحب الحساب"}
```

### الملفات المتأثرة
- `src/pages/admin/AdminPaymentMethods.tsx` — تغيير label واحد فقط

