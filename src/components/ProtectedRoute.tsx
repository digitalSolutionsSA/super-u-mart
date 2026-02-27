import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAdminAuth();

  if (!user) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}