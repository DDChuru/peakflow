# Agent Coordination Strategy
## Customer & Company Configuration Implementation

**Implementation Plan:** `customer-company-config-implementation-plan.md`
**Verification Checklist:** `customer-company-config-verification-checklist.md`
**Date:** 2025-10-08

---

## Overview

This document outlines the strategy for delegating and coordinating implementation work across multiple specialized AI agents to optimize context usage and leverage domain expertise.

---

## Agent Roles & Responsibilities

### 1. **Codex Orchestrator** (Deep Reasoning Agent)
- **Model:** `gpt-5-codex` with `model_reasoning_effort="high"`
- **Security:** `read-only` mode
- **Primary Role:** Architecture analysis and design decisions
- **Delegates To:** Codex (via CLI)

**Use For:**
- Analyzing complex architectural trade-offs
- Evaluating data structure design decisions (array vs sub-collection)
- Reviewing security implications
- Deep analysis of service layer patterns
- Performance optimization recommendations

### 2. **Task Context Manager**
- **Primary Role:** Progress tracking and task management
- **Use For:**
- Creating and updating todo lists
- Tracking completion of phases
- Documenting blockers
- Coordinating parallel work streams

### 3. **UI/UX Modernizer**
- **Primary Role:** Component design and implementation
- **Use For:**
- Creating React components (PrimaryContactForm, FinancialContactsManager)
- Implementing form layouts and validation
- Ensuring consistent UI patterns
- Tailwind CSS styling

### 4. **Database Service Expert**
- **Primary Role:** Firestore operations and service layer
- **Use For:**
- Implementing service methods
- Firestore query optimization
- Data validation logic
- Transaction handling

---

## Implementation Strategy

### Parallel vs Sequential Work

#### **Can Be Done in Parallel:**
1. **Phase 1A:** Type definitions for Company (auth.ts)
2. **Phase 1B:** Type definitions for Debtor/Creditor (financial.ts)
3. **Phase 4:** Validation schemas (can be done early)

#### **Must Be Sequential:**
1. Phase 1 (Types) → Phase 2 (Services) → Phase 3 (UI)
   - Services depend on types
   - UI depends on services

2. Within Phase 3:
   - PrimaryContactForm → FinancialContactsManager → Page Integration
   - Base components before page integration

---

## Recommended Agent Delegation Plan

### **Sprint 1: Foundation (Types & Services)**

#### Task 1.1: Type Definitions - Company
**Agent:** Direct implementation (no delegation needed - straightforward)
**Duration:** 30 minutes
**Files:**
- `/src/types/auth.ts`

**Actions:**
1. Add `SupportedCurrency` type
2. Extend `Company` interface with currency and VAT fields
3. Verify TypeScript compilation

#### Task 1.2: Type Definitions - Contacts
**Agent:** Direct implementation
**Duration:** 30 minutes
**Files:**
- `/src/types/financial.ts`

**Actions:**
1. Add `ContactPerson` interface
2. Add `FinancialContact` interface
3. Extend `Debtor` and `Creditor` interfaces
4. Verify TypeScript compilation

#### Task 1.3: Architecture Design Review
**Agent:** Codex Orchestrator
**Duration:** 1 hour
**Command:**
```bash
codex exec -m gpt-5-codex -s read-only -c model_reasoning_effort="high" \
"You are Codex, analyzing the architectural decision for storing financial contacts.

CONTEXT: We need to store 2-10 financial contacts per customer for invoice mailing lists.

OPTIONS:
1. Array field in debtor document
2. Sub-collection: debtors/{id}/financialContacts

ANALYZE:
- Query patterns and performance
- Cost implications (Firestore reads)
- Update complexity
- Atomicity requirements
- Scalability (10 vs 100+ contacts)
- Best practices for Firestore

Provide well-reasoned recommendation with trade-offs. Report findings to Codex Orchestrator."
```

**Deliverable:** Architecture decision document confirming array approach

#### Task 1.4: Companies Service Updates
**Agent:** Database Service Expert OR Direct implementation
**Duration:** 1 hour
**Files:**
- `/src/lib/firebase/companies-service.ts`

