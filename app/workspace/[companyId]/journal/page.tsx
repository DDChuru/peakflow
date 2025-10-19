'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, AlertCircle, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { journalService } from '@/lib/accounting';
import type { JournalEntry } from '@/types/accounting/journal';
import type { LedgerEntry } from '@/types/accounting/general-ledger';
import toast from 'react-hot-toast';

export default function JournalPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [journalEntries, setJournalEntries] = useState<Array<JournalEntry & { ledgerEntries: LedgerEntry[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry & { ledgerEntries: LedgerEntry[] } | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (canAccess) {
      loadJournalEntries();
    }
  }, [canAccess, companyId]);

  const loadJournalEntries = async () => {
    try {
      setLoading(true);
      const entries = await journalService.getJournalEntriesWithDetails(companyId);
      setJournalEntries(entries);
    } catch (error: any) {
      console.error('Error loading journal entries:', error);
      toast.error(error.message || 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      posted: { variant: 'default', label: 'Posted' },
      draft: { variant: 'secondary', label: 'Draft' },
      pending: { variant: 'outline', label: 'Pending' },
    };

    const config = variants[status] || variants.draft;

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      accounts_receivable: 'Invoice',
      accounts_payable: 'Bill',
      cash: 'Cash',
      bank: 'Bank',
      general: 'General',
      manual: 'Manual Entry',
    };

    return labels[source] || source;
  };

  const calculateTotals = (ledgerEntries: LedgerEntry[]) => {
    const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
    return { totalDebit, totalCredit };
  };

  const viewDetails = (entry: JournalEntry & { ledgerEntries: LedgerEntry[] }) => {
    setSelectedEntry(entry);
    setIsDetailDialogOpen(true);
  };

  const navigateToSource = (entry: JournalEntry) => {
    // If it's an invoice, navigate to the invoice page
    if (entry.source === 'accounts_receivable' && entry.metadata?.invoiceId) {
      router.push(`/workspace/${companyId}/invoices`);
    }
  };

  if (accessLoading || loading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">{accessLoading ? 'Checking workspace access...' : 'Loading journal entries...'}</p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!canAccess) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accessError || 'You do not have access to this workspace.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
              <p className="text-muted-foreground mt-1">
                View all posted transactions and journal entries
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadJournalEntries}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {journalEntries.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{journalEntries.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {journalEntries.filter(e => e.status === 'posted').length} posted
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      journalEntries
                        .filter(e => e.status === 'posted')
                        .reduce((sum, e) => {
                          const totals = calculateTotals(e.ledgerEntries);
                          return sum + totals.totalDebit;
                        }, 0)
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      journalEntries
                        .filter(e => e.status === 'posted')
                        .reduce((sum, e) => {
                          const totals = calculateTotals(e.ledgerEntries);
                          return sum + totals.totalCredit;
                        }, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Journal Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <CardDescription>All posted transactions and adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              {journalEntries.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Journal Entries</h3>
                  <p className="text-muted-foreground">
                    Journal entries will appear here when invoices are posted to the GL
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Reference</th>
                        <th className="text-left p-3 font-medium">Source</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-right p-3 font-medium">Debit</th>
                        <th className="text-right p-3 font-medium">Credit</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries.map((entry) => {
                        const totals = calculateTotals(entry.ledgerEntries);
                        return (
                          <tr key={entry.id} className="border-t hover:bg-muted/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(entry.transactionDate)}
                              </div>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => navigateToSource(entry)}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {entry.reference || entry.id.substring(0, 8)}
                              </button>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{getSourceLabel(entry.source)}</Badge>
                            </td>
                            <td className="p-3 max-w-xs truncate">{entry.description}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(totals.totalDebit)}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(totals.totalCredit)}</td>
                            <td className="p-3 text-center">{getStatusBadge(entry.status)}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewDetails(entry)}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Journal Entry Details</DialogTitle>
              </DialogHeader>

              {selectedEntry && (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reference</label>
                      <p className="text-sm font-medium">{selectedEntry.reference || selectedEntry.id.substring(0, 8)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-sm">{formatDate(selectedEntry.transactionDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Source</label>
                      <p className="text-sm">{getSourceLabel(selectedEntry.source)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div>{getStatusBadge(selectedEntry.status)}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm">{selectedEntry.description}</p>
                    </div>
                  </div>

                  {/* Ledger Lines */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Ledger Lines</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Account</th>
                            <th className="text-left p-3 font-medium">Description</th>
                            <th className="text-right p-3 font-medium">Debit</th>
                            <th className="text-right p-3 font-medium">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEntry.ledgerEntries.map((line, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3">
                                <div className="font-medium">{line.accountCode}</div>
                                <div className="text-sm text-muted-foreground">{line.accountName}</div>
                              </td>
                              <td className="p-3 text-muted-foreground">{line.description || '-'}</td>
                              <td className="p-3 text-right">
                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                              </td>
                              <td className="p-3 text-right">
                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted/30 font-bold">
                            <td className="p-3" colSpan={2}>Total</td>
                            <td className="p-3 text-right">
                              {formatCurrency(calculateTotals(selectedEntry.ledgerEntries).totalDebit)}
                            </td>
                            <td className="p-3 text-right">
                              {formatCurrency(calculateTotals(selectedEntry.ledgerEntries).totalCredit)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Additional Info</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(selectedEntry.metadata).map(([key, value]) => (
                            <div key={key}>
                              <dt className="font-medium text-muted-foreground">{key}:</dt>
                              <dd>{String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* Dimensions - show customer details from first ledger entry */}
                  {selectedEntry.ledgerEntries.some(line => line.dimensions && line.dimensions.customerId) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Transaction Details</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {selectedEntry.ledgerEntries[0].dimensions?.customerId && (
                            <div>
                              <dt className="font-medium text-muted-foreground">Customer ID:</dt>
                              <dd>{selectedEntry.ledgerEntries[0].dimensions.customerId}</dd>
                            </div>
                          )}
                          {selectedEntry.ledgerEntries[0].dimensions?.invoiceId && (
                            <div>
                              <dt className="font-medium text-muted-foreground">Invoice ID:</dt>
                              <dd>{selectedEntry.ledgerEntries[0].dimensions.invoiceId}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
