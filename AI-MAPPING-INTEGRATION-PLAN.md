# AI Mapping System Integration Plan

## Overview
This document outlines the integration of the new AI mapping system (MappingPipeline, AIMappingArtifact, RuleLearningService) into the BankToLedgerImport component.

## Current State Analysis

### BankToLedgerImport.tsx Structure (1361 lines)
- **Current Workflow**: Upload statement → Load transactions → Manual mapping → Preview → Post
- **Current AI Integration**: Basic suggestion widget (lines 1056-1138) with conversation history
- **Current Mapping**: Manual GL account selection per transaction
- **Current Rule Creation**: Manual checkbox to save as rule (lines 1244-1256)

### Key Methods to Enhance
1. **`suggestMappings()` (line 212)**: Currently empty - needs MappingPipeline integration
2. **`handleSaveMappingWithRule()` (line 453)**: Manual rule saving - needs RuleLearningService
3. **Mapping step rendering (line 701)**: Single view - needs tri-state dashboard
4. **AI widget (lines 1056-1138)**: Basic chat - needs AIMappingArtifact component

## Integration Architecture

### Phase 1: Pipeline Integration
Replace `suggestMappings()` with MappingPipeline to automatically categorize transactions:

```typescript
// Before: Empty method
const suggestMappings = async () => {
  // TODO: Implement AI-powered suggestions
};

// After: Pipeline-powered categorization
const suggestMappings = async () => {
  setIsProcessing(true);

  // Initialize pipeline
  const pipeline = new MappingPipeline(companyId);

  // Process all unmapped transactions
  const unmappedTransactions = transactions.filter(t =>
    !mappings.find(m => m.transactionId === t.id)
  );

  const result = await pipeline.processTransactions(unmappedTransactions);

  // Update state with tri-state buckets
  setAutoMapped(result.autoMapped);
  setNeedsReview(result.needsReview);
  setNeedsAI(result.needsAI);
  setProcessingStats(result.stats);

  setIsProcessing(false);
};
```

### Phase 2: Tri-State UI
Add three distinct sections to the mapping step:

```tsx
// New state variables
const [autoMapped, setAutoMapped] = useState<AutoMappedItem[]>([]);
const [needsReview, setNeedsReview] = useState<ReviewItem[]>([]);
const [needsAI, setNeedsAI] = useState<AIItem[]>([]);

// Rendering logic
{currentStep === 2 && (
  <div className="space-y-6">
    {/* Statistics Bar */}
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="Auto-Mapped"
        count={autoMapped.length}
        color="green"
        description="High confidence - ready to apply"
      />
      <StatCard
        label="Needs Review"
        count={needsReview.length}
        color="yellow"
        description="Medium confidence - verify mapping"
      />
      <StatCard
        label="Needs AI"
        count={needsAI.length}
        color="blue"
        description="Low confidence - AI assistance required"
      />
    </div>

    {/* Tab Navigation */}
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="auto-mapped">
          ✓ Auto-Mapped ({autoMapped.length})
        </TabsTrigger>
        <TabsTrigger value="needs-review">
          ⚠ Needs Review ({needsReview.length})
        </TabsTrigger>
        <TabsTrigger value="needs-ai">
          ✨ Needs AI ({needsAI.length})
        </TabsTrigger>
      </TabsList>

      {/* Auto-Mapped Tab */}
      <TabsContent value="auto-mapped">
        <DataTable
          data={autoMapped}
          columns={autoMappedColumns}
          onApplyAll={handleApplyAllAutoMapped}
        />
      </TabsContent>

      {/* Needs Review Tab */}
      <TabsContent value="needs-review">
        <ReviewList
          items={needsReview}
          onApprove={handleApproveReviewItem}
          onEdit={handleEditReviewItem}
        />
      </TabsContent>

      {/* Needs AI Tab */}
      <TabsContent value="needs-ai">
        <AIAssistanceQueue
          transactions={needsAI}
          currentIndex={currentAIIndex}
          onAnalyze={handleAnalyzeWithAI}
        />
      </TabsContent>
    </Tabs>
  </div>
)}
```

### Phase 3: AI Artifact Integration
Replace inline AI widget with AIMappingArtifact component:

```tsx
// Current AI widget (lines 1056-1138) - REMOVE
{isAskingAI && (
  <div className="space-y-4">
    {/* Old conversation-style widget */}
  </div>
)}

// New artifact UI - ADD
{currentAISuggestion && (
  <AIMappingArtifact
    transaction={needsAI[currentAIIndex].transaction}
    suggestion={currentAISuggestion}
    createAccount={currentAccountCreation}
    currentIndex={currentAIIndex + 1}
    totalCount={needsAI.length}
    onApprove={handleApproveAISuggestion}
    onEdit={handleEditAISuggestion}
    onSkip={handleSkipAISuggestion}
    onPrevious={currentAIIndex > 0 ? handlePreviousAI : undefined}
    onNext={currentAIIndex < needsAI.length - 1 ? handleNextAI : undefined}
    onSelectAlternative={handleSelectAlternative}
    onCreateAndApply={handleCreateAndApply}
    isLoading={isProcessingAI}
  />
)}
```

