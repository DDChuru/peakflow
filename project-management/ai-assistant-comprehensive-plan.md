# AI Accounting Assistant - Comprehensive Agent Plan

## Vision: "Claude for Your Business"
An intelligent AI agent that understands your company context, has access to company data as tools, can take actions, and converses naturally (text → voice) to help manage accounting tasks.

---

## Core Concept: AI Agent with Tools & Context

```typescript
// The AI Assistant is an AGENT with:
1. Company Context (knows which workspace it's in)
2. Data Access Tools (can query debtors, creditors, COA, etc.)
3. Action Tools (can create mappings, update records, etc.)
4. Conversational Interface (text now, voice later)
5. Learning Memory (remembers patterns and preferences)
```

---

## Phase 1: Simple Mapping Assistant (MVP - Week 1)

### User Flow:
```
1. Auto-map attempt runs automatically
   ↓
2a. IF high confidence (>85%): Apply automatically
    → Show: "✅ Mapped: FNB Airtime → Communications Expense"
    → User can undo if wrong

2b. IF low confidence (<85%): Ask user for help
    ↓
3. Conversational Interface appears:

   Assistant: "I'm not sure how to map this transaction. Can you help?

   Transaction: FNB App Prepaid Airtime - R85.00

   Could you describe what this payment is for?"

   User types: "paying for airtime"

   Assistant: "Got it! This is a telecom expense. Here's my suggestion:

   ┌─────────────────────────────────┐
   │ Debit:  5500 - Communications  │
   │ Credit: 1000 - Cash            │
   │                                │
   │ Reasoning:                     │
   │ • Airtime is a telecom service│
   │ • Expenses increase (debit)   │
   │ • Cash decreases (credit)     │
   │                                │
   │ Save as rule for future? ✓    │
   └─────────────────────────────────┘

   [Confirm] [Modify] [Explain More]"
```

### Technical Implementation:
```typescript
interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  artifact?: MappingArtifact; // The suggested mapping widget
}

interface MappingArtifact {
  debitAccount: Account;
  creditAccount: Account;
  reasoning: string[];
  confidence: number;
  saveAsRule: boolean;
}
```

---

## Data Access Tools (Scoped to Company Workspace)

### Tool 1: Query Debtors
```typescript
interface DebtorQueryTool {
  name: 'query_debtors';
  description: 'Search company debtors/customers by name or ID';

  execute(query: string): Promise<Debtor[]>;

  example: {
    query: "Acme Corp",
    result: {
      id: "debtor_123",
      name: "Acme Corporation",
      balance: 15000.00,
      recentInvoices: [...],
      paymentHistory: [...]
    }
  }
}
```

**When useful:**
- Transaction: "Payment from Acme Corp"
- AI queries debtors → Finds customer → Suggests: Debit Cash, Credit AR (Acme)

### Tool 2: Query Creditors
```typescript
interface CreditorQueryTool {
  name: 'query_creditors';
  description: 'Search company creditors/suppliers by name';

  execute(query: string): Promise<Creditor[]>;

  example: {
    query: "Eskom",
    result: {
      id: "creditor_456",
      name: "Eskom Holdings SOC Ltd",
      balance: -2500.00,
      category: "Utilities",
      usualAccount: "5200 - Utilities Expense",
      recentPayments: [...]
    }
  }
}
```

**When useful:**
- Transaction: "Eskom payment R1500"
- AI queries creditors → Finds Eskom → Knows it's utilities → Suggests correct account

### Tool 3: Query Chart of Accounts
```typescript
interface COAQueryTool {
  name: 'query_chart_of_accounts';
  description: 'Search GL accounts by code, name, or category';

  execute(query: string): Promise<Account[]>;

  example: {
    query: "communication",
    result: [
      { code: "5500", name: "Communications Expense", type: "expense" },
      { code: "5510", name: "Telephone & Internet", type: "expense" }
    ]
  }
}
```

### Tool 4: Query Historical Transactions
```typescript
interface TransactionHistoryTool {
  name: 'query_transaction_history';
  description: 'Find similar past transactions and their mappings';

  execute(pattern: string): Promise<MappedTransaction[]>;

  example: {
    query: "FNB Airtime",
    result: [
      {
        description: "FNB App Prepaid Airtime",
        mapping: { debit: "5500", credit: "1000" },
        date: "2024-10-01",
        frequency: 12 // times per year
      }
    ]
  }
}
```

