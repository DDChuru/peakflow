import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  DocumentData,
  QueryConstraint,
  runTransaction,
  writeBatch
} from 'firebase/firestore';

import { db } from './config';
import {
  BankAccount,
  BankAccountBalance,
  BankAccountStatus,
  BankAccountType,
  BankSignatory,
  BankTransfer,
  TransferStatus,
  TransferType,
  TransferValidation,
  BankAccountValidation,
  TransferApproval
} from '@/types/accounting/bank-account';
import { CurrencyService } from '../accounting/currency-service';
import { ChartOfAccountsService } from '../accounting/chart-of-accounts-service';
import { PostingService } from '../accounting/posting-service';
import { JournalEntry, JournalLine } from '@/types/accounting/journal';

export interface CreateBankAccountInput
  extends Omit<
    BankAccount,
    | 'id'
    | 'companyId'
    | 'createdAt'
    | 'updatedAt'
    | 'createdBy'
    | 'updatedBy'
    | 'accountNumberMasked'
  > {
  id?: string;
  accountNumberMasked?: string;
}

export interface UpdateBankAccountInput
  extends Partial<
    Omit<BankAccount, 'id' | 'companyId' | 'createdAt' | 'createdBy'>
  > {
  updatedBy: string;
}

const COLLECTION_PATH = (companyId: string) => `companies/${companyId}/bankAccounts`;
const TRANSFERS_COLLECTION_PATH = (companyId: string) => `companies/${companyId}/bankTransfers`;

