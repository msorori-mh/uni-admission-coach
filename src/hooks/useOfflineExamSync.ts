import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPendingExamResults, removePendingResult } from "@/lib/offlineStorage";
import { useToast } from "@/hooks/use-toast";

export function useOfflineExamSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const { toast } = useToast();

  const syncPending = async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const pending = await getPendingExamResults();
      if (pending.length === 0) {
        setPendingCount(0);
        return;
      }

      let synced = 0;
      for (const result of pending) {
        try {
          const { error } = await supabase.functions.invoke("submit-exam", {
            body: { answers: result.answers },
          });
          if (!error) {
            await removePendingResult(result.id);
            synced++;
          }
        } catch {
          // Will retry next time
        }
      }

      const remaining = await getPendingExamResults();
      setPendingCount(remaining.length);

      if (synced > 0) {
        toast({
          title: "تمت المزامنة",
          description: `تم رفع ${synced} نتيجة اختبار محفوظة بنجاح`,
        });
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  };

  // Check pending count on mount
  useEffect(() => {
    getPendingExamResults().then((r) => setPendingCount(r.length)).catch(() => {});
  }, []);

  // Sync when coming back online
  useEffect(() => {
    const handler = () => syncPending();
    window.addEventListener("online", handler);
    // Also try on mount if online
    if (navigator.onLine) syncPending();
    return () => window.removeEventListener("online", handler);
  }, []);

  return { pendingCount, syncing, syncPending };
}
