import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "moderator" | "student";

export const useAuth = (requiredRole?: AppRole) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const processSession = (userId: string) => {
      // Fire-and-forget: no await inside onAuthStateChange
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .then(({ data }) => {
          const userRoles = (data || []).map((r) => r.role as AppRole);
          setRoles(userRoles);

          if (requiredRole && !userRoles.includes(requiredRole) && !userRoles.includes("admin")) {
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          // Check profile completeness for students only
          if (
            userRoles.includes("student") &&
            !userRoles.includes("admin") &&
            !userRoles.includes("moderator")
          ) {
            const currentPath = window.location.pathname;
            if (currentPath !== "/complete-profile") {
              supabase
                .from("students")
                .select("major_id")
                .eq("user_id", userId)
                .maybeSingle()
                .then(({ data: student }) => {
                  if (!student?.major_id && !localStorage.getItem("profile_skipped")) {
                    navigate("/complete-profile");
                  }
                  setLoading(false);
                });
              return;
            }
          }
          setLoading(false);
        });
    };

    // 1. Restore session from storage first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      processSession(session.user.id);
    });

    // 2. Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      // Re-process on sign-in events (not token refresh)
      if (_event === "SIGNED_IN") {
        processSession(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requiredRole]);

  const isAdmin = roles.includes("admin");
  const isModerator = roles.includes("moderator");
  const isStaff = isAdmin || isModerator;

  return { user, roles, loading, isAdmin, isModerator, isStaff };
};
