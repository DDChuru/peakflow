# Enhanced Prompt for Financial Management System Implementation

## Original Request
Develop a comprehensive financial management system with financial dashboard, debtors/creditors management, age analysis, ledgers, journal entries, payables/receivables, bank statement imports, quote/PO/invoice workflows, multi-tenant architecture for managed accounts, and PDF extraction capabilities.

## Enhancement Date
2025-09-25

## Assumptions Made
- GAAP-compliant accounting principles with flexibility for regional variations
- Calendar-based fiscal year with monthly periods
- Role-based approval workflows with configurable limits
- Double-entry bookkeeping system
- Accrual-based accounting method
- Support for multiple currencies with base currency conversion
- Audit trail requirements for all financial transactions

## Enhanced Prompt

```xml
<task>
  <objective>Design and implement a comprehensive multi-tenant financial management system with full accounting capabilities, automated document processing, and hierarchical company management</objective>
  <scope>Complete financial ecosystem covering AP/AR, GL, document management, reporting, and multi-tenant operations with managed account capabilities</scope>
  <success_criteria>
    <criterion priority="1">Functional double-entry accounting system with GL, journals, and trial balance</criterion>
    <criterion priority="2">Complete debtors/creditors lifecycle management with aging analysis</criterion>
    <criterion priority="3">Automated PDF extraction for all financial documents</criterion>
    <criterion priority="4">Multi-tenant architecture supporting company-within-company structure</criterion>
    <criterion priority="5">Real-time financial dashboard with key metrics and insights</criterion>
  </success_criteria>
</task>

<context>
  <domain>Financial Management and Accounting Software</domain>
  <background>Building a comprehensive financial platform for businesses requiring both internal accounting and client financial management services</background>
  <current_state>
    - Next.js 15 + React 19 + Tailwind CSS frontend
    - Firebase backend infrastructure
    - Existing PDF extraction capabilities
    - Multi-tenant architecture in progress
    - Basic company and bank statement structures
  </current_state>
  <user_role>Technical implementer with financial domain knowledge</user_role>
</context>

<architectural_foundation>
  <core_principles>
    <principle>Double-entry bookkeeping for all transactions</principle>
    <principle>Immutable audit trail for compliance</principle>
    <principle>Separation of concerns between tenants</principle>
    <principle>Real-time balance calculations</principle>
    <principle>Document-driven workflows</principle>
  </core_principles>

  <data_model>
    <chart_of_accounts>
      <!-- Standard 5-category COA structure -->
      <assets range="1000-1999"/>
      <liabilities range="2000-2999"/>
      <equity range="3000-3999"/>
      <revenue range="4000-4999"/>
      <expenses range="5000-5999"/>
    </chart_of_accounts>

    <tenant_hierarchy>
      <level1>Primary Company (root tenant)</level1>
      <level2>Managed Account Companies (sub-tenants with manageAccounts flag)</level2>
      <level3>Sub-tenant Users and Departments</level3>
    </tenant_hierarchy>
  </data_model>
</architectural_foundation>

<implementation_phases>

  <phase number="1" name="Core Accounting Foundation">
    <objectives>Establish fundamental accounting structures and data models</objectives>
    <duration>2-3 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Chart of Accounts Setup</name>
        <steps>
          <step>Create COA data structure with account types (Asset, Liability, Equity, Revenue, Expense)</step>
          <step>Implement account hierarchy (parent-child relationships)</step>
          <step>Add normal balance indicators (debit/credit)</step>
          <step>Create default COA templates for different business types</step>
          <step>Build COA management UI with add/edit/deactivate functions</step>
        </steps>
      </task>

      <task priority="2">
        <name>General Ledger Implementation</name>
        <steps>
          <step>Design GL transaction table with proper indexing</step>
          <step>Implement journal entry structure (header + line items)</step>
          <step>Create posting rules engine for validation</step>
          <step>Build period management (open/close fiscal periods)</step>
          <step>Implement transaction reversal capabilities</step>
          <step>Add batch posting functionality</step>
        </steps>
      </task>

      <task priority="3">
        <name>Multi-Currency Support</name>
        <steps>
          <step>Create currency master table with exchange rates</step>
          <step>Implement rate type management (spot, average, historical)</step>
          <step>Build currency conversion engine</step>
          <step>Add realized/unrealized gain/loss calculations</step>
          <step>Create currency revaluation process</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="2" name="Multi-Tenant Architecture">
    <objectives>Implement hierarchical company structure with proper isolation</objectives>
    <duration>2 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Tenant Management System</name>
        <steps>
          <step>Create company/tenant data model with parent-child relationships</step>
          <step>Implement manageAccounts flag functionality</step>
          <step>Build tenant isolation middleware for Firebase</step>
          <step>Create cross-tenant data access controls</step>
          <step>Implement tenant-specific configuration storage</step>
        </steps>
      </task>

      <task priority="2">
        <name>User Management Enhancement</name>
        <steps>
          <step>Extend user model for multi-tenant access</step>
          <step>Create role templates per tenant type</step>
          <step>Implement permission inheritance system</step>
          <step>Build user invitation workflow for sub-tenants</step>
          <step>Add session management for tenant switching</step>
        </steps>
      </task>

      <task priority="3">
        <name>Data Segregation</name>
        <steps>
          <step>Implement composite keys with tenantId</step>
          <step>Create tenant-aware query builders</step>
          <step>Add row-level security rules in Firestore</step>
          <step>Build data migration tools for tenant onboarding</step>
          <step>Implement tenant-specific backup/restore</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="3" name="Debtors Management">
    <objectives>Complete accounts receivable system with document generation</objectives>
    <duration>3 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Customer Master Data</name>
        <steps>
          <step>Create customer entity with credit management fields</step>
          <step>Implement credit limit and payment terms</step>
          <step>Add customer categorization and tags</step>
          <step>Build customer statement preferences</step>
          <step>Create customer contact management</step>
          <step>Add tax registration details</step>
        </steps>
      </task>

      <task priority="2">
        <name>Quote Management</name>
        <steps>
          <step>Design quote header and line item structure</step>
          <step>Implement product/service catalog integration</step>
          <step>Create quote versioning system</step>
          <step>Build quote approval workflow</step>
          <step>Add quote-to-order conversion</step>
          <step>Implement quote expiry management</step>
          <step>Create quote PDF generation templates</step>
        </steps>
      </task>

      <task priority="3">
        <name>Sales Order Processing</name>
        <steps>
          <step>Create SO from approved quotes</step>
          <step>Implement order fulfillment tracking</step>
          <step>Add partial shipment handling</step>
          <step>Build backorder management</step>
          <step>Create order modification workflow</step>
        </steps>
      </task>

      <task priority="4">
        <name>Invoice Generation</name>
        <steps>
          <step>Design invoice data model with tax calculations</step>
          <step>Implement invoice numbering sequences</step>
          <step>Create invoice-from-order automation</step>
          <step>Build tax calculation engine</step>
          <step>Add credit note functionality</step>
          <step>Implement recurring invoice templates</step>
          <step>Create customizable invoice PDF templates</step>
        </steps>
      </task>

      <task priority="5">
        <name>Accounts Receivable Ledger</name>
        <steps>
          <step>Create AR subsidiary ledger structure</step>
          <step>Implement invoice posting to GL</step>
          <step>Build payment application system</step>
          <step>Add cash receipt processing</step>
          <step>Create payment matching algorithms</step>
          <step>Implement write-off procedures</step>
        </steps>
      </task>

      <task priority="6">
        <name>Collections Management</name>
        <steps>
          <step>Build aging analysis engine (30/60/90/120+ days)</step>
          <step>Create dunning letter templates</step>
          <step>Implement collection workflow automation</step>
          <step>Add promise-to-pay tracking</step>
          <step>Build customer statement generation</step>
          <step>Create collection performance metrics</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="4" name="Creditors Management">
    <objectives>Complete accounts payable system with approval workflows</objectives>
    <duration>3 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Vendor Master Data</name>
        <steps>
          <step>Create vendor entity with payment preferences</step>
          <step>Implement vendor categorization</step>
          <step>Add bank account management for payments</step>
          <step>Build vendor document repository</step>
          <step>Create vendor performance tracking</step>
          <step>Add tax withholding configuration</step>
        </steps>
      </task>

      <task priority="2">
        <name>Requisition System</name>
        <steps>
          <step>Design requisition form with line items</step>
          <step>Implement department/cost center allocation</step>
          <step>Create requisition approval matrix</step>
          <step>Build budget checking integration</step>
          <step>Add requisition-to-PO conversion</step>
          <step>Implement urgent request handling</step>
        </steps>
      </task>

      <task priority="3">
        <name>Quotation Management</name>
        <steps>
          <step>Create vendor quote upload interface</step>
          <step>Implement quote comparison tools</step>
          <step>Build quote evaluation workflow</step>
          <step>Add quote validity tracking</step>
          <step>Create vendor quote history</step>
        </steps>
      </task>

      <task priority="4">
        <name>Purchase Order System</name>
        <steps>
          <step>Design PO structure with approval limits</step>
          <step>Implement multi-level approval routing</step>
          <step>Create PO amendment workflow</step>
          <step>Build PO-to-receipt matching</step>
          <step>Add blanket PO functionality</step>
          <step>Implement PO closeout procedures</step>
        </steps>
      </task>

      <task priority="5">
        <name>Invoice Processing</name>
        <steps>
          <step>Create vendor invoice capture interface</step>
          <step>Implement 3-way matching (PO-Receipt-Invoice)</step>
          <step>Build invoice approval workflow</step>
          <step>Add invoice exception handling</step>
          <step>Create duplicate invoice detection</step>
          <step>Implement accrual processes</step>
        </steps>
      </task>

      <task priority="6">
        <name>Accounts Payable Ledger</name>
        <steps>
          <step>Create AP subsidiary ledger</step>
          <step>Implement invoice posting to GL</step>
          <step>Build payment scheduling system</step>
          <step>Add payment batch processing</step>
          <step>Create payment confirmation workflow</step>
          <step>Implement vendor statement reconciliation</step>
        </steps>
      </task>

      <task priority="7">
        <name>Payment Processing</name>
        <steps>
          <step>Design payment run selection criteria</step>
          <step>Implement payment method management</step>
          <step>Create check/EFT generation</step>
          <step>Build payment approval workflow</step>
          <step>Add positive pay file generation</step>
          <step>Implement payment void/reissue</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="5" name="Bank and Cash Management">
    <objectives>Comprehensive bank integration and cash flow management</objectives>
    <duration>2 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Bank Account Management</name>
        <steps>
          <step>Create bank account master with GL mapping</step>
          <step>Implement account type classification</step>
          <step>Add signatory management</step>
          <step>Build account balance tracking</step>
          <step>Create inter-account transfer functionality</step>
        </steps>
      </task>

      <task priority="2">
        <name>Enhanced Bank Statement Import</name>
        <steps>
          <step>Extend PDF extraction for all bank formats</step>
          <step>Implement statement parsing rules engine</step>
          <step>Create transaction categorization ML model</step>
          <step>Build duplicate transaction detection</step>
          <step>Add multi-format support (OFX, QIF, CSV)</step>
        </steps>
      </task>

      <task priority="3">
        <name>Bank Reconciliation</name>
        <steps>
          <step>Design reconciliation workspace UI</step>
          <step>Implement auto-matching algorithms</step>
          <step>Create manual matching interface</step>
          <step>Build reconciliation adjustment entries</step>
          <step>Add reconciliation reporting</step>
          <step>Implement period lock after reconciliation</step>
        </steps>
      </task>

      <task priority="4">
        <name>Cash Flow Management</name>
        <steps>
          <step>Create cash position dashboard</step>
          <step>Implement cash forecast engine</step>
          <step>Build payment priority algorithms</step>
          <step>Add cash requirement planning</step>
          <step>Create liquidity analysis tools</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="6" name="Managed Accounts Features">
    <objectives>Extended capabilities for clients with manageAccounts flag</objectives>
    <duration>2 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Full GL Capabilities</name>
        <steps>
          <step>Enable complete COA access for managed accounts</step>
          <step>Implement journal entry permissions</step>
          <step>Create inter-company transaction handling</step>
          <step>Build consolidation elimination entries</step>
          <step>Add segment reporting capabilities</step>
        </steps>
      </task>

      <task priority="2">
        <name>Trading Accounts</name>
        <steps>
          <step>Create trading account structure</step>
          <step>Implement cost of goods sold calculations</step>
          <step>Build gross profit analysis</step>
          <step>Add inventory integration points</step>
          <step>Create trading statement generation</step>
        </steps>
      </task>

      <task priority="3">
        <name>Balance Sheet Management</name>
        <steps>
          <step>Design balance sheet structure with groupings</step>
          <step>Implement working capital calculations</step>
          <step>Create ratio analysis tools</step>
          <step>Build comparative balance sheets</step>
          <step>Add balance sheet reconciliation</step>
        </steps>
      </task>

      <task priority="4">
        <name>Profit & Loss Statements</name>
        <steps>
          <step>Create P&L structure with subtotals</step>
          <step>Implement multi-period comparisons</step>
          <step>Build variance analysis</step>
          <step>Add departmental P&L capabilities</step>
          <step>Create P&L drill-down functionality</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="7" name="Document Management System">
    <objectives>Comprehensive document handling with PDF extraction</objectives>
    <duration>2 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Document Repository</name>
        <steps>
          <step>Create document storage structure in Firebase</step>
          <step>Implement document categorization</step>
          <step>Build version control system</step>
          <step>Add document tagging and metadata</step>
          <step>Create document access controls</step>
        </steps>
      </task>

      <task priority="2">
        <name>PDF Extraction Enhancement</name>
        <steps>
          <step>Extend extraction for invoices and quotes</step>
          <step>Implement field mapping configurations</step>
          <step>Create extraction confidence scoring</step>
          <step>Build manual correction interface</step>
          <step>Add extraction template learning</step>
        </steps>
      </task>

      <task priority="3">
        <name>Legacy Document Import</name>
        <steps>
          <step>Design bulk import interface</step>
          <step>Implement document classification AI</step>
          <step>Create historical data mapping</step>
          <step>Build import validation rules</step>
          <step>Add import progress tracking</step>
        </steps>
      </task>

      <task priority="4">
        <name>Multi-layered Document Views</name>
        <steps>
          <step>Create document viewer component</step>
          <step>Implement annotation layers</step>
          <step>Build approval stamp overlays</step>
          <step>Add comment threading</step>
          <step>Create audit trail visualization</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="8" name="Financial Dashboard">
    <objectives>Comprehensive real-time financial insights and KPIs</objectives>
    <duration>2 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Dashboard Framework</name>
        <steps>
          <step>Design responsive dashboard layout</step>
          <step>Implement widget-based architecture</step>
          <step>Create user customization capabilities</step>
          <step>Build real-time data refresh</step>
          <step>Add dashboard templates by role</step>
        </steps>
      </task>

      <task priority="2">
        <name>Financial KPIs</name>
        <steps>
          <step>Implement working capital metrics</step>
          <step>Create liquidity ratios (current, quick, cash)</step>
          <step>Build profitability indicators</step>
          <step>Add efficiency ratios (DSO, DPO, DIO)</step>
          <step>Create trend analysis visualizations</step>
        </steps>
      </task>

      <task priority="3">
        <name>Operational Metrics</name>
        <steps>
          <step>Build AR/AP aging summaries</step>
          <step>Create cash flow projections</step>
          <step>Implement budget vs actual analysis</step>
          <step>Add outstanding items tracking</step>
          <step>Create exception alerts system</step>
        </steps>
      </task>

      <task priority="4">
        <name>Interactive Visualizations</name>
        <steps>
          <step>Implement chart.js or D3.js integrations</step>
          <step>Create drill-down capabilities</step>
          <step>Build comparative period analysis</step>
          <step>Add data export functionality</step>
          <step>Implement chart customization options</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="9" name="Reporting and Analytics">
    <objectives>Comprehensive reporting suite with analytics</objectives>
    <duration>2 weeks</duration>

    <tasks>
      <task priority="1">
        <name>Report Engine</name>
        <steps>
          <step>Create report definition framework</step>
          <step>Implement report scheduling system</step>
          <step>Build report distribution management</step>
          <step>Add report caching for performance</step>
          <step>Create report version control</step>
        </steps>
      </task>

      <task priority="2">
        <name>Financial Reports</name>
        <steps>
          <step>Build trial balance with drill-down</step>
          <step>Create general ledger reports</step>
          <step>Implement cash flow statements</step>
          <step>Add financial ratio reports</step>
          <step>Create management report pack</step>
        </steps>
      </task>

      <task priority="3">
        <name>Operational Reports</name>
        <steps>
          <step>Create aging analysis reports</step>
          <step>Build customer/vendor statements</step>
          <step>Implement payment due reports</step>
          <step>Add collection effectiveness reports</step>
          <step>Create purchase analysis reports</step>
        </steps>
      </task>

      <task priority="4">
        <name>Custom Report Builder</name>
        <steps>
          <step>Design drag-drop report builder UI</step>
          <step>Implement field selection interface</step>
          <step>Create formula builder</step>
          <step>Add filtering and grouping options</step>
          <step>Build report sharing capabilities</step>
        </steps>
      </task>
    </tasks>
  </phase>

  <phase number="10" name="Integration and Automation">
    <objectives>System integration and process automation</objectives>
    <duration>1 week</duration>

    <tasks>
      <task priority="1">
        <name>API Development</name>
        <steps>
          <step>Create RESTful API endpoints</step>
          <step>Implement GraphQL schema</step>
          <step>Build webhook system for events</step>
          <step>Add API rate limiting</step>
          <step>Create API documentation</step>
        </steps>
      </task>

      <task priority="2">
        <name>Workflow Automation</name>
        <steps>
          <step>Implement approval chain automation</step>
          <step>Create notification engine</step>
          <step>Build scheduled task system</step>
          <step>Add business rule engine</step>
          <step>Create workflow monitoring dashboard</step>
        </steps>
      </task>

      <task priority="3">
        <name>Data Import/Export</name>
        <steps>
          <step>Create data mapping templates</step>
          <step>Implement batch import processing</step>
          <step>Build export scheduling system</step>
          <step>Add data transformation rules</step>
          <step>Create import/export audit logs</step>
        </steps>
      </task>
    </tasks>
  </phase>
</implementation_phases>

<technical_specifications>
  <firebase_structure>
    <collections>
      <collection name="companies">
        <fields>
          <field>id, name, type, parentCompanyId, manageAccounts, settings</field>
        </fields>
      </collection>
      <collection name="chartOfAccounts">
        <fields>
          <field>id, companyId, code, name, type, parentId, normalBalance, active</field>
        </fields>
      </collection>
      <collection name="generalLedger">
        <fields>
          <field>id, companyId, date, journalId, accountId, debit, credit, reference</field>
        </fields>
      </collection>
      <collection name="customers">
        <fields>
          <field>id, companyId, code, name, creditLimit, paymentTerms, balance</field>
        </fields>
      </collection>
      <collection name="vendors">
        <fields>
          <field>id, companyId, code, name, paymentTerms, bankDetails, balance</field>
        </fields>
      </collection>
      <collection name="invoices">
        <fields>
          <field>id, companyId, type, number, date, dueDate, amount, status</field>
        </fields>
      </collection>
    </collections>
  </firebase_structure>

  <security_rules>
    <rule>Implement row-level security with companyId checks</rule>
    <rule>Add role-based access control per module</rule>
    <rule>Create audit trail for all modifications</rule>
    <rule>Implement field-level encryption for sensitive data</rule>
  </security_rules>
</technical_specifications>

<constraints>
  <constraint priority="1">Maintain ACID compliance for all financial transactions</constraint>
  <constraint priority="2">Ensure complete audit trail with no data deletion, only soft deletes</constraint>
  <constraint priority="3">Implement proper decimal precision for currency (minimum 4 decimal places)</constraint>
  <constraint priority="4">Enforce double-entry balance validation on every transaction</constraint>
  <constraint priority="5">Maintain tenant data isolation with zero cross-contamination</constraint>
  <constraint priority="6">Ensure PDF extraction accuracy with manual override capabilities</constraint>
  <constraint priority="7">Implement idempotent operations for all critical processes</constraint>
</constraints>

<rules>
  <rule type="must">Every debit must have corresponding credit(s) of equal value</rule>
  <rule type="must">All financial periods must be closed in sequence</rule>
  <rule type="must">Posted transactions must be immutable (reversals only)</rule>
  <rule type="must">Every transaction must have a unique reference number</rule>
  <rule type="should">Implement real-time balance calculations where possible</rule>
  <rule type="should">Provide drill-down capability from summary to detail</rule>
  <rule type="may">Cache frequently accessed data for performance</rule>
</rules>

<validation_requirements>
  <validation area="transactions">
    <check>Debits equal credits for every journal entry</check>
    <check>Account exists and is active</check>
    <check>Posting period is open</check>
    <check>User has permission for account/amount</check>
  </validation>

  <validation area="documents">
    <check>Invoice numbers are unique per vendor/customer</check>
    <check>Dates are within acceptable ranges</check>
    <check>Tax calculations are accurate</check>
    <check>Approval limits are respected</check>
  </validation>
</validation_requirements>

<performance_targets>
  <target>Dashboard load time under 2 seconds</target>
  <target>Transaction posting under 500ms</target>
  <target>Report generation under 5 seconds for standard reports</target>
  <target>PDF extraction under 3 seconds per page</target>
  <target>Support 100+ concurrent users per tenant</target>
</performance_targets>

<thinking>
  The implementation should follow accounting best practices while maintaining flexibility for different business types. Start with the core accounting foundation as it's the backbone of the entire system. The multi-tenant architecture must be implemented early to avoid costly refactoring. Each phase builds upon the previous, ensuring dependencies are met. The system should be designed for extensibility, allowing additional modules to be added without disrupting existing functionality. Focus on data integrity and audit trails from the beginning, as these are critical for financial systems and difficult to retrofit.
</thinking>
```

## Usage Notes
- Begin with Phase 1 (Core Accounting Foundation) as all other modules depend on it
- Implement multi-tenant architecture (Phase 2) before adding tenant-specific features
- Test each phase thoroughly before proceeding to the next
- Consider implementing a subset of features for MVP and expanding based on user feedback
- Ensure proper error handling and validation at every step
- Document all accounting rules and calculations for future maintenance
- Plan for data migration from existing systems early in the project