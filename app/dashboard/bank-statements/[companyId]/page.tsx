'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BankStatement } from '@/types/bank-statement';
import {
  getCompanyBankStatements,
  calculateSummaryStats
} from '@/lib/firebase/bank-statement-service';
import BankStatementUpload from '@/components/bank-statement/BankStatementUpload';
import TransactionTable from '@/components/bank-statement/TransactionTable';
import SummaryCards from '@/components/bank-statement/SummaryCards';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function BankStatementsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.companyId as string;

  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'transactions'>('upload');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadCompanyAndStatements();
  }, [user, companyId]);

  const loadCompanyAndStatements = async () => {
    try {
      // Load company details
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        setCompanyName(companyDoc.data().name);
      } else {
        toast.error('Company not found');
        router.push('/dashboard');
        return;
      }

      // Load bank statements
      const bankStatements = await getCompanyBankStatements(companyId, 20);
      setStatements(bankStatements);

      // Select the most recent statement if available
      if (bankStatements.length > 0) {
        setSelectedStatement(bankStatements[0]);
        setActiveTab('transactions');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load bank statements');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (statement: BankStatement) => {
    setStatements([statement, ...statements]);
    setSelectedStatement(statement);
    setActiveTab('transactions');
    toast.success('Bank statement processed successfully!');
  };

  const handleSelectStatement = (statement: BankStatement) => {
    setSelectedStatement(statement);
    setActiveTab('transactions');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const additionalStats = selectedStatement
    ? calculateSummaryStats(selectedStatement.transactions)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Bank Statements - {companyName}
        </h1>
        <p className="mt-2 text-gray-600">
          Upload and analyze bank statements for financial insights
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History ({statements.length})
          </button>
          {selectedStatement && (
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'upload' && (
        <BankStatementUpload
          companyId={companyId}
          companyName={companyName}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {statements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-gray-600">No bank statements uploaded yet</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Upload First Statement
              </button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {statements.map((statement) => (
                  <li key={statement.id}>
                    <button
                      onClick={() => handleSelectStatement(statement)}
                      className="w-full px-6 py-4 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-indigo-600">
                              {statement.accountInfo.bankName} - {statement.accountInfo.accountNumber}
                            </p>
                            <span
                              className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                statement.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : statement.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {statement.status}
                            </span>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {statement.fileName}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                {statement.transactions.length} transactions
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Uploaded {new Date(statement.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && selectedStatement && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            summary={selectedStatement.summary}
            additionalStats={additionalStats || undefined}
          />

          {/* Account Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium text-gray-900">
                  {selectedStatement.accountInfo.bankName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">
                  {selectedStatement.accountInfo.accountNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium text-gray-900">
                  {selectedStatement.accountInfo.accountType || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transactions ({selectedStatement.transactions.length})
            </h3>
            <TransactionTable transactions={selectedStatement.transactions} />
          </div>

          {/* Export Options */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(selectedStatement.transactions, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                  const link = document.createElement('a');
                  link.setAttribute('href', dataUri);
                  link.setAttribute('download', `transactions_${selectedStatement.id}.json`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Transactions exported as JSON');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Export as JSON
              </button>
              <button
                onClick={() => {
                  // Convert to CSV
                  const headers = ['Date', 'Description', 'Reference', 'Category', 'Debit', 'Credit', 'Balance'];
                  const csvData = selectedStatement.transactions.map(t => [
                    t.date,
                    `"${t.description}"`,
                    t.reference || '',
                    t.category || '',
                    t.debit || '',
                    t.credit || '',
                    t.balance
                  ]);
                  const csv = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
                  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                  const link = document.createElement('a');
                  link.setAttribute('href', dataUri);
                  link.setAttribute('download', `transactions_${selectedStatement.id}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Transactions exported as CSV');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}