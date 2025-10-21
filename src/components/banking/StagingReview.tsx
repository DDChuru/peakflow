'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  ArrowRight,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  Send,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StagingJournalEntry, StagingGeneralLedgerEntry, BalanceVerification } from '@/types/accounting/staging';
import { BankToLedgerService } from '@/lib/accounting/bank-to-ledger-service';
import { useAuth } from '@/contexts/AuthContext';
import { SupportedCurrency } from '@/types/auth';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  formatJournalEntriesForExport,
  formatGLEntriesForExport,
  generateStagingPDFContent
} from '@/lib/utils/export-helpers';

interface StagingReviewProps {
  companyId: string;
  onPostComplete?: () => void;
}

interface StagingSession {
  id: string;
  createdAt: Date;
  status: string;
  journalEntryCount: number;
  glEntryCount: number;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  stagedAt: Date;
}

export function StagingReview({ companyId, onPostComplete }: StagingReviewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stagingSessions, setStagingSessions] = useState<StagingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<StagingJournalEntry[]>([]);
  const [glEntries, setGLEntries] = useState<StagingGeneralLedgerEntry[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [posting, setPosting] = useState(false);
  const [companyCurrency, setCompanyCurrency] = useState<SupportedCurrency>('USD');

  useEffect(() => {
    loadCompanyCurrency();
    loadStagingSessions();
  }, [companyId]);

  useEffect(() => {
    if (selectedSession) {
      loadStagingDetails(selectedSession);
    }
  }, [selectedSession]);

  const loadCompanyCurrency = async () => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyRef);

      if (companySnap.exists()) {
        const companyData = companySnap.data();
        setCompanyCurrency(companyData.defaultCurrency || 'USD');
      }
    } catch (error) {
      console.error('[StagingReview] Failed to load company currency:', error);
      // Keep default USD
    }
  };

  const loadStagingSessions = async () => {
    try {
      setLoading(true);

      // Query bank import sessions with staging data
      const sessionsQuery = query(
        collection(db, 'companies', companyId, 'bankImportSessions'),
        where('status', 'in', ['staged', 'posted']),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(sessionsQuery);

      const sessions: StagingSession[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        if (data.staging) {
          sessions.push({
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            status: data.status,
            journalEntryCount: data.staging.journalEntryCount || 0,
            glEntryCount: data.staging.glEntryCount || 0,
            totalDebits: data.staging.totalDebits || 0,
            totalCredits: data.staging.totalCredits || 0,
            isBalanced: data.staging.isBalanced || false,
            stagedAt: data.staging.stagedAt?.toDate() || new Date()
          });
        }
      }

      setStagingSessions(sessions);

      // Auto-select first session if available
      if (sessions.length > 0 && !selectedSession) {
        setSelectedSession(sessions[0].id);
      }
    } catch (error) {
      console.error('[StagingReview] Failed to load staging sessions:', error);
      toast.error('Failed to load staging sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadStagingDetails = async (sessionId: string) => {
    try {
      setLoading(true);

      // Load staging journal entries
      const journalsQuery = query(
        collection(db, 'staging_journal_entries'),
        where('bankImportSessionId', '==', sessionId),
        orderBy('transactionDate', 'desc')
      );

      const journalsSnapshot = await getDocs(journalsQuery);
      const journals = journalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          transactionDate: data.transactionDate?.toDate() || new Date(),
          postingDate: data.postingDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          stagedAt: data.stagedAt?.toDate() || new Date(),
          postedAt: data.postedAt?.toDate() || null,
        } as StagingJournalEntry;
      });

      setJournalEntries(journals);

      // Load staging GL entries
      const glQuery = query(
        collection(db, 'staging_general_ledger'),
        where('bankImportSessionId', '==', sessionId),
        orderBy('transactionDate', 'desc')
      );

      const glSnapshot = await getDocs(glQuery);
      const glEntriesData = glSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          transactionDate: data.transactionDate?.toDate() || new Date(),
          postingDate: data.postingDate?.toDate() || new Date(),
          stagedAt: data.stagedAt?.toDate() || new Date(),
          postedAt: data.postedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date()
        } as StagingGeneralLedgerEntry;
      });

      setGLEntries(glEntriesData);
    } catch (error) {
      console.error('[StagingReview] Failed to load staging details:', error);
      toast.error('Failed to load staging details');
    } finally {
      setLoading(false);
    }
  };

  const handlePostToProduction = async () => {
    if (!selectedSession || !user) return;

    try {
      setPosting(true);

      const bankToLedgerService = new BankToLedgerService(companyId);
      const result = await bankToLedgerService.postToProduction(selectedSession);

      if (result.success) {
        toast.success(
          `Posted ${result.journalCount} journal entries and ${result.glCount} GL entries to production ledger`,
          { duration: 8000 }
        );

        setShowPostDialog(false);

        // Reload sessions to update status
        await loadStagingSessions();

        if (onPostComplete) {
          onPostComplete();
        }
      } else {
        toast.error('Failed to post to production');
      }
    } catch (error) {
      console.error('[StagingReview] Post to production failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post to production');
    } finally {
      setPosting(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    try {
      if (journalEntries.length === 0) {
        toast.error('No data to export');
        return;
      }

      const data = formatJournalEntriesForExport(journalEntries);
      const filename = `staging-session-${selectedSession?.slice(-8)}-${new Date().toISOString().split('T')[0]}`;
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

      const data = formatJournalEntriesForExport(journalEntries);
      const filename = `staging-session-${selectedSession?.slice(-8)}-${new Date().toISOString().split('T')[0]}`;
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

      const content = generateStagingPDFContent(
        selectedSessionData.id,
        journalEntries,
        glEntries,
        selectedSessionData.totalDebits,
        selectedSessionData.totalCredits,
        companyCurrency
      );
      const filename = `staging-session-${selectedSession?.slice(-8)}-${new Date().toISOString().split('T')[0]}`;
      exportToPDF(content, filename);
      toast.success('PDF export initiated - use browser print dialog to save');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const selectedSessionData = stagingSessions.find(s => s.id === selectedSession);

  if (loading && stagingSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staging sessions...</p>
        </div>
      </div>
    );
  }

  if (stagingSessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No staged imports yet</p>
            <p className="text-sm mt-2">
              Import and stage bank transactions to review them here before posting to production
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Staged Import Sessions</h3>
          <p className="text-sm text-muted-foreground">
            {stagingSessions.length} staged import{stagingSessions.length !== 1 ? 's' : ''} ready for review
          </p>
        </div>
        <Button variant="outline" onClick={loadStagingSessions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Session Cards */}
      <div className="grid gap-4">
        {stagingSessions.map((session) => (
          <Card
            key={session.id}
            className={`cursor-pointer transition-all ${
              selectedSession === session.id
                ? 'ring-2 ring-indigo-500 shadow-md'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedSession(session.id)}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">Session #{session.id.slice(-8)}</p>
                    {session.status === 'staged' ? (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Staged
                      </Badge>
                    ) : session.status === 'posted' ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Posted
                      </Badge>
                    ) : null}
                    {session.isBalanced ? (
                      <Badge variant="default" className="bg-green-500">
                        ✓ Balanced
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        ✗ Unbalanced
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Journal Entries</p>
                      <p className="text-lg font-semibold">{session.journalEntryCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GL Entries</p>
                      <p className="text-lg font-semibold">{session.glEntryCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Debits</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(session.totalDebits)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Credits</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(session.totalCredits)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Staged: {formatDate(session.stagedAt)}
                  </p>
                </div>

                {session.status === 'staged' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSession(session.id);
                      setShowPostDialog(true);
                    }}
                    size="sm"
                    className="ml-4"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post to Ledger
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedSessionData && journalEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Staging Details - Session #{selectedSessionData.id.slice(-8)}</span>
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
              Review journal entries before posting to production ledger
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
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.map((entry) => {
                    const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                    const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }).format(entry.transactionDate)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell className="text-right">{entry.lines.length}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {formatCurrency(totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {formatCurrency(totalCredit)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GL Entries Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>General Ledger Entries - Session #{selectedSessionData?.id.slice(-8)}</DialogTitle>
            <DialogDescription>
              Detailed GL entries that will be posted to production ledger
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {glEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }).format(entry.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-semibold">{entry.accountCode}</span>
                        <span className="text-xs text-muted-foreground">{entry.accountName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{entry.description}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(entry.cumulativeBalance || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Confirmation Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post to Production Ledger?</DialogTitle>
            <DialogDescription>
              This will permanently post the staged entries to your production general ledger.
            </DialogDescription>
          </DialogHeader>

          {selectedSessionData && (
            <div className="my-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Journal Entries:</span>
                  <span className="font-semibold">{selectedSessionData.journalEntryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GL Entries:</span>
                  <span className="font-semibold">{selectedSessionData.glEntryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Debits:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(selectedSessionData.totalDebits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Credits:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(selectedSessionData.totalCredits)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Balance Check:</span>
                  {selectedSessionData.isBalanced ? (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Balanced
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      ✗ Unbalanced
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedSessionData?.isBalanced && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: This import is not balanced. Posting unbalanced entries may cause
                discrepancies in your general ledger.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
              disabled={posting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostToProduction}
              disabled={posting}
            >
              {posting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post to Ledger
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
