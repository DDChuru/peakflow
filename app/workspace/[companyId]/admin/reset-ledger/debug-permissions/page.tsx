'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

export default function DebugPermissionsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { user } = useAuth();

  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserDoc(userDocSnap.data());
        } else {
          toast.error('User document not found');
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        toast.error(`Failed to load user data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute requireCompany>
        <WorkspaceLayout title="Debug Permissions" companyId={companyId}>
          <div>Loading...</div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout title="Debug Permissions" companyId={companyId}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Current User Information</h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">User ID:</dt>
                <dd className="font-mono text-xs">{user?.uid}</dd>
              </div>

              <div>
                <dt className="font-medium text-muted-foreground">Email:</dt>
                <dd>{user?.email}</dd>
              </div>

              <div>
                <dt className="font-medium text-muted-foreground">Roles:</dt>
                <dd className="font-mono text-xs">
                  {userDoc?.roles ? JSON.stringify(userDoc.roles) : 'None'}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-muted-foreground">Company ID:</dt>
                <dd className="font-mono text-xs">{userDoc?.companyId || 'None'}</dd>
              </div>

              <div>
                <dt className="font-medium text-muted-foreground">Accessible Company IDs:</dt>
                <dd className="font-mono text-xs">
                  {userDoc?.accessibleCompanyIds ? JSON.stringify(userDoc.accessibleCompanyIds) : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Permission Check</h2>

            <div className="space-y-3">
              {userDoc?.roles?.includes('admin') || userDoc?.roles?.includes('developer') ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                  <div className="text-sm">
                    <p className="font-semibold text-green-900 dark:text-green-100">✅ Has Admin/Developer Role</p>
                    <p className="text-green-800 dark:text-green-200 mt-1">
                      You have the required role to delete journal entries.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded border border-destructive">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">❌ Missing Admin/Developer Role</p>
                    <p className="text-destructive/90 mt-1">
                      Your user account doesn't have the 'admin' or 'developer' role.
                      The Firestore rules require <code className="bg-muted px-1 py-0.5 rounded">canManageCompanies()</code> which checks for these roles.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-muted/50 rounded text-sm">
                <p className="font-semibold mb-2">Required Role for Deletion:</p>
                <pre className="text-xs overflow-x-auto">
{`function canManageCompanies() {
  return hasRole('admin') || hasRole('developer');
}`}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">How to Fix</h2>

            <div className="space-y-3 text-sm">
              <p>To enable deletion, you need to add the 'admin' or 'developer' role to your user account:</p>

              <div className="bg-muted/50 rounded p-3">
                <p className="font-semibold mb-2">Option 1: Firebase Console (Recommended)</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to Firebase Console → Firestore Database</li>
                  <li>Find the <code className="bg-muted px-1 py-0.5 rounded">users</code> collection</li>
                  <li>Open your user document (ID: {user?.uid})</li>
                  <li>Add a field: <code className="bg-muted px-1 py-0.5 rounded">roles</code> (array)</li>
                  <li>Add value: <code className="bg-muted px-1 py-0.5 rounded">admin</code></li>
                  <li>Save and refresh this page</li>
                </ol>
              </div>

              <div className="bg-muted/50 rounded p-3">
                <p className="font-semibold mb-2">Option 2: Manual Deletion (No Role Needed)</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to Firebase Console → Firestore Database</li>
                  <li>Delete all documents in <code className="bg-muted px-1 py-0.5 rounded">journal_entries</code></li>
                  <li>Delete all documents in <code className="bg-muted px-1 py-0.5 rounded">general_ledger</code></li>
                  <li>For each invoice in <code className="bg-muted px-1 py-0.5 rounded">companies/{companyId}/invoices</code>:</li>
                  <li className="ml-6">Remove fields: journalEntryId, postedDate, fiscalPeriodId</li>
                </ol>
              </div>
            </div>
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Refresh After Adding Role
          </Button>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
