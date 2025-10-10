'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllIndustryShowcaseData,
  formatAccountType,
  formatNormalBalance,
  type IndustryShowcaseDataset,
  type IndustryShowcaseAccountRow,
} from '@/lib/accounting/industry-showcase-utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const datasets = getAllIndustryShowcaseData().sort((a, b) =>
  a.industry.name.localeCompare(b.industry.name)
);

const PREVIEW_LIMIT = 8;

type IndustryTheme = {
  tabActive: string;
  tabHover: string;
  bankBorder: string;
  bankHeading: string;
  bankRowBg: string;
  linkedRowBg: string;
  badgeOutline: string;
};

const industryThemes: Record<string, IndustryTheme> = {
  default: {
    tabActive: 'data-[state=active]:bg-slate-900 data-[state=active]:text-white',
    tabHover: 'hover:border-slate-300 hover:bg-white',
    bankBorder: 'border-slate-200',
    bankHeading: 'text-slate-600',
    bankRowBg: 'hover:bg-slate-50',
    linkedRowBg: 'bg-slate-50/60',
    badgeOutline: 'border-slate-300 text-slate-600',
  },
  hospitality: {
    tabActive: 'data-[state=active]:bg-amber-500 data-[state=active]:text-white',
    tabHover: 'hover:border-amber-200 hover:bg-amber-50',
    bankBorder: 'border-amber-200',
    bankHeading: 'text-amber-700',
    bankRowBg: 'hover:bg-amber-50/60',
    linkedRowBg: 'bg-amber-50/40',
    badgeOutline: 'border-amber-200 text-amber-700',
  },
  technology: {
    tabActive: 'data-[state=active]:bg-emerald-500 data-[state=active]:text-white',
    tabHover: 'hover:border-emerald-200 hover:bg-emerald-50',
    bankBorder: 'border-emerald-200',
    bankHeading: 'text-emerald-700',
    bankRowBg: 'hover:bg-emerald-50/60',
    linkedRowBg: 'bg-emerald-50/40',
    badgeOutline: 'border-emerald-200 text-emerald-700',
  },
  service: {
    tabActive: 'data-[state=active]:bg-teal-500 data-[state=active]:text-white',
    tabHover: 'hover:border-teal-200 hover:bg-teal-50',
    bankBorder: 'border-teal-200',
    bankHeading: 'text-teal-700',
    bankRowBg: 'hover:bg-teal-50/60',
    linkedRowBg: 'bg-teal-50/40',
    badgeOutline: 'border-teal-200 text-teal-700',
  },
  retail: {
    tabActive: 'data-[state=active]:bg-rose-500 data-[state=active]:text-white',
    tabHover: 'hover:border-rose-200 hover:bg-rose-50',
    bankBorder: 'border-rose-200',
    bankHeading: 'text-rose-700',
    bankRowBg: 'hover:bg-rose-50/60',
    linkedRowBg: 'bg-rose-50/40',
    badgeOutline: 'border-rose-200 text-rose-700',
  },
  manufacturing: {
    tabActive: 'data-[state=active]:bg-stone-500 data-[state=active]:text-white',
    tabHover: 'hover:border-stone-300 hover:bg-stone-50',
    bankBorder: 'border-stone-300',
    bankHeading: 'text-stone-700',
    bankRowBg: 'hover:bg-stone-50/70',
    linkedRowBg: 'bg-stone-50/50',
    badgeOutline: 'border-stone-400 text-stone-700',
  },
  healthcare: {
    tabActive: 'data-[state=active]:bg-sky-500 data-[state=active]:text-white',
    tabHover: 'hover:border-sky-200 hover:bg-sky-50',
    bankBorder: 'border-sky-200',
    bankHeading: 'text-sky-700',
    bankRowBg: 'hover:bg-sky-50/60',
    linkedRowBg: 'bg-sky-50/40',
    badgeOutline: 'border-sky-200 text-sky-700',
  },
  construction: {
    tabActive: 'data-[state=active]:bg-amber-600 data-[state=active]:text-white',
    tabHover: 'hover:border-amber-300 hover:bg-amber-50',
    bankBorder: 'border-amber-300',
    bankHeading: 'text-amber-700',
    bankRowBg: 'hover:bg-amber-50/60',
    linkedRowBg: 'bg-amber-50/40',
    badgeOutline: 'border-amber-300 text-amber-700',
  },
  nonprofit: {
    tabActive: 'data-[state=active]:bg-lime-500 data-[state=active]:text-white',
    tabHover: 'hover:border-lime-200 hover:bg-lime-50',
    bankBorder: 'border-lime-200',
    bankHeading: 'text-lime-700',
    bankRowBg: 'hover:bg-lime-50/60',
    linkedRowBg: 'bg-lime-50/40',
    badgeOutline: 'border-lime-200 text-lime-700',
  },
};

