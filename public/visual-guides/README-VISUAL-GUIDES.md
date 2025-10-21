# PeakFlow Visual Guides - Documentation

## Overview

This directory contains **30 interactive HTML screenshots** documenting every major feature and workflow in the PeakFlow Financial Management System. Each screen is fully annotated with explanations, technical details, and navigation links.

## Quick Start

1. **Browse All Screens**: Open [`index.html`](index.html) in your web browser
2. **Select a Journey**: Click on any journey card to see available screens
3. **Explore a Screen**: Click on a numbered screen link to open the annotated HTML
4. **Learn the Features**: Hover over numbered badges and expand technical details

**No server required** - all files are self-contained HTML with CDN resources.

---

## Structure

```
visual-guides/
├── index.html                          # Main navigation (START HERE)
├── README-VISUAL-GUIDES.md             # This file
├── 0-getting-started/                  # Journey 0 (3 screens)
│   ├── 01-signup.html
│   ├── 02-company-creation.html
│   └── 03-onboarding-complete.html
├── 1-accounts-receivable/              # Journey 1 (7 screens)
│   ├── 04-quotes-list.html
│   ├── 05-quote-create.html
│   ├── 06-invoices-list.html
│   ├── 07-invoice-create.html
│   ├── 08-invoice-detail.html
│   ├── 09-record-payment.html
│   └── 10-customer-statements.html
├── 2-accounts-payable/                 # Journey 2 (5 screens)
│   ├── 11-purchase-orders-list.html
│   ├── 12-vendor-bills-list.html
│   ├── 13-vendor-bill-create.html
│   ├── 14-vendor-payments.html
│   └── 15-supplier-statements.html
├── 3-bank-reconciliation/              # Journey 3 (5 screens)
│   ├── 16-bank-import.html
│   ├── 17-bank-statements-list.html
│   ├── 18-reconciliation-workspace.html
│   ├── 19-reconciliation-auto-match.html
│   └── 20-cash-flow-dashboard.html
├── 4-customer-management/              # Journey 4 (2 screens)
│   ├── 21-customers-list.html
│   └── 22-customer-detail.html
├── 5-supplier-management/              # Journey 5 (2 screens)
│   ├── 23-suppliers-list.html
│   └── 24-supplier-detail.html
├── 6-general-ledger/                   # Journey 6 (4 screens)
│   ├── 25-journal-entries.html
│   ├── 26-chart-of-accounts.html
│   ├── 27-reports-dashboard.html
│   └── 28-trial-balance.html
├── 7-multi-tenant/                     # Journey 7 (2 screens)
│   ├── 29-company-selector.html
│   └── 30-dashboard.html
├── assets/
│   └── base-template.html              # Template used for all screens
└── data/
    └── mock-data.json                  # Shared mock data (TechVentures Ltd)
```

---

## 8 User Journeys

### Journey 0: Getting Started (3 screens)
Onboarding flow from signup to company creation with industry template selection.

**Screens**: Signup → Company Creation → Welcome Dashboard

---

### Journey 1: Accounts Receivable (7 screens)
Complete quote-to-cash cycle for revenue management.

**Screens**: Quotes List → Create Quote → Invoices List → Create Invoice → Invoice Detail → Record Payment → Customer Statements

**Key Features**:
- Quote management with versioning
- Invoice creation (from quote or standalone)
- Payment recording with automatic GL posting
- Customer statement generation with aging analysis
- PDF generation for all documents

---

### Journey 2: Accounts Payable (5 screens)
Purchase-to-pay cycle for expense management.

**Screens**: Purchase Orders → Vendor Bills → Create Bill → Vendor Payments → Supplier Statements

**Key Features**:
- PO management with approval workflow
- AI-powered bill extraction (Gemini 2.0)
- Three-way matching (PO / Receipt / Bill)
- Batch payment processing
- Supplier statement reconciliation

---

### Journey 3: Bank & Cash Management (5 screens)
Bank statement import, reconciliation, and cash flow monitoring.

**Screens**: Bank Import → Statements List → Reconciliation Workspace → Auto-Match Results → Cash Flow Dashboard

**Key Features**:
- AI PDF extraction (Gemini 2.0)
- 274 transaction patterns for 75-88% auto-matching
- 238 vendor mappings
- Direct bank-to-ledger import (for SMEs)
- Drag-and-drop reconciliation interface
- Cash flow forecasting

---

