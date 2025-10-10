# Active Development Tasks

## Session: 2025-10-10 - Branch: main

### Scope
Apply successful UX improvements from Quotes page to Invoices and Contracts pages for consistency across revenue management modules. This includes line item dialog patterns, smart GL account detection, tax rate pre-population, and PDF generation capabilities.

### Branch Context
Current: main
Purpose: UX consistency across Quotes/Invoices/Contracts modules
Estimated Duration: ~3 hours (220 minutes total)

### Reference Implementation
- `/app/workspace/[companyId]/quotes/page.tsx` - Complete reference with all patterns
- `/src/lib/pdf/pdf.service.ts` - PDF generation service

---

## Phase 1: Invoices Consistency (~90 mins)

### 1.1 Line Item Dialog Pattern (30 mins)
- [ ] Task 1.1.1: Read current invoices page implementation
  - Notes: Understanding existing inline editing pattern
- [ ] Task 1.1.2: Create LineItemDialog component for invoices
  - Notes: Copy dialog pattern from quotes, adapt for invoice-specific fields
- [ ] Task 1.1.3: Add dialog state management
  - Notes: useState for open/close, editingItem for edit vs add mode
- [ ] Task 1.1.4: Replace inline editing with "Add Line Item" button
  - Notes: Remove inline form, add prominent button with Plus icon
- [ ] Task 1.1.5: Implement "Add Item" flow
  - Notes: Opens dialog with empty form
- [ ] Task 1.1.6: Implement "Edit Item" flow
  - Notes: Opens dialog pre-populated with existing item data
- [ ] Task 1.1.7: Add form validation in dialog
  - Notes: Required fields, numeric validation for amounts
- [ ] Task 1.1.8: Test line item CRUD operations
  - Notes: Verify add, edit, delete all work correctly

### 1.2 Default GL Account (15 mins)
- [ ] Task 1.2.1: Add "Default GL Account" select field to invoice settings area
  - Notes: Place near tax rate settings for consistency
- [ ] Task 1.2.2: Load saved default GL account from company settings
  - Notes: Use companyService.getCompany() to fetch settings
- [ ] Task 1.2.3: Pre-populate line items with default GL account
  - Notes: Auto-fill when adding new line items
- [ ] Task 1.2.4: Save default GL account changes
  - Notes: Update company settings in Firestore
- [ ] Task 1.2.5: Test default GL account persistence
  - Notes: Verify saves and loads correctly across sessions

### 1.3 Tax Rate Enhancements (10 mins)
- [ ] Task 1.3.1: Add tax rate field to company settings section
  - Notes: Input field with percentage validation
- [ ] Task 1.3.2: Pre-populate invoice line items with company tax rate
  - Notes: Auto-fill tax rate when adding new items
- [ ] Task 1.3.3: Allow per-item tax rate override
  - Notes: User can change tax rate on individual line items
- [ ] Task 1.3.4: Test tax calculation accuracy
  - Notes: Verify subtotal, tax, and total calculations

### 1.4 Helper Texts & UX Polish (10 mins)
- [ ] Task 1.4.1: Add helper text for invoice number field
  - Notes: "Auto-generated if left blank" or similar
- [ ] Task 1.4.2: Add helper text for GL account selection
  - Notes: Explain purpose of GL accounts briefly
- [ ] Task 1.4.3: Add helper text for line item dialog
  - Notes: Guide users on required vs optional fields
- [ ] Task 1.4.4: Improve empty state messaging
  - Notes: Clear call-to-action when no line items exist
- [ ] Task 1.4.5: Add loading states for async operations
  - Notes: Spinners/disabled states during saves

### 1.5 Smart GL Detection (10 mins)
- [ ] Task 1.5.1: Integrate industry knowledge base for invoices
  - Notes: Use existing industry-knowledge-base.ts
- [ ] Task 1.5.2: Implement description-based GL suggestion
  - Notes: Parse line item description, suggest appropriate GL account
- [ ] Task 1.5.3: Add suggestion UI indicator
  - Notes: Show "Suggested" badge or hint text
- [ ] Task 1.5.4: Test GL suggestions with various descriptions
  - Notes: Verify accuracy across different industries

### 1.6 PDF Generation for Invoices (15 mins)
- [ ] Task 1.6.1: Add "Print PDF" button to invoice actions
  - Notes: Place near Edit/Delete actions
- [ ] Task 1.6.2: Integrate pdf.service.ts for invoice generation
  - Notes: Call generateInvoicePDF() method
- [ ] Task 1.6.3: Format invoice data for PDF template
  - Notes: Map invoice fields to PDF structure
- [ ] Task 1.6.4: Add company logo to invoice PDF
  - Notes: Load from company settings if available
- [ ] Task 1.6.5: Test PDF generation with various invoice types
  - Notes: With/without logo, multiple line items, different tax rates

---

## Phase 2: Contracts Consistency (~90 mins)

### 2.1 Line Item Dialog Pattern (30 mins)
- [ ] Task 2.1.1: Read current contracts page implementation
  - Notes: Understanding existing patterns and differences
- [ ] Task 2.1.2: Create LineItemDialog component for contracts
  - Notes: Adapt from quotes/invoices, add contract-specific fields (recurring, start/end dates)
- [ ] Task 2.1.3: Add dialog state management
  - Notes: useState for dialog control and editing mode
- [ ] Task 2.1.4: Replace inline editing with "Add Line Item" button
  - Notes: Consistent with quotes/invoices pattern
- [ ] Task 2.1.5: Implement "Add Item" flow for contracts
  - Notes: Handle contract-specific fields like SLA terms
- [ ] Task 2.1.6: Implement "Edit Item" flow for contracts
  - Notes: Pre-populate with existing contract line item data
