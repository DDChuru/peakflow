'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileText, Download, Calendar, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [reports] = useState([
    {
      name: 'Profit & Loss Statement',
      description: 'Income statement showing revenue, expenses, and net profit',
      category: 'Financial',
      lastGenerated: '2024-01-15',
      frequency: 'Monthly',
      icon: TrendingUp,
    },
    {
      name: 'Balance Sheet',
      description: 'Statement of financial position at a specific date',
      category: 'Financial',
      lastGenerated: '2024-01-15',
      frequency: 'Monthly',
      icon: BarChart3,
    },
    {
      name: 'Cash Flow Statement',
      description: 'Cash inflows and outflows from operations, investing, and financing',
      category: 'Financial',
      lastGenerated: '2024-01-14',
      frequency: 'Monthly',
      icon: DollarSign,
    },
    {
      name: 'Trial Balance',
      description: 'List of all accounts with their debit and credit balances',
      category: 'Accounting',
      lastGenerated: '2024-01-15',
      frequency: 'Weekly',
      icon: BarChart3,
    },
    {
      name: 'Accounts Receivable Aging',
      description: 'Outstanding customer invoices categorized by age',
      category: 'Operations',
      lastGenerated: '2024-01-13',
      frequency: 'Weekly',
      icon: FileText,
    },
    {
      name: 'Accounts Payable Aging',
      description: 'Outstanding supplier bills categorized by age',
      category: 'Operations',
      lastGenerated: '2024-01-13',
      frequency: 'Weekly',
      icon: FileText,
    },
    {
      name: 'Sales Summary',
      description: 'Revenue breakdown by customer, product, or time period',
      category: 'Sales',
      lastGenerated: '2024-01-12',
      frequency: 'Daily',
      icon: TrendingUp,
    },
    {
      name: 'Expense Summary',
      description: 'Expense breakdown by category and vendor',
      category: 'Expenses',
      lastGenerated: '2024-01-12',
      frequency: 'Daily',
      icon: TrendingDown,
    },
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Financial':
        return 'bg-blue-100 text-blue-800';
      case 'Accounting':
        return 'bg-purple-100 text-purple-800';
      case 'Operations':
        return 'bg-green-100 text-green-800';
      case 'Sales':
        return 'bg-orange-100 text-orange-800';
      case 'Expenses':
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
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate financial and operational reports</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Custom Report
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">
                  Standard & custom
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  Reports generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  Automated reports
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exports</CardTitle>
                <Download className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">
                  Files downloaded
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Button variant="outline" className="bg-white">
              <Filter className="h-4 w-4 mr-2" />
              All Categories
            </Button>
            <Button variant="outline">Financial</Button>
            <Button variant="outline">Accounting</Button>
            <Button variant="outline">Operations</Button>
            <Button variant="outline">Sales</Button>
          </div>

          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const IconComponent = report.icon;
              return (
                <Card key={report.name} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <Badge className={getCategoryColor(report.category)}>
                            {report.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {report.description}
                    </CardDescription>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-600">
                        <p>Last generated: {report.lastGenerated}</p>
                        <p>Frequency: {report.frequency}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Generate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Reports */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Your recently generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Profit & Loss Statement', date: '2024-01-15', format: 'PDF', size: '245 KB' },
                  { name: 'Balance Sheet', date: '2024-01-15', format: 'Excel', size: '189 KB' },
                  { name: 'Cash Flow Statement', date: '2024-01-14', format: 'PDF', size: '198 KB' },
                  { name: 'Trial Balance', date: '2024-01-13', format: 'PDF', size: '156 KB' },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-gray-600">
                          Generated on {report.date} • {report.format} • {report.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Report Builder */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>
                Create custom reports with specific data fields and filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Revenue Analysis
                </Button>
                <Button variant="outline" className="justify-start">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Expense Trends
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Customer Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Profitability
                </Button>
                <Button variant="outline" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Period Comparison
                </Button>
                <Button variant="outline" className="justify-start">
                  <Filter className="h-4 w-4 mr-2" />
                  Custom Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}