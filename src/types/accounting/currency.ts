export type RateType = 'spot' | 'average' | 'historical';

export interface CurrencyRate {
  tenantId: string;
  baseCurrency: string;
  quoteCurrency: string;
  rateType: RateType;
  rate: number;
  effectiveAt: Date;
  retrievedAt: Date;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversionResult {
  sourceAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
  rateUsed: number;
  convertedAmount: number;
}

export interface RevaluationRun {
  id: string;
  tenantId: string;
  baseCurrency: string;
  periodId: string;
  executedAt: Date;
  executedBy: string;
  journalEntryId: string;
  details: Record<string, unknown>;
}

