# AI-Assisted Transaction Mapping Architecture

## Vision: Progressive Learning System

AI acts as a **teacher, not a perpetual assistant**. The system learns from AI suggestions and builds up pattern recognition, requiring less AI intervention over time.

## Core Principles

1. **Rules First, AI Second** - Pattern matching handles known transactions, AI only for unknowns
2. **Learn & Teach** - Every AI-approved mapping becomes a reusable rule
3. **Progressive Autonomy** - System gets smarter with each import (98% auto-mapping at steady state)
4. **Cost Optimization** - First import: $0.45, Steady state: $0.025 (85% reduction)
5. **Zero Fatigue** - Users only interact with truly ambiguous transactions

## Processing Pipeline

### Step 1: Rule-Based Matching (No AI Cost)
```
For each transaction:
  1. Try exact vendor match (100% confidence)
     └─ Pattern: "STARBUCKS COFFEE #1234" → Meals & Entertainment

  2. Try pattern regex match (90% confidence if matched 5+ times)
     └─ Pattern: /FNB.*AIRTIME/ → Communications Expense

  3. Try fuzzy vendor match (80% confidence)
     └─ Pattern: "Starbux" fuzzy matches "Starbucks"

  4. Try category-based template (70% confidence)
     └─ Category: "Food & Dining" → Meals & Entertainment

  5. IF confidence >= 85% → ✅ Auto-map
     ELIF confidence 60-84% → ⏸️ Queue for review
     ELSE → 🤖 Queue for AI analysis
```

### Step 2: AI Analysis (Only for Unknowns)

**When invoked:** Only when no rule matches or confidence < 60%

**AI Capabilities:**
- Analyze transaction description, amount, type, date
- Search existing COA for best matches
- **NEW:** Detect missing COA and suggest creation
- **NEW:** Show multiple mapping scenarios with reasoning
- **NEW:** Present artifact UI with one-click actions

### Step 3: Learning Loop (Auto-Save Rules)

When user approves AI suggestion:
```typescript
1. Apply the mapping to current transaction
2. Create COA if AI suggested new account
3. 🔑 Save as high-priority mapping rule
4. Tag rule as 'ai-assisted' for tracking
5. Next import: Same transaction auto-maps via rule (NO AI)
```

## The Learning Curve

### First Import (Day 1)
- **Rules Database:** Empty (just industry templates)
- **Auto-match Rate:** 10-15% (template patterns only)
- **AI Needed:** 85-90 of 100 transactions
- **Cost:** ~$0.45 per import
- **User Time:** 20-30 minutes

### Second Import (Month 2)
- **Rules Database:** 90 patterns learned
- **Auto-match Rate:** 70-75%
- **AI Needed:** 25-30 of 100 transactions
- **Cost:** ~$0.15 per import
- **User Time:** 8-12 minutes

### Third Import (Month 3)
- **Rules Database:** 120 patterns learned
- **Auto-match Rate:** 90-95%
- **AI Needed:** 5-10 transactions
- **Cost:** ~$0.05 per import
- **User Time:** 2-5 minutes

### Steady State (Month 6+)
- **Rules Database:** 200+ patterns
- **Auto-match Rate:** 95-98%
- **AI Needed:** 2-5 transactions (only new/unusual)
- **Cost:** ~$0.025 per import
- **User Time:** 1-3 minutes
- **User Experience:** "Upload, glance, approve, done"

## Tri-State Dashboard

### View After Upload:
```
┌─────────────────────────────────────────────────────┐
│  Bank Statement Import: FNB - April 2025           │
│  127 transactions analyzed                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✅ 108 AUTO-MAPPED BY RULES                        │
│     • 78 vendor matches (exact)                    │
│     • 22 pattern matches (regex)                   │
│     • 8 fuzzy matches (Levenshtein)                │
│     [Review Details ▼] [Post All →]                │
│                                                     │
│  ⏸️  14 NEED YOUR APPROVAL                          │
│     Medium confidence (60-84%)                     │
│     [Review & Approve →]                           │
│                                                     │
│  🤖 5 SENT TO AI ASSISTANT                          │
│     No matching rules found                        │
│     [Resolve with AI →]                            │
│                                                     │
│  📊 Rules: 187 patterns | +8 new from last import  │
└─────────────────────────────────────────────────────┘
```

