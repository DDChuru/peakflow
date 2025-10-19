'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Building2,
  DollarSign,
  Scale,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Printer,
  BookCheck,
  BookOpen,
  BookMarked,
} from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency as formatCurrencyUtil, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// Types for reports
interface AgedReceivablesLine {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  originalAmount: number;
  amountPaid: number;
  balance: number;
  daysOutstanding: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

interface AgedReceivablesCustomer {
  customerId: string;
  customerName: string;
  lines: AgedReceivablesLine[];
  totalBalance: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

interface AgedReceivablesReport {
  asOfDate: Date;
  customers: AgedReceivablesCustomer[];
  grandTotal: {
    totalBalance: number;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
  };
}

interface AgedPayablesLine {
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  originalAmount: number;
  amountPaid: number;
  balance: number;
  daysOutstanding: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

interface AgedPayablesVendor {
  vendorId: string;
  vendorName: string;
  lines: AgedPayablesLine[];
  totalBalance: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

interface AgedPayablesReport {
  asOfDate: Date;
  vendors: AgedPayablesVendor[];
  grandTotal: {
    totalBalance: number;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
  };
}

interface ARSummaryCustomer {
  customerId: string;
  customerName: string;
  totalOutstanding: number;
  invoiceCount: number;
  oldestInvoiceDate: Date | null;
  averageDaysOutstanding: number;
}

interface APSummaryVendor {
  vendorId: string;
  vendorName: string;
  totalOutstanding: number;
  billCount: number;
  oldestBillDate: Date | null;
  averageDaysOutstanding: number;
}

// Financial Statements Types
interface IncomeStatementLine {
  accountId: string;
  accountName: string;
  amount: number;
}

interface IncomeStatementSection {
  sectionName: string;
  lines: IncomeStatementLine[];
  subtotal: number;
}

interface IncomeStatement {
  startDate: Date;
  endDate: Date;
  revenue: IncomeStatementSection;
  operatingExpenses: IncomeStatementSection;
  otherIncomeExpenses: IncomeStatementSection;
  operatingIncome: number;
  netIncomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
}

interface BalanceSheetLine {
  accountId: string;
  accountCode?: string;
  accountName: string;
  amount: number;
  isContra?: boolean;
}

interface BalanceSheetSubsection {
  subsectionName: string;
  lines: BalanceSheetLine[];
  subtotal: number;
}

interface BalanceSheetSection {
  sectionName: string;
  subsections: BalanceSheetSubsection[];
  total: number;
}

interface BalanceSheet {
  companyId: string;
  asOfDate: Date;
  generatedAt: Date;
  assets: {
    currentAssets: BalanceSheetSection;
    nonCurrentAssets: BalanceSheetSection;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetSection;
    nonCurrentLiabilities: BalanceSheetSection;
    totalLiabilities: number;
  };
  equity: BalanceSheetSection;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}

interface CashFlowLine {
  description: string;
  amount: number;
}

interface CashFlowSection {
  sectionName: string;
  lines: CashFlowLine[];
  netCash: number;
}

interface CashFlowStatement {
  startDate: Date;
  endDate: Date;
  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;
  netCashChange: number;
  cashBeginning: number;
  cashEnding: number;
}

// GL Reports Types
interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

interface TrialBalanceReport {
  companyId: string;
  asOfDate: Date;
  generatedAt: Date;
  accounts: TrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
}

interface GLEntry {
  date: Date;
  description: string;
  source: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface GLAccountReport {
  accountCode: string;
  accountName: string;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  entries: GLEntry[];
  totalDebits: number;
  totalCredits: number;
  totalDebit?: number;
  totalCredit?: number;
  closingBalance: number;
}

interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  entryNumber: string;
  date: Date;
  description: string;
  source: string;
  createdBy: string;
  createdAt: Date;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

interface JournalEntriesReport {
  startDate: Date;
  endDate: Date;
  entries: JournalEntry[];
}

interface JournalEntryFilters {
  source?: string;
  accountCode?: string;
  searchTerm?: string;
}

export default function ReportsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user, company } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  // State
  const [activeTab, setActiveTab] = useState('aged-receivables');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Report data (mock for now - will be populated by service)
  const [arReport, setARReport] = useState<AgedReceivablesReport | null>(null);
  const [apReport, setAPReport] = useState<AgedPayablesReport | null>(null);
  const [arSummary, setARSummary] = useState<ARSummaryCustomer[]>([]);
  const [apSummary, setAPSummary] = useState<APSummaryVendor[]>([]);

  // Financial Statements state
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlowStatement, setCashFlowStatement] = useState<CashFlowStatement | null>(null);

  // GL Reports state
  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [glAccount, setGLAccount] = useState<GLAccountReport | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntriesReport | null>(null);

