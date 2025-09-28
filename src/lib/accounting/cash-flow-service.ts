import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryConstraint,
  writeBatch,
  increment,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { CurrencyService } from './currency-service';
import { bankAccountService } from '@/lib/firebase/bank-account-service';
import {
  CashFlowForecast,
  CashPosition,
  CashPositionByAccount,
  CashPositionByCurrency,
  DailyCashForecast,
  CashFlowItem,
  CashFlowMetrics,
  CashFlowType,
  CashFlowCategory,
  CashFlowSource,
  CashFlowAlert,
  ForecastConfig,
  PaymentPrioritization,
  PrioritizedPayment,
  PaymentScoringFactors,
  PaymentPriorizationMetrics,
  HistoricalCashFlow,
  CashFlowPattern,
  CreateForecastInput,
  UpdateForecastInput,
  ManualCashFlowAdjustment,
  ForecastSummary,
  CashFlowInsights,
  CashFlowRecommendation,
} from '@/types/accounting/cash-flow';
import { Debtor, Creditor, Transaction } from '@/types/financial';
import { BankAccount } from '@/types/accounting/bank-account';

const FORECASTS_COLLECTION = (companyId: string) => `companies/${companyId}/cashFlowForecasts`;
const CASH_POSITIONS_COLLECTION = (companyId: string) => `companies/${companyId}/cashPositions`;
const HISTORICAL_COLLECTION = (companyId: string) => `companies/${companyId}/historicalCashFlow`;
const PATTERNS_COLLECTION = (companyId: string) => `companies/${companyId}/cashFlowPatterns`;
const PAYMENT_PRIORITIES_COLLECTION = (companyId: string) => `companies/${companyId}/paymentPriorities`;

const DEFAULT_CONFIG: ForecastConfig = {
  forecastHorizonWeeks: 13,
  refreshIntervalHours: 4,
  baseCurrency: 'USD',
  highConfidenceThreshold: 0.8,
  mediumConfidenceThreshold: 0.6,
  historicalLookbackDays: 90,
  seasonalityEnabled: true,
  trendAnalysisEnabled: true,
  minimumCashThreshold: 10000,
  criticalCashThreshold: 5000,
  includeAccountsReceivable: true,
  includeAccountsPayable: true,
  includeRecurringTransactions: true,
  includeHistoricalPatterns: true,
  includeBudgetData: false,
  defaultReceivableDays: 30,
  defaultPayableDays: 30,
  weekendProcessing: false,
  multiCurrencyEnabled: true,
  autoConvertToCurrency: true,
};

export class CashFlowService {
  private currencyService: CurrencyService;

  constructor(private readonly companyId: string) {
    this.currencyService = new CurrencyService(companyId);
  }

