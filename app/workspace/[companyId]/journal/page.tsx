'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Search, Filter, MoreHorizontal, Calendar, AlertCircle } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';

export default function JournalPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [journalEntries] = useState([
    {
      id: 'JE-001',
      date: '2024-01-15',
      description: 'Cash sale to customer',
      reference: 'INV-001',
      totalDebit: 1500.00,
      totalCredit: 1500.00,
      status: 'posted',
      entries: [
        { account: '1000 - Cash', debit: 1500.00, credit: 0 },
        { account: '4000 - Sales Revenue', debit: 0, credit: 1500.00 },
      ],
    },
    {
      id: 'JE-002',
      date: '2024-01-14',
      description: 'Office rent payment',
      reference: 'BILL-001',
      totalDebit: 2000.00,
      totalCredit: 2000.00,
      status: 'posted',
      entries: [
        { account: '6000 - Office Expenses', debit: 2000.00, credit: 0 },
        { account: '1000 - Cash', debit: 0, credit: 2000.00 },
      ],
    },
    {
      id: 'JE-003',
      date: '2024-01-13',
      description: 'Equipment purchase',
      reference: 'PO-001',
      totalDebit: 5000.00,
      totalCredit: 5000.00,
      status: 'pending',
      entries: [
        { account: '1500 - Equipment', debit: 5000.00, credit: 0 },
        { account: '2000 - Accounts Payable', debit: 0, credit: 5000.00 },
      ],
    },
    {
      id: 'JE-004',
      date: '2024-01-12',
      description: 'Customer payment received',
      reference: 'PAY-001',
      totalDebit: 3200.00,
      totalCredit: 3200.00,
      status: 'posted',
      entries: [
        { account: '1000 - Cash', debit: 3200.00, credit: 0 },
        { account: '1100 - Accounts Receivable', debit: 0, credit: 3200.00 },
      ],
    },
  ]);

  if (accessLoading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Checking workspace access...</p>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0);
  const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.totalCredit, 0);

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
              <p className="text-gray-600">Record and manage all accounting transactions</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journalEntries.length}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
                <span className="text-blue-600">DR</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalDebits.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All posted entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <span className="text-red-600">CR</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${totalCredits.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All posted entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Check</CardTitle>
                <span className={totalDebits === totalCredits ? 'text-green-600' : 'text-red-600'}>
                  {totalDebits === totalCredits ? '✓' : '⚠'}
                </span>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalDebits === totalCredits ? 'text-green-600' : 'text-red-600'}`}>
                  {totalDebits === totalCredits ? 'Balanced' : 'Unbalanced'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Debits vs Credits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search journal entries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{entry.id}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span>{entry.date}</span>
                        <span>•</span>
                        <span>{entry.reference}</span>
                        <span>•</span>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{entry.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-sm">
                          <th className="text-left py-2 px-2 font-medium text-gray-500">Account</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-500">Debit</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-500">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.entries.map((line, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="py-2 px-2 text-sm">{line.account}</td>
                            <td className="py-2 px-2 text-right text-sm font-mono">
                              {line.debit > 0 ? `$${line.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2 px-2 text-right text-sm font-mono">
                              {line.credit > 0 ? `$${line.credit.toLocaleString()}` : '-'}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 font-medium bg-gray-50">
                          <td className="py-2 px-2 text-sm">Total</td>
                          <td className="py-2 px-2 text-right text-sm font-mono">
                            ${entry.totalDebit.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-sm font-mono">
                            ${entry.totalCredit.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common journal entry templates for faster data entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Record Purchase
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Record Receipt
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Adjusting Entry
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Closing Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}