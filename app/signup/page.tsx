'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { CheckCircle, Mail, Phone, Shield } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    phoneNumber: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const passwordHints = [
  'Use at least 8 characters',
  'Include a number and symbol',
  'Avoid using personal information',
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      await signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
      });
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your PeakFlow account"
      subtitle={
        <span className="text-sm text-white/70">
          Already on PeakFlow?{' '}
          <Link href="/login" className="text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </span>
      }
      accentText="Bring clarity to every ledger with intelligent automation and collaborative financial workflows."
      accentLink={{ label: 'See how PeakFlow powers finance teams →', href: '/dashboard' }}
      footer={
        <p className="text-xs text-white/60">
          By continuing you agree to the PeakFlow Terms of Service and Privacy Policy.
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register('fullName')}
          type="text"
          label="Full name"
          placeholder="Jordan Steele"
          error={errors.fullName?.message}
          autoComplete="name"
          tone="dark"
        />

        <Input
          {...register('email')}
          type="email"
          label="Work email"
          placeholder="finance@company.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          tone="dark"
        />

        <Input
          {...register('phoneNumber')}
          type="tel"
          label="Phone (optional)"
          placeholder="+1 (555) 123-4567"
          icon={<Phone className="h-4 w-4" />}
          error={errors.phoneNumber?.message}
          autoComplete="tel"
          tone="dark"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="Create a secure password"
            icon={<Shield className="h-4 w-4" />}
            error={errors.password?.message}
            autoComplete="new-password"
            tone="dark"
          />
          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirm password"
            placeholder="Re-enter password"
            icon={<Shield className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            tone="dark"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
          <p className="mb-2 font-semibold uppercase tracking-widest text-white/50">Password tips</p>
          <ul className="space-y-1">
            {passwordHints.map((hint) => (
              <li key={hint} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                {hint}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
            Create account
          </Button>

          <Button
            type="button"
            variant="glass"
            className="w-full"
            onClick={handleGoogleSignup}
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