### Phase 4: Rule Learning Integration
Auto-save AI approvals as rules using RuleLearningService:

```typescript
// New service instance
const [ruleLearningService] = useState(() => new RuleLearningService(companyId));

// Handle AI approval with automatic rule creation
const handleApproveAISuggestion = async () => {
  const transaction = needsAI[currentAIIndex].transaction;

  // Scenario 1: Create account + save rule
  if (currentAccountCreation?.needed) {
    toast.info('Creating account and saving mapping rule...');

    const result = await ruleLearningService.createAccountAndSaveRule(
      transaction,
      currentAISuggestion,
      currentAccountCreation
    );

    if (result.account.created && result.rule.created) {
      toast.success(
        `✅ Account created: ${result.account.code} - ${result.account.name}\n` +
        `📋 Rule saved: Future transactions matching "${result.rule.pattern}" will auto-map`
      );

      // Apply mapping to current transaction
      applyMapping(transaction.id, {
        debitAccount: currentAISuggestion.debitAccount,
        creditAccount: currentAISuggestion.creditAccount,
        ruleId: result.rule.ruleId
      });
    }
  }
  // Scenario 2: Just save rule (account already exists)
  else {
    const ruleResult = await ruleLearningService.saveAIApprovalAsRule(
      transaction,
      currentAISuggestion
    );

    if (ruleResult.created) {
      toast.success(
        `📋 Rule saved: ${ruleResult.message}`
      );

      // Apply mapping to current transaction
      applyMapping(transaction.id, {
        debitAccount: currentAISuggestion.debitAccount,
        creditAccount: currentAISuggestion.creditAccount,
        ruleId: ruleResult.ruleId
      });
    }
  }

  // Move to next transaction
  moveToNextAITransaction();
};
```

### Phase 5: One-Click Account Creation
Implement the "Create Account & Apply" button handler:

```typescript
const handleCreateAndApply = async () => {
  if (!currentAccountCreation?.needed) return;

  setIsProcessingAI(true);

  try {
    const transaction = needsAI[currentAIIndex].transaction;

    // Use RuleLearningService to do everything in one call
    const result = await ruleLearningService.createAccountAndSaveRule(
      transaction,
      currentAISuggestion!,
      currentAccountCreation
    );

    if (result.account.created && result.rule.created) {
      // Success notification
      toast.success(
        `✨ Success! Account created and rule saved.\n` +
        `📊 ${result.account.code} - ${result.account.name}\n` +
        `🎯 Future transactions will auto-map to this account.`,
        { duration: 5000 }
      );

      // Apply to current transaction
      const mapping = {
        transactionId: transaction.id,
        debitAccountId: currentAISuggestion!.debitAccount.id,
        creditAccountId: currentAISuggestion!.creditAccount.id,
        amount: transaction.debit || transaction.credit || 0,
        description: transaction.description,
        ruleId: result.rule.ruleId,
        metadata: {
          source: 'ai-assisted',
          confidence: currentAISuggestion!.confidence,
          accountCreated: true,
          createdAccountCode: result.account.code
        }
      };

      setMappings([...mappings, mapping]);

      // Remove from needsAI bucket
      setNeedsAI(needsAI.filter((_, idx) => idx !== currentAIIndex));

      // Move to next or close
      if (needsAI.length > 1) {
        moveToNextAITransaction();
      } else {
        setCurrentAISuggestion(null);
        toast.info('All transactions processed! 🎉');
      }
    }
  } catch (error) {
    console.error('Failed to create account and apply:', error);
    toast.error('Failed to create account. Please try again.');
  } finally {
    setIsProcessingAI(false);
  }
};
```

## State Management Updates

### New State Variables
```typescript
// Tri-state buckets
const [autoMapped, setAutoMapped] = useState<Array<{
  transaction: BankTransaction;
  mapping: TransactionMapping;
}>>([]);

const [needsReview, setNeedsReview] = useState<Array<{
  transaction: BankTransaction;
  suggestedMapping: TransactionMapping;
}>>([]);

const [needsAI, setNeedsAI] = useState<Array<{
  transaction: BankTransaction;
}>>([]);

// Processing state
const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
const [activeTab, setActiveTab] = useState<'auto-mapped' | 'needs-review' | 'needs-ai'>('auto-mapped');

// AI artifact state
const [currentAIIndex, setCurrentAIIndex] = useState(0);
const [currentAISuggestion, setCurrentAISuggestion] = useState<MappingSuggestion | null>(null);
const [currentAccountCreation, setCurrentAccountCreation] = useState<AccountCreationSuggestion | null>(null);
const [isProcessingAI, setIsProcessingAI] = useState(false);

// Services
const [pipeline] = useState(() => new MappingPipeline(companyId));
const [ruleLearningService] = useState(() => new RuleLearningService(companyId));
```

