# Landing Page Worktree

## Purpose
This worktree is dedicated to developing and enhancing the PeakFlow marketing landing page.

## Current Focus
- Improve the root landing page at `/app/page.tsx`
- Enhance marketing copy and value propositions
- Add more detailed feature sections
- Improve conversion optimization
- Add testimonials and case studies
- Enhance visual design and animations

## Key Features to Highlight
1. **Direct Bank to Ledger Import** - SME-focused feature for companies without formal invoicing
2. **Smart Bank Reconciliation** - AI-powered matching with 95% accuracy
3. **Complete Billing Suite** - From quotes to invoices with automatic GL posting
4. **Multi-tenant Architecture** - Secure company isolation
5. **Real-time Financial Dashboard** - KPIs and metrics at a glance

## Technical Notes
- This is a separate git branch: `landing-page`
- Changes here won't affect the main application
- Can be developed and tested independently
- Will be merged back to main when complete

## Key Files
- `/app/page.tsx` - Main landing page component
- `/public/` - Marketing assets and images
- `/components/ui/` - Reusable UI components

## Development
```bash
cd /home/dachu/Documents/projects/vercel/peakflow-worktrees/landing-page
npm run dev
```

## Testing
- Test on multiple screen sizes
- Ensure fast loading times
- Check SEO meta tags
- Verify all links work correctly
- Test conversion flows (signup, demo request)

## Deployment
- Will be merged to main branch via PR
- Deployed automatically via Netlify