- [ ] Task 2.1.7: Add contract-specific form validation
  - Notes: Required fields, date validation, recurring frequency
- [ ] Task 2.1.8: Test contract line item CRUD operations
  - Notes: Comprehensive testing of add, edit, delete

### 2.2 Default GL Account (15 mins)
- [ ] Task 2.2.1: Add "Default GL Account" select to contract settings
  - Notes: Consistent placement with invoices/quotes
- [ ] Task 2.2.2: Load saved default GL account from company settings
  - Notes: Shared settings with quotes/invoices
- [ ] Task 2.2.3: Pre-populate contract line items with default GL
  - Notes: Auto-fill for new contract items
- [ ] Task 2.2.4: Save default GL account changes for contracts
  - Notes: Update company settings
- [ ] Task 2.2.5: Test default GL account persistence in contracts
  - Notes: Verify cross-session persistence

### 2.3 Tax Rate Enhancements (10 mins)
- [ ] Task 2.3.1: Add tax rate field to contract settings section
  - Notes: Consistent with quotes/invoices UI
- [ ] Task 2.3.2: Pre-populate contract line items with company tax rate
  - Notes: Auto-fill on new items
- [ ] Task 2.3.3: Allow per-item tax rate override in contracts
  - Notes: Flexibility for different contract terms
- [ ] Task 2.3.4: Test tax calculation for recurring contracts
  - Notes: Verify calculations for monthly/quarterly/annual contracts

### 2.4 Helper Texts & UX Polish (10 mins)
- [ ] Task 2.4.1: Add helper text for contract number field
  - Notes: "Auto-generated if left blank"
- [ ] Task 2.4.2: Add helper text for SLA/contract terms
  - Notes: Explain purpose and best practices
- [ ] Task 2.4.3: Add helper text for recurring frequency
  - Notes: Guide on choosing monthly vs quarterly vs annual
- [ ] Task 2.4.4: Improve empty state for contract line items
  - Notes: Clear guidance on adding first contract item
- [ ] Task 2.4.5: Add loading states for contract operations
  - Notes: Consistent with quotes/invoices patterns

### 2.5 Smart GL Detection (10 mins)
- [ ] Task 2.5.1: Integrate industry knowledge base for contracts
  - Notes: Use same system as quotes/invoices
- [ ] Task 2.5.2: Implement description-based GL suggestion for contracts
  - Notes: Parse contract descriptions, suggest GL accounts
- [ ] Task 2.5.3: Add suggestion UI indicator in contracts
  - Notes: Consistent visual treatment
- [ ] Task 2.5.4: Test GL suggestions with contract descriptions
  - Notes: Verify suggestions for recurring revenue scenarios

### 2.6 PDF Generation for Contracts (15 mins)
- [ ] Task 2.6.1: Add "Print PDF" button to contract actions
  - Notes: Consistent placement with invoices
- [ ] Task 2.6.2: Integrate pdf.service.ts for contract generation
  - Notes: Create generateContractPDF() method if needed
- [ ] Task 2.6.3: Format contract data for PDF template
  - Notes: Include SLA terms, recurring details, dates
- [ ] Task 2.6.4: Add company logo to contract PDF
  - Notes: Consistent with invoice/quote PDFs
- [ ] Task 2.6.5: Test PDF generation with various contract types
  - Notes: One-time vs recurring, different SLA terms

---

## Phase 3: Testing & Documentation (~40 mins)

### 3.1 Comprehensive Testing (20 mins)
- [ ] Task 3.1.1: Test complete invoice workflow end-to-end
  - Notes: Create, edit, add line items, generate PDF, verify data
- [ ] Task 3.1.2: Test complete contract workflow end-to-end
  - Notes: Create, edit, add line items, generate PDF, verify data
- [ ] Task 3.1.3: Test consistency across all three modules
  - Notes: Verify UI patterns match across quotes/invoices/contracts
- [ ] Task 3.1.4: Test default GL account across all modules
  - Notes: Verify same default applies to all three
- [ ] Task 3.1.5: Test tax rate consistency across modules
  - Notes: Verify tax calculations match patterns
- [ ] Task 3.1.6: Test PDF generation for all three modules
  - Notes: Compare PDFs for consistent branding and layout

### 3.2 Documentation (20 mins)
- [ ] Task 3.2.1: Create smoke-test-quotes-invoices-contracts-ux-consistency.md
  - Notes: Comprehensive testing guide for all implemented features
- [ ] Task 3.2.2: Update modernization-roadmap.md with completed items
  - Notes: Mark Phase 5 progress, move items to Recently Completed
- [ ] Task 3.2.3: Create QUOTES-INVOICES-CONTRACTS-UX-SUMMARY.md
  - Notes: Technical summary of changes, patterns used, files modified
- [ ] Task 3.2.4: Document PDF generation patterns
  - Notes: How to use pdf.service.ts, customization options
- [ ] Task 3.2.5: Update any relevant phase-specific documentation
  - Notes: Phase 5 or Phase 6 docs if applicable

---

## Modified Components
- `/app/workspace/[companyId]/invoices/page.tsx`
- `/app/workspace/[companyId]/contracts/page.tsx`
- `/src/lib/pdf/pdf.service.ts` (potential enhancements)
- `/src/lib/firebase/companies-service.ts` (for default GL account settings)

## Notes
- All patterns are proven in quotes page - direct copy and adapt approach
- PDF service already exists, just needs integration
- Tax calculations should be consistent across all three modules
- Default GL account is stored at company level, shared across modules
- Each phase is independent and can be tested incrementally
- Maintain consistent UI/UX language across all three modules

## Context Management
- Total tasks: 46 individual items across 3 phases
- This is a medium-complexity feature with proven patterns
- Reference implementation (quotes) significantly reduces risk
- Expected to complete in single session (~3 hours)
