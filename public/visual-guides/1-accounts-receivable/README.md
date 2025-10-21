# Journey 1: Accounts Receivable (AR) - Quote to Cash

Visual documentation for the complete AR cycle in PeakFlow Financial Management System.

## Screens Created (7 total)

### 1. **04-quotes-list.html** - Quote Management Page
- **Component**: `/app/workspace/[companyId]/quotes/page.tsx`
- **Features**: Quote list table, status badges, search/filter, actions menu
- **Annotations**: 6 key features explained
- **Purpose**: Manage customer quotes and track quote statuses

### 2. **05-quote-create.html** - Create Quote Dialog
- **Component**: Same file, create dialog section
- **Features**: Customer selector, line items management, tax calculation, validity period
- **Annotations**: 8 key features explained
- **Purpose**: Generate new quotes with comprehensive details

### 3. **06-invoices-list.html** - Invoice List with Summary
- **Component**: `/app/workspace/[companyId]/invoices/page.tsx`
- **Features**: Summary KPI cards, invoice table, status filtering, search
- **Annotations**: 10+ key features explained
- **Purpose**: Comprehensive invoice management dashboard

### 4. **07-invoice-create.html** - Create Invoice Dialog
- **Component**: Same invoices page (lines 1227-1411)
- **Features**: Customer selection, dates, payment terms, PO number, tax rate, GL accounts, line items
- **Annotations**: 12 key features explained
- **Purpose**: Create detailed customer invoices

### 5. **08-invoice-detail.html** - View Invoice Details Dialog
- **Component**: Same file (lines 1602-1732)
- **Features**: Full invoice display, customer info, line items, totals breakdown, PDF download
- **Annotations**: 8 key features explained
- **Purpose**: View complete invoice information

### 6. **09-record-payment.html** - Record Payment Dialog
- **Component**: Same file (lines 1857-1921)
- **Features**: Payment date, amount, method, reference, notes
- **Annotations**: 6 key features explained
- **Purpose**: Record customer payments against invoices

### 7. **10-customer-statements.html** - Customer Statement Generation
- **Component**: `/app/workspace/[companyId]/statements/page.tsx`
- **Features**: Customer selector, period range, statement preview, aging analysis, PDF/Email
- **Annotations**: 6 key features explained
- **Purpose**: Generate professional customer statements with aged AR analysis

## Technical Details

All screens use:
- **Mock Data**: `/documentation/user-guide/visual-guides/data/mock-data.json`
- **Base Template**: Tailwind CSS + Lucide icons
- **Interactive Features**: Collapsible annotation panel, hover effects, technical details toggle
- **Annotations**: Numbered badges linked to detailed explanations

## Journey Flow

1. **Create Quote** → Customer requests pricing
2. **Quote List** → Manage and track quotes
3. **Convert to Invoice** → Quote accepted, generate invoice
4. **Invoice List** → Track invoices and payments
5. **Create Invoice** → Manual invoice creation
6. **View Invoice** → Review invoice details
7. **Record Payment** → Customer pays invoice
8. **Customer Statements** → Send monthly statements with aging

## Usage

Open any HTML file in a web browser. Click numbered annotation badges to learn about features. Panel is collapsible for easy navigation.

## File Sizes

- Total: 132KB
- Average: ~19KB per file
- Largest: 04-quotes-list.html (28KB) - most detailed annotations
- Smallest: 09-record-payment.html (11KB) - simple form

## Next Journey

Journey 2: Accounts Payable (AP) - Bill to Payment flow
