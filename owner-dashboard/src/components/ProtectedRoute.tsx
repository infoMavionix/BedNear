
import { Navigate, Outlet, useLocation } from "react-router-dom";

type UserRole = "ADMIN" | "OWNER" | "CANDIDATE";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  const token =
    sessionStorage.getItem("bednear_token") ||
    sessionStorage.getItem("jwt") ||
    localStorage.getItem("bednear_token") ||
    localStorage.getItem("jwt");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  let role: UserRole | null = null;

  try {
    const storedUser =
      sessionStorage.getItem("bednear_user") ||
      localStorage.getItem("bednear_user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      if (
        user.role === "ADMIN" ||
        user.role === "OWNER" ||
        user.role === "CANDIDATE"
      ) {
        role = user.role;
      }
    }
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    if (role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    if (role === "OWNER") {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
