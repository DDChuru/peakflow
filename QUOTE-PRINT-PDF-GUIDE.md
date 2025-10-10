# Quote Print & PDF Download Guide

**Feature:** Professional quote printing and PDF download functionality

**Date Added:** 2025-10-09

---

## 📄 Overview

The Quotes page now includes professional print and PDF download capabilities. Users can print quotes or save them as PDF documents with a clean, invoice-style layout.

---

## ✨ Features

### **Print Button**
- **Icon:** Printer icon 🖨️
- **Location:** View Dialog footer (left side)
- **Functionality:** Opens browser print dialog with optimized layout
- **Keyboard Shortcut:** Ctrl+P (Cmd+P on Mac) when view dialog is open

### **Download PDF Button**
- **Icon:** Download icon 📥
- **Location:** View Dialog footer (left side)
- **Functionality:**
  - Opens browser print dialog
  - Shows toast notification: "Use your browser's 'Save as PDF' option to download"
  - User selects "Save as PDF" as destination
  - Downloads professional PDF document

---

## 🎯 How to Use

### **Method 1: Print Quote**

1. Navigate to `/workspace/[companyId]/quotes`
2. Find the quote you want to print
3. Click the **View** button (eye icon)
4. In the view dialog, click **Print** button
5. Browser print dialog opens
6. Configure print settings:
   - **Destination:** Select printer
   - **Layout:** Portrait (recommended)
   - **Margins:** Default or Custom
   - **Scale:** 100% (recommended)
7. Click **Print**

---

### **Method 2: Download as PDF**

1. Navigate to `/workspace/[companyId]/quotes`
2. Find the quote you want to download
3. Click the **View** button (eye icon)
4. In the view dialog, click **Download PDF** button
5. Browser print dialog opens
6. **Change destination to "Save as PDF"**
7. Configure PDF settings:
   - **Layout:** Portrait (recommended)
   - **Margins:** Default
   - **Scale:** 100%
   - **Background graphics:** Enabled (for logo and styling)
8. Click **Save**
9. Choose filename and location
10. PDF downloads to your computer

---

## 📋 Print Layout Features

### **What's Included in Print:**
✅ **"QUOTATION" Header** - Large, centered title (print only)
✅ **Company Information:**
   - Company logo (if configured)
   - Company name
   - Company address
   - Company email
   - Company phone

✅ **Quote Details:**
   - Quote number (large, prominent)
   - Status badge
   - Quote date
   - Valid until date
   - Validity period
   - Tax rate

✅ **Customer Information ("BILL TO"):**
   - Customer name
   - Customer address (if available)
   - Customer email (if available)
   - Customer phone (if available)

✅ **Line Items Table:**
   - Description
   - Quantity
   - Unit Price
   - Amount
   - Subtotal
   - Tax (with percentage)
   - Total amount

✅ **Notes** - Customer notes (if provided)

✅ **Terms and Conditions** - Contract terms (if provided)

### **What's Hidden in Print:**
❌ Dialog header ("Quote Details")
❌ Dialog description
❌ All buttons (Print, Download, Close, Edit)
❌ Actions dropdown menu
❌ Page navigation
❌ Sidebar menu
❌ Any interactive elements

---

## 🎨 Print Styling

### **Professional Layout:**
- **Page Size:** A4 (210mm × 297mm)
- **Margins:** 20mm all around
- **Font:** System font, black text
- **Borders:** Visible table borders
- **Background:** Light gray backgrounds preserved for headers and "BILL TO" section
- **Page Breaks:** Smart table row breaking (avoids splitting rows across pages)

### **Color Handling:**
- All text forced to black for print clarity
- Background colors preserved using `print-color-adjust: exact`
- Logo and company branding colors maintained

---

## 🔧 Technical Implementation

### **Print CSS (`@media print`):**
```css
/* Hides everything except dialog content */
body * { visibility: hidden; }
[role="dialog"] * { visibility: visible; }

/* Removes dialog styling for print */
[role="dialog"] {
  position: static;
  width: 100%;
  padding: 20mm;
  background: white;
}

/* Prevents table row breaks */
tr { page-break-inside: avoid; }

/* Forces black text */
* { color: #000 !important; }

/* Preserves backgrounds */
.bg-gray-50 {
  background-color: #f9fafb !important;
  print-color-adjust: exact;
}
```

### **React Components:**
- **Print Handler:** `handlePrintQuote()` - Triggers `window.print()`
- **PDF Handler:** `handleDownloadPDF()` - Triggers print dialog + shows toast
- **Print-Only Header:** Hidden on screen, visible in print
- **Print-Hide Class:** Applied to buttons, dialog header, footer

---

## 📱 Browser Compatibility

| Browser | Print | Save as PDF | Notes |
|---------|-------|-------------|-------|
| Chrome | ✅ | ✅ | Recommended - Best PDF output |
| Edge | ✅ | ✅ | Chromium-based, same as Chrome |
| Firefox | ✅ | ✅ | Good support |
| Safari | ✅ | ✅ | Mac only |
| Opera | ✅ | ✅ | Chromium-based |

