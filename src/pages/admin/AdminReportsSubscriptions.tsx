import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Users, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: "12px" };

interface SubRow { id: string; user_id: string; status: string; }

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
  <Card><CardContent className="p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}><Icon className="w-5 h-5" /></div>
    <div><p className="text-xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
  </CardContent></Card>
);

const AdminReportsSubscriptions = () => {
  const { loading: authLoading } = useAuth("moderator");
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    Promise.all([
      supabase.from("subscriptions").select("id, user_id, status"),
      supabase.from("students").select("id", { count: "exact", head: true }),
    ]).then(([{ data: s }, { count }]) => {
      if (s) setSubs(s as SubRow[]);
      setStudentCount(count ?? 0);
      setLoading(false);
    });
  }, [authLoading]);

  if (authLoading || loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  const active = subs.filter((s) => s.status === "active").length;
  const pending = subs.filter((s) => s.status === "pending").length;
  const expired = subs.filter((s) => s.status === "expired").length;
  const cancelled = subs.filter((s) => s.status === "cancelled").length;
  const conversionRate = studentCount > 0 ? ((active / studentCount) * 100).toFixed(1) : "0";

  const statusData = [
    { name: "فعال", value: active, fill: "#10b981" },
    { name: "معلق", value: pending, fill: "#f59e0b" },
    { name: "منتهي", value: expired, fill: "#94a3b8" },
    { name: "ملغي", value: cancelled, fill: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div><h1 className="text-2xl font-bold text-foreground">تقارير الاشتراكات</h1><p className="text-sm text-muted-foreground">{subs.length} اشتراك • {active} فعال</p></div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="مشتركون فعالون" value={active} color="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" />
          <StatCard icon={TrendingUp} label="معدل التحويل" value={`${conversionRate}%`} sub="من التسجيل إلى الاشتراك" color="bg-primary/10 text-primary" />
        </div>
        {statusData.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-base">حالة الاشتراكات</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>{statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart></ResponsiveContainer></div></CardContent></Card>}
        {subs.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد بيانات اشتراكات بعد</p>}
      </div>
    </AdminLayout>
  );
};

export default AdminReportsSubscriptions;
