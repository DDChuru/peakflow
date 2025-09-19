import Link from 'next/link';

export default function NoCompanyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            No Company Assigned
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You haven&apos;t been assigned to a company yet. Please contact your administrator.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Dashboard
          </Link>
          
          <div>
            <Link
              href="/logout"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}