### Tool 5: Query Invoices (Match Payments)
```typescript
interface InvoiceQueryTool {
  name: 'query_invoices';
  description: 'Find unpaid invoices to match against payments';

  execute(filters: {
    customer?: string;
    amount?: number;
    status?: string;
  }): Promise<Invoice[]>;

  example: {
    query: { customer: "Acme Corp", amount: 5000 },
    result: {
      invoice: "INV-2024-001",
      customer: "Acme Corp",
      amount: 5000.00,
      dueDate: "2024-11-30",
      status: "unpaid"
    }
  }
}
```

**When useful:**
- Transaction: "R5000 from Acme Corp"
- AI queries invoices → Finds matching invoice → Suggests: Payment against INV-2024-001

### Tool 6: Query Budget/Expense Categories
```typescript
interface BudgetTool {
  name: 'query_budget';
  description: 'Check budget allocations and spending limits';

  execute(category: string): Promise<BudgetInfo>;

  example: {
    query: "Communications",
    result: {
      budgeted: 2000.00,
      spent: 1750.00,
      remaining: 250.00,
      percentUsed: 87.5,
      alert: "Approaching budget limit"
    }
  }
}
```

**When useful:**
- AI can warn: "⚠️ This R85 airtime purchase will put you at 89% of your communications budget"

---

## Action Tools (What AI Can Do)

### Action 1: Create GL Mapping Rule
```typescript
interface CreateMappingRuleTool {
  name: 'create_mapping_rule';
  description: 'Save a mapping pattern for future auto-matching';

  execute(rule: {
    pattern: string;
    debitAccount: string;
    creditAccount: string;
    confidence: number;
  }): Promise<{ ruleId: string; created: boolean }>;
}
```

### Action 2: Create/Update Creditor
```typescript
interface ManageCreditorTool {
  name: 'create_creditor';
  description: 'Add new supplier when detected in transactions';

  execute(creditor: {
    name: string;
    category: string;
    defaultAccount?: string;
  }): Promise<Creditor>;

  example: {
    input: { name: "Vodacom", category: "Telecommunications" },
    result: {
      id: "creditor_789",
      created: true,
      message: "✅ Added Vodacom to your suppliers"
    }
  }
}
```

**When useful:**
- Transaction: "Vodacom payment"
- AI: "I don't see Vodacom in your suppliers. Should I add them?"
- User: "Yes"
- AI: *Creates creditor* → "Done! Future Vodacom payments will auto-suggest."

### Action 3: Match Payment to Invoice
```typescript
interface MatchPaymentTool {
  name: 'match_payment_to_invoice';
  description: 'Link bank transaction to outstanding invoice';

  execute(payment: {
    transactionId: string;
    invoiceId: string;
  }): Promise<{ matched: boolean; journalEntry: string }>;
}
```

### Action 4: Create Journal Entry
```typescript
interface CreateJournalEntryTool {
  name: 'create_journal_entry';
  description: 'Post the transaction to the general ledger';

  execute(entry: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
    reference: string;
  }): Promise<{ entryId: string; posted: boolean }>;
}
```

### Action 5: Flag for Review
```typescript
interface FlagTransactionTool {
  name: 'flag_transaction';
  description: 'Mark unusual transactions for manual review';

  execute(transaction: {
    id: string;
    reason: string;
    severity: 'info' | 'warning' | 'critical';
  }): Promise<{ flagged: boolean }>;
}
```

**When useful:**
- Large unusual payment
- Duplicate transaction detected
- Budget exceeded
- Potential fraud indicator

---

## Conversational Interface Design

### Chat Component Architecture
```typescript
interface AIAssistantChat {
  // State
  messages: AIAssistantMessage[];
  currentTransaction: BankTransaction | null;
  isThinking: boolean;
  suggestedArtifact: MappingArtifact | null;

  // Methods
  sendMessage(userInput: string): Promise<void>;
  confirmArtifact(): Promise<void>;
  modifyArtifact(): void;
  explainMore(): Promise<void>;
}
```

### UI Components

