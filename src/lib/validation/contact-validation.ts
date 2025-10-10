import { z } from 'zod';

// Primary contact person schema
export const primaryContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
});

// Financial contact schema (for form input)
export const financialContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z
    .string()
    .min(1, 'Email is required for mailing list')
    .email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().min(1, 'Position/title is required'),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

// Schema for updating existing financial contact
export const updateFinancialContactSchema = financialContactSchema.extend({
  id: z.string().uuid('Invalid contact ID'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Helper validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - at least 10 digits
  const phoneRegex = /\d{10,}/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Export types
export type PrimaryContactInput = z.infer<typeof primaryContactSchema>;
export type FinancialContactInput = z.infer<typeof financialContactSchema>;
export type UpdateFinancialContactInput = z.infer<typeof updateFinancialContactSchema>;
