# Quote Edit Functionality - Visual Guide

## Where to Find Quote Edit

### Step 1: Navigate to Quotes Page

```
Your Workspace → Quotes
```

URL: `/workspace/[companyId]/quotes`

### Step 2: Locate Draft Quotes

In the quotes list, look for quotes with **"Draft"** status badge (gray):

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Quote #        Customer      Amount      Status    Quote Date  Actions │
├─────────────────────────────────────────────────────────────────────────┤
│ QUOTE-2024-001 Acme Corp    ZAR 10,000  [Draft]   2024-10-01  [⋯]     │
│ QUOTE-2024-002 Tech Inc     ZAR 5,000   [Sent]    2024-10-05  [⋯]     │
│ QUOTE-2024-003 Beta LLC     ZAR 15,000  [Draft]   2024-10-08  [⋯]     │
└─────────────────────────────────────────────────────────────────────────┘
                                            ↑
                                    Gray badge = Draft
                                    (only drafts can be edited)
```

### Step 3: Open Actions Menu

Click the three-dot menu icon **[⋯]** on the right side of any draft quote:

```
                                                              ┌──────────────────────┐
┌─────────────────────────────────────────────────┐         │ 👁️  View Details     │
│ QUOTE-2024-001 Acme Corp ZAR 10,000 [Draft] [⋯]◄──click──▶│ ✏️  Edit            │
└─────────────────────────────────────────────────┘         │ 📤  Send to Customer│
                                                              │ 🗑️  Delete          │
                                                              └──────────────────────┘
                                                                    ↑
                                                              Click "Edit"
```

### Step 4: Edit Dialog Opens

After clicking Edit, the Edit Dialog appears:

```
┌───────────────────────────────────────────────────────────────────┐
│ Edit Quote                                                      [X]│
│ Update quote information and line items                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│ BASIC INFORMATION                                                  │
│                                                                    │
│ ┌─────────────────────────┐  ┌─────────────────────────┐        │
│ │ Customer *              │  │ Quote Date *            │        │
│ │ [Acme Corp        ▼]    │  │ [2024-10-01      ]     │        │
│ └─────────────────────────┘  └─────────────────────────┘        │
│                                                                    │
│ ┌─────────────────────────┐  ┌─────────────────────────┐        │
│ │ Validity Period (Days)* │  │ Currency                │        │
│ │ [30                ]    │  │ [ZAR            ]      │        │
│ └─────────────────────────┘  └─────────────────────────┘        │
│                                                                    │
│ ┌─────────────────────────┐                                      │
│ │ Tax Rate (%)            │                                      │
│ │ [15                ]    │                                      │
│ └─────────────────────────┘                                      │
│                                                                    │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Notes                                                       │   │
│ │ [Internal notes...                                       ]  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Terms and Conditions                                        │   │
│ │ [Quote terms and conditions...                           ]  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                    │
│ LINE ITEMS *                            [+ Add Line Item]         │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Description *                                          [X]  │  │
│ │ [Professional Services                            ]         │  │
│ │                                                             │  │
│ │ ┌──────────────────┐ ┌──────────────────┐                 │  │
│ │ │ Quantity *       │ │ Unit Price *     │                 │  │
│ │ │ [5          ]    │ │ [2000.00    ]   │                 │  │
│ │ └──────────────────┘ └──────────────────┘                 │  │
│ │                                                             │  │
│ │ ┌────────────────────────────────────────┐                │  │
│ │ │ GL Account *                           │                │  │
│ │ │ [4100 - Revenue                  ▼]    │                │  │
│ │ └────────────────────────────────────────┘                │  │
│ │                                                             │  │
│ │ Amount: R10,000.00                                         │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Subtotal:                               R10,000.00        │   │
│ │ Tax (15%):                              R1,500.00         │   │
│ │ ─────────────────────────────────────────────────────     │   │
│ │ Total Quote Value:                      R11,500.00        │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                    │
│                               [Cancel]  [Update Quote]            │
└───────────────────────────────────────────────────────────────────┘
```

---

## Edit Dialog Features Explained

### Basic Information Section

| Field | Description | Required | Notes |
|-------|-------------|----------|-------|
| **Customer** | Select customer from dropdown | Yes | Pre-filled with current customer |
| **Quote Date** | Date quote was issued | Yes | Format: YYYY-MM-DD |
| **Validity Period** | Number of days quote is valid | Yes | Calculates "Valid Until" date |
| **Currency** | Currency code | No | Default: ZAR |
| **Tax Rate** | Tax percentage | No | Used for total calculation |
| **Notes** | Internal notes | No | Not shown to customer |
| **Terms & Conditions** | Quote terms | No | Shown to customer |

### Line Items Section

Each line item has:

```
┌────────────────────────────────────────────────────┐
│ Description: What is being quoted                  │
│ Quantity: How many units                           │
│ Unit Price: Price per unit                         │
│ GL Account: Revenue/expense account                │
│ Amount: (Quantity × Unit Price) - calculated       │
└────────────────────────────────────────────────────┘
```

**Actions on Line Items**:
- **Add**: Click "+ Add Line Item" button
- **Remove**: Click [X] button on any line item (minimum 1 required)
- **Edit**: Type directly in any field

**Real-time Calculations**:
- Amount updates as you type quantity/unit price
- Subtotal sums all line item amounts
- Tax applies to subtotal
- Total = Subtotal + Tax

### Form Actions

```
[Cancel]  [Update Quote]
   ↓            ↓
