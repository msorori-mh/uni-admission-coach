import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ModeratorScope {
  id: string;
  user_id: string;
  scope_type: "global" | "university" | "college" | "major";
  scope_id: string | null;
  is_global: boolean;
}

/**
 * Hook to fetch the current user's moderator scopes
 * and determine which major_ids they can access.
 * Admins always have full access.
 */
export const useModeratorScope = (
  userId: string | undefined,
  isAdmin: boolean,
  universities: { id: string }[],
  colleges: { id: string; university_id: string }[],
  majors: { id: string; college_id: string }[]
) => {
  const [scopes, setScopes] = useState<ModeratorScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (isAdmin) {
      setIsGlobal(true);
      setLoading(false);
      return;
    }

    supabase
      .from("moderator_scopes")
      .select("*")
      .eq("user_id", userId)
      .then(({ data }) => {
        const items = (data || []) as ModeratorScope[];
        setScopes(items);
        setIsGlobal(items.some((s) => s.is_global));
        setLoading(false);
      });
  }, [userId, isAdmin]);

  /** Returns the set of major IDs this moderator can access */
  const getAllowedMajorIds = (): Set<string> | null => {
    if (isAdmin || isGlobal) return null; // null = no restriction

    const ids = new Set<string>();
    scopes.forEach((scope) => {
      if (scope.scope_type === "major" && scope.scope_id) {
        ids.add(scope.scope_id);
      } else if (scope.scope_type === "college" && scope.scope_id) {
        majors.filter((m) => m.college_id === scope.scope_id).forEach((m) => ids.add(m.id));
      } else if (scope.scope_type === "university" && scope.scope_id) {
        const collegeIds = colleges.filter((c) => c.university_id === scope.scope_id).map((c) => c.id);
        majors.filter((m) => collegeIds.includes(m.college_id)).forEach((m) => ids.add(m.id));
      }
    });
    return ids;
  };

  return { scopes, loading: loading, isGlobal, getAllowedMajorIds };
};
