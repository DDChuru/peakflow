/**
 * Export Helpers for CSV, Excel, and PDF generation
 * Used for exporting staging data and archived statements
 */

import { StagingJournalEntry, StagingGeneralLedgerEntry } from '@/types/accounting/staging';

// CSV Export
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Excel Export (using CSV format with .xlsx extension for simplicity)
// For true Excel format, you'd use a library like xlsx or exceljs
export function exportToExcel(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // For now, we'll export as CSV with .xlsx extension
  // In production, consider using a proper Excel library
  const headers = Object.keys(data[0]);

  const csvContent = [
    headers.join('\t'), // Tab-separated for better Excel compatibility
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes('\t') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join('\t')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// PDF Export (basic HTML to PDF approach)
export function exportToPDF(content: string, filename: string) {
  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error('Failed to create PDF');
  }

  // Write content to iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header { margin-bottom: 20px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Trigger print dialog (user can save as PDF)
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}

// Format journal entries for export
export function formatJournalEntriesForExport(entries: StagingJournalEntry[]) {
  return entries.flatMap(entry =>
    entry.lines.map((line, index) => ({
      'Entry ID': index === 0 ? entry.id : '',
      'Date': index === 0 ? new Date(entry.transactionDate).toLocaleDateString() : '',
      'Reference': index === 0 ? entry.reference : '',
      'Description': index === 0 ? entry.description : '',
      'Account Code': line.accountCode,
      'Account Name': line.accountName,
      'Debit': line.debit || 0,
      'Credit': line.credit || 0,
      'Status': index === 0 ? entry.status : ''
    }))
  );
}

// Format GL entries for export
export function formatGLEntriesForExport(entries: StagingGeneralLedgerEntry[]) {
  return entries.map(entry => ({
    'Date': new Date(entry.transactionDate).toLocaleDateString(),
    'Account Code': entry.accountCode,
    'Account Name': entry.accountName,
    'Reference': entry.reference,
    'Description': entry.description,
    'Debit': entry.debit || 0,
    'Credit': entry.credit || 0,
    'Balance': entry.balance,
    'Status': entry.status
  }));
}

// Generate PDF content for staging summary
export function generateStagingPDFContent(
  sessionId: string,
  journalEntries: StagingJournalEntry[],
  glEntries: StagingGeneralLedgerEntry[],
  totalDebits: number,
  totalCredits: number,
  companyCurrency: string
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency,
    }).format(amount);
  };

  return `
    <div class="header">
      <h1>Staging Review Report</h1>
      <p><strong>Session ID:</strong> ${sessionId}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
      <h2>Summary</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Journal Entries</td>
          <td>${journalEntries.length}</td>
        </tr>
        <tr>
          <td>GL Entries</td>
          <td>${glEntries.length}</td>
        </tr>
        <tr>
          <td>Total Debits</td>
          <td style="color: green;">${formatCurrency(totalDebits)}</td>
        </tr>
        <tr>
          <td>Total Credits</td>
          <td style="color: red;">${formatCurrency(totalCredits)}</td>
        </tr>
        <tr>
          <td>Balanced</td>
          <td>${Math.abs(totalDebits - totalCredits) < 0.01 ? '✓ Yes' : '✗ No'}</td>
        </tr>
      </table>
    </div>

    <div class="entries">
      <h2>Journal Entries</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          ${journalEntries.flatMap(entry =>
            entry.lines.map((line, idx) => `
              <tr>
                <td>${idx === 0 ? new Date(entry.transactionDate).toLocaleDateString() : ''}</td>
                <td>${idx === 0 ? entry.reference : ''}</td>
                <td>${line.accountCode} - ${line.accountName}</td>
                <td>${line.debit ? formatCurrency(line.debit) : ''}</td>
                <td>${line.credit ? formatCurrency(line.credit) : ''}</td>
              </tr>
            `).join('')
          ).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>This is a system-generated report. All amounts are in ${companyCurrency}.</p>
    </div>
  `;
}
