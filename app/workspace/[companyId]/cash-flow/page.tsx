'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

export default function CashFlowPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cash Flow</h1>
              <p className="text-gray-600">Monitor and forecast cash flow movements</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Forecast
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Cash</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inflows (30d)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$12,234.56</div>
                <p className="text-xs text-muted-foreground">
                  +15.2% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outflows (30d)</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">$8,765.43</div>
                <p className="text-xs text-muted-foreground">
                  -5.4% from last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Cash Flow Forecast</CardTitle>
                <CardDescription>
                  Projected cash movements for the next 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Cash flow chart will be displayed here</p>
                    <p className="text-sm text-gray-400">Connect your bank accounts to see real-time data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Cash Movements</CardTitle>
                <CardDescription>Latest inflows and outflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'inflow', amount: 2500, description: 'Customer Payment', date: '2024-01-15' },
                    { type: 'outflow', amount: -800, description: 'Office Rent', date: '2024-01-14' },
                    { type: 'inflow', amount: 1200, description: 'Invoice Payment', date: '2024-01-13' },
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${
                          transaction.type === 'inflow' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        transaction.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'inflow' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Forecast</CardTitle>
                <CardDescription>Projected cash position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expected Inflows</span>
                    <span className="text-sm font-medium text-green-600">$8,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expected Outflows</span>
                    <span className="text-sm font-medium text-red-600">$6,200</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-medium">
                    <span>Net Cash Flow</span>
                    <span className="text-green-600">+$2,250</span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span>Projected Balance</span>
                    <span className="text-lg">$47,481.89</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}