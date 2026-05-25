import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When true, user must have `is_verified` (same as engagement). */
  requireVerified?: boolean;
}

export function ProtectedRoute({
  children,
  requireVerified = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-ink-2 text-sm">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated || (requireVerified && !isVerified)) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return children;
}
