# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Radix UI Select Component Usage

**ALWAYS use `RadixSelect` instead of `Select` when using Radix UI Select components!**

The `/src/components/ui/select.tsx` file exports TWO different Select components:
1. **`Select`** - Native HTML `<select>` element (for simple forms)
2. **`RadixSelect`** - Radix UI Select component (with SelectTrigger, SelectValue, etc.)

### ❌ WRONG (causes "SelectTrigger must be used within Select" error):
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<Select value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### ✅ CORRECT:
```tsx
import { RadixSelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<RadixSelect value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</RadixSelect>
```

**Why?** `SelectTrigger` is a Radix UI component that requires a Radix Select context, which only `RadixSelect` provides. The native `Select` component doesn't have this context, causing the error.

**When to use each:**
- Use `RadixSelect` when you need: custom styling, SelectTrigger, SelectValue, SelectContent, SelectItem
- Use `Select` (native) when you need: simple form select with basic `<option>` tags

---

## CRITICAL: Post-Implementation Testing Protocol

**AFTER COMPLETING ANY FEATURE OR TASK**, you MUST:

1. **Create a Smoke Test Guide** for the implemented features:
   - Create a markdown file named `smoke-test-[feature-name].md`
   - Include step-by-step verification procedures
   - Provide expected results for each test
   - List common issues to check
   - Include a verification checklist

2. **Walk the User Through Changes**:
   - Provide a brief demo walkthrough of what was implemented
   - Highlight key UI elements and where to find them
   - Explain any new workflows or processes
   - Point out integration points with existing features

3. **Provide Quick Verification Steps**:
   - Give 3-5 quick tests the user can run immediately
   - These should verify core functionality works
   - Should take less than 2 minutes to complete

4. **Document Any Setup Required**:
   - List any new environment variables needed
   - Note any new npm packages installed
   - Mention any Firebase configuration changes
   - Include any seed data commands if applicable

5. **Update Progress Tracking**:
   - Update the modernization-roadmap.md immediately
   - Include what was completed with checkmarks
   - Note any pending items discovered during implementation

This ensures the user can verify the implementation works correctly before moving to the next task and prevents accumulation of untested changes.

## IMPORTANT: Agent Delegation Strategy

**AGGRESSIVELY DELEGATE TO SPECIALIZED AGENTS** to optimize context window usage:

### Primary Delegation Targets
1. **@deep-thinking-code-buddy** - Use for:
   - Code analysis and investigation without making changes
   - Architecture discussions and design decisions
   - Complex problem-solving that requires deep thinking
   - Understanding existing implementations before modifications
   - Any task requiring extensive file reading or exploration

2. **@task-context-manager** - Use for:
   - Creating and updating task lists
   - Tracking progress on multi-step implementations
   - Documenting completed work

3. **@ui-ux-modernizer** - Use for:
   - UI/UX improvements
   - Tailwind CSS implementations
   - Component redesigns

4. **@database-service-expert** - Use for:
   - Firebase/Firestore operations
   - Service layer modifications
   - Authentication and role-based access

### Delegation Rules
- **Always delegate investigation tasks** before making code changes
- **Delegate when context is getting large** (>50% of window used)
- **Delegate specialized tasks** to domain-specific agents
- **Use parallel delegation** when multiple independent tasks exist
- **Prefer delegation over direct implementation** for complex analysis

## CRITICAL: Centralized PDF Service Architecture

**ALWAYS use the centralized PDF service** - DO NOT create component-specific PDF generation:

### Centralized PDF Service Location
**Path**: `/src/lib/pdf/pdf.service.ts`
**Export**: `pdfService` (singleton instance)

### Why Centralized?
1. **Firebase Storage Integration**: Automatic conversion of Firebase URLs to base64
2. **Image Proxy Handling**: Built-in CORS handling via `/api/image-proxy`
3. **SSR Safety**: Proper font loading without SSR errors
4. **Consistent Behavior**: All PDFs handle images the same way
5. **Single Maintenance Point**: Fix bugs once, not per component

### Usage Pattern
```typescript
// ✅ CORRECT - Use centralized service
import { pdfService } from '@/lib/pdf/pdf.service';

// For custom document types, add methods to PDFService class
await pdfService.generateStatementPDF(statement, options);
await pdfService.downloadPdf(docDefinition, filename);
```

```typescript
// ❌ WRONG - Don't create separate PDF services
import pdfMake from 'pdfmake/build/pdfmake'; // Avoid direct import
// Don't duplicate image conversion logic
// Don't create component-specific PDF generators
```

### Adding New PDF Types
When adding new PDF generation (invoices, reports, etc.):
1. Add method to `/src/lib/pdf/pdf.service.ts` PDFService class
2. Add document builder as private method (e.g., `buildStatementDocument`)
3. Use existing `generatePdf()`, `downloadPdf()`, `getPdfBlob()` methods
4. Re-export from relevant module (e.g., `/src/lib/accounting/index.ts`)

### Features Available
- `generatePdf()` - Returns pdfMake PDF object
- `downloadPdf()` - Triggers browser download
- `openPdf()` - Opens in new window
- `getPdfBlob()` - Returns Blob for storage/upload
- `getPdfBase64()` - Returns base64 string
- `generateStatementPDF()` - Customer statement (Phase 7)
- Automatic Firebase Storage URL → base64 conversion
- Recursive image processing in nested structures

