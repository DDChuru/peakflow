import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { Transaction, PaymentReconciliation, TransactionSummary } from '@/types/financial';
import { DebtorService } from './debtor-service';
import { CreditorService } from './creditor-service';

export class TransactionService {
  private debtorService: DebtorService;
  private creditorService: CreditorService;

  constructor() {
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
  }

  private getTransactionPath(companyId: string): string {
    // Company-Scoped Collection (CSC) pattern
    return `companies/${companyId}/transactions`;
  }

  private getReconciliationPath(companyId: string): string {
    return `companies/${companyId}/reconciliations`;
  }

  // Create a new transaction
  async createTransaction(
    companyId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>,
    userId: string
  ): Promise<Transaction> {
    try {
      const transactionsRef = collection(db, this.getTransactionPath(companyId));
      const transactionRef = doc(transactionsRef);

      const newTransaction: Transaction = {
        ...transaction,
        id: transactionRef.id,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId || transaction.createdBy
      };

      // Update the entity balance
      const amountChange = Math.abs(transaction.amount);
      const isPayment = transaction.status === 'completed';

      if (transaction.entityType === 'debtor') {
        await this.debtorService.updateDebtorBalance(
          companyId,
          transaction.entityId,
          amountChange,
          isPayment
        );
      } else {
        await this.creditorService.updateCreditorBalance(
          companyId,
          transaction.entityId,
          amountChange,
          isPayment
        );
      }

      await setDoc(transactionRef, {
        ...newTransaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

  // Get transactions with filters
  async getTransactions(
    companyId: string,
    filters?: {
      entityType?: 'debtor' | 'creditor';
      entityId?: string;
      status?: 'pending' | 'completed' | 'cancelled' | 'overdue';
      type?: 'debit' | 'credit';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      lastDoc?: DocumentSnapshot;
    }
  ): Promise<{ transactions: Transaction[]; lastDoc: DocumentSnapshot | null }> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.entityType) {
        constraints.push(where('entityType', '==', filters.entityType));
      }

      if (filters?.entityId) {
        constraints.push(where('entityId', '==', filters.entityId));
      }

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }

      if (filters?.startDate) {
        constraints.push(where('createdAt', '>=', filters.startDate));
      }

      if (filters?.endDate) {
        constraints.push(where('createdAt', '<=', filters.endDate));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (filters?.lastDoc) {
        constraints.push(startAfter(filters.lastDoc));
      }

      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(
        collection(db, this.getTransactionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      let lastDocument: DocumentSnapshot | null = null;

      querySnapshot.forEach((doc) => {
        transactions.push(this.convertFirestoreToTransaction(doc.id, doc.data()));
        lastDocument = doc;
      });

      // Check for overdue transactions and update their status
      await this.updateOverdueTransactions(companyId, transactions);

      return { transactions, lastDoc: lastDocument };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error}`);
    }
  }

  // Get a single transaction
  async getTransaction(companyId: string, transactionId: string): Promise<Transaction | null> {
    try {
      const transactionRef = doc(db, this.getTransactionPath(companyId), transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToTransaction(transactionDoc.id, transactionDoc.data());
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(`Failed to fetch transaction: ${error}`);
    }
  }

  // Update transaction status
  async updateTransactionStatus(
    companyId: string,
    transactionId: string,
    status: 'pending' | 'completed' | 'cancelled' | 'overdue',
    paidDate?: Date
  ): Promise<void> {
    try {
      const transactionRef = doc(db, this.getTransactionPath(companyId), transactionId);

      await updateDoc(transactionRef, {
        status,
        updatedAt: serverTimestamp(),
        ...(paidDate && status === 'completed' ? { paidDate } : {}),
      });

      // Update entity balance if status changed to completed
      if (status === 'completed') {
        const transaction = await this.getTransaction(companyId, transactionId);
        if (transaction) {
          const amountChange = Math.abs(transaction.amount);
          if (transaction.entityType === 'debtor') {
            await this.debtorService.updateDebtorBalance(
              companyId,
              transaction.entityId,
              amountChange,
              true
            );
          } else {
            await this.creditorService.updateCreditorBalance(
              companyId,
              transaction.entityId,
              amountChange,
              true
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw new Error(`Failed to update transaction status: ${error}`);
    }
  }

  // Reconcile payment
  async reconcilePayment(
    companyId: string,
    transactionId: string,
    reconciliation: Omit<PaymentReconciliation, 'id' | 'companyId' | 'transactionId' | 'createdAt'>
  ): Promise<PaymentReconciliation> {
    try {
      const reconRef = doc(collection(db, this.getReconciliationPath(companyId)));

      const newReconciliation: PaymentReconciliation = {
        id: reconRef.id,
        companyId,
        transactionId,
        ...reconciliation,
        createdAt: new Date()
      };

      await setDoc(reconRef, {
        ...newReconciliation,
        createdAt: serverTimestamp()
      });

      // Update transaction status to completed
      await this.updateTransactionStatus(
        companyId,
        transactionId,
        'completed',
        reconciliation.reconciledDate
      );

      return newReconciliation;
    } catch (error) {
      console.error('Error reconciling payment:', error);
      throw new Error(`Failed to reconcile payment: ${error}`);
    }
  }

  // Get transaction summary for dashboard
  async getTransactionSummary(
    companyId: string,
    period?: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<TransactionSummary> {
    try {
      const { transactions } = await this.getTransactions(companyId, {
        startDate: period?.startDate,
        endDate: period?.endDate
      });

      const summary: TransactionSummary = {
        totalTransactions: transactions.length,
        totalDebits: 0,
        totalCredits: 0,
        pendingAmount: 0,
        completedAmount: 0,
        overdueAmount: 0,
        debtorTransactions: 0,
        creditorTransactions: 0
      };

      transactions.forEach(t => {
        if (t.type === 'debit') {
          summary.totalDebits += t.amount;
        } else {
          summary.totalCredits += t.amount;
        }

        if (t.status === 'pending') {
          summary.pendingAmount += t.amount;
        } else if (t.status === 'completed') {
          summary.completedAmount += t.amount;
        } else if (t.status === 'overdue') {
          summary.overdueAmount += t.amount;
        }

        if (t.entityType === 'debtor') {
          summary.debtorTransactions++;
        } else {
          summary.creditorTransactions++;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw new Error(`Failed to get transaction summary: ${error}`);
    }
  }

  // Update overdue transactions
  private async updateOverdueTransactions(
    companyId: string,
    transactions: Transaction[]
  ): Promise<void> {
    const today = new Date();
    const overdueTransactions = transactions.filter(t => {
      if (t.status !== 'pending' || !t.dueDate) return false;
      return new Date(t.dueDate) < today;
    });

    for (const transaction of overdueTransactions) {
      await this.updateTransactionStatus(companyId, transaction.id, 'overdue');
    }
  }

  // Helper method to convert Firestore document to Transaction type
  private convertFirestoreToTransaction(id: string, data: DocumentData): Transaction {
    return {
      id,
      companyId: data.companyId,
      type: data.type,
      entityType: data.entityType,
      entityId: data.entityId,
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      description: data.description,
      reference: data.reference,
      dueDate: data.dueDate?.toDate(),
      paidDate: data.paidDate?.toDate(),
      status: data.status || 'pending',
      attachments: data.attachments || [],
      metadata: data.metadata,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  // Get recent transactions for an entity
  async getEntityTransactions(
    companyId: string,
    entityType: 'debtor' | 'creditor',
    entityId: string,
    limitCount: number = 10
  ): Promise<Transaction[]> {
    try {
      const { transactions } = await this.getTransactions(companyId, {
        entityType,
        entityId,
        limit: limitCount
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching entity transactions:', error);
      throw new Error(`Failed to fetch entity transactions: ${error}`);
    }
  }

  // Cancel a transaction
  async cancelTransaction(companyId: string, transactionId: string): Promise<void> {
    try {
      await this.updateTransactionStatus(companyId, transactionId, 'cancelled');
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw new Error(`Failed to cancel transaction: ${error}`);
    }
  }
}
