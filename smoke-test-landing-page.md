# Landing Page Smoke Test Guide

## Quick Verification Steps (< 2 minutes)

### 1. Hero Section Check ✨
- [ ] Gradient background with animated blur circles visible
- [ ] Large "Financial Operations Simplified" heading with gradient text
- [ ] Two CTA buttons: "Start Free Trial" and "Watch Demo"
- [ ] Floating dashboard preview card at bottom
- [ ] Trust indicators showing "No credit card required"

### 2. Navigation Test 🧭
- [ ] Fixed navbar becomes white/translucent on scroll
- [ ] Logo with PeakFlow branding visible
- [ ] Navigation links: Features, Testimonials, Pricing
- [ ] Sign In and Get Started buttons in header

### 3. Features Section 📋
- [ ] 5 feature cards displayed in responsive grid
- [ ] Each card has gradient icon and highlight badge
- [ ] Features match the 5 from custom-memory.md:
  - Direct Bank to Ledger Import (SME-Focused)
  - Smart Bank Reconciliation (95% Accuracy)
  - Complete Billing Suite (End-to-End)
  - Multi-tenant Architecture (Enterprise Security)
  - Real-time Financial Dashboard (Real-time)

### 4. Social Proof 🌟
- [ ] 3 testimonial cards with 5-star ratings
- [ ] Avatar initials and role information
- [ ] Statistics showing "10,000+ Transactions Daily"
- [ ] Metrics cards showing 95% accuracy and 24/7 support

### 5. Pricing Section 💰
- [ ] 3 pricing tiers: Starter ($49), Professional ($149), Enterprise (Custom)
- [ ] "Most Popular" badge on Professional plan
- [ ] Feature checkmarks for each plan
- [ ] CTA buttons for each pricing tier

## Animation & Interaction Tests

### Scroll Animations
1. Scroll down slowly - elements should fade in smoothly
2. Check parallax effect on hero section while scrolling
3. Navigation bar should transition on scroll

### Hover Effects
1. Hover over feature cards - shadow should increase
2. Hover over buttons - color should darken/change
3. Hover over navigation links - color transition

### Responsive Design
1. Resize browser to mobile width (< 768px)
   - [ ] Navigation collapses appropriately
   - [ ] Cards stack vertically
   - [ ] Text remains readable
2. Test tablet width (768px - 1024px)
   - [ ] 2-column grid for features
   - [ ] Proper spacing maintained

## Visual Quality Checklist

### Colors & Gradients
- [ ] Blue to purple gradients throughout
- [ ] Consistent color scheme (blue-600, purple-600, pink-600)
- [ ] White/gray backgrounds alternate between sections
- [ ] Glass morphism effects on cards

### Typography
- [ ] Large, bold headings with gradient text
- [ ] Proper font hierarchy (hero > section > card titles)
- [ ] Readable body text (gray-600/700)

### Professional Elements
- [ ] Clean section separation
- [ ] Consistent spacing and padding
- [ ] Professional footer with links
- [ ] No broken images or missing icons

## Performance Check
- [ ] Page loads quickly
- [ ] Animations are smooth (no janky scrolling)
- [ ] No console errors in browser dev tools
- [ ] All links are clickable (though may redirect to login)

## Common Issues to Check

1. **If animations aren't working:**
   - Check if Framer Motion is installed
   - Verify no JavaScript errors in console

2. **If styling looks broken:**
   - Ensure Tailwind CSS v4 is configured
   - Check for any CSS conflicts

3. **If icons are missing:**
   - Verify @heroicons/react is installed
   - Check import statements

## Expected User Flow
1. Visitor lands on page → Sees hero with clear value proposition
2. Scrolls to explore features → Understands key capabilities
3. Reviews testimonials → Builds trust
4. Checks pricing → Finds suitable plan
5. Clicks CTA → Redirected to signup

## Success Criteria
✅ Page looks professional and modern
✅ All sections load without errors
✅ Animations enhance rather than distract
✅ Clear conversion path to signup
✅ Mobile responsive design works