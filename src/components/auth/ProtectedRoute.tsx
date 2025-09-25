import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requireCompany?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  requireCompany = false,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const { user, company, loading, hasAnyRole } = useAuth();
  const router = useRouter();
  const hasNotified = useRef(false);

  const hasRequiredRole = useMemo(() => {
    if (requiredRoles.length === 0) return true;
    return hasAnyRole(requiredRoles);
  }, [hasAnyRole, requiredRoles]);

  const defaultFallback = (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-300 border-b-transparent" />
    </div>
  );

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (!hasNotified.current) {
        toast.error('Please sign in to continue');
        hasNotified.current = true;
      }
      router.replace(redirectTo);
      return;
    }

    if (!hasRequiredRole) {
      if (!hasNotified.current) {
        toast.error('You do not have permission to view that area');
        hasNotified.current = true;
      }
      router.replace('/unauthorized');
      return;
    }

    if (requireCompany && !company) {
      if (!hasNotified.current) {
        toast('Select or request access to a company to continue', { icon: '🏢' });
        hasNotified.current = true;
      }
      router.replace('/no-company');
    }
  }, [company, hasRequiredRole, loading, redirectTo, requireCompany, router, user]);

  if (loading || !user || !hasRequiredRole || (requireCompany && !company)) {
    return <>{fallback ?? defaultFallback}</>;
  }

  return <>{children}</>;
}