### History
- **2025-10-15**: Consolidated Phase 7 statement PDF generation into centralized service
- **Previous**: Originally built for quotes, invoices, contracts with Firebase image handling

## Commands

### Development
```bash
# Start development server (with Turbopack)
npm run dev

# Build production bundle (with Turbopack)
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Database Seeding
```bash
# Seed bank accounts
npm run seed:bank-accounts

# Seed chart of accounts
npm run seed:charts

# Seed ledger entries
npm run seed:ledger
```

### Firebase Functions
```bash
# Deploy functions to Firebase
./deploy-functions.sh

# Deploy to Vercel
./deploy-vercel.sh
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15.5 with React 19, TypeScript, Tailwind CSS v4
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: React Context API for auth and global state
- **Forms**: React Hook Form with Zod validation

### Project Structure

#### `/app` - Next.js App Router
- Route-based pages with layouts
- Key routes:
  - `/admin` - Admin workspace for chart of accounts management
  - `/companies` - Multi-tenant company management
  - `/dashboard` - Main financial dashboard with bank statements
  - `/login`, `/signup` - Authentication flows

#### `/src/lib` - Core Business Logic
- **`/firebase`** - Firebase service layer
  - Service classes for each domain (companies, transactions, debtors, creditors)
  - Singleton pattern for service instances
  - Admin services for elevated operations

- **`/accounting`** - Financial accounting modules
  - Chart of accounts management
  - Posting service for journal entries
  - Reconciliation service for bank statement matching
  - Currency service for multi-currency support

#### `/src/types` - TypeScript Type Definitions
- Domain models organized by module
- Key types: `auth`, `financial`, `bank-statement`, `accounting/*`

#### `/src/components` - Reusable UI Components
- **`/ui`** - Base UI primitives (Button, Dialog, Select, etc.)
- **`/auth`** - Authentication components with protected route wrapper
- **`/bank-statement`** - Bank statement viewing and reconciliation UI
- Domain-specific component folders

#### `/functions` - Firebase Cloud Functions
- Server-side logic for document processing
- PDF extraction and OCR capabilities
- Background processing tasks

### Key Architectural Patterns

#### Multi-Tenant Architecture
- Company-based data isolation
- Role-based access control (RBAC)
- User roles: `super_admin`, `admin`, `financial_admin`, `user`
- Company types: `corporate`, `manageAccounts`

#### Service Layer Pattern
All Firebase operations go through service classes:
```typescript
// Example: Using the bank statement service
import { bankStatementService } from '@/lib/firebase';
const statements = await bankStatementService.getStatements(companyId);
```

#### Protected Routes
Use `ProtectedRoute` component for auth and role checking:
```typescript
<ProtectedRoute requiredRoles={['admin']} requireCompany>
  {/* Protected content */}
</ProtectedRoute>
```

#### Form Validation
React Hook Form + Zod for type-safe forms:
```typescript
const schema = z.object({ /* validation schema */ });
const form = useForm({ resolver: zodResolver(schema) });
```

### Active Development Focus

Currently implementing **Phase 5 - Bank & Cash Management** (see `/project-management/phase-5-bank-and-cash-management.md`):
- Bank account management
- Statement reconciliation workspace
- Cash flow forecasting
- Multi-currency support

### Project Management & Progress Tracking

The project follows a synchronized documentation approach:

#### Master Plan: `/current-prompt.md`
- Comprehensive XML-structured blueprint with 10 implementation phases
- Contains detailed task breakdowns with step-by-step instructions
- Serves as the static reference for all development work
- Each phase includes priorities, durations, and technical specifications

#### Progress Tracker: `/project-management/modernization-roadmap.md`
- **CRITICAL**: This is the ONLY progress tracking mechanism - DO NOT create separate todo lists or tracking systems
- **MUST BE UPDATED** after EVERY work session with completed items
- Mirrors the master plan but tracks real-time progress
- Updates after each milestone or feature completion
- Sections: Active Focus (with % complete), Recently Completed (with session date), Upcoming Phases

#### Synchronization Protocol - MANDATORY
**EVERY WORK SESSION MUST:**
1. Start by checking `modernization-roadmap.md` Active Focus
2. Reference detailed tasks in `current-prompt.md` for that phase
3. **IMMEDIATELY** after completing ANY feature:
   - Update Active Focus percentage
   - Add completed items with ✅
   - Note what's 🔄 Next and ⏳ Pending
4. At session end, move items to "Recently Completed" with session date
5. Use phase-specific files (e.g., `phase-5-bank-and-cash-management.md`) for detailed checklists

**NEVER**:
- Create alternative tracking mechanisms
- Use separate todo lists outside of modernization-roadmap.md
- Forget to update the roadmap after completing work
- Wait until session end to update - do it IMMEDIATELY after each task

**REMEMBER**: modernization-roadmap.md is the SINGLE SOURCE OF TRUTH for progress

### Firebase Configuration
- Firestore rules: `/firestore.rules`
- Indexes: `/firestore.indexes.json`
- Functions config: `/firebase.json`
- Environment variables: `.env.local` (from `.env.local.example`)

### Testing Approach
Check package.json for test scripts if available. The codebase uses:
- TypeScript for type safety
- ESLint for code quality
- Component-level testing where applicable
- credentials for playwright mcp use credentials.md