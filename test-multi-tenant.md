# Multi-Tenant Architecture Test Guide

## Test Scenarios for Data Isolation

### 1. Company Isolation Test
- [ ] Create two test companies (Company A and Company B)
- [ ] Assign different users to each company
- [ ] Verify User A cannot see Company B's data
- [ ] Verify User B cannot see Company A's data

### 2. Debtors/Creditors Isolation Test
- [ ] Add debtors to Company A
- [ ] Add creditors to Company A
- [ ] Add debtors to Company B
- [ ] Add creditors to Company B
- [ ] Verify Company A users only see their debtors/creditors
- [ ] Verify Company B users only see their debtors/creditors

### 3. Transaction Isolation Test
- [ ] Create transactions for Company A
- [ ] Create transactions for Company B
- [ ] Verify transactions are isolated by company
- [ ] Test reconciliation within each company

### 4. Security Rules Test
- [ ] Test that users cannot manually access other company's data via Firestore
- [ ] Verify companyId cannot be changed once set
- [ ] Test admin access across companies
- [ ] Verify regular users are restricted to their company

### 5. Service Layer Test
```javascript
// Test code to verify isolation
const testIsolation = async () => {
  // Test 1: Fetch debtors for Company A
  const debtorsA = await debtorService.getDebtors('company-a-id');

  // Test 2: Try to fetch debtors for Company B (should fail for Company A user)
  try {
    const debtorsB = await debtorService.getDebtors('company-b-id');
    console.error('FAIL: Should not access other company data');
  } catch (error) {
    console.log('PASS: Correctly blocked cross-company access');
  }

  // Test 3: Verify CSC path structure
  const path = debtorService.getCollectionPath('company-a-id');
  console.assert(path === 'companies/company-a-id/debtors', 'CSC path correct');
};
```

## Key Features Implemented

### Company-Scoped Collections (CSC) Pattern
- All financial data is scoped under `/companies/{companyId}/collection`
- Ensures complete data isolation at the database level
- No possibility of cross-tenant data leakage

### Security Rules
- `belongsToCompany()` function ensures users only access their company's data
- Company admins have elevated permissions within their company only
- System admins can access all companies (for PeakFlow staff)

### Service Architecture
- DebtorService: Manages company-specific debtors
- CreditorService: Manages company-specific creditors
- TransactionService: Handles financial transactions with automatic balance updates
- All services enforce companyId at the service layer

### UI Components
- Financial Dashboard: Company-specific overview with summaries
- Debtors Management: Full CRUD with filtering and export
- Creditors Management: (Similar to debtors - to be implemented)
- Transaction Management: (To be implemented)

## Testing Checklist

- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Create test companies via UI
- [ ] Add test users to different companies
- [ ] Test data isolation scenarios
- [ ] Verify dashboard summaries are accurate
- [ ] Test export functionality
- [ ] Verify audit trail for changes

## Success Criteria

✅ Each company sees only their own data
✅ No cross-company data access possible
✅ Company admins can manage their company data
✅ System admins can access all companies
✅ All CRUD operations respect tenant boundaries
✅ Performance remains optimal with CSC pattern