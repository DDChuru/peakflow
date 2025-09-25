'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true,
    },
  });

  const REMEMBER_ME_KEY = 'peakflow:rememberMe';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(REMEMBER_ME_KEY);
    if (stored !== null) {
      setValue('rememberMe', stored === 'true');
    }
  }, [setValue]);

  const rememberMeValue = watch('rememberMe');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(REMEMBER_ME_KEY, String(Boolean(rememberMeValue)));
  }, [rememberMeValue]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle(Boolean(rememberMeValue));
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <span className="text-sm text-white/70">
          Need an account?{' '}
          <Link href="/signup" className="text-white underline-offset-4 hover:underline">
            Create one now
          </Link>
        </span>
      }
      accentText="Securely reconcile statements, manage receivables, and surface real-time insights for every tenant."
      accentLink={{ label: 'Explore the product tour →', href: '/dashboard' }}
      supportLink={{ label: 'Contact support', href: 'mailto:support@peakflow.io' }}
      footer={
        <div className="flex flex-col gap-3 text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>Multi-factor authentication supported</span>
          </div>
          <Link href="/reset-password" className="text-sm text-white underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register('email')}
          type="email"
          label="Email address"
          placeholder="you@company.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          tone="dark"
        />

        <div className="space-y-2">
          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            autoComplete="current-password"
            tone="dark"
          />
          <div className="flex items-center justify-between text-xs text-white/70">
            <label className="inline-flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-white/30 bg-transparent text-indigo-400 focus:ring-2 focus:ring-indigo-500"
              />
              Remember me
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
            Sign in
          </Button>
          <Button
            type="button"
            variant="glass"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
