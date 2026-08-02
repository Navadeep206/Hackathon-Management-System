import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();
  const location = useLocation();

  if (!token || !user) {
    // Redirect to login page and save previous page location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized role, redirect to forbidden page
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
