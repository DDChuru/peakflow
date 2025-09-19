import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions, auth, db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import {
  BankStatement,
  ProcessedBankStatement,
  BankTransaction,
  BankStatementSummary,
  BankAccountInfo
} from '@/types/bank-statement';

// Helper function to ensure user is authenticated and ready
async function ensureAuthenticated() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get fresh token to ensure authentication is valid
  const token = await user.getIdToken(true);
  if (!token || token.length < 100) {
    throw new Error('Invalid authentication token');
  }

  return { user, token };
}

// Convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Process bank statement using Firebase Function
export async function processBankStatement(
  pdfFile: File,
  companyId: string,
  companyName: string
): Promise<BankStatement> {
  try {
    // Ensure user is properly authenticated
    console.log('Ensuring user is authenticated...');
    const { user, token } = await ensureAuthenticated();

    console.log('Processing bank statement for user:', user.uid);
    console.log('User email verified:', user.emailVerified);
    console.log('Authentication token length:', token.length);

    // Convert PDF to base64
    const pdfBase64 = await fileToBase64(pdfFile);

    // Call Firebase Function with authentication
    const extractPDF = httpsCallable(functions, 'extractPDFContent');

    console.log('Calling Firebase Function with data:', {
      documentType: 'bankStatement',
      saveToFirestore: true,
      pdfSize: pdfBase64.length,
      userUid: user.uid
    });

    const functionResult = await extractPDF({
      pdfBase64,
      documentType: 'bankStatement',
      saveToFirestore: true
    });

    console.log('Function result:', functionResult);

    // Firebase Functions return data in a .data property
    const result = functionResult.data as ProcessedBankStatement;

    if (!result.success) {
      throw new Error(result.error || 'Failed to process bank statement');
    }

    // Parse and structure the extracted data with proper number parsing
    const parseSafeNumber = (value: any): number => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Parse summary data with safe number conversion
    const summary = result.data.summary || {};
    const parsedSummary: BankStatementSummary = {
      openingBalance: parseSafeNumber(summary.openingBalance),
      closingBalance: parseSafeNumber(summary.closingBalance),
      totalDeposits: parseSafeNumber(summary.totalDeposits),
      totalWithdrawals: parseSafeNumber(summary.totalWithdrawals),
      totalFees: parseSafeNumber(summary.totalFees),
      interestEarned: parseSafeNumber(summary.interestEarned),
      transactionCount: parseInt(summary.transactionCount) || 0,
      statementPeriod: summary.statementPeriod || { from: '', to: '' }
    };

    const bankStatement: BankStatement = {
      companyId,
      companyName,
      uploadedAt: new Date(),
      processedAt: new Date(),
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      status: 'completed',
      accountInfo: result.data.accountInfo || {
        accountNumber: '',
        accountName: '',
        bankName: '',
        accountType: ''
      },
      summary: parsedSummary,
      transactions: processTransactions(result.data.transactions || []),
      extractedData: result.data,
      userId: user.uid
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'bank_statements'), {
      ...bankStatement,
      uploadedAt: Timestamp.fromDate(bankStatement.uploadedAt),
      processedAt: Timestamp.fromDate(bankStatement.processedAt!)
    });

    bankStatement.id = docRef.id;

    // Track usage
    await addDoc(collection(db, 'usage_tracking'), {
      userId: user.uid,
      companyId,
      function: 'processBankStatement',
      fileName: pdfFile.name,
      timestamp: Timestamp.now(),
      success: true
    });

    return bankStatement;

  } catch (error) {
    console.error('Bank statement processing error:', error);

    // Save failed attempt
    const failedStatement: BankStatement = {
      companyId,
      companyName,
      uploadedAt: new Date(),
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      status: 'failed',
      accountInfo: {
        accountNumber: '',
        accountName: '',
        bankName: ''
      },
      summary: {
        openingBalance: 0,
        closingBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalFees: 0,
        interestEarned: 0,
        transactionCount: 0,
        statementPeriod: { from: '', to: '' }
      },
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: auth.currentUser?.uid || ''
    };

    await addDoc(collection(db, 'bank_statements'), {
      ...failedStatement,
      uploadedAt: Timestamp.fromDate(failedStatement.uploadedAt)
    });

    throw error;
  }
}

// Process and categorize transactions
function processTransactions(rawTransactions: any[]): BankTransaction[] {
  const parseSafeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  return rawTransactions.map(tx => {
    const transaction: BankTransaction = {
      date: tx.date || '',
      description: tx.description || '',
      reference: tx.reference,
      debit: parseSafeNumber(tx.debit),
      credit: parseSafeNumber(tx.credit),
      balance: parseSafeNumber(tx.balance)
    };

    // Categorize transaction
    transaction.type = categorizeTransaction(transaction);
    transaction.category = getTransactionCategory(transaction.description);

    return transaction;
  });
}

// Categorize transaction type
function categorizeTransaction(transaction: BankTransaction): BankTransaction['type'] {
  const description = transaction.description.toLowerCase();

  if (description.includes('fee') || description.includes('charge')) {
    return 'fee';
  }
  if (description.includes('interest')) {
    return 'interest';
  }
  if (description.includes('transfer')) {
    return 'transfer';
  }
  if (transaction.credit && transaction.credit > 0) {
    return 'deposit';
  }
  if (transaction.debit && transaction.debit > 0) {
    return 'withdrawal';
  }
  return 'other';
}