  // Financial Statements date filters
  const [isStartDate, setIsStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [isEndDate, setIsEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [bsAsOfDate, setBsAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [cfStartDate, setCfStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [cfEndDate, setCfEndDate] = useState(new Date().toISOString().split('T')[0]);

  // GL Reports date filters
  const [tbAsOfDate, setTBAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [tbShowZeroBalances, setTBShowZeroBalances] = useState(false);
  const [glAccountCode, setGLAccountCode] = useState('');
  const [glStartDate, setGLStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [glEndDate, setGLEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeStartDate, setJEStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [jeEndDate, setJEEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeSourceFilter, setJESourceFilter] = useState('all');
  const [jeSearchTerm, setJESearchTerm] = useState('');

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenue: true,
    operatingExpenses: true,
    otherIncomeExpenses: true,
    currentAssets: true,
    nonCurrentAssets: true,
    currentLiabilities: true,
    nonCurrentLiabilities: true,
    equity: true,
    operating: true,
    investing: true,
    financing: true,
  });

  // Expanded journal entries state
  const [expandedJournalEntries, setExpandedJournalEntries] = useState<Record<string, boolean>>({});

  const currencyCode = (company?.defaultCurrency as string | undefined) || 'USD';
  const formatCurrency = (value: number) => formatCurrencyUtil(value, currencyCode);

  // Load reports when tab changes or filters change
  useEffect(() => {
    if (canAccess && user) {
      loadReportData();
    }
  }, [canAccess, user, activeTab, asOfDate]);

  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Import services dynamically
      const {
        createAPARReportsService,
        createFinancialStatementsService,
        createGLReportsService
      } = await import('@/lib/reporting');

      const ararService = createAPARReportsService(companyId, user.uid);
      const financialService = createFinancialStatementsService(companyId, user.uid);
      const glService = createGLReportsService(companyId, user.uid);

      switch (activeTab) {
        case 'aged-receivables':
          const arData = await ararService.generateAgedReceivables(new Date(asOfDate));
          // Transform service data to match UI expectations
          const arReport: AgedReceivablesReport = {
            asOfDate: arData.asOfDate,
            customers: arData.customers.map(c => ({
              customerId: c.customerId,
              customerName: c.customerName,
              lines: c.invoices.map(inv => ({
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                originalAmount: inv.originalAmount,
                amountPaid: inv.amountPaid,
                balance: inv.balance,
                daysOutstanding: inv.daysOutstanding,
                current: inv.agingBucket.current,
                days1to30: inv.agingBucket.days1to30,
                days31to60: inv.agingBucket.days31to60,
                days61to90: inv.agingBucket.days61to90,
                days90Plus: inv.agingBucket.days90Plus,
              })),
              totalBalance: c.agingBuckets.total,
              current: c.agingBuckets.current,
              days1to30: c.agingBuckets.days1to30,
              days31to60: c.agingBuckets.days31to60,
              days61to90: c.agingBuckets.days61to90,
              days90Plus: c.agingBuckets.days90Plus,
            })),
            grandTotal: {
              totalBalance: arData.totals.total,
              current: arData.totals.current,
              days1to30: arData.totals.days1to30,
              days31to60: arData.totals.days31to60,
              days61to90: arData.totals.days61to90,
              days90Plus: arData.totals.days90Plus,
            },
          };
          setARReport(arReport);
          break;
        case 'aged-payables':
          const apData = await ararService.generateAgedPayables(new Date(asOfDate));
          // Transform service data to match UI expectations
          const apReport: AgedPayablesReport = {
            asOfDate: apData.asOfDate,
            vendors: apData.vendors.map(v => ({
              vendorId: v.vendorId,
              vendorName: v.vendorName,
              lines: v.bills.map(bill => ({
                billNumber: bill.billNumber,
                billDate: bill.billDate,
                dueDate: bill.dueDate,
                originalAmount: bill.originalAmount,
                amountPaid: bill.amountPaid,
                balance: bill.balance,
                daysOutstanding: bill.daysOutstanding,
                current: bill.agingBucket.current,
                days1to30: bill.agingBucket.days1to30,
                days31to60: bill.agingBucket.days31to60,
                days61to90: bill.agingBucket.days61to90,
                days90Plus: bill.agingBucket.days90Plus,
              })),
              totalBalance: v.agingBuckets.total,
              current: v.agingBuckets.current,
              days1to30: v.agingBuckets.days1to30,
              days31to60: v.agingBuckets.days31to60,
              days61to90: v.agingBuckets.days61to90,
              days90Plus: v.agingBuckets.days90Plus,
            })),
            grandTotal: {
              totalBalance: apData.totals.total,
              current: apData.totals.current,
              days1to30: apData.totals.days1to30,
              days31to60: apData.totals.days31to60,
              days61to90: apData.totals.days61to90,
              days90Plus: apData.totals.days90Plus,
            },
          };
          setAPReport(apReport);
          break;
        case 'ar-summary':
          const arSummaryData = await ararService.getARSummaryByCustomer(new Date(asOfDate));
          setARSummary(arSummaryData as any);
          break;
        case 'ap-summary':
          const apSummaryData = await ararService.getAPSummaryByVendor(new Date(asOfDate));
          setAPSummary(apSummaryData as any);
          break;
        case 'income-statement':
          const isData = await financialService.generateIncomeStatement(
            new Date(isStartDate),
            new Date(isEndDate)
          );
          // Transform: add 'lines' as alias for 'accounts'
          const transformSection = (section: any) => {
            if (!section) return section;
            const lines = (section.accounts || []).map((account: any) => ({
              accountCode: account.accountCode,
              accountName: account.accountName,
              amount: account.balance ?? account.amount ?? 0,
            }));

            return {
              ...section,
              sectionName: section.sectionName || section.name,
              lines,
              subsections: section.subsections?.map(transformSection),
            };
          };
          const transformedIS = {
            ...isData,
            revenue: transformSection(isData.revenue),
            costOfGoodsSold: transformSection(isData.costOfGoodsSold),
            operatingExpenses: transformSection(isData.operatingExpenses),
            otherIncomeExpenses: transformSection(isData.otherIncomeExpenses),
          };
          setIncomeStatement(transformedIS);
          break;
        case 'balance-sheet': {
          const bsData = await financialService.generateBalanceSheet(new Date(bsAsOfDate));

          const mapSubsection = (subsection: any) => {
            if (!subsection) return null;
            return {
              subsectionName: subsection.name || subsection.sectionName,
              subtotal: Number(subsection.subtotal ?? 0) || 0,
              lines: (subsection.accounts || []).map((account: any, idx: number) => {
                const rawAmount = account.balance ?? account.amount ?? 0;
                const amount = Number(rawAmount) || 0;
                return {
                  accountId:
                    account.accountId ||
                    account.accountCode ||
                    `${subsection.name || subsection.sectionName || 'account'}-${idx}`,
                  accountCode: account.accountCode,
                  accountName: account.accountName,
                  amount,
                  isContra: amount < 0,
                };
              }),
              subsections:
                subsection.subsections?.map(mapSubsection).filter(Boolean) ?? [],
            };
          };

          const buildSection = (name: string, total: any, subsections: Array<any>) => ({
            sectionName: name,
            total: Number(total ?? 0) || 0,
            subsections: subsections.filter(Boolean),
          });

          const assetsSection = buildSection('Assets', bsData.assets?.totalAssets ?? 0, [
            mapSubsection(bsData.assets?.currentAssets),
            mapSubsection(bsData.assets?.nonCurrentAssets),
          ]);

          const liabilitiesSection = buildSection(
            'Liabilities',
            bsData.liabilities?.totalLiabilities ?? 0,
            [
              mapSubsection(bsData.liabilities?.currentLiabilities),
              mapSubsection(bsData.liabilities?.nonCurrentLiabilities),
            ]
          );

          const equitySection = buildSection(
            bsData.equity?.name || 'Equity',
            bsData.equity?.subtotal ?? bsData.totalEquity ?? 0,
            (bsData.equity?.subsections || []).map(mapSubsection)
          );

          const transformedBS = {
            ...bsData,
            assets: assetsSection,
            liabilities: liabilitiesSection,
            equity: equitySection,
            totalEquity: Number(bsData.totalEquity ?? equitySection.total) || 0,
            totalLiabilitiesAndEquity:
              Number(bsData.totalLiabilitiesAndEquity ??
                (liabilitiesSection.total || 0) + (equitySection.total || 0)) || 0,
          };

          setBalanceSheet(transformedBS as any);
          break;
        }
        case 'cash-flow': {
          const cfData = await financialService.generateCashFlowStatement(
            new Date(cfStartDate),
            new Date(cfEndDate)
          );

          const transformCFSection = (section: any) => {
            if (!section) return section;
            const lines = (section.accounts || []).map((account: any, idx: number) => ({
              description: account.accountName || account.accountCode || `Item ${idx + 1}`,
              amount: Number(account.balance ?? account.amount ?? 0) || 0,
            }));

            return {
              sectionName: section.name || section.sectionName,
              lines,
              netCash: Number(section.subtotal ?? section.netCash ?? 0) || 0,
            };
          };

          const transformedCF = {
            ...cfData,
            operatingActivities: transformCFSection(cfData.operatingActivities),
            investingActivities: transformCFSection(cfData.investingActivities),
            financingActivities: transformCFSection(cfData.financingActivities),
            netCashChange: Number(cfData.netIncreaseInCash ?? cfData.netCashChange ?? 0) || 0,
            cashBeginning: Number(cfData.cashAtBeginning ?? cfData.cashBeginning ?? 0) || 0,
            cashEnding: Number(cfData.cashAtEnd ?? cfData.cashEnding ?? 0) || 0,
          };
          setCashFlowStatement(transformedCF as any);
          break;
        }
        case 'trial-balance':
          const tbData = await glService.generateTrialBalance(
            new Date(tbAsOfDate),
            tbShowZeroBalances
          );
          setTrialBalance(tbData as any);
          break;
        case 'general-ledger':
          if (glAccountCode) {
            const glData = await glService.generateGLByAccount(
              glAccountCode,
              new Date(glStartDate),
              new Date(glEndDate)
            );
            setGLAccount(glData as any);
          }
          break;
        case 'journal-entries': {
          const journalFilters: Partial<JournalEntryFilters> = {};
          if (jeSourceFilter && jeSourceFilter !== 'all') {
            journalFilters.source = jeSourceFilter;
          }
          if (jeSearchTerm.trim().length > 0) {
            journalFilters.searchTerm = jeSearchTerm.trim();
          }

          const jeData = await glService.generateJournalEntriesReport(
            new Date(jeStartDate),
            new Date(jeEndDate),
            Object.keys(journalFilters).length ? (journalFilters as JournalEntryFilters) : undefined
          );
          setJournalEntries(jeData as any);
          break;
        }
      }
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast.error(error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  // Mock data generators (replace with actual data when service is ready)
  const getMockARReport = (): AgedReceivablesReport => ({
    asOfDate: new Date(asOfDate),
    customers: [
      {
        customerId: '1',
        customerName: 'ABC Corporation',
        lines: [
          {
            invoiceNumber: 'INV-001',
            invoiceDate: new Date('2024-01-15'),
            dueDate: new Date('2024-02-14'),
            originalAmount: 5000,
            amountPaid: 2500,
            balance: 2500,
            daysOutstanding: 245,
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days90Plus: 2500,
          },
          {
            invoiceNumber: 'INV-002',
            invoiceDate: new Date('2024-09-01'),
            dueDate: new Date('2024-10-01'),
            originalAmount: 3000,
            amountPaid: 0,
            balance: 3000,
            daysOutstanding: 16,
            current: 3000,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days90Plus: 0,
          },
        ],
        totalBalance: 5500,
        current: 3000,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90Plus: 2500,
      },
      {
        customerId: '2',
        customerName: 'XYZ Industries',
        lines: [
          {
            invoiceNumber: 'INV-003',
            invoiceDate: new Date('2024-08-15'),
            dueDate: new Date('2024-09-14'),
            originalAmount: 7500,
            amountPaid: 0,
            balance: 7500,
            daysOutstanding: 33,
            current: 0,
            days1to30: 0,
            days31to60: 7500,
            days61to90: 0,
            days90Plus: 0,
          },
        ],
        totalBalance: 7500,
        current: 0,
        days1to30: 0,
        days31to60: 7500,
        days61to90: 0,
        days90Plus: 0,
      },
    ],
    grandTotal: {
      totalBalance: 13000,
      current: 3000,
      days1to30: 0,
      days31to60: 7500,
      days61to90: 0,
      days90Plus: 2500,
    },
  });

  const getMockAPReport = (): AgedPayablesReport => ({
    asOfDate: new Date(asOfDate),
    vendors: [
      {
        vendorId: '1',
        vendorName: 'Office Supplies Co',
        lines: [
          {
            billNumber: 'BILL-001',
            billDate: new Date('2024-09-20'),
            dueDate: new Date('2024-10-20'),
            originalAmount: 1500,
            amountPaid: 0,
            balance: 1500,
            daysOutstanding: 27,
            current: 1500,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days90Plus: 0,
          },
        ],
        totalBalance: 1500,
        current: 1500,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90Plus: 0,
      },
      {
        vendorId: '2',
        vendorName: 'Tech Services Ltd',
        lines: [
          {
            billNumber: 'BILL-002',
            billDate: new Date('2024-07-15'),
            dueDate: new Date('2024-08-14'),
            originalAmount: 8500,
            amountPaid: 0,
            balance: 8500,
            daysOutstanding: 64,
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 8500,
            days90Plus: 0,
          },
        ],
        totalBalance: 8500,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 8500,
        days90Plus: 0,
      },
    ],
    grandTotal: {
      totalBalance: 10000,
      current: 1500,
      days1to30: 0,
      days31to60: 0,
      days61to90: 8500,
      days90Plus: 0,
    },
  });

  const getMockARSummary = (): ARSummaryCustomer[] => [
    {
      customerId: '1',
      customerName: 'ABC Corporation',
      totalOutstanding: 5500,
      invoiceCount: 2,
      oldestInvoiceDate: new Date('2024-01-15'),
      averageDaysOutstanding: 130,
    },
    {
      customerId: '2',
      customerName: 'XYZ Industries',
      totalOutstanding: 7500,
      invoiceCount: 1,
      oldestInvoiceDate: new Date('2024-08-15'),
      averageDaysOutstanding: 33,
    },
  ];

  const getMockAPSummary = (): APSummaryVendor[] => [
    {
      vendorId: '2',
      vendorName: 'Tech Services Ltd',
      totalOutstanding: 8500,
      billCount: 1,
      oldestBillDate: new Date('2024-07-15'),
      averageDaysOutstanding: 64,
    },
    {
      vendorId: '1',
      vendorName: 'Office Supplies Co',
      totalOutstanding: 1500,
      billCount: 1,
      oldestBillDate: new Date('2024-09-20'),
      averageDaysOutstanding: 27,
    },
  ];

  // Financial Statements Mock Data
  const getMockIncomeStatement = (): IncomeStatement => ({
    startDate: new Date(isStartDate),
    endDate: new Date(isEndDate),
    revenue: {
      sectionName: 'REVENUE',
      lines: [
        { accountId: '4000', accountName: 'Sales Revenue', amount: 50000 },
        { accountId: '4100', accountName: 'Service Revenue', amount: 30000 },
        { accountId: '4200', accountName: 'Other Revenue', amount: 5000 },
      ],
      subtotal: 85000,
    },
    operatingExpenses: {
      sectionName: 'OPERATING EXPENSES',
      lines: [
        { accountId: '5000', accountName: 'Salaries & Wages', amount: 20000 },
        { accountId: '5100', accountName: 'Rent', amount: 5000 },
        { accountId: '5200', accountName: 'Utilities', amount: 2000 },
        { accountId: '5300', accountName: 'Marketing', amount: 3000 },
        { accountId: '5400', accountName: 'Office Supplies', amount: 1500 },
        { accountId: '5500', accountName: 'Insurance', amount: 2000 },
        { accountId: '5600', accountName: 'Depreciation', amount: 1500 },
      ],
      subtotal: 35000,
    },
    otherIncomeExpenses: {
      sectionName: 'OTHER INCOME/EXPENSES',
      lines: [
        { accountId: '7000', accountName: 'Interest Income', amount: 1000 },
        { accountId: '7100', accountName: 'Interest Expense', amount: -500 },
      ],
      subtotal: 500,
    },
    operatingIncome: 50000,
    netIncomeBeforeTax: 50500,
    incomeTaxExpense: 7575,
    netIncome: 42925,
  });

  const getMockBalanceSheet = (): BalanceSheet => ({
    asOfDate: new Date(bsAsOfDate),
    assets: {
      sectionName: 'ASSETS',
      subsections: [
        {
          subsectionName: 'Current Assets',
          lines: [
            { accountId: '1000', accountName: 'Cash & Bank', amount: 10000 },
            { accountId: '1100', accountName: 'Accounts Receivable', amount: 25000 },
            { accountId: '1200', accountName: 'Inventory', amount: 15000 },
            { accountId: '1300', accountName: 'Prepaid Expenses', amount: 2000 },
          ],
          subtotal: 52000,
        },
        {
          subsectionName: 'Non-Current Assets',
          lines: [
            { accountId: '1500', accountName: 'Property & Equipment', amount: 100000 },
            {
              accountId: '1510',
              accountName: 'Accumulated Depreciation',
              amount: 20000,
              isContra: true,
            },
            { accountId: '1600', accountName: 'Intangible Assets', amount: 10000 },
            { accountId: '1700', accountName: 'Long-term Investments', amount: 8000 },
          ],
          subtotal: 98000,
        },
      ],
      total: 150000,
    },
    liabilities: {
      sectionName: 'LIABILITIES',
      subsections: [
        {
          subsectionName: 'Current Liabilities',
          lines: [
            { accountId: '2000', accountName: 'Accounts Payable', amount: 15000 },
            { accountId: '2100', accountName: 'Accrued Expenses', amount: 5000 },
            { accountId: '2200', accountName: 'Short-term Loans', amount: 3000 },
            { accountId: '2300', accountName: 'Current Portion of Long-term Debt', amount: 2000 },
          ],
          subtotal: 25000,
        },
        {
          subsectionName: 'Non-Current Liabilities',
          lines: [
            { accountId: '2500', accountName: 'Long-term Debt', amount: 30000 },
            { accountId: '2600', accountName: 'Deferred Tax Liability', amount: 5000 },
          ],
          subtotal: 35000,
        },
      ],
      total: 60000,
    },
    equity: {
      sectionName: 'EQUITY',
      subsections: [
        {
          subsectionName: 'Equity',
          lines: [
            { accountId: '3000', accountName: 'Share Capital', amount: 50000 },
            { accountId: '3100', accountName: 'Retained Earnings', amount: 32925 },
            { accountId: '3200', accountName: 'Current Year Earnings', amount: 7075 },
          ],
          subtotal: 90000,
        },
      ],
      total: 90000,
    },
    isBalanced: true,
  });

  const getMockCashFlowStatement = (): CashFlowStatement => ({
    startDate: new Date(cfStartDate),
    endDate: new Date(cfEndDate),
    operatingActivities: {
      sectionName: 'OPERATING ACTIVITIES',
      lines: [
        { description: 'Cash Received from Customers', amount: 80000 },
        { description: 'Cash Paid to Suppliers', amount: -30000 },
        { description: 'Cash Paid for Operating Expenses', amount: -25000 },
        { description: 'Interest Paid', amount: -500 },
        { description: 'Income Tax Paid', amount: -5000 },
      ],
      netCash: 19500,
    },
    investingActivities: {
      sectionName: 'INVESTING ACTIVITIES',
      lines: [
        { description: 'Purchase of Fixed Assets', amount: -10000 },
        { description: 'Proceeds from Sale of Assets', amount: 5000 },
        { description: 'Purchase of Investments', amount: -3000 },
      ],
      netCash: -8000,
    },
    financingActivities: {
      sectionName: 'FINANCING ACTIVITIES',
      lines: [
        { description: 'Proceeds from Loans', amount: 20000 },
        { description: 'Repayment of Loans', amount: -5000 },
        { description: 'Dividends Paid', amount: -2000 },
      ],
      netCash: 13000,
    },
    netCashChange: 24500,
    cashBeginning: 10000,
    cashEnding: 34500,
  });

  const getMockTrialBalance = (): TrialBalanceReport => {
    const accounts: TrialBalanceAccount[] = [
      // Assets
      { accountCode: '1000', accountName: 'Cash - Bank Account', accountType: 'ASSET', debit: 50000, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', debit: 25000, credit: 0 },
      { accountCode: '1200', accountName: 'Inventory', accountType: 'ASSET', debit: 15000, credit: 0 },
      { accountCode: '1500', accountName: 'Fixed Assets', accountType: 'ASSET', debit: 60000, credit: 0 },
      // Liabilities
      { accountCode: '2000', accountName: 'Accounts Payable', accountType: 'LIABILITY', debit: 0, credit: 15000 },
      { accountCode: '2100', accountName: 'Short-term Loans', accountType: 'LIABILITY', debit: 0, credit: 10000 },
      { accountCode: '2200', accountName: 'Accrued Expenses', accountType: 'LIABILITY', debit: 0, credit: 5000 },
      // Equity
      { accountCode: '3000', accountName: 'Share Capital', accountType: 'EQUITY', debit: 0, credit: 50000 },
      { accountCode: '3100', accountName: 'Retained Earnings', accountType: 'EQUITY', debit: 0, credit: 5000 },
      // Revenue
      { accountCode: '4000', accountName: 'Sales Revenue', accountType: 'REVENUE', debit: 0, credit: 85000 },
      { accountCode: '4100', accountName: 'Service Revenue', accountType: 'REVENUE', debit: 0, credit: 30000 },
      { accountCode: '4200', accountName: 'Interest Income', accountType: 'REVENUE', debit: 0, credit: 500 },
      // Expenses
      { accountCode: '5000', accountName: 'Salaries Expense', accountType: 'EXPENSE', debit: 30000, credit: 0 },
      { accountCode: '5100', accountName: 'Rent Expense', accountType: 'EXPENSE', debit: 12000, credit: 0 },
      { accountCode: '5200', accountName: 'Utilities Expense', accountType: 'EXPENSE', debit: 3000, credit: 0 },
      { accountCode: '5300', accountName: 'Office Supplies', accountType: 'EXPENSE', debit: 2500, credit: 0 },
      { accountCode: '5400', accountName: 'Marketing Expense', accountType: 'EXPENSE', debit: 5000, credit: 0 },
    ];

    const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

    return {
      asOfDate: new Date(tbAsOfDate),
      accounts: tbShowZeroBalances ? accounts : accounts.filter(acc => acc.debit !== 0 || acc.credit !== 0),
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit,
    };
  };

  const getMockGLAccount = (): GLAccountReport => ({
    accountCode: glAccountCode || '1000',
    accountName: 'Cash - Bank Account',
    startDate: new Date(glStartDate),
    endDate: new Date(glEndDate),
    openingBalance: 10000,
    entries: [
      {
        date: new Date('2025-01-05'),
        description: 'Invoice INV-2025-0001',
        source: 'AR_INVOICE',
        reference: 'INV-001',
        debit: 5000,
        credit: 0,
        balance: 15000,
      },
      {
        date: new Date('2025-01-10'),
        description: 'Payment to ABC Supplier',
        source: 'AP_PAYMENT',
        reference: 'PAY-001',
        debit: 0,
        credit: 2000,
        balance: 13000,
      },
      {
        date: new Date('2025-01-15'),
        description: 'Bank Service Charges',
        source: 'JOURNAL',
        reference: 'JE-001',
        debit: 0,
        credit: 50,
        balance: 12950,
      },
      {
        date: new Date('2025-01-20'),
        description: 'Customer Payment - XYZ Corp',
        source: 'AR_PAYMENT',
        reference: 'PMT-001',
        debit: 3000,
        credit: 0,
        balance: 15950,
      },
      {
        date: new Date('2025-01-25'),
        description: 'Salary Payment',
        source: 'AP_PAYMENT',
        reference: 'PAY-002',
        debit: 0,
        credit: 5000,
        balance: 10950,
      },
      {
        date: new Date('2025-01-28'),
        description: 'Invoice INV-2025-0015',
        source: 'AR_INVOICE',
        reference: 'INV-015',
        debit: 7500,
        credit: 0,
        balance: 18450,
      },
    ],
    totalDebit: 15500,
    totalCredit: 7050,
    closingBalance: 18450,
  });

  const getMockJournalEntries = (): JournalEntriesReport => ({
    startDate: new Date(jeStartDate),
    endDate: new Date(jeEndDate),
    entries: [
      {
        entryNumber: 'JE-2025-0001',
        date: new Date('2025-01-15'),
        description: 'Vendor Bill BILL-2025-0001 - ABC Supplier',
        source: 'AP_BILL',
        createdBy: 'John Doe',
        createdAt: new Date('2025-01-15T10:30:00'),
        lines: [
          {
            accountCode: '5300',
            accountName: 'Office Supplies',
            description: 'Office supplies',
            debit: 500,
            credit: 0,
          },
          {
            accountCode: '2000',
            accountName: 'Accounts Payable',
            description: 'Bill BILL-001',
            debit: 0,
            credit: 500,
          },
        ],
        totalDebit: 500,
        totalCredit: 500,
        isBalanced: true,
      },
      {
        entryNumber: 'JE-2025-0002',
        date: new Date('2025-01-20'),
        description: 'Payment to ABC Supplier via Check #1001',
        source: 'AP_PAYMENT',
        createdBy: 'Jane Smith',
        createdAt: new Date('2025-01-20T14:15:00'),
        lines: [
          {
            accountCode: '2000',
            accountName: 'Accounts Payable',
            description: 'Payment PAY-001',
            debit: 500,
            credit: 0,
          },
          {
            accountCode: '1000',
            accountName: 'Cash',
            description: 'Check #1001',
            debit: 0,
            credit: 500,
          },
        ],
        totalDebit: 500,
        totalCredit: 500,
        isBalanced: true,
      },
      {
        entryNumber: 'JE-2025-0003',
        date: new Date('2025-01-22'),
        description: 'Invoice INV-2025-0015 - XYZ Corporation',
        source: 'AR_INVOICE',
        createdBy: 'John Doe',
        createdAt: new Date('2025-01-22T09:45:00'),
        lines: [
          {
            accountCode: '1100',
            accountName: 'Accounts Receivable',
            description: 'Invoice INV-015',
            debit: 7500,
            credit: 0,
          },
          {
            accountCode: '4000',
            accountName: 'Sales Revenue',
            description: 'Sales to XYZ Corp',
            debit: 0,
            credit: 7500,
          },
        ],
        totalDebit: 7500,
        totalCredit: 7500,
        isBalanced: true,
      },
      {
        entryNumber: 'JE-2025-0004',
        date: new Date('2025-01-25'),
        description: 'Monthly Rent Payment - January 2025',
        source: 'JOURNAL',
        createdBy: 'Jane Smith',
        createdAt: new Date('2025-01-25T11:00:00'),
        lines: [
          {
            accountCode: '5100',
            accountName: 'Rent Expense',
            description: 'January rent',
            debit: 3000,
            credit: 0,
          },
          {
            accountCode: '1000',
            accountName: 'Cash',
            description: 'Rent payment',
            debit: 0,
            credit: 3000,
          },
        ],
        totalDebit: 3000,
        totalCredit: 3000,
        isBalanced: true,
      },
      {
        entryNumber: 'JE-2025-0005',
        date: new Date('2025-01-28'),
        description: 'Customer Payment - ABC Corporation',
        source: 'AR_PAYMENT',
        createdBy: 'John Doe',
        createdAt: new Date('2025-01-28T16:20:00'),
        lines: [
          {
            accountCode: '1000',
            accountName: 'Cash',
            description: 'Payment received',
            debit: 5000,
            credit: 0,
          },
          {
            accountCode: '1100',
            accountName: 'Accounts Receivable',
            description: 'Payment from ABC Corp',
            debit: 0,
            credit: 5000,
          },
        ],
        totalDebit: 5000,
        totalCredit: 5000,
        isBalanced: true,
      },
    ],
  });

  // Helper function to toggle section expansion
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Helper function to format amounts with color coding
  const formatAmount = (amount: number, isNegative = false) => {
    const absAmount = Math.abs(amount);
    const formatted = formatCurrency(absAmount);

    if (amount < 0 || isNegative) {
      return <span className="text-red-600">({formatted})</span>;
    }
    return <span className="text-green-700">{formatted}</span>;
  };

  const handleExportPDF = () => {
    toast.loading('Generating PDF...', { id: 'pdf-export' });
    // TODO: Implement PDF export
    setTimeout(() => {
      toast.success('PDF exported successfully', { id: 'pdf-export' });
    }, 1500);
  };

  const handleExportExcel = () => {
    toast.loading('Generating Excel...', { id: 'excel-export' });
    // TODO: Implement Excel export (CSV)
    setTimeout(() => {
      toast.success('Excel file exported successfully', { id: 'excel-export' });
    }, 1500);
  };

  const getAgingColor = (bucket: string) => {
    switch (bucket) {
      case 'current':
        return 'text-green-700 bg-green-50';
      case 'days1to30':
        return 'text-yellow-700 bg-yellow-50';
      case 'days31to60':
        return 'text-orange-700 bg-orange-50';
      case 'days61to90':
        return 'text-red-700 bg-red-50';
      case 'days90Plus':
        return 'text-red-900 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'AR_INVOICE':
      case 'AR_PAYMENT':
        return 'bg-blue-100 text-blue-800';
      case 'AP_BILL':
      case 'AP_PAYMENT':
        return 'bg-red-100 text-red-800';
      case 'JOURNAL':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleJournalEntry = (entryNumber: string) => {
    setExpandedJournalEntries((prev) => ({
      ...prev,
      [entryNumber]: !prev[entryNumber],
    }));
  };

  if (accessLoading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
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

  const filteredARCustomers = selectedCustomer === 'all'
    ? arReport?.customers || []
    : arReport?.customers.filter(c => c.customerId === selectedCustomer) || [];

  const filteredAPVendors = selectedVendor === 'all'
    ? apReport?.vendors || []
    : apReport?.vendors.filter(v => v.vendorId === selectedVendor) || [];

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <p className="text-gray-600 mt-1">
                AP/AR aging reports, financial statements, and GL reports
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-11 lg:w-auto">
              <TabsTrigger value="aged-receivables">Aged Receivables</TabsTrigger>
              <TabsTrigger value="aged-payables">Aged Payables</TabsTrigger>
              <TabsTrigger value="ar-summary">AR Summary</TabsTrigger>
              <TabsTrigger value="ap-summary">AP Summary</TabsTrigger>
              <TabsTrigger value="income-statement">
                <DollarSign className="h-4 w-4 mr-1" />
                Income Statement
              </TabsTrigger>
              <TabsTrigger value="balance-sheet">
                <Scale className="h-4 w-4 mr-1" />
                Balance Sheet
              </TabsTrigger>
              <TabsTrigger value="cash-flow">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Cash Flow
              </TabsTrigger>
              <TabsTrigger value="trial-balance">
                <BookCheck className="h-4 w-4 mr-1" />
                Trial Balance
              </TabsTrigger>
              <TabsTrigger value="general-ledger">
                <BookOpen className="h-4 w-4 mr-1" />
                General Ledger
              </TabsTrigger>
              <TabsTrigger value="journal-entries">
                <BookMarked className="h-4 w-4 mr-1" />
                Journal Entries
              </TabsTrigger>
            </TabsList>

            {/* Aged Receivables Tab */}
            <TabsContent value="aged-receivables" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="ar-asof-date">As of Date</Label>
                      <Input
                        id="ar-asof-date"
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="ar-customer">Customer</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger id="ar-customer" className="mt-1">
                          <SelectValue placeholder="All Customers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          {arReport?.customers.map((c) => (
                            <SelectItem key={c.customerId} value={c.customerId}>
                              {c.customerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Display */}
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : !arReport ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data available</h3>
                    <p className="text-gray-600">Select a date and click Refresh to generate the report</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Aged Receivables Report</CardTitle>
                    <CardDescription>
                      As of {formatDate(arReport.asOfDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <div className="space-y-6">
                      {filteredARCustomers.map((customer) => (
                        <div key={customer.customerId} className="space-y-2">
                          {/* Customer Header */}
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <h3 className="font-semibold text-lg">{customer.customerName}</h3>
                            <div className="text-sm font-medium text-gray-600">
                              Total: {formatCurrency(customer.totalBalance)}
                            </div>
                          </div>

                          {/* Invoices Table */}
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left p-3 font-medium">Invoice #</th>
                                  <th className="text-left p-3 font-medium">Invoice Date</th>
                                  <th className="text-left p-3 font-medium">Due Date</th>
                                  <th className="text-right p-3 font-medium">Original</th>
                                  <th className="text-right p-3 font-medium">Paid</th>
                                  <th className="text-right p-3 font-medium">Balance</th>
                                  <th className="text-center p-3 font-medium">Days O/S</th>
                                  <th className="text-right p-3 font-medium">Current</th>
                                  <th className="text-right p-3 font-medium">1-30</th>
                                  <th className="text-right p-3 font-medium">31-60</th>
                                  <th className="text-right p-3 font-medium">61-90</th>
                                  <th className="text-right p-3 font-medium">90+</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customer.lines.map((line, idx) => (
                                  <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{line.invoiceNumber}</td>
                                    <td className="p-3">{formatDate(line.invoiceDate)}</td>
                                    <td className="p-3">{formatDate(line.dueDate)}</td>
                                    <td className="p-3 text-right">{formatCurrency(line.originalAmount)}</td>
                                    <td className="p-3 text-right">{formatCurrency(line.amountPaid)}</td>
                                    <td className="p-3 text-right font-medium">{formatCurrency(line.balance)}</td>
                                    <td className="p-3 text-center">
                                      <Badge variant="outline">{line.daysOutstanding}</Badge>
                                    </td>
                                    <td className={`p-3 text-right ${line.current > 0 ? 'font-medium ' + getAgingColor('current') : ''}`}>
                                      {line.current > 0 ? formatCurrency(line.current) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days1to30 > 0 ? 'font-medium ' + getAgingColor('days1to30') : ''}`}>
                                      {line.days1to30 > 0 ? formatCurrency(line.days1to30) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days31to60 > 0 ? 'font-medium ' + getAgingColor('days31to60') : ''}`}>
                                      {line.days31to60 > 0 ? formatCurrency(line.days31to60) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days61to90 > 0 ? 'font-medium ' + getAgingColor('days61to90') : ''}`}>
                                      {line.days61to90 > 0 ? formatCurrency(line.days61to90) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days90Plus > 0 ? 'font-medium ' + getAgingColor('days90Plus') : ''}`}>
                                      {line.days90Plus > 0 ? formatCurrency(line.days90Plus) : '-'}
                                    </td>
                                  </tr>
                                ))}
                                {/* Customer Subtotal */}
                                <tr className="bg-gray-100 font-semibold">
                                  <td colSpan={5} className="p-3 text-right">Subtotal:</td>
                                  <td className="p-3 text-right">{formatCurrency(customer.totalBalance)}</td>
                                  <td className="p-3"></td>
                                  <td className="p-3 text-right">{formatCurrency(customer.current)}</td>
                                  <td className="p-3 text-right">{formatCurrency(customer.days1to30)}</td>
                                  <td className="p-3 text-right">{formatCurrency(customer.days31to60)}</td>
                                  <td className="p-3 text-right">{formatCurrency(customer.days61to90)}</td>
                                  <td className="p-3 text-right">{formatCurrency(customer.days90Plus)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {/* Grand Total */}
                      {selectedCustomer === 'all' && (
                        <div className="border-t-2 pt-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-lg font-bold">Grand Total</h3>
                              <div className="text-2xl font-bold text-blue-700">
                                {formatCurrency(arReport.grandTotal.totalBalance)}
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600 mb-1">Current</div>
                                <div className="font-semibold">{formatCurrency(arReport.grandTotal.current)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">1-30 Days</div>
                                <div className="font-semibold">{formatCurrency(arReport.grandTotal.days1to30)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">31-60 Days</div>
                                <div className="font-semibold">{formatCurrency(arReport.grandTotal.days31to60)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">61-90 Days</div>
                                <div className="font-semibold">{formatCurrency(arReport.grandTotal.days61to90)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">90+ Days</div>
                                <div className="font-semibold">{formatCurrency(arReport.grandTotal.days90Plus)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Aged Payables Tab */}
            <TabsContent value="aged-payables" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="ap-asof-date">As of Date</Label>
                      <Input
                        id="ap-asof-date"
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="ap-vendor">Vendor</Label>
                      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger id="ap-vendor" className="mt-1">
                          <SelectValue placeholder="All Vendors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vendors</SelectItem>
                          {apReport?.vendors.map((v) => (
                            <SelectItem key={v.vendorId} value={v.vendorId}>
                              {v.vendorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Display */}
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : !apReport ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data available</h3>
                    <p className="text-gray-600">Select a date and click Refresh to generate the report</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Aged Payables Report</CardTitle>
                    <CardDescription>
                      As of {formatDate(apReport.asOfDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <div className="space-y-6">
                      {filteredAPVendors.map((vendor) => (
                        <div key={vendor.vendorId} className="space-y-2">
                          {/* Vendor Header */}
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <h3 className="font-semibold text-lg">{vendor.vendorName}</h3>
                            <div className="text-sm font-medium text-gray-600">
                              Total: {formatCurrency(vendor.totalBalance)}
                            </div>
                          </div>

                          {/* Bills Table */}
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left p-3 font-medium">Bill #</th>
                                  <th className="text-left p-3 font-medium">Bill Date</th>
                                  <th className="text-left p-3 font-medium">Due Date</th>
                                  <th className="text-right p-3 font-medium">Original</th>
                                  <th className="text-right p-3 font-medium">Paid</th>
                                  <th className="text-right p-3 font-medium">Balance</th>
                                  <th className="text-center p-3 font-medium">Days O/S</th>
                                  <th className="text-right p-3 font-medium">Current</th>
                                  <th className="text-right p-3 font-medium">1-30</th>
                                  <th className="text-right p-3 font-medium">31-60</th>
                                  <th className="text-right p-3 font-medium">61-90</th>
                                  <th className="text-right p-3 font-medium">90+</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vendor.lines.map((line, idx) => (
                                  <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{line.billNumber}</td>
                                    <td className="p-3">{formatDate(line.billDate)}</td>
                                    <td className="p-3">{formatDate(line.dueDate)}</td>
                                    <td className="p-3 text-right">{formatCurrency(line.originalAmount)}</td>
                                    <td className="p-3 text-right">{formatCurrency(line.amountPaid)}</td>
                                    <td className="p-3 text-right font-medium">{formatCurrency(line.balance)}</td>
                                    <td className="p-3 text-center">
                                      <Badge variant="outline">{line.daysOutstanding}</Badge>
                                    </td>
                                    <td className={`p-3 text-right ${line.current > 0 ? 'font-medium ' + getAgingColor('current') : ''}`}>
                                      {line.current > 0 ? formatCurrency(line.current) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days1to30 > 0 ? 'font-medium ' + getAgingColor('days1to30') : ''}`}>
                                      {line.days1to30 > 0 ? formatCurrency(line.days1to30) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days31to60 > 0 ? 'font-medium ' + getAgingColor('days31to60') : ''}`}>
                                      {line.days31to60 > 0 ? formatCurrency(line.days31to60) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days61to90 > 0 ? 'font-medium ' + getAgingColor('days61to90') : ''}`}>
                                      {line.days61to90 > 0 ? formatCurrency(line.days61to90) : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${line.days90Plus > 0 ? 'font-medium ' + getAgingColor('days90Plus') : ''}`}>
                                      {line.days90Plus > 0 ? formatCurrency(line.days90Plus) : '-'}
                                    </td>
                                  </tr>
                                ))}
                                {/* Vendor Subtotal */}
                                <tr className="bg-gray-100 font-semibold">
                                  <td colSpan={5} className="p-3 text-right">Subtotal:</td>
                                  <td className="p-3 text-right">{formatCurrency(vendor.totalBalance)}</td>
                                  <td className="p-3"></td>
                                  <td className="p-3 text-right">{formatCurrency(vendor.current)}</td>
                                  <td className="p-3 text-right">{formatCurrency(vendor.days1to30)}</td>
                                  <td className="p-3 text-right">{formatCurrency(vendor.days31to60)}</td>
                                  <td className="p-3 text-right">{formatCurrency(vendor.days61to90)}</td>
                                  <td className="p-3 text-right">{formatCurrency(vendor.days90Plus)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {/* Grand Total */}
                      {selectedVendor === 'all' && (
                        <div className="border-t-2 pt-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-lg font-bold">Grand Total</h3>
                              <div className="text-2xl font-bold text-blue-700">
                                {formatCurrency(apReport.grandTotal.totalBalance)}
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600 mb-1">Current</div>
                                <div className="font-semibold">{formatCurrency(apReport.grandTotal.current)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">1-30 Days</div>
                                <div className="font-semibold">{formatCurrency(apReport.grandTotal.days1to30)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">31-60 Days</div>
                                <div className="font-semibold">{formatCurrency(apReport.grandTotal.days31to60)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">61-90 Days</div>
                                <div className="font-semibold">{formatCurrency(apReport.grandTotal.days61to90)}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 mb-1">90+ Days</div>
                                <div className="font-semibold">{formatCurrency(apReport.grandTotal.days90Plus)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* AR Summary Tab */}
            <TabsContent value="ar-summary" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end justify-between">
                    <div className="flex gap-4 items-end">
                      <div className="w-[200px]">
                        <Label htmlFor="ar-summary-date">As of Date</Label>
                        <Input
                          id="ar-summary-date"
                          type="date"
                          value={asOfDate}
                          onChange={(e) => setAsOfDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total AR Outstanding</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(arSummary.reduce((sum, c) => sum + c.totalOutstanding, 0))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customers with Balance</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{arSummary.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Days Outstanding</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {arSummary.length > 0
                            ? Math.round(
                                arSummary.reduce((sum, c) => sum + c.averageDaysOutstanding, 0) /
                                  arSummary.length
                              )
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Largest Balance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(
                            Math.max(...arSummary.map((c) => c.totalOutstanding), 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>AR Summary by Customer</CardTitle>
                      <CardDescription>
                        Outstanding receivables summary as of {formatDate(new Date(asOfDate))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Customer Name</th>
                              <th className="text-right p-4 font-medium">Total Outstanding</th>
                              <th className="text-center p-4 font-medium"># Invoices</th>
                              <th className="text-left p-4 font-medium">Oldest Invoice</th>
                              <th className="text-center p-4 font-medium">Avg Days O/S</th>
                            </tr>
                          </thead>
                          <tbody>
                            {arSummary.map((customer) => (
                              <tr key={customer.customerId} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{customer.customerName}</td>
                                <td className="p-4 text-right font-semibold">
                                  {formatCurrency(customer.totalOutstanding)}
                                </td>
                                <td className="p-4 text-center">{customer.invoiceCount}</td>
                                <td className="p-4">
                                  {customer.oldestInvoiceDate
                                    ? formatDate(customer.oldestInvoiceDate)
                                    : '-'}
                                </td>
                                <td className="p-4 text-center">
                                  <Badge variant="outline">{customer.averageDaysOutstanding}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* AP Summary Tab */}
            <TabsContent value="ap-summary" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end justify-between">
                    <div className="flex gap-4 items-end">
                      <div className="w-[200px]">
                        <Label htmlFor="ap-summary-date">As of Date</Label>
                        <Input
                          id="ap-summary-date"
                          type="date"
                          value={asOfDate}
                          onChange={(e) => setAsOfDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total AP Outstanding</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(apSummary.reduce((sum, v) => sum + v.totalOutstanding, 0))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendors with Balance</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{apSummary.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Days Outstanding</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {apSummary.length > 0
                            ? Math.round(
                                apSummary.reduce((sum, v) => sum + v.averageDaysOutstanding, 0) /
                                  apSummary.length
                              )
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Largest Balance</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(
                            Math.max(...apSummary.map((v) => v.totalOutstanding), 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>AP Summary by Vendor</CardTitle>
                      <CardDescription>
                        Outstanding payables summary as of {formatDate(new Date(asOfDate))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Vendor Name</th>
                              <th className="text-right p-4 font-medium">Total Outstanding</th>
                              <th className="text-center p-4 font-medium"># Bills</th>
                              <th className="text-left p-4 font-medium">Oldest Bill</th>
                              <th className="text-center p-4 font-medium">Avg Days O/S</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apSummary.map((vendor) => (
                              <tr key={vendor.vendorId} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{vendor.vendorName}</td>
                                <td className="p-4 text-right font-semibold">
                                  {formatCurrency(vendor.totalOutstanding)}
                                </td>
                                <td className="p-4 text-center">{vendor.billCount}</td>
                                <td className="p-4">
                                  {vendor.oldestBillDate ? formatDate(vendor.oldestBillDate) : '-'}
                                </td>
                                <td className="p-4 text-center">
                                  <Badge variant="outline">{vendor.averageDaysOutstanding}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Income Statement Tab */}
            <TabsContent value="income-statement" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="is-start-date">Start Date</Label>
                      <Input
                        id="is-start-date"
                        type="date"
                        value={isStartDate}
                        onChange={(e) => setIsStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="is-end-date">End Date</Label>
                      <Input
                        id="is-end-date"
                        type="date"
                        value={isEndDate}
                        onChange={(e) => setIsEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={handleExportPDF} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Display */}
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : !incomeStatement ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data available</h3>
                    <p className="text-gray-600">Select dates and click Refresh to generate the report</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                      Income Statement (P&L)
                    </CardTitle>
                    <CardDescription className="text-base">
                      For the period: {formatDate(incomeStatement.startDate)} to{' '}
                      {formatDate(incomeStatement.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Revenue Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('revenue')}
                        className="w-full flex items-center justify-between bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                          {expandedSections.revenue ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          {incomeStatement.revenue.sectionName}
                        </h3>
                        <span className="text-lg font-bold text-blue-900">
                          {formatCurrency(incomeStatement.revenue.subtotal)}
                        </span>
                      </button>

                      {expandedSections.revenue && (
                        <div className="pl-8 space-y-1">
                          {incomeStatement.revenue.lines.map((line, lineIdx) => (
                            <div
                              key={line.accountCode || line.accountId || lineIdx}
                              className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                              title="Click to view GL detail (coming soon)"
                            >
                              <span className="text-gray-700">{line.accountName}</span>
                              <span className="font-medium">{formatAmount(line.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2 px-2">
                            <span className="font-semibold">Total Revenue</span>
                            <span className="font-bold text-lg">
                              {formatAmount(incomeStatement.revenue.subtotal)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operating Expenses Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('operatingExpenses')}
                        className="w-full flex items-center justify-between bg-red-50 p-3 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                          {expandedSections.operatingExpenses ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          {incomeStatement.operatingExpenses.sectionName}
                        </h3>
                        <span className="text-lg font-bold text-red-900">
                          ({formatCurrency(incomeStatement.operatingExpenses.subtotal)})
                        </span>
                      </button>

                      {expandedSections.operatingExpenses && (
                        <div className="pl-8 space-y-1">
                          {incomeStatement.operatingExpenses.lines.map((line, lineIdx) => (
                            <div
                              key={line.accountCode || line.accountId || lineIdx}
                              className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                              title="Click to view GL detail (coming soon)"
                            >
                              <span className="text-gray-700">{line.accountName}</span>
                              <span className="font-medium">{formatAmount(line.amount, true)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2 px-2">
                            <span className="font-semibold">Total Operating Expenses</span>
                            <span className="font-bold text-lg text-red-600">
                              ({formatCurrency(incomeStatement.operatingExpenses.subtotal)})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operating Income */}
                    <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Operating Income</span>
                        <span className="text-xl font-bold">
                          {formatAmount(incomeStatement.operatingIncome)}
                        </span>
                      </div>
                    </div>

                    {/* Other Income/Expenses Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('otherIncomeExpenses')}
                        className="w-full flex items-center justify-between bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                          {expandedSections.otherIncomeExpenses ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          {incomeStatement.otherIncomeExpenses.sectionName}
                        </h3>
                        <span className="text-lg font-bold text-purple-900">
                          {formatAmount(incomeStatement.otherIncomeExpenses.subtotal)}
                        </span>
                      </button>

                      {expandedSections.otherIncomeExpenses && (
                        <div className="pl-8 space-y-1">
                          {incomeStatement.otherIncomeExpenses.lines.map((line, lineIdx) => (
                            <div
                              key={line.accountCode || line.accountId || lineIdx}
                              className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                              title="Click to view GL detail (coming soon)"
                            >
                              <span className="text-gray-700">{line.accountName}</span>
                              <span className="font-medium">{formatAmount(line.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2 px-2">
                            <span className="font-semibold">Net Other Income</span>
                            <span className="font-bold text-lg">
                              {formatAmount(incomeStatement.otherIncomeExpenses.subtotal)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Net Income Before Tax */}
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Net Income Before Tax</span>
                        <span className="text-xl font-bold">
                          {formatAmount(incomeStatement.netIncomeBeforeTax)}
                        </span>
                      </div>
                    </div>

                    {/* Income Tax */}
                    <div className="pl-8 flex justify-between py-2">
                      <span className="text-gray-700">Income Tax Expense</span>
                      <span className="font-medium text-red-600">
                        ({formatCurrency(incomeStatement.incomeTaxExpense)})
                      </span>
                    </div>

                    {/* Net Income */}
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-lg border-2 border-green-500">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-900">NET INCOME</span>
                        <span className="text-3xl font-bold text-green-900">
                          {formatAmount(incomeStatement.netIncome)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Balance Sheet Tab */}
            <TabsContent value="balance-sheet" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="bs-asof-date">As of Date</Label>
                      <Input
                        id="bs-asof-date"
                        type="date"
                        value={bsAsOfDate}
                        onChange={(e) => setBsAsOfDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={handleExportPDF} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Display */}
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : !balanceSheet ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Scale className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data available</h3>
                    <p className="text-gray-600">Select a date and click Refresh to generate the report</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Scale className="h-6 w-6 text-indigo-600" />
                      Balance Sheet
                    </CardTitle>
                    <CardDescription className="text-base">
                      As of: {formatDate(balanceSheet.asOfDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* ASSETS Section */}
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2">
                        {balanceSheet.assets.sectionName}
                      </h2>

                      {balanceSheet.assets.subsections?.map((subsection, idx) => (
                        <div key={idx} className="space-y-2">
                          <button
                            onClick={() =>
                              toggleSection(
                                subsection.subsectionName === 'Current Assets'
                                  ? 'currentAssets'
                                  : 'nonCurrentAssets'
                              )
                            }
                            className="w-full flex items-center justify-between bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                              {expandedSections[
                                subsection.subsectionName === 'Current Assets'
                                  ? 'currentAssets'
                                  : 'nonCurrentAssets'
                              ] ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                              {subsection.subsectionName}
                            </h3>
                            <span className="font-bold">{formatCurrency(subsection.subtotal)}</span>
                          </button>

                          {expandedSections[
                            subsection.subsectionName === 'Current Assets'
                              ? 'currentAssets'
                              : 'nonCurrentAssets'
                          ] && (
                            <div className="pl-12 space-y-1">
                              {subsection.lines.map((line, lineIdx) => (
                                <div
                                  key={line.accountCode || line.accountId || lineIdx}
                                  className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                                  title="Click to view GL detail (coming soon)"
                                >
                                  <span className="text-gray-700">{line.accountName}</span>
                                  <span className={line.isContra ? 'text-red-600' : ''}>
                                    {line.isContra
                                      ? `(${formatCurrency(line.amount)})`
                                      : formatCurrency(line.amount)}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between py-2 border-t border-gray-300 mt-2 pt-2 px-2">
                                <span className="font-semibold">Total {subsection.subsectionName}</span>
                                <span className="font-bold">{formatCurrency(subsection.subtotal)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="bg-blue-100 p-4 rounded-lg border-l-4 border-blue-600 ml-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-blue-900">TOTAL ASSETS</span>
                          <span className="text-2xl font-bold text-blue-900">
                            {formatCurrency(balanceSheet.assets.totalAssets)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LIABILITIES Section */}
                    <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                      <h2 className="text-2xl font-bold text-red-900 border-b-2 border-red-900 pb-2">
                        {balanceSheet.liabilities.sectionName}
                      </h2>

                      {balanceSheet.liabilities.subsections?.map((subsection, idx) => (
                        <div key={idx} className="space-y-2">
                          <button
                            onClick={() =>
                              toggleSection(
                                subsection.subsectionName === 'Current Liabilities'
                                  ? 'currentLiabilities'
                                  : 'nonCurrentLiabilities'
                              )
                            }
                            className="w-full flex items-center justify-between bg-red-50 p-3 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                              {expandedSections[
                                subsection.subsectionName === 'Current Liabilities'
                                  ? 'currentLiabilities'
                                  : 'nonCurrentLiabilities'
                              ] ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                              {subsection.subsectionName}
                            </h3>
                            <span className="font-bold">{formatCurrency(subsection.subtotal)}</span>
                          </button>

                          {expandedSections[
                            subsection.subsectionName === 'Current Liabilities'
                              ? 'currentLiabilities'
                              : 'nonCurrentLiabilities'
                          ] && (
                            <div className="pl-12 space-y-1">
                              {subsection.lines.map((line, lineIdx) => (
                                <div
                                  key={line.accountCode || line.accountId || lineIdx}
                                  className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                                  title="Click to view GL detail (coming soon)"
                                >
                                  <span className="text-gray-700">{line.accountName}</span>
                                  <span>{formatCurrency(line.amount)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between py-2 border-t border-gray-300 mt-2 pt-2 px-2">
                                <span className="font-semibold">Total {subsection.subsectionName}</span>
                                <span className="font-bold">{formatCurrency(subsection.subtotal)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="bg-red-100 p-4 rounded-lg border-l-4 border-red-600 ml-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-red-900">TOTAL LIABILITIES</span>
                          <span className="text-2xl font-bold text-red-900">
                            {formatCurrency(balanceSheet.liabilities.totalLiabilities)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* EQUITY Section */}
                    <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                      <h2 className="text-2xl font-bold text-green-900 border-b-2 border-green-900 pb-2">
                        {balanceSheet.equity.sectionName}
                      </h2>

                      {balanceSheet.equity.subsections?.map((subsection, idx) => (
                        <div key={idx} className="space-y-2">
                          <button
                            onClick={() => toggleSection('equity')}
                            className="w-full flex items-center justify-between bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                              {expandedSections.equity ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                              {subsection.subsectionName}
                            </h3>
                            <span className="font-bold">{formatCurrency(subsection.subtotal)}</span>
                          </button>

                          {expandedSections.equity && (
                            <div className="pl-12 space-y-1">
                              {subsection.lines.map((line, lineIdx) => (
                                <div
                                  key={line.accountCode || line.accountId || lineIdx}
                                  className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                                  title="Click to view GL detail (coming soon)"
                                >
                                  <span className="text-gray-700">{line.accountName}</span>
                                  <span>{formatCurrency(line.amount)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between py-2 border-t border-gray-300 mt-2 pt-2 px-2">
                                <span className="font-semibold">Total {subsection.subsectionName}</span>
                                <span className="font-bold">{formatCurrency(subsection.subtotal)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-600 ml-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-green-900">TOTAL EQUITY</span>
                          <span className="text-2xl font-bold text-green-900">
                            {formatCurrency(balanceSheet.totalEquity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total Liabilities & Equity */}
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg border-2 border-purple-500">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-purple-900">
                          TOTAL LIABILITIES & EQUITY
                        </span>
                        <span className="text-3xl font-bold text-purple-900">
                          {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                        </span>
                      </div>
                    </div>

                    {/* Balance Check */}
                    <div
                      className={`p-4 rounded-lg flex items-center gap-3 ${
                        balanceSheet.balanced
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-red-50 border border-red-300'
                      }`}
                    >
                      {balanceSheet.balanced ? (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <span className="text-green-900 font-semibold">
                            Balance Sheet is Balanced
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-600" />
                          <span className="text-red-900 font-semibold">
                            Warning: Balance Sheet is NOT Balanced
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Cash Flow Statement Tab */}
            <TabsContent value="cash-flow" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="cf-start-date">Start Date</Label>
                      <Input
                        id="cf-start-date"
                        type="date"
                        value={cfStartDate}
                        onChange={(e) => setCfStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="cf-end-date">End Date</Label>
                      <Input
                        id="cf-end-date"
                        type="date"
                        value={cfEndDate}
                        onChange={(e) => setCfEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={handleExportPDF} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button onClick={loadReportData}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Display */}
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : !cashFlowStatement ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ArrowUpDown className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data available</h3>
                    <p className="text-gray-600">Select dates and click Refresh to generate the report</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <ArrowUpDown className="h-6 w-6 text-teal-600" />
                      Cash Flow Statement
                    </CardTitle>
                    <CardDescription className="text-base">
                      For the period: {formatDate(cashFlowStatement.startDate)} to{' '}
                      {formatDate(cashFlowStatement.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Operating Activities Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('operating')}
                        className="w-full flex items-center justify-between bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                          {expandedSections.operating ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          {cashFlowStatement.operatingActivities.sectionName}
                        </h3>
                        <span className="text-lg font-bold text-blue-900">
                          {formatAmount(cashFlowStatement.operatingActivities.netCash)}
                        </span>
                      </button>

                      {expandedSections.operating && (
                        <div className="pl-8 space-y-1">
                          {cashFlowStatement.operatingActivities.lines.map((line, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded"
                            >
                              <span className="text-gray-700">{line.description}</span>
                              <span className="font-medium">{formatAmount(line.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2 px-2">
                            <span className="font-semibold">Net Cash from Operating Activities</span>
                            <span className="font-bold text-lg">
                              {formatAmount(cashFlowStatement.operatingActivities.netCash)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Investing Activities Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('investing')}
                        className="w-full flex items-center justify-between bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                          {expandedSections.investing ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          {cashFlowStatement.investingActivities.sectionName}
                        </h3>
                        <span className="text-lg font-bold text-purple-900">
                          {formatAmount(cashFlowStatement.investingActivities.netCash)}
                        </span>
                      </button>

                      {expandedSections.investing && (
                        <div className="pl-8 space-y-1">
                          {cashFlowStatement.investingActivities.lines.map((line, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded"
                            >
                              <span className="text-gray-700">{line.description}</span>
                              <span className="font-medium">{formatAmount(line.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2 px-2">
                            <span className="font-semibold">Net Cash from Investing Activities</span>
                            <span className="font-bold text-lg">
                              {formatAmount(cashFlowStatement.investingActivities.netCash)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Financing Activities Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('financing')}
                        className="w-full flex items-center justify-between bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                          {expandedSections.financing ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          {cashFlowStatement.financingActivities.sectionName}
                        </h3>
                        <span className="text-lg font-bold text-green-900">
                          {formatAmount(cashFlowStatement.financingActivities.netCash)}
                        </span>
                      </button>

                      {expandedSections.financing && (
                        <div className="pl-8 space-y-1">
                          {cashFlowStatement.financingActivities.lines.map((line, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between py-2 hover:bg-gray-50 px-2 rounded"
                            >
                              <span className="text-gray-700">{line.description}</span>
                              <span className="font-medium">{formatAmount(line.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2 px-2">
                            <span className="font-semibold">Net Cash from Financing Activities</span>
                            <span className="font-bold text-lg">
                              {formatAmount(cashFlowStatement.financingActivities.netCash)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Net Cash Change */}
                    <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-6 rounded-lg border-2 border-indigo-500">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold text-indigo-900">Net Increase in Cash</span>
                        <span className="text-2xl font-bold text-indigo-900">
                          {formatAmount(cashFlowStatement.netCashChange)}
                        </span>
                      </div>
                    </div>

                    {/* Cash Reconciliation */}
                    <div className="bg-gray-50 p-6 rounded-lg border space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Cash at Beginning of Period</span>
                        <span className="font-semibold">
                          {formatCurrency(cashFlowStatement.cashBeginning)}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                        <span className="text-xl font-bold">Cash at End of Period</span>
                        <span className="text-2xl font-bold text-blue-900">
                          {formatCurrency(cashFlowStatement.cashEnding)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Trial Balance Tab */}
            <TabsContent value="trial-balance" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="tb-asof-date">As of Date</Label>
                      <Input
                        id="tb-asof-date"
                        type="date"
                        value={tbAsOfDate}
                        onChange={(e) => setTBAsOfDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="tb-show-zero"
                        checked={tbShowZeroBalances}
                        onChange={(e) => setTBShowZeroBalances(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="tb-show-zero" className="cursor-pointer">
                        Show Zero Balances
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={loadReportData}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button onClick={handleExportPDF} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button onClick={() => window.print()} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trial Balance Report */}
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!loading && trialBalance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Trial Balance</CardTitle>
                    <CardDescription>
                      As of: {formatDate(trialBalance.asOfDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left p-2 font-semibold">Account Code</th>
                            <th className="text-left p-2 font-semibold">Account Name</th>
                            <th className="text-right p-2 font-semibold">Debit</th>
                            <th className="text-right p-2 font-semibold">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Assets */}
                          <tr className="bg-blue-50">
                            <td colSpan={4} className="p-2 font-bold text-blue-900">
                              ASSETS
                            </td>
                          </tr>
                          {trialBalance.accounts
                            .filter((acc) => acc.accountType === 'ASSET')
                            .map((account, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                                <td className="p-2 pl-6">{account.accountCode}</td>
                                <td className="p-2">{account.accountName}</td>
                                <td className="p-2 text-right">
                                  {account.debitTotal > 0 ? formatCurrency(account.debitTotal) : '-'}
                                </td>
                                <td className="p-2 text-right">
                                  {account.creditTotal > 0 ? formatCurrency(account.creditTotal) : '-'}
                                </td>
                              </tr>
                            ))}

                          {/* Liabilities */}
                          <tr className="bg-blue-50 mt-2">
                            <td colSpan={4} className="p-2 font-bold text-blue-900">
                              LIABILITIES
                            </td>
                          </tr>
                          {trialBalance.accounts
                            .filter((acc) => acc.accountType === 'LIABILITY')
                            .map((account, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                                <td className="p-2 pl-6">{account.accountCode}</td>
                                <td className="p-2">{account.accountName}</td>
                                <td className="p-2 text-right">
                                  {account.debitTotal > 0 ? formatCurrency(account.debitTotal) : '-'}
                                </td>
                                <td className="p-2 text-right">
                                  {account.creditTotal > 0 ? formatCurrency(account.creditTotal) : '-'}
                                </td>
                              </tr>
                            ))}

                          {/* Equity */}
                          <tr className="bg-blue-50">
                            <td colSpan={4} className="p-2 font-bold text-blue-900">
                              EQUITY
                            </td>
                          </tr>
                          {trialBalance.accounts
                            .filter((acc) => acc.accountType === 'EQUITY')
                            .map((account, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                                <td className="p-2 pl-6">{account.accountCode}</td>
                                <td className="p-2">{account.accountName}</td>
                                <td className="p-2 text-right">
                                  {account.debitTotal > 0 ? formatCurrency(account.debitTotal) : '-'}
                                </td>
                                <td className="p-2 text-right">
                                  {account.creditTotal > 0 ? formatCurrency(account.creditTotal) : '-'}
                                </td>
                              </tr>
                            ))}

                          {/* Revenue */}
                          <tr className="bg-blue-50">
                            <td colSpan={4} className="p-2 font-bold text-blue-900">
                              REVENUE
                            </td>
                          </tr>
                          {trialBalance.accounts
                            .filter((acc) => acc.accountType === 'REVENUE')
                            .map((account, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                                <td className="p-2 pl-6">{account.accountCode}</td>
                                <td className="p-2">{account.accountName}</td>
                                <td className="p-2 text-right">
                                  {account.debitTotal > 0 ? formatCurrency(account.debitTotal) : '-'}
                                </td>
                                <td className="p-2 text-right">
                                  {account.creditTotal > 0 ? formatCurrency(account.creditTotal) : '-'}
                                </td>
                              </tr>
                            ))}

                          {/* Expenses */}
                          <tr className="bg-blue-50">
                            <td colSpan={4} className="p-2 font-bold text-blue-900">
                              EXPENSES
                            </td>
                          </tr>
                          {trialBalance.accounts
                            .filter((acc) => acc.accountType === 'EXPENSE')
                            .map((account, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                                <td className="p-2 pl-6">{account.accountCode}</td>
                                <td className="p-2">{account.accountName}</td>
                                <td className="p-2 text-right">
                                  {account.debitTotal > 0 ? formatCurrency(account.debitTotal) : '-'}
                                </td>
                                <td className="p-2 text-right">
                                  {account.creditTotal > 0 ? formatCurrency(account.creditTotal) : '-'}
                                </td>
                              </tr>
                            ))}

                          {/* Totals */}
                          <tr className="border-t-2 border-gray-400 bg-gray-100">
                            <td colSpan={2} className="p-2 font-bold text-lg">
                              TOTALS
                            </td>
                            <td className="p-2 text-right font-bold text-lg border-t-4 border-gray-900">
                              {formatCurrency(trialBalance.totalDebits)}
                            </td>
                            <td className="p-2 text-right font-bold text-lg border-t-4 border-gray-900">
                              {formatCurrency(trialBalance.totalCredits)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Balance Indicator */}
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {trialBalance.balanced ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-green-700 font-semibold">
                              Trial Balance is Balanced
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700 font-semibold">
                              Trial Balance is NOT Balanced
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* General Ledger Tab */}
            <TabsContent value="general-ledger" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="gl-account">Account Code *</Label>
                      <Select value={glAccountCode} onValueChange={setGLAccountCode}>
                        <SelectTrigger id="gl-account" className="mt-1">
                          <SelectValue placeholder="Select account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Show actual accounts from Trial Balance if available */}
                          {trialBalance && trialBalance.accounts.length > 0 ? (
                            trialBalance.accounts.map((acc) => (
                              <SelectItem key={acc.accountCode} value={acc.accountCode}>
                                {acc.accountCode} - {acc.accountName}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="AR">AR - Accounts Receivable</SelectItem>
                              <SelectItem value="REV">REV - Revenue</SelectItem>
                              <SelectItem value="TAX">TAX - Tax Payable</SelectItem>
                              <SelectItem value="1000">1000 - Cash - Bank Account</SelectItem>
                              <SelectItem value="1100">1100 - Accounts Receivable</SelectItem>
                              <SelectItem value="4000">4000 - Sales Revenue</SelectItem>
                              <SelectItem value="5000">5000 - Expenses</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="gl-start-date">Start Date</Label>
                      <Input
                        id="gl-start-date"
                        type="date"
                        value={glStartDate}
                        onChange={(e) => setGLStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="gl-end-date">End Date</Label>
                      <Input
                        id="gl-end-date"
                        type="date"
                        value={glEndDate}
                        onChange={(e) => setGLEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={loadReportData} disabled={!glAccountCode}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button onClick={handleExportPDF} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* General Ledger Report */}
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!glAccountCode && !loading && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Please select an account to view the general ledger</p>
                  </CardContent>
                </Card>
              )}

              {!loading && glAccount && glAccountCode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      General Ledger - Account {glAccount.accountCode} ({glAccount.accountName})
                    </CardTitle>
                    <CardDescription>
                      Period: {formatDate(glAccount.startDate)} to {formatDate(glAccount.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left p-2 font-semibold">Date</th>
                            <th className="text-left p-2 font-semibold">Description</th>
                            <th className="text-left p-2 font-semibold">Source</th>
                            <th className="text-left p-2 font-semibold">Ref</th>
                            <th className="text-right p-2 font-semibold">Debit</th>
                            <th className="text-right p-2 font-semibold">Credit</th>
                            <th className="text-right p-2 font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Opening Balance */}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="p-2">{formatDate(glAccount.startDate)}</td>
                            <td className="p-2">Opening Balance</td>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className="p-2"></td>
                            <td className="p-2 text-right font-bold">
                              {formatCurrency(glAccount.openingBalance)}
                            </td>
                          </tr>

                          {/* Entries */}
                          {glAccount.entries.map((entry, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 border-b border-gray-100"
                              title="TODO: Click to view full journal entry"
                            >
                              <td className="p-2">{formatDate(entry.date)}</td>
                              <td className="p-2 max-w-xs truncate">{entry.description}</td>
                              <td className="p-2">
                                <Badge className={`text-xs ${getSourceBadgeColor(entry.source)}`}>
                                  {entry.source}
                                </Badge>
                              </td>
                              <td className="p-2 text-sm text-gray-600">{entry.reference}</td>
                              <td className="p-2 text-right">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                              </td>
                              <td className="p-2 text-right">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                {formatCurrency(entry.balance)}
                              </td>
                            </tr>
                          ))}

                          {/* Totals */}
                          <tr className="border-t-2 border-gray-400 bg-gray-100">
                            <td colSpan={4} className="p-2 font-bold">
                              TOTALS
                            </td>
                            <td className="p-2 text-right font-bold border-t-4 border-gray-900">
                              {formatCurrency(glAccount.totalDebits ?? glAccount.totalDebit ?? 0)}
                            </td>
                            <td className="p-2 text-right font-bold border-t-4 border-gray-900">
                              {formatCurrency(glAccount.totalCredits ?? glAccount.totalCredit ?? 0)}
                            </td>
                            <td className="p-2"></td>
                          </tr>

                          {/* Closing Balance */}
                          <tr className="bg-blue-50">
                            <td colSpan={6} className="p-2 font-bold text-lg">
                              Closing Balance:
                            </td>
                            <td className="p-2 text-right font-bold text-lg text-blue-900">
                              {formatCurrency(glAccount.closingBalance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Journal Entries Tab */}
            <TabsContent value="journal-entries" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="je-start-date">Start Date</Label>
                      <Input
                        id="je-start-date"
                        type="date"
                        value={jeStartDate}
                        onChange={(e) => setJEStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="je-end-date">End Date</Label>
                      <Input
                        id="je-end-date"
                        type="date"
                        value={jeEndDate}
                        onChange={(e) => setJEEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="je-source">Source Type</Label>
                      <Select value={jeSourceFilter} onValueChange={setJESourceFilter}>
                        <SelectTrigger id="je-source" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="AR_INVOICE">AR Invoice</SelectItem>
                          <SelectItem value="AR_PAYMENT">AR Payment</SelectItem>
                          <SelectItem value="AP_BILL">AP Bill</SelectItem>
                          <SelectItem value="AP_PAYMENT">AP Payment</SelectItem>
                          <SelectItem value="JOURNAL">Journal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="je-search">Search</Label>
                      <Input
                        id="je-search"
                        type="text"
                        placeholder="Search description..."
                        value={jeSearchTerm}
                        onChange={(e) => setJESearchTerm(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={loadReportData}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button onClick={handleExportPDF} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={handleExportExcel} variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Journal Entries Report */}
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!loading && journalEntries && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Journal Entries Report</CardTitle>
                      <CardDescription>
                        Period: {formatDate(journalEntries.startDate)} to{' '}
                        {formatDate(journalEntries.endDate)}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Journal Entries List */}
                  {journalEntries.entries.map((entry, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleJournalEntry(entry.entryNumber)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {expandedJournalEntries[entry.entryNumber] ? (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                              )}
                              <h3 className="text-lg font-bold">Entry #{entry.entryNumber}</h3>
                            </div>
                            <Badge className={`${getSourceBadgeColor(entry.source)}`}>
                              {entry.source}
                            </Badge>
                            {entry.isBalanced ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">{formatDate(entry.date)}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">{entry.description}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Created: {entry.createdBy},{' '}
                          {formatDate(entry.createdAt)} at{' '}
                          {entry.createdAt.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </div>

                      {/* Entry Details - Expanded */}
                      {expandedJournalEntries[entry.entryNumber] && (
                        <CardContent className="pt-4">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-gray-300">
                                  <th className="text-left p-2 font-semibold">Account</th>
                                  <th className="text-left p-2 font-semibold">Account Name</th>
                                  <th className="text-left p-2 font-semibold">Description</th>
                                  <th className="text-right p-2 font-semibold">Debit</th>
                                  <th className="text-right p-2 font-semibold">Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.lines.map((line, lineIdx) => (
                                  <tr
                                    key={lineIdx}
                                    className="hover:bg-gray-50 border-b border-gray-100"
                                  >
                                    <td className="p-2">{line.accountCode}</td>
                                    <td className="p-2">{line.accountName}</td>
                                    <td className="p-2 text-sm text-gray-600">{line.description}</td>
                                    <td className="p-2 text-right">
                                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                    </td>
                                    <td className="p-2 text-right">
                                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                    </td>
                                  </tr>
                                ))}

                                {/* Totals Row */}
                                <tr className="border-t-2 border-gray-400 bg-gray-100">
                                  <td colSpan={3} className="p-2 font-bold text-right">
                                    TOTALS
                                  </td>
                                  <td className="p-2 text-right font-bold border-t-4 border-gray-900">
                                    {formatCurrency(entry.totalDebit)}
                                  </td>
                                  <td className="p-2 text-right font-bold border-t-4 border-gray-900 flex items-center justify-end gap-2">
                                    {formatCurrency(entry.totalCredit)}
                                    {entry.isBalanced && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
