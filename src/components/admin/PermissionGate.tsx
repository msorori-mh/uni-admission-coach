import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useModeratorPermissions, type ModeratorPermission } from "@/hooks/useModeratorPermissions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PermissionGateProps {
  permission: ModeratorPermission;
  children: React.ReactNode;
}

const PermissionGate = ({ permission, children }: PermissionGateProps) => {
  const { user, isAdmin } = useAuth("moderator");
  const { loading, hasPermission } = useModeratorPermissions(user?.id, isAdmin);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !hasPermission(permission)) {
      toast({ variant: "destructive", title: "غير مصرح لك بالوصول إلى هذه الصفحة" });
      navigate("/admin", { replace: true });
    }
  }, [loading, permission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission(permission)) return null;

  return <>{children}</>;
};

export default PermissionGate;
