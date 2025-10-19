# Reset Posted Invoices - Quick Guide

## What This Script Does

This script will **completely reset** your General Ledger for testing purposes:

1. ✅ Deletes all journal entries (`journal_entries` collection)
2. ✅ Deletes all general ledger entries (`general_ledger` collection)
3. ✅ Resets all invoices to unpaid/unposted status
4. ✅ Resets all debtor balances to zero

## When to Use

- 🧪 **Testing phase** - You've posted a few test invoices and want to re-post with updated structure
- 🔄 **After ledger structure changes** - We just added account names, descriptions, and dimensions
- 🗑️ **Clean slate** - You want to start fresh with your accounting data

## ⚠️ WARNING

**This is a DESTRUCTIVE operation!**

- All journal entries will be DELETED
- All ledger entries will be DELETED
- All invoice posting history will be REMOVED
- All debtor balances will be RESET to zero

**Only use this in development/testing environments!**

## How to Run

### Option 1: Reset ALL companies (current usage)

```bash
npm run reset:posted-invoices
```

### Option 2: Reset specific company only

```bash
npm run reset:posted-invoices <companyId>
```

Example:
```bash
npm run reset:posted-invoices abc123xyz456
```

## After Running the Script

1. Go to your invoices page
2. You'll see your 2 invoices are no longer marked as "Posted"
3. Click "Post to GL" on each invoice
4. Go to Journal Entries page
5. Click "View" on the newly posted entries

**You should now see:**
- ✅ Full account names (e.g., "1200 - Accounts Receivable")
- ✅ Line descriptions (e.g., "Invoice INV-2025-0003 - AVI Products")
- ✅ Customer details in "Transaction Details" section
- ✅ Complete ledger structure with all information

## What Changed in the Ledger Structure

### Before (Old Structure)
```typescript
{
  accountCode: "AR",           // Just the code
  // ❌ No account name
  // ❌ No description
  // ❌ No customer reference
}
```

### After (New Structure)
```typescript
{
  accountCode: "AR",
  accountName: "Accounts Receivable",   // ✅ Full name
  description: "Invoice INV-001 - ...", // ✅ Transaction description
  dimensions: {                          // ✅ Customer reference
    customerId: "cust-123",
    invoiceId: "inv-456"
  }
}
```

## Benefits of New Structure

1. **Better Reporting** - Account names displayed everywhere, not just codes
2. **Audit Trail** - Full descriptions show what each transaction represents
3. **Subsidiary Ledger** - Can now query ledger by customer (AR sub-ledger)
4. **Cross-Reference** - Easy to link back to original invoices and customers

## Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT_PATH not found"

Make sure you have `.env.local` with:
```
FIREBASE_SERVICE_ACCOUNT_PATH=./path-to-service-account.json
```

### Error: "Service account file not found"

Check that your Firebase service account JSON file exists at the path specified in `.env.local`

### Script hangs or takes too long

If you have many companies/invoices, the script may take a while. It processes in batches for safety.

## Need Help?

If something goes wrong, the script will show detailed error messages. All operations are performed in Firestore batches for safety.