### Journey 4: Customer Management (2 screens)
Customer master data and relationship tracking.

**Screens**: Customers List → Customer Detail

**Key Features**:
- Credit limit management
- AR aging by customer
- Payment performance tracking
- Transaction history
- Communication log

---

### Journey 5: Supplier Management (2 screens)
Supplier master data and performance tracking.

**Screens**: Suppliers List → Supplier Detail

**Key Features**:
- Payment terms tracking
- AP aging by supplier
- Performance metrics (delivery, quality, cost)
- Spend analysis
- Early payment discount tracking

---

### Journey 6: General Ledger & Reporting (4 screens)
Chart of accounts, journal entries, and financial statements.

**Screens**: Journal Entries → Chart of Accounts → Reports Dashboard → Trial Balance

**Key Features**:
- Industry template (889 accounts for Technology & Software)
- Enhanced ledger with account names + descriptions (Phase 1)
- Customer/supplier dimensions for subsidiary ledgers
- Complete audit trail
- Financial statements (Balance Sheet, P&L, Cash Flow, Trial Balance)
- AR/AP aging reports

---

### Journey 7: Multi-Tenant & Dashboard (2 screens)
Company switching and workspace overview.

**Screens**: Company Selector → Dashboard

**Key Features**:
- Multi-company management
- Corporate vs. Managed Accounts
- Industry template indicators
- Financial KPIs (Cash, Revenue, AR, Reconciliations)
- Quick action cards

---

## How to Use Each Screen

### 1. Interactive Annotations

Every screen includes **numbered annotation badges** (①, ②, ③...) positioned on key UI elements.

- **Hover** over a badge to highlight the corresponding explanation in the annotation panel
- **Click** anywhere on the screen to focus
- The annotation panel at the bottom contains detailed explanations for each badge

### 2. Annotation Panel

The fixed bottom panel can be **expanded or collapsed**:

- **Expanded** (default): Shows all annotations and technical details
- **Collapsed**: Click the bar at the top to hide (shows only "Guide & Annotations")

### 3. Technical Details

Each annotation includes a **"Show Technical Details"** button that expands to reveal:

- **Component Path**: File location in codebase (e.g., `/app/workspace/[companyId]/invoices/page.tsx`)
- **Data Source**: Service methods (e.g., `InvoiceService.getInvoices(companyId)`)
- **State Management**: Form libraries, validation (e.g., `React Hook Form + Zod`)
- **Styling**: Tailwind CSS classes
- **Business Logic**: Key algorithms or workflows

### 4. Navigation

- **Related Resources**: Links at the bottom of the annotation panel
  - ← All Screens (back to index)
  - 📖 User Manual (comprehensive written guide)
  - Next/Previous screens in journey

---

## Mock Data

All screens use realistic mock data from **TechVentures Ltd**, a fictional South African technology company.

**Data File**: [`data/mock-data.json`](data/mock-data.json)

**Includes**:
- Company: TechVentures Ltd (Technology & Software industry)
- Customers: 5 businesses with various AR statuses
- Suppliers: 4 vendors (AWS, Office Depot, Azure, Telkom)
- Invoices: 6 samples (draft, sent, partial, paid, overdue, cancelled)
- Vendor Bills: 3 samples (unpaid, paid)
- Bank Accounts: 3 accounts (ZAR main, ZAR savings, USD)
- Bank Transactions: 5 recent transactions
- Journal Entries: 3 GL postings
- Chart of Accounts: 13 sample accounts (889 total in full template)
- KPIs: Cash R245k, Revenue R128k, AR R40k, etc.

**Currency**: South African Rand (ZAR / R)

---

## Technical Implementation

### Technologies Used

- **Tailwind CSS v4** (CDN): `https://cdn.tailwindcss.com`
- **Lucide Icons** (CDN): `https://unpkg.com/lucide@latest`
- **Pure HTML/CSS/JavaScript**: No build process required

### Features

✅ **Self-contained**: Each HTML file runs independently
✅ **No server required**: Open directly in any modern browser
✅ **Responsive**: Works on desktop and tablet viewports
✅ **Interactive**: Click, hover, and scroll interactions
✅ **Accessible**: Semantic HTML, keyboard navigation
✅ **Print-friendly**: Can be printed or saved as PDF

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Use Cases

### 1. User Training & Onboarding
- **New Users**: Walk through each journey sequentially
- **Feature Discovery**: Explore specific screens for new features
- **Self-Service Learning**: Read annotations without instructor

