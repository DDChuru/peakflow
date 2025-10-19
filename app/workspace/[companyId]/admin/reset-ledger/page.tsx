'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ResetLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [isResetting, setIsResetting] = useState(false);
  const [stats, setStats] = useState<{
    journalEntries: number;
    ledgerEntries: number;
    invoicesReset: number;
  } | null>(null);

  const resetLedger = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE all journal entries and ledger entries, and reset all invoices to unposted status. Continue?')) {
      return;
    }

    if (!confirm('Are you ABSOLUTELY SURE? This cannot be undone!')) {
      return;
    }

    setIsResetting(true);
    const loadingToast = toast.loading('Resetting ledger...');

    try {
      const stats = {
        journalEntries: 0,
        ledgerEntries: 0,
        invoicesReset: 0
      };

      // Step 1: Delete all journal entries
      console.log('🗑️ Deleting journal entries...');
      const journalSnapshot = await getDocs(collection(db, 'journal_entries'));

      for (const journalDoc of journalSnapshot.docs) {
        await deleteDoc(journalDoc.ref);
        stats.journalEntries++;
      }

      console.log(`✅ Deleted ${stats.journalEntries} journal entries`);

      // Step 2: Delete all ledger entries
      console.log('🗑️ Deleting ledger entries...');
      const ledgerSnapshot = await getDocs(collection(db, 'general_ledger'));

      for (const ledgerDoc of ledgerSnapshot.docs) {
        await deleteDoc(ledgerDoc.ref);
        stats.ledgerEntries++;
      }

      console.log(`✅ Deleted ${stats.ledgerEntries} ledger entries`);

      // Step 3: Reset invoices for this company
      console.log('🧾 Resetting invoices...');
      const invoicesRef = collection(db, `companies/${companyId}/invoices`);
      const invoicesSnapshot = await getDocs(invoicesRef);

      const batch = writeBatch(db);
      let batchCount = 0;

      for (const invoiceDoc of invoicesSnapshot.docs) {
        const invoice = invoiceDoc.data();

        if (invoice.journalEntryId || invoice.postedDate || invoice.fiscalPeriodId) {
          batch.update(invoiceDoc.ref, {
            journalEntryId: null,
            postedDate: null,
            fiscalPeriodId: null,
            updatedAt: new Date()
          });

          stats.invoicesReset++;
          batchCount++;

          // Firestore batch limit is 500
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`✅ Reset ${stats.invoicesReset} invoices`);

      // Step 4: Reset debtor balances
      console.log('👥 Resetting debtor balances...');
      const debtorsRef = collection(db, 'debtors');
      const debtorsQuery = query(debtorsRef, where('companyId', '==', companyId));
      const debtorsSnapshot = await getDocs(debtorsQuery);

      const debtorBatch = writeBatch(db);
      let debtorBatchCount = 0;

      for (const debtorDoc of debtorsSnapshot.docs) {
        debtorBatch.update(debtorDoc.ref, {
          currentBalance: 0,
          overdueAmount: 0,
          updatedAt: new Date()
        });

        debtorBatchCount++;

        if (debtorBatchCount >= 500) {
          await debtorBatch.commit();
          debtorBatchCount = 0;
        }
      }

      if (debtorBatchCount > 0) {
        await debtorBatch.commit();
      }

      console.log('✅ Reset debtor balances');

      setStats(stats);
      toast.success('Ledger reset complete!', { id: loadingToast });

      // Refresh the page after 2 seconds to clear any cached data
      setTimeout(() => {
        router.push(`/workspace/${companyId}/invoices`);
      }, 2000);

    } catch (error: any) {
      console.error('Error resetting ledger:', error);
      toast.error(`Failed to reset ledger: ${error.message}`, { id: loadingToast });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'super_admin']} requireCompany>
      <WorkspaceLayout title="Reset Ledger" companyId={companyId}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-destructive mb-2">
                  ⚠️ DANGER ZONE - Development Only
                </h2>
                <p className="text-sm text-destructive/90 mb-3">
                  This action will PERMANENTLY DELETE all journal entries and ledger entries,
                  and reset all invoices to unposted status.
                </p>
                <p className="text-sm text-destructive/90 font-semibold">
                  This is ONLY for testing/development purposes. DO NOT use in production!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">What This Will Do:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Delete all journal entries (journal_entries collection)</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Delete all general ledger entries (general_ledger collection)</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Reset all invoices to unposted status (remove journalEntryId, postedDate)</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Reset all debtor balances to zero</span>
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Why You Need This:</h3>
            <p className="text-sm text-muted-foreground mb-3">
              We just updated the ledger structure to include:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Full account names (not just codes)</li>
              <li>Transaction descriptions for each line</li>
              <li>Customer and invoice dimensions for subsidiary ledger</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Your existing posted invoices don't have this new information.
              After resetting, you can re-post them with the complete structure.
            </p>
          </div>

          {stats && (
            <div className="bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
                ✅ Reset Complete!
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-green-800 dark:text-green-200">Journal entries deleted:</dt>
                  <dd className="font-semibold text-green-900 dark:text-green-100">{stats.journalEntries}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-green-800 dark:text-green-200">Ledger entries deleted:</dt>
                  <dd className="font-semibold text-green-900 dark:text-green-100">{stats.ledgerEntries}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-green-800 dark:text-green-200">Invoices reset:</dt>
                  <dd className="font-semibold text-green-900 dark:text-green-100">{stats.invoicesReset}</dd>
                </div>
              </dl>
              <p className="text-sm text-green-800 dark:text-green-200 mt-4">
                Redirecting to invoices page...
              </p>
            </div>
          )}

          <Button
            onClick={resetLedger}
            disabled={isResetting}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            {isResetting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Resetting Ledger...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Ledger and Invoices
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            You will be asked to confirm twice before any data is deleted
          </p>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
