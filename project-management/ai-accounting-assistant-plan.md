# AI Accounting Assistant - Implementation Plan

## Vision
Transform the bank-to-ledger import from a manual mapping tool into an intelligent assistant that **teaches users accounting** while helping them map transactions correctly.

## User Story
**As a** business owner with basic accounting knowledge
**I want** the system to suggest GL account mappings with explanations
**So that** I can learn proper accounting while processing transactions confidently

---

## Quick Win Architecture (2-3 hours)

### Phase 1: Smart Analysis (Core Feature)
**File**: `/src/lib/accounting/ai-accounting-assistant.ts`

```typescript
interface TransactionAnalysis {
  suggestedMapping: {
    debitAccount: CompanyAccountRecord;
    creditAccount: CompanyAccountRecord;
    confidence: number; // 0-100
  };
  explanation: string;  // Natural language explanation
  reasoning: string[];  // Bullet points of WHY
  accountingPrinciple?: string;  // e.g., "Expense Recognition"
  warnings: string[];   // Potential issues
  similarCount: number; // Historical matches
}

async analyzeTransaction(
  transaction: BankTransaction,
  availableAccounts: CompanyAccountRecord[]
): Promise<TransactionAnalysis>
```

### Phase 2: Integration Points

#### 1. Mapping Dialog Enhancement
**File**: `/src/components/banking/BankToLedgerImport.tsx`

**Add to UI:**
- 💡 "Get AI Suggestion" button below transaction details
- Explanation card showing reasoning
- Confidence meter (⭐⭐⭐⭐⭐)
- "Apply Suggestion" quick action button

#### 2. Validation Feedback
**After user selects accounts:**
- Check if mapping makes sense
- Warn about common mistakes
- Suggest improvements

---

## Implementation Strategy

### Step 1: AI Service Setup (30 mins)
```typescript
// Use existing Claude context or Anthropic API
// Prompt engineering for accounting knowledge
// Fallback to rule-based if API unavailable
```

### Step 2: Transaction Keyword Analysis (20 mins)
```typescript
// Extract meaningful keywords
// Match against accounting categories
// Build context for AI prompt
```

### Step 3: Prompt Engineering (40 mins)
```typescript
const prompt = `
You are an experienced South African accountant helping a user map bank transactions to GL accounts.

Transaction Details:
- Description: "${transaction.description}"
- Amount: R${transaction.amount}
- Type: ${transaction.credit > 0 ? 'Money Out (Payment)' : 'Money In (Receipt)'}

Available GL Accounts:
${accounts.map(a => `${a.code} - ${a.name} (${a.type})`).join('\n')}

Task: Suggest the correct debit and credit accounts, explain WHY in simple terms, and rate your confidence.

Format your response as JSON:
{
  "debitAccount": "code",
  "creditAccount": "code",
  "confidence": 95,
  "explanation": "This is a telecom expense...",
  "reasoning": ["Point 1", "Point 2"],
  "warnings": []
}
`;
```

### Step 4: UI Integration (45 mins)
- Add "AI Suggestion" button
- Display analysis results
- One-click apply functionality
- Loading states

### Step 5: Error Validation (30 mins)
- Check debit/credit balance
- Validate account types
- Warn about unusual mappings

---

## Example: FNB Airtime Transaction

### Input:
```json
{
  "description": "FNB App Prepaid Airtime 0769012562",
  "amount": 85.00,
  "type": "debit"
}
```

### AI Analysis Output:
```json
{
  "suggestedMapping": {
    "debitAccount": {
      "code": "5500",
      "name": "Communications Expense"
    },
    "creditAccount": {
      "code": "1000",
      "name": "Cash"
    },
    "confidence": 95
  },
  "explanation": "This is a mobile airtime purchase, which is a business communication expense. Since you're paying for airtime, your cash decreases and your expenses increase.",
  "reasoning": [
    "FNB App indicates bank payment",
    "Prepaid Airtime is a telecommunications expense",
    "The phone number suggests individual airtime purchase",
    "Communication expenses are normal operating costs"
  ],
  "accountingPrinciple": "Expense Recognition - Record expenses when incurred",
  "warnings": [],
  "similarCount": 45,
  "shouldSaveAsRule": true
}
```