Closes      Saves changes
dialog      to database
```

- **Cancel**: Closes dialog without saving, resets form
- **Update Quote**: Validates and submits changes

---

## What Happens When You Click "Update Quote"

### Visual Flow

```
1. Click "Update Quote"
        ↓
2. ⏳ Button shows "Updating..."
        ↓
3. 🔄 Validation checks run
        ↓
4. 📤 Data sent to Firestore
        ↓
5. ✅ Success toast appears
   "Quote updated successfully"
        ↓
6. Dialog closes automatically
        ↓
7. Quote list refreshes
        ↓
8. Updated quote visible in list
```

### Under the Hood (Console Logs)

Open browser console (F12) to see detailed logs:

```
🔧 Opening edit dialog for quote: abc123 QUOTE-2024-001
Quote data: {customerId: "...", lineItems: [...]}
Setting form line items: [...]
✅ Edit dialog opened, state set to true

[User makes changes and clicks Update]

📝 handleEdit called with data: {...}
✅ User and quote validated: {userId: "xyz", quoteId: "abc123"}
✅ Line items validation passed
📤 Calling quoteService.updateQuote with: {...}

🔄 QuoteService.updateQuote called: {companyId, quoteId, userId}
Firestore path: companies/[id]/quotes abc123
📊 Recalculating amounts for line items...
✅ Calculated amounts: {subtotal: 10000, taxAmount: 1500, totalAmount: 11500}
🧹 Clean updates prepared for Firestore: {...}
📤 Updating Firestore document...
✅ Firestore update completed successfully

✅ Quote updated successfully
🔄 Reloading quotes...
✅ Quotes reloaded
```

---

## Common Editing Scenarios

### Scenario 1: Change Validity Period

```
1. Open edit dialog
2. Find "Validity Period (Days)"
3. Change from 30 to 60
4. Click "Update Quote"
5. ✅ "Valid Until" date recalculates automatically
```

### Scenario 2: Adjust Tax Rate

```
1. Open edit dialog
2. Find "Tax Rate (%)"
3. Change from 15 to 20
4. Watch bottom totals update in real-time:
   - Subtotal: R10,000.00 (unchanged)
   - Tax (20%): R2,000.00 (updated)
   - Total: R12,000.00 (updated)
5. Click "Update Quote"
```

### Scenario 3: Add a Line Item

```
1. Open edit dialog
2. Scroll to "LINE ITEMS" section
3. Click "+ Add Line Item"
4. Fill in new item:
   Description: "Consulting Services"
   Quantity: 10
   Unit Price: 150
   GL Account: Select from dropdown