  private toDate(value?: Timestamp | Date | null): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    return value.toDate();
  }

  private toFirestore(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = Timestamp.fromDate(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(item =>
          typeof item === 'object' && item !== null ? this.toFirestore(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.toFirestore(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private fromFirestore(data: DocumentData): any {
    const result: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        result[key] = value.toDate();
      } else if (Array.isArray(value)) {
        result[key] = value.map(item =>
          typeof item === 'object' && item !== null ? this.fromFirestore(item) : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Timestamp)) {
        result[key] = this.fromFirestore(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get current real-time cash position across all bank accounts
   */
  async getCurrentCashPosition(): Promise<CashPosition> {
    const bankAccounts = await bankAccountService.listBankAccounts(this.companyId, {
      includeInactive: false
    });

    const accountBreakdown: CashPositionByAccount[] = [];
    const currencyTotals = new Map<string, {
      totalBalance: number;
      totalAvailable: number;
      totalPending: number;
      accountCount: number;
    }>();

    for (const account of bankAccounts) {
      accountBreakdown.push({
        bankAccountId: account.id,
        bankAccountName: account.name,
        accountType: account.accountType,
        ledgerBalance: account.balance.ledger,
        availableBalance: account.balance.available,
        pendingBalance: account.balance.pending,
        currency: account.currency,
        lastUpdated: account.balance.asOf || account.updatedAt,
      });

      // Aggregate by currency
      const existing = currencyTotals.get(account.currency) || {
        totalBalance: 0,
        totalAvailable: 0,
        totalPending: 0,
        accountCount: 0,
      };

      existing.totalBalance += account.balance.ledger;
      existing.totalAvailable += account.balance.available || account.balance.ledger;
      existing.totalPending += account.balance.pending || 0;
      existing.accountCount++;

      currencyTotals.set(account.currency, existing);
    }

    // Get base currency for company (assuming USD for now)
    const baseCurrency = DEFAULT_CONFIG.baseCurrency;
    let totalCashBalance = 0;
    let totalAvailableBalance = 0;
    let totalPendingBalance = 0;

    const currencyBreakdown: CashPositionByCurrency[] = [];

    for (const [currency, totals] of currencyTotals.entries()) {
      let balanceInBase = totals.totalBalance;
      let exchangeRate = 1;

      if (currency !== baseCurrency) {
        try {
          const conversion = await this.currencyService.convert(
            totals.totalBalance,
            currency,
            baseCurrency
          );
          balanceInBase = conversion.convertedAmount;
          exchangeRate = conversion.rateUsed;
        } catch (error) {
          console.warn(`Failed to convert ${currency} to ${baseCurrency}:`, error);
        }
      }

      currencyBreakdown.push({
        currency,
        totalBalance: totals.totalBalance,
        totalAvailable: totals.totalAvailable,
        totalPending: totals.totalPending,
        accountCount: totals.accountCount,
        exchangeRateToBase: exchangeRate,
        balanceInBaseCurrency: balanceInBase,
      });

      totalCashBalance += balanceInBase;
      totalAvailableBalance += (totals.totalAvailable / totals.totalBalance) * balanceInBase;
      totalPendingBalance += (totals.totalPending / totals.totalBalance) * balanceInBase;
    }

    const cashPosition: CashPosition = {
      companyId: this.companyId,
      totalCashBalance,
      totalAvailableBalance,
      totalPendingBalance,
      baseCurrency,
      asOf: new Date(),
      accountBreakdown,
      currencyBreakdown,
    };

    // Store the current position for historical tracking
    await this.storeCashPosition(cashPosition);

    return cashPosition;
  }

  private async storeCashPosition(position: CashPosition): Promise<void> {
    try {
      await addDoc(collection(db, CASH_POSITIONS_COLLECTION(this.companyId)), {
        ...this.toFirestore(position),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Failed to store cash position:', error);
    }
  }

  /**
   * Generate a 13-week rolling cash flow forecast
   */
  async generateForecast(input: CreateForecastInput): Promise<CashFlowForecast> {
    const config = { ...DEFAULT_CONFIG, ...input.config };
    const currentPosition = await this.getCurrentCashPosition();

    // Get historical data for pattern analysis
    const historicalData = await this.getHistoricalCashFlow(config.historicalLookbackDays);

    // Generate daily forecasts
    const dailyForecasts = await this.generateDailyForecasts(
      currentPosition,
      config,
      historicalData
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(currentPosition, dailyForecasts, config);

    const forecast: CashFlowForecast = {
      id: '', // Will be set after saving
      companyId: this.companyId,
      baseCurrency: config.baseCurrency,
      forecastDate: new Date(),
      forecastPeriodWeeks: config.forecastHorizonWeeks,
      currentCashPosition: currentPosition,
      dailyForecasts,
      metrics,
      config,
      generatedBy: input.generatedBy,
      generatedAt: new Date(),
      lastUpdatedAt: new Date(),
      version: 1,
    };

    // Save forecast
    const docRef = await addDoc(
      collection(db, FORECASTS_COLLECTION(this.companyId)),
      this.toFirestore(forecast)
    );

    forecast.id = docRef.id;
    return forecast;
  }

  private async generateDailyForecasts(
    currentPosition: CashPosition,
    config: ForecastConfig,
    historicalData: HistoricalCashFlow[]
  ): Promise<DailyCashForecast[]> {
    const forecasts: DailyCashForecast[] = [];
    const startDate = new Date();
    const totalDays = config.forecastHorizonWeeks * 7;

    let runningBalance = currentPosition.totalCashBalance;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(startDate.getDate() + dayOffset);

      const dayOfWeek = forecastDate.toLocaleDateString('en-US', { weekday: 'long' });
      const weekNumber = Math.floor(dayOffset / 7) + 1;

      // Generate inflows and outflows for this day
      const { inflows, outflows } = await this.projectCashFlowsForDate(
        forecastDate,
        config,
        historicalData
      );

      const totalInflows = inflows.reduce((sum, item) => sum + item.amount, 0);
      const totalOutflows = outflows.reduce((sum, item) => sum + item.amount, 0);
      const netFlow = totalInflows - totalOutflows;

      const closingBalance = runningBalance + netFlow;

      // Generate alerts for this day
      const alerts = this.generateAlertsForDay(forecastDate, closingBalance, netFlow, config);

      // Calculate confidence based on data quality
      const confidence = this.calculateDayConfidence(inflows, outflows, dayOffset);

      // Calculate variance range
      const varianceRange = this.calculateVarianceRange(netFlow, confidence, historicalData);

      forecasts.push({
        date: forecastDate,
        dayOfWeek,
        weekNumber,
        openingBalance: runningBalance,
        projectedInflows: inflows,
        totalInflows,
        projectedOutflows: outflows,
        totalOutflows,
        netFlow,
        closingBalance,
        confidenceLevel: confidence,
        varianceRange,
        alerts,
      });

      runningBalance = closingBalance;
    }

    return forecasts;
  }

  private async projectCashFlowsForDate(
    date: Date,
    config: ForecastConfig,
    historicalData: HistoricalCashFlow[]
  ): Promise<{ inflows: CashFlowItem[]; outflows: CashFlowItem[] }> {
    const inflows: CashFlowItem[] = [];
    const outflows: CashFlowItem[] = [];

    // Project Accounts Receivable
    if (config.includeAccountsReceivable) {
      const arInflows = await this.projectAccountsReceivable(date, config);
      inflows.push(...arInflows);
    }

    // Project Accounts Payable
    if (config.includeAccountsPayable) {
      const apOutflows = await this.projectAccountsPayable(date, config);
      outflows.push(...apOutflows);
    }

    // Project Recurring Transactions
    if (config.includeRecurringTransactions) {
      const { recurring_inflows, recurring_outflows } = await this.projectRecurringTransactions(date);
      inflows.push(...recurring_inflows);
      outflows.push(...recurring_outflows);
    }

    // Apply Historical Patterns
    if (config.includeHistoricalPatterns && historicalData.length > 0) {
      const { pattern_inflows, pattern_outflows } = this.applyHistoricalPatterns(
        date,
        historicalData
      );
      inflows.push(...pattern_inflows);
      outflows.push(...pattern_outflows);
    }

    return { inflows, outflows };
  }

  private async projectAccountsReceivable(
    date: Date,
    config: ForecastConfig
  ): Promise<CashFlowItem[]> {
    try {
      // Get outstanding debtors
      const debtorsSnapshot = await getDocs(
        query(
          collection(db, `companies/${this.companyId}/debtors`),
          where('status', '==', 'active'),
          where('currentBalance', '>', 0)
        )
      );

      const inflows: CashFlowItem[] = [];

      for (const debtorDoc of debtorsSnapshot.docs) {
        const debtor = debtorDoc.data() as Debtor;

        // Get outstanding transactions for this debtor
        const transactionsSnapshot = await getDocs(
          query(
            collection(db, `companies/${this.companyId}/transactions`),
            where('entityId', '==', debtor.id),
            where('entityType', '==', 'debtor'),
            where('status', 'in', ['pending', 'overdue'])
          )
        );

        for (const txDoc of transactionsSnapshot.docs) {
          const transaction = txDoc.data() as Transaction;

          // Calculate expected payment date
          const expectedDate = new Date(transaction.dueDate || transaction.createdAt);
          expectedDate.setDate(expectedDate.getDate() + config.defaultReceivableDays);

          // Check if this payment is expected on the forecast date
          if (this.isSameDay(expectedDate, date)) {
            const confidence = this.calculateReceivableConfidence(
              transaction,
              debtor,
              expectedDate
            );

            inflows.push({
              id: `ar_${transaction.id}`,
              description: `Payment from ${debtor.name} - ${transaction.description}`,
              amount: transaction.amount,
              currency: transaction.currency,
              type: 'inflow',
              category: 'accounts_receivable',
              source: 'invoice',
              confidence,
              sourceEntityId: debtor.id,
              sourceTransactionId: transaction.id,
              originalDueDate: transaction.dueDate ? new Date(transaction.dueDate) : undefined,
              probabilityOfOccurrence: confidence,
              metadata: {
                debtorName: debtor.name,
                paymentTerms: debtor.paymentTerms,
                overdue: transaction.status === 'overdue',
              },
            });
          }
        }
      }

      return inflows;
    } catch (error) {
      console.warn('Failed to project accounts receivable:', error);
      return [];
    }
  }

  private async projectAccountsPayable(
    date: Date,
    config: ForecastConfig
  ): Promise<CashFlowItem[]> {
    try {
      // Get outstanding creditors
      const creditorsSnapshot = await getDocs(
        query(
          collection(db, `companies/${this.companyId}/creditors`),
          where('status', '==', 'active'),
          where('currentBalance', '>', 0)
        )
      );

      const outflows: CashFlowItem[] = [];

      for (const creditorDoc of creditorsSnapshot.docs) {
        const creditor = creditorDoc.data() as Creditor;

        // Get outstanding transactions for this creditor
        const transactionsSnapshot = await getDocs(
          query(
            collection(db, `companies/${this.companyId}/transactions`),
            where('entityId', '==', creditor.id),
            where('entityType', '==', 'creditor'),
            where('status', 'in', ['pending', 'overdue'])
          )
        );

        for (const txDoc of transactionsSnapshot.docs) {
          const transaction = txDoc.data() as Transaction;

          // Calculate expected payment date
          const expectedDate = new Date(transaction.dueDate || transaction.createdAt);
          expectedDate.setDate(expectedDate.getDate() + config.defaultPayableDays);

          // Check if this payment is expected on the forecast date
          if (this.isSameDay(expectedDate, date)) {
            const confidence = this.calculatePayableConfidence(
              transaction,
              creditor,
              expectedDate
            );

            outflows.push({
              id: `ap_${transaction.id}`,
              description: `Payment to ${creditor.name} - ${transaction.description}`,
              amount: transaction.amount,
              currency: transaction.currency,
              type: 'outflow',
              category: 'accounts_payable',
              source: 'bill',
              confidence,
              sourceEntityId: creditor.id,
              sourceTransactionId: transaction.id,
              originalDueDate: transaction.dueDate ? new Date(transaction.dueDate) : undefined,
              probabilityOfOccurrence: confidence,
              metadata: {
                creditorName: creditor.name,
                paymentTerms: creditor.paymentTerms,
                overdue: transaction.status === 'overdue',
              },
            });
          }
        }
      }

      return outflows;
    } catch (error) {
      console.warn('Failed to project accounts payable:', error);
      return [];
    }
  }

  private async projectRecurringTransactions(
    date: Date
  ): Promise<{ recurring_inflows: CashFlowItem[]; recurring_outflows: CashFlowItem[] }> {
    // This would integrate with a recurring transactions system
    // For now, return empty arrays
    return {
      recurring_inflows: [],
      recurring_outflows: [],
    };
  }

  private applyHistoricalPatterns(
    date: Date,
    historicalData: HistoricalCashFlow[]
  ): Promise<{ pattern_inflows: CashFlowItem[]; pattern_outflows: CashFlowItem[] }> {
    // Analyze historical patterns and project similar flows
    // This is a simplified implementation
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    const similarDays = historicalData.filter(h => {
      const hDate = new Date(h.date);
      return hDate.getDay() === dayOfWeek || hDate.getDate() === dayOfMonth;
    });

    if (similarDays.length === 0) {
      return Promise.resolve({ pattern_inflows: [], pattern_outflows: [] });
    }

    const avgInflows = similarDays.reduce((sum, h) => sum + h.actualInflows, 0) / similarDays.length;
    const avgOutflows = similarDays.reduce((sum, h) => sum + h.actualOutflows, 0) / similarDays.length;

    const pattern_inflows: CashFlowItem[] = [];
    const pattern_outflows: CashFlowItem[] = [];

    if (avgInflows > 0) {
      pattern_inflows.push({
        id: `pattern_inflow_${date.toISOString().split('T')[0]}`,
        description: 'Historical pattern inflow',
        amount: avgInflows,
        currency: 'USD', // Should be dynamic
        type: 'inflow',
        category: 'other',
        source: 'historical_pattern',
        confidence: 0.6,
        probabilityOfOccurrence: 0.6,
        metadata: {
          basedOnDays: similarDays.length,
          pattern: 'weekly_daily',
        },
      });
    }

    if (avgOutflows > 0) {
      pattern_outflows.push({
        id: `pattern_outflow_${date.toISOString().split('T')[0]}`,
        description: 'Historical pattern outflow',
        amount: avgOutflows,
        currency: 'USD', // Should be dynamic
        type: 'outflow',
        category: 'operating_expense',
        source: 'historical_pattern',
        confidence: 0.6,
        probabilityOfOccurrence: 0.6,
        metadata: {
          basedOnDays: similarDays.length,
          pattern: 'weekly_daily',
        },
      });
    }

    return Promise.resolve({ pattern_inflows, pattern_outflows });
  }

  private calculateMetrics(
    currentPosition: CashPosition,
    dailyForecasts: DailyCashForecast[],
    config: ForecastConfig
  ): CashFlowMetrics {
    const totalInflows = dailyForecasts.reduce((sum, day) => sum + day.totalInflows, 0);
    const totalOutflows = dailyForecasts.reduce((sum, day) => sum + day.totalOutflows, 0);
    const avgDailyBurnRate = totalOutflows / dailyForecasts.length;
    const avgDailyInflow = totalInflows / dailyForecasts.length;

    // Find minimum cash balance and date
    let minimumCashBalance = currentPosition.totalCashBalance;
    let minimumCashDate = new Date();
    let daysWithNegativeCash = 0;

    for (const day of dailyForecasts) {
      if (day.closingBalance < minimumCashBalance) {
        minimumCashBalance = day.closingBalance;
        minimumCashDate = day.date;
      }
      if (day.closingBalance < 0) {
        daysWithNegativeCash++;
      }
    }

    // Calculate cash runway
    let projectedCashRunway = 0;
    if (avgDailyBurnRate > 0) {
      projectedCashRunway = currentPosition.totalCashBalance / avgDailyBurnRate;
    }

    // Calculate variance risk
    const balances = dailyForecasts.map(day => day.closingBalance);
    const avgBalance = balances.reduce((sum, b) => sum + b, 0) / balances.length;
    const variance = balances.reduce((sum, b) => sum + Math.pow(b - avgBalance, 2), 0) / balances.length;
    const cashVarianceRisk = Math.sqrt(variance);

    // Category breakdown
    const categoryMap = new Map<CashFlowCategory, {
      totalInflows: number;
      totalOutflows: number;
      itemCount: number;
      confidenceSum: number;
    }>();

    for (const day of dailyForecasts) {
      for (const item of [...day.projectedInflows, ...day.projectedOutflows]) {
        const existing = categoryMap.get(item.category) || {
          totalInflows: 0,
          totalOutflows: 0,
          itemCount: 0,
          confidenceSum: 0,
        };

        if (item.type === 'inflow') {
          existing.totalInflows += item.amount;
        } else {
          existing.totalOutflows += item.amount;
        }
        existing.itemCount++;
        existing.confidenceSum += item.confidence;

        categoryMap.set(item.category, existing);
      }
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalInflows: data.totalInflows,
      totalOutflows: data.totalOutflows,
      netFlow: data.totalInflows - data.totalOutflows,
      itemCount: data.itemCount,
      averageAmount: (data.totalInflows + data.totalOutflows) / data.itemCount,
      confidence: data.confidenceSum / data.itemCount,
    }));

    return {
      currentCashBalance: currentPosition.totalCashBalance,
      workingCapital: currentPosition.totalAvailableBalance,
      projectedCashRunway,
      averageDailyBurnRate: avgDailyBurnRate,
      averageDailyInflow: avgDailyInflow,
      minimumCashBalance,
      minimumCashDate,
      daysWithNegativeCash,
      cashVarianceRisk,
      breachesCashThreshold: minimumCashBalance < config.minimumCashThreshold,
      thresholdBreachDate: minimumCashBalance < config.minimumCashThreshold ? minimumCashDate : undefined,
      categoryBreakdown,
    };
  }

  private generateAlertsForDay(
    date: Date,
    closingBalance: number,
    netFlow: number,
    config: ForecastConfig
  ): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = [];

    // Negative balance alert
    if (closingBalance < 0) {
      alerts.push({
        id: `negative_balance_${date.toISOString().split('T')[0]}`,
        type: 'negative_balance',
        severity: 'critical',
        message: `Projected negative cash balance of ${closingBalance.toFixed(2)}`,
        triggerDate: date,
        estimatedImpact: Math.abs(closingBalance),
        actionRequired: true,
        suggestedActions: [
          'Accelerate receivables collection',
          'Delay non-critical payments',
          'Arrange short-term financing',
        ],
      });
    }

    // Cash threshold breach
    if (closingBalance < config.minimumCashThreshold && closingBalance >= 0) {
      alerts.push({
        id: `threshold_breach_${date.toISOString().split('T')[0]}`,
        type: 'threshold_breach',
        severity: closingBalance < config.criticalCashThreshold ? 'critical' : 'high',
        message: `Cash balance below minimum threshold (${config.minimumCashThreshold})`,
        triggerDate: date,
        estimatedImpact: config.minimumCashThreshold - closingBalance,
        actionRequired: true,
        suggestedActions: [
          'Review upcoming payments',
          'Contact customers for early payment',
          'Consider credit line',
        ],
      });
    }

    // Large outflow alert
    if (netFlow < -10000) { // Configurable threshold
      alerts.push({
        id: `large_outflow_${date.toISOString().split('T')[0]}`,
        type: 'large_outflow',
        severity: 'medium',
        message: `Large projected outflow of ${Math.abs(netFlow).toFixed(2)}`,
        triggerDate: date,
        estimatedImpact: Math.abs(netFlow),
        actionRequired: false,
        suggestedActions: [
          'Verify payment necessity',
          'Consider payment timing',
        ],
      });
    }

    return alerts;
  }

  private calculateDayConfidence(
    inflows: CashFlowItem[],
    outflows: CashFlowItem[],
    dayOffset: number
  ): number {
    const allItems = [...inflows, ...outflows];
    if (allItems.length === 0) return 0.9; // High confidence for no transactions

    const avgConfidence = allItems.reduce((sum, item) => sum + item.confidence, 0) / allItems.length;

    // Decrease confidence over time
    const timeDecay = Math.max(0.5, 1 - (dayOffset / 91)); // 91 days = 13 weeks

    return Math.min(1, avgConfidence * timeDecay);
  }

  private calculateVarianceRange(
    netFlow: number,
    confidence: number,
    historicalData: HistoricalCashFlow[]
  ): { low: number; high: number } {
    // Calculate variance based on historical data and confidence
    const variance = historicalData.length > 0
      ? this.calculateHistoricalVariance(historicalData)
      : Math.abs(netFlow) * 0.2; // 20% default variance

    const confidenceMultiplier = 1 - confidence;
    const adjustedVariance = variance * confidenceMultiplier;

    return {
      low: netFlow - adjustedVariance,
      high: netFlow + adjustedVariance,
    };
  }

  private calculateHistoricalVariance(historicalData: HistoricalCashFlow[]): number {
    if (historicalData.length < 2) return 0;

    const netFlows = historicalData.map(h => h.netFlow);
    const mean = netFlows.reduce((sum, nf) => sum + nf, 0) / netFlows.length;
    const variance = netFlows.reduce((sum, nf) => sum + Math.pow(nf - mean, 2), 0) / netFlows.length;

    return Math.sqrt(variance);
  }

  private calculateReceivableConfidence(
    transaction: Transaction,
    debtor: Debtor,
    expectedDate: Date
  ): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on debtor history
    if (debtor.status === 'active') confidence += 0.1;
    if (debtor.currentBalance < debtor.creditLimit || 0) confidence += 0.1;

    // Adjust based on payment terms
    const daysPastDue = expectedDate.getTime() - new Date().getTime();
    if (daysPastDue < 0) confidence -= 0.2; // Already overdue

    // Adjust based on transaction status
    if (transaction.status === 'overdue') confidence -= 0.3;

    return Math.max(0.1, Math.min(1, confidence));
  }

  private calculatePayableConfidence(
    transaction: Transaction,
    creditor: Creditor,
    expectedDate: Date
  ): number {
    let confidence = 0.8; // Higher base confidence for payables

    // Adjust based on creditor category
    if (creditor.category === 'supplier') confidence += 0.1;

    // Adjust based on payment terms
    const daysPastDue = expectedDate.getTime() - new Date().getTime();
    if (daysPastDue < 0) confidence += 0.1; // Company controls timing

    return Math.max(0.1, Math.min(1, confidence));
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private async getHistoricalCashFlow(lookbackDays: number): Promise<HistoricalCashFlow[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      const snapshot = await getDocs(
        query(
          collection(db, HISTORICAL_COLLECTION(this.companyId)),
          where('date', '>=', startDate),
          orderBy('date', 'desc'),
          limit(lookbackDays)
        )
      );

      return snapshot.docs.map(doc => this.fromFirestore(doc.data()) as HistoricalCashFlow);
    } catch (error) {
      console.warn('Failed to get historical cash flow:', error);
      return [];
    }
  }

  /**
   * Generate payment prioritization recommendations
   */
  async generatePaymentPrioritization(): Promise<PaymentPrioritization> {
    const currentPosition = await this.getCurrentCashPosition();

    // Get all outstanding payables
    const outstandingPayables = await this.getOutstandingPayables();

    const recommendedPayments: PrioritizedPayment[] = [];
    const deferredPayments: PrioritizedPayment[] = [];

    let remainingCash = currentPosition.totalAvailableBalance;

    // Score and sort payments
    const scoredPayments = await Promise.all(
      outstandingPayables.map(async (payable) => {
        const scoringFactors = await this.calculatePaymentScoringFactors(payable);
        const priorityScore = this.calculatePriorityScore(scoringFactors);
        const riskScore = this.calculateRiskScore(scoringFactors);

        return {
          ...payable,
          scoringFactors,
          priorityScore,
          riskScore,
        };
      })
    );

    // Sort by priority score (highest first)
    scoredPayments.sort((a, b) => b.priorityScore - a.priorityScore);

    // Allocate payments based on available cash
    for (const payment of scoredPayments) {
      const recommendedAction = this.determinePaymentAction(payment, remainingCash);
      const recommendedDate = this.calculateRecommendedPaymentDate(payment, recommendedAction);

      const prioritizedPayment: PrioritizedPayment = {
        ...payment,
        recommendedAction,
        recommendedDate,
        cashImpact: payment.amount,
        relationshipImpact: this.assessRelationshipImpact(payment),
        operationalImpact: this.assessOperationalImpact(payment),
      };

      if (recommendedAction === 'pay_immediately' || recommendedAction === 'pay_on_due_date') {
        recommendedPayments.push(prioritizedPayment);
        remainingCash -= payment.amount;
      } else {
        deferredPayments.push(prioritizedPayment);
      }
    }

    // Calculate metrics
    const metrics = this.calculatePaymentMetrics(
      recommendedPayments,
      deferredPayments,
      currentPosition.totalAvailableBalance
    );

    return {
      companyId: this.companyId,
      generatedAt: new Date(),
      totalPaymentsAnalyzed: outstandingPayables.length,
      availableCash: currentPosition.totalAvailableBalance,
      recommendedPayments,
      deferredPayments,
      metrics,
    };
  }

  private async getOutstandingPayables(): Promise<any[]> {
    // This would fetch all outstanding payable transactions
    // Simplified implementation
    try {
      const snapshot = await getDocs(
        query(
          collection(db, `companies/${this.companyId}/transactions`),
          where('entityType', '==', 'creditor'),
          where('status', 'in', ['pending', 'overdue']),
          orderBy('dueDate', 'asc')
        )
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn('Failed to get outstanding payables:', error);
      return [];
    }
  }

  private async calculatePaymentScoringFactors(payment: any): Promise<PaymentScoringFactors> {
    const now = new Date();
    const dueDate = new Date(payment.dueDate || payment.createdAt);

    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysPastDue = Math.max(0, -daysUntilDue);

    // Get creditor information for more detailed scoring
    let vendorCriticality = 3; // Default
    let paymentHistory = 3; // Default
    let negotiationFlexibility = 3; // Default

    try {
      const creditorDoc = await getDoc(doc(db, `companies/${this.companyId}/creditors`, payment.entityId));
      if (creditorDoc.exists()) {
        const creditor = creditorDoc.data();
        // Enhance scoring based on creditor data
        if (creditor.category === 'supplier') vendorCriticality = 4;
        if (creditor.category === 'contractor') vendorCriticality = 3;
        if (creditor.category === 'service_provider') vendorCriticality = 2;
      }
    } catch (error) {
      console.warn('Failed to get creditor for scoring:', error);
    }

    return {
      daysUntilDue,
      daysPastDue,
      vendorCriticality,
      paymentHistory,
      negotiationFlexibility,
      earlyPaymentDiscount: 0, // Would be extracted from terms
      lateFeeRisk: daysPastDue > 0 ? 0.05 * payment.amount : 0,
      creditRating Impact: daysPastDue > 30 ? 0.1 : 0,
      serviceDisruptionRisk: vendorCriticality,
      supplierDependency: vendorCriticality,
      contractTerms: 3,
      volumeDiscount: 0,
      alternativeSuppliers: 3,
    };
  }

  private calculatePriorityScore(factors: PaymentScoringFactors): number {
    let score = 50; // Base score

    // Due date urgency (0-30 points)
    if (factors.daysPastDue > 0) {
      score += Math.min(30, factors.daysPastDue * 2);
    } else if (factors.daysUntilDue <= 7) {
      score += 20;
    } else if (factors.daysUntilDue <= 14) {
      score += 10;
    }

    // Vendor criticality (0-25 points)
    score += factors.vendorCriticality * 5;

    // Late fee risk (0-15 points)
    score += Math.min(15, factors.lateFeeRisk / 100);

    // Service disruption risk (0-20 points)
    score += factors.serviceDisruptionRisk * 4;

    // Early payment discount (negative points for opportunity cost)
    score -= factors.earlyPaymentDiscount * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskScore(factors: PaymentScoringFactors): number {
    let score = 0;

    // Late payment risk
    score += factors.daysPastDue * 2;
    score += factors.lateFeeRisk / 100 * 20;
    score += factors.creditRating Impact * 30;

    // Operational risk
    score += factors.serviceDisruptionRisk * 10;
    score += factors.supplierDependency * 8;

    // Negotiation difficulty
    score += (5 - factors.negotiationFlexibility) * 5;

    return Math.max(0, Math.min(100, score));
  }

  private determinePaymentAction(
    payment: any,
    remainingCash: number
  ): 'pay_immediately' | 'pay_on_due_date' | 'defer' | 'negotiate' {
    if (payment.daysPastDue > 30) return 'pay_immediately';
    if (payment.amount > remainingCash) return 'defer';
    if (payment.priorityScore > 80) return 'pay_immediately';
    if (payment.priorityScore > 60) return 'pay_on_due_date';
    if (payment.riskScore < 30) return 'defer';

    return 'negotiate';
  }

  private calculateRecommendedPaymentDate(payment: any, action: string): Date {
    const now = new Date();
    const dueDate = new Date(payment.dueDate || payment.createdAt);

    switch (action) {
      case 'pay_immediately':
        return now;
      case 'pay_on_due_date':
        return dueDate;
      case 'defer':
        const deferred = new Date(dueDate);
        deferred.setDate(deferred.getDate() + 14); // 2 weeks defer
        return deferred;
      case 'negotiate':
        const negotiated = new Date(dueDate);
        negotiated.setDate(negotiated.getDate() + 7); // 1 week to negotiate
        return negotiated;
      default:
        return dueDate;
    }
  }

  private assessRelationshipImpact(payment: any): 'low' | 'medium' | 'high' {
    if (payment.scoringFactors.vendorCriticality >= 4) return 'high';
    if (payment.scoringFactors.vendorCriticality >= 3) return 'medium';
    return 'low';
  }

  private assessOperationalImpact(payment: any): 'low' | 'medium' | 'high' {
    if (payment.scoringFactors.serviceDisruptionRisk >= 4) return 'high';
    if (payment.scoringFactors.serviceDisruptionRisk >= 3) return 'medium';
    return 'low';
  }

  private calculatePaymentMetrics(
    recommended: PrioritizedPayment[],
    deferred: PrioritizedPayment[],
    availableCash: number
  ): PaymentPriorizationMetrics {
    const totalRecommendedAmount = recommended.reduce((sum, p) => sum + p.amount, 0);
    const totalDeferredAmount = deferred.reduce((sum, p) => sum + p.amount, 0);
    const averagePriorityScore = recommended.length > 0
      ? recommended.reduce((sum, p) => sum + p.priorityScore, 0) / recommended.length
      : 0;

    const highRiskPaymentCount = [...recommended, ...deferred].filter(p => p.riskScore > 70).length;
    const cashPreserved = availableCash - totalRecommendedAmount;

    // Calculate risk analysis for deferred payments
    const totalLateFees = deferred.reduce((sum, p) => sum + p.scoringFactors.lateFeeRisk, 0);
    const relationshipRisk = deferred.filter(p => p.relationshipImpact === 'high').length;
    const creditRisk = deferred.reduce((sum, p) => sum + p.scoringFactors.creditRating Impact, 0);

    // Optimization metrics
    const cashFlowImprovement = totalDeferredAmount;
    const daysCashExtended = cashFlowImprovement / (totalRecommendedAmount / 30); // Rough estimate

    return {
      totalRecommendedAmount,
      totalDeferredAmount,
      averagePriorityScore,
      highRiskPaymentCount,
      cashPreserved,
      deferralRisk: {
        totalLateFees,
        relationshipRisk,
        creditRisk,
      },
      cashFlowImprovement,
      daysCashExtended,
    };
  }

  /**
   * Get forecast summary for dashboard
   */
  async getForecastSummary(): Promise<ForecastSummary | null> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, FORECASTS_COLLECTION(this.companyId)),
          orderBy('generatedAt', 'desc'),
          limit(1)
        )
      );

      if (snapshot.empty) return null;

      const latestForecast = this.fromFirestore(snapshot.docs[0].data()) as CashFlowForecast;

      const lastDay = latestForecast.dailyForecasts[latestForecast.dailyForecasts.length - 1];
      const alertCount = latestForecast.dailyForecasts.reduce(
        (count, day) => count + day.alerts.length, 0
      );

      const highRiskPeriods = latestForecast.dailyForecasts.filter(
        day => day.closingBalance < 0 || day.alerts.some(a => a.severity === 'critical' || a.severity === 'high')
      ).length;

      const dataAge = new Date().getTime() - latestForecast.generatedAt.getTime();
      const dataFreshness = dataAge < 4 * 60 * 60 * 1000 ? 'current' : // 4 hours
                           dataAge < 24 * 60 * 60 * 1000 ? 'stale' : // 24 hours
                           'critical';

      return {
        companyId: this.companyId,
        forecastId: latestForecast.id,
        generatedAt: latestForecast.generatedAt,
        forecastHorizon: latestForecast.forecastPeriodWeeks,
        currentCash: latestForecast.currentCashPosition.totalCashBalance,
        projectedCashAt13Weeks: lastDay.closingBalance,
        daysOfCashRemaining: latestForecast.metrics.projectedCashRunway,
        alertCount,
        highRiskPeriods,
        minimumCashProjected: latestForecast.metrics.minimumCashBalance,
        lastRefreshed: latestForecast.lastUpdatedAt,
        dataFreshness,
      };
    } catch (error) {
      console.warn('Failed to get forecast summary:', error);
      return null;
    }
  }

  /**
   * Get cash flow insights and recommendations
   */
  async getCashFlowInsights(): Promise<CashFlowInsights | null> {
    try {
      const historicalData = await this.getHistoricalCashFlow(90); // 3 months
      const currentForecast = await this.getForecastSummary();

      if (!currentForecast || historicalData.length < 7) return null;

      // Analyze trends
      const recentInflows = historicalData.slice(0, 30).reduce((sum, h) => sum + h.actualInflows, 0);
      const olderInflows = historicalData.slice(30, 60).reduce((sum, h) => sum + h.actualInflows, 0);
      const inflowTrend = recentInflows > olderInflows * 1.1 ? 'increasing' :
                         recentInflows < olderInflows * 0.9 ? 'decreasing' : 'stable';

      const recentOutflows = historicalData.slice(0, 30).reduce((sum, h) => sum + h.actualOutflows, 0);
      const olderOutflows = historicalData.slice(30, 60).reduce((sum, h) => sum + h.actualOutflows, 0);
      const outflowTrend = recentOutflows > olderOutflows * 1.1 ? 'increasing' :
                          recentOutflows < olderOutflows * 0.9 ? 'decreasing' : 'stable';

      // Weekly patterns
      const weeklyPattern: Record<string, number> = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (let day = 0; day < 7; day++) {
        const dayData = historicalData.filter(h => new Date(h.date).getDay() === day);
        const avgFlow = dayData.length > 0
          ? dayData.reduce((sum, h) => sum + h.netFlow, 0) / dayData.length
          : 0;
        weeklyPattern[dayNames[day]] = avgFlow;
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        inflowTrend,
        outflowTrend,
        currentForecast,
        historicalData
      );

      // Identify risk factors and opportunities
      const riskFactors = this.identifyRiskFactors(currentForecast, historicalData);
      const opportunities = this.identifyOpportunities(inflowTrend, outflowTrend, historicalData);

      return {
        inflowTrend,
        outflowTrend,
        weeklyPattern,
        recommendations,
        riskFactors,
        opportunities,
      };
    } catch (error) {
      console.warn('Failed to get cash flow insights:', error);
      return null;
    }
  }

  private generateRecommendations(
    inflowTrend: string,
    outflowTrend: string,
    forecast: ForecastSummary,
    historical: HistoricalCashFlow[]
  ): CashFlowRecommendation[] {
    const recommendations: CashFlowRecommendation[] = [];

    // Cash runway recommendations
    if (forecast.daysOfCashRemaining < 30) {
      recommendations.push({
        type: 'seek_financing',
        priority: 'high',
        description: 'Cash runway is less than 30 days. Consider emergency financing options.',
        estimatedImpact: 50000, // Example amount
        implementationDifficulty: 'medium',
        timeToImplement: 7,
      });
    }

    // Receivables recommendations
    if (inflowTrend === 'decreasing') {
      recommendations.push({
        type: 'accelerate_receivables',
        priority: 'high',
        description: 'Inflow trend is declining. Focus on collecting outstanding receivables.',
        estimatedImpact: 25000,
        implementationDifficulty: 'easy',
        timeToImplement: 3,
      });
    }

    // Expense management
    if (outflowTrend === 'increasing') {
      recommendations.push({
        type: 'reduce_expenses',
        priority: 'medium',
        description: 'Outflow trend is increasing. Review and optimize expenses.',
        estimatedImpact: 15000,
        implementationDifficulty: 'medium',
        timeToImplement: 14,
      });
    }

    return recommendations;
  }

  private identifyRiskFactors(forecast: ForecastSummary, historical: HistoricalCashFlow[]): string[] {
    const risks: string[] = [];

    if (forecast.daysOfCashRemaining < 60) {
      risks.push('Low cash runway - less than 2 months');
    }

    if (forecast.alertCount > 5) {
      risks.push('Multiple cash flow alerts in forecast period');
    }

    if (forecast.minimumCashProjected < 0) {
      risks.push('Projected negative cash balance');
    }

    const volatility = this.calculateHistoricalVariance(historical);
    if (volatility > 10000) {
      risks.push('High cash flow volatility');
    }

    return risks;
  }

  private identifyOpportunities(
    inflowTrend: string,
    outflowTrend: string,
    historical: HistoricalCashFlow[]
  ): string[] {
    const opportunities: string[] = [];

    if (inflowTrend === 'increasing') {
      opportunities.push('Positive inflow trend - consider growth investments');
    }

    if (outflowTrend === 'decreasing') {
      opportunities.push('Improving expense management - maintain current practices');
    }

    // Check for seasonal patterns that could be leveraged
    const avgInflows = historical.reduce((sum, h) => sum + h.actualInflows, 0) / historical.length;
    const strongMonths = historical.filter(h => h.actualInflows > avgInflows * 1.2);

    if (strongMonths.length > 0) {
      opportunities.push('Seasonal revenue patterns identified - plan for peak periods');
    }

    return opportunities;
  }

  /**
   * Update an existing forecast with new data
   */
  async updateForecast(forecastId: string, input: UpdateForecastInput): Promise<void> {
    const docRef = doc(db, FORECASTS_COLLECTION(this.companyId), forecastId);

    const updates: Record<string, any> = {
      lastUpdatedAt: serverTimestamp(),
      version: increment(1),
    };

    if (input.config) {
      updates.config = this.toFirestore(input.config);
    }

    if (input.manualAdjustments) {
      updates.manualAdjustments = this.toFirestore(input.manualAdjustments);
    }

    await updateDoc(docRef, updates);
  }

  /**
   * Get the latest forecast for the company
   */
  async getLatestForecast(): Promise<CashFlowForecast | null> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, FORECASTS_COLLECTION(this.companyId)),
          orderBy('generatedAt', 'desc'),
          limit(1)
        )
      );

      if (snapshot.empty) return null;

      const data = this.fromFirestore(snapshot.docs[0].data());
      return { id: snapshot.docs[0].id, ...data } as CashFlowForecast;
    } catch (error) {
      console.warn('Failed to get latest forecast:', error);
      return null;
    }
  }

  /**
   * Store actual cash flow data for accuracy tracking
   */
  async recordActualCashFlow(
    date: Date,
    actualInflows: number,
    actualOutflows: number,
    closingBalance: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const historical: HistoricalCashFlow = {
      id: '', // Will be set by Firestore
      companyId: this.companyId,
      date,
      actualInflows,
      actualOutflows,
      netFlow: actualInflows - actualOutflows,
      closingBalance,
      inflowsByCategory: {}, // Would be populated from transaction data
      outflowsByCategory: {}, // Would be populated from transaction data
      createdAt: new Date(),
      metadata,
    };

    await addDoc(
      collection(db, HISTORICAL_COLLECTION(this.companyId)),
      this.toFirestore(historical)
    );
  }

  /**
   * Delete old forecasts to manage storage
   */
  async cleanupOldForecasts(retentionDays: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const snapshot = await getDocs(
        query(
          collection(db, FORECASTS_COLLECTION(this.companyId)),
          where('generatedAt', '<', cutoffDate)
        )
      );

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} old forecasts`);
    } catch (error) {
      console.warn('Failed to cleanup old forecasts:', error);
    }
  }
}

// Singleton instance for easy access
export const createCashFlowService = (companyId: string) => new CashFlowService(companyId);