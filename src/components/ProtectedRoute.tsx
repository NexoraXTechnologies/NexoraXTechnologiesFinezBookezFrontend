import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // PROFESSIONAL LOGIN CHECK
  const professionalHeaders = localStorage.getItem("professionalHeaders");
  const isProfessionalLoggedIn = !!professionalHeaders;

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  // ---- If this route is for professionals only ---- //
  if (allowedRoles?.includes("Professional")) {
    if (!isProfessionalLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  // ---- Other (Admin/Employee) routes ---- //
  if (!token || !user)
    return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.type))
    return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;