#### 1. **Chat Panel** (Slide-in from right)
```
┌─────────────────────────────────────────┐
│ 🤖 Accounting Assistant                │
│ ─────────────────────────────────────── │
│                                         │
│ 🤖: I found a transaction I'm not sure │
│     about. Can you help?                │
│                                         │
│     Transaction: FNB Airtime - R85      │
│                                         │
│ 👤: paying for airtime                  │
│                                         │
│ 🤖: Got it! Here's my suggestion:       │
│                                         │
│     ┌─────────────────────────────────┐ │
│     │ 💡 Mapping Suggestion           │ │
│     │                                 │ │
│     │ Debit:  5500 - Communications  │ │
│     │ Credit: 1000 - Cash            │ │
│     │                                 │ │
│     │ • Airtime = telecom expense    │ │
│     │ • Debit increases expense      │ │
│     │ • Credit decreases cash        │ │
│     │                                 │ │
│     │ [✓ Confirm] [Edit] [?]         │ │
│     └─────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ Type your message...              │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### 2. **Artifact Widget** (The suggested mapping)
```typescript
interface MappingArtifactWidget {
  mapping: {
    debit: Account;
    credit: Account;
  };
  reasoning: string[];
  confidence: number;
  actions: {
    confirm: () => void;
    edit: () => void;
    explainMore: () => void;
  };
}
```

---

## Beyond Mapping: Full Application Intelligence

### Scenario 1: Invoice Payment Detection
```
Transaction: "R5000 from Acme Corp"

AI Process:
1. Query debtors → Find "Acme Corp"
2. Query invoices → Find unpaid INV-2024-001 for R5000
3. Suggest:

   "🎯 This looks like a payment from Acme Corp!

   I found an outstanding invoice:
   - Invoice: INV-2024-001
   - Amount: R5,000.00
   - Due: 30 Nov 2024

   Should I:
   1. Match this payment to the invoice
   2. Create journal entry to clear AR
   3. Mark invoice as paid

   [Yes, Do All] [Review First]"
```

### Scenario 2: New Supplier Detection
```
Transaction: "City of Joburg Municipality - R1,200"

AI Process:
1. Query creditors → Not found
2. Detect "Municipality" → Category = Utilities
3. Suggest:

   "🆕 I don't recognize this supplier.

   This appears to be a municipal payment.

   Should I:
   1. Add 'City of Joburg' to your suppliers
   2. Category: Utilities
   3. Map future payments to 5200 - Utilities

   [Yes, Add] [No, One-time]"
```

### Scenario 3: Budget Alert
```
Transaction: "Vodacom - R500"

AI Process:
1. Check budget for Communications
2. Calculate: R1,750 spent + R500 = R2,250 (112% of R2,000 budget)
3. Alert:

   "⚠️ Budget Alert!

   This R500 Vodacom payment will exceed your
   Communications budget by R250.

   Budget: R2,000
   Spent: R1,750 (87.5%)
   This transaction: R500
   New total: R2,250 (112.5%)

   Should I:
   1. Proceed with mapping
   2. Request budget increase
   3. Review other communications expenses

   [Proceed Anyway] [Review Budget]"
```

### Scenario 4: Duplicate Detection
```
Transaction: "Eskom - R1,500"

AI Process:
1. Query history → Found identical payment yesterday
2. Flag:

   "🚨 Possible Duplicate!

   I found an identical payment yesterday:
   - Date: 7 Nov 2024
   - Amount: R1,500
   - Payee: Eskom

   This might be:
   • A duplicate transaction
   • A double payment error
   • Two separate bills

   [Mark as Duplicate] [Different Payment]"
```

### Scenario 5: Reconciliation Assistance
```
User: "Help me reconcile my bank account"

AI:
"I'll help you reconcile! Let me check:

✅ Bank statement balance: R45,231.89
✅ Ledger balance: R45,231.89

Status: Perfectly matched! 🎉

Details:
- Transactions processed: 127
- Auto-matched: 98 (77%)
- Manually mapped: 29 (23%)
- Outstanding: 0

[View Report] [Export PDF]"
```

---

## Voice Integration (Phase 2)

### Text-to-Speech (AI Speaks)
```typescript
interface VoiceOutput {
  speak(text: string, options?: {
    language: 'en-ZA' | 'af-ZA';
    speed: number;
  }): Promise<void>;
}

// Usage:
AI: "This is a telecommunications expense..."
Voice: 🔊 Reads explanation aloud
```

### Speech-to-Text (User Speaks)
```typescript
interface VoiceInput {
  listen(): Promise<string>;

  // User clicks mic button
  // Speaks: "This is for airtime"
  // Returns: "this is for airtime"
}
```

### Voice Commands
```
👤: "Map this to communications"
→ AI applies mapping

👤: "Show me all Eskom payments this month"
→ AI queries and displays

