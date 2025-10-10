'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { financialContactSchema, type FinancialContactInput } from '@/lib/validation/contact-validation';
import { debtorService } from '@/lib/firebase';
import { FinancialContact } from '@/types/auth';
import {
  Plus,
  Mail,
  Phone,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Star,
} from 'lucide-react';

interface FinancialContactsManagerProps {
  companyId: string;
  debtorId: string;
  onContactsChange?: () => void;
}

export function FinancialContactsManager({
  companyId,
  debtorId,
  onContactsChange,
}: FinancialContactsManagerProps) {
  const [contacts, setContacts] = useState<FinancialContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<FinancialContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FinancialContactInput>({
    resolver: zodResolver(financialContactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      isActive: true,
      isPrimary: false,
    },
  });

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, debtorId]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await debtorService.getFinancialContacts(companyId, debtorId);
      setContacts(data);
    } catch (error) {
      console.error('Error loading financial contacts:', error);
      // Gracefully handle service errors
      if (error instanceof TypeError && error.message.includes('is not a function')) {
        console.warn('[FinancialContactsManager] Service method not available, using empty contacts');
        setContacts([]);
      } else {
        toast.error('Failed to load financial contacts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (data: FinancialContactInput) => {
    setIsSubmitting(true);
    try {
      await debtorService.addFinancialContact(companyId, debtorId, {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        position: data.position,
        isActive: data.isActive,
        isPrimary: data.isPrimary,
      });

      toast.success('Financial contact added successfully');
      setIsAddDialogOpen(false);
      form.reset();
      await loadContacts();
      onContactsChange?.();
    } catch (error) {
      console.error('Error adding financial contact:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to add contact: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContact = async (data: FinancialContactInput) => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      await debtorService.updateFinancialContact(companyId, debtorId, selectedContact.id, {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        position: data.position,
        isActive: data.isActive,
        isPrimary: data.isPrimary,
      });

      toast.success('Financial contact updated successfully');
      setIsEditDialogOpen(false);
      setSelectedContact(null);
      form.reset();
      await loadContacts();
      onContactsChange?.();
    } catch (error) {
      console.error('Error updating financial contact:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update contact: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      await debtorService.removeFinancialContact(companyId, debtorId, selectedContact.id);

      toast.success('Financial contact deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedContact(null);
      await loadContacts();
      onContactsChange?.();
    } catch (error) {
      console.error('Error deleting financial contact:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete contact: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (contact: FinancialContact) => {
    try {
      await debtorService.updateFinancialContact(companyId, debtorId, contact.id, {
        isActive: !contact.isActive,
      });

      toast.success(`Contact ${!contact.isActive ? 'activated' : 'deactivated'} successfully`);
      await loadContacts();
      onContactsChange?.();
    } catch (error) {
      console.error('Error toggling contact status:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update status: ${message}`);
    }
  };

  const handleSetPrimary = async (contact: FinancialContact) => {
    try {
      await debtorService.setPrimaryFinancialContact(companyId, debtorId, contact.id);

      toast.success('Primary contact updated successfully');
      await loadContacts();
      onContactsChange?.();
    } catch (error) {
      console.error('Error setting primary contact:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to set primary contact: ${message}`);
    }
  };

  const openEditDialog = (contact: FinancialContact) => {
    setSelectedContact(contact);
    form.reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      position: contact.position,
      isActive: contact.isActive,
      isPrimary: contact.isPrimary,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (contact: FinancialContact) => {
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const activeContacts = contacts.filter((c) => c.isActive);
  const mailingListEmails = activeContacts.map((c) => c.email).filter(Boolean);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Financial Contacts
              </CardTitle>
              <CardDescription>
                Manage contacts for financial communications and statements
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12 px-6 border border-dashed border-gray-300 rounded-lg">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No financial contacts
              </h3>
              <p className="text-gray-600 mb-4">
                Add contacts who should receive financial statements and communications
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Contact
              </Button>
            </div>
          ) : (
            <>
              {/* Mailing List Preview */}
              {mailingListEmails.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900">
                        Mailing List ({mailingListEmails.length} active)
                      </p>
                      <p className="text-xs text-blue-700 mt-1 break-all">
                        {mailingListEmails.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                        Position
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {contact.name}
                            </span>
                            {contact.isPrimary && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" title="Primary contact" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {contact.position}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate max-w-[200px]">
                              {contact.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {contact.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {contact.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              contact.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {contact.isActive ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => openEditDialog(contact)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {!contact.isPrimary && (
                                <DropdownMenuItem onSelect={() => handleSetPrimary(contact)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  Set as Primary
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => handleToggleActive(contact)}>
                                {contact.isActive ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => openDeleteDialog(contact)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Financial Contact</DialogTitle>
            <DialogDescription>
              Add a new contact for financial communications and statements
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleAddContact)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-name"
                {...form.register('name')}
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-email"
                type="email"
                {...form.register('email')}
                placeholder="john@example.com"
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Email is required for inclusion in the mailing list
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                {...form.register('phone')}
                placeholder="+27 11 234 5678"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-position">
                Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-position"
                {...form.register('position')}
                placeholder="e.g., CFO, Accountant"
                disabled={isSubmitting}
              />
              {form.formState.errors.position && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.position.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  form.reset();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Contact'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Financial Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleEditContact)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                {...form.register('name')}
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                {...form.register('email')}
                placeholder="john@example.com"
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                {...form.register('phone')}
                placeholder="+27 11 234 5678"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-position">
                Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-position"
                {...form.register('position')}
                placeholder="e.g., CFO, Accountant"
                disabled={isSubmitting}
              />
              {form.formState.errors.position && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.position.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedContact(null);
                  form.reset();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Financial Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedContact?.name}</strong>? This
              action cannot be undone and will remove them from the mailing list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedContact(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Contact'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