## AI Artifact Interface

### Scenario 1: Standard Mapping (COA Exists)
```
🤖 AI Analysis (Transaction 1 of 5)

📄 UBER EATS DELIVERY #AB123                    $45.50
   April 15, 2025 | Payment

┌────────────────────────────────────────────────────┐
│ 💡 Mapping Suggestion                  Confidence: 92% │
│                                                    │
│ Debit:  6200 - Meals & Entertainment   $45.50    │
│ Credit: 1000 - Operating Bank          $45.50    │
│                                                    │
│ 💬 Reasoning:                                     │
│ • Food delivery service for business purposes     │
│ • Typical business meal expense                   │
│ • Similar to 12 previous Uber Eats transactions   │
│                                                    │
│ Alternative Mappings:                             │
│ • 6210 - Staff Welfare                            │
│ • 6100 - Client Entertainment                     │
│                                                    │
│ ✓ Save as rule for future auto-mapping           │
│                                                    │
│ [✓ Approve & Save Rule] [Choose Different] [Edit]│
└────────────────────────────────────────────────────┘

[< Previous] [Skip] [Next >]
Keyboard: Enter=Approve | E=Edit | →=Next
```

### Scenario 2: Missing COA - Create & Apply
```
🤖 AI Analysis (Transaction 3 of 5)

📄 MAILCHIMP MONTHLY SUBSCRIPTION            $299.00
   April 1, 2025 | Payment

┌────────────────────────────────────────────────────┐
│ ⚠️  Missing Account Detected                       │
│                                                    │
│ This looks like a Marketing Software expense,     │
│ but I don't see "Marketing Software" in your      │
│ Chart of Accounts.                                │
│                                                    │
│ 📋 Suggested New Account:                         │
│                                                    │
│ Code: 6150                                        │
│ Name: Marketing Software & Tools                  │
│ Type: Expense                                     │
│ Category: Marketing                               │
│ Normal Balance: Debit                             │
│                                                    │
│ 💡 Proposed Mapping:                              │
│ Debit:  6150 - Marketing Software      $299.00   │
│ Credit: 1000 - Operating Bank          $299.00   │
│                                                    │
│ 💬 Why this account?                              │
│ • MailChimp is an email marketing platform        │
│ • Subscription-based SaaS tool                    │
│ • Should be tracked separately from general       │
│   software expenses                               │
│                                                    │
│ ✓ Save as rule for future auto-mapping           │
│                                                    │
│ [✓ Create Account & Apply] [Edit Details] [Skip] │
└────────────────────────────────────────────────────┘

Action: Create account → Apply mapping → Save rule
All in one click!
```

### Scenario 3: Multiple Valid Options
```
🤖 AI Analysis (Transaction 4 of 5)

📄 CITY OF JOHANNESBURG                      $1,850.00
   April 10, 2025 | Payment

┌────────────────────────────────────────────────────┐
│ 🤔 Multiple Scenarios Detected                     │
│                                                    │
│ This municipal payment could map to different     │
│ accounts depending on what it's for:              │
│                                                    │
│ ▶ Option 1: Utilities (Most Common)   Confidence: 75% │
│   Debit:  5200 - Utilities             $1,850.00 │
│   Credit: 1000 - Bank                  $1,850.00 │
│   💬 If this is water/electricity/rates            │
│                                                    │
│ ▶ Option 2: Property Tax                Confidence: 65% │
│   Debit:  5150 - Property Tax          $1,850.00 │
│   Credit: 1000 - Bank                  $1,850.00 │
│   💬 If this is annual property rates              │
│                                                    │
│ ▶ Option 3: Building Maintenance        Confidence: 40% │
│   Debit:  5300 - Repairs               $1,850.00 │
│   Credit: 1000 - Bank                  $1,850.00 │
│   💬 If this is for municipal repairs              │
│                                                    │
│ 💡 Which scenario fits best?                      │
│                                                    │
│ [Option 1] [Option 2] [Option 3] [None - Clarify]│
└────────────────────────────────────────────────────┘

Each option saves as a rule if selected.
```

