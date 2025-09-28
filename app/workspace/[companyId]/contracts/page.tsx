'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileCheck, Search, Filter, MoreHorizontal, Calendar } from 'lucide-react';

export default function ContractsPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [contracts] = useState([
    {
      id: 'CT-001',
      customerName: 'Acme Corporation',
      value: 150000,
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      type: 'Service Agreement',
    },
    {
      id: 'CT-002',
      customerName: 'Tech Solutions Ltd',
      value: 85000,
      status: 'pending',
      startDate: '2024-02-01',
      endDate: '2024-07-31',
      type: 'Software License',
    },
    {
      id: 'CT-003',
      customerName: 'Global Industries',
      value: 220000,
      status: 'expired',
      startDate: '2023-06-01',
      endDate: '2023-12-31',
      type: 'Maintenance Contract',
    },
    {
      id: 'CT-004',
      customerName: 'StartupCo',
      value: 45000,
      status: 'draft',
      startDate: '2024-03-01',
      endDate: '2024-08-31',
      type: 'Consulting Agreement',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
              <p className="text-gray-600">Manage customer contracts and agreements</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contracts.length}</div>
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
                  {contracts.filter(c => c.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Within 60 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <span className="text-green-600">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${contracts.reduce((sum, contract) => sum + contract.value, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All contracts combined
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
                placeholder="Search contracts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Contracts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Overview</CardTitle>
              <CardDescription>
                All contracts with their current status and key details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Contract ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">End Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-indigo-600">{contract.id}</span>
                        </td>
                        <td className="py-3 px-4">{contract.customerName}</td>
                        <td className="py-3 px-4 text-gray-600">{contract.type}</td>
                        <td className="py-3 px-4 font-medium">
                          ${contract.value.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{contract.startDate}</td>
                        <td className="py-3 px-4 text-gray-600">{contract.endDate}</td>
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

          {/* Upcoming Renewals */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>
                Contracts that require attention for renewal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts
                  .filter(c => c.status === 'active')
                  .slice(0, 3)
                  .map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">{contract.customerName}</p>
                          <p className="text-sm text-gray-600">
                            {contract.type} • Expires {contract.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">${contract.value.toLocaleString()}</span>
                        <Button size="sm" variant="outline">
                          Review
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