'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { primaryContactSchema, type PrimaryContactInput } from '@/lib/validation/contact-validation';
import { debtorService } from '@/lib/firebase';
import { User, Mail, Phone, Briefcase, Edit, X } from 'lucide-react';

interface PrimaryContactFormProps {
  companyId: string;
  debtorId: string;
  initialData?: PrimaryContactInput;
  onSuccess?: () => void;
  inline?: boolean;
}

export function PrimaryContactForm({
  companyId,
  debtorId,
  initialData,
  onSuccess,
  inline = false,
}: PrimaryContactFormProps) {
  const [isEditing, setIsEditing] = useState(!initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PrimaryContactInput>({
    resolver: zodResolver(primaryContactSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      position: '',
    },
  });

  const onSubmit = async (data: PrimaryContactInput) => {
    setIsSubmitting(true);
    try {
      await debtorService.updatePrimaryContact(companyId, debtorId, {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        position: data.position || undefined,
      });

      toast.success('Primary contact updated successfully');
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating primary contact:', error);
      toast.error('Failed to update primary contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset(initialData);
    setIsEditing(false);
  };

  if (!isEditing && initialData && inline) {
    // Display mode (inline)
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Primary Contact</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{initialData.name}</span>
          </div>
          {initialData.position && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{initialData.position}</span>
            </div>
          )}
          {initialData.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{initialData.email}</span>
            </div>
          )}
          {initialData.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{initialData.phone}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const FormContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name (Required) */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...form.register('name')}
          placeholder="John Doe"
          disabled={isSubmitting}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          placeholder="john@example.com"
          disabled={isSubmitting}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          {...form.register('phone')}
          placeholder="+27 11 234 5678"
          disabled={isSubmitting}
        />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          {...form.register('position')}
          placeholder="e.g., CEO, Manager"
          disabled={isSubmitting}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        {initialData && inline && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            'Save Contact'
          )}
        </Button>
      </div>
    </form>
  );

  if (inline) {
    return <div className="space-y-4">{FormContent}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Contact</CardTitle>
        <CardDescription>Main point of contact for this customer</CardDescription>
      </CardHeader>
      <CardContent>{FormContent}</CardContent>
    </Card>
  );
}
