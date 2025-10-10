'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companyCurrencySchema, companyVatSchema, CURRENCY_LABELS } from '@/lib/validation/company-validation';
import { companiesService } from '@/lib/firebase';
import { SupportedCurrency } from '@/types/auth';
import { DollarSign, Percent } from 'lucide-react';

// Combined schema for the form
const companyConfigFormSchema = z.object({
  defaultCurrency: companyCurrencySchema.shape.defaultCurrency,
  vatPercentage: companyVatSchema.shape.vatPercentage,
});

type CompanyConfigFormData = z.infer<typeof companyConfigFormSchema>;

interface CompanyConfigFormProps {
  companyId: string;
  initialCurrency?: SupportedCurrency;
  initialVatPercentage?: number;
  onSuccess?: () => void;
}

export function CompanyConfigForm({
  companyId,
  initialCurrency = 'ZAR',
  initialVatPercentage = 15,
  onSuccess,
}: CompanyConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyConfigFormData>({
    resolver: zodResolver(companyConfigFormSchema),
    defaultValues: {
      defaultCurrency: initialCurrency,
      vatPercentage: initialVatPercentage,
    },
  });

  const onSubmit = async (data: CompanyConfigFormData) => {
    setIsSubmitting(true);
    try {
      await companiesService.updateCompanyConfig(companyId, {
        defaultCurrency: data.defaultCurrency,
        vatPercentage: data.vatPercentage,
      });

      toast.success('Company configuration updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating company configuration:', error);
      toast.error('Failed to update company configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencies: SupportedCurrency[] = ['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Configuration</CardTitle>
        <CardDescription>
          Configure currency and VAT settings for your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              Default Currency
            </Label>
            <Select
              value={form.watch('defaultCurrency')}
              onValueChange={(value) => form.setValue('defaultCurrency', value as SupportedCurrency)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="defaultCurrency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {CURRENCY_LABELS[currency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.defaultCurrency && (
              <p className="text-sm text-red-500">
                {form.formState.errors.defaultCurrency.message}
              </p>
            )}
          </div>

          {/* VAT Percentage */}
          <div className="space-y-2">
            <Label htmlFor="vatPercentage" className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gray-500" />
              VAT Percentage
            </Label>
            <div className="relative">
              <Input
                id="vatPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...form.register('vatPercentage', { valueAsNumber: true })}
                placeholder="15"
                disabled={isSubmitting}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                %
              </span>
            </div>
            {form.formState.errors.vatPercentage && (
              <p className="text-sm text-red-500">
                {form.formState.errors.vatPercentage.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Enter the VAT/tax percentage applicable to your business (0-100)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
