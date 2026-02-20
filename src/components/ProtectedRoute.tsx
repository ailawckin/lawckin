import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin" | "lawyer" | "client";
}

const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [requireRole]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    if (requireRole) {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", requireRole)
        .maybeSingle();

      // Debug logging
      if (roleError) {
        console.error("Error checking role:", roleError);
      }
      console.log("Role check:", { requireRole, roleData, user_id: user.id });

      setHasRole(!!roleData);
    } else {
      setHasRole(true);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireRole && !hasRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
