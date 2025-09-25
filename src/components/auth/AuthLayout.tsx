'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  title: string;
  subtitle?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  supportLink?: {
    label: string;
    href: string;
  };
  accentText?: string;
  accentLink?: {
    label: string;
    href: string;
  };
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  supportLink,
  accentText,
  accentLink,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute top-1/4 right-[-120px] h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-[-160px] left-1/3 h-[360px] w-[360px] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div className="mb-8 text-center">
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                PeakFlow Platform
              </div>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
              {typeof subtitle === 'string' ? (
                <p className="mt-2 text-sm text-white/70">{subtitle}</p>
              ) : (
                subtitle || null
              )}
            </div>

            <div className="rounded-2xl bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
              {children}
            </div>

            {footer && <div className="mt-6 text-sm text-white/70">{footer}</div>}

            {supportLink && (
              <p className="mt-6 text-center text-sm text-white/60">
                Need help?{' '}
                <Link href={supportLink.href} className="font-medium text-white underline-offset-4 hover:underline">
                  {supportLink.label}
                </Link>
              </p>
            )}
          </motion.div>
        </div>

        {(accentText || accentLink) && (
          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-white/5 px-12 py-12 lg:flex"
          >
            <div className="max-w-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-white/90">
                {accentText || 'Modern financial intelligence for high-performing teams.'}
              </h2>
              <p className="mt-4 text-sm text-white/70">
                Automate bank statement ingestion, manage receivables and payables, and keep every company aligned with intuitive workflows.
              </p>
              {accentLink && (
                <Link
                  href={accentLink.href}
                  className="mt-6 inline-flex items-center text-sm font-medium text-white/90 underline-offset-4 hover:underline"
                >
                  {accentLink.label}
                </Link>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-widest text-white/60">Security First</p>
              <p className="mt-2 text-sm text-white/70">
                Powered by Firebase Auth and granular RBAC, PeakFlow keeps sensitive financial data protected while teams collaborate.
              </p>
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
}