### UI Display:
```
┌─────────────────────────────────────────────┐
│ 💡 AI Accounting Suggestion                │
│                                             │
│ Confidence: ⭐⭐⭐⭐⭐ (95%)                 │
│                                             │
│ Suggested Mapping:                          │
│ Debit:  5500 - Communications Expense      │
│ Credit: 1000 - Cash                        │
│                                             │
│ 📚 Explanation:                             │
│ This is a mobile airtime purchase, which   │
│ is a business communication expense.       │
│                                             │
│ 💡 Why this mapping?                        │
│ • FNB App indicates bank payment           │
│ • Prepaid Airtime is telecom expense       │
│ • Communication expenses are operating     │
│   costs                                     │
│                                             │
│ 🎓 Accounting Principle:                    │
│ Expense Recognition - Record expenses      │
│ when incurred                               │
│                                             │
│ 📊 I've seen 45 similar transactions       │
│                                             │
│ [Apply Suggestion] [Ignore]  [Explain More]│
└─────────────────────────────────────────────┘
```

---

## Technical Architecture

### Option 1: Use Anthropic Claude API (Recommended)
**Pros:**
- Best accuracy for accounting
- Natural language understanding
- Can explain complex concepts
- Already familiar with Claude

**Cons:**
- API costs (~$0.002 per transaction)
- Requires API key
- Network dependency

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async analyzeTransaction(transaction, accounts) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: buildAccountingPrompt(transaction, accounts)
    }]
  });

  return parseAIResponse(response.content);
}
```

### Option 2: Rule-Based with Smart Fallback
**Pros:**
- No API costs
- Works offline
- Fast responses
- Predictable

**Cons:**
- Less flexible
- Can't explain complex scenarios
- Requires manual pattern updates

**Implementation:**
```typescript
// Hybrid approach: Rules first, AI for unknown cases
async analyzeTransaction(transaction, accounts) {
  // Try rule-based first (instant)
  const ruleMatch = await matchKnownPatterns(transaction);

  if (ruleMatch && ruleMatch.confidence > 80) {
    return formatRuleBasedSuggestion(ruleMatch);
  }

  // Fall back to AI for complex/unknown cases
  return await aiAnalyze(transaction, accounts);
}
```

---

## Costs Analysis

### Anthropic Claude API:
- **Model**: Claude 3.5 Sonnet
- **Cost**: ~$0.002 per transaction analysis
- **Monthly estimate**: 1,000 transactions = $2/month
- **Annual**: ~$24/year

### Alternative: Gemini 2.0 Flash (Cheaper)
- **Cost**: Free tier available
- **Fallback option** if Claude unavailable

---

## Implementation Steps - RIGHT NOW

### ✅ Step 1: Create AI Service (30 mins)
- [ ] Create `/src/lib/accounting/ai-accounting-assistant.ts`
- [ ] Set up Anthropic SDK
- [ ] Build prompt template
- [ ] Add response parsing

### ✅ Step 2: Add to Mapping Dialog (45 mins)
- [ ] Add "Get AI Suggestion" button
- [ ] Create suggestion display component
- [ ] Add loading states
- [ ] Wire up to AI service

### ✅ Step 3: Test with Real Transactions (15 mins)
- [ ] Test with FNB Airtime
- [ ] Test with unknown transaction
- [ ] Verify explanations make sense
- [ ] Check confidence scores

---

## Success Metrics

✅ **Immediate Win:** User clicks "Get AI Suggestion" and gets accurate mapping + explanation
✅ **Learning:** User understands WHY the mapping is correct
✅ **Confidence:** 90%+ suggestion accuracy
✅ **Speed:** < 2 seconds per analysis
✅ **Adoption:** Users prefer AI suggestions over manual mapping

---

## Future Enhancements (Post-MVP)

1. **Bulk Analysis** - Analyze all transactions at once
2. **Learning Mode** - Quiz users on accounting concepts
3. **Auto-Apply** - Automatically apply high-confidence suggestions
4. **Custom Training** - Learn from user's specific industry/patterns
5. **Multi-Language** - Support local languages (Afrikaans, Zulu, etc.)

---

## Next Steps

1. ✅ **Get approval** for Anthropic API usage (costs ~$2/month)
2. 🚀 **Start coding** AI service
3. 🎨 **Design** suggestion UI component
4. 🧪 **Test** with real transactions
5. 📚 **Document** for users

**Ready to implement? Let's do this! 🚀**
