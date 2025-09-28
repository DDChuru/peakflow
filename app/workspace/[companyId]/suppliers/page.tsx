'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react';

export default function SuppliersPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [suppliers] = useState([
    {
      id: 'SUPP-001',
      name: 'Office Solutions Inc',
      email: 'orders@officesolutions.com',
      phone: '+1 (555) 234-5678',
      status: 'active',
      category: 'Office Supplies',
      totalSpent: 45000,
      outstandingPayables: 2500,
      lastOrder: '2024-01-14',
    },
    {
      id: 'SUPP-002',
      name: 'CloudTech Services',
      email: 'billing@cloudtech.com',
      phone: '+1 (555) 345-6789',
      status: 'active',
      category: 'IT Services',
      totalSpent: 128000,
      outstandingPayables: 15000,
      lastOrder: '2024-01-12',
    },
    {
      id: 'SUPP-003',
      name: 'Legal Advisory Group',
      email: 'accounts@legaladvisory.com',
      phone: '+1 (555) 456-7891',
      status: 'inactive',
      category: 'Professional Services',
      totalSpent: 78000,
      outstandingPayables: 0,
      lastOrder: '2023-11-15',
    },
    {
      id: 'SUPP-004',
      name: 'Facility Management Co',
      email: 'invoices@facilityco.com',
      phone: '+1 (555) 567-8901',
      status: 'active',
      category: 'Facilities',
      totalSpent: 95000,
      outstandingPayables: 8700,
      lastOrder: '2024-01-10',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
              <p className="text-gray-600">Manage your supplier relationships and vendor accounts</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers.length}</div>
                <p className="text-xs text-muted-foreground">
                  +1 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suppliers.filter(s => s.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <span className="text-red-600">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${suppliers.reduce((sum, supplier) => sum + supplier.totalSpent, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All-time expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <span className="text-orange-600">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${suppliers.reduce((sum, supplier) => sum + supplier.outstandingPayables, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>
                Complete list of suppliers with their account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Supplier</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Total Spent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Outstanding</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Last Order</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{supplier.name}</p>
                            <p className="text-sm text-gray-500">{supplier.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {supplier.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {supplier.phone}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{supplier.category}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(supplier.status)}>
                            {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          ${supplier.totalSpent.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={supplier.outstandingPayables > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            ${supplier.outstandingPayables.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{supplier.lastOrder}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Reminders */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Reminders</CardTitle>
              <CardDescription>
                Suppliers with outstanding payables requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers
                  .filter(s => s.outstandingPayables > 0)
                  .map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-gray-600">
                            {supplier.category} • Due amount pending
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-orange-600">
                          ${supplier.outstandingPayables.toLocaleString()}
                        </span>
                        <Button size="sm" variant="outline">
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}