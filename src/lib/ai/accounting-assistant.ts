import Anthropic from '@anthropic-ai/sdk';
import { BankTransaction } from '@/types/bank-statement';
import { CompanyAccountRecord } from '../accounting/industry-template-service';
import { DebtorMatchingService } from './debtor-matching-service';
import { CreditorMatchingService } from './creditor-matching-service';
import type { DebtorMatch, CreditorMatch } from '@/types/ai/entity-matching';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface MappingSuggestion {
  debitAccount: {
    code: string;
    name: string;
  };
  creditAccount: {
    code: string;
    name: string;
  };
  confidence: number; // 0-100
  reasoning: string[];
  explanation: string;
  accountingPrinciple?: string;
  shouldSaveAsRule: boolean;
  alternatives?: Array<{
    debitAccount: { code: string; name: string };
    creditAccount: { code: string; name: string };
    confidence: number;
    reasoning: string;
  }>;
  // Entity matching results (Phase 1-2 integration)
  entityMatch?: {
    type: 'debtor' | 'creditor';
    entityId: string;
    entityName: string;
    confidence: number;
    matchMethod: string;
    suggestedDocument?: {
      id: string;
      number: string;
      amount: number;
      confidence: number;
    };
    outstandingBalance?: number;
  };
}

export interface AccountCreationSuggestion {
  needed: boolean;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
  category?: string;
  normalBalance: 'debit' | 'credit';
  reasoning: string;
  parentAccountCode?: string;
}

export interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  artifact?: MappingSuggestion;
  createAccount?: AccountCreationSuggestion;
  thinking?: string;
}

export class AccountingAssistant {
  private conversationHistory: AIAssistantMessage[] = [];
  private debtorMatcher: DebtorMatchingService;
  private creditorMatcher: CreditorMatchingService;

  constructor() {
    this.debtorMatcher = new DebtorMatchingService();
    this.creditorMatcher = new CreditorMatchingService();
  }