**Actions:**
1. Update `createCompany()` to handle currency and VAT
2. Update `getCompanyById()` to provide defaults
3. Add validation in service methods
4. Test: Create and fetch company with new fields

#### Task 1.5: Debtor Service Updates
**Agent:** Database Service Expert OR Direct implementation
**Duration:** 2 hours
**Files:**
- `/src/lib/firebase/debtor-service.ts`

**Actions:**
1. Update `createDebtor()` for contacts array
2. Implement `addFinancialContact()`
3. Implement `updateFinancialContact()`
4. Implement `removeFinancialContact()`
5. Implement `getFinancialContactEmails()`
6. Test: All CRUD operations for contacts

#### Task 1.6: Creditor Service Updates
**Agent:** Database Service Expert OR Direct implementation
**Duration:** 1.5 hours (copy pattern from Debtor)
**Files:**
- `/src/lib/firebase/creditor-service.ts`

**Actions:**
1. Apply same patterns as DebtorService
2. Test: All CRUD operations

---

### **Sprint 2: UI Components**

#### Task 2.1: Primary Contact Form Component
**Agent:** UI/UX Modernizer
**Duration:** 1.5 hours
**Files:**
- `/src/components/financial/PrimaryContactForm.tsx` (NEW)

**Delegation Command:**
```bash
# If using agent delegation:
# Provide component specs, expected props, validation requirements
```

**Actions:**
1. Create component with Card layout
2. Implement form fields (name, email, phone, position)
3. Add validation display
4. Test: Render component with/without data

#### Task 2.2: Financial Contacts Manager Component
**Agent:** UI/UX Modernizer
**Duration:** 3 hours
**Files:**
- `/src/components/financial/FinancialContactsManager.tsx` (NEW)

**Actions:**
1. Create component with contact list display
2. Implement add contact form
3. Implement edit/remove actions
4. Implement active/inactive toggle
5. Add empty state
6. Test: All user interactions

#### Task 2.3: Company Edit Page Updates
**Agent:** Direct implementation OR UI/UX Modernizer
**Duration:** 1 hour
**Files:**
- `/app/companies/[id]/edit/page.tsx`

**Actions:**
1. Add currency dropdown to form
2. Add VAT percentage input
3. Update Zod schema
4. Test: Create and edit company with new fields

#### Task 2.4: Debtor Create Page Integration
**Agent:** Direct implementation
**Duration:** 1 hour
**Files:**
- `/app/companies/[id]/debtors/new/page.tsx`

**Actions:**
1. Import and integrate PrimaryContactForm
2. Import and integrate FinancialContactsManager
3. Update form submission logic
4. Test: Create debtor with contacts

#### Task 2.5: Debtor Edit Page Integration
**Agent:** Direct implementation
**Duration:** 1 hour
**Files:**
- `/app/companies/[id]/debtors/[debtorId]/edit/page.tsx` (if exists)

**Actions:**
1. Integrate contact components
2. Load existing contact data
3. Test: Edit debtor contacts

#### Task 2.6: Creditor Pages Integration
**Agent:** Direct implementation
**Duration:** 1 hour (mirror debtor pages)
**Files:**
- `/app/companies/[id]/creditors/new/page.tsx`
- `/app/companies/[id]/creditors/[creditorId]/edit/page.tsx`

---

### **Sprint 3: Validation & Testing**

#### Task 3.1: Validation Schemas
**Agent:** Direct implementation
**Duration:** 1 hour
**Files:**
- `/src/lib/validation/company-validation.ts` (NEW)
- `/src/lib/validation/contact-validation.ts` (NEW)

**Actions:**
1. Create Zod schemas for company currency/VAT
2. Create Zod schemas for contacts
3. Create helper validation functions
4. Test: Valid and invalid data

#### Task 3.2: Bank Account UI Audit
**Agent:** Direct investigation
**Duration:** 30 minutes
**Files:**
- Locate bank account management pages
- Document current currency handling

**Actions:**
1. Find bank account CRUD pages
2. Verify currency field exists and works
3. Test: Create/edit bank account with currency
4. Document any issues found

