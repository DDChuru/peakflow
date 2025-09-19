'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireCompany?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requireCompany = false,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, company, loading, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check if user has required roles
      if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        router.push('/unauthorized');
        return;
      }

      // Check if company is required
      if (requireCompany && !company) {
        router.push('/no-company');
        return;
      }
    }
  }, [user, company, loading, requiredRoles, requireCompany, redirectTo, router, hasAnyRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render children until checks pass
  if (!user) return null;
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) return null;
  if (requireCompany && !company) return null;

  return <>{children}</>;
}