## User Experience Flow

### Happy Path - High Automation Rate
1. **User uploads statement** → 50 transactions
2. **Pipeline processes** → 45 auto-mapped (90%), 3 review (6%), 2 AI (4%)
3. **User sees dashboard**:
   - Green section: "45 transactions auto-mapped ✓"
   - Yellow section: "3 need quick review ⚠"
   - Blue section: "2 need AI assistance ✨"
4. **User clicks "Apply All Auto-Mapped"** → Done in 1 click
5. **User reviews 3 medium-confidence**:
   - Transaction 1: "Looks good" → Approve (saves rule)
   - Transaction 2: "Close, but wrong account" → Edit → Approve (saves rule)
   - Transaction 3: "Looks good" → Approve (saves rule)
6. **User requests AI for 2 unknowns**:
   - Transaction 1: AI suggests mapping → User approves → Rule saved
   - Transaction 2: AI suggests creating account → User clicks "Create & Apply" → Account created, rule saved
7. **Next import**: 48/50 auto-map immediately (96% automation)

### Progressive Learning Curve
- **First import**: 40% auto-map → 30% review → 30% AI
- **Second import**: 70% auto-map → 20% review → 10% AI
- **Third import**: 85% auto-map → 10% review → 5% AI
- **Steady state**: 90%+ auto-map → 5-8% review → 2-5% AI

## Implementation Checklist

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Create MappingPipeline service
- [x] Create RuleLearningService
- [x] Create AIMappingArtifact component
- [x] Update AccountingAssistant for account creation
- [x] Update API route to return createAccount

### 🔄 Phase 2: Integration (IN PROGRESS)
- [ ] Add tri-state state variables to BankToLedgerImport
- [ ] Implement `suggestMappings()` with MappingPipeline
- [ ] Create tri-state dashboard UI (tabs + stat cards)
- [ ] Replace AI widget with AIMappingArtifact
- [ ] Add rule learning on approval
- [ ] Implement "Create Account & Apply" handler
- [ ] Add navigation between AI suggestions
- [ ] Update preview step to show all three buckets

### ⏳ Phase 3: Testing & Refinement
- [ ] Test with real bank statement
- [ ] Verify auto-mapping works correctly
- [ ] Test rule creation and future auto-mapping
- [ ] Test account creation flow
- [ ] Verify progressive learning (multiple imports)
- [ ] Test edge cases (empty buckets, all AI, etc.)
- [ ] Performance testing with large statements (500+ transactions)

### 📋 Phase 4: Documentation
- [ ] Create smoke test guide
- [ ] Update modernization roadmap
- [ ] Add inline code comments
- [ ] Create user guide with screenshots
- [ ] Document keyboard shortcuts

## Key Design Decisions

### Why Tri-State Architecture?
- **User Control**: Clear visual separation of confidence levels
- **Efficiency**: Batch-apply high-confidence mappings
- **Transparency**: User sees exactly what AI is confident about vs unsure
- **Progressive Disclosure**: Only show AI artifact when needed

### Why Rules-First Approach?
- **Cost Optimization**: 85% reduction in AI calls at steady state
- **Speed**: Rule matching is instant vs 2-3s AI calls
- **Reliability**: Rules are deterministic and predictable
- **Learning**: System improves automatically with each approval

### Why Artifact UI?
- **Rich Context**: Show reasoning, alternatives, confidence all at once
- **One-Click Actions**: Minimize user friction for common tasks
- **Keyboard Navigation**: Power users can fly through reviews
- **Visual Hierarchy**: Clear primary action vs secondary options

## Next Steps

1. **Implement tri-state UI in BankToLedgerImport** (2-3 hours)
2. **Integrate MappingPipeline** (1 hour)
3. **Wire up AIMappingArtifact** (1-2 hours)
4. **Add RuleLearningService integration** (1 hour)
5. **Test end-to-end flow** (1-2 hours)
6. **Create smoke test guide** (30 min)
7. **Update modernization roadmap** (15 min)

**Total Estimated Time**: 7-10 hours

## Success Metrics

- **Auto-mapping rate**: Target 90%+ at steady state
- **User actions per transaction**: Target <0.2 (most auto-apply)
- **AI cost per import**: Target $0.025 at steady state (vs $0.45 initially)
- **Time to complete import**: Target <5 minutes for 100 transactions
- **User satisfaction**: "This feels magical" vs "This is tedious"