5. Amount shows: R1,500.00
6. Total at bottom updates: R13,500.00 (old + new)
7. Click "Update Quote"
```

### Scenario 4: Remove a Line Item

```
1. Open edit dialog with quote that has multiple line items
2. Find line item to remove
3. Click [X] button in top-right of that item
4. Item disappears immediately
5. Totals recalculate
6. Click "Update Quote"
```

### Scenario 5: Change Customer

```
1. Open edit dialog
2. Find "Customer" dropdown at top
3. Select different customer
4. All other fields remain unchanged
5. Click "Update Quote"
6. ✅ Quote now shows new customer name in list
```

---

## Validation Rules

### What You Can't Do (Will Show Errors)

❌ **Leave Customer Empty**
```
Error: "Customer is required"
```

❌ **Leave Quote Date Empty**
```
Error: "Quote date is required"
```

❌ **Set Quantity to 0 or Negative**
```
Error: "Quantity must be greater than 0"
Red border appears on field
```

❌ **Set Negative Unit Price**
```
Error: "Unit price must be greater than or equal to 0"
```

❌ **Leave Line Item Fields Empty**
```
Toast: "Please fill in all required line item fields"
Red borders on empty fields
```

❌ **Remove All Line Items**
```
Button disabled: "Update Quote"
Must have at least one line item
```

### What You CAN Do

✅ Clear optional fields (Notes, Terms, Currency)
✅ Set Tax Rate to 0
✅ Have multiple line items
✅ Edit then cancel (no changes saved)
✅ Edit same quote multiple times

---

## Status Restrictions

### Can Edit: Draft Quotes Only

```
[Draft] ← Edit button visible ✅
[Sent] ← No edit button ❌
[Accepted] ← No edit button ❌
[Rejected] ← No edit button ❌
```

**Why?** Once a quote is sent to a customer, it becomes a binding document and should not be changed. If changes are needed, create a new quote.

### If You Need to Edit a Sent Quote

**Option 1**: Create a new quote based on the old one
1. View the sent quote
2. Copy details manually
3. Create new draft quote
4. Make changes
5. Send new quote

**Option 2**: Admin can change status (future feature)
- Requires admin permissions
- Audit trail required
- Customer notification needed

---

## Troubleshooting

### Dialog Doesn't Open

**Check**:
1. Is quote status "Draft"? Only drafts can be edited
2. Check browser console for errors (F12)
3. Refresh the page and try again

**Solution**: If console shows errors, report them

### Form Fields Are Empty

**Check**:
1. Console logs for "Opening edit dialog"
2. Verify quote data is loading

**Solution**: Check if quote has all required data in database

### Can't Click Update Button

**Possible Reasons**:
1. Button shows "Updating..." → Wait for current save to complete
2. No line items → Add at least one line item
3. Validation errors → Check for red borders on fields

**Solution**: Fix validation errors, ensure at least one line item

### Changes Don't Save

**Check**:
1. Console for error messages (F12)
2. Network tab for failed requests
3. Firestore rules for permissions

**Solution**:
- Verify you have edit permissions for this company
- Check if you're still logged in
- Try refreshing and editing again

### Dialog Doesn't Close After Save

**Check**:
1. Look for error toast message
2. Console logs for errors
3. Network tab for failed Firestore update

**Solution**: Fix the error, then dialog will close on successful save

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Move between fields |
| **Shift+Tab** | Move backwards between fields |
| **Esc** | Close dialog (same as Cancel) |
| **Enter** | Submit form (when in most fields) |

**Note**: Enter in textarea fields (Notes, Terms) adds new line instead of submitting.

---

## Best Practices

### Before Editing

✅ Check who created the quote (View Details)
✅ Verify you have permission to edit
✅ Review current values to understand changes needed

### While Editing

✅ Use meaningful descriptions for line items
✅ Double-check quantities and prices
✅ Verify GL accounts are correct (affects accounting)
✅ Watch real-time totals as you type
✅ Add notes for internal reference

### After Editing

✅ Review updated quote in View Details
✅ Verify all changes saved correctly
✅ Check calculated dates and amounts
✅ Inform relevant team members if needed

---

## Related Actions

After editing a quote, you might want to:

- **Send to Customer**: Change status to "Sent"
- **View Details**: Review complete quote
- **Convert to Invoice**: If accepted (after sending)
- **Delete**: If no longer needed
- **Create Similar Quote**: Use as template

---

## Where to Get Help

- **Smoke Test Guide**: `/smoke-test-quote-edit-fix.md`
- **Implementation Summary**: `/QUOTE-EDIT-FIX-SUMMARY.md`
- **Console Logs**: Press F12 to see detailed operation logs
- **Support**: Check Firestore rules and permissions if issues persist

---

**Last Updated**: 2025-10-09
**Feature Status**: ✅ Fully Functional
