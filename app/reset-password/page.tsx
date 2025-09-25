'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, Phone, Shield } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { SMSService } from '@/lib/firebase/sms-service';
import toast from 'react-hot-toast';

const resetSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email or phone number'),
  type: z.enum(['email', 'phone']),
});

const verifySchema = z
  .object({
    code: z.string().length(6, 'Code must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [resetType, setResetType] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');

  const smsService = new SMSService();

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    setValue,
    formState: { errors: resetErrors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      type: 'email',
    },
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmitReset = async (data: ResetFormData) => {
    try {
      setIsLoading(true);

      if (data.type === 'email') {
        await resetPassword(data.identifier);
        toast.success('Password reset email sent. Check your inbox.');
        router.push('/login');
        return;
      }

      const code = smsService.generateResetCode();
      const result = await smsService.sendPasswordResetSMS(data.identifier, code);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setPhoneNumber(data.identifier);
      setStep('verify');
      toast.success('Reset code sent via SMS. Enter it below to continue.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset instructions';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitVerify = async (data: VerifyFormData) => {
    try {
      setIsLoading(true);

      const verifyResult = await smsService.verifyResetCode(phoneNumber, data.code);
      if (!verifyResult.valid) {
        toast.error(verifyResult.message || 'Invalid code');
        return;
      }

      toast.success('Password reset successfully. You can now sign in.');
      router.push('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <AuthLayout
        title="Verify code"
        subtitle={`Enter the 6-digit code sent to ${phoneNumber}`}
        accentText="Verification codes expire in 10 minutes for your security."
        supportLink={{ label: 'Still need help?', href: 'mailto:support@peakflow.io' }}
        footer={
          <button
            type="button"
            className="text-sm text-white underline-offset-4 hover:underline"
            onClick={() => setStep('request')}
          >
            Request another code
          </button>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmitVerify(onSubmitVerify)}>
          <Input
            {...registerVerify('code')}
            label="Verification code"
            placeholder="123456"
            maxLength={6}
            error={verifyErrors.code?.message}
            tone="dark"
          />

          <Input
            {...registerVerify('newPassword')}
            type="password"
            label="New password"
            placeholder="Create a secure password"
            icon={<Shield className="h-4 w-4" />}
            error={verifyErrors.newPassword?.message}
            tone="dark"
          />

          <Input
            {...registerVerify('confirmPassword')}
            type="password"
            label="Confirm password"
            placeholder="Re-enter password"
            icon={<Shield className="h-4 w-4" />}
            error={verifyErrors.confirmPassword?.message}
            tone="dark"
          />

          <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
            Reset password
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={
        <span className="text-sm text-white/70">
          Enter your email or phone number and we&apos;ll send reset instructions.
        </span>
      }
      accentText="Choose email for inbox guidance or SMS for on-the-go recovery."
      supportLink={{ label: 'Need extra help?', href: 'mailto:support@peakflow.io' }}
      footer={
        <div className="flex items-center justify-between text-xs text-white/60">
          <Link href="/login" className="text-white underline-offset-4 hover:underline">
            Remembered your password? Sign in
          </Link>
          <span>Need help? support@peakflow.io</span>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmitReset(onSubmitReset)}>
        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-white/80">
          <button
            type="button"
            onClick={() => {
              setResetType('email');
              setValue('type', 'email');
            }}
            className={`rounded-lg border px-4 py-2 transition ${
              resetType === 'email'
                ? 'border-white/80 bg-white/15'
                : 'border-white/20 bg-transparent hover:bg-white/5'
            }`}
          >
            Reset via email
          </button>
          <button
            type="button"
            onClick={() => {
              setResetType('phone');
              setValue('type', 'phone');
            }}
            className={`rounded-lg border px-4 py-2 transition ${
              resetType === 'phone'
                ? 'border-white/80 bg-white/15'
                : 'border-white/20 bg-transparent hover:bg-white/5'
            }`}
          >
            Reset via SMS
          </button>
        </div>

        <Input
          {...registerReset('identifier')}
          type={resetType === 'email' ? 'email' : 'tel'}
          label={resetType === 'email' ? 'Email address' : 'Phone number'}
          placeholder={resetType === 'email' ? 'you@company.com' : '+1 (555) 123-4567'}
          icon={resetType === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          error={resetErrors.identifier?.message}
          autoComplete={resetType === 'email' ? 'email' : 'tel'}
          tone="dark"
        />

        <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
          Send instructions
        </Button>
      </form>
    </AuthLayout>
  );
}
