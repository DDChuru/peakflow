'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Mail, Download, Plus, Search, Filter } from 'lucide-react';
import { createStatementService, pdfService, type StatementPDFOptions } from '@/lib/accounting';
import { creditorService, companiesService } from '@/lib/firebase';
import type { SupplierStatement } from '@/types/accounting/statement';
import type { Creditor } from '@/types/financial';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

export default function SupplierStatementsPage() {
  const params = useParams();
  const companyId = params?.companyId as string;
  const { user } = useAuth();
  const { canAccess: hasAccess, loading: accessLoading } = useWorkspaceAccess(companyId);

  // State
  const [statements, setStatements] = useState<SupplierStatement[]>([]);
  const [suppliers, setSuppliers] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Generate statement dialog
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Preview dialog
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewStatement, setPreviewStatement] = useState<SupplierStatement | null>(null);

  // Load data
  useEffect(() => {
    if (!hasAccess || !user) return;
    loadData();
  }, [hasAccess, user, companyId]);

  async function loadData() {
    try {
      setLoading(true);

      // Load suppliers
      const suppliersData = await creditorService.getCreditors(companyId);
      setSuppliers(suppliersData);

      // Load statements
      await loadStatements();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load statements');
    } finally {
      setLoading(false);
    }
  }

  async function loadStatements() {
    try {
      if (!user) return;

      const statementService = createStatementService(companyId, user.uid);
      const statementsData = await statementService.getStatements({
        entityType: 'supplier',
        limit: 100,
      });

      setStatements(statementsData as SupplierStatement[]);
    } catch (error) {
      console.error('Error loading statements:', error);
      // Don't show error toast here, already handled in loadData
    }
  }

  // Generate statement
  async function handleGenerateStatement() {
    if (!selectedSupplierId || !periodStart || !periodEnd) {
      toast.error('Please select supplier and period');
      return;
    }

    if (!user) return;

    try {
      setIsGenerating(true);

      const statementService = createStatementService(companyId, user.uid);
      const result = await statementService.generateSupplierStatement(
        selectedSupplierId,
        new Date(periodStart),
        new Date(periodEnd),
        {
          includeAgedAnalysis: true,
          includeDetailedAging: true,
        }
      );

      if (result.success && result.statement) {
        toast.success('Statement generated successfully');
        setStatements([result.statement, ...statements]);
        setIsGenerateDialogOpen(false);

        // Reset form
        setSelectedSupplierId('');
        setPeriodStart('');
        setPeriodEnd('');

        // Show preview
        setPreviewStatement(result.statement);
        setIsPreviewDialogOpen(true);
      } else {
        toast.error(result.message || 'Failed to generate statement');
      }
    } catch (error: any) {
      console.error('Error generating statement:', error);
      toast.error(error.message || 'Failed to generate statement');
    } finally {
      setIsGenerating(false);
    }
  }

  // Download statement as PDF
  async function handleDownloadPDF(statement: SupplierStatement) {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });

      // Get company details
      const company = await companiesService.getCompanyById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Build PDF options
      const pdfOptions: StatementPDFOptions = {
        companyName: company.name,
        companyAddress: company.address,
        companyPhone: company.phone,
        companyEmail: company.email,
        companyVatNumber: company.taxId || company.vatNumber,
        logoDataUrl: company.logoUrl,
      };

      // Add bank details if available
      if (company.defaultBankAccount) {
        pdfOptions.bankName = company.defaultBankAccount.bankName;
        pdfOptions.bankAccountNumber = company.defaultBankAccount.accountNumber;
        pdfOptions.bankBranchCode = company.defaultBankAccount.branchCode;
      }

      // Download PDF using centralized service
      await pdfService.downloadStatementPDF(statement, pdfOptions);

      toast.success('PDF downloaded successfully', { id: 'pdf-download' });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF', { id: 'pdf-download' });
    }
  }

  // Filter statements
  const filteredStatements = statements.filter((statement) => {
    const matchesSearch =
      statement.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statement.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || statement.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Format age bucket display
  function formatAgeBucket(amount: number, label: string) {
    return (
      <div className="flex justify-between items-center py-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="font-medium">{formatCurrency(amount)}</span>
      </div>
    );
  }

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-8">
        <p className="text-red-600">You do not have access to this workspace.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Supplier Statements</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage professional supplier statements with aged analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Statement
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Generated This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                statements.filter(
                  (s) =>
                    new Date(s.generatedAt).getMonth() === new Date().getMonth()
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                statements.reduce((sum, s) => sum + s.closingBalance, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by supplier name or statement ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statements List */}
      {filteredStatements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No statements yet</h3>
            <p className="text-gray-600 mb-4">
              Generate your first supplier statement to get started
            </p>
            <Button onClick={() => setIsGenerateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Statement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStatements.map((statement) => (
            <Card key={statement.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {statement.supplierName}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statement.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : statement.status === 'finalized'
                            ? 'bg-blue-100 text-blue-800'
                            : statement.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {statement.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Period: {new Date(statement.periodStart).toLocaleDateString()} -{' '}
                      {new Date(statement.periodEnd).toLocaleDateString()}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Opening Balance</p>
                        <p className="font-medium">
                          {formatCurrency(statement.openingBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Closing Balance</p>
                        <p className="font-medium">
                          {formatCurrency(statement.closingBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Transactions</p>
                        <p className="font-medium">{statement.transactions.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Outstanding</p>
                        <p className="font-medium text-red-600">
                          {formatCurrency(statement.agedAnalysis.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewStatement(statement);
                        setIsPreviewDialogOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(statement)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Statement Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Supplier Statement</DialogTitle>
            <DialogDescription>
              Select a supplier and period to generate a statement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>

            <div>
              <Label>Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateStatement} disabled={isGenerating}>
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewStatement && (
            <>
              <DialogHeader>
                <DialogTitle>Statement Preview - {previewStatement.supplierName}</DialogTitle>
                <DialogDescription>
                  Period: {new Date(previewStatement.periodStart).toLocaleDateString()} -{' '}
                  {new Date(previewStatement.periodEnd).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {formatAgeBucket(
                      previewStatement.summary.openingBalance,
                      'Opening Balance'
                    )}
                    {formatAgeBucket(
                      previewStatement.summary.totalInvoices,
                      `Bills (${previewStatement.summary.invoiceCount})`
                    )}
                    {formatAgeBucket(
                      -previewStatement.summary.totalPayments,
                      `Payments (${previewStatement.summary.paymentCount})`
                    )}
                    {formatAgeBucket(
                      -previewStatement.summary.totalCredits,
                      `Credits (${previewStatement.summary.creditNoteCount})`
                    )}
                    <div className="border-t pt-2 mt-2">
                      {formatAgeBucket(
                        previewStatement.summary.closingBalance,
                        'Closing Balance'
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Aged Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aged Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {formatAgeBucket(previewStatement.agedAnalysis.current, 'Current')}
                    {formatAgeBucket(
                      previewStatement.agedAnalysis.thirtyDays,
                      '31-60 Days'
                    )}
                    {formatAgeBucket(
                      previewStatement.agedAnalysis.sixtyDays,
                      '61-90 Days'
                    )}
                    {formatAgeBucket(
                      previewStatement.agedAnalysis.ninetyDays,
                      '91-120 Days'
                    )}
                    {formatAgeBucket(
                      previewStatement.agedAnalysis.oneTwentyPlus,
                      '120+ Days'
                    )}
                    <div className="border-t pt-2 mt-2">
                      {formatAgeBucket(
                        previewStatement.agedAnalysis.total,
                        'Total Outstanding'
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Date
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Type
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Reference
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">
                              Debit
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">
                              Credit
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewStatement.transactions.map((txn, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="py-2 text-sm">
                                {new Date(txn.date).toLocaleDateString()}
                              </td>
                              <td className="py-2 text-sm capitalize">
                                {txn.type.replace('-', ' ')}
                              </td>
                              <td className="py-2 text-sm">{txn.reference}</td>
                              <td className="py-2 text-sm text-right">
                                {txn.debit ? formatCurrency(txn.debit) : '-'}
                              </td>
                              <td className="py-2 text-sm text-right">
                                {txn.credit ? formatCurrency(txn.credit) : '-'}
                              </td>
                              <td className="py-2 text-sm text-right font-medium">
                                {formatCurrency(txn.runningBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => previewStatement && handleDownloadPDF(previewStatement)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