## API Integration: Claude with Tools

### Enhanced System Prompt
```typescript
You are an expert South African accountant helping map bank
transactions to GL accounts.

CRITICAL: You have access to TOOLS that let you take actions.

Available Tools:
1. query_chart_of_accounts - Search existing GL accounts
2. create_gl_account - CREATE new account when none exists
3. query_mapping_rules - Check historical patterns
4. query_creditors - Find supplier information

When you detect a missing account:
1. Use create_gl_account tool to suggest account details
2. Show user the "Create Account & Apply" artifact
3. If user approves, the system will:
   - Create the account
   - Apply the mapping
   - Save as rule for future

Response Format:
{
  "suggestion": {
    "debitAccount": "5200",
    "creditAccount": "1000",
    "confidence": 92,
    "reasoning": ["point 1", "point 2"],
    "alternatives": [...],
    "shouldSaveAsRule": true
  },
  "createAccount": {
    "needed": true,
    "code": "6150",
    "name": "Marketing Software & Tools",
    "type": "expense",
    "category": "Marketing",
    "reasoning": "MailChimp is marketing automation software..."
  }
}
```

### Tool: Create GL Account
```typescript
{
  name: "create_gl_account",
  description: "Suggest creation of new GL account when existing accounts don't fit",
  input_schema: {
    type: "object",
    properties: {
      code: { type: "string", description: "Account code (e.g., 6150)" },
      name: { type: "string", description: "Account name" },
      type: {
        type: "string",
        enum: ["asset", "liability", "equity", "revenue", "expense"],
        description: "Account type"
      },
      category: { type: "string", description: "Account category" },
      normalBalance: {
        type: "string",
        enum: ["debit", "credit"],
        description: "Normal balance side"
      },
      reasoning: { type: "string", description: "Why this account is needed" }
    },
    required: ["code", "name", "type", "normalBalance", "reasoning"]
  }
}
```

## Technical Implementation

### File Structure
```
/src/lib/ai/
  ├── accounting-assistant.ts          (existing - enhance)
  ├── mapping-pipeline.ts               (NEW - orchestrates rules → AI)
  └── rule-learning-service.ts          (NEW - auto-save approvals)

/src/components/banking/
  ├── BankToLedgerImport.tsx           (existing - update to tri-state)
  ├── AIMappingArtifact.tsx            (NEW - artifact UI)
  └── TriStateDashboard.tsx            (NEW - dashboard component)

/app/api/ai/
  ├── analyze-transaction/route.ts     (existing - enhance with tools)
  └── create-mapping-rule/route.ts     (NEW - save rules endpoint)
```

### Processing Flow (Code)
```typescript
// /src/lib/ai/mapping-pipeline.ts

export async function processTransactions(
  transactions: BankTransaction[],
  companyId: string
): Promise<ProcessingResult> {

  const autoMapped: Transaction[] = [];
  const needsReview: Transaction[] = [];
  const needsAI: Transaction[] = [];

  for (const transaction of transactions) {
    // Step 1: Try rule-based matching
    const ruleMatch = await tryRuleMatching(transaction, companyId);

    if (ruleMatch.confidence >= 85) {
      // High confidence - auto-map
      await applyMapping(transaction, ruleMatch.mapping);
      autoMapped.push(transaction);

    } else if (ruleMatch.confidence >= 60) {
      // Medium confidence - needs review
      transaction.suggestedMapping = ruleMatch.mapping;
      needsReview.push(transaction);

    } else {
      // Low/no confidence - needs AI
      needsAI.push(transaction);
    }
  }

  return {
    autoMapped,      // ✅ Post directly
    needsReview,     // ⏸️ Show for approval
    needsAI,         // 🤖 Send to AI
    stats: {
      total: transactions.length,
      autoMappedCount: autoMapped.length,
      autoMappedPercentage: (autoMapped.length / transactions.length) * 100,
      aiCallsNeeded: needsAI.length,
      estimatedCost: needsAI.length * 0.005
    }
  };
}
```

