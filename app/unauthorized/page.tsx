'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <AuthLayout
      title="Access denied"
      subtitle="Your current role doesn’t grant access to this page."
      accentText="PeakFlow uses role-based access control to safeguard sensitive financial workflows. Ask an administrator if you believe you should have access."
      supportLink={{ label: 'Contact support', href: 'mailto:support@peakflow.io' }}
    >
      <div className="space-y-5 text-sm text-white/70">
        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
          <ShieldAlert className="h-5 w-5 text-amber-300" />
          <p>
            If you think this is a mistake, contact your PeakFlow administrator to review your permissions.
          </p>
        </div>

        <Link href="/dashboard" className="block">
          <Button className="w-full">Return to dashboard</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