#### Task 3.3: Integration Testing
**Agent:** Direct testing OR Task Context Manager (tracking)
**Duration:** 2 hours
**Files:**
- All implemented files

**Actions:**
1. Run through complete user flows
2. Test backward compatibility
3. Test edge cases
4. Verify Firestore data structure
5. Check for console errors

---

## Coordination Points & Dependencies

### Critical Path:
```
Types → Services → Components → Page Integration → Testing
  ↓        ↓           ↓              ↓              ↓
Day 1    Day 1      Day 2         Day 3          Day 4
```

### Dependency Graph:
```
Company Types ────────────┐
                          ├──→ Companies Service ──→ Company Edit Page
Contact Types ────────────┘

Contact Types ──→ Debtor Service ──┐
                                   ├──→ Contact Components ──→ Debtor Pages
Contact Types ──→ Creditor Service ┘

All Services ──→ Validation Schemas ──→ Testing
```

### Communication Protocol:

1. **Status Updates:**
   - Update Task Context Manager after each task completion
   - Document blockers immediately
   - Share findings from architecture reviews

2. **Code Handoffs:**
   - Commit after each logical unit
   - Tag commits with phase number
   - Document any deviations from plan

3. **Integration Points:**
   - Test service methods before UI integration
   - Verify types compile before moving to services
   - Run smoke tests before marking phase complete

---

## Risk Mitigation

### Risk 1: Type Definition Errors
**Mitigation:**
- Implement and test Phase 1 completely before Phase 2
- Run `npm run build` after type changes
- Verify in VS Code that no red squiggles appear

### Risk 2: Service Method Complexity
**Mitigation:**
- Use Codex Orchestrator for complex logic review
- Test each service method individually
- Write unit tests for contact CRUD operations

### Risk 3: UI Component Integration Issues
**Mitigation:**
- Build components in isolation first
- Test with mock data before connecting to services
- Verify props and callbacks work correctly

### Risk 4: Backward Compatibility Breaking
**Mitigation:**
- Test with existing records at each phase
- Ensure all new fields have defaults
- Verify old pages still work with new types

---

## Recommended Execution Approach

### **Option A: Single Agent Sequential (Safest)**
**Best For:** First-time implementation, ensuring coherence

**Process:**
1. Direct implementation of all phases in order
2. Use Codex Orchestrator only for architecture review (Task 1.3)
3. Use Task Context Manager for progress tracking
4. Estimated Time: 12-16 hours

**Pros:**
- Complete context maintained
- Easy to catch integration issues
- Simpler coordination

**Cons:**
- Longer total time
- Single point of failure

### **Option B: Parallel with Coordination (Faster)**
**Best For:** Experienced with codebase, need speed

**Process:**
1. **Day 1 Morning:** Direct - Phase 1 Types (both files in parallel)
2. **Day 1 Afternoon:** Database Service Expert - Phase 2 Services (Companies + Debtor)
3. **Day 2 Morning:** UI/UX Modernizer - Phase 3 Components (PrimaryContactForm + FinancialContactsManager)
4. **Day 2 Afternoon:** Direct - Page Integration
5. **Day 3:** Direct - Creditor services/pages (copy pattern)
6. **Day 4:** Testing and refinement

**Pros:**
- Faster completion (8-10 hours spread over 4 days)
- Leverages agent specialization
- Parallel work on independent tasks

**Cons:**
- More coordination overhead
- Risk of integration issues
- Requires clear communication

### **Option C: Hybrid (Recommended)**
**Best For:** Balance between speed and safety

**Process:**
1. **Phase 1 (Types):** Direct implementation - 1 hour
2. **Architecture Review:** Codex Orchestrator - 30 minutes
3. **Phase 2 (Services):** Database Service Expert OR Direct - 4 hours
4. **Phase 3 (UI):** UI/UX Modernizer for components, Direct for integration - 5 hours
5. **Phase 4 (Validation):** Direct - 2 hours
6. **Testing:** Direct with Task Context Manager tracking - 2 hours

