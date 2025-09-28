'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { quoteService, adminService, debtorService } from '@/lib/firebase';
import { Company, Quote, QuoteStatus, Debtor } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/navigation';
import QuoteToInvoiceModal from '@/components/quotes/QuoteToInvoiceModal';
import {
  FileText,
  Send,
  Edit2,
  Copy,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  RefreshCw,
  ArrowLeft,
  History,
  User,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Printer,
  Share2,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

interface QuoteActivity {
  id: string;
  type: 'created' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'revised';
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;
  const quoteId = params.quoteId as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Debtor | null>(null);
  const [quoteVersions, setQuoteVersions] = useState<Quote[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    if (companyId && quoteId && user) {
      fetchQuoteData();
    }
  }, [companyId, quoteId, user]);

  const fetchQuoteData = async () => {
    try {
      setLoading(true);

      const companies = await adminService.getAllCompanies();
      const currentCompany = companies.find(c => c.id === companyId);

      if (!currentCompany) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }

      if (user && user.companyId !== companyId && !user.roles.includes('admin')) {
        toast.error('You do not have access to this company');
        router.push('/companies');
        return;
      }

      setCompany(currentCompany);

      const [quoteData, allQuotes] = await Promise.all([
        quoteService.getQuote(companyId, quoteId),
        quoteService.getQuotes(companyId)
      ]);

      if (!quoteData) {
        toast.error('Quote not found');
        router.push(`/companies/${companyId}/quotes`);
        return;
      }

      setQuote(quoteData);

      // Get customer data
      const debtors = await debtorService.getDebtors(companyId);
      const customerData = debtors.find(d => d.id === quoteData.customerId);
      setCustomer(customerData || null);

      // Get quote versions
      const versions = allQuotes.filter(q =>
        q.id === quoteData.id || q.parentQuoteId === quoteData.id || quoteData.parentQuoteId === q.id
      ).sort((a, b) => b.version - a.version);
      setQuoteVersions(versions);

    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'rejected': return 'destructive';
      case 'expired': return 'warning';
      case 'converted': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Timer className="h-4 w-4" />;
      case 'converted': return <RefreshCw className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isExpired = (quote: Quote) => {
    return new Date(quote.validUntil) < new Date() && quote.status === 'sent';
  };

  const isExpiringSoon = (quote: Quote) => {
    const today = new Date();
    const validUntil = new Date(quote.validUntil);
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && quote.status === 'sent';
  };

  const handleStatusUpdate = async (newStatus: QuoteStatus) => {
    if (!quote || !user) return;

    try {
      setUpdating(true);
      await quoteService.updateQuoteStatus(companyId, quote.id, newStatus, user.uid);

      // Refresh quote data
      await fetchQuoteData();

      toast.success(`Quote ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    } finally {
      setUpdating(false);
    }
  };

  const canConvertToInvoice = quote && (quote.status === 'accepted' || quote.status === 'sent');
  const canEdit = quote && quote.status === 'draft';
  const canSend = quote && quote.status === 'draft';

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

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote not found</h2>
          <p className="text-gray-600 mb-4">The quote you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/companies/${companyId}/quotes`)}>
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title={quote.quoteNumber}
          subtitle={`Quote for ${quote.customerName}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Quotes', href: `/companies/${companyId}/quotes` },
            { label: quote.quoteNumber }
          ]}
          backHref={`/companies/${companyId}/quotes`}
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Version History</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Download coming soon"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Share coming soon"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quote Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-3">
                        {quote.quoteNumber}
                        {quote.version > 1 && (
                          <Badge variant="secondary">
                            Version {quote.version}
                          </Badge>
                        )}
                        <Badge
                          variant={getStatusBadgeVariant(quote.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(quote.status)}
                          {quote.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-lg mt-1">
                        Quote for {quote.customerName}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(quote.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.currency}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Expiry Warning */}
              {isExpired(quote) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">This quote has expired</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    Quote expired on {new Date(quote.validUntil).toLocaleDateString()}
                  </p>
                </motion.div>
              )}

              {isExpiringSoon(quote) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Timer className="h-5 w-5" />
                    <span className="font-medium">Quote expiring soon</span>
                  </div>
                  <p className="text-yellow-600 text-sm mt-1">
                    Valid until {new Date(quote.validUntil).toLocaleDateString()}
                  </p>
                </motion.div>
              )}

              {/* Quote Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Quote Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Quote Date</div>
                      <div className="font-medium">
                        {new Date(quote.quoteDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Valid Until</div>
                      <div className={cn(
                        "font-medium",
                        isExpired(quote) ? "text-red-600" : ""
                      )}>
                        {new Date(quote.validUntil).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Validity Period</div>
                      <div className="font-medium">{quote.validityPeriod} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Currency</div>
                      <div className="font-medium">{quote.currency}</div>
                    </div>
                  </div>

                  {quote.convertedToInvoiceId && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Converted to Invoice</span>
                      </div>
                      <div className="text-green-600 text-sm mt-1">
                        Invoice ID: {quote.convertedToInvoiceId}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quote.lineItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                            {item.taxRate > 0 && ` + ${item.taxRate}% tax`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(item.amount + (item.taxAmount || 0))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(quote.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>{formatCurrency(quote.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(quote.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes and Terms */}
              {(quote.notes || quote.termsAndConditions) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quote.notes && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {quote.notes}
                        </div>
                      </div>
                    )}
                    {quote.termsAndConditions && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Terms and Conditions</div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                          {quote.termsAndConditions}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canSend && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate('sent')}
                      disabled={updating}
                    >
                      <Send className="h-4 w-4" />
                      Send Quote
                    </Button>
                  )}

                  {canConvertToInvoice && (
                    <Button
                      className="w-full"
                      onClick={() => setShowConvertModal(true)}
                      disabled={updating}
                    >
                      <CreditCard className="h-4 w-4" />
                      Convert to Invoice
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                      title="Edit coming soon"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Quote
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                    title="Duplicate coming soon"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                    title="Print coming soon"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </CardContent>
              </Card>

              {/* Customer Information */}
              {customer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">Customer ID: {customer.customerNumber}</div>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{customer.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Version History */}
              <AnimatePresence>
                {showVersionHistory && quoteVersions.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Version History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {quoteVersions.map((version) => (
                            <div
                              key={version.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-gray-50",
                                version.id === quote.id ? "bg-indigo-50 border-indigo-200" : "border-gray-200"
                              )}
                              onClick={() => {
                                if (version.id !== quote.id) {
                                  router.push(`/companies/${companyId}/quotes/${version.id}`);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">
                                    Version {version.version}
                                    {version.id === quote.id && <span className="text-indigo-600"> (Current)</span>}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatRelativeTime(version.updatedAt)}
                                  </div>
                                </div>
                                <Badge
                                  variant={getStatusBadgeVariant(version.status)}
                                  size="sm"
                                >
                                  {version.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{formatRelativeTime(quote.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated:</span>
                    <span>{formatRelativeTime(quote.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created by:</span>
                    <span>{quote.createdBy}</span>
                  </div>
                  {quote.modifiedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Modified by:</span>
                      <span>{quote.modifiedBy}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Convert to Invoice Modal */}
        {showConvertModal && quote && (
          <QuoteToInvoiceModal
            quote={quote}
            companyId={companyId}
            onClose={() => setShowConvertModal(false)}
            onSuccess={(invoiceId) => {
              setShowConvertModal(false);
              toast.success('Quote converted to invoice successfully!');
              // Refresh quote data to show conversion
              fetchQuoteData();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}