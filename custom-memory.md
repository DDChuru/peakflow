# Main Branch Context - Modernization Roadmap

## Purpose
This is the main development branch following the comprehensive modernization roadmap outlined in `/current-prompt.md` and tracked in `/project-management/modernization-roadmap.md`.

## Current Status
**Phase 5 – Bank & Cash Management** (88% complete)

### Completed Features ✅
- Bank statement upload and PDF extraction with Gemini 2.0
- Reconciliation workspace UI with manual matching interface
- Auto-match algorithm fixed and working
- Manual matching UI with drag-and-drop capability
- Bank account management admin UI
- Full invoicing system with auto-GL posting
- Quote management system with conversion to invoice
- SLA contract billing with recurring invoices
- Payment recording with automatic journal entries
- Fixed line item calculations and debtor permissions
- Financial workflows quick access on company page

### Remaining Phase 5 Tasks
1. **Ledger entry posting from bank transactions** (Critical for SMEs)
2. **Adjustment entries system** (UI exists, needs integration)
3. **Cash flow forecasting** (model exists, needs UI)
4. **Transfer workflows between accounts**
5. **Reconciliation reports and export**
6. **Period locks after reconciliation**

## Upcoming Phases

### Phase 6 – Managed Accounts Features
- Extend GL access for manageAccounts tenants
- Trading accounts management
- Advanced reporting capabilities

### Phase 7 – Document Management System
- Document repository implementation
- Enhanced PDF extraction
- Annotation tooling
- Document workflow automation

### Phase 8 – Financial Dashboard Evolution
- Configurable widgets
- Advanced KPIs
- Operational metrics
- Custom dashboard layouts

### Phase 9 – Reporting & Analytics
- Report engine development
- Financial report packs
- Custom report builder
- Scheduled report generation

### Phase 10 – Optimization & Security
- Performance optimization
- Security audit implementation
- SSO integration
- Advanced audit trails

## Key Architecture Decisions
- **Multi-tenant:** Company-scoped collections (CSC) pattern
- **Service Layer:** Singleton services for all Firebase operations
- **State Management:** React Context for auth, local state for components
- **Validation:** Zod schemas with React Hook Form
- **UI Framework:** Tailwind CSS v4 with Radix UI primitives

## Development Guidelines
1. **Always update** `/project-management/modernization-roadmap.md` after completing features
2. **Follow CSC pattern** for new collections: `/companies/{companyId}/collection`
3. **Use existing services** from `/src/lib/firebase/` and `/src/lib/accounting/`
4. **Maintain type safety** with TypeScript strict mode
5. **Create smoke tests** for all new features in `/project-management/smoke-test/`

## Critical Next Steps
1. Complete remaining Phase 5 items (focus on ledger posting from bank)
2. Begin Phase 6 planning for managed accounts features
3. Implement comprehensive testing suite
4. Document API endpoints for external integrations
5. Prepare for production deployment

## Performance Targets
- Initial page load: < 3s
- Subsequent navigation: < 1s
- Firebase queries: < 500ms
- PDF processing: < 5s for 10 pages
- Auto-match algorithm: < 2s for 100 transactions

## Security Requirements
- Role-based access control (RBAC) fully enforced
- Company data isolation verified
- API keys stored securely in Firebase config
- No sensitive data in client-side code
- Audit trail for all financial operations

## Testing Strategy
- Component testing with React Testing Library
- Integration testing for service layer
- E2E testing with Playwright
- Manual smoke tests for critical paths
- Performance testing with Lighthouse

## Deployment Pipeline
- Development: Local with `npm run dev`
- Staging: Vercel preview deployments
- Production: Vercel production deployment
- Functions: Firebase Functions deployment
- Database: Firestore with security rules

## Support & Documentation
- Technical docs in `/docs` (to be created)
- User guides in `/guides` (to be created)
- API documentation with OpenAPI spec
- Video tutorials for key workflows
- In-app help system integration