# Smoke Test: Quote PDF Logo Fix

## Quick Verification (2 minutes)

### Setup
- Ensure dev server is running: `npm run dev`
- Have a company with a logo uploaded
- Have at least one quote for that company

### Test 1: View Dialog Logo ✓
1. Go to `/workspace/[companyId]/quotes`
2. Click "View Details" on any quote
3. **Check**: Logo appears in top-left corner

**Expected**: ✅ Logo shows clearly at 80x80px
**Pass/Fail**: _______

### Test 2: PDF Logo ✓
1. In the view dialog, click "Download PDF"
2. Wait for "Generating PDF..." toast
3. Open the downloaded PDF
4. **Check**: Logo appears on first page, top-left

**Expected**: ✅ Logo is clear and properly positioned
**Pass/Fail**: _______

### Test 3: Console Errors ✓
1. Open browser DevTools Console
2. Download another PDF
3. **Check**: No CORS errors or logo-related errors

**Expected**: ✅ Only "Starting PDF generation..." log
**Pass/Fail**: _______

### Test 4: Multiple Quotes ✓
1. Download PDFs for 3 different quotes
2. **Check**: All PDFs contain the logo

**Expected**: ✅ Logo appears in all PDFs
**Pass/Fail**: _______

---

## Common Issues

### Issue: Logo missing in PDF
**Check**:
- Company has `logoUrl` field set
- Logo URL is valid Firebase Storage URL
- Browser console for errors

### Issue: CORS error
**Check**:
- `data-company-logo` attribute is on the img tag
- `crossOrigin="anonymous"` is present
- `fetchImageAsDataUrl` function is defined

### Issue: PDF generation fails
**Check**:
- Quote has customer selected
- `printContentRef` is attached to the content div
- No JavaScript errors before clicking Download

---

## Success Criteria

All 4 tests pass:
- [ ] Logo shows in view dialog
- [ ] Logo shows in PDF
- [ ] No console errors
- [ ] Logo in multiple PDFs

**Overall Status**: ⬜ PASS / ⬜ FAIL

**Tested by**: _______________
**Date**: _______________
**Notes**:
