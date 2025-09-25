import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConversionResult, CurrencyRate, RateType, RevaluationRun } from '@/types/accounting/currency';

const RATES_COLLECTION = 'accounting_currency_rates';
const REVALUATIONS_COLLECTION = 'accounting_revaluations';

function normalizeAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class CurrencyService {
  constructor(private readonly tenantId: string) {}

  async getLatestRate(base: string, quote: string, rateType: RateType = 'spot'): Promise<CurrencyRate | null> {
    const rateQuery = query(
      collection(db, RATES_COLLECTION),
      where('tenantId', '==', this.tenantId),
      where('baseCurrency', '==', base),
      where('quoteCurrency', '==', quote),
      where('rateType', '==', rateType),
      orderBy('effectiveAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(rateQuery);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      tenantId: data.tenantId,
      baseCurrency: data.baseCurrency,
      quoteCurrency: data.quoteCurrency,
      rateType: data.rateType,
      rate: data.rate,
      effectiveAt: data.effectiveAt?.toDate() ?? new Date(),
      retrievedAt: data.retrievedAt?.toDate() ?? new Date(),
      source: data.source,
      metadata: data.metadata,
    };
  }

  async convert(amount: number, sourceCurrency: string, targetCurrency: string, rateType: RateType = 'spot'): Promise<ConversionResult> {
    if (sourceCurrency === targetCurrency) {
      return {
        sourceAmount: amount,
        sourceCurrency,
        targetCurrency,
        rateUsed: 1,
        convertedAmount: normalizeAmount(amount),
      };
    }

    const rate = await this.getLatestRate(sourceCurrency, targetCurrency, rateType);
    if (!rate) {
      throw new Error(`No ${rateType} rate available for ${sourceCurrency}/${targetCurrency}`);
    }

    const converted = normalizeAmount(amount * rate.rate);
    return {
      sourceAmount: amount,
      sourceCurrency,
      targetCurrency,
      rateUsed: rate.rate,
      convertedAmount: converted,
    };
  }

  async recordRate(rate: Omit<CurrencyRate, 'retrievedAt'>): Promise<void> {
    await addDoc(collection(db, RATES_COLLECTION), {
      ...rate,
      effectiveAt: rate.effectiveAt,
      retrievedAt: serverTimestamp(),
      tenantId: this.tenantId,
    });
  }

  async logRevaluation(run: Omit<RevaluationRun, 'executedAt'>): Promise<void> {
    await addDoc(collection(db, REVALUATIONS_COLLECTION), {
      ...run,
      executedAt: serverTimestamp(),
      tenantId: this.tenantId,
    });
  }
}
