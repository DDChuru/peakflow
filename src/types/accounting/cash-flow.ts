export interface CashFlowForecast {
  id: string;
  companyId: string;
  baseCurrency: string;
  forecastDate: Date;
  forecastPeriodWeeks: number;

  // Current position
  currentCashPosition: CashPosition;

  // Forecast periods (daily for 13 weeks)
  dailyForecasts: DailyCashForecast[];

  // Summary metrics
  metrics: CashFlowMetrics;

  // Configuration
  config: ForecastConfig;

  // Metadata
  generatedBy: string;
  generatedAt: Date;
  lastUpdatedAt: Date;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface CashPosition {
  companyId: string;
  totalCashBalance: number;
  totalAvailableBalance: number;
  totalPendingBalance: number;
  baseCurrency: string;
  asOf: Date;

  // Breakdown by account
  accountBreakdown: CashPositionByAccount[];

  // Currency breakdown (if multi-currency)
  currencyBreakdown: CashPositionByCurrency[];
}

export interface CashPositionByAccount {
  bankAccountId: string;
  bankAccountName: string;
  accountType: string;
  ledgerBalance: number;
  availableBalance?: number;
  pendingBalance?: number;
  currency: string;
  lastUpdated: Date;
}

export interface CashPositionByCurrency {
  currency: string;
  totalBalance: number;
  totalAvailable: number;
  totalPending: number;
  accountCount: number;
  exchangeRateToBase?: number;
  balanceInBaseCurrency: number;
}

export interface DailyCashForecast {
  date: Date;
  dayOfWeek: string;
  weekNumber: number;

  // Opening balance
  openingBalance: number;

  // Projected inflows
  projectedInflows: CashFlowItem[];
  totalInflows: number;

  // Projected outflows
  projectedOutflows: CashFlowItem[];
  totalOutflows: number;

  // Net flow and closing
  netFlow: number;
  closingBalance: number;

  // Confidence and variance
  confidenceLevel: number; // 0-1
  varianceRange: {
    low: number;
    high: number;
  };

  // Alerts
  alerts: CashFlowAlert[];
}

export interface CashFlowItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  type: CashFlowType;
  category: CashFlowCategory;
  source: CashFlowSource;
  confidence: number; // 0-1

  // Source references
  sourceEntityId?: string; // Debtor, Creditor, etc.
  sourceTransactionId?: string;

  // Scheduling
  scheduledDate?: Date;
  originalDueDate?: Date;
  probabilityOfOccurrence: number; // 0-1

  // Metadata
  notes?: string;
  metadata?: Record<string, unknown>;
}

export type CashFlowType = 'inflow' | 'outflow';

export type CashFlowCategory =
  | 'accounts_receivable'
  | 'accounts_payable'
  | 'payroll'
  | 'loan_payment'
  | 'loan_receipt'
  | 'tax_payment'
  | 'dividend_payment'
  | 'capital_injection'
  | 'equipment_purchase'
  | 'operating_expense'
  | 'revenue'
  | 'recurring_revenue'
  | 'recurring_expense'
  | 'bank_fees'
  | 'interest_income'
  | 'interest_expense'
  | 'other';

export type CashFlowSource =
  | 'invoice'
  | 'bill'
  | 'recurring_transaction'
  | 'historical_pattern'
  | 'manual_entry'
  | 'budget'
  | 'contract'
  | 'bank_transfer';

export interface CashFlowMetrics {
  // Current metrics
  currentCashBalance: number;
  workingCapital: number;

  // Forward-looking metrics
  projectedCashRunway: number; // Days until cash runs out
  averageDailyBurnRate: number;
  averageDailyInflow: number;

  // Risk metrics
  minimumCashBalance: number;
  minimumCashDate: Date;
  daysWithNegativeCash: number;
  cashVarianceRisk: number; // Standard deviation

  // Performance metrics
  forecastAccuracy?: number; // Historical accuracy percentage
  daysToBreakeven?: number;
  projectedGrowthRate?: number;

  // Threshold alerts
  breachesCashThreshold: boolean;
  thresholdBreachDate?: Date;

  // Summary by category
  categoryBreakdown: CashFlowCategoryBreakdown[];
}

export interface CashFlowCategoryBreakdown {
  category: CashFlowCategory;
  totalInflows: number;
  totalOutflows: number;
  netFlow: number;
  itemCount: number;
  averageAmount: number;
  confidence: number;
}

export interface ForecastConfig {
  // Forecast parameters
  forecastHorizonWeeks: number;
  refreshIntervalHours: number;
  baseCurrency: string;

  // Confidence thresholds
  highConfidenceThreshold: number; // 0.8
  mediumConfidenceThreshold: number; // 0.6

  // Pattern analysis
  historicalLookbackDays: number; // 90
  seasonalityEnabled: boolean;
  trendAnalysisEnabled: boolean;

  // Risk thresholds
  minimumCashThreshold: number;
  criticalCashThreshold: number;

  // Inclusion settings
  includeAccountsReceivable: boolean;
  includeAccountsPayable: boolean;
  includeRecurringTransactions: boolean;
  includeHistoricalPatterns: boolean;
  includeBudgetData: boolean;

  // Payment timing assumptions
  defaultReceivableDays: number; // 30
  defaultPayableDays: number; // 30
  weekendProcessing: boolean;

  // Currency settings
  multiCurrencyEnabled: boolean;
  autoConvertToCurrency: boolean;
}

