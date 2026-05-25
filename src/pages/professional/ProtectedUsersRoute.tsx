import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedUsersRoute = ({ children }) => {
  const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
  const professionalUser = JSON.parse(localStorage.getItem("professionalUser"));

  const canAccess =
    professionalHeaders?.["x-db-name"] ===
    professionalHeaders?.loginuser;

  if (!canAccess) {
    return <Navigate to="/professional" replace />;
  }

  return children;
};

export default ProtectedUsersRoute;