  /**
   * Analyze a transaction and suggest GL account mapping
   * Now enhanced with fuzzy entity matching for customers/suppliers!
   */
  async analyzeTransaction(
    transaction: BankTransaction,
    availableAccounts: CompanyAccountRecord[],
    companyId: string,
    userInput?: string
  ): Promise<{
    message: string;
    suggestion: MappingSuggestion | null;
    createAccount: AccountCreationSuggestion | null;
    needsMoreInfo: boolean;
  }> {
    try {
      console.log('[AI Assistant] Analyzing transaction:', transaction.description);

      // STEP 1: Perform fuzzy entity matching FIRST (Phase 1-2 integration!)
      const isPayment = transaction.debit && transaction.debit > 0;
      const amount = Math.abs(isPayment ? (transaction.debit || 0) : (transaction.credit || 0));
      const transactionDate = transaction.date ? new Date(transaction.date) : new Date();

      let entityMatch: DebtorMatch | CreditorMatch | null = null;
      let entityType: 'debtor' | 'creditor' | null = null;

      console.log('[AI Assistant] Running fuzzy entity matching...');
      console.log(`  Transaction type: ${isPayment ? 'Payment OUT' : 'Receipt IN'}`);
      console.log(`  Amount: R${amount.toFixed(2)}`);

      // Try debtor matching for receipts (money in = customer payment)
      if (!isPayment && amount > 0) {
        console.log('[AI Assistant] Checking for customer match (receipt)...');
        try {
          const debtorMatch = await this.debtorMatcher.findMatchingDebtor(
            companyId,
            transaction.description,
            amount,
            transactionDate
          );

          if (debtorMatch && debtorMatch.confidence >= 60) {
            entityMatch = debtorMatch;
            entityType = 'debtor';
            console.log(`[AI Assistant] ✅ Customer matched: ${debtorMatch.debtor.name} (${debtorMatch.confidence}% confidence)`);
            if (debtorMatch.suggestedInvoice) {
              console.log(`  Suggested Invoice: ${debtorMatch.suggestedInvoice.invoice.invoiceNumber}`);
            }
          } else {
            console.log('[AI Assistant] No customer match found or confidence too low');
          }
        } catch (error) {
          console.error('[AI Assistant] Error matching debtor:', error);
        }
      }

      // Try creditor matching for payments (money out = supplier payment)
      if (isPayment && amount > 0 && !entityMatch) {
        console.log('[AI Assistant] Checking for supplier match (payment)...');
        try {
          const creditorMatch = await this.creditorMatcher.findMatchingCreditor(
            companyId,
            transaction.description,
            amount,
            transactionDate
          );

          if (creditorMatch && creditorMatch.confidence >= 60) {
            entityMatch = creditorMatch;
            entityType = 'creditor';
            console.log(`[AI Assistant] ✅ Supplier matched: ${creditorMatch.creditor.name} (${creditorMatch.confidence}% confidence)`);
            if (creditorMatch.creditor.creditorType) {
              console.log(`  Creditor Type: ${creditorMatch.creditor.creditorType}`);
            }
          } else {
            console.log('[AI Assistant] No supplier match found or confidence too low');
          }
        } catch (error) {
          console.error('[AI Assistant] Error matching creditor:', error);
        }
      }

      // STEP 2: Build enhanced prompt with entity context
      const systemPrompt = this.buildSystemPrompt(availableAccounts);
      const userPrompt = this.buildUserPrompt(transaction, entityMatch, entityType, userInput);

      console.log('[AI Assistant] Calling Claude with entity-enhanced prompt...');

      // Get model from environment or default to Sonnet 4.5
      const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
      console.log('[AI Assistant] Using model:', model);

      // Call Claude with configured model
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          ...this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      // Parse response
      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      console.log('[AI Assistant] Response:', assistantMessage);

      // Try to extract JSON mapping and account creation from response
      const suggestion = this.extractMappingSuggestion(assistantMessage, availableAccounts);
      const createAccount = this.extractAccountCreation(assistantMessage);

      // STEP 3: Attach entity match info to suggestion
      if (suggestion && entityMatch) {
        if (entityType === 'debtor') {
          const debtorMatch = entityMatch as DebtorMatch;
          suggestion.entityMatch = {
            type: 'debtor',
            entityId: debtorMatch.debtor.id,
            entityName: debtorMatch.debtor.name,
            confidence: debtorMatch.confidence,
            matchMethod: debtorMatch.matchMethod,
            outstandingBalance: debtorMatch.outstandingBalance,
            suggestedDocument: debtorMatch.suggestedInvoice ? {
              id: debtorMatch.suggestedInvoice.invoice.id,
              number: debtorMatch.suggestedInvoice.invoice.invoiceNumber || '',
              amount: debtorMatch.suggestedInvoice.invoice.amountDue || 0,
              confidence: debtorMatch.suggestedInvoice.confidence,
            } : undefined,
          };
          console.log('[AI Assistant] ✅ Attached customer match to suggestion');
        } else if (entityType === 'creditor') {
          const creditorMatch = entityMatch as CreditorMatch;
          suggestion.entityMatch = {
            type: 'creditor',
            entityId: creditorMatch.creditor.id,
            entityName: creditorMatch.creditor.name,
            confidence: creditorMatch.confidence,
            matchMethod: creditorMatch.matchMethod,
            outstandingBalance: creditorMatch.outstandingBalance,
            suggestedDocument: creditorMatch.suggestedBill ? {
              id: creditorMatch.suggestedBill.bill.id,
              number: creditorMatch.suggestedBill.bill.billNumber || '',
              amount: creditorMatch.suggestedBill.bill.amountDue || 0,
              confidence: creditorMatch.suggestedBill.confidence,
            } : undefined,
          };
          console.log('[AI Assistant] ✅ Attached supplier match to suggestion');
        }
      }

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userPrompt
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        artifact: suggestion || undefined,
        createAccount: createAccount || undefined
      });