const typeLabels: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};

const groupedTypeOrder = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export default function IndustryCOAShowcase() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(datasets[0]?.industry.id ?? '');
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);
  const [groupByType, setGroupByType] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [showAllBankAccounts, setShowAllBankAccounts] = useState(false);

  const currentDataset = useMemo<IndustryShowcaseDataset | undefined>(
    () => datasets.find((dataset) => dataset.industry.id === selectedIndustry),
    [selectedIndustry]
  );

  useEffect(() => {
    setShowAllAccounts(false);
    setShowAllBankAccounts(false);
  }, [selectedIndustry, showOnlyRequired]);

  const filteredAccounts = useMemo(() => {
    if (!currentDataset) return [];
    const base = showOnlyRequired
      ? currentDataset.accounts.filter((account) => account.isRequired)
      : currentDataset.accounts;
    return base;
  }, [currentDataset, showOnlyRequired]);

  const displayAccounts = useMemo(
    () => (showAllAccounts ? filteredAccounts : filteredAccounts.slice(0, PREVIEW_LIMIT)),
    [filteredAccounts, showAllAccounts]
  );

  const groupedDisplayAccounts = useMemo(() => {
    const limited = showAllAccounts ? filteredAccounts : filteredAccounts.slice(0, PREVIEW_LIMIT);
    return limited.reduce<Record<string, IndustryShowcaseAccountRow[]>>((acc, account) => {
      const key = account.type;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(account);
      return acc;
    }, {});
  }, [filteredAccounts, showAllAccounts]);

  const bankLinkedAccounts = useMemo(() => {
    if (!currentDataset) return [];
    const base = showOnlyRequired
      ? currentDataset.bankLinkedAccounts.filter((account) => account.isRequired)
      : currentDataset.bankLinkedAccounts;
    return base;
  }, [currentDataset, showOnlyRequired]);

  const displayBankAccounts = useMemo(
    () => (showAllBankAccounts ? bankLinkedAccounts : bankLinkedAccounts.slice(0, PREVIEW_LIMIT)),
    [bankLinkedAccounts, showAllBankAccounts]
  );

  const themeKey = currentDataset?.industry.category ?? 'default';
  const theme = industryThemes[themeKey] ?? industryThemes.default;

  if (!currentDataset) {
    return null;
  }

  const renderAccountRow = (account: IndustryShowcaseAccountRow) => (
    <TableRow key={account.code} className={cn('transition-colors', account.bankLinked && theme.linkedRowBg)}>
      <TableCell className="font-mono text-xs text-muted-foreground">{account.code}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div
            className="font-medium text-gray-900"
            style={{ paddingLeft: account.depth * 16 }}
          >
            {account.name}
          </div>
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            {account.tags.map((tag) => (
              <Badge key={tag} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
            {account.bankLinked && account.tags.length === 0 && (
              <Badge variant="secondary" size="sm">
                Bank linked
              </Badge>
            )}
            {account.mappingKeywords.map((keyword) => (
              <Badge key={keyword} variant="outline" size="sm">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </TableCell>
      <TableCell>{formatAccountType(account)}</TableCell>
      <TableCell>{formatNormalBalance(account.normalBalance)}</TableCell>
      <TableCell>
        <Badge variant={account.isRequired ? 'success' : 'secondary'} size="sm">
          {account.isRequired ? 'Required' : 'Optional'}
        </Badge>
      </TableCell>
      <TableCell>{account.isCommon ? 'Common' : 'Specialty'}</TableCell>
    </TableRow>
  );

  const renderAccountsTable = () => {
    if (groupByType) {
      return groupedTypeOrder
        .filter((type) => groupedDisplayAccounts[type]?.length)
        .map((type) => (
          <tbody key={type} className="group/type">
            <TableRow className="bg-slate-100">
              <TableCell colSpan={6} className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                {typeLabels[type] ?? type}
              </TableCell>
            </TableRow>
            {groupedDisplayAccounts[type]?.map((account) => renderAccountRow(account))}
          </tbody>
        ));
    }

    return (
      <TableBody>
        {displayAccounts.map((account) => renderAccountRow(account))}
      </TableBody>
    );
  };

  return (
    <div className="space-y-10 text-slate-900">
      <div className="flex flex-col gap-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Industry Chart of Accounts Library</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Browse curated account structures and the payment rails that support each industry. Use the filters to focus on required ledgers or regroup the hierarchy for walkthroughs with clients.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Select industry</Label>
              <div className="hidden md:block">
                <Tabs value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="flex min-w-max flex-nowrap gap-2 bg-transparent p-0">
                      {datasets.map(({ industry }) => (
                        <TabsTrigger
                          key={industry.id}
                          value={industry.id}
                          className={cn(
                            'rounded-full border border-transparent bg-slate-100/70 px-4 py-2 text-xs font-medium text-slate-600 transition',
                            theme.tabHover,
                            theme.tabActive
                          )}
                        >
                          {industry.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </Tabs>
              </div>
              <div className="md:hidden">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="bg-white/90">
                    <SelectValue placeholder="Choose an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map(({ industry }) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Display</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium">Required accounts only</p>
                    <p className="text-xs text-slate-500">Simplify onboarding checklists</p>
                  </div>
                  <Switch
                    checked={showOnlyRequired}
                    onCheckedChange={setShowOnlyRequired}
                    aria-label="Toggle required accounts only"
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium">Group by account type</p>
                    <p className="text-xs text-slate-500">Present assets, liabilities, and revenue in sections</p>
                  </div>
                  <Switch
                    checked={groupByType}
                    onCheckedChange={setGroupByType}
                    aria-label="Toggle grouping by account type"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Snapshot</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Total accounts</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{filteredAccounts.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Bank linked</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{bankLinkedAccounts.length}</p>
                </div>
              </div>
              <AnimatePresence>
                {currentDataset.stats.bankTags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex flex-wrap gap-2"
                  >
                    {currentDataset.stats.bankTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{currentDataset.industry.name}</h2>
          <p className="text-sm text-slate-600">{currentDataset.industry.description}</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Chart of Accounts</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="w-40">Type</TableHead>
                    <TableHead className="w-32">Normal Balance</TableHead>
                    <TableHead className="w-40">Requirement</TableHead>
                    <TableHead className="w-28">Common</TableHead>
                  </TableRow>
                </TableHeader>
                {renderAccountsTable()}
              </Table>
            </div>
            <div className="flex items-center justify-between px-6 pb-4 text-xs text-slate-500">
              <span>
                Showing {displayAccounts.length} of {filteredAccounts.length} accounts
              </span>
              {filteredAccounts.length > PREVIEW_LIMIT && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowAllAccounts((prev) => !prev)}
                >
                  {showAllAccounts ? 'Show less' : 'Show all accounts'}
                </Button>
              )}
            </div>
          </div>

          <div className={cn('rounded-3xl border bg-white/95 shadow-sm', theme.bankBorder)}>
            <div className={cn('flex items-center justify-between border-b px-6 py-4', theme.bankBorder)}>
              <h3 className={cn('text-xs font-semibold uppercase tracking-[0.25em]', theme.bankHeading)}>Bank & Payment Accounts</h3>
              <Badge variant="outline" size="sm" className={cn(theme.badgeOutline)}>
                {bankLinkedAccounts.length} linked
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="w-40">Type</TableHead>
                    <TableHead className="w-32">Normal Balance</TableHead>
                    <TableHead className="w-56">Connectors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayBankAccounts.map((account) => (
                    <TableRow key={`bank-${account.code}`} className={cn('transition-colors', theme.bankRowBg)}>
                      <TableCell className="font-mono text-xs text-slate-500">{account.code}</TableCell>
                      <TableCell>
                        <div
                          className="font-medium text-slate-900"
                          style={{ paddingLeft: account.depth * 16 }}
                        >
                          {account.name}
                        </div>
                        {account.mappingKeywords.length > 0 && (
                          <p className="text-xs text-slate-500">{account.mappingKeywords.join(', ')}</p>
                        )}
                      </TableCell>
                      <TableCell>{formatAccountType(account)}</TableCell>
                      <TableCell>{formatNormalBalance(account.normalBalance)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(account.tags.length ? account.tags : ['Bank linked']).map((tag) => (
                            <Badge key={`${account.code}-${tag}`} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-6 pb-4 text-xs text-slate-500">
              <span>
                Showing {displayBankAccounts.length} of {bankLinkedAccounts.length} bank-linked accounts
              </span>
              {bankLinkedAccounts.length > PREVIEW_LIMIT && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowAllBankAccounts((prev) => !prev)}
                >
                  {showAllBankAccounts ? 'Show less' : 'Show all bank accounts'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
