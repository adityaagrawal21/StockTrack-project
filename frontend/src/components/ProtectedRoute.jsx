import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "staff" ? "/inventory" : "/dashboard"} replace />;
  }

  // Render children (for inline use) or Outlet (for route wrapping)
  return children ? children : <Outlet />;
}