export interface CashFlowAlert {
  id: string;
  type: CashFlowAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggerDate: Date;
  estimatedImpact: number;
  actionRequired: boolean;
  suggestedActions?: string[];
  metadata?: Record<string, unknown>;
}

export type CashFlowAlertType =
  | 'negative_balance'
  | 'threshold_breach'
  | 'cash_runway_short'
  | 'large_outflow'
  | 'payment_concentration'
  | 'currency_risk'
  | 'data_quality'
  | 'forecast_variance';

export interface PaymentPrioritization {
  companyId: string;
  generatedAt: Date;
  totalPaymentsAnalyzed: number;
  availableCash: number;
  recommendedPayments: PrioritizedPayment[];
  deferredPayments: PrioritizedPayment[];
  metrics: PaymentPriorizationMetrics;
}

export interface PrioritizedPayment {
  entityType: 'creditor' | 'employee' | 'tax_authority' | 'loan' | 'other';
  entityId: string;
  entityName: string;
  amount: number;
  currency: string;
  dueDate: Date;
  daysPastDue: number;

  // Scoring
  priorityScore: number; // 0-100
  riskScore: number; // 0-100

  // Factors
  scoringFactors: PaymentScoringFactors;

  // Recommendation
  recommendedAction: 'pay_immediately' | 'pay_on_due_date' | 'defer' | 'negotiate';
  recommendedDate: Date;

  // Impact analysis
  cashImpact: number;
  relationshipImpact: 'low' | 'medium' | 'high';
  operationalImpact: 'low' | 'medium' | 'high';

  metadata?: Record<string, unknown>;
}

export interface PaymentScoringFactors {
  // Due date factors
  daysUntilDue: number;
  daysPastDue: number;

  // Vendor relationship
  vendorCriticality: number; // 1-5
  paymentHistory: number; // 1-5
  negotiationFlexibility: number; // 1-5

  // Financial impact
  earlyPaymentDiscount: number;
  lateFeeRisk: number;
  creditRating Impact: number;

  // Operational impact
  serviceDisruptionRisk: number; // 1-5
  supplierDependency: number; // 1-5

  // Strategic factors
  contractTerms: number; // 1-5
  volumeDiscount: number;
  alternativeSuppliers: number; // 1-5
}

export interface PaymentPriorizationMetrics {
  totalRecommendedAmount: number;
  totalDeferredAmount: number;
  averagePriorityScore: number;
  highRiskPaymentCount: number;
  cashPreserved: number;

  // Risk analysis
  deferralRisk: {
    totalLateFees: number;
    relationshipRisk: number;
    creditRisk: number;
  };

  // Optimization results
  cashFlowImprovement: number;
  daysCashExtended: number;
}

export interface HistoricalCashFlow {
  id: string;
  companyId: string;
  date: Date;
  actualInflows: number;
  actualOutflows: number;
  netFlow: number;
  closingBalance: number;

  // Breakdown by category
  inflowsByCategory: Record<CashFlowCategory, number>;
  outflowsByCategory: Record<CashFlowCategory, number>;

  // Variance analysis (if forecast existed)
  forecastedInflows?: number;
  forecastedOutflows?: number;
  varianceInflows?: number;
  varianceOutflows?: number;

  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface CashFlowPattern {
  id: string;
  companyId: string;
  patternType: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  category: CashFlowCategory;

  // Pattern data
  averageAmount: number;
  frequency: number; // Per period
  variability: number; // Standard deviation
  seasonalMultiplier?: Record<string, number>; // Month/quarter multipliers

  // Confidence
  confidenceLevel: number;
  dataPoints: number;
  analysisStartDate: Date;
  analysisEndDate: Date;

  // Metadata
  lastUpdated: Date;
  metadata?: Record<string, unknown>;
}

// Input/Update interfaces
export interface CreateForecastInput {
  companyId: string;
  forecastPeriodWeeks?: number;
  config?: Partial<ForecastConfig>;
  generatedBy: string;
}

export interface UpdateForecastInput {
  config?: Partial<ForecastConfig>;
  manualAdjustments?: ManualCashFlowAdjustment[];
  updatedBy: string;
}

export interface ManualCashFlowAdjustment {
  date: Date;
  description: string;
  amount: number;
  type: CashFlowType;
  category: CashFlowCategory;
  confidence: number;
  createdBy: string;
}

// Service response interfaces
export interface ForecastSummary {
  companyId: string;
  forecastId: string;
  generatedAt: Date;
  forecastHorizon: number;

  // Key metrics
  currentCash: number;
  projectedCashAt13Weeks: number;
  daysOfCashRemaining: number;

  // Risk indicators
  alertCount: number;
  highRiskPeriods: number;
  minimumCashProjected: number;

  // Last update
  lastRefreshed: Date;
  dataFreshness: 'current' | 'stale' | 'critical';
}

export interface CashFlowInsights {
  // Trends
  inflowTrend: 'increasing' | 'stable' | 'decreasing';
  outflowTrend: 'increasing' | 'stable' | 'decreasing';

  // Patterns
  seasonalPattern?: string;
  weeklyPattern?: Record<string, number>; // Day of week averages

  // Recommendations
  recommendations: CashFlowRecommendation[];

  // Risk factors
  riskFactors: string[];
  opportunities: string[];
}

export interface CashFlowRecommendation {
  type: 'increase_collections' | 'delay_payments' | 'seek_financing' | 'reduce_expenses' | 'accelerate_receivables';
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedImpact: number;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: number; // Days
}