### Auto-Save Approved Mappings
```typescript
// /src/lib/ai/rule-learning-service.ts

export async function saveAIApprovalAsRule(
  transaction: BankTransaction,
  approvedMapping: Mapping,
  createdAccount?: GLAccount
): Promise<MappingRule> {

  // Extract pattern from transaction description
  const pattern = extractPattern(transaction.description);

  // Create high-priority rule
  const rule = await industryTemplateService.saveMappingRule(
    companyId,
    {
      pattern,
      debitAccountCode: approvedMapping.debitAccount.code,
      creditAccountCode: approvedMapping.creditAccount.code,
      category: transaction.category || 'General',
      priority: 90, // High priority (user-approved)
      confidence: 95,
      isActive: true,
      source: 'ai-assisted',
      metadata: {
        originalDescription: transaction.description,
        amount: transaction.amount,
        aiConfidence: approvedMapping.confidence,
        approvedAt: new Date(),
        createdAccount: createdAccount ? {
          code: createdAccount.code,
          name: createdAccount.name
        } : undefined
      }
    }
  );

  console.log('✅ AI-approved mapping saved as rule:', rule.id);
  console.log(`   Next import: "${pattern}" will auto-map to ${rule.debitAccountCode}`);

  return rule;
}
```

## Success Metrics

### Technical Metrics
- ✅ 95%+ auto-match rate after 6 months
- ✅ <5% AI calls after steady state
- ✅ 85% cost reduction vs "AI everything" approach
- ✅ <3 second response time for AI calls

### User Experience Metrics
- ✅ First import: 20-30 min → Steady state: 1-3 min (90% time saved)
- ✅ User only reviews 2-5% of transactions (vs 100% manual)
- ✅ Zero decision fatigue (only ambiguous cases)
- ✅ Confidence in system grows with each import

### Business Value
- ✅ Onboarding: Company ready in 1st import instead of weeks of setup
- ✅ Ongoing: "Upload, glance, approve" becomes the norm
- ✅ Learning: System builds institutional knowledge automatically
- ✅ Scalability: Works for 10 or 1,000 transactions equally well

## Implementation Phases

### Phase 1: Enhanced AI Service (Week 1)
- ✅ Add `create_gl_account` tool to Claude API
- ✅ Update system prompt with tool instructions
- ✅ Enhance response parsing for account creation suggestions

### Phase 2: Artifact UI Components (Week 2)
- ✅ Build `AIMappingArtifact` component
- ✅ Support 3 scenarios: standard, create account, multiple options
- ✅ Add keyboard navigation (Enter, E, arrows)
- ✅ Add "Create Account & Apply" one-click action

### Phase 3: Processing Pipeline (Week 2)
- ✅ Build `mapping-pipeline.ts` orchestrator
- ✅ Implement tri-state processing (auto/review/AI)
- ✅ Create `TriStateDashboard` component
- ✅ Update `BankToLedgerImport` to use new pipeline

### Phase 4: Learning Loop (Week 3)
- ✅ Build `rule-learning-service.ts`
- ✅ Auto-save AI approvals as rules
- ✅ Track rule source (`ai-assisted` tag)
- ✅ Add rule statistics to dashboard

### Phase 5: Testing & Refinement (Week 4)
- ✅ Test with real bank statements
- ✅ Measure auto-match improvement over time
- ✅ Optimize confidence thresholds
- ✅ Create comprehensive smoke test guide

## Next Steps

1. Enhance `accounting-assistant.ts` with COA creation tool
2. Build `AIMappingArtifact.tsx` component
3. Create `mapping-pipeline.ts` processing orchestrator
4. Update `BankToLedgerImport.tsx` to use tri-state flow
5. Implement auto-save rule learning
6. Test and iterate

---

**The Vision:** Upload statement → System handles 95% → User confirms 5% → Done in 3 minutes.

**The Reality:** This is achievable in 4 weeks with the architecture above.

Let's build it! 🚀
