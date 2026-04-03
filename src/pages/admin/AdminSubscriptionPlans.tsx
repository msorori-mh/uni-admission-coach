import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  duration_type: string;
  duration_months: number;
  price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

const AdminSubscriptionPlans = () => {
  const { loading: authLoading } = useAuth("admin");
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationType, setDurationType] = useState("semester");
  const [durationMonths, setDurationMonths] = useState("5");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const fetchPlans = async () => {
    const { data } = await supabase.from("subscription_plans").select("*").order("sort_order");
    if (data) setPlans(data as Plan[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) fetchPlans();
  }, [authLoading]);

  const resetForm = () => {
    setName(""); setDescription(""); setDurationType("semester");
    setDurationMonths("5"); setPrice(""); setIsActive(true); setSortOrder("0");
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setName(p.name); setDescription(p.description || "");
    setDurationType(p.duration_type); setDurationMonths(p.duration_months.toString());
    setPrice(p.price.toString()); setIsActive(p.is_active);
    setSortOrder(p.sort_order.toString());
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price) {
      toast({ variant: "destructive", title: "يرجى ملء الحقول المطلوبة" });
      return;
    }
    setSaving(true);
    const payload = {
      name, description, duration_type: durationType,
      duration_months: Number(durationMonths), price: Number(price),
      currency: "YER", is_active: isActive, sort_order: Number(sortOrder),
    };

    const { error } = editing
      ? await supabase.from("subscription_plans").update(payload).eq("id", editing.id)
      : await supabase.from("subscription_plans").insert(payload);

    if (error) toast({ variant: "destructive", title: error.message });
    else { toast({ title: editing ? "تم التحديث" : "تمت الإضافة" }); setDialogOpen(false); fetchPlans(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: error.message });
    else { toast({ title: "تم الحذف" }); fetchPlans(); }
  };

  if (authLoading || loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">خطط الاشتراك</h1>
            <p className="text-sm text-muted-foreground">{plans.length} خطة</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 ml-1" /> إضافة خطة</Button>
        </div>

        <div className="space-y-2">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "مفعلة" : "معطلة"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.price.toLocaleString()} {p.currency} • {p.duration_months} شهر
                      ({p.duration_type === "semester" ? "فصلي" : "سنوي"})
                    </p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد خطط اشتراك بعد</p>}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "تعديل الخطة" : "إضافة خطة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم الخطة *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: اشتراك فصلي" /></div>
            <div className="space-y-2"><Label>الوصف</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع المدة *</Label>
                <select value={durationType} onChange={(e) => setDurationType(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="semester">فصلي</option>
                  <option value="annual">سنوي</option>
                </select>
              </div>
              <div className="space-y-2"><Label>المدة (أشهر) *</Label><Input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>السعر (ريال) *</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
              <div className="space-y-2"><Label>الترتيب</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>مفعلة</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubscriptionPlans;
