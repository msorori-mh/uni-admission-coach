import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive: boolean;
  isPending: boolean;
  expiresAt: string | null;
  loading: boolean;
}

export const useSubscription = (userId: string | undefined): SubscriptionStatus => {
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasSubscription: false, isActive: false, isPending: false,
    expiresAt: null, loading: true,
  });

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const sub = data[0];
          const isActive = sub.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
          setStatus({
            hasSubscription: true,
            isActive,
            isPending: sub.status === "pending",
            expiresAt: sub.expires_at,
            loading: false,
          });
        } else {
          setStatus((prev) => ({ ...prev, loading: false }));
        }
      });
  }, [userId]);

  return status;
};
