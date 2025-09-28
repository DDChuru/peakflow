'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react';

export default function CustomersPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [customers] = useState([
    {
      id: 'CUST-001',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      totalInvoiced: 245000,
      outstandingBalance: 15000,
      lastOrder: '2024-01-15',
    },
    {
      id: 'CUST-002',
      name: 'Tech Solutions Ltd',
      email: 'billing@techsolutions.com',
      phone: '+1 (555) 987-6543',
      status: 'active',
      totalInvoiced: 128500,
      outstandingBalance: 0,
      lastOrder: '2024-01-12',
    },
    {
      id: 'CUST-003',
      name: 'Global Industries',
      email: 'accounts@global.com',
      phone: '+1 (555) 456-7890',
      status: 'inactive',
      totalInvoiced: 89000,
      outstandingBalance: 5200,
      lastOrder: '2023-11-28',
    },
    {
      id: 'CUST-004',
      name: 'StartupCo',
      email: 'finance@startupco.io',
      phone: '+1 (555) 321-0987',
      status: 'active',
      totalInvoiced: 45000,
      outstandingBalance: 8750,
      lastOrder: '2024-01-08',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
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
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Manage your customer relationships and accounts</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
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
                  {customers.filter(c => c.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <span className="text-green-600">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${customers.reduce((sum, customer) => sum + customer.totalInvoiced, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All-time revenue
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
                  ${customers.reduce((sum, customer) => sum + customer.outstandingBalance, 0).toLocaleString()}
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
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                Complete list of customers with their account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Total Invoiced</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Outstanding</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Last Order</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          ${customer.totalInvoiced.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={customer.outstandingBalance > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            ${customer.outstandingBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{customer.lastOrder}</td>
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

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Customer Activity</CardTitle>
              <CardDescription>
                Latest interactions and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { customer: 'Acme Corporation', action: 'Payment received', amount: 15000, date: '2024-01-15' },
                  { customer: 'Tech Solutions Ltd', action: 'Invoice sent', amount: 8500, date: '2024-01-14' },
                  { customer: 'StartupCo', action: 'Quote requested', amount: 12000, date: '2024-01-13' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <div>
                        <p className="font-medium">{activity.customer}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${activity.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
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