import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    // Redirect to login page if user is not authenticated
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
