'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  ClipboardCheck,
  Send,
  BarChart3,
  Download,
  FileText,
  Building2,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const slides = [
  { id: 1, title: 'Title' },
  { id: 2, title: 'Bank Import Overview' },
  { id: 3, title: 'Upload Statement' },
  { id: 4, title: 'Import & Map' },
  { id: 5, title: 'Staging Review' },
  { id: 6, title: 'Post to GL' },
  { id: 7, title: 'Reports' },
  { id: 8, title: 'Exports' },
  { id: 9, title: 'Summary' },
];

export function BankImportManual() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Slide Content */}
      <Card className="overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50/30 min-h-[600px]">
        <div className="p-8">
          {currentSlide === 0 && <TitleSlide />}
          {currentSlide === 1 && <BankImportOverviewSlide />}
          {currentSlide === 2 && <UploadStatementSlide />}
          {currentSlide === 3 && <ImportMapSlide />}
          {currentSlide === 4 && <StagingReviewSlide />}
          {currentSlide === 5 && <PostToGLSlide />}
          {currentSlide === 6 && <ReportsSlide />}
          {currentSlide === 7 && <ExportsSlide />}
          {currentSlide === 8 && <SummarySlide />}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToSlide(currentSlide - 1)}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-6 bg-emerald-500'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => goToSlide(currentSlide + 1)}
          disabled={currentSlide === slides.length - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <span className="text-sm text-gray-500 ml-4">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}

// Slide Components

function TitleSlide() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-8">
        <Building2 className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">PeakFlow</h1>
      <p className="text-xl text-gray-500 mb-12">Bank Import to Reports - Complete Workflow</p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {[
          { num: 1, text: 'Upload Statement' },
          { num: 2, text: 'Import & Map' },
          { num: 3, text: 'Review & Stage' },
          { num: 4, text: 'Post to GL' },
          { num: 5, text: 'Generate Reports' },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                {step.num}
              </div>
              <span className="font-medium text-gray-700">{step.text}</span>
            </div>
            {i < 4 && <ArrowRight className="w-5 h-5 text-gray-300" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function BankImportOverviewSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader step={1} title="Bank Statement Import" subtitle="Navigate to Bank Import page and select your bank account" />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MockBrowser url="peakflow.app/workspace/acme-corp/bank-import">
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="This Month" value="47" sub="Transactions imported" color="blue" />
                <StatCard label="Auto-Mapped" value="89%" sub="Success rate" color="purple" />
                <StatCard label="Total Value" value="R125.4K" sub="This month" color="emerald" />
                <StatCard label="Active Rules" value="156" sub="Mapping rules" color="amber" />
              </div>

              {/* Tabs Preview */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex bg-gray-50 border-b">
                  <div className="px-4 py-3 text-sm font-medium text-emerald-700 border-b-2 border-emerald-500 bg-white">📄 Import Transactions</div>
                  <div className="px-4 py-3 text-sm text-gray-500">📤 Upload Statement</div>
                  <div className="px-4 py-3 text-sm text-gray-500">📋 Staging Review</div>
                  <div className="px-4 py-3 text-sm text-gray-500">🕐 History</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Bank Account</p>
                      <p className="font-medium">FNB Business Account - ****4521</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MockBrowser>
        </div>

        <ExplanationPanel title="What you see here">
          <ExplanationStep num={1} title="Statistics Dashboard" desc="Quick overview of import activity - transactions, success rate, total value." />
          <ExplanationStep num={2} title="Tab Navigation" desc="Switch between Import, Upload, Staging Review, and History." />
          <ExplanationStep num={3} title="Bank Account Selector" desc="Choose which bank account you're importing for." />
        </ExplanationPanel>
      </div>
    </div>
  );
}

function UploadStatementSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader step={1} title="Upload Bank Statement" subtitle="Upload a PDF bank statement for AI-powered extraction" continued />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MockBrowser url="peakflow.app/workspace/acme-corp/bank-import → Upload Statement">
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-4">
                  <Badge variant="secondary" className="mb-2">Acme Corporation</Badge>
                  <h3 className="text-lg font-semibold">Upload a bank statement</h3>
                  <p className="text-sm text-gray-500">Drop a PDF - we detect balances, fees, and transactions automatically.</p>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-indigo-400 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-500" />
                  </div>
                  <p className="font-semibold text-gray-900">Click to browse or drag a file</p>
                  <p className="text-sm text-gray-500 mt-1">PDF files, up to 10MB</p>
                  <div className="flex justify-center gap-4 mt-6">
                    <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" /> AI extraction</Badge>
                    <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" /> Secure</Badge>
                    <Badge variant="secondary" className="gap-1"><FileText className="w-3 h-3" /> PDF only</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-red-500">📄</div>
                    <div>
                      <p className="font-medium text-sm">FNB_Statement_Jan2025.pdf</p>
                      <p className="text-xs text-gray-500">1.24 MB</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Remove</Button>
                </div>

                <div className="flex justify-end mt-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                    <Sparkles className="w-4 h-4" /> Process statement
                  </Button>
                </div>
              </div>
            </div>
          </MockBrowser>
        </div>

        <ExplanationPanel title="Upload Process">
          <ExplanationStep num={1} title="Drag & Drop" desc="Simply drag your PDF bank statement into the upload zone." />
          <ExplanationStep num={2} title="AI Extraction" desc="Our AI extracts all transactions, dates, amounts automatically." />
          <ExplanationStep num={3} title="Background Processing" desc="Processing happens in background. You'll see a notification when complete." />
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700"><strong>Supported:</strong> FNB, Standard Bank, ABSA, Nedbank, Capitec</p>
          </div>
        </ExplanationPanel>
      </div>
    </div>
  );
}

function ImportMapSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader step={2} title="Import & Map Transactions" subtitle="AI automatically maps transactions to GL accounts based on learned rules" />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MockBrowser url="peakflow.app/workspace/acme-corp/bank-import → Import Transactions">
            <div className="p-6 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">AI Mapping Results</h3>
                    <p className="text-sm text-gray-500">47 transactions - 42 auto-mapped, 3 need review, 2 need AI</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">✅ Stage All Mapped</Button>
                </div>

                <div className="flex gap-2 mb-4">
                  <Badge className="bg-green-100 text-green-700">✓ Auto-Mapped (42)</Badge>
                  <Badge className="bg-amber-100 text-amber-700">⚠️ Needs Review (3)</Badge>
                  <Badge className="bg-blue-100 text-blue-700">✨ Needs AI (2)</Badge>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase border-b">
                      <th className="pb-2 w-8"><input type="checkbox" checked readOnly /></th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Mapped Account</th>
                      <th className="pb-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2"><input type="checkbox" checked readOnly /></td>
                      <td className="py-2 font-mono text-xs">15 Jan</td>
                      <td className="py-2">SHOPRITE PARK MEADOWS</td>
                      <td className="py-2 text-red-600 font-mono">-R 1,245.80</td>
                      <td className="py-2"><Badge className="bg-blue-50 text-blue-700 text-xs">5100 · Office Supplies</Badge></td>
                      <td className="py-2"><Badge className="bg-green-50 text-green-700 text-xs">95%</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2"><input type="checkbox" checked readOnly /></td>
                      <td className="py-2 font-mono text-xs">14 Jan</td>
                      <td className="py-2">ESKOM PREPAID</td>
                      <td className="py-2 text-red-600 font-mono">-R 2,500.00</td>
                      <td className="py-2"><Badge className="bg-blue-50 text-blue-700 text-xs">5200 · Utilities</Badge></td>
                      <td className="py-2"><Badge className="bg-green-50 text-green-700 text-xs">98%</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2"><input type="checkbox" checked readOnly /></td>
                      <td className="py-2 font-mono text-xs">12 Jan</td>
                      <td className="py-2">DEPOSIT - XYZ CORP</td>
                      <td className="py-2 text-green-600 font-mono">+R 15,000.00</td>
                      <td className="py-2"><Badge className="bg-blue-50 text-blue-700 text-xs">1100 · Accounts Receivable</Badge></td>
                      <td className="py-2"><Badge className="bg-green-50 text-green-700 text-xs">92%</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </MockBrowser>
        </div>

        <ExplanationPanel title="Mapping Process">
          <ExplanationStep num={1} title="Tri-State Buckets" desc="Auto-Mapped (high confidence), Needs Review (confirm), Needs AI (complex)." />
          <ExplanationStep num={2} title="Confidence Scores" desc="Each mapping shows confidence % based on pattern matching." />
          <ExplanationStep num={3} title="Bulk Actions" desc="Select multiple transactions and stage them all at once." />
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700"><strong>Learning:</strong> When you correct a mapping, the system learns and improves.</p>
          </div>
        </ExplanationPanel>
      </div>
    </div>
  );
}

function StagingReviewSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader step={3} title="Staging Review" subtitle="Review staged journal entries before posting to the general ledger" />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MockBrowser url="peakflow.app/workspace/acme-corp/bank-import → Staging Review">
            <div className="p-6 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-indigo-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold">Session #a1b2c3d4</span>
                      <Badge className="bg-amber-100 text-amber-700">⏳ Staged</Badge>
                      <Badge className="bg-green-100 text-green-700">✓ Balanced</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-sm">
                      <div><p className="text-gray-500 text-xs">Journal Entries</p><p className="text-xl font-bold">42</p></div>
                      <div><p className="text-gray-500 text-xs">GL Entries</p><p className="text-xl font-bold">84</p></div>
                      <div><p className="text-gray-500 text-xs">Total Debits</p><p className="text-xl font-bold text-green-600">R 125,430.50</p></div>
                      <div><p className="text-gray-500 text-xs">Total Credits</p><p className="text-xl font-bold text-red-600">R 125,430.50</p></div>
                    </div>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                    <Send className="w-4 h-4" /> Post to Ledger
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold">Draft Entries</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">📄 CSV</Button>
                    <Button variant="outline" size="sm">📊 Excel</Button>
                    <Button variant="outline" size="sm">📑 PDF</Button>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Reference</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2 text-right">Debit</th>
                      <th className="px-4 py-2 text-right">Credit</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr><td className="px-4 py-2 font-mono text-xs">Jan 15</td><td className="px-4 py-2 font-mono text-xs">BANK-001</td><td className="px-4 py-2">SHOPRITE PARK MEADOWS</td><td className="px-4 py-2 text-right text-green-600 font-mono">R 1,245.80</td><td className="px-4 py-2 text-right text-red-600 font-mono">R 1,245.80</td><td className="px-4 py-2"><Badge className="bg-amber-100 text-amber-700 text-xs">staged</Badge></td></tr>
                    <tr><td className="px-4 py-2 font-mono text-xs">Jan 14</td><td className="px-4 py-2 font-mono text-xs">BANK-002</td><td className="px-4 py-2">ESKOM PREPAID</td><td className="px-4 py-2 text-right text-green-600 font-mono">R 2,500.00</td><td className="px-4 py-2 text-right text-red-600 font-mono">R 2,500.00</td><td className="px-4 py-2"><Badge className="bg-amber-100 text-amber-700 text-xs">staged</Badge></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </MockBrowser>
        </div>

        <ExplanationPanel title="Staging Review">
          <ExplanationStep num={1} title="Balance Verification" desc="Green 'Balanced' badge confirms debits equal credits." />
          <ExplanationStep num={2} title="Export Options" desc="Export to CSV, Excel, or PDF for review." />
          <ExplanationStep num={3} title="Post to Ledger" desc="Click to permanently post entries to GL." />
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700"><strong>Important:</strong> Once posted, entries cannot be deleted - only reversed.</p>
          </div>
        </ExplanationPanel>
      </div>
    </div>
  );
}

function PostToGLSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader step={4} title="Post to General Ledger" subtitle="Confirm and permanently post entries to the general ledger" />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MockBrowser url="peakflow.app/workspace/acme-corp/bank-import → Staging Review">
            <div className="relative">
              <div className="p-6 opacity-30 blur-sm">
                <div className="bg-gray-200 h-40 rounded-xl"></div>
              </div>

              {/* Dialog Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
                  <h3 className="text-lg font-semibold mb-2">Post to General Ledger?</h3>
                  <p className="text-sm text-gray-500 mb-4">This will permanently post the entries. This action cannot be undone.</p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Journal Entries:</span><span className="font-semibold">42</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">GL Entries:</span><span className="font-semibold">84</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Debits:</span><span className="font-semibold text-green-600">R 125,430.50</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Credits:</span><span className="font-semibold text-red-600">R 125,430.50</span></div>
                    <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-500">Balance Check:</span><Badge className="bg-green-100 text-green-700">✓ Balanced</Badge></div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2"><Send className="w-4 h-4" /> Post to Ledger</Button>
                  </div>
                </div>
              </div>
            </div>
          </MockBrowser>
        </div>

        <ExplanationPanel title="Posting Confirmation">
          <ExplanationStep num={1} title="Summary Review" desc="Dialog shows summary of all entries including counts and totals." />
          <ExplanationStep num={2} title="Balance Verification" desc="Confirms debits = credits. Warning shown if not balanced." />
          <ExplanationStep num={3} title="Permanent Action" desc="Once posted, entries appear in all financial reports." />
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700"><strong>Success:</strong> "Posted 42 journal entries and 84 GL entries to general ledger"</p>
          </div>
        </ExplanationPanel>
      </div>
    </div>
  );
}

function ReportsSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader step={5} title="Financial Reports" subtitle="Generate comprehensive reports from your posted transactions" />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MockBrowser url="peakflow.app/workspace/acme-corp/reports">
            <div className="p-6 space-y-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex bg-gray-50 border-b overflow-x-auto text-sm">
                  <div className="px-3 py-2 text-gray-500 whitespace-nowrap">Aged Receivables</div>
                  <div className="px-3 py-2 text-gray-500 whitespace-nowrap">Aged Payables</div>
                  <div className="px-3 py-2 text-gray-500 whitespace-nowrap">Income Statement</div>
                  <div className="px-3 py-2 text-gray-500 whitespace-nowrap">Balance Sheet</div>
                  <div className="px-3 py-2 text-emerald-700 font-medium border-b-2 border-emerald-500 bg-white whitespace-nowrap">Trial Balance</div>
                  <div className="px-3 py-2 text-gray-500 whitespace-nowrap">General Ledger</div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <input type="date" defaultValue="2025-01-31" className="px-3 py-2 border rounded-lg text-sm" />
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">🔄 Generate</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">📄 Export PDF</Button>
                      <Button variant="outline" size="sm">📊 Export Excel</Button>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                        <th className="px-3 py-2">Account</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-blue-50"><td colSpan={5} className="px-3 py-1 font-semibold text-blue-700">ASSETS</td></tr>
                      <tr className="border-b"><td className="px-3 py-2 font-mono">1000</td><td className="px-3 py-2">Cash - Bank</td><td className="px-3 py-2"><Badge className="bg-blue-50 text-blue-700 text-xs">Asset</Badge></td><td className="px-3 py-2 text-right font-mono">R 125,430.50</td><td className="px-3 py-2 text-right">—</td></tr>
                      <tr className="bg-red-50"><td colSpan={5} className="px-3 py-1 font-semibold text-red-700">LIABILITIES</td></tr>
                      <tr className="border-b"><td className="px-3 py-2 font-mono">2000</td><td className="px-3 py-2">Accounts Payable</td><td className="px-3 py-2"><Badge className="bg-red-50 text-red-700 text-xs">Liability</Badge></td><td className="px-3 py-2 text-right">—</td><td className="px-3 py-2 text-right font-mono">R 28,500.00</td></tr>
                      <tr className="bg-gray-100 font-semibold"><td colSpan={3} className="px-3 py-2">TOTALS</td><td className="px-3 py-2 text-right text-green-600">R 208,500.00</td><td className="px-3 py-2 text-right text-red-600">R 208,500.00</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </MockBrowser>
        </div>

        <ExplanationPanel title="Available Reports">
          <div className="text-sm space-y-3">
            <div><strong className="text-gray-700">AR/AP:</strong><p className="text-gray-500 text-xs">Aged Receivables, Aged Payables, Summaries</p></div>
            <div><strong className="text-gray-700">Financial:</strong><p className="text-gray-500 text-xs">Income Statement, Balance Sheet, Cash Flow</p></div>
            <div><strong className="text-gray-700">GL:</strong><p className="text-gray-500 text-xs">Trial Balance, General Ledger, Journal Entries</p></div>
          </div>
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-700"><strong>Export:</strong> All reports support PDF and Excel export.</p>
          </div>
        </ExplanationPanel>
      </div>
    </div>
  );
}

function ExportsSlide() {
  return (
    <div className="space-y-6">
      <SlideHeader title="Excel & PDF Exports" subtitle="Professional exports with full formatting and company branding" />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Excel Preview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-700 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" /> Trial_Balance_Acme_Corp_2025-01-31.xlsx
            </div>
            <div className="p-4 bg-white">
              <div className="grid grid-cols-6 text-xs border">
                <div className="bg-gray-100 p-1 border-r font-semibold text-center"></div>
                <div className="bg-gray-100 p-1 border-r font-semibold text-center">A</div>
                <div className="bg-gray-100 p-1 border-r font-semibold text-center">B</div>
                <div className="bg-gray-100 p-1 border-r font-semibold text-center">C</div>
                <div className="bg-gray-100 p-1 border-r font-semibold text-center">D</div>
                <div className="bg-gray-100 p-1 font-semibold text-center">E</div>

                <div className="bg-gray-100 p-1 border-r text-center">1</div>
                <div className="col-span-5 p-1 font-bold bg-green-50">Acme Corporation - Trial Balance</div>

                <div className="bg-gray-100 p-1 border-r text-center">2</div>
                <div className="col-span-5 p-1 text-gray-500">As of January 31, 2025</div>

                <div className="bg-gray-100 p-1 border-r text-center">4</div>
                <div className="p-1 bg-gray-50 font-semibold border-r">Account Code</div>
                <div className="p-1 bg-gray-50 font-semibold border-r">Account Name</div>
                <div className="p-1 bg-gray-50 font-semibold border-r">Type</div>
                <div className="p-1 bg-gray-50 font-semibold border-r text-right">Debit</div>
                <div className="p-1 bg-gray-50 font-semibold text-right">Credit</div>

                <div className="bg-gray-100 p-1 border-r text-center">5</div>
                <div className="p-1 font-mono border-r">1000</div>
                <div className="p-1 border-r">Cash - Bank Account</div>
                <div className="p-1 border-r">Asset</div>
                <div className="p-1 border-r text-right">R 125,430.50</div>
                <div className="p-1 text-right">-</div>
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" /> Trial_Balance_Acme_Corp_2025-01-31.pdf
            </div>
            <div className="p-6 bg-gray-100">
              <div className="bg-white p-6 shadow-sm text-center">
                <h1 className="text-lg font-bold">Acme Corporation</h1>
                <h2 className="text-md font-semibold text-gray-700">Trial Balance</h2>
                <p className="text-xs text-gray-500 mt-1">As of January 31, 2025</p>
                <p className="text-[10px] text-gray-400 mt-4">Generated by PeakFlow | Prepared by: John Doe</p>
              </div>
            </div>
          </div>
        </div>

        <ExplanationPanel title="Export Features">
          <ExplanationStep num={1} title="Excel Export" desc="Full spreadsheet with formatting, groupings, currency, subtotals." />
          <ExplanationStep num={2} title="PDF Export" desc="Professional PDF with company name, title, date, preparer." />
          <ExplanationStep num={3} title="All Reports" desc="Every report type can export to both formats." />
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600"><strong>File naming:</strong> Auto-named with company, type, and date.</p>
          </div>
        </ExplanationPanel>
      </div>
    </div>
  );
}

function SummarySlide() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Workflow Complete!</h2>
      <p className="text-gray-500 mb-8">You've learned the complete bank import to reports workflow</p>

      <div className="grid grid-cols-3 gap-6 mb-8 max-w-3xl">
        <SummaryCard icon={Upload} title="Import" desc="Upload PDF statements, AI extracts transactions" color="blue" />
        <SummaryCard icon={Sparkles} title="Map" desc="AI maps transactions to GL accounts" color="purple" />
        <SummaryCard icon={CheckCircle2} title="Review & Post" desc="Verify entries and post to GL" color="emerald" />
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <SummaryCard icon={BarChart3} title="Generate Reports" desc="Trial Balance, Income Statement, Balance Sheet" color="amber" />
        <SummaryCard icon={Download} title="Export" desc="Download professional PDF and Excel reports" color="green" />
      </div>

      <p className="text-gray-500 mt-8">
        Need help? Visit <strong className="text-emerald-600">peakflow.app/support</strong>
      </p>
    </div>
  );
}

// Helper Components

function SlideHeader({ step, title, subtitle, continued }: { step?: number; title: string; subtitle: string; continued?: boolean }) {
  return (
    <div className="mb-6">
      {step && <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Step {step} of 5{continued && ' (continued)'}</p>}
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );
}

function MockBrowser({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1.5 text-xs text-gray-500 font-mono">{url}</div>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30">{children}</div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'blue' | 'purple' | 'emerald' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function ExplanationPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm h-fit">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">🔍</span> {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ExplanationStep({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">{num}</div>
      <div>
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: 'blue' | 'purple' | 'emerald' | 'amber' | 'green' }) {
  const gradients = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    green: 'from-green-600 to-emerald-700',
  };
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}
