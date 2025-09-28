'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart3, Search, Filter, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';

export default function ChartOfAccountsPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [accounts] = useState([
    {
      code: '1000',
      name: 'Cash',
      type: 'Asset',
      category: 'Current Assets',
      balance: 45231.89,
      isActive: true,
    },
    {
      code: '1100',
      name: 'Accounts Receivable',
      type: 'Asset',
      category: 'Current Assets',
      balance: 28950.00,
      isActive: true,
    },
    {
      code: '1200',
      name: 'Inventory',
      type: 'Asset',
      category: 'Current Assets',
      balance: 15620.50,
      isActive: true,
    },
    {
      code: '1500',
      name: 'Equipment',
      type: 'Asset',
      category: 'Fixed Assets',
      balance: 85000.00,
      isActive: true,
    },
    {
      code: '2000',
      name: 'Accounts Payable',
      type: 'Liability',
      category: 'Current Liabilities',
      balance: -12450.00,
      isActive: true,
    },
    {
      code: '2100',
      name: 'Credit Card Payable',
      type: 'Liability',
      category: 'Current Liabilities',
      balance: -3250.75,
      isActive: true,
    },
    {
      code: '3000',
      name: 'Owner Equity',
      type: 'Equity',
      category: 'Equity',
      balance: 125000.00,
      isActive: true,
    },
    {
      code: '4000',
      name: 'Sales Revenue',
      type: 'Revenue',
      category: 'Operating Revenue',
      balance: 245000.00,
      isActive: true,
    },
    {
      code: '5000',
      name: 'Cost of Goods Sold',
      type: 'Expense',
      category: 'Cost of Sales',
      balance: -98000.00,
      isActive: true,
    },
    {
      code: '6000',
      name: 'Office Expenses',
      type: 'Expense',
      category: 'Operating Expenses',
      balance: -15600.00,
      isActive: true,
    },
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Asset':
        return 'bg-blue-100 text-blue-800';
      case 'Liability':
        return 'bg-red-100 text-red-800';
      case 'Equity':
        return 'bg-purple-100 text-purple-800';
      case 'Revenue':
        return 'bg-green-100 text-green-800';
      case 'Expense':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = Math.abs(accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0));
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'Revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = Math.abs(accounts.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.balance, 0));

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
              <p className="text-gray-600">Manage your accounting structure and account balances</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalAssets.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current & Fixed Assets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${totalLiabilities.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current & Long-term
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${totalEquity.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Owner's Equity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Operating Revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${totalExpenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Operating Expenses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Balance Check */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Balance Check</h3>
                  <p className="text-sm text-gray-600">Assets = Liabilities + Equity</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {totalAssets === (totalLiabilities + totalEquity) ? (
                      <span className="text-green-600">✓ Balanced</span>
                    ) : (
                      <span className="text-red-600">⚠ Out of Balance</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    ${totalAssets.toLocaleString()} = ${(totalLiabilities + totalEquity).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Type
            </Button>
          </div>

          {/* Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Complete list of all accounts with current balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Account Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Balance</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.code} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-medium">{account.code}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{account.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getTypeColor(account.type)}>
                            {account.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{account.category}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={account.balance >= 0 ? 'text-gray-900' : 'text-red-600'}>
                            ${Math.abs(account.balance).toLocaleString()}
                            {account.balance < 0 && ' CR'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
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

          {/* Account Types Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assets Breakdown</CardTitle>
                <CardDescription>Current and fixed assets composition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accounts.filter(a => a.type === 'Asset').map((account) => (
                    <div key={account.code} className="flex justify-between items-center">
                      <span className="text-sm">{account.name}</span>
                      <span className="font-medium">${account.balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liabilities & Equity</CardTitle>
                <CardDescription>Liabilities and equity composition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accounts.filter(a => a.type === 'Liability' || a.type === 'Equity').map((account) => (
                    <div key={account.code} className="flex justify-between items-center">
                      <span className="text-sm">{account.name}</span>
                      <span className={`font-medium ${account.type === 'Liability' ? 'text-red-600' : 'text-purple-600'}`}>
                        ${Math.abs(account.balance).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}