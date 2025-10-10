import { z } from 'zod';
import { SupportedCurrency } from '@/types/auth';

// Supported currencies as array for validation
const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG'];

// Currency labels for UI
export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: 'US Dollar ($)',
  ZAR: 'South African Rand (R)',
  EUR: 'Euro (€)',
  ZWD: 'Zimbabwe Dollar (ZWD)',
  ZIG: 'Zimbabwe Gold (ZIG)',
};

// Company currency configuration schema
export const companyCurrencySchema = z.object({
  defaultCurrency: z.enum(SUPPORTED_CURRENCIES as [SupportedCurrency, ...SupportedCurrency[]], {
    errorMap: () => ({ message: 'Please select a valid currency' }),
  }),
});

// Company VAT configuration schema
export const companyVatSchema = z.object({
  vatPercentage: z
    .number({
      required_error: 'VAT percentage is required',
      invalid_type_error: 'VAT percentage must be a number',
    })
    .min(0, 'VAT percentage must be at least 0%')
    .max(100, 'VAT percentage cannot exceed 100%'),
});

// Combined company configuration schema
export const companyConfigSchema = z.object({
  defaultCurrency: z
    .enum(SUPPORTED_CURRENCIES as [SupportedCurrency, ...SupportedCurrency[]])
    .optional(),
  vatPercentage: z
    .number()
    .min(0, 'VAT percentage must be at least 0%')
    .max(100, 'VAT percentage cannot exceed 100%')
    .optional(),
});

export type CompanyCurrencyInput = z.infer<typeof companyCurrencySchema>;
export type CompanyVatInput = z.infer<typeof companyVatSchema>;
export type CompanyConfigInput = z.infer<typeof companyConfigSchema>;
