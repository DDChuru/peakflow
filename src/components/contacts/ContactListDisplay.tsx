'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { debtorService } from '@/lib/firebase';
import { PrimaryContact, FinancialContact } from '@/types/auth';
import { User, Mail, Phone, Briefcase, Users, CheckCircle2, Star } from 'lucide-react';

interface ContactListDisplayProps {
  companyId: string;
  debtorId: string;
  showTitle?: boolean;
}

export function ContactListDisplay({
  companyId,
  debtorId,
  showTitle = true,
}: ContactListDisplayProps) {
  const [primaryContact, setPrimaryContact] = useState<PrimaryContact | null>(null);
  const [financialContacts, setFinancialContacts] = useState<FinancialContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, debtorId]);

  const loadContacts = async () => {
    try {
      setLoading(true);

      // Load both primary and financial contacts in parallel
      const [primary, financial] = await Promise.all([
        debtorService.getPrimaryContact(companyId, debtorId).catch(() => null),
        debtorService.getFinancialContacts(companyId, debtorId).catch(() => []),
      ]);

      setPrimaryContact(primary);
      setFinancialContacts(financial);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const activeFinancialContacts = financialContacts.filter((c) => c.isActive);
  const mailingListEmails = activeFinancialContacts.map((c) => c.email).filter(Boolean);

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Primary and financial contact details</CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {/* Primary Contact Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            Primary Contact
          </div>

          {primaryContact ? (
            <div className="pl-6 space-y-2 text-sm">
              <div className="font-medium text-gray-900">{primaryContact.name}</div>
              {primaryContact.position && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  {primaryContact.position}
                </div>
              )}
              {primaryContact.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {primaryContact.email}
                </div>
              )}
              {primaryContact.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {primaryContact.phone}
                </div>
              )}
            </div>
          ) : (
            <div className="pl-6 text-sm text-gray-500 italic">No primary contact set</div>
          )}
        </div>

        {/* Financial Contacts Section */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4" />
              Financial Contacts
            </div>
            {activeFinancialContacts.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {activeFinancialContacts.length} active
              </Badge>
            )}
          </div>

          {financialContacts.length > 0 ? (
            <div className="space-y-4">
              {/* Mailing List Preview */}
              {mailingListEmails.length > 0 && (
                <div className="pl-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-900">
                        Mailing List ({mailingListEmails.length})
                      </p>
                      <p className="text-xs text-blue-700 mt-1 break-all">
                        {mailingListEmails.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact List */}
              <div className="pl-6 space-y-3">
                {financialContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-3 rounded-lg border ${
                      contact.isActive
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {contact.name}
                          </span>
                          {contact.isPrimary && (
                            <Star
                              className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0"
                              title="Primary financial contact"
                            />
                          )}
                        </div>

                        <div className="text-xs text-gray-600">
                          {contact.position}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>

                          {contact.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Badge
                        className={`flex-shrink-0 text-xs ${
                          contact.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contact.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          'Inactive'
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pl-6 text-sm text-gray-500 italic">
              No financial contacts added
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