      return {
        message: assistantMessage,
        suggestion,
        createAccount,
        needsMoreInfo: !suggestion && !createAccount && assistantMessage.includes('?')
      };

    } catch (error: any) {
      console.error('[AI Assistant] Error:', error);

      // Return graceful error message instead of throwing
      return {
        message: `I encountered an error analyzing this transaction. ${error?.message || 'Please try again or map this transaction manually.'}`,
        suggestion: null,
        createAccount: null,
        needsMoreInfo: false
      };
    }
  }

  /**
   * Continue conversation with user input
   */
  async chat(
    userMessage: string,
    transaction: BankTransaction,
    availableAccounts: CompanyAccountRecord[],
    companyId: string
  ): Promise<AIAssistantMessage> {
    const result = await this.analyzeTransaction(transaction, availableAccounts, companyId, userMessage);

    return {
      role: 'assistant',
      content: result.message,
      artifact: result.suggestion || undefined
    };
  }

  /**
   * General chat with AI assistant (not tied to transaction mapping)
   * Has access to all tools: entity matching, account queries, accounting guidance
   */
  async chatWithAssistant(
    companyId: string,
    userMessage: string,
    availableAccounts: CompanyAccountRecord[],
    debtors: any[],
    creditors: any[],
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{
    success: boolean;
    response?: string;
    message?: string;
  }> {
    try {
      console.log('[AI Assistant] General chat:', userMessage);
      console.log('[AI Assistant] Context:', {
        accounts: availableAccounts.length,
        debtors: debtors.length,
        creditors: creditors.length
      });

      // Build system prompt for general chat with full data
      const systemPrompt = this.buildGeneralChatSystemPrompt(availableAccounts, debtors, creditors);

      // Get model from environment or default to Sonnet 4.5
      const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
      console.log('[AI Assistant] Using model:', model);

      // Call Claude with conversation history
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      // Parse response
      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      console.log('[AI Assistant] Response:', assistantMessage);

      return {
        success: true,
        response: assistantMessage
      };

    } catch (error: any) {
      console.error('[AI Assistant] Chat error:', error);

      // Provide specific error messages
      if (error?.status === 401) {
        return {
          success: false,
          message: 'AI Assistant not configured. Please contact your administrator to set up the Anthropic API key.'
        };
      }

      if (error?.status === 429) {
        return {
          success: false,
          message: 'AI Assistant is currently busy. Please try again in a moment.'
        };
      }

      return {
        success: false,
        message: error?.message || 'Failed to get AI response. Please try again.'
      };
    }
  }

  /**
   * Build system prompt for general chat
   */
  private buildGeneralChatSystemPrompt(accounts: CompanyAccountRecord[], debtors: any[], creditors: any[]): string {
    return `You are an expert South African accountant and AI assistant with FULL ACCESS to company financial data.

## YOUR CAPABILITIES IN THIS CHAT:
✅ **Chart of Accounts** - Full access to all GL accounts, can explain account usage and suggest new accounts
✅ **Debtors (Customers)** - Can search ${debtors.length} customers, show outstanding balances, find specific debtors
✅ **Creditors (Suppliers)** - Can search ${creditors.length} suppliers, show outstanding balances, find specific creditors
✅ **Accounting Knowledge** - Can explain accounting principles, IFRS, SA GAAP, and tax regulations
✅ **Accounting Tutor** - Can teach accounting concepts in simple, practical terms
✅ **GL Account Recommendations** - Can suggest appropriate accounts for different transaction types

## IMPORTANT: USE EXACT NAMES
When searching for and reporting about customers/suppliers:
- Use the EXACT name from the database
- Do NOT abbreviate or paraphrase (e.g., don't say "Smart Care" if database has "Smart Care Services")
- Show the exact data you find

## What You Can Do:
- "Show me all suppliers" → List creditors with details
- "Find customer [name]" → Search debtors, show outstanding balance
- "What GL account for utilities?" → Suggest from Chart of Accounts
- "Explain [accounting concept]" → Teach the principle
- "Show expense accounts" → Filter and list accounts

## Your Role:
- Search through debtors/creditors when asked
- Report findings accurately with exact names
- Explain accounting concepts in simple South African terms
- Provide GL account recommendations
- Be helpful, accurate, and transparent

## Available Data:

### GL Accounts (${accounts.length}):
${accounts.map(a => `${a.code} - ${a.name} (${a.type})`).join('\n')}

### Debtors/Customers (${debtors.length}):
${debtors.length > 0 ? debtors.map(d => `- ${d.name}${d.outstandingBalance ? ` (Outstanding: R${d.outstandingBalance.toFixed(2)})` : ''}`).join('\n') : '(No customers in system yet)'}

### Creditors/Suppliers (${creditors.length}):
${creditors.length > 0 ? creditors.map(c => `- ${c.name}${c.outstandingBalance ? ` (Outstanding: R${c.outstandingBalance.toFixed(2)})` : ''}`).join('\n') : '(No suppliers in system yet)'}

## Example Queries You Can Handle:
- "Find customer [name]" → Search debtors ledger with fuzzy matching
- "Show supplier [name]" → Search creditors ledger with fuzzy matching
- "What's account 1200?" → Explain AR account
- "Explain double-entry" → Teach accounting concept
- "What GL account for utilities?" → Suggest expense accounts
- "Find invoice INV-2025-034" → Look up invoice (if asked, tell user you need transaction data)
- "Outstanding balances summary" → Describe how to view in the system
- "How do I record VAT?" → Teach VAT accounting in SA

## Response Style:
- Be concise but thorough
- Use bullet points for lists
- Include emojis for clarity (✅ ❌ 💡 🎯 etc.)
- Explain technical terms in simple language
- When you don't have specific data, admit it and guide the user to where they can find it

## IMPORTANT:
- Use EXACT entity names from database - NEVER paraphrase or abbreviate
- Be transparent about what data you have access to
- If you don't have specific information, say so clearly
- Always be helpful and educational`;
  }

  /**
   * Build system prompt with accounting knowledge
   */
  private buildSystemPrompt(accounts: CompanyAccountRecord[]): string {
    return `You are an expert South African accountant with AGENTIC CAPABILITIES helping users map bank transactions to GL (General Ledger) accounts.

## YOUR CAPABILITIES (Be Transparent About These!):
✅ **Entity Matching**: I have ALREADY searched your debtors and creditors ledgers using fuzzy matching
✅ **Invoice Lookup**: I have ALREADY searched for matching outstanding invoices/bills
✅ **Data Access**: I have REAL access to your financial data - not just asking hypothetical questions
✅ **Confidence Scoring**: I calculate match confidence based on fuzzy text matching + amount matching

## Your Role:
- Analyze bank transactions and suggest correct debit/credit account mappings
- When I find entity matches (customers/suppliers), TELL THE USER ABOUT THEM IMMEDIATELY
- Be confident and proactive - you have real data, not guesses
- Explain accounting concepts in simple terms
- Teach users WHY mappings are correct (don't just give answers)
- When NO suitable account exists, SUGGEST creating a new account
- Be conversational and friendly

## IMPORTANT: When you receive entity match context (customer/supplier detected):
- **USE EXACT NAMES**: When I provide "Customer Name: Advanced Cleaning Services", you MUST say "Advanced Cleaning Services" - NOT "Advanced Cleaning Ops" or any abbreviation
- **SAY WHAT YOU FOUND**: "I found a customer match: [EXACT Name from database] with [X]% confidence"
- **SHOW THE DATA**: "They have R[amount] outstanding across [N] invoices"
- **BE SPECIFIC**: "The best matching invoice is [INV-XXX] for R[amount]"
- **DON'T SAY**: "I don't have access to debtors" (YOU DO! The match was already done!)
- **DON'T PARAPHRASE**: NEVER change, shorten, or abbreviate entity names - use them EXACTLY as provided

Available GL Accounts:
${accounts.map(a => `${a.code} - ${a.name} (${a.type})`).join('\n')}

Accounting Rules:
- When paying expenses: DEBIT expense account, CREDIT cash
- When receiving revenue: DEBIT cash, CREDIT revenue account
- When paying suppliers: DEBIT accounts payable OR expense, CREDIT cash
- When receiving from customers: DEBIT cash, CREDIT accounts receivable OR revenue

## Response Formats:

### When a suitable account EXISTS:
\`\`\`json
{
  "debitAccount": "5500",
  "creditAccount": "1000",
  "confidence": 90,
  "reasoning": [
    "Airtime is a telecommunications expense",
    "FNB indicates a bank payment",
    "Expenses increase with debits"
  ],
  "explanation": "This is a mobile airtime purchase, which is a business communication expense. When you pay for expenses, you debit the expense account (increases expense) and credit cash (decreases cash).",
  "accountingPrinciple": "Expense Recognition - Record expenses when incurred",
  "shouldSaveAsRule": true,
  "alternatives": [
    {
      "debitAccount": "5510",
      "creditAccount": "1000",
      "confidence": 75,
      "reasoning": "Could also be classified as General Telephone expense"
    }
  ]
}
\`\`\`

### When NO suitable account exists (SUGGEST CREATION):
\`\`\`json
{
  "createAccount": {
    "needed": true,
    "code": "6150",
    "name": "Marketing Software & Tools",
    "type": "expense",
    "category": "Marketing",
    "normalBalance": "debit",
    "reasoning": "MailChimp is an email marketing platform. This subscription should be tracked separately from general software expenses for better marketing ROI analysis."
  },
  "mapping": {
    "debitAccount": "6150",
    "creditAccount": "1000",
    "confidence": 92,
    "reasoning": [
      "MailChimp is a marketing automation tool",
      "Monthly subscription for business use",
      "Should be tracked under marketing expenses"
    ],
    "explanation": "This is a monthly MailChimp subscription for email marketing. Since there's no specific marketing software account, I'm suggesting we create one. This will help track marketing tool costs separately.",
    "shouldSaveAsRule": true
  }
}
\`\`\`

### When MULTIPLE scenarios are possible:
Show all alternatives with confidence scores and let the user choose.

If you need more information, ask a clear question.`;
  }

  /**
   * Build user prompt for transaction analysis
   * NOW ENHANCED with fuzzy entity matching context!
   */
  private buildUserPrompt(
    transaction: BankTransaction,
    entityMatch: DebtorMatch | CreditorMatch | null,
    entityType: 'debtor' | 'creditor' | null,
    userInput?: string
  ): string {
    const isPayment = transaction.debit && transaction.debit > 0;
    const amount = isPayment ? transaction.debit : transaction.credit;

    let prompt = `Please help me map this bank transaction:

Transaction Details:
- Description: "${transaction.description}"
- Amount: R${amount?.toFixed(2)}
- Type: ${isPayment ? 'Payment (money out)' : 'Receipt (money in)'}
- Date: ${transaction.date}
- Category: ${transaction.category || 'Not specified'}`;

    // ADD ENTITY CONTEXT (Phase 1-2 integration!)
    if (entityMatch && entityType === 'debtor') {
      const debtorMatch = entityMatch as DebtorMatch;
      prompt += `

🎯 CUSTOMER DETECTED (Fuzzy Match):
- Customer Name: "${debtorMatch.debtor.name}"
- Match Confidence: ${debtorMatch.confidence}% (${debtorMatch.matchMethod} match on ${debtorMatch.matchedField})
- Outstanding Balance: R${debtorMatch.outstandingBalance.toFixed(2)}
- Outstanding Invoices: ${debtorMatch.outstandingInvoices.length}`;

      if (debtorMatch.suggestedInvoice) {
        prompt += `
- 💡 SUGGESTED INVOICE: ${debtorMatch.suggestedInvoice.invoice.invoiceNumber} (R${debtorMatch.suggestedInvoice.invoice.amountDue?.toFixed(2)})
  Reasons: ${debtorMatch.suggestedInvoice.matchReasons.join(', ')}`;
      }

      prompt += `

⚠️ IMPORTANT: This is a CUSTOMER PAYMENT (receipt).
Use ACCOUNTS RECEIVABLE (not revenue) as the credit account.
This payment reduces what the customer owes us.`;
    } else if (entityMatch && entityType === 'creditor') {
      const creditorMatch = entityMatch as CreditorMatch;
      prompt += `

🎯 SUPPLIER DETECTED (Fuzzy Match):
- Supplier Name: "${creditorMatch.creditor.name}"
- Match Confidence: ${creditorMatch.confidence}% (${creditorMatch.matchMethod} match on ${creditorMatch.matchedField})`;

      if (creditorMatch.creditor.creditorType) {
        prompt += `
- Creditor Type: ${creditorMatch.creditor.creditorType}`;

        // Add specific guidance based on creditor type
        if (creditorMatch.creditor.creditorType === 'tax-authority') {
          prompt += ` (e.g., SARS - use tax liability accounts)`;
        } else if (creditorMatch.creditor.creditorType === 'utility') {
          prompt += ` (e.g., Eskom - use utilities expense)`;
        } else if (creditorMatch.creditor.creditorType === 'statutory') {
          prompt += ` (e.g., UIF - use statutory expense/liability accounts)`;
        }
      }

      prompt += `
- Outstanding Balance: R${creditorMatch.outstandingBalance.toFixed(2)}
- Outstanding Bills: ${creditorMatch.outstandingBills.length}`;

      if (creditorMatch.suggestedBill) {
        prompt += `
- 💡 SUGGESTED BILL: ${creditorMatch.suggestedBill.bill.billNumber} (R${creditorMatch.suggestedBill.bill.amountDue?.toFixed(2)})
  Reasons: ${creditorMatch.suggestedBill.matchReasons.join(', ')}`;
      }

      prompt += `

⚠️ IMPORTANT: This is a SUPPLIER PAYMENT.
Use ACCOUNTS PAYABLE or appropriate EXPENSE account as the debit.
This payment reduces what we owe the supplier.`;
    }

    if (userInput) {
      prompt += `\n\nUser explanation: "${userInput}"`;
    } else {
      prompt += `\n\nCan you suggest the correct GL account mapping for this transaction?`;
    }

    return prompt;
  }

  /**
   * Extract mapping suggestion from AI response
   */
  private extractMappingSuggestion(
    response: string,
    accounts: CompanyAccountRecord[]
  ): MappingSuggestion | null {
    try {
      // Look for JSON code block
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[1]);

      // Handle case where response includes createAccount wrapper
      const mapping = parsed.mapping || parsed;

      // If account creation is suggested, the accounts won't exist yet
      // So we'll allow missing accounts and use the codes directly
      const debitCode = mapping.debitAccount;
      const creditCode = mapping.creditAccount;

      if (!debitCode || !creditCode) {
        console.warn('[AI] Missing account codes in suggestion');
        return null;
      }

      // Try to find existing accounts, or use suggested names
      const debitAccount = accounts.find(a => a.code === debitCode);
      const creditAccount = accounts.find(a => a.code === creditCode);

      return {
        debitAccount: {
          code: debitCode,
          name: debitAccount?.name || mapping.debitAccountName || debitCode
        },
        creditAccount: {
          code: creditCode,
          name: creditAccount?.name || mapping.creditAccountName || creditCode
        },
        confidence: mapping.confidence || 70,
        reasoning: mapping.reasoning || [],
        explanation: mapping.explanation || '',
        accountingPrinciple: mapping.accountingPrinciple,
        shouldSaveAsRule: mapping.shouldSaveAsRule !== false,
        alternatives: mapping.alternatives?.map((alt: any) => ({
          debitAccount: {
            code: alt.debitAccount,
            name: accounts.find(a => a.code === alt.debitAccount)?.name || alt.debitAccount
          },
          creditAccount: {
            code: alt.creditAccount,
            name: accounts.find(a => a.code === alt.creditAccount)?.name || alt.creditAccount
          },
          confidence: alt.confidence || 70,
          reasoning: alt.reasoning || ''
        }))
      };

    } catch (error) {
      console.error('[AI] Error parsing suggestion:', error);
      return null;
    }
  }

  /**
   * Extract account creation suggestion from AI response
   */
  private extractAccountCreation(response: string): AccountCreationSuggestion | null {
    try {
      // Look for createAccount JSON block
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[1]);

      // Check if response includes createAccount
      if (!parsed.createAccount || !parsed.createAccount.needed) {
        return null;
      }

      const account = parsed.createAccount;

      return {
        needed: true,
        code: account.code,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        category: account.category,
        normalBalance: account.normalBalance,
        reasoning: account.reasoning,
        parentAccountCode: account.parentAccountCode
      };

    } catch (error) {
      console.error('[AI] Error parsing account creation:', error);
      return null;
    }
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): AIAssistantMessage[] {
    return this.conversationHistory;
  }
}

// Singleton instance
export const accountingAssistant = new AccountingAssistant();
