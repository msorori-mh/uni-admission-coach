import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/register", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );
};

export default Login;
