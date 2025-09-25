'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { SMSService } from '@/lib/firebase/sms-service';
import toast from 'react-hot-toast';

const resetSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  type: z.enum(['email', 'phone'])
});

const verifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetFormData = z.infer<typeof resetSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resetType, setResetType] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  
  const smsService = new SMSService();

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors }
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      type: 'email'
    }
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors }
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema)
  });

  const onSubmitReset = async (data: ResetFormData) => {
    try {
      setIsLoading(true);
      
      if (data.type === 'email') {
        await resetPassword(data.identifier);
        toast.success('Password reset email sent! Check your inbox.');
        router.push('/login');
      } else {
        // SMS reset
        const code = smsService.generateResetCode();
        const result = await smsService.sendPasswordResetSMS(data.identifier, code);
        
        if (result.success) {
          setPhoneNumber(data.identifier);
          setStep('verify');
          toast.success('Reset code sent to your phone!');
        } else {
          toast.error(result.message);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset request';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitVerify = async (data: VerifyFormData) => {
    try {
      setIsLoading(true);
      
      // Verify the SMS code
      const verifyResult = await smsService.verifyResetCode(phoneNumber, data.code);
      
      if (!verifyResult.valid) {
        toast.error(verifyResult.message || 'Invalid code');
        return;
      }

      // TODO: Update password in Firebase Auth for phone number users
      // This would require additional backend logic to handle phone auth
      
      toast.success('Password reset successfully!');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verify Reset Code
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmitVerify(onSubmitVerify)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  {...registerVerify('code')}
                  type="text"
                  maxLength={6}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="123456"
                />
                {verifyErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{verifyErrors.code.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  {...registerVerify('newPassword')}
                  type="password"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
                {verifyErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{verifyErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  {...registerVerify('confirmPassword')}
                  type="password"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
                {verifyErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{verifyErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Request new code
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              return to login
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmitReset(onSubmitReset)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    {...registerReset('type')}
                    type="radio"
                    value="email"
                    checked={resetType === 'email'}
                    onChange={() => setResetType('email')}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    {...registerReset('type')}
                    type="radio"
                    value="phone"
                    checked={resetType === 'phone'}
                    onChange={() => setResetType('phone')}
                    className="mr-2"
                  />
                  Phone (SMS)
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                {resetType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                {...registerReset('identifier')}
                type={resetType === 'email' ? 'email' : 'tel'}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={resetType === 'email' ? 'john@example.com' : '+1 (555) 123-4567'}
              />
              {resetErrors.identifier && (
                <p className="mt-1 text-sm text-red-600">{resetErrors.identifier.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
