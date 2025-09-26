import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  AccountRecord,
  ChartOfAccounts,
  AccountTemplate,
} from '@/types/accounting/chart-of-accounts';
import { AVAILABLE_CHART_TEMPLATES, ChartTemplate } from '@/types/accounting/templates';

const CHARTS_COLLECTION = 'accounting_charts';
const ACCOUNTS_COLLECTION = 'accounting_accounts';

function timestampToDate(value: unknown): Date {
  if (!value) return new Date();
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return typeof value === 'string' || typeof value === 'number' ? new Date(value) : new Date();
}

export class ChartOfAccountsService {
  getTemplates(baseCurrency?: string): ChartTemplate[] {
    if (!baseCurrency) {
      return AVAILABLE_CHART_TEMPLATES;
    }
    return AVAILABLE_CHART_TEMPLATES.filter((template) => template.currency === baseCurrency);
  }

  async getCharts(tenantId: string): Promise<ChartOfAccounts[]> {
    const chartsQuery = query(
      collection(db, CHARTS_COLLECTION),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(chartsQuery);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        tenantId: data.tenantId,
        name: data.name,
        currency: data.currency,
        isDefault: Boolean(data.isDefault),
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as ChartOfAccounts;
    });
  }

  async createChart(input: Omit<ChartOfAccounts, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const chartDoc = await addDoc(collection(db, CHARTS_COLLECTION), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return chartDoc.id;
  }

  async getAccounts(tenantId: string, chartId: string): Promise<AccountRecord[]> {
    const accountsQuery = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('chartId', '==', chartId),
      orderBy('code')
    );
    const snapshot = await getDocs(accountsQuery);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        tenantId: data.tenantId,
        chartId: data.chartId,
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        hierarchy: data.hierarchy,
        metadata: data.metadata,
        isActive: data.isActive ?? true,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as AccountRecord;
    });
  }

  async applyTemplateById(tenantId: string, chartId: string, templateId: string): Promise<void> {
    const template = AVAILABLE_CHART_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    await this.applyTemplate(tenantId, chartId, template.accounts);
  }

  async createAccount(
    tenantId: string,
    account: Omit<AccountRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
      ...account,
      tenantId,
      isActive: account.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateAccount(
    id: string,
    updates: Partial<Omit<AccountRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, ACCOUNTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async toggleAccountStatus(id: string, isActive: boolean): Promise<void> {
    await this.updateAccount(id, { isActive });
  }

  async getAccount(id: string): Promise<AccountRecord | null> {
    const docRef = doc(db, ACCOUNTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      tenantId: data.tenantId,
      chartId: data.chartId,
      code: data.code,
      name: data.name,
      type: data.type,
      description: data.description,
      hierarchy: data.hierarchy,
      metadata: data.metadata,
      isActive: data.isActive ?? true,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as AccountRecord;
  }

  async applyTemplate(
    tenantId: string,
    chartId: string,
    template: AccountTemplate[]
  ): Promise<void> {
    const batchPromises = template.map((accountTemplate) =>
      this.createAccount(tenantId, {
        chartId,
        code: accountTemplate.id,
        name: accountTemplate.name,
        type: accountTemplate.type,
        description: accountTemplate.description,
        hierarchy: { parentId: null, path: accountTemplate.id, depth: 0 },
        metadata: accountTemplate.metadata,
        isActive: true,
      })
    );

    await Promise.all(batchPromises);
  }
}