**Total Estimated Time:** 14-16 hours

**Pros:**
- Expert help for complex tasks
- Direct control over critical path
- Good balance of speed and quality

**Cons:**
- Some agent overhead
- Need to manage handoffs

---

## Decision: Which Approach to Use?

### Factors to Consider:

1. **Urgency:**
   - High urgency → Option B (Parallel)
   - Medium urgency → Option C (Hybrid)
   - Low urgency → Option A (Sequential)

2. **Complexity:**
   - High complexity → Use Codex Orchestrator for design review
   - Medium complexity → Direct with selective delegation
   - Low complexity → Direct implementation

3. **Risk Tolerance:**
   - Low risk tolerance → Option A
   - Medium risk tolerance → Option C
   - High risk tolerance → Option B

4. **Team Familiarity:**
   - First-time → Option A
   - Experienced → Option C or B

### **Recommendation: Option C (Hybrid)**

**Rationale:**
- Good balance of speed and quality
- Leverages agents for specialized tasks
- Maintains control over critical integration points
- Architecture review ensures solid foundation
- 14-16 hours is reasonable timeline

---

## Agent Commands Reference

### Codex Orchestrator (Architecture Review):
```bash
codex exec -m gpt-5-codex -s read-only -c model_reasoning_effort="high" \
"[Detailed architectural analysis prompt with context]"
```

### Database Service Expert (if delegating):
```bash
# Not using specialized agent tool, would be direct implementation
# or manual delegation to human developer with DB expertise
```

### UI/UX Modernizer (if delegating):
```bash
# Would use agent delegation with clear component specifications
# Provide: Props interface, layout mockup, validation requirements
```

### Task Context Manager:
```bash
# Update todo list after each task
# Track: Phase 1 - Complete, Phase 2 - In Progress, etc.
```

---

## Success Criteria for Coordination

- ✅ All phases completed in order
- ✅ No integration issues between phases
- ✅ All tests passing
- ✅ No backward compatibility breaks
- ✅ Code quality consistent across all files
- ✅ Documentation updated
- ✅ Stakeholder approval obtained

---

## Handoff Protocol

### When delegating to an agent:

1. **Provide Context:**
   - Link to implementation plan
   - Relevant type definitions
   - Expected patterns from existing code

2. **Clear Deliverables:**
   - Specific files to create/modify
   - Expected function signatures
   - Test cases to verify

3. **Integration Requirements:**
   - How component fits into larger system
   - Dependencies on other work
   - API contracts to maintain

4. **Verification Steps:**
   - How to test the implementation
   - Success criteria
   - Edge cases to consider

### When receiving work from an agent:

1. **Verify Compilation:**
   - Run `npm run build`
   - Check for TypeScript errors

2. **Test Functionality:**
   - Run through test cases
   - Verify integration points

3. **Review Code Quality:**
   - Consistent with existing patterns
   - Proper error handling
   - Good documentation

4. **Update Progress:**
   - Mark task complete in tracker
   - Document any issues found
   - Note any deviations from plan

---

## Appendix: Agent Contact Points

### When to Use Codex Orchestrator:
- ❓ Should we use array or sub-collection for contacts?
- ❓ How to handle currency conversion in transactions?
- ❓ What's the best validation strategy?
- ❓ Performance implications of data structure choice?
- ❓ Security considerations for contact data?

### When to Use Task Context Manager:
- 📋 Start new phase
- ✅ Complete task
- 🚧 Hit blocker
- 📊 Need progress report
- 🔄 Update timeline

### When to Use UI/UX Modernizer:
- 🎨 Create new React component
- 🖼️ Design form layout
- ✨ Implement animations/transitions
- 📱 Ensure responsive design
- ♿ Accessibility improvements

### When to Direct Implement:
- ✏️ Simple type additions
- 🔧 Straightforward service methods
- 🔌 Page integrations
- 🧪 Testing
- 📚 Documentation

---

**Coordination Strategy Version:** 1.0
**Last Updated:** 2025-10-08
**Status:** Ready for Execution
**Recommended Approach:** Hybrid (Option C)
