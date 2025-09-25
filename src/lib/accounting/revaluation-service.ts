import { PostingService } from './posting-service';
import { CurrencyService } from './currency-service';
import { JournalEntry, JournalLine } from '@/types/accounting/journal';
import { RevaluationRun } from '@/types/accounting/currency';

export interface ExposurePosition {
  accountId: string;
  accountCode: string;
  description?: string;
  balance: number; // local currency balance
  currency: string; // currency of the balance
  baseCurrencyBalance: number; // previous revalued amount in base currency
}

export interface RevaluationResult {
  journalEntry: JournalEntry;
  gainLoss: number;
}

interface RevaluationOptions {
  tenantId: string;
  baseCurrency: string;
  fiscalPeriodId: string;
  postingService: PostingService;
  currencyService: CurrencyService;
  gainAccountId: string;
  gainAccountCode: string;
  lossAccountId: string;
  lossAccountCode: string;
}

export class RevaluationService {
  constructor(private readonly options: RevaluationOptions) {}

  async run(exposures: ExposurePosition[], executedBy: string): Promise<RevaluationResult | null> {
    if (exposures.length === 0) {
      return null;
    }

    const journalLines: JournalLine[] = [];
    let aggregateGainLoss = 0;

    for (const exposure of exposures) {
      if (exposure.currency === this.options.baseCurrency) {
        continue;
      }

      const conversion = await this.options.currencyService.convert(
        exposure.balance,
        exposure.currency,
        this.options.baseCurrency,
        'spot'
      );

      const difference = conversion.convertedAmount - exposure.baseCurrencyBalance;
      if (Math.abs(difference) < 0.01) continue;

      aggregateGainLoss += difference;

      const isGain = difference >= 0;
      const amount = Math.abs(difference);

      const debitLine: JournalLine = {
        id: `${exposure.accountId}-debit-${Date.now()}`,
        accountId: isGain ? exposure.accountId : this.options.lossAccountId,
        accountCode: isGain ? exposure.accountCode : this.options.lossAccountCode,
        description: exposure.description ?? 'Currency revaluation',
        debit: amount,
        credit: 0,
        currency: this.options.baseCurrency,
        dimensions: { sourceCurrency: exposure.currency },
      };

      const creditLine: JournalLine = {
        id: `${exposure.accountId}-credit-${Date.now()}`,
        accountId: isGain ? this.options.gainAccountId : exposure.accountId,
        accountCode: isGain ? this.options.gainAccountCode : exposure.accountCode,
        description: exposure.description ?? 'Currency revaluation',
        debit: 0,
        credit: amount,
        currency: this.options.baseCurrency,
        dimensions: { sourceCurrency: exposure.currency },
      };

      journalLines.push(debitLine, creditLine);
    }

    if (journalLines.length === 0) {
      return null;
    }

    const journalEntry: JournalEntry = {
      id: `reval-${Date.now()}`,
      tenantId: this.options.tenantId,
      fiscalPeriodId: this.options.fiscalPeriodId,
      journalCode: 'REVAL',
      source: 'revaluation',
      description: 'Currency revaluation adjustment',
      status: 'draft',
      transactionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: executedBy,
      lines: journalLines,
      metadata: {
        baseCurrency: this.options.baseCurrency,
      },
    };

    await this.options.postingService.post({ ...journalEntry, status: 'draft' });

    const run: RevaluationRun = {
      id: journalEntry.id,
      tenantId: this.options.tenantId,
      baseCurrency: this.options.baseCurrency,
      periodId: this.options.fiscalPeriodId,
      executedBy,
      journalEntryId: journalEntry.id,
      executedAt: new Date(),
      details: {
        exposureCount: exposures.length,
        journalLines: journalLines.length,
        aggregateGainLoss,
      },
    };

    await this.options.currencyService.logRevaluation(run);

    return {
      journalEntry,
      gainLoss: aggregateGainLoss,
    };
  }
}
