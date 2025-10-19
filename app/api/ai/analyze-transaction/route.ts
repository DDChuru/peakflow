import { NextRequest, NextResponse } from 'next/server';
import { AccountingAssistant } from '@/lib/ai/accounting-assistant';
import { BankTransaction } from '@/types/bank-statement';
import { CompanyAccountRecord } from '@/lib/accounting/industry-template-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction,
      availableAccounts,
      companyId,
      userMessage
    }: {
      transaction: BankTransaction;
      availableAccounts: CompanyAccountRecord[];
      companyId: string;
      userMessage?: string;
    } = body;

    // Validate inputs
    if (!transaction || !availableAccounts || availableAccounts.length === 0 || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields (transaction, availableAccounts, companyId)' },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI Assistant not configured',
          fallback: true,
          message: 'Anthropic API key not found. Please configure ANTHROPIC_API_KEY in environment variables.'
        },
        { status: 503 }
      );
    }

    // Create assistant instance
    const assistant = new AccountingAssistant();

    console.log('[AI API] Analyzing transaction with entity matching enabled');
    console.log(`  CompanyId: ${companyId}`);
    console.log(`  Transaction: ${transaction.description}`);

    // Analyze transaction (now with fuzzy entity matching!)
    const result = await assistant.analyzeTransaction(
      transaction,
      availableAccounts,
      companyId,
      userMessage
    );

    // Log entity match if found
    if (result.suggestion?.entityMatch) {
      console.log(`[AI API] ✅ Entity matched: ${result.suggestion.entityMatch.entityName} (${result.suggestion.entityMatch.type})`);
      console.log(`  Confidence: ${result.suggestion.entityMatch.confidence}%`);
      if (result.suggestion.entityMatch.suggestedDocument) {
        console.log(`  Suggested Document: ${result.suggestion.entityMatch.suggestedDocument.number}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      suggestion: result.suggestion, // Now includes entityMatch!
      createAccount: result.createAccount,
      needsMoreInfo: result.needsMoreInfo,
      // Phase 4: Advanced suggestions
      multiInvoiceSuggestions: result.multiInvoiceSuggestions,
      partialPaymentSuggestions: result.partialPaymentSuggestions
    });

  } catch (error: any) {
    console.error('[AI API] Error:', error);
    console.error('[AI API] Error stack:', error?.stack);

    // Return a user-friendly error message with fallback flag
    return NextResponse.json(
      {
        success: false,
        error: 'AI analysis failed',
        message: 'I encountered an error analyzing this transaction. You can map it manually or try again.',
        details: error?.message || 'Unknown error',
        fallback: true,
        suggestion: null,
        createAccount: null,
        needsMoreInfo: false
      },
      { status: 200 } // Return 200 with error flag instead of 500
    );
  }
}
