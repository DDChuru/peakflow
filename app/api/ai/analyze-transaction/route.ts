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
      userMessage
    }: {
      transaction: BankTransaction;
      availableAccounts: CompanyAccountRecord[];
      userMessage?: string;
    } = body;

    // Validate inputs
    if (!transaction || !availableAccounts || availableAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Analyze transaction
    const result = await assistant.analyzeTransaction(
      transaction,
      availableAccounts,
      userMessage
    );

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[AI API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze transaction',
        details: error?.message || 'Unknown error',
        fallback: true
      },
      { status: 500 }
    );
  }
}