👤: "What's my communications budget?"
→ AI checks and responds

👤: "Add Vodacom as a supplier"
→ AI creates creditor
```

---

## Implementation Phases

### Phase 1: MVP - Conversational Mapping (Week 1)
- ✅ Text-based chat interface
- ✅ Basic tools (COA, History, Creditors)
- ✅ Mapping artifact widget
- ✅ Confirm/Edit/Explain actions
- ✅ Save as rule

### Phase 2: Enhanced Intelligence (Week 2)
- Query debtors
- Query invoices
- Match payments to invoices
- Budget checking
- Duplicate detection

### Phase 3: Proactive Actions (Week 3)
- Create creditors automatically
- Post journal entries
- Send notifications
- Generate reports

### Phase 4: Voice Integration (Week 4)
- Speech-to-text input
- Text-to-speech output
- Voice commands
- Multi-language support

---

## Technical Stack

### AI Service
```typescript
// Primary: Anthropic Claude API
import Anthropic from '@anthropic-ai/sdk';

// Tools definition for Claude
const tools = [
  {
    name: "query_creditors",
    description: "Search company creditors/suppliers",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" }
      }
    }
  },
  // ... more tools
];

// Tool execution
async function executeTool(toolName: string, toolInput: any) {
  switch(toolName) {
    case 'query_creditors':
      return await creditorsService.search(toolInput.query);
    // ... more cases
  }
}
```

### Chat Component
```typescript
// Location: /src/components/ai/AIAssistantChat.tsx
export function AIAssistantChat({
  companyId,
  transaction
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifact, setArtifact] = useState<Artifact | null>(null);

  const handleSendMessage = async (text: string) => {
    // Send to AI with company context + tools
    const response = await aiService.chat({
      companyId,
      transaction,
      userMessage: text,
      availableTools: ALL_TOOLS
    });

    setMessages([...messages, response]);
    if (response.artifact) setArtifact(response.artifact);
  };
}
```

---

## Company Scoping Strategy

### Workspace Context
```typescript
interface CompanyWorkspaceContext {
  companyId: string;
  companyName: string;
  industry: string;
  chartOfAccounts: Account[];
  recentTransactions: Transaction[];

  // Tools are automatically scoped
  tools: {
    debtors: DebtorService(companyId),
    creditors: CreditorService(companyId),
    invoices: InvoiceService(companyId),
    // ...
  };
}

// AI always knows which company it's working with
AI Prompt:
"You are an accounting assistant for [Company Name],
a [Industry] business. You have access to their
debtors, creditors, and chart of accounts.

Current transaction: [details]

Available tools: [list of tools]

Help the user map this transaction correctly."
```

---

## Success Metrics

### Accuracy
- ✅ 90%+ correct mapping suggestions
- ✅ < 5% mappings require modification

### Efficiency
- ✅ 50% reduction in manual mapping time
- ✅ < 3 seconds per AI response
- ✅ 80%+ auto-match rate (up from current 0%)

### User Satisfaction
- ✅ Users understand WHY mappings are correct
- ✅ Confidence in using accounting features increases
- ✅ Fewer support requests

---

## Next Steps - RIGHT NOW

1. **Get API Key** ✅ (you're providing)
2. **Build Core AI Service** (30 mins)
3. **Implement Chat UI** (45 mins)
4. **Add First 3 Tools** (30 mins)
   - query_chart_of_accounts
   - query_creditors
   - query_transaction_history
5. **Test with FNB Airtime** (15 mins)

**Total: ~2 hours to MVP**

---

## The Dream State

```
User clicks transaction: "FNB Airtime R85"

AI (automatically):
1. Queries history → Finds 45 similar transactions
2. Queries COA → Knows Communications account exists
3. Checks confidence → 95%

Auto-applies mapping ✅

User sees:
"✅ Mapped: FNB Airtime → Communications
(Based on 45 similar transactions)
[Undo] [Save as rule ✓]"

---

For unknown transaction:

AI: "👋 I need your help with this one.
     Can you tell me what this payment is for?"

User: "supplier payment"

AI: "Got it! Which supplier?"

User: "Eskom"

AI: "Perfect! Eskom is already in your suppliers.
     This is a utilities expense.

     [Shows mapping artifact]

     Should I add them to auto-match next time?"

User: "Yes"

AI: "✅ Done! Future Eskom payments will
     auto-map to Utilities."
```

**Ready to build? Let's start! 🚀**