// Get transaction category
function getTransactionCategory(description: string): string {
  const desc = description.toLowerCase();

  // Expense categories
  if (desc.includes('salary') || desc.includes('payroll')) return 'Payroll';
  if (desc.includes('rent')) return 'Rent';
  if (desc.includes('utility') || desc.includes('electricity') || desc.includes('water')) return 'Utilities';
  if (desc.includes('insurance')) return 'Insurance';
  if (desc.includes('tax')) return 'Tax';
  if (desc.includes('supplier') || desc.includes('vendor')) return 'Suppliers';
  if (desc.includes('equipment')) return 'Equipment';
  if (desc.includes('marketing') || desc.includes('advertising')) return 'Marketing';

  // Income categories
  if (desc.includes('sales') || desc.includes('revenue')) return 'Sales';
  if (desc.includes('invoice')) return 'Customer Payment';
  if (desc.includes('refund')) return 'Refund';

  // Banking categories
  if (desc.includes('fee') || desc.includes('charge')) return 'Bank Fees';
  if (desc.includes('interest')) return 'Interest';
  if (desc.includes('transfer')) return 'Transfer';

  return 'Other';
}

// Get bank statements for a company
export async function getCompanyBankStatements(
  companyId: string,
  limitCount: number = 10
): Promise<BankStatement[]> {
  try {
    const statementsQuery = query(
      collection(db, 'bank_statements'),
      where('companyId', '==', companyId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(statementsQuery);

    return snapshot.docs.map(doc => {
      const data = doc.data();

      // Ensure summary has safe numbers
      const parseSafeNumber = (value: any): number => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      const summary = data.summary || {};
      const safeStatement: BankStatement = {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        processedAt: data.processedAt?.toDate(),
        summary: {
          openingBalance: parseSafeNumber(summary.openingBalance),
          closingBalance: parseSafeNumber(summary.closingBalance),
          totalDeposits: parseSafeNumber(summary.totalDeposits),
          totalWithdrawals: parseSafeNumber(summary.totalWithdrawals),
          totalFees: parseSafeNumber(summary.totalFees),
          interestEarned: parseSafeNumber(summary.interestEarned),
          transactionCount: parseInt(summary.transactionCount) || 0,
          statementPeriod: summary.statementPeriod || { from: '', to: '' }
        }
      };

      return safeStatement;
    });

  } catch (error) {
    console.error('Error fetching bank statements:', error);
    return [];
  }
}

// Get a specific bank statement
export async function getBankStatement(statementId: string): Promise<BankStatement | null> {
  try {
    const docRef = doc(db, 'bank_statements', statementId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    // Ensure summary has safe numbers
    const parseSafeNumber = (value: any): number => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const summary = data.summary || {};
    const safeStatement: BankStatement = {
      id: docSnap.id,
      ...data,
      uploadedAt: data.uploadedAt?.toDate() || new Date(),
      processedAt: data.processedAt?.toDate(),
      summary: {
        openingBalance: parseSafeNumber(summary.openingBalance),
        closingBalance: parseSafeNumber(summary.closingBalance),
        totalDeposits: parseSafeNumber(summary.totalDeposits),
        totalWithdrawals: parseSafeNumber(summary.totalWithdrawals),
        totalFees: parseSafeNumber(summary.totalFees),
        interestEarned: parseSafeNumber(summary.interestEarned),
        transactionCount: parseInt(summary.transactionCount) || 0,
        statementPeriod: summary.statementPeriod || { from: '', to: '' }
      }
    };

    return safeStatement;

  } catch (error) {
    console.error('Error fetching bank statement:', error);
    return null;
  }
}

// Calculate summary statistics from transactions
export function calculateSummaryStats(transactions: BankTransaction[]): {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  averageBalance: number;
  transactionsByCategory: Record<string, number>;
  transactionsByType: Record<string, number>;
} {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalBalance = 0;
  let validBalanceCount = 0;
  const transactionsByCategory: Record<string, number> = {};
  const transactionsByType: Record<string, number> = {};

  transactions.forEach(tx => {
    // Calculate totals with safe number handling
    const credit = isNaN(tx.credit) ? 0 : tx.credit;
    const debit = isNaN(tx.debit) ? 0 : tx.debit;
    const balance = isNaN(tx.balance) ? 0 : tx.balance;

    if (credit > 0) totalIncome += credit;
    if (debit > 0) totalExpenses += debit;

    if (balance !== 0) {
      totalBalance += balance;
      validBalanceCount++;
    }

    // Group by category
    const category = tx.category || 'Other';
    transactionsByCategory[category] = (transactionsByCategory[category] || 0) + 1;

    // Group by type
    const type = tx.type || 'other';
    transactionsByType[type] = (transactionsByType[type] || 0) + 1;
  });

  // Calculate safe averages
  const averageBalance = validBalanceCount > 0 ? totalBalance / validBalanceCount : 0;
  const netCashFlow = totalIncome - totalExpenses;

  return {
    totalIncome: isNaN(totalIncome) ? 0 : totalIncome,
    totalExpenses: isNaN(totalExpenses) ? 0 : totalExpenses,
    netCashFlow: isNaN(netCashFlow) ? 0 : netCashFlow,
    averageBalance: isNaN(averageBalance) ? 0 : averageBalance,
    transactionsByCategory,
    transactionsByType
  };
}