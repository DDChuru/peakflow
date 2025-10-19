import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceAccessResult {
  canAccess: boolean;
  loading: boolean;
  error?: string;
  accessReason?: string;
}

/**
 * Hook to verify user has access to a specific company workspace
 *
 * Current implementation provides basic access control:
 * - Admins and developers have full access to all workspaces
 * - Users can access their own company workspace
 *
 * TODO (Phase 6 - Multi-Tenant Access Control):
 * - Implement team-based access with user.accessibleCompanyIds
 * - Add role-based permissions within workspace (viewer, editor, admin)
 * - Support invitation-based access for external users
 * - Add granular permissions for specific features within workspace
 * - Implement workspace access audit logging
 *
 * @param companyId - The company ID to check access for
 * @returns Object with canAccess flag, loading state, and optional error
 */
export function useWorkspaceAccess(companyId: string | undefined): WorkspaceAccessResult {
  const { user, loading: authLoading, hasRole } = useAuth();
  const [result, setResult] = useState<WorkspaceAccessResult>({
    canAccess: false,
    loading: true,
  });

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      setResult({ canAccess: false, loading: true });
      return;
    }

    // No user authenticated
    if (!user) {
      setResult({
        canAccess: false,
        loading: false,
        error: 'User not authenticated',
      });
      return;
    }

    // No company ID provided
    if (!companyId) {
      setResult({
        canAccess: false,
        loading: false,
        error: 'No company ID provided',
      });
      return;
    }

    // Check access permissions
    const checkAccess = () => {
      // Admins and developers have full access
      if (hasRole('admin') || hasRole('developer')) {
        return {
          canAccess: true,
          loading: false,
          accessReason: 'Administrator access',
        };
      }

      // Users can access their own company
      if (user.companyId === companyId) {
        return {
          canAccess: true,
          loading: false,
          accessReason: 'Own company access',
        };
      }

      if (user.accessibleCompanyIds?.includes(companyId)) {
        return {
          canAccess: true,
          loading: false,
          accessReason: 'Delegated company access',
        };
      }

      // No access
      return {
        canAccess: false,
        loading: false,
        error: 'You do not have access to this workspace',
      };
    };

    setResult(checkAccess());
  }, [user, authLoading, companyId, hasRole]);

  return result;
}