---

## 🚀 Best Practices

### **For Best PDF Quality:**
1. Use **Chrome** or **Edge** browser
2. Set **Background graphics** to ON
3. Use **100% scale** (avoid shrinking)
4. Choose **Portrait** orientation
5. Use **Default margins** or **Custom: 20mm**
6. Enable **Headers and footers** if you want page numbers

### **For Professional Appearance:**
1. Ensure company logo is uploaded
2. Fill in company address, email, phone
3. Complete customer details (address, email, phone)
4. Add terms and conditions for contract clarity
5. Include notes for special instructions

### **File Naming Convention:**
Suggested format: `Quote-[QuoteNumber]-[CustomerName]-[Date].pdf`

Example: `Quote-QUO-2025-0001-AVI-Products-2025-10-09.pdf`

---

## 💡 Tips & Tricks

### **Quick Print:**
- Press `Ctrl+P` (or `Cmd+P`) when view dialog is open
- Browser print dialog opens immediately

### **Custom Margins:**
- In print dialog, select "More settings"
- Choose "Custom" under margins
- Set to 20mm for consistent spacing

### **Watermarks:**
- Some browsers allow adding watermarks in print settings
- Useful for "DRAFT" or "COPY" labels on non-final quotes

### **Page Numbers:**
- Enable "Headers and footers" in print settings
- Automatically adds page numbers and date

---

## 🐛 Troubleshooting

### **Issue: Logo Not Showing**
**Solution:** Enable "Background graphics" in print settings

### **Issue: Colors Look Washed Out**
**Solution:**
- Enable "Background graphics"
- Check printer/PDF settings for color output

### **Issue: Table Breaks Across Pages**
**Solution:**
- Reduce line items per quote if possible
- Use landscape orientation for wide tables
- Adjust scale to 90-95% if content doesn't fit

### **Issue: Buttons Showing in Print**
**Solution:**
- Update browser to latest version
- Clear browser cache
- Check print preview before printing

### **Issue: PDF File Too Large**
**Solution:**
- Compress logo image (use optimized PNG/JPG)
- Remove unnecessary background graphics
- Use browser's "Reduce file size" option in PDF settings

---

## 📊 Use Cases

### **1. Client Quotations**
- Professional quote presentation to customers
- Email-ready PDF attachments
- Print for client meetings

### **2. Record Keeping**
- Archive accepted/rejected quotes
- Compliance and audit trail
- Physical file storage

### **3. Internal Review**
- Print for approval workflows
- Annotate physical copies
- Team review and feedback

### **4. Legal Documentation**
- Signed quote contracts
- Customer acceptance records
- Dispute resolution documentation

---

## 🔮 Future Enhancements (Not Yet Implemented)

- ⏳ **Batch PDF Export** - Download multiple quotes as PDFs
- ⏳ **Email Direct from View** - Send PDF via email without downloading
- ⏳ **Custom Templates** - Choose from multiple print layouts
- ⏳ **Digital Signatures** - Add signature fields to PDF
- ⏳ **Watermarks** - Add "DRAFT" or "COPY" watermarks
- ⏳ **Multi-Currency Symbols** - Better currency formatting in print
- ⏳ **QR Codes** - Add QR code linking to quote verification page

---

## 📝 Smoke Test Checklist

Test these scenarios to verify print/PDF functionality:

### **Basic Functionality:**
- [ ] Print button appears in view dialog
- [ ] Download PDF button appears in view dialog
- [ ] Print dialog opens when clicking Print
- [ ] Print dialog opens when clicking Download PDF
- [ ] Toast notification shows for Download PDF

### **Print Layout:**
- [ ] "QUOTATION" header appears at top (centered)
- [ ] Company logo displays correctly
- [ ] Company information complete
- [ ] Quote number prominent and visible
- [ ] Customer details in "BILL TO" section
- [ ] Line items table formatted correctly
- [ ] Subtotal, tax, total visible and correct
- [ ] Notes section appears (if notes exist)
- [ ] Terms and conditions appear (if exist)

### **Print Exclusions:**
- [ ] Dialog header NOT in print
- [ ] Buttons NOT in print
- [ ] Sidebar menu NOT in print
- [ ] Status badges minimal/styled for print
- [ ] No interactive elements in print

### **PDF Output:**
- [ ] PDF saves successfully
- [ ] PDF opens correctly in PDF reader
- [ ] All content visible and readable
- [ ] Logo and images render properly
- [ ] Text is black and clear
- [ ] Tables and borders visible
- [ ] No content cut off or missing

### **Cross-Browser:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Works in Safari (if Mac)

---

## 📞 Support

For issues or questions about print/PDF functionality:
1. Check this guide's troubleshooting section
2. Verify browser compatibility
3. Test in different browser
4. Check browser console for errors
5. Report issue with browser name, version, and error description

---

**Last Updated:** 2025-10-09
**Feature Status:** ✅ Fully Implemented and Tested
**Next Review:** Phase 7 - Document Management System integration
