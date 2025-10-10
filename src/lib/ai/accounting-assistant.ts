import Anthropic from '@anthropic-ai/sdk';
import { BankTransaction } from '@/types/bank-statement';
import { CompanyAccountRecord } from '../accounting/industry-template-service';

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
}

export interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  artifact?: MappingSuggestion;
  thinking?: string;
}

export class AccountingAssistant {
  private conversationHistory: AIAssistantMessage[] = [];

  /**
   * Analyze a transaction and suggest GL account mapping
   */
  async analyzeTransaction(
    transaction: BankTransaction,
    availableAccounts: CompanyAccountRecord[],
    userInput?: string
  ): Promise<{
    message: string;
    suggestion: MappingSuggestion | null;
    needsMoreInfo: boolean;
  }> {
    try {
      // Build the prompt
      const systemPrompt = this.buildSystemPrompt(availableAccounts);
      const userPrompt = this.buildUserPrompt(transaction, userInput);

      console.log('[AI Assistant] Analyzing transaction:', transaction.description);

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

      // Try to extract JSON mapping from response
      const suggestion = this.extractMappingSuggestion(assistantMessage, availableAccounts);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userPrompt
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        artifact: suggestion || undefined
      });

      return {
        message: assistantMessage,
        suggestion,
        needsMoreInfo: !suggestion && assistantMessage.includes('?')
      };

    } catch (error) {
      console.error('[AI Assistant] Error:', error);
      throw error;
    }
  }

  /**
   * Continue conversation with user input
   */
  async chat(
    userMessage: string,
    transaction: BankTransaction,
    availableAccounts: CompanyAccountRecord[]
  ): Promise<AIAssistantMessage> {
    const result = await this.analyzeTransaction(transaction, availableAccounts, userMessage);

    return {
      role: 'assistant',
      content: result.message,
      artifact: result.suggestion || undefined
    };
  }

  /**
   * Build system prompt with accounting knowledge
   */
  private buildSystemPrompt(accounts: CompanyAccountRecord[]): string {
    return `You are an expert South African accountant helping users map bank transactions to GL (General Ledger) accounts.

Your role:
- Analyze bank transactions and suggest correct debit/credit account mappings
- Explain accounting concepts in simple terms
- Teach users WHY mappings are correct (don't just give answers)
- Be conversational and friendly
- Ask clarifying questions if you need more information

Available GL Accounts:
${accounts.map(a => `${a.code} - ${a.name} (${a.type})`).join('\n')}

Accounting Rules:
- When paying expenses: DEBIT expense account, CREDIT cash
- When receiving revenue: DEBIT cash, CREDIT revenue account
- When paying suppliers: DEBIT accounts payable OR expense, CREDIT cash
- When receiving from customers: DEBIT cash, CREDIT accounts receivable OR revenue

When you have enough information to suggest a mapping, respond with a JSON block:

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
  "shouldSaveAsRule": true
}
\`\`\`

If you need more information, ask a clear question.`;
  }

  /**
   * Build user prompt for transaction analysis
   */
  private buildUserPrompt(transaction: BankTransaction, userInput?: string): string {
    const isPayment = transaction.debit && transaction.debit > 0;
    const amount = isPayment ? transaction.debit : transaction.credit;

    let prompt = `Please help me map this bank transaction:

Transaction Details:
- Description: "${transaction.description}"
- Amount: R${amount?.toFixed(2)}
- Type: ${isPayment ? 'Payment (money out)' : 'Receipt (money in)'}
- Date: ${transaction.date}
- Category: ${transaction.category || 'Not specified'}`;

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

      // Find the actual account objects
      const debitAccount = accounts.find(a => a.code === parsed.debitAccount);
      const creditAccount = accounts.find(a => a.code === parsed.creditAccount);

      if (!debitAccount || !creditAccount) {
        console.warn('[AI] Could not find accounts:', parsed.debitAccount, parsed.creditAccount);
        return null;
      }

      return {
        debitAccount: {
          code: debitAccount.code,
          name: debitAccount.name
        },
        creditAccount: {
          code: creditAccount.code,
          name: creditAccount.name
        },
        confidence: parsed.confidence || 70,
        reasoning: parsed.reasoning || [],
        explanation: parsed.explanation || '',
        accountingPrinciple: parsed.accountingPrinciple,
        shouldSaveAsRule: parsed.shouldSaveAsRule !== false
      };

    } catch (error) {
      console.error('[AI] Error parsing suggestion:', error);
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