### 2. Team Collaboration
- **Designers**: Reference UI patterns and styling
- **Developers**: View component structure and data flows
- **QA**: Testing checklist for each screen
- **Product**: Feature documentation for roadmap planning

### 3. Client Demos & Sales
- **Professional Screenshots**: High-quality visuals for presentations
- **Feature Showcase**: Demonstrate capabilities without live system
- **Customization Discussion**: Show what can be adapted

### 4. Documentation & Support
- **Knowledge Base**: Link to specific screens from help articles
- **Bug Reports**: Reference exact screens when reporting issues
- **Feature Requests**: Point to existing screens as baseline

---

## Creating New Visual Guides

### Process

If you need to add new screens in the future:

1. **Create HTML from Base Template**:
   ```bash
   cp assets/base-template.html [journey-folder]/[##-screen-name].html
   ```

2. **Extract Component Styling**:
   - Read the actual component file from `/app/workspace/...`
   - Copy exact Tailwind CSS classes
   - Identify all UI elements (buttons, forms, tables, dialogs)

3. **Populate with Mock Data**:
   - Use data from `data/mock-data.json`
   - Or add new realistic data to the JSON file

4. **Replace Template Placeholders**:
   - `{{SCREEN_TITLE}}`: e.g., "Create Invoice Dialog"
   - `{{SCREEN_DESCRIPTION}}`: Brief summary
   - `{{JOURNEY_NAME}}`: e.g., "Accounts Receivable"
   - `{{STEP_NUMBER}}`: Screen number in journey
   - `{{COMPONENT_PATH}}`: Actual file path
   - `{{SCREEN_CONTENT}}`: Your HTML content
   - `{{ANNOTATIONS_CONTENT}}`: Annotation items
   - `{{NAVIGATION_LINKS}}`: Links to related screens

5. **Add Numbered Annotation Badges**:
   ```html
   <div class="annotation-badge" style="position: absolute; top: 120px; left: 350px;">1</div>
   ```

6. **Create Annotation Items**:
   ```html
   <div class="annotation-item">
       <div class="flex items-start gap-2">
           <span class="number">1</span>
           <div class="flex-1">
               <h4 class="font-semibold text-gray-900">UI Element Name</h4>
               <p class="text-gray-700 text-sm mt-1">What it does...</p>
               <!-- Technical details section -->
           </div>
       </div>
   </div>
   ```

7. **Update Navigation**:
   - Add link to `index.html` in appropriate journey card
   - Update journey screen count

---

## Maintenance

### Keeping Screens Up-to-Date

When the actual PeakFlow UI changes:

1. **Identify Changed Screens**: Note which features were modified
2. **Re-extract Styling**: Read updated component files
3. **Update HTML**: Modify affected screens
4. **Refresh Mock Data**: Ensure data structure matches new types
5. **Test All Links**: Verify navigation still works
6. **Update Annotations**: Add/remove badges as needed

### Version Control

- Track visual guides in Git alongside code
- Use semantic versioning for major UI changes
- Tag releases to match application versions
- Document changes in commit messages

---

## FAQ

### Q: Can I use these screens for live demos?
**A**: Yes! All screens are self-contained and can be opened in any browser. Perfect for presentations or client demos.

### Q: How do I export a screen as an image?
**A**: Use your browser's print function (Ctrl/Cmd + P) and save as PDF, or take a screenshot (Cmd/Win + Shift + S).

### Q: Can I modify the mock data?
**A**: Yes! Edit `data/mock-data.json` to reflect your use case. Then update screens that reference that data.

### Q: Why are some features not shown?
**A**: These screens represent the current implementation. Features in development or planned won't appear until implemented.

### Q: How do I share these with my team?
**A**: Zip the entire `/visual-guides/` folder and share. Recipients can extract and open `index.html` in their browser.

### Q: Can I add my own annotations?
**A**: Absolutely! Edit any HTML file and add new annotation badges + items following the existing pattern.

---

## Support & Feedback

- **Questions**: Check the [User Manual](../USER-MANUAL.md) for comprehensive documentation
- **Bug Reports**: If you find issues with visual guides, report them in the project issue tracker
- **Suggestions**: Have ideas for improving the visual guides? Share feedback with the team

---

**Last Updated**: October 2025
**Total Screens**: 30
**Mock Company**: TechVentures Ltd (Technology & Software)
**Created By**: PeakFlow Documentation Team
