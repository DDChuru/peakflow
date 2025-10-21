'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService, adminService } from '@/lib/firebase';
import { Company, Invoice, InvoicePayment } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/navigation';
import PaymentRecordingModal from '@/components/invoices/PaymentRecordingModal';
import {
  Download,
  Send,
  Edit2,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  FileText,
  User,
  Calendar,
  DollarSign,
  Hash,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;
  const invoiceId = params.invoiceId as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (companyId && invoiceId && user) {
      fetchData();
    }
  }, [companyId, invoiceId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [companies, invoiceData] = await Promise.all([
        adminService.getAllCompanies(),
        invoiceService.getInvoice(companyId, invoiceId)
      ]);

      const currentCompany = companies.find(c => c.id === companyId);
      if (!currentCompany) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }

      if (!invoiceData) {
        toast.error('Invoice not found');
        router.push(`/companies/${companyId}/invoices`);
        return;
      }

      if (user && user.companyId !== companyId && !user.roles.includes('admin')) {
        toast.error('You do not have access to this company');
        router.push('/companies');
        return;
      }

      setCompany(currentCompany);
      setInvoice(invoiceData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'overdue': return 'destructive';
      case 'partial': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!invoice || !user) return;

    try {
      await invoiceService.updateInvoiceStatus(companyId, invoiceId, newStatus as any, user.id);
      setInvoice({ ...invoice, status: newStatus as any });
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const handlePaymentRecorded = () => {
    fetchData(); // Refresh invoice data
    setShowPaymentModal(false);
  };

  const duplicateInvoice = () => {
    // TODO: Implement duplicate functionality
    toast('Duplicate functionality coming soon');
  };

  const downloadPDF = () => {
    // TODO: Implement PDF download
    toast('PDF download coming soon');
  };

  const sendInvoice = () => {
    // TODO: Implement email sending
    toast('Email sending coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent"
        />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice not found</h2>
          <p className="text-gray-500 mb-4">The invoice you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/companies/${companyId}/invoices`)}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(invoice.dueDate) < new Date() &&
                   invoice.status !== 'paid' &&
                   invoice.status !== 'cancelled';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title={invoice.invoiceNumber}
          subtitle={`Invoice for ${invoice.customerName}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Invoices', href: `/companies/${companyId}/invoices` },
            { label: invoice.invoiceNumber }
          ]}
          backHref={`/companies/${companyId}/invoices`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>

              {invoice.status === 'draft' && (
                <Button variant="outline" size="sm" onClick={sendInvoice}>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              )}

              {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Record Payment</span>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={duplicateInvoice}>
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Duplicate</span>
              </Button>
            </div>
          }
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Invoice Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                      <Badge
                        variant={getStatusBadgeVariant(invoice.status)}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Invoice Date:</span>
                        <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <p className={cn(
                          "font-medium",
                          isOverdue ? "text-red-600" : ""
                        )}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      {invoice.purchaseOrderNumber && (
                        <div>
                          <span className="text-gray-500">PO Number:</span>
                          <p className="font-medium">{invoice.purchaseOrderNumber}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Payment Terms:</span>
                        <p className="font-medium">{invoice.paymentTerms} days</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Total Amount</span>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                    </div>
                    {invoice.amountDue > 0 && invoice.status !== 'paid' && (
                      <div>
                        <span className="text-sm text-red-600">Amount Due</span>
                        <p className="text-xl font-semibold text-red-600">
                          {formatCurrency(invoice.amountDue)}
                        </p>
                      </div>
                    )}
                    {invoice.amountPaid > 0 && (
                      <div>
                        <span className="text-sm text-green-600">Amount Paid</span>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(invoice.amountPaid)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{invoice.customerName}</h3>
                    </div>
                    {invoice.customerAddress && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{invoice.customerAddress}</span>
                      </div>
                    )}
                    {invoice.customerEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{invoice.customerEmail}</span>
                      </div>
                    )}
                    {invoice.customerPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{invoice.customerPhone}</span>
                      </div>
                    )}
                    {invoice.customerTaxId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Hash className="h-4 w-4" />
                        <span>Tax ID: {invoice.customerTaxId}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Line Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm font-medium text-gray-500 border-b">
                            <th className="pb-3">Description</th>
                            <th className="pb-3 text-center">Qty</th>
                            <th className="pb-3 text-right">Unit Price</th>
                            <th className="pb-3 text-center">Tax</th>
                            <th className="pb-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3">
                                <div>
                                  <p className="font-medium">{item.description}</p>
                                  {item.itemCode && (
                                    <p className="text-sm text-gray-500">Code: {item.itemCode}</p>
                                  )}
                                  {item.accountCode && (
                                    <p className="text-sm text-gray-500">GL: {item.accountCode}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-center">{item.quantity}</td>
                              <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-3 text-center">
                                {item.taxRate ? `${item.taxRate}%` : '-'}
                              </td>
                              <td className="py-3 text-right font-medium">
                                {formatCurrency(item.amount + (item.taxAmount || 0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.taxAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Tax:</span>
                            <span>{formatCurrency(invoice.taxAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {(invoice.notes || invoice.termsAndConditions) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {invoice.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                          <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                      )}
                      {invoice.termsAndConditions && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Terms and Conditions</h4>
                          <p className="text-gray-600 whitespace-pre-wrap">{invoice.termsAndConditions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {invoice.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleStatusUpdate('sent')}
                        >
                          <Send className="h-4 w-4" />
                          Mark as Sent
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          disabled
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit (Coming Soon)
                        </Button>
                      </>
                    )}

                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleStatusUpdate('paid')}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Paid
                      </Button>
                    )}

                    {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => handleStatusUpdate('cancelled')}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Invoice
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Payment History */}
                {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Payment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {invoice.paymentHistory.map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                {payment.paymentMethod.replace('_', ' ')}
                              </p>
                            </div>
                            {payment.reference && (
                              <p className="text-sm text-gray-500">
                                Ref: {payment.reference}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activity Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Invoice created</p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(invoice.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invoice.status !== 'draft' && (
                        <div className="flex items-start space-x-3">
                          <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Invoice sent</p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(invoice.updatedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Recording Modal */}
        {showPaymentModal && (
          <PaymentRecordingModal
            invoice={invoice}
            companyId={companyId}
            onClose={() => setShowPaymentModal(false)}
            onPaymentRecorded={handlePaymentRecorded}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}