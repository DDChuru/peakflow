import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get company ID from cookies or session if available
  // This would need to be implemented based on your auth strategy
  // For now, we'll handle redirects that don't require company ID

  // Redirect old routes to new workspace routes
  const redirectMap: Record<string, string> = {
    '/financial-dashboard': '/dashboard',
    '/user-dashboard': '/dashboard',
    // Add more redirects as needed for old routes
  };

  // Check if the current path needs redirection
  if (redirectMap[pathname]) {
    return NextResponse.redirect(new URL(redirectMap[pathname], request.url));
  }

  // Handle company-specific redirects
  // These old routes need company ID from the user's context
  const companyRoutes = [
    '/invoices',
    '/quotes',
    '/contracts',
    '/debtors',
    '/creditors',
    '/transactions'
  ];

  // If accessing old company routes without /workspace prefix
  if (companyRoutes.some(route => pathname.startsWith(route))) {
    // For now, redirect to dashboard where they can select proper workspace
    // In production, you'd get the company ID from the user's session
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle /companies/[id]/reconciliations redirect
  const reconciliationMatch = pathname.match(/^\/companies\/([^\/]+)\/reconciliations/);
  if (reconciliationMatch) {
    const companyId = reconciliationMatch[1];
    return NextResponse.redirect(new URL(`/workspace/${companyId}/reconciliation`, request.url));
  }

  // Handle other /companies/[id]/* routes (but exclude edit route)
  const companyMatch = pathname.match(/^\/companies\/([^\/]+)\/(.+)/);
  if (companyMatch) {
    const [, companyId, feature] = companyMatch;

    // Don't redirect the edit route - it's a valid companies route
    if (feature === 'edit') {
      return NextResponse.next();
    }

    // Map old feature names to new ones if needed
    const featureMap: Record<string, string> = {
      'bank-statements': 'bank-statements',
      'reconciliations': 'reconciliation',
      // Add more mappings as needed
    };
    const newFeature = featureMap[feature] || feature;
    return NextResponse.redirect(new URL(`/workspace/${companyId}/${newFeature}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};