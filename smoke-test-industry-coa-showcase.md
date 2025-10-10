# Smoke Test – Industry COA Showcase

## Verification Steps
1. **Navigate to the library**
   - Sign in with a role that has admin access.
   - Visit `/resources/industry-coa`.
   - Confirm the header "Industry Ledger Library" and the introductory description render.

2. **Switch industries**
   - Use the tab list (or mobile select) to choose at least three different industries.
   - Ensure the description, snapshot counts, and tables update to match the selected industry.

3. **Toggle filters**
   - Enable "Required accounts only" and verify both tables reduce to required rows.
   - Enable "Group by account type" and confirm the main table shows section headers (Assets, Liabilities, etc.).

4. **Review bank-linked accounts**
   - In the "Bank & Payment Accounts" table, confirm connector badges appear for payment processors (Stripe, Square, etc.).
   - Cross-check that the linked count badge matches the number of rows shown.

5. **Responsive behaviour**
   - Resize the viewport below 768px and ensure the industry selector switches to a dropdown while tables remain scrollable.

## Expected Results
- The page is protected by auth: unauthorized users are redirected.
- Tabs/select update content instantly without page reloads.
- Required/Grouped toggles filter and reorganize rows consistently.
- Bank-linked table only shows accounts flagged with payment/bank connectors.
- No styling regressions on light backgrounds; tables remain legible on mobile with horizontal scrolling.

## Common Issues to Watch
- Missing template data causing blank tables.
- Bank tag detection gaps (e.g., Stripe accounts appearing without badges).
- Tabs failing to highlight active industry when filters are toggled.
- Layout overflow on small screens due to long account names.

## Checklist
- [ ] Protected route redirects unauthorized visitors.
- [ ] Industry selector works on desktop and mobile.
- [ ] Filters adjust both tables correctly.
- [ ] Bank-linked badge counts match table rows.
- [ ] Page passes automated linting (`npm run lint`).
