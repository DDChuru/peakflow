'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function NoCompanyPage() {
  const { logout } = useAuth();

  return (
    <AuthLayout
      title="You don’t have a company yet"
      subtitle="Ask your administrator to assign you to a PeakFlow company so you can access tenant-specific data."
      accentText="PeakFlow keeps every company’s data isolated and secure. Once you’re added to a tenant, dashboards and workflows will unlock automatically."
    >
      <div className="space-y-5 text-sm text-white/70">
        <p>
          You can head back to the dashboard to review personal details, or sign out and switch to another account.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full">Return to dashboard</Button>
          </Link>
          <Button
            type="button"
            variant="glass"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
