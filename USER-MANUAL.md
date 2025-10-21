# PeakFlow Financial Management System - User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Visual Guides](#visual-guides)
3. [Getting Started - Authentication & Setup](#getting-started)
4. [User Journeys](#user-journeys)
   - [Journey 1: Accounts Receivable (AR) - Quote to Cash](#journey-1-accounts-receivable)
   - [Journey 2: Accounts Payable (AP) - Purchase to Pay](#journey-2-accounts-payable)
   - [Journey 3: Bank & Cash Management](#journey-3-bank-cash-management)
   - [Journey 4: Bank Reconciliation](#journey-4-bank-reconciliation)
   - [Journey 5: Customer Relationship Management](#journey-5-customer-management)
   - [Journey 6: Supplier Management](#journey-6-supplier-management)
   - [Journey 7: General Ledger & Reporting](#journey-7-general-ledger-reporting)
   - [Journey 8: Multi-Tenant Company Management](#journey-8-multi-tenant-management)
5. [Feature Reference](#feature-reference)

---

## System Overview

**PeakFlow** is a comprehensive financial management system built for modern businesses. It combines:
- **Full accounting capabilities** with double-entry bookkeeping
- **Multi-tenant architecture** supporting managed accounts
- **Automated document processing** with AI-powered PDF extraction
- **Complete AR/AP lifecycle management**
- **Intelligent bank reconciliation** with auto-matching
- **Real-time financial reporting** and analytics

### Core Value Proposition
PeakFlow tells the story of your business finances from **quote to cash** and **purchase to pay**, with complete audit trails, automated workflows, and intelligent automation.

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **AI/ML**: Gemini 2.0 for document extraction & pattern recognition
- **Industry Templates**: 13 pre-configured templates with 889+ GL accounts

---

## Visual Guides

**PeakFlow includes 30 interactive annotated screenshots** documenting every major feature and workflow. These visual guides complement this user manual by showing you exactly what each screen looks like.

### How to Use Visual Guides

1. **Browse All Screens**: Open [Visual Guides Index](/visual-guides/index.html) or navigate to `http://localhost:3000/visual-guides/index.html`
2. **Navigate by Journey**: Each user journey below has links to relevant visual guides
3. **Interactive Annotations**: Every screenshot has numbered badges explaining features
4. **Technical Details**: Click to expand technical implementation details
5. **No Server Required**: All HTML files are self-contained and work offline

### Visual Guide Index by Journey

- **Journey 0: Getting Started** (3 screens)
  - [01 - Signup](/visual-guides/0-getting-started/01-signup.html)
  - [02 - Company Creation](/visual-guides/0-getting-started/02-company-creation.html)
  - [03 - Onboarding Complete](/visual-guides/0-getting-started/03-onboarding-complete.html)

- **Journey 1: Accounts Receivable** (7 screens)
  - [04 - Quotes List](/visual-guides/1-accounts-receivable/04-quotes-list.html)
  - [05 - Create Quote](/visual-guides/1-accounts-receivable/05-quote-create.html)
  - [06 - Invoices List](/visual-guides/1-accounts-receivable/06-invoices-list.html)
  - [07 - Create Invoice](/visual-guides/1-accounts-receivable/07-invoice-create.html)
  - [08 - Invoice Detail](/visual-guides/1-accounts-receivable/08-invoice-detail.html)
  - [09 - Record Payment](/visual-guides/1-accounts-receivable/09-record-payment.html)
  - [10 - Customer Statements](/visual-guides/1-accounts-receivable/10-customer-statements.html)

- **Journey 2: Accounts Payable** (5 screens)
  - [11 - Purchase Orders List](/visual-guides/2-accounts-payable/11-purchase-orders-list.html)
  - [12 - Vendor Bills List](/visual-guides/2-accounts-payable/12-vendor-bills-list.html)
  - [13 - Create Vendor Bill](/visual-guides/2-accounts-payable/13-vendor-bill-create.html)
  - [14 - Vendor Payments](/visual-guides/2-accounts-payable/14-vendor-payments.html)
  - [15 - Supplier Statements](/visual-guides/2-accounts-payable/15-supplier-statements.html)

- **Journey 3: Bank & Cash Management** (5 screens)
  - [16 - Bank Import](/visual-guides/3-bank-reconciliation/16-bank-import.html)
  - [17 - Bank Statements List](/visual-guides/3-bank-reconciliation/17-bank-statements-list.html)
  - [18 - Reconciliation Workspace](/visual-guides/3-bank-reconciliation/18-reconciliation-workspace.html)
  - [19 - Auto-Match Results](/visual-guides/3-bank-reconciliation/19-reconciliation-auto-match.html)
  - [20 - Cash Flow Dashboard](/visual-guides/3-bank-reconciliation/20-cash-flow-dashboard.html)

- **Journey 4: Customer Management** (2 screens)
  - [21 - Customers List](/visual-guides/4-customer-management/21-customers-list.html)
  - [22 - Customer Detail](/visual-guides/4-customer-management/22-customer-detail.html)

- **Journey 5: Supplier Management** (2 screens)
  - [23 - Suppliers List](/visual-guides/5-supplier-management/23-suppliers-list.html)
  - [24 - Supplier Detail](/visual-guides/5-supplier-management/24-supplier-detail.html)

- **Journey 6: General Ledger & Reporting** (4 screens)
  - [25 - Journal Entries](/visual-guides/6-general-ledger/25-journal-entries.html)
  - [26 - Chart of Accounts](/visual-guides/6-general-ledger/26-chart-of-accounts.html)
  - [27 - Reports Dashboard](/visual-guides/6-general-ledger/27-reports-dashboard.html)
  - [28 - Trial Balance](/visual-guides/6-general-ledger/28-trial-balance.html)

- **Journey 7: Multi-Tenant & Dashboard** (2 screens)
  - [29 - Company Selector](/visual-guides/7-multi-tenant/29-company-selector.html)
  - [30 - Dashboard](/visual-guides/7-multi-tenant/30-dashboard.html)

### About the Visual Guides

- **30 Total Screens**: Covering all major workflows
- **200+ Annotations**: Detailed explanations on each screen
- **Mock Data**: Realistic business data (TechVentures Ltd)
- **Self-Contained**: Open directly in any browser, no server needed
- **Responsive**: Works on desktop and tablet viewports

For more information, see the [Visual Guides README](/visual-guides/README-VISUAL-GUIDES.md).

---

## Getting Started - Authentication & Setup

### Journey 0: Onboarding Flow

**📸 Visual Guides**: [Signup](/visual-guides/0-getting-started/01-signup.html) | [Company Creation](/visual-guides/0-getting-started/02-company-creation.html) | [Dashboard](/visual-guides/0-getting-started/03-onboarding-complete.html)

---

#### 1. User Registration
**Route**: `/signup`
**Visual Guide**: [View Screenshot →](/visual-guides/0-getting-started/01-signup.html)

**Story**: A new user discovers PeakFlow and wants to start managing their business finances.

**Steps**:
1. Navigate to the signup page
2. Enter email, password, and basic information
3. Verify email address
4. System creates user account with Firebase Authentication

**Outcome**: User account created, ready for company setup

---

#### 2. Company Creation & Industry Template Selection
**Route**: After login → Company creation wizard
**Visual Guide**: [View Screenshot →](/visual-guides/0-getting-started/02-company-creation.html)

**Story**: The user needs to set up their first company. PeakFlow intelligently suggests an industry template based on the company name and description.

**Steps**:
1. Enter company details:
   - Company name
   - Company type (Corporate or Managed Account)
   - Tax registration details
   - Base currency
   - Fiscal year settings
   - Industry description (optional)

2. **Smart Industry Detection**:
   - PeakFlow analyzes company name and description
   - Suggests appropriate industry template from 13 options:
     - General Business
     - Retail & E-Commerce
     - Professional Services
     - Construction & Real Estate
     - Manufacturing
     - Food & Beverage
     - Healthcare
     - Technology & Software
     - Beauty & Wellness
     - Pharmaceutical & Medical Supplies
     - And more...

3. **Automated Chart of Accounts Setup**:
   - System provisions complete Chart of Accounts based on selected industry
   - Pre-configured GL accounts (Assets, Liabilities, Equity, Revenue, Expenses)
   - Industry-specific accounts automatically created
   - Transaction patterns and vendor mappings loaded

4. **Company Dashboard Access**:
   - Redirected to `/workspace/[companyId]/dashboard`
   - Ready to start financial operations

**Outcome**:
- Company created with complete accounting structure
- Industry-specific GL accounts ready to use
- Transaction patterns configured for auto-matching
- No manual account setup required

**Technical Details**:
- 889+ pre-configured GL accounts across all templates
- 274 transaction patterns for 75-88% auto-matching accuracy
- 238 vendor mappings for automatic recognition
- Company list shows applied industry template visually

---

#### 3. Initial Configuration
**Route**: `/workspace/[companyId]/settings`

**Story**: Before transacting, the user configures key financial settings.

**Steps**:
1. **Chart of Accounts Review** (already pre-loaded from template):
   - Review industry-specific accounts
   - Add custom accounts if needed
   - Navigate to `/workspace/[companyId]/chart-of-accounts`

2. **Bank Account Setup**:
   - Navigate to Settings or Bank Import
   - Add primary bank account details
   - Configure account for reconciliation

3. **User Access Management** (if multi-tenant):
   - Invite team members
   - Assign roles (Admin, Financial Admin, User)
   - Configure permissions

**Outcome**: System configured and ready for financial transactions

---

## User Journeys

## Journey 1: Accounts Receivable (AR) - Quote to Cash

**Route**: `/workspace/[companyId]/quotes` → `/workspace/[companyId]/invoices` → `/workspace/[companyId]/statements`

**Story**: From prospect to payment - the complete revenue cycle.

**📸 Visual Guides**: [Quotes List](/visual-guides/1-accounts-receivable/04-quotes-list.html) | [Create Quote](/visual-guides/1-accounts-receivable/05-quote-create.html) | [Invoices List](/visual-guides/1-accounts-receivable/06-invoices-list.html) | [Create Invoice](/visual-guides/1-accounts-receivable/07-invoice-create.html) | [Invoice Detail](/visual-guides/1-accounts-receivable/08-invoice-detail.html) | [Record Payment](/visual-guides/1-accounts-receivable/09-record-payment.html) | [Customer Statements](/visual-guides/1-accounts-receivable/10-customer-statements.html)

---

### Step 1: Create a Quote
**Starting Point**: `/workspace/[companyId]/quotes`

**Scenario**: A potential customer requests a quote for services/products.

**Actions**:
1. Click "New Quote" button
2. Fill in quote details:
   - Select or create customer (debtor)
   - Add line items (products/services)
   - Set quantities and prices
   - Apply discounts if applicable
   - Set tax rates
   - Add notes and terms
3. Set quote validity period
4. Save as Draft or Send to Customer
5. **Generate PDF**: System creates professional quote PDF with company branding

**Data Created**:
- Quote record in Firestore
- Quote number (auto-generated)
- PDF document in Firebase Storage

**Next Steps**:
- Email quote to customer
- Track quote status (Pending, Accepted, Rejected, Expired)
- Convert to Sales Order when accepted

---

### Step 2: Convert Quote to Sales Order (Optional)
**Route**: `/workspace/[companyId]/quotes` → Sales Order conversion

**Scenario**: Customer accepts the quote, and you want to track order fulfillment.

**Actions**:
1. Open accepted quote
2. Click "Convert to Sales Order"
3. Review and confirm line items
4. Set delivery/fulfillment dates
5. Create Sales Order

**Data Created**:
- Sales Order record linked to original quote
- Fulfillment tracking enabled

**Technical Note**: Sales Orders are optional - you can also convert quotes directly to invoices.

---

### Step 3: Generate Invoice
**Route**: `/workspace/[companyId]/invoices`

**Scenario**: Work completed or goods shipped - time to bill the customer.

**Actions**:
1. **From Quote/Sales Order**:
   - Click "Convert to Invoice" on quote or sales order
   - System pre-fills all line items

   **OR**

2. **Create New Invoice Directly**:
   - Click "New Invoice"
   - Select customer
   - Add line items manually

3. Review invoice details:
   - Customer information
   - Line items with descriptions, quantities, prices
   - Tax calculations (line-level or document-level)
   - Payment terms
   - Due date
   - PO Number (if applicable)

4. **Post to General Ledger**:
   - System automatically creates double-entry journal entries:
     - **Debit**: Accounts Receivable (Asset account)
     - **Credit**: Revenue account (by product/service)
     - Tax entries if applicable

5. Generate and send invoice PDF

**Data Created**:
- Invoice record with status "Outstanding"
- Journal entry in General Ledger
- Ledger entries with full audit trail:
  - Account codes and names
  - Transaction descriptions
  - Customer dimensions (for AR sub-ledger)
  - Invoice reference
- PDF document

**General Ledger Impact**:
```
Journal Entry: INV-2025-0001 - Customer Name
--------------------------------------------------
Account                          Debit      Credit
--------------------------------------------------
1200 - Accounts Receivable     $1,150.00
4000 - Service Revenue                    $1,000.00
2200 - Sales Tax Payable                    $150.00
--------------------------------------------------
Description: Invoice INV-2025-0001 - Customer Name
Dimensions: { customerId: "xxx", invoiceId: "yyy" }
```

**View in System**:
- Navigate to `/workspace/[companyId]/journal` to see all posted entries
- Each entry shows account code, name, description, and customer details

---

### Step 4: Record Customer Payment
**Route**: `/workspace/[companyId]/invoices` → Payment recording

**Scenario**: Customer pays the invoice (full or partial payment).

**Actions**:
1. Open outstanding invoice
2. Click "Record Payment"
3. Enter payment details:
   - Payment date
   - Amount received
   - Payment method (Bank Transfer, Cash, Check, Credit Card)
   - Bank account where funds were deposited
   - Reference number
4. **Allocate Payment**:
   - System automatically allocates to invoice
   - Supports partial payments
   - Handles overpayments
5. Confirm payment

**Data Created**:
- Payment record linked to invoice
- Automatic journal entry:
  - **Debit**: Bank Account (Asset)
  - **Credit**: Accounts Receivable (Asset)
- Payment allocation record
- Invoice status updated (Partial Paid / Fully Paid)

**General Ledger Impact**:
```
Journal Entry: Payment for INV-2025-0001
--------------------------------------------------
Account                          Debit      Credit
--------------------------------------------------
1100 - Bank Account            $1,150.00
1200 - Accounts Receivable                $1,150.00
--------------------------------------------------
```

---

### Step 5: Generate Customer Statements
**Route**: `/workspace/[companyId]/statements`

**Scenario**: Month-end - send statement of account to all customers with outstanding balances.

**Actions**:
1. Navigate to Customer Statements
2. Select customer(s)
3. Set statement period (e.g., January 2025)
4. **System Generates Statement**:
   - Opening balance
   - All invoices issued in period
   - All payments received
   - Credits/adjustments
   - Aging analysis (Current, 30 days, 60 days, 90+ days)
   - Closing balance
5. Generate PDF statement
6. Email or download

**Data Source**:
- Queries General Ledger using customer dimensions
- All AR transactions for specific customer
- Real-time balance calculation

**Enabled By**: Phase 1 GL enhancements (account names, descriptions, customer dimensions)

---

### Step 6: Handle Credit Notes (Returns/Adjustments)
**Route**: `/workspace/[companyId]/credit-notes`

**Scenario**: Customer returns goods or disputes charges - issue a credit note.

**Actions**:
1. Click "New Credit Note"
2. Select original invoice (or create standalone)
3. Specify credit reason:
   - Goods returned
   - Pricing error
   - Goodwill adjustment
   - Other
4. Enter line items to credit
5. Post credit note

**Data Created**:
- Credit note record
- Reversal journal entry:
  - **Debit**: Revenue account (reversal)
  - **Credit**: Accounts Receivable (reduce customer balance)
- Linked to original invoice
- Updated customer balance

---

### Journey 1 Summary - AR Cycle Complete
**The Story**:
1. Quote sent → Customer accepts
2. Invoice generated → Posted to GL
3. Payment received → AR cleared
4. Statement generated → Customer reconciliation
5. Credits handled → Adjustments tracked

**Key Features**:
- Complete audit trail in General Ledger
- Automated GL posting (no manual journal entries needed)
- Customer subsidiary ledger (query all customer transactions)
- Professional PDF documents
- Real-time AR aging
- Customer statement generation

---

## Journey 2: Accounts Payable (AP) - Purchase to Pay

**Route**: `/workspace/[companyId]/purchase-orders` → `/workspace/[companyId]/vendor-bills` → `/workspace/[companyId]/vendor-payments`

**Story**: From purchase request to supplier payment - the complete procurement cycle.

**📸 Visual Guides**: [Purchase Orders](/visual-guides/2-accounts-payable/11-purchase-orders-list.html) | [Vendor Bills](/visual-guides/2-accounts-payable/12-vendor-bills-list.html) | [Create Bill](/visual-guides/2-accounts-payable/13-vendor-bill-create.html) | [Vendor Payments](/visual-guides/2-accounts-payable/14-vendor-payments.html) | [Supplier Statements](/visual-guides/2-accounts-payable/15-supplier-statements.html)

---

### Step 1: Create Purchase Order
**Starting Point**: `/workspace/[companyId]/purchase-orders`

**Scenario**: You need to order inventory or services from a supplier.

**Actions**:
1. Click "New Purchase Order"
2. Fill in PO details:
   - Select or create supplier (creditor)
   - Add line items (products/services to purchase)
   - Set quantities and agreed prices
   - Add delivery instructions
   - Set expected delivery date
3. Set PO approval workflow (if configured)
4. Save as Draft or Send to Supplier
5. Generate PO PDF document

**Data Created**:
- Purchase Order record
- PO number (auto-generated)
- Status tracking (Draft, Sent, Acknowledged, Partially Received, Completed)

**Note**: PO is a commitment, not yet a financial transaction (no GL posting yet)

---

### Step 2: Receive Goods/Services
**Route**: Purchase Order → Goods Receipt

**Scenario**: Supplier delivers goods or completes services.

**Actions**:
1. Open Purchase Order
2. Click "Receive Goods"
3. Confirm quantities received:
   - Full receipt
   - Partial receipt (if delivery split)
4. Update PO status
5. Note any discrepancies

**Data Created**:
- Goods receipt record
- PO status updated
- Trigger for vendor bill creation

---

### Step 3: Record Vendor Bill (Supplier Invoice)
**Route**: `/workspace/[companyId]/vendor-bills`

**Scenario**: Supplier sends their invoice for goods/services received.

**Actions**:
1. **Option A - From Purchase Order**:
   - Open received PO
   - Click "Create Vendor Bill"
   - System pre-fills from PO

   **Option B - Standalone Bill**:
   - Click "New Vendor Bill"
   - Enter details manually

   **Option C - AI Upload**:
   - Upload supplier invoice PDF
   - Gemini AI extracts data
   - Review and confirm

2. Verify bill details:
   - Supplier information
   - Bill number and date
   - Line items and amounts
   - Tax calculations
   - Payment terms
   - Due date

3. **Three-Way Match** (if from PO):
   - PO quantities vs. Goods Receipt vs. Vendor Bill
   - Flag discrepancies for review

4. **Post to General Ledger**:
   - System creates journal entries:
     - **Debit**: Expense or Inventory accounts
     - **Debit**: Tax Recoverable (if applicable)
     - **Credit**: Accounts Payable (Liability)

**Data Created**:
- Vendor bill record with status "Unpaid"
- Journal entry in General Ledger
- Ledger entries with supplier dimensions
- AP liability established

**General Ledger Impact**:
```
Journal Entry: Bill BILL-2025-0042 - ABC Suppliers Ltd
----------------------------------------------------------
Account                          Debit      Credit
----------------------------------------------------------
5100 - Office Supplies         $   850.00
1150 - Input VAT               $   127.50
2100 - Accounts Payable                    $   977.50
----------------------------------------------------------
Description: Vendor Bill BILL-2025-0042 - ABC Suppliers Ltd
Dimensions: { supplierId: "xxx", billId: "yyy" }
```

---

### Step 4: Schedule Vendor Payment
**Route**: `/workspace/[companyId]/vendor-payments`

**Scenario**: Time to pay your suppliers - single or batch payment.

**Actions**:
1. Navigate to Vendor Payments
2. **Select Bills to Pay**:
   - View all unpaid bills
   - Filter by due date, supplier, amount
   - Select bills for payment (single or multiple)
3. **Create Payment Batch**:
   - Choose payment date
   - Select bank account for payment
   - Review total payment amount
4. **Payment Methods**:
   - Bank transfer (EFT)
   - Check
   - Credit card
   - Cash
5. Enter payment references
6. **Post Payment**:
   - Creates journal entries:
     - **Debit**: Accounts Payable (clear liability)
     - **Credit**: Bank Account (cash out)
7. Generate payment remittance advice for supplier

**Data Created**:
- Vendor payment record
- Payment allocation to bills
- Journal entry
- Bank account balance updated
- Bill status updated (Paid)

**General Ledger Impact**:
```
Journal Entry: Payment for Bills BILL-2025-0042, BILL-2025-0043
------------------------------------------------------------------
Account                          Debit      Credit
------------------------------------------------------------------
2100 - Accounts Payable        $2,127.50
1100 - Bank Account                       $2,127.50
------------------------------------------------------------------
```

---

### Step 5: Generate Supplier Statements
**Route**: `/workspace/[companyId]/supplier-statements`

**Scenario**: Reconcile your records with supplier monthly statements.

**Actions**:
1. Navigate to Supplier Statements
2. Select supplier
3. Set reconciliation period
4. **System Shows**:
   - All bills received
   - All payments made
   - Outstanding balance
   - Aging analysis
5. Compare with supplier statement
6. Identify discrepancies
7. Resolve differences (credit notes, disputed charges, etc.)

**Data Source**:
- Queries General Ledger using supplier dimensions
- All AP transactions for specific supplier

---

### Step 6: Handle Supplier Credits
**Scenario**: Supplier issues credit for returns or adjustments.

**Actions**:
1. Record supplier credit note
2. Apply against outstanding bills
3. System creates journal entry:
   - **Debit**: Accounts Payable (reduce liability)
   - **Credit**: Expense account (reversal) or Bank (refund)

---

### Journey 2 Summary - AP Cycle Complete
**The Story**:
1. Purchase Order created → Goods ordered
2. Goods received → Receipt confirmed
3. Vendor bill recorded → Posted to GL
4. Payment scheduled → AP cleared
5. Supplier statement reconciled → Records verified

**Key Features**:
- Three-way matching (PO / Receipt / Bill)
- Automated GL posting
- Batch payment processing
- Supplier subsidiary ledger
- AI-powered bill extraction from PDFs
- Payment scheduling and remittance
- Complete audit trail

---

## Journey 3: Bank & Cash Management

**Route**: `/workspace/[companyId]/bank-statements` → `/workspace/[companyId]/bank-import`

**Story**: Managing cash flow and bank accounts - the lifeblood of business operations.

**📸 Visual Guides**: [Bank Import](/visual-guides/3-bank-reconciliation/16-bank-import.html) | [Bank Statements](/visual-guides/3-bank-reconciliation/17-bank-statements-list.html) | [Cash Flow](/visual-guides/3-bank-reconciliation/20-cash-flow-dashboard.html)

---

### Step 1: Bank Account Setup
**Route**: Settings or Admin → Bank Accounts

**Scenario**: Configure your business bank accounts in PeakFlow.

**Actions**:
1. Navigate to Bank Account Management
2. Add new bank account:
   - Bank name
   - Account number (masked for security)
   - Account type (Checking, Savings, Credit Card, etc.)
   - Currency
   - Opening balance
   - Opening date
   - Link to GL account (1100 - Bank Account)
3. Configure account for reconciliation
4. Set as default account (optional)

**Data Created**:
- Bank account master record
- Initial balance in GL (if opening balance provided)

---

### Step 2: Import Bank Statements
**Route**: `/workspace/[companyId]/bank-import`

**Scenario**: Upload your monthly bank statement PDF for processing.

**Actions**:
1. Navigate to Bank Import
2. Select bank account
3. **Upload Bank Statement PDF**:
   - Drag and drop or browse file
   - Supports multi-page PDFs
4. **AI-Powered Extraction** (Gemini 2.0):
   - Extracts all transactions automatically
   - Identifies dates, descriptions, debits, credits
   - Calculates opening and closing balances
5. **Review Extracted Data**:
   - Verify transaction list
   - Check balance calculations
   - Correct any extraction errors
6. **Apply Industry Patterns**:
   - System matches transactions to patterns from industry template
   - 274 pre-configured transaction patterns
   - 238 vendor mappings
   - 75-88% auto-recognition rate
7. **Direct Bank-to-Ledger Import**:
   - Option to post unmatched transactions directly to GL
   - Select GL accounts for each transaction
   - System creates journal entries automatically
8. Save bank statement

**Data Created**:
- Bank statement record with all transactions
- Statement period (start/end dates)
- Opening and closing balances
- Individual transaction records ready for reconciliation

**Technical Note**: This is the critical feature for SMEs - direct import without manual reconciliation required for simple cash businesses.

---

### Step 3: Cash Flow Monitoring
**Route**: `/workspace/[companyId]/cash-flow`

**Scenario**: Monitor cash position and forecast future cash flows.

**Actions**:
1. Navigate to Cash Flow dashboard
2. **View Current Cash Position**:
   - All bank account balances
   - Total cash available
   - By currency if multi-currency
3. **Cash Flow Analysis**:
   - Cash inflows (customer payments, other receipts)
   - Cash outflows (supplier payments, expenses)
   - Net cash flow
4. **Forecast Future Cash** (if enabled):
   - Upcoming receivables (AR aging)
   - Upcoming payables (AP aging)
   - Projected cash position
5. **Cash Flow Reports**:
   - Cash flow statement (operating, investing, financing)
   - Daily/Weekly/Monthly cash position
   - Variance analysis

**Data Source**:
- Real-time from General Ledger
- Bank account balances
- AR/AP aging schedules
- Recurring invoice schedules

---

### Step 4: Bank Transfers (Between Accounts)
**Scenario**: Move funds between your own bank accounts.

**Actions**:
1. Initiate transfer from bank account A to bank account B
2. Enter transfer amount
3. System creates journal entries:
   - **Debit**: Bank Account B (increase)
   - **Credit**: Bank Account A (decrease)
4. Record appears in both accounts for reconciliation

**Note**: Currently deferred to Phase 6 - Multi-Tenant features

---

### Journey 3 Summary - Bank Management Complete
**The Story**:
1. Bank accounts configured → Connected to GL
2. Statements uploaded → AI extracts transactions
3. Direct posting option → Unmatched transactions to GL
4. Cash flow monitored → Real-time visibility
5. Transfers recorded → Inter-account movements tracked

**Key Features**:
- Gemini AI-powered PDF extraction
- Industry-specific transaction pattern recognition
- Direct bank-to-ledger import for SMEs
- Multi-bank account support
- Multi-currency support
- Real-time cash position
- Automated balance calculations

---

## Journey 4: Bank Reconciliation

**Route**: `/workspace/[companyId]/reconciliation`

**Story**: Match bank statement transactions with your GL records - ensuring accuracy and detecting discrepancies.

**📸 Visual Guides**: [Reconciliation Workspace](/visual-guides/3-bank-reconciliation/18-reconciliation-workspace.html) | [Auto-Match Results](/visual-guides/3-bank-reconciliation/19-reconciliation-auto-match.html)

---

### Step 1: Start Reconciliation
**Starting Point**: `/workspace/[companyId]/reconciliation`

**Scenario**: Month-end - reconcile your bank statement with GL records.

**Actions**:
1. Navigate to Reconciliation workspace
2. Select bank account to reconcile
3. Select bank statement (already imported from Journey 3)
4. Set reconciliation period
5. **System Displays**:
   - **Left Panel**: Bank statement transactions (from uploaded PDF)
   - **Right Panel**: GL transactions (posted journal entries affecting this bank account)
   - **Status Bar**: Opening balance, total debits/credits, closing balance

---

### Step 2: Automatic Matching
**Scenario**: Let PeakFlow auto-match transactions using AI patterns.

**Actions**:
1. Click "Auto-Match" button
2. **Pattern Recognition Engine**:
   - Uses industry template transaction patterns
   - Matches by amount + date proximity
   - Matches by vendor name recognition
   - Uses machine learning from previous matches
   - Confidence scoring for each match
3. **Review Auto-Matches**:
   - High confidence (90%+): Auto-accept
   - Medium confidence (70-89%): Review
   - Low confidence (<70%): Manual review
4. Confirm accepted matches

**Outcome**: 75-88% of transactions auto-matched (depending on industry and transaction complexity)

---

### Step 3: Manual Matching
**Scenario**: Handle transactions that couldn't be auto-matched.

**Actions**:
1. **Drag and Drop Matching**:
   - Drag bank transaction to corresponding GL transaction
   - System creates match link
   - Both sides marked as reconciled
2. **One-to-Many Matches**:
   - Single bank deposit = multiple invoice payments
   - Drag all GL transactions to single bank transaction
3. **Many-to-One Matches**:
   - Multiple small bank transactions = single large payment
4. **Partial Matches**:
   - Handle bank fees, currency differences
5. **Split Transactions**:
   - Single bank transaction = multiple purposes
   - Split into components and match separately

**Data Created**:
- Reconciliation match records
- Link between bank transactions and GL entries
- Match confidence scores
- Match method (auto, manual, split)

---

### Step 4: Handle Unmatched Items
**Scenario**: Transactions on one side but not the other - requires investigation.

**Types of Unmatched Items**:

#### A. Bank Transaction, No GL Entry (Bank shows, books don't)
**Common Reasons**:
- Bank fees not yet recorded
- Customer direct deposit (unknown payment)
- Bank interest
- Errors or unauthorized transactions

**Actions**:
1. Identify unmatched bank transaction
2. Investigate source
3. **Create GL Entry**:
   - Click "Create Journal Entry" from unmatched item
   - System pre-fills from bank transaction
   - Select appropriate GL account (income, expense, etc.)
   - Post journal entry
4. Auto-match now possible

**Example Journal**:
```
Bank Fee Transaction
----------------------------------------------------------
Account                          Debit      Credit
----------------------------------------------------------
5500 - Bank Charges            $    15.00
1100 - Bank Account                       $    15.00
----------------------------------------------------------
```

#### B. GL Entry, No Bank Transaction (Books show, bank doesn't)
**Common Reasons**:
- Check not yet cleared
- Electronic payment in transit
- Timing difference
- Recording error

**Actions**:
1. Identify unmatched GL transaction
2. Verify in bank statement
3. **If Timing Issue**:
   - Leave unmatched for current period
   - Will match in next period when clears
4. **If Error**:
   - Reverse incorrect journal entry
   - Re-record correctly

---

### Step 5: Complete Reconciliation
**Scenario**: All items matched or explained - ready to close reconciliation.

**Actions**:
1. **Verify Balancing**:
   - GL opening balance = Bank opening balance
   - GL closing balance (after matches) = Bank closing balance
   - All items accounted for
2. **Review Unmatched Items**:
   - Document why items unmatched (timing, errors, etc.)
   - Plan corrective actions
3. **Lock Reconciliation**:
   - Mark period as reconciled
   - System creates reconciliation report
   - Prevents changes to matched transactions (audit control)

**Data Created**:
- Reconciliation completion record
- Reconciliation report (PDF)
- Period lock (optional)
- Audit trail of all matches

**Reports Generated**:
- Reconciliation summary
- Unmatched items report
- Adjusting journal entries required
- Reconciliation certificate (for audit)

---

### Step 6: Period Close
**Route**: Admin → Fiscal Periods

**Scenario**: After successful reconciliation, close the accounting period.

**Actions**:
1. Navigate to Fiscal Period Management
2. Select period (e.g., January 2025)
3. **Pre-Close Checklist**:
   - All bank accounts reconciled ✓
   - All transactions posted ✓
   - AR/AP aged and reviewed ✓
   - Adjusting entries completed ✓
4. **Close Period**:
   - System locks all transactions in period
   - Prevents backdating or changes
   - Calculates period-end balances
5. Generate period-end reports

**Outcome**:
- Period locked for changes
- Data integrity ensured
- Ready for financial reporting
- Compliance requirement met

---

### Journey 4 Summary - Reconciliation Complete
**The Story**:
1. Bank statement uploaded → Transactions extracted
2. Auto-match initiated → 75-88% matched automatically
3. Manual matches → Remaining items matched by drag-drop
4. Unmatched items → Investigated and resolved
5. Period reconciled → Locked and reported
6. Fiscal period closed → Audit trail complete

**Key Features**:
- AI-powered auto-matching with industry patterns
- Drag-and-drop manual matching interface
- One-to-many and many-to-one matching
- Split transaction handling
- Create GL entries from unmatched bank items
- Direct bank-to-ledger import (alternative to reconciliation)
- Reconciliation reports and audit trail
- Period locking for compliance

---

## Journey 5: Customer Relationship Management

**Route**: `/workspace/[companyId]/customers`

**Story**: Manage your customer master data, credit limits, payment terms, and relationship history.

**📸 Visual Guides**: [Customers List](/visual-guides/4-customer-management/21-customers-list.html) | [Customer Detail](/visual-guides/4-customer-management/22-customer-detail.html)

---

### Step 1: Create Customer (Debtor) Record
**Starting Point**: `/workspace/[companyId]/customers`

**Scenario**: Onboard a new customer before creating quotes or invoices.

**Actions**:
1. Click "New Customer"
2. Enter customer details:
   - **Basic Information**:
     - Customer name
     - Trading name (if different)
     - Customer type (Individual, Business)
     - Customer category/tags
   - **Contact Information**:
     - Primary contact person
     - Email address
     - Phone numbers
     - Physical address
     - Billing address (if different)
   - **Financial Terms**:
     - Payment terms (Net 30, Net 60, etc.)
     - Credit limit
     - Currency preference
     - Tax registration number (VAT/GST)
     - Tax exempt status
   - **Banking Details** (for direct deposits):
     - Bank name
     - Account number
     - Account holder name
3. Set customer status (Active, Inactive, On Hold)
4. Add notes or special instructions
5. Save customer record

**Data Created**:
- Customer master record in Firestore
- Customer ID (auto-generated)
- Customer linked to company (tenant isolation)

---

### Step 2: Customer Credit Management
**Scenario**: Monitor and manage customer credit limits.

**Actions**:
1. Open customer record
2. **View Credit Information**:
   - Credit limit set
   - Current AR balance
   - Available credit remaining
   - Aging analysis (Current, 30, 60, 90+ days)
3. **Credit Hold Management**:
   - If balance exceeds limit → System alerts
   - Option to place customer on credit hold
   - Blocks new invoices until resolved
4. **Adjust Credit Limit**:
   - Increase/decrease based on payment history
   - Document reason for change
   - Approval workflow (if configured)

**Business Rule**: System warns when creating invoice would exceed customer credit limit.

---

### Step 3: Customer Transaction History
**Scenario**: View complete relationship history with customer.

**Actions**:
1. Open customer record
2. Navigate to "Transaction History" tab
3. **View All Activities**:
   - All quotes sent
   - All invoices issued
   - All payments received
   - All credit notes issued
   - All statements sent
   - Communication history
4. **Filter and Search**:
   - By date range
   - By transaction type
   - By status
5. **Quick Actions**:
   - Create new quote/invoice
   - Record payment
   - Send statement
   - Send email

**Data Source**: Aggregated from all modules (quotes, invoices, payments, statements)

---

### Step 4: Customer Communications
**Scenario**: Track all communications with customer.

**Actions**:
1. **Automated Emails**:
   - Quote sent notification
   - Invoice sent notification
   - Payment reminder (overdue invoices)
   - Statement sent notification
2. **Manual Notes**:
   - Add notes to customer record
   - Log phone calls
   - Record meetings
   - Track issues/disputes
3. **Document Attachments**:
   - Attach contracts
   - Attach correspondence
   - Attach supporting documents

---

### Step 5: Customer Reporting & Analytics
**Route**: Customers list → Reports

**Scenario**: Analyze customer portfolio and identify top customers, slow payers, etc.

**Reports Available**:
1. **Customer AR Aging**:
   - Balances by customer
   - Aged by current, 30, 60, 90+ days
   - Risk assessment

2. **Top Customers by Revenue**:
   - Ranking by sales volume
   - Trend analysis
   - Customer lifetime value

3. **Payment Performance**:
   - Average days to pay
   - On-time payment rate
   - Slow payer identification

4. **Customer Profitability**:
   - Revenue by customer
   - Cost of servicing
   - Profit margin analysis

---

### Journey 5 Summary - Customer Management Complete
**The Story**:
1. Customer created → Master data established
2. Credit limits set → Risk managed
3. Transaction history tracked → Complete audit trail
4. Communications logged → Relationship managed
5. Analytics generated → Data-driven decisions

**Key Features**:
- Complete customer master data management
- Credit limit controls
- Payment terms management
- Transaction history aggregation
- AR aging by customer
- Customer statement generation
- Communication tracking
- Customer analytics and reporting

---

## Journey 6: Supplier Management

**Route**: `/workspace/[companyId]/suppliers`

**Story**: Manage your supplier relationships, payment terms, and procurement history.

**📸 Visual Guides**: [Suppliers List](/visual-guides/5-supplier-management/23-suppliers-list.html) | [Supplier Detail](/visual-guides/5-supplier-management/24-supplier-detail.html)

---

### Step 1: Create Supplier (Creditor) Record
**Starting Point**: `/workspace/[companyId]/suppliers`

**Scenario**: Onboard a new supplier before creating purchase orders or recording bills.

**Actions**:
1. Click "New Supplier"
2. Enter supplier details:
   - **Basic Information**:
     - Supplier name
     - Trading name (if different)
     - Supplier category (Goods, Services, Both)
     - Industry/specialty
   - **Contact Information**:
     - Primary contact person
     - Email address
     - Phone numbers
     - Physical address
   - **Financial Terms**:
     - Payment terms offered (Net 30, Net 60, etc.)
     - Currency
     - Tax registration number
     - Tax status
   - **Banking Details** (for payments):
     - Bank name
     - Account number
     - Account holder name
     - SWIFT/BIC code (international)
   - **Purchase Information**:
     - Lead time
     - Minimum order quantity
     - Preferred ordering method
3. Set supplier status (Active, Inactive, Preferred)
4. Add notes
5. Save supplier record

**Data Created**:
- Supplier master record
- Supplier ID
- Linked to company tenant

---

### Step 2: Supplier Payment Terms Tracking
**Scenario**: Monitor payment obligations and take advantage of early payment discounts.

**Actions**:
1. Open supplier record
2. **View Payment Terms**:
   - Standard terms (Net 30, Net 60, etc.)
   - Early payment discount terms (2/10 Net 30 = 2% discount if paid within 10 days)
   - Late payment penalties
3. **Track Due Dates**:
   - System calculates due dates on bills
   - Alerts for upcoming due dates
   - Identifies early payment discount opportunities
4. **Payment History**:
   - Average days to pay
   - On-time payment rate
   - Discount capture rate

**Business Value**: Optimize cash flow by paying on time (not early) while capturing available discounts.

---

### Step 3: Supplier Transaction History
**Scenario**: View complete procurement history with supplier.

**Actions**:
1. Open supplier record
2. Navigate to "Transaction History" tab
3. **View All Activities**:
   - All purchase orders issued
   - All goods receipts
   - All vendor bills recorded
   - All payments made
   - All supplier credits received
   - Communication history
4. **Performance Metrics**:
   - Total spend (YTD, MTD, All-time)
   - Order fulfillment rate
   - Quality metrics (returns, disputes)
   - Delivery performance (on-time, late)

---

### Step 4: Supplier Performance Management
**Scenario**: Evaluate supplier performance and make sourcing decisions.

**Metrics Tracked**:
1. **Cost Performance**:
   - Price trends over time
   - Price competitiveness vs. other suppliers
   - Total cost of ownership
2. **Quality Performance**:
   - Defect rate
   - Return rate
   - Dispute frequency
3. **Delivery Performance**:
   - On-time delivery rate
   - Lead time accuracy
   - Order completeness
4. **Relationship Health**:
   - Payment terms offered
   - Responsiveness
   - Flexibility

**Actions**:
- Rate suppliers
- Add performance notes
- Flag issues for resolution
- Categorize as Preferred/Approved/Probation/Blocked

---

### Step 5: Supplier Reporting
**Reports Available**:
1. **Supplier AP Aging**:
   - Outstanding payables by supplier
   - Aged categories
   - Payment priority

2. **Top Suppliers by Spend**:
   - Largest suppliers
   - Spend concentration risk
   - Negotiation opportunities

3. **Supplier Performance Scorecard**:
   - Multi-criteria evaluation
   - Comparative ranking
   - Continuous improvement tracking

---

### Journey 6 Summary - Supplier Management Complete
**The Story**:
1. Supplier created → Master data established
2. Payment terms tracked → Cash flow optimized
3. Transaction history maintained → Spend visibility
4. Performance monitored → Quality assured
5. Analytics generated → Strategic sourcing

**Key Features**:
- Complete supplier master data
- Payment terms and discount tracking
- Transaction history aggregation
- AP aging by supplier
- Supplier statement reconciliation
- Performance metrics
- Supplier analytics and reporting
- Multi-supplier comparison

---

## Journey 7: General Ledger & Reporting

**Route**: `/workspace/[companyId]/journal` → `/workspace/[companyId]/chart-of-accounts` → `/workspace/[companyId]/reports`

**Story**: The backbone of accounting - view all financial transactions, manage chart of accounts, and generate reports.

**📸 Visual Guides**: [Journal Entries](/visual-guides/6-general-ledger/25-journal-entries.html) | [Chart of Accounts](/visual-guides/6-general-ledger/26-chart-of-accounts.html) | [Reports Dashboard](/visual-guides/6-general-ledger/27-reports-dashboard.html) | [Trial Balance](/visual-guides/6-general-ledger/28-trial-balance.html)

---

### Step 1: View General Ledger (Journal Entries)
**Route**: `/workspace/[companyId]/journal`

**Scenario**: View all posted journal entries - the complete transaction history.

**Actions**:
1. Navigate to Journal Entries
2. **View Journal Entry List**:
   - Entry date
   - Journal entry number (auto-generated)
   - Description
   - Total debit/credit amount
   - Status (Posted, Draft, Reversed)
   - Source (Manual, Invoice, Payment, Reconciliation, etc.)
3. **Filter and Search**:
   - By date range
   - By account
   - By source document
   - By customer/supplier
   - By amount range
4. **Click to View Details**:
   - Opens journal entry detail dialog
   - Shows all line items:
     - Account code and name (e.g., "1200 - Accounts Receivable")
     - Description (e.g., "Invoice INV-2025-0003 - Customer Name")
     - Debit/Credit amounts
     - Customer/Supplier dimensions (if applicable)
   - Displays source document link
   - Shows audit trail (created by, date, modified by, etc.)

**Data Structure** (Enhanced in Phase 1):
```typescript
LedgerEntry {
  accountCode: "1200"
  accountName: "Accounts Receivable"  // ← Added in Phase 1
  description: "Invoice INV-2025-0003 - AVI Products"  // ← Line-level
  debit: 1150.00
  credit: 0
  dimensions: {  // ← Added in Phase 1
    customerId: "customer_123",
    invoiceId: "invoice_456"
  }
}
```

**What's Displayed**:
- Full account code + name (readable, not just codes)
- Descriptive transaction details
- Customer/supplier information
- Source document references
- Complete audit trail

---

### Step 2: Create Manual Journal Entry
**Scenario**: Record transactions not captured automatically (adjustments, accruals, depreciation, etc.).

**Actions**:
1. Click "New Journal Entry"
2. Enter journal header:
   - Entry date
   - Reference number
   - Description
3. **Add Journal Lines** (at least 2):
   - Select account from Chart of Accounts
   - Enter description for this line
   - Enter debit OR credit amount
   - Add dimensions if applicable (customer, supplier, department, etc.)
4. **Verify Balance**:
   - System validates total debits = total credits
   - Displays running balance
   - Prevents posting if unbalanced
5. Save as Draft OR Post immediately
6. **Posted Entry**:
   - Creates ledger entries
   - Immutable (cannot edit after posting)
   - Can only reverse if error

**Common Manual Journal Types**:
- Month-end accruals
- Depreciation expense
- Prepayment amortization
- Inventory adjustments
- Currency revaluation
- Error corrections (via reversal + new entry)

---

### Step 3: Manage Chart of Accounts
**Route**: `/workspace/[companyId]/chart-of-accounts`

**Scenario**: View and manage your Chart of Accounts - the foundation of your accounting system.

**Actions**:
1. Navigate to Chart of Accounts
2. **View Account Structure**:
   - **Assets** (1000-1999)
     - Current Assets (1000-1499)
     - Fixed Assets (1500-1799)
     - Other Assets (1800-1999)
   - **Liabilities** (2000-2999)
     - Current Liabilities (2000-2499)
     - Long-term Liabilities (2500-2999)
   - **Equity** (3000-3999)
   - **Revenue** (4000-4999)
   - **Expenses** (5000-5999)
     - Cost of Goods Sold (5000-5199)
     - Operating Expenses (5200-5799)
     - Other Expenses (5800-5999)

3. **Industry Template Pre-Loaded**:
   - System already populated with industry-specific accounts
   - 889+ accounts across all templates
   - Ready to use out-of-the-box

4. **Add Custom Account** (if needed):
   - Click "Add Account"
   - Enter account code (within category range)
   - Enter account name
   - Select account type
   - Set normal balance (Debit/Credit)
   - Set parent account (for sub-accounts)
   - Mark as active
   - Save

5. **Edit Account**:
   - Modify name or description
   - Deactivate (if no transactions posted)
   - Cannot delete accounts with transaction history

6. **Account Hierarchy**:
   - Parent-child relationships
   - Sub-accounts roll up to parents
   - Multi-level hierarchy supported

**Account Properties**:
- Account code (unique identifier)
- Account name (descriptive)
- Account type (Asset, Liability, Equity, Revenue, Expense)
- Normal balance (Debit or Credit)
- Active/Inactive status
- Allow posting (some accounts are summary only)
- Tax category (if applicable)

---

### Step 4: Account Inquiry & Drill-Down
**Scenario**: Investigate transactions in a specific GL account.

**Actions**:
1. Open Chart of Accounts
2. Click on account (e.g., "1200 - Accounts Receivable")
3. **View Account Summary**:
   - Opening balance (period start)
   - Total debits in period
   - Total credits in period
   - Closing balance (current)
4. **Transaction List**:
   - All ledger entries affecting this account
   - Sorted by date
   - Shows:
     - Date
     - Journal entry number
     - Description
     - Debit/Credit
     - Running balance
     - Source document link
5. **Drill-Down**:
   - Click transaction → Opens journal entry detail
   - Click source document → Opens original invoice/payment/etc.
6. **Filter Transactions**:
   - By date range
   - By customer/supplier (using dimensions)
   - By amount
   - By source type

**Use Cases**:
- Verify account balance
- Investigate unusual transactions
- Support audit inquiries
- Reconcile control accounts (AR, AP)

---

### Step 5: Financial Reports
**Route**: `/workspace/[companyId]/reports`

**Scenario**: Generate financial statements and management reports.

**Core Reports**:

#### 1. Trial Balance
**Purpose**: Verify ledger balances before financial statements.

**Shows**:
- All GL accounts with balances
- Debit and credit columns
- Total debits = Total credits (must balance)
- By account category

**Options**:
- As at specific date
- Comparative (current vs. previous period)
- Detailed (with sub-accounts) or Summary

#### 2. Balance Sheet (Statement of Financial Position)
**Purpose**: Snapshot of financial position at a point in time.

**Structure**:
```
ASSETS
  Current Assets
    Cash and Cash Equivalents
    Accounts Receivable
    Inventory
    Prepayments
  Fixed Assets
    Property, Plant, Equipment
    Less: Accumulated Depreciation
  Total Assets

LIABILITIES
  Current Liabilities
    Accounts Payable
    Accrued Expenses
    Short-term Debt
  Long-term Liabilities
    Long-term Debt
  Total Liabilities

EQUITY
  Share Capital
  Retained Earnings
  Current Period Profit/Loss
  Total Equity

Total Liabilities + Equity
```

**Accounting Equation**: Assets = Liabilities + Equity (must balance)

#### 3. Income Statement (Profit & Loss)
**Purpose**: Show financial performance over a period.

**Structure**:
```
REVENUE
  Sales Revenue
  Service Revenue
  Other Income
  Total Revenue

COST OF GOODS SOLD
  Direct Materials
  Direct Labor
  Total COGS

GROSS PROFIT (Revenue - COGS)

OPERATING EXPENSES
  Salaries & Wages
  Rent
  Utilities
  Marketing
  Office Supplies
  Depreciation
  Total Operating Expenses

OPERATING PROFIT (Gross Profit - Operating Expenses)

OTHER INCOME/(EXPENSES)
  Interest Income
  Interest Expense
  Foreign Exchange Gains/Losses

NET PROFIT BEFORE TAX

Income Tax Expense

NET PROFIT AFTER TAX
```

**Options**:
- Period (Month, Quarter, Year)
- Comparative (current vs. previous period/year)
- Budget vs. Actual (if budgets configured)

#### 4. Cash Flow Statement
**Purpose**: Track cash movements (operating, investing, financing activities).

**Structure**:
```
OPERATING ACTIVITIES
  Net Profit
  Adjustments for:
    Depreciation
    Changes in Accounts Receivable
    Changes in Accounts Payable
    Changes in Inventory
  Cash from Operating Activities

INVESTING ACTIVITIES
  Purchase of Fixed Assets
  Sale of Fixed Assets
  Cash from Investing Activities

FINANCING ACTIVITIES
  Loans Received
  Loan Repayments
  Dividends Paid
  Cash from Financing Activities

NET INCREASE/(DECREASE) IN CASH

Opening Cash Balance
Closing Cash Balance
```

#### 5. AR Aging Report
**Purpose**: Identify overdue customer invoices.

**Structure**:
| Customer | Current | 1-30 Days | 31-60 Days | 61-90 Days | 90+ Days | Total |
|----------|---------|-----------|------------|------------|----------|-------|
| ABC Corp | $1,000  | $500      | $0         | $250       | $0       | $1,750|
| XYZ Ltd  | $2,500  | $0        | $0         | $0         | $1,000   | $3,500|
| **Total**| $3,500  | $500      | $0         | $250       | $1,000   | $5,250|

**Actions**:
- Identify slow payers (high balances in 60+ columns)
- Collections priority
- Credit hold decisions

#### 6. AP Aging Report
**Purpose**: Manage payment obligations.

**Structure**: Similar to AR Aging, but for suppliers.

**Actions**:
- Payment scheduling
- Discount capture opportunities
- Supplier relationship management

#### 7. General Ledger Detail Report
**Purpose**: Complete audit trail for specific accounts or date ranges.

**Shows**:
- All transactions
- Full journal entry details
- Source documents
- Running balances

---

### Step 6: Export Reports
**Scenario**: Share reports with stakeholders, accountants, auditors.

**Actions**:
1. Generate report
2. Select export format:
   - **PDF**: Professional formatted report for printing/sharing
   - **Excel**: For further analysis, pivot tables
   - **CSV**: For data import into other systems
3. Download or email

---

### Journey 7 Summary - GL & Reporting Complete
**The Story**:
1. Chart of Accounts structured → Industry template pre-loaded
2. Transactions posted automatically → From AR/AP workflows
3. Manual journals created → For adjustments
4. Ledger queried → Complete audit trail with account names and descriptions
5. Reports generated → Financial statements ready
6. Data exported → Shared with stakeholders

**Key Features**:
- Industry-specific Chart of Accounts (889+ accounts)
- Automated GL posting from all modules
- Manual journal entry capability
- Enhanced ledger with account names, descriptions, dimensions
- Subsidiary ledger support (AR, AP)
- Complete financial statement suite
- AR/AP aging reports
- Account inquiry and drill-down
- Multi-format report export
- Period locking for compliance

**Phase 1 Enhancements**:
- Account names displayed (not just codes)
- Line-level descriptions preserved
- Customer/supplier dimensions stored
- Enables customer statements from ledger
- Enables AR/AP sub-ledger reporting

---

## Journey 8: Multi-Tenant Company Management

**Route**: `/workspace` → Company selection → `/companies`

**Story**: Manage multiple companies or clients from a single login - perfect for accounting firms, bookkeepers, or holding companies.

**📸 Visual Guides**: [Company Selector](/visual-guides/7-multi-tenant/29-company-selector.html) | [Dashboard](/visual-guides/7-multi-tenant/30-dashboard.html)

---

### Step 1: Multi-Tenant Architecture Overview

**Two Company Types**:

1. **Corporate Company** (`type: "corporate"`):
   - Standard business company
   - Single entity accounting
   - Own employees and operations
   - Example: Your own business

2. **Managed Account Company** (`type: "manageAccounts"`):
   - Parent company managing multiple client companies
   - Accounting firm or bookkeeping service
   - Can create and manage sub-tenant companies
   - Example: ABC Accounting Services (parent) managing 50 client companies

**User Roles**:
- **super_admin**: Full system access, can manage all companies
- **admin**: Company administrator, full access to assigned companies
- **financial_admin**: Financial operations, cannot manage users or settings
- **user**: Limited access, view-only or specific modules

---

### Step 2: Create Managed Account Parent Company
**Scenario**: You're an accounting firm wanting to manage multiple client companies.

**Actions**:
1. During company creation (or edit existing)
2. Select company type: **"Managed Accounts"**
3. Complete company setup (name, address, etc.)
4. **Special Capabilities Enabled**:
   - Can create sub-tenant companies
   - Can access all sub-tenant data
   - Consolidated reporting across clients (future feature)
   - User access management across tenants

**Data Created**:
- Parent company record with `manageAccounts: true`
- Parent company workspace
- Ability to create child companies

---

### Step 3: Create Client Company (Sub-Tenant)
**Scenario**: Onboard a new client to your managed account platform.

**Actions**:
1. From parent company workspace
2. Navigate to "Companies" or "Clients"
3. Click "Add New Client Company"
4. **Enter Client Details**:
   - Company name
   - Industry (triggers template selection)
   - Tax registration
   - Fiscal year
   - Base currency
   - Contact information
5. **Automated Provisioning**:
   - System creates separate company tenant
   - Provisions Chart of Accounts from industry template
   - Sets up default bank accounts
   - Creates industry transaction patterns
   - Links to parent company
6. **Assign Access**:
   - Invite client users (with limited permissions)
   - Assign your staff to manage client (financial_admin role)
   - Configure access controls

**Data Created**:
- Child company record linked to parent
- Complete accounting structure (COA, accounts, patterns)
- User access permissions
- Data isolation (client data separated)

**Tenant Isolation**:
- Each client company has isolated data
- Parent can access via company switching
- Clients cannot see other clients' data
- Firestore rules enforce isolation

---

### Step 4: Switch Between Companies
**Scenario**: You manage 50 client companies and need to work on different clients.

**Actions**:
1. **Company Selector** (top navigation):
   - Shows current active company
   - Click to see company list
2. **Company List Shows**:
   - Company name
   - Company type (Corporate/Managed)
   - Industry template applied (visual indicator)
   - Your role in company
   - Recent activity indicator
3. **Filter/Search**:
   - Search by company name
   - Filter by industry
   - Sort by last accessed
4. **Select Company**:
   - Click company to switch context
   - System loads company-specific data
   - All routes now scoped to selected company
   - URL updates: `/workspace/[new-companyId]/...`

**User Experience**:
- Seamless switching (no re-login)
- Context preserved (returns to same page in new company)
- Recent companies quick-access

---

### Step 5: Manage Users & Permissions
**Route**: `/workspace/[companyId]/settings` → Users & Roles

**Scenario**: Control who can access which companies and what they can do.

**Actions**:

#### A. Invite User to Company
1. Navigate to Settings → Users
2. Click "Invite User"
3. Enter email address
4. Select role:
   - **admin**: Full company access
   - **financial_admin**: Financial operations (AR, AP, GL, reports)
   - **user**: Limited access (view-only or specific modules)
5. Send invitation
6. **User Receives Email**:
   - Link to accept invitation
   - Creates account (if new user)
   - Granted access to company

#### B. Assign Multi-Company Access
**Scenario**: Your staff member needs access to 10 client companies.

1. From parent company admin panel
2. Select staff member user
3. Click "Manage Company Access"
4. **Select Companies**:
   - Check all companies this user can access
   - Assign role per company (can be different roles)
   - Example: Alice = admin on 5 companies, financial_admin on 10 others
5. Save permissions

**Result**: User sees all assigned companies in company selector.

#### C. Configure Granular Permissions
**Scenario**: Client user should only see invoices and statements, not bank accounts or payables.

1. Select user
2. Configure module permissions:
   - ✅ View Invoices
   - ✅ View Customer Statements
   - ✅ View Reports (AR only)
   - ❌ View Bank Accounts
   - ❌ View Payables
   - ❌ View Chart of Accounts
   - ❌ Manage Settings
3. Save custom permissions

---

### Step 6: Data Isolation & Security
**How Tenant Isolation Works**:

1. **Firestore Structure**:
```
companies/
  company_abc_123/  ← Parent company
    settings: {...}
  company_client_456/  ← Client 1
    settings: {...}
  company_client_789/  ← Client 2
    settings: {...}

invoices/
  invoice_001
    companyId: "company_client_456"  ← Tenant key
  invoice_002
    companyId: "company_client_789"  ← Different tenant
```

2. **Firestore Security Rules**:
```javascript
// User can only access companies they belong to
match /companies/{companyId} {
  allow read, write: if hasAccess(companyId);
}

// User can only see invoices for their companies
match /invoices/{invoiceId} {
  allow read: if hasAccess(resource.data.companyId);
}
```

3. **Service Layer Enforcement**:
- All queries automatically filter by `companyId`
- User context checked on every request
- Cross-tenant data access prevented at code level

**Security Features**:
- Row-level security via Firestore rules
- Role-based access control (RBAC)
- Audit logging of all data access
- Session management per company context
- Multi-factor authentication support (Firebase)

---

### Step 7: Consolidated Reporting (Future Feature)
**Scenario**: View aggregated financials across all client companies.

**Future Capabilities** (deferred to later phase):
- Consolidated balance sheet
- Consolidated P&L
- Cross-company cash flow analysis
- Portfolio analytics
- Benchmarking between clients

---

### Journey 8 Summary - Multi-Tenant Complete
**The Story**:
1. Parent company created → Managed accounts enabled
2. Client companies onboarded → Industry templates auto-applied
3. Users invited → Role-based permissions assigned
4. Company switching → Seamless multi-client management
5. Data isolated → Security and compliance ensured

**Key Features**:
- Two-tier tenant hierarchy (parent → child companies)
- Managed account company type
- Industry template auto-provisioning per client
- User access management across tenants
- Role-based permissions (4 levels)
- Company selector for quick switching
- Complete data isolation via Firestore rules
- Audit trail per company
- Tenant-scoped queries at service layer

**Perfect For**:
- Accounting firms managing clients
- Bookkeeping services
- Franchise operations
- Holding companies
- Multi-entity businesses

---

## Feature Reference

### Complete Feature List by Module

#### Authentication & User Management
- User registration and login
- Email verification
- Password reset
- Multi-factor authentication (Firebase)
- Role-based access control (super_admin, admin, financial_admin, user)
- User invitation workflow
- Multi-company access management

#### Company Management
- Company creation with type selection (Corporate / Managed Accounts)
- Industry template selection (13 templates)
- Smart industry auto-suggestion
- Automated Chart of Accounts provisioning (889+ accounts)
- Multi-tenant architecture
- Company switching
- Tenant data isolation
- Fiscal year configuration
- Multi-currency support

#### Chart of Accounts & General Ledger
- Industry-specific Chart of Accounts (pre-configured)
- 5 account categories (Assets, Liabilities, Equity, Revenue, Expenses)
- Account hierarchy (parent-child)
- Custom account creation
- Account activation/deactivation
- General Ledger with enhanced structure:
  - Account codes AND names displayed
  - Line-level descriptions preserved
  - Customer/supplier dimensions stored
  - Complete audit trail
- Manual journal entry creation
- Automated GL posting from all modules
- Journal entry reversal
- Account inquiry and drill-down
- Subsidiary ledger support (AR, AP)

#### Accounts Receivable (AR)
- Customer (debtor) master data management
- Quote creation and management
- Quote versioning
- Quote-to-Sales Order conversion
- Sales Order management (optional)
- Quote/Sales Order-to-Invoice conversion
- Invoice creation (from quote or standalone)
- Line-level and document-level tax support
- PO Number field on invoices
- Invoice PDF generation (centralized service)
- Automated GL posting on invoice:
  - Debit: Accounts Receivable
  - Credit: Revenue accounts
  - Tax entries
- Payment recording (full/partial)
- Payment allocation
- Overpayment handling
- Customer statement generation (from GL with dimensions)
- Credit note creation and posting
- AR aging reports
- Customer transaction history
- Credit limit management
- Payment terms tracking

#### Accounts Payable (AP)
- Supplier (creditor) master data management
- Purchase Order creation
- PO approval workflow (configurable)
- Goods receipt recording
- Vendor bill creation (from PO or standalone)
- AI-powered bill extraction from PDF (Gemini 2.0)
- Three-way matching (PO / Receipt / Bill)
- Automated GL posting on bill:
  - Debit: Expense or Inventory accounts
  - Credit: Accounts Payable
  - Tax entries
- Vendor payment processing (single or batch)
- Payment scheduling
- Payment remittance advice
- Supplier credit note handling
- Supplier statement reconciliation
- AP aging reports
- Supplier transaction history
- Early payment discount tracking
- Supplier performance management

#### Bank & Cash Management
- Bank account setup and configuration
- Multi-bank account support
- Bank statement upload (PDF)
- AI-powered transaction extraction (Gemini 2.0)
- Industry-specific transaction pattern recognition (274 patterns)
- Vendor mapping (238 pre-configured vendors)
- Direct bank-to-ledger import (for SMEs)
- Bank account balance tracking
- Multi-currency bank accounts
- Cash flow monitoring
- Real-time cash position dashboard
- Bank transfers between accounts (future)

#### Bank Reconciliation
- Reconciliation workspace UI
- Two-panel interface (bank vs. GL)
- Auto-match algorithm:
  - Pattern-based matching
  - Vendor recognition
  - Amount and date proximity
  - Confidence scoring
  - 75-88% auto-match rate
- Manual drag-and-drop matching
- One-to-many matching (single deposit = multiple payments)
- Many-to-one matching (multiple bank items = single GL entry)
- Partial matching with variances
- Split transaction handling
- Create GL entries from unmatched bank items
- Reconciliation completion and locking
- Reconciliation reports
- Period close after reconciliation

#### Recurring Billing & Contracts
- Service Level Agreement (SLA) creation
- Contract management
- Recurring invoice schedules
- Automated invoice generation from SLAs
- Billing frequency configuration (monthly, quarterly, annual)
- Contract renewal tracking

#### Fiscal Periods & Compliance
- Fiscal year setup
- Monthly period management
- Period open/close controls
- Period locking after reconciliation
- Audit trail immutability
- Compliance reporting

#### Financial Reporting
- Trial Balance (detailed & summary)
- Balance Sheet (Statement of Financial Position)
- Income Statement (Profit & Loss)
- Cash Flow Statement
- AR Aging Report
- AP Aging Report
- General Ledger Detail Report
- Customer Statements
- Supplier Statements
- Reconciliation reports
- Report export (PDF, Excel, CSV)
- Comparative reporting (period vs. period)
- Budget vs. Actual (future)

#### AI & Automation
- PDF document extraction (Gemini 2.0):
  - Bank statements
  - Vendor bills
  - Customer invoices
  - Receipts
- Debtor/Creditor recognition (AI Agent - 100% complete)
- Transaction pattern learning
- Vendor mapping and recognition
- Auto-matching algorithms
- Smart industry detection
- Confidence scoring on auto-matches

#### AI Chat Assistant
- Natural language queries about financial data
- Ask questions about balances, transactions, reports
- AI-powered insights
- Located at: `/workspace/[companyId]/ai-chat`

#### Industry Templates
- 13 pre-configured industry templates:
  1. General Business
  2. Retail & E-Commerce
  3. Professional Services
  4. Construction & Real Estate
  5. Manufacturing
  6. Food & Beverage
  7. Healthcare
  8. Technology & Software
  9. Beauty & Wellness
  10. Pharmaceutical & Medical Supplies
  11. (3 more specialized templates)
- 889+ GL accounts across all templates
- 274 transaction patterns for auto-matching
- 238 vendor mappings
- Industry-specific account structures
- Automated template application on company creation

#### Document Management
- Centralized PDF service (`/src/lib/pdf/pdf.service.ts`):
  - Quote PDF generation
  - Invoice PDF generation
  - Statement PDF generation
  - Contract PDF generation
  - Reconciliation report PDFs
- Firebase Storage integration
- Automatic image URL to base64 conversion
- Company branding on documents
- Email delivery integration
- Document archival

#### Admin Tools
- Chart of Accounts seeding scripts
- Bank account seeding
- Ledger entry seeding
- Industry template seeding
- Reset posted invoices (development)
- Debug permissions tool
- Ledger reset (admin)

---

## System Navigation Map

### Main Routes Structure

```
/ (Root)
├── /signup
├── /login
├── /reset-password
├── /dashboard (User's main dashboard - company selector)
└── /workspace/[companyId]
    ├── /dashboard (Company-specific dashboard)
    ├── /quotes
    ├── /invoices
    ├── /customers (Debtors)
    ├── /statements (Customer statements)
    ├── /credit-notes
    ├── /purchase-orders
    ├── /vendor-bills
    ├── /suppliers (Creditors)
    ├── /supplier-statements
    ├── /vendor-payments
    ├── /contracts (SLAs)
    ├── /bank-statements
    ├── /bank-import
    ├── /reconciliation
    ├── /chart-of-accounts
    ├── /journal (General Ledger)
    ├── /cash-flow
    ├── /reports
    ├── /ai-chat
    ├── /settings
    └── /admin
        └── /reset-ledger
```

---

## Appendix: System Capabilities Summary

### What PeakFlow Does Best

1. **End-to-End Financial Management**:
   - Complete accounting from quote to cash
   - Full procurement cycle from purchase to pay
   - Automated GL posting (no manual journal entries for 90% of transactions)

2. **AI-Powered Automation**:
   - Document extraction from PDFs (Gemini 2.0)
   - Smart transaction matching (75-88% auto-match)
   - Vendor recognition
   - Industry pattern learning

3. **Multi-Tenant Excellence**:
   - Perfect for accounting firms managing clients
   - Complete data isolation
   - Seamless company switching
   - Industry templates per client

4. **Compliance & Audit**:
   - Immutable audit trail
   - Complete transaction history with descriptions
   - Subsidiary ledger support
   - Period locking
   - Role-based access control

5. **Industry Intelligence**:
   - 13 industry-specific templates
   - 889+ pre-configured GL accounts
   - 274 transaction patterns
   - 238 vendor mappings
   - Smart industry detection

6. **Real-Time Visibility**:
   - Live cash position
   - Up-to-date AR/AP aging
   - Real-time financial reports
   - Complete customer/supplier transaction history

---

## Technology Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI primitives + custom shadcn/ui
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod validation
- **Type Safety**: TypeScript throughout

### Backend
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **AI/ML**: Google Gemini 2.0 API

### Security
- Row-level security via Firestore rules
- Role-based access control (4 levels)
- Tenant isolation (multi-tenant safe)
- Audit logging
- Encrypted connections
- MFA support via Firebase

### Deployment
- **Platform**: Vercel (frontend + API routes)
- **Functions**: Firebase Cloud Functions
- **Storage**: Firebase Storage
- **Database**: Firebase Firestore

---

## Getting Help

### Resources
- **Project Documentation**: `/current-prompt.md` (10 implementation phases)
- **Progress Tracker**: `/project-management/modernization-roadmap.md`
- **Development Guide**: `/CLAUDE.md`
- **Phase Guides**: `/project-management/phase-*.md`

### Current Status
- ✅ **Phase 1**: GL Foundation (Complete)
- ✅ **Phase 2**: Accounts Payable (Complete)
- ✅ **Phase 3**: (Complete)
- ✅ **Phase 5**: Bank & Cash Management (Complete)
- ✅ **Phase 6**: Access Control & Multi-Tenant (Complete)
- ✅ **Phase 7**: (Complete)

### Development Commands
```bash
# Start development server
npm run dev

# Build production
npm run build

# Seed data
npm run seed:bank-accounts
npm run seed:charts
npm run seed:ledger
npm run seed:industry-templates

# Reset posted invoices (development)
npm run reset:posted-invoices
```

---

## Conclusion

**PeakFlow** is a comprehensive financial management system that automates the complete accounting cycle:

- **Quote → Invoice → Payment → Statement** (Accounts Receivable)
- **PO → Goods Receipt → Bill → Payment** (Accounts Payable)
- **Bank Import → Reconciliation → GL Posting** (Cash Management)
- **Journal Entries → Reports → Compliance** (General Ledger)

With AI-powered automation, industry-specific intelligence, and multi-tenant architecture, PeakFlow provides a complete solution for businesses and accounting firms managing financial operations.

**The PeakFlow Promise**:
*Automated workflows. Complete audit trail. Real-time insights. Multi-tenant ready.*

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**System Version**: Based on completed Phases 1, 2, 3, 5, 6, 7
