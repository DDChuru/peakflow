'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import {
  Archive,
  FileText,
  FileSpreadsheet,
  File,
  Eye,
  Calendar,
  DollarSign,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ArchiveService } from '@/lib/accounting/archive-service';
import type { ArchivedSession, ArchivedJournalEntry, ArchivedGLEntry } from '@/lib/accounting/archive-service';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company } from '@/types/auth';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  formatJournalEntriesForExport,
  formatGLEntriesForExport,
  generateStagingPDFContent
} from '@/lib/utils/export-helpers';

export default function ArchivedStatementsPage() {
  return (
    <ProtectedRoute requireCompany>
      <ArchivedStatementsContent />
    </ProtectedRoute>
  );
}

function ArchivedStatementsContent() {
  const params = useParams();
  const { user } = useAuth();
  const companyId = params?.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [archivedSessions, setArchivedSessions] = useState<ArchivedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedSessionData, setSelectedSessionData] = useState<ArchivedSession | null>(null);
  const [journalEntries, setJournalEntries] = useState<ArchivedJournalEntry[]>([]);
  const [glEntries, setGLEntries] = useState<ArchivedGLEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const archiveService = new ArchiveService(companyId);
  const companiesService = new CompaniesService();

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await companiesService.getCompany(companyId);
        setCompany(companyData);
      } catch (error) {
        console.error('Failed to load company:', error);
        toast.error('Failed to load company data');
      }
    };

    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  // Load archived sessions
  useEffect(() => {
    loadArchivedSessions();
  }, [companyId]);

  const loadArchivedSessions = async () => {
    try {
      setLoading(true);
      const sessions = await archiveService.getArchivedSessions(100);
      setArchivedSessions(sessions);
    } catch (error) {
      console.error('Failed to load archived sessions:', error);
      toast.error('Failed to load archived sessions');
    } finally {
      setLoading(false);
    }
  };

  // Load session details when selected
  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails(selectedSession);
    }
  }, [selectedSession]);

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const sessionData = archivedSessions.find(s => s.id === sessionId);
      if (!sessionData) return;

      setSelectedSessionData(sessionData);

      const [journals, gls] = await Promise.all([
        archiveService.getArchivedJournalEntries(sessionId),
        archiveService.getArchivedGLEntries(sessionId)
      ]);

      setJournalEntries(journals);
      setGLEntries(gls);
    } catch (error) {
      console.error('Failed to load session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const companyCurrency = company?.settings?.currency || 'USD';

  // Export handlers
  const handleExportCSV = () => {
    try {
      if (journalEntries.length === 0) {
        toast.error('No data to export');
        return;
      }

      const data = formatJournalEntriesForExport(journalEntries as any);
      const filename = `archived-session-${selectedSession?.slice(-8)}-${new Date().toISOString().split('T')[0]}`;
      exportToCSV(data, filename);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportExcel = () => {
    try {
      if (journalEntries.length === 0) {
        toast.error('No data to export');
        return;
      }

      const data = formatJournalEntriesForExport(journalEntries as any);
      const filename = `archived-session-${selectedSession?.slice(-8)}-${new Date().toISOString().split('T')[0]}`;
      exportToExcel(data, filename);
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      if (journalEntries.length === 0 || !selectedSessionData) {
        toast.error('No data to export');
        return;
      }

      // Calculate totals from GL entries
      const totalDebits = glEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredits = glEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      const content = generateStagingPDFContent(
        selectedSessionData.id,
        journalEntries as any,
        glEntries as any,
        totalDebits,
        totalCredits,
        companyCurrency
      );
      const filename = `archived-session-${selectedSession?.slice(-8)}-${new Date().toISOString().split('T')[0]}`;
      exportToPDF(content, filename);
      toast.success('PDF export initiated - use browser print dialog to save');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Archived Bank Statements</h1>
          <p className="text-muted-foreground mt-1">
            View and export posted bank statement imports
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadArchivedSessions}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Archived Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="h-5 w-5 mr-2" />
            Archived Sessions
          </CardTitle>
          <CardDescription>
            Select a session to view details and export
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading archived sessions...
            </div>
          ) : archivedSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No archived sessions found</p>
              <p className="text-sm mt-2">Posted sessions will appear here after archival</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Import Date</TableHead>
                    <TableHead>Archived Date</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedSessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className={selectedSession === session.id ? 'bg-accent' : ''}
                    >
                      <TableCell className="font-mono text-sm">
                        #{session.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(session.importDate)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(session.archivedAt)}</TableCell>
                      <TableCell>
                        {session.metadata?.totalTransactions || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Archived</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details */}
      {selectedSessionData && journalEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Archived Session #{selectedSessionData.id.slice(-8)}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  title="Export to CSV"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  title="Export to PDF"
                >
                  <File className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsDialog(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View GL Entries
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Posted journal entries from archived import session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.flatMap((entry) =>
                    entry.lines.map((line: any, index: number) => (
                      <TableRow key={`${entry.id}-${index}`}>
                        <TableCell>
                          {index === 0 ? formatDate(entry.transactionDate) : ''}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {index === 0 ? entry.reference : ''}
                        </TableCell>
                        <TableCell>
                          {index === 0 ? entry.description : ''}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{line.accountCode}</span>
                            <span className="text-sm text-muted-foreground">
                              {line.accountName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.debit ? formatCurrency(line.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.credit ? formatCurrency(line.credit) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{journalEntries.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      glEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0)
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      glEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GL Entries Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>General Ledger Entries</DialogTitle>
            <DialogDescription>
              Detailed general ledger entries for this session
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {glEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.transactionDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.accountCode}</span>
                        <span className="text-sm text-muted-foreground">
                          {entry.accountName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.reference}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.debit ? formatCurrency(entry.debit) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.credit ? formatCurrency(entry.credit) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