export class BankAccountService {
  private maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) {
      return '••••';
    }

    const digits = accountNumber.replace(/\D/g, '');
    if (digits.length <= 4) {
      return `•••• ${digits}`;
    }

    const visible = digits.slice(-4);
    return `•••• ${visible}`;
  }

  private toDate(value?: Timestamp | Date | null): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    return value.toDate();
  }

  private fromFirestore(id: string, data: DocumentData): BankAccount {
    const balanceData = data.balance ?? {};

    const normalizeSignatories = Array.isArray(data.signatories)
      ? (data.signatories as BankSignatory[]).map((signatory) => ({
          ...signatory,
        }))
      : [];

    return {
      id,
      companyId: data.companyId,
      name: data.name,
      accountNumber: data.accountNumber,
      accountNumberMasked: data.accountNumberMasked ?? this.maskAccountNumber(data.accountNumber),
      accountType: data.accountType,
      bankName: data.bankName,
      branch: data.branch,
      branchCode: data.branchCode,
      country: data.country,
      currency: data.currency,
      glAccountId: data.glAccountId,
      isPrimary: Boolean(data.isPrimary),
      status: (data.status as BankAccountStatus) ?? 'active',
      signatories: normalizeSignatories,
      limits: data.limits,
      balance: {
        ledger: Number(balanceData.ledger ?? 0),
        available: balanceData.available !== undefined ? Number(balanceData.available) : undefined,
        pending: balanceData.pending !== undefined ? Number(balanceData.pending) : undefined,
        currency: balanceData.currency ?? data.currency,
        asOf: this.toDate(balanceData.asOf),
      } satisfies BankAccountBalance,
      approvalThreshold: data.approvalThreshold !== undefined ? Number(data.approvalThreshold) : undefined,
      integration: data.integration
        ? {
            ...data.integration,
            lastSyncedAt: this.toDate(data.integration.lastSyncedAt),
          }
        : undefined,
      lastReconciledAt: this.toDate(data.lastReconciledAt),
      lastStatementAt: this.toDate(data.lastStatementAt),
      metadata: data.metadata,
      createdAt: this.toDate(data.createdAt) ?? new Date(),
      updatedAt: this.toDate(data.updatedAt) ?? new Date(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  }

  private toFirestore(bankAccount: Partial<BankAccount>) {
    const balance = bankAccount.balance ?? { ledger: 0, currency: bankAccount.currency };

    return {
      ...bankAccount,
      balance: {
        ...balance,
        asOf: balance.asOf ? Timestamp.fromDate(balance.asOf) : null,
      },
      lastReconciledAt: bankAccount.lastReconciledAt
        ? Timestamp.fromDate(bankAccount.lastReconciledAt)
        : null,
      lastStatementAt: bankAccount.lastStatementAt
        ? Timestamp.fromDate(bankAccount.lastStatementAt)
        : null,
      integration: bankAccount.integration
        ? {
            ...bankAccount.integration,
            lastSyncedAt: bankAccount.integration.lastSyncedAt
              ? Timestamp.fromDate(bankAccount.integration.lastSyncedAt)
              : null,
          }
        : null,
      createdAt: bankAccount.createdAt
        ? Timestamp.fromDate(bankAccount.createdAt)
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  }

  async createBankAccount(
    companyId: string,
    payload: CreateBankAccountInput,
    userId: string
  ): Promise<BankAccount> {
    const collectionRef = collection(db, COLLECTION_PATH(companyId));
    const documentRef = payload.id ? doc(collectionRef, payload.id) : doc(collectionRef);

    // Build bank account object, only including defined fields
    const bankAccount: any = {
      id: documentRef.id,
      companyId,
      name: payload.name,
      accountNumber: payload.accountNumber,
      accountNumberMasked: payload.accountNumberMasked ?? this.maskAccountNumber(payload.accountNumber),
      accountType: payload.accountType,
      bankName: payload.bankName,
      currency: payload.currency,
      glAccountId: payload.glAccountId,
      isPrimary: payload.isPrimary ?? false,
      status: payload.status ?? 'active',
      signatories: payload.signatories ?? [],
      balance: {
        ledger: payload.balance?.ledger ?? 0,
        currency: payload.balance?.currency ?? payload.currency,
      },
      metadata: payload.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    };

    // Only add optional fields if they have values
    if (payload.branch) bankAccount.branch = payload.branch;
    if (payload.branchCode) bankAccount.branchCode = payload.branchCode;
    if (payload.country) bankAccount.country = payload.country;
    if (payload.limits) bankAccount.limits = payload.limits;
    if (payload.approvalThreshold !== undefined) bankAccount.approvalThreshold = payload.approvalThreshold;
    if (payload.integration) bankAccount.integration = payload.integration;
    if (payload.lastReconciledAt) bankAccount.lastReconciledAt = payload.lastReconciledAt;
    if (payload.lastStatementAt) bankAccount.lastStatementAt = payload.lastStatementAt;

    // Add optional balance fields
    if (payload.balance?.available !== undefined) bankAccount.balance.available = payload.balance.available;
    if (payload.balance?.pending !== undefined) bankAccount.balance.pending = payload.balance.pending;
    if (payload.balance?.asOf) bankAccount.balance.asOf = payload.balance.asOf;

    await setDoc(documentRef, {
      ...this.toFirestore(bankAccount),
      companyId,
      createdBy: userId,
      updatedBy: userId,
    });

    const createdDoc = await getDoc(documentRef);
    return this.fromFirestore(createdDoc.id, createdDoc.data()!);
  }

  async listBankAccounts(
    companyId: string,
    filters?: {
      status?: BankAccountStatus;
      accountType?: BankAccountType;
      glAccountId?: string;
      searchTerm?: string;
      includeInactive?: boolean;
    }
  ): Promise<BankAccount[]> {
    const includeInactive = Boolean(filters?.includeInactive);
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters?.accountType) {
      constraints.push(where('accountType', '==', filters.accountType));
    }

    if (filters?.glAccountId) {
      constraints.push(where('glAccountId', '==', filters.glAccountId));
    }

    const querySnapshot = await getDocs(
      query(collection(db, COLLECTION_PATH(companyId)), ...constraints)
    );

    return querySnapshot.docs
      .map((snapshot) => this.fromFirestore(snapshot.id, snapshot.data()))
      .filter((bankAccount) => {
        if (!includeInactive && !filters?.status && bankAccount.status === 'closed') {
          return false;
        }

        if (!filters?.searchTerm) {
          return true;
        }

        const term = filters.searchTerm.toLowerCase();
        return (
          bankAccount.name.toLowerCase().includes(term) ||
          bankAccount.bankName.toLowerCase().includes(term) ||
          bankAccount.accountNumber.includes(term) ||
          (bankAccount.accountNumberMasked
            ? bankAccount.accountNumberMasked.toLowerCase().includes(term)
            : false)
        );
      });
  }

  async getBankAccount(companyId: string, bankAccountId: string): Promise<BankAccount | null> {
    const documentRef = doc(db, COLLECTION_PATH(companyId), bankAccountId);
    const document = await getDoc(documentRef);

    if (!document.exists()) {
      return null;
    }

    return this.fromFirestore(document.id, document.data());
  }

  async updateBankAccount(
    companyId: string,
    bankAccountId: string,
    updates: UpdateBankAccountInput
  ): Promise<void> {
    const documentRef = doc(db, COLLECTION_PATH(companyId), bankAccountId);
    const existing = await getDoc(documentRef);

    if (!existing.exists()) {
      throw new Error('Bank account not found');
    }

    const partial: Record<string, unknown> = {
      ...updates,
      updatedBy: updates.updatedBy,
      updatedAt: serverTimestamp(),
    };

    if (updates.balance) {
      partial['balance'] = {
        ...updates.balance,
        asOf: updates.balance.asOf ? Timestamp.fromDate(updates.balance.asOf) : null,
      };
    }

    if (updates.lastReconciledAt !== undefined) {
      partial['lastReconciledAt'] = updates.lastReconciledAt
        ? Timestamp.fromDate(updates.lastReconciledAt)
        : null;
    }

    if (updates.lastStatementAt !== undefined) {
      partial['lastStatementAt'] = updates.lastStatementAt
        ? Timestamp.fromDate(updates.lastStatementAt)
        : null;
    }

    if (updates.integration) {
      partial['integration'] = {
        ...updates.integration,
        lastSyncedAt: updates.integration.lastSyncedAt
          ? Timestamp.fromDate(updates.integration.lastSyncedAt)
          : null,
      };
    }

    if (updates.accountNumber && !updates.accountNumberMasked) {
      partial['accountNumberMasked'] = this.maskAccountNumber(updates.accountNumber);
    }

    await updateDoc(documentRef, partial);
  }

  async archiveBankAccount(companyId: string, bankAccountId: string, userId: string): Promise<void> {
    await this.updateBankAccount(companyId, bankAccountId, {
      status: 'inactive',
      updatedBy: userId,
    });
  }

  async closeBankAccount(companyId: string, bankAccountId: string, userId: string): Promise<void> {
    await this.updateBankAccount(companyId, bankAccountId, {
      status: 'closed',
      updatedBy: userId,
    });
  }

  async deleteBankAccount(companyId: string, bankAccountId: string): Promise<void> {
    const documentRef = doc(db, COLLECTION_PATH(companyId), bankAccountId);
    await deleteDoc(documentRef);
  }

  async updateBalances(
    companyId: string,
    bankAccountId: string,
    balance: BankAccountBalance,
    userId: string
  ): Promise<void> {
    await this.updateBankAccount(companyId, bankAccountId, {
      balance,
      lastReconciledAt: balance.asOf,
      updatedBy: userId,
    });
  }

  // Validation Methods
  async validateBankAccount(companyId: string, bankAccount: Partial<BankAccount>): Promise<BankAccountValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!bankAccount.name?.trim()) {
      errors.push('Account name is required');
    }

    if (!bankAccount.accountNumber?.trim()) {
      errors.push('Account number is required');
    }

    if (!bankAccount.bankName?.trim()) {
      errors.push('Bank name is required');
    }

    if (!bankAccount.currency?.trim()) {
      errors.push('Currency is required');
    }

    if (!bankAccount.glAccountId?.trim()) {
      errors.push('GL Account ID is required');
    } else {
      // Validate GL account link
      const isValidGLAccount = await this.validateGLAccountLink(companyId, bankAccount.glAccountId);
      if (!isValidGLAccount) {
        errors.push('Invalid GL Account ID or account not suitable for banking');
      }
    }

    // Validate unique account number
    if (bankAccount.accountNumber) {
      const existing = await this.listBankAccounts(companyId, {
        searchTerm: bankAccount.accountNumber,
        includeInactive: true
      });

      const duplicates = existing.filter(acc =>
        acc.accountNumber === bankAccount.accountNumber &&
        acc.id !== bankAccount.id
      );

      if (duplicates.length > 0) {
        errors.push('Account number must be unique within the company');
      }
    }

    // Validate signatory roles and limits
    if (bankAccount.signatories) {
      for (const signatory of bankAccount.signatories) {
        if (!signatory.name?.trim()) {
          errors.push(`Signatory must have a name`);
        }

        if (signatory.role === 'approver' && !signatory.approvalLimit) {
          warnings.push(`Approver ${signatory.name} should have an approval limit`);
        }
      }
    }

    // Validate limits
    if (bankAccount.limits) {
      const { singleTransaction, daily, weekly, monthly } = bankAccount.limits;

      if (singleTransaction && daily && singleTransaction > daily) {
        errors.push('Single transaction limit cannot exceed daily limit');
      }

      if (daily && weekly && daily > weekly) {
        errors.push('Daily limit cannot exceed weekly limit');
      }

      if (weekly && monthly && weekly > monthly) {
        errors.push('Weekly limit cannot exceed monthly limit');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async validateGLAccountLink(companyId: string, glAccountId: string): Promise<boolean> {
    try {
      if (!glAccountId?.trim()) {
        return false;
      }

      const chartService = new ChartOfAccountsService();
      const account = await chartService.getAccount(glAccountId);

      if (!account) {
        return false;
      }

      // Verify the account belongs to the same tenant (company)
      if (account.tenantId !== companyId) {
        return false;
      }

      // Check if the account is active
      if (!account.isActive) {
        return false;
      }

      // Verify the account type is suitable for banking (typically asset accounts)
      if (account.type !== 'asset') {
        return false;
      }

      // Check if banking is enabled for this account
      if (!account.metadata.banking?.enabled) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating GL account link:', error);
      return false;
    }
  }

  // Transfer Methods
  private transferToFirestore(transfer: Partial<BankTransfer>) {
    return {
      ...transfer,
      scheduledDate: transfer.scheduledDate ? Timestamp.fromDate(transfer.scheduledDate) : null,
      executedDate: transfer.executedDate ? Timestamp.fromDate(transfer.executedDate) : null,
      approvedBy: transfer.approvedBy?.map(approval => ({
        ...approval,
        approvedAt: Timestamp.fromDate(approval.approvedAt)
      })),
      createdAt: transfer.createdAt ? Timestamp.fromDate(transfer.createdAt) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  }

  private transferFromFirestore(id: string, data: DocumentData): BankTransfer {
    return {
      id,
      companyId: data.companyId,
      type: data.type,
      status: data.status,
      fromAccountId: data.fromAccountId,
      fromAccountName: data.fromAccountName,
      fromAccountNumber: data.fromAccountNumber,
      toAccountId: data.toAccountId,
      toAccountName: data.toAccountName,
      toAccountNumber: data.toAccountNumber,
      toBankName: data.toBankName,
      amount: Number(data.amount),
      currency: data.currency,
      description: data.description,
      reference: data.reference,
      requiresApproval: Boolean(data.requiresApproval),
      approvalThreshold: data.approvalThreshold ? Number(data.approvalThreshold) : undefined,
      approvedBy: data.approvedBy?.map((approval: any) => ({
        ...approval,
        approvedAt: this.toDate(approval.approvedAt)
      })) || [],
      approvalNotes: data.approvalNotes,
      scheduledDate: this.toDate(data.scheduledDate),
      executedDate: this.toDate(data.executedDate),
      fees: data.fees ? Number(data.fees) : undefined,
      exchangeRate: data.exchangeRate ? Number(data.exchangeRate) : undefined,
      convertedAmount: data.convertedAmount ? Number(data.convertedAmount) : undefined,
      journalEntryId: data.journalEntryId,
      glTransactionId: data.glTransactionId,
      routingNumber: data.routingNumber,
      swiftCode: data.swiftCode,
      beneficiaryAddress: data.beneficiaryAddress,
      externalReferenceId: data.externalReferenceId,
      confirmationNumber: data.confirmationNumber,
      metadata: data.metadata || {},
      createdAt: this.toDate(data.createdAt) ?? new Date(),
      updatedAt: this.toDate(data.updatedAt) ?? new Date(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  }

  async validateTransfer(companyId: string, transfer: Partial<BankTransfer>): Promise<TransferValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let requiresApproval = false;
    const approvers: BankSignatory[] = [];

    // Validate required fields
    if (!transfer.fromAccountId) {
      errors.push('Source account is required');
    }

    if (!transfer.amount || transfer.amount <= 0) {
      errors.push('Transfer amount must be greater than zero');
    }

    if (!transfer.description?.trim()) {
      errors.push('Transfer description is required');
    }

    if (!transfer.toAccountName?.trim()) {
      errors.push('Destination account name is required');
    }

    if (!transfer.toAccountNumber?.trim()) {
      errors.push('Destination account number is required');
    }

    // Get source account details
    let sourceAccount: BankAccount | null = null;
    if (transfer.fromAccountId) {
      sourceAccount = await this.getBankAccount(companyId, transfer.fromAccountId);

      if (!sourceAccount) {
        errors.push('Source account not found');
      } else {
        // Check account status
        if (sourceAccount.status !== 'active') {
          errors.push('Source account is not active');
        }

        // Check sufficient balance
        if (transfer.amount && sourceAccount.balance.available !== undefined) {
          if (transfer.amount > sourceAccount.balance.available) {
            errors.push('Insufficient funds in source account');
          }
        } else if (transfer.amount && transfer.amount > sourceAccount.balance.ledger) {
          warnings.push('Transfer amount exceeds ledger balance - verify available balance');
        }

        // Check limits
        if (sourceAccount.limits && transfer.amount) {
          if (sourceAccount.limits.singleTransaction && transfer.amount > sourceAccount.limits.singleTransaction) {
            errors.push(`Transfer amount exceeds single transaction limit of ${sourceAccount.limits.singleTransaction}`);
          }
        }

        // Check approval requirements
        if (sourceAccount.approvalThreshold && transfer.amount && transfer.amount >= sourceAccount.approvalThreshold) {
          requiresApproval = true;

          // Find eligible approvers
          for (const signatory of sourceAccount.signatories) {
            if (signatory.role === 'approver' || signatory.role === 'administrator') {
              if (!signatory.approvalLimit || transfer.amount <= signatory.approvalLimit) {
                approvers.push(signatory);
              }
            }
          }

          if (approvers.length === 0) {
            errors.push('No authorized approvers found for this transfer amount');
          }
        }
      }
    }

    // Validate destination account for internal transfers
    if (transfer.type === 'internal' && transfer.toAccountId) {
      const destAccount = await this.getBankAccount(companyId, transfer.toAccountId);

      if (!destAccount) {
        errors.push('Destination account not found');
      } else if (destAccount.status !== 'active') {
        errors.push('Destination account is not active');
      }

      // Check currency compatibility
      if (sourceAccount && destAccount && sourceAccount.currency !== destAccount.currency) {
        warnings.push('Currency conversion will be required for this transfer');
      }
    }

    // Validate external transfer details
    if (transfer.type === 'external') {
      if (!transfer.toBankName?.trim()) {
        errors.push('Destination bank name is required for external transfers');
      }

      if (transfer.type === 'wire' && !transfer.swiftCode?.trim()) {
        warnings.push('SWIFT code is recommended for wire transfers');
      }

      if (transfer.type === 'ach' && !transfer.routingNumber?.trim()) {
        errors.push('Routing number is required for ACH transfers');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiresApproval,
      approvers
    };
  }

  async initiateTransfer(
    companyId: string,
    transferData: Omit<BankTransfer, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    userId: string
  ): Promise<BankTransfer> {
    // Validate transfer
    const validation = await this.validateTransfer(companyId, transferData);
    if (!validation.isValid) {
      throw new Error(`Transfer validation failed: ${validation.errors.join(', ')}`);
    }

    const collectionRef = collection(db, TRANSFERS_COLLECTION_PATH(companyId));
    const documentRef = doc(collectionRef);

    const transfer: BankTransfer = {
      id: documentRef.id,
      companyId,
      ...transferData,
      status: validation.requiresApproval ? 'pending' : 'approved',
      requiresApproval: validation.requiresApproval,
      approvedBy: validation.requiresApproval ? [] : [{
        approvedBy: userId,
        approvedAt: new Date(),
        notes: 'Auto-approved - below threshold',
        signatoryId: 'system'
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    };

    // Handle currency conversion if needed
    if (transfer.type === 'internal' && transfer.toAccountId) {
      const sourceAccount = await this.getBankAccount(companyId, transfer.fromAccountId);
      const destAccount = await this.getBankAccount(companyId, transfer.toAccountId);

      if (sourceAccount && destAccount && sourceAccount.currency !== destAccount.currency) {
        const currencyService = new CurrencyService(companyId);
        const conversion = await currencyService.convert(
          transfer.amount,
          sourceAccount.currency,
          destAccount.currency
        );

        transfer.exchangeRate = conversion.rateUsed;
        transfer.convertedAmount = conversion.convertedAmount;
      }
    }

    await setDoc(documentRef, this.transferToFirestore(transfer));

    // If auto-approved, execute immediately
    if (!validation.requiresApproval) {
      await this.executeTransfer(companyId, transfer.id, userId);
    }

    return transfer;
  }

  async approveTransfer(
    companyId: string,
    transferId: string,
    approval: Omit<TransferApproval, 'approvedAt'>,
    userId: string
  ): Promise<void> {
    const transferRef = doc(db, TRANSFERS_COLLECTION_PATH(companyId), transferId);
    const transfer = await getDoc(transferRef);

    if (!transfer.exists()) {
      throw new Error('Transfer not found');
    }

    const transferData = this.transferFromFirestore(transfer.id, transfer.data());

    if (transferData.status !== 'pending') {
      throw new Error('Transfer is not pending approval');
    }

    // Verify approver authorization
    const sourceAccount = await this.getBankAccount(companyId, transferData.fromAccountId);
    if (!sourceAccount) {
      throw new Error('Source account not found');
    }

    const signatory = sourceAccount.signatories.find(s => s.id === approval.signatoryId);
    if (!signatory) {
      throw new Error('Signatory not found');
    }

    if (signatory.role !== 'approver' && signatory.role !== 'administrator') {
      throw new Error('User not authorized to approve transfers');
    }

    if (signatory.approvalLimit && transferData.amount > signatory.approvalLimit) {
      throw new Error('Transfer amount exceeds approver limit');
    }

    // Add approval
    const newApproval: TransferApproval = {
      ...approval,
      approvedAt: new Date()
    };

    const updatedApprovals = [...(transferData.approvedBy || []), newApproval];

    await updateDoc(transferRef, {
      approvedBy: updatedApprovals.map(a => ({
        ...a,
        approvedAt: Timestamp.fromDate(a.approvedAt)
      })),
      status: 'approved',
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });

    // Execute the transfer
    await this.executeTransfer(companyId, transferId, userId);
  }

  async executeTransfer(companyId: string, transferId: string, userId: string): Promise<void> {
    const transferRef = doc(db, TRANSFERS_COLLECTION_PATH(companyId), transferId);

    await runTransaction(db, async (transaction) => {
      const transferDoc = await transaction.get(transferRef);

      if (!transferDoc.exists()) {
        throw new Error('Transfer not found');
      }

      const transferData = this.transferFromFirestore(transferDoc.id, transferDoc.data());

      if (transferData.status !== 'approved') {
        throw new Error('Transfer is not approved for execution');
      }

      // Update source account balance for internal transfers
      if (transferData.type === 'internal' && transferData.toAccountId) {
        const sourceAccountRef = doc(db, COLLECTION_PATH(companyId), transferData.fromAccountId);
        const destAccountRef = doc(db, COLLECTION_PATH(companyId), transferData.toAccountId);

        const sourceAccountDoc = await transaction.get(sourceAccountRef);
        const destAccountDoc = await transaction.get(destAccountRef);

        if (!sourceAccountDoc.exists() || !destAccountDoc.exists()) {
          throw new Error('One or both accounts not found');
        }

        const sourceAccount = this.fromFirestore(sourceAccountDoc.id, sourceAccountDoc.data());
        const destAccount = this.fromFirestore(destAccountDoc.id, destAccountDoc.data());

        // Update source account balance
        const newSourceBalance = {
          ...sourceAccount.balance,
          ledger: sourceAccount.balance.ledger - transferData.amount,
          available: sourceAccount.balance.available ?
            sourceAccount.balance.available - transferData.amount : undefined,
          asOf: new Date()
        };

        // Update destination account balance
        const transferAmount = transferData.convertedAmount || transferData.amount;
        const newDestBalance = {
          ...destAccount.balance,
          ledger: destAccount.balance.ledger + transferAmount,
          available: destAccount.balance.available ?
            destAccount.balance.available + transferAmount : undefined,
          asOf: new Date()
        };

        transaction.update(sourceAccountRef, {
          balance: {
            ...newSourceBalance,
            asOf: Timestamp.fromDate(newSourceBalance.asOf)
          },
          updatedBy: userId,
          updatedAt: serverTimestamp()
        });

        transaction.update(destAccountRef, {
          balance: {
            ...newDestBalance,
            asOf: Timestamp.fromDate(newDestBalance.asOf)
          },
          updatedBy: userId,
          updatedAt: serverTimestamp()
        });
      }

      // Update transfer status
      transaction.update(transferRef, {
        status: 'completed',
        executedDate: serverTimestamp(),
        updatedBy: userId,
        updatedAt: serverTimestamp()
      });
    });

    // Create journal entry for the transfer
    await this.createTransferJournalEntry(companyId, transferId, userId);
  }

  private async createTransferJournalEntry(
    companyId: string,
    transferId: string,
    userId: string
  ): Promise<void> {
    try {
      const transfer = await this.getTransfer(companyId, transferId);
      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Only create journal entries for internal transfers
      if (transfer.type !== 'internal' || !transfer.toAccountId) {
        return;
      }

      const sourceAccount = await this.getBankAccount(companyId, transfer.fromAccountId);
      const destAccount = await this.getBankAccount(companyId, transfer.toAccountId);

      if (!sourceAccount || !destAccount) {
        throw new Error('Bank accounts not found');
      }

      const lines: JournalLine[] = [];

      // Credit source account (decrease in cash)
      lines.push({
        id: `${transferId}-source`,
        accountId: sourceAccount.glAccountId,
        accountCode: sourceAccount.accountNumber,
        description: `Transfer to ${destAccount.name}`,
        debit: 0,
        credit: transfer.amount,
        currency: transfer.currency,
        exchangeRate: transfer.exchangeRate
      });

      // Debit destination account (increase in cash)
      const transferAmount = transfer.convertedAmount || transfer.amount;
      lines.push({
        id: `${transferId}-dest`,
        accountId: destAccount.glAccountId,
        accountCode: destAccount.accountNumber,
        description: `Transfer from ${sourceAccount.name}`,
        debit: transferAmount,
        credit: 0,
        currency: destAccount.currency,
        exchangeRate: transfer.exchangeRate ? (1 / transfer.exchangeRate) : undefined
      });

      const journalEntry: JournalEntry = {
        id: `transfer-${transferId}`,
        tenantId: companyId,
        fiscalPeriodId: new Date().getFullYear().toString(), // This should be determined by fiscal calendar
        journalCode: 'XFER',
        reference: transfer.reference || transferId,
        description: `Bank transfer: ${sourceAccount.name} to ${destAccount.name}`,
        status: 'draft',
        source: 'bank_transfer',
        transactionDate: transfer.executedDate || new Date(),
        postingDate: new Date(),
        createdBy: userId,
        metadata: {
          transferId: transfer.id,
          transferType: transfer.type
        },
        lines,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const postingService = new PostingService({ tenantId: companyId });
      const result = await postingService.post(journalEntry);

      // Update transfer with journal entry ID
      const transferRef = doc(db, TRANSFERS_COLLECTION_PATH(companyId), transferId);
      await updateDoc(transferRef, {
        journalEntryId: result.journalEntryId,
        updatedBy: userId,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error creating transfer journal entry:', error);
      // Don't fail the transfer if journal posting fails
      // This could be handled with a retry mechanism
    }
  }

  async getTransfers(
    companyId: string,
    filters?: {
      status?: TransferStatus;
      fromAccountId?: string;
      toAccountId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<BankTransfer[]> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters?.fromAccountId) {
      constraints.push(where('fromAccountId', '==', filters.fromAccountId));
    }

    if (filters?.toAccountId) {
      constraints.push(where('toAccountId', '==', filters.toAccountId));
    }

    const querySnapshot = await getDocs(
      query(collection(db, TRANSFERS_COLLECTION_PATH(companyId)), ...constraints)
    );

    return querySnapshot.docs
      .map((snapshot) => this.transferFromFirestore(snapshot.id, snapshot.data()))
      .filter((transfer) => {
        if (filters?.dateFrom && transfer.createdAt < filters.dateFrom) {
          return false;
        }
        if (filters?.dateTo && transfer.createdAt > filters.dateTo) {
          return false;
        }
        return true;
      });
  }

  async getTransfer(companyId: string, transferId: string): Promise<BankTransfer | null> {
    const documentRef = doc(db, TRANSFERS_COLLECTION_PATH(companyId), transferId);
    const document = await getDoc(documentRef);

    if (!document.exists()) {
      return null;
    }

    return this.transferFromFirestore(document.id, document.data());
  }

  async cancelTransfer(companyId: string, transferId: string, userId: string): Promise<void> {
    const transferRef = doc(db, TRANSFERS_COLLECTION_PATH(companyId), transferId);
    const transfer = await getDoc(transferRef);

    if (!transfer.exists()) {
      throw new Error('Transfer not found');
    }

    const transferData = this.transferFromFirestore(transfer.id, transfer.data());

    if (transferData.status !== 'pending' && transferData.status !== 'approved') {
      throw new Error('Transfer cannot be cancelled in its current status');
    }

    await updateDoc(transferRef, {
      status: 'cancelled',
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });
  }

  // Balance aggregation methods
  async getAccountBalanceSummary(companyId: string, currency?: string): Promise<{
    totalBalance: number;
    totalAvailable: number;
    totalPending: number;
    accountCount: number;
    currency: string;
  }> {
    const accounts = await this.listBankAccounts(companyId, { includeInactive: false });

    let filteredAccounts = accounts;
    if (currency) {
      filteredAccounts = accounts.filter(acc => acc.currency === currency);
    }

    const summary = filteredAccounts.reduce((acc, account) => {
      acc.totalBalance += account.balance.ledger;
      acc.totalAvailable += account.balance.available || account.balance.ledger;
      acc.totalPending += account.balance.pending || 0;
      return acc;
    }, {
      totalBalance: 0,
      totalAvailable: 0,
      totalPending: 0,
      accountCount: filteredAccounts.length,
      currency: currency || 'mixed'
    });

    return summary;
  }
}

export const bankAccountService = new BankAccountService();
