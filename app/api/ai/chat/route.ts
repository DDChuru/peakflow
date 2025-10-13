import { NextRequest, NextResponse } from 'next/server';
import { accountingAssistant } from '@/lib/ai/accounting-assistant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, userMessage, accounts, debtors, creditors, conversationHistory } = body;

    if (!companyId || !userMessage) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No Chart of Accounts available. Please set up your chart of accounts first.'
        },
        { status: 400 }
      );
    }

    // Call AI assistant with all company data from client
    const result = await accountingAssistant.chatWithAssistant(
      companyId,
      userMessage,
      accounts,
      debtors || [],
      creditors || [],
      conversationHistory || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] AI chat error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to process AI request'
      },
      { status: 500 }
    );
  }
}
