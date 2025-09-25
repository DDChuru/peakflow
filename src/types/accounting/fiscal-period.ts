export type FiscalPeriodStatus = 'open' | 'closed' | 'pending' | 'locked';

export interface FiscalPeriod {
  id: string;
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;
  lockedBy?: string;
  lockedAt?: Date;
  closedBy?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiscalYearConfig {
  tenantId: string;
  baseCurrency: string;
  fiscalYearStartMonth: number;
  periods: FiscalPeriod[];
  createdAt: Date;
  updatedAt: Date;
}

