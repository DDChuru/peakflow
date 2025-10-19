'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UseFormRegister, FieldErrors, FieldArrayWithId, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadixSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Calculator,
  AlertCircle,
  Info,
  History,
  Clock,
  CheckCircle
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface GLAccount {
  id: string;
  code: string;
  name: string;
}

interface LineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  glAccountId: string;
  glAccountCode?: string;
  glAccountName?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  taxRate?: number;
  unit?: string;
  category?: string;
  notes?: string;
}

interface LineItemManagerProps {
  lineItems: FieldArrayWithId<any, 'lineItems', 'id'>[];
  glAccounts: GLAccount[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, data: Partial<LineItemData>) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  showEffectiveDates?: boolean;
  showHistory?: boolean;
  readOnly?: boolean;
}

interface ProrationInfo {
  originalAmount: number;
  proratedAmount: number;
  daysUsed: number;
  totalDays: number;
  factor: number;
}

export function LineItemManager({
  lineItems,
  glAccounts,
  onAdd,
  onRemove,
  onUpdate,
  register,
  setValue,
  watch,
  errors,
  showEffectiveDates = true,
  showHistory = false,
  readOnly = false
}: LineItemManagerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showProrateCalculator, setShowProrateCalculator] = useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const calculateAmount = (quantity: number, unitPrice: number): number => {
    return quantity * unitPrice;
  };

  const calculateProration = (
    amount: number,
    startDate: string,
    endDate: string,
    effectiveFrom: string
  ): ProrationInfo | null => {
    if (!startDate || !endDate || !effectiveFrom) return null;

    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const effectiveDate = new Date(effectiveFrom);

    if (effectiveDate <= periodStart) {
      // Full period
      return null;
    }

    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysUsed = Math.ceil((periodEnd.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));
    const factor = daysUsed / totalDays;
    const proratedAmount = amount * factor;

    return {
      originalAmount: amount,
      proratedAmount,
      daysUsed,
      totalDays,
      factor
    };
  };

  const getTotalValue = (): number => {
    return lineItems.reduce((total, item, index) => {
      const quantity = parseFloat(item.quantity?.toString() || '0');
      const unitPrice = parseFloat(item.unitPrice?.toString() || '0');
      return total + calculateAmount(quantity, unitPrice);
    }, 0);
  };

  const getGLAccountInfo = (accountId: string): GLAccount | undefined => {
    return glAccounts.find(acc => acc.id === accountId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
          <p className="text-sm text-gray-500">
            Add services and products included in this contract
          </p>
        </div>
        {!readOnly && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Total Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Total Contract Value</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(getTotalValue())}
              </p>
              <p className="text-sm text-blue-600">
                {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {lineItems.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const quantity = parseFloat(item.quantity?.toString() || '0');
            const unitPrice = parseFloat(item.unitPrice?.toString() || '0');
            const amount = calculateAmount(quantity, unitPrice);
            const glAccount = getGLAccountInfo(item.glAccountId);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  'overflow-hidden transition-all duration-200',
                  isExpanded ? 'ring-2 ring-blue-200' : 'hover:shadow-md'
                )}>
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        <div className="lg:col-span-4 space-y-2">
                          <Label htmlFor={`lineItems.${index}.description`}>
                            Description *
                          </Label>
                          <Input
                            id={`lineItems.${index}.description`}
                            {...register(`lineItems.${index}.description`)}
                            placeholder="Service description"
                            readOnly={readOnly}
                          />
                          {errors.lineItems?.[index]?.description && (
                            <p className="text-sm text-red-600">
                              {errors.lineItems[index]?.description?.message}
                            </p>
                          )}
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                          <Label htmlFor={`lineItems.${index}.quantity`}>
                            Quantity *
                          </Label>
                          <Input
                            id={`lineItems.${index}.quantity`}
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`lineItems.${index}.quantity`, {
                              valueAsNumber: true
                            })}
                            onChange={(e) => {
                              const newQuantity = parseFloat(e.target.value) || 0;
                              setValue(`lineItems.${index}.quantity`, newQuantity, { shouldValidate: true });
                              // Trigger re-calculation by updating the line item
                              const currentPrice = watch(`lineItems.${index}.unitPrice`) || 0;
                              onUpdate(index, {
                                quantity: newQuantity,
                                unitPrice: currentPrice
                              });
                            }}
                            placeholder="1"
                            readOnly={readOnly}
                          />
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                          <Label htmlFor={`lineItems.${index}.unitPrice`}>
                            Unit Price *
                          </Label>
                          <Input
                            id={`lineItems.${index}.unitPrice`}
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`lineItems.${index}.unitPrice`, {
                              valueAsNumber: true
                            })}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              setValue(`lineItems.${index}.unitPrice`, newPrice, { shouldValidate: true });
                              // Trigger re-calculation by updating the line item
                              const currentQuantity = watch(`lineItems.${index}.quantity`) || 0;
                              onUpdate(index, {
                                quantity: currentQuantity,
                                unitPrice: newPrice
                              });
                            }}
                            placeholder="0.00"
                            readOnly={readOnly}
                          />
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                          <Label>Amount</Label>
                          <div className="flex items-center h-10 px-3 bg-gray-50 border rounded-md">
                            <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                            <span className="font-medium text-gray-900">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        </div>

                        <div className="lg:col-span-2 flex items-center justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpanded(index)}
                          >
                            {isExpanded ? 'Less' : 'More'}
                          </Button>
                          {!readOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onRemove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100 bg-gray-50 p-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* GL Account */}
                            <div className="space-y-2">
                              <Label>GL Account *</Label>
                              <Select
                                onValueChange={(value) => {
                                  onUpdate(index, { glAccountId: value });
                                  const account = getGLAccountInfo(value);
                                  if (account) {
                                    onUpdate(index, {
                                      glAccountCode: account.code,
                                      glAccountName: account.name
                                    });
                                  }
                                }}
                                disabled={readOnly}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder="Select account"
                                    value={item.glAccountId}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {glAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {account.code}
                                        </Badge>
                                        <span>{account.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {glAccount && (
                                <p className="text-xs text-gray-600">
                                  {glAccount.code} - {glAccount.name}
                                </p>
                              )}
                              {errors.lineItems?.[index]?.glAccountId && (
                                <p className="text-sm text-red-600">
                                  {errors.lineItems[index]?.glAccountId?.message}
                                </p>
                              )}
                            </div>

                            {/* Unit */}
                            <div className="space-y-2">
                              <Label htmlFor={`lineItems.${index}.unit`}>
                                Unit
                              </Label>
                              <Select
                                onValueChange={(value) => onUpdate(index, { unit: value })}
                                disabled={readOnly}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="service">Service</SelectItem>
                                  <SelectItem value="hour">Hour</SelectItem>
                                  <SelectItem value="day">Day</SelectItem>
                                  <SelectItem value="month">Month</SelectItem>
                                  <SelectItem value="license">License</SelectItem>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="each">Each</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Tax Rate */}
                            <div className="space-y-2">
                              <Label htmlFor={`lineItems.${index}.taxRate`}>
                                Tax Rate (%)
                              </Label>
                              <Input
                                id={`lineItems.${index}.taxRate`}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                {...register(`lineItems.${index}.taxRate`, { valueAsNumber: true })}
                                placeholder="0.00"
                                readOnly={readOnly}
                              />
                            </div>

                            {showEffectiveDates && (
                              <>
                                {/* Effective From */}
                                <div className="space-y-2">
                                  <Label htmlFor={`lineItems.${index}.effectiveFrom`}>
                                    Effective From *
                                  </Label>
                                  <Input
                                    id={`lineItems.${index}.effectiveFrom`}
                                    type="date"
                                    {...register(`lineItems.${index}.effectiveFrom`)}
                                    readOnly={readOnly}
                                  />
                                  {errors.lineItems?.[index]?.effectiveFrom && (
                                    <p className="text-sm text-red-600">
                                      {errors.lineItems[index]?.effectiveFrom?.message}
                                    </p>
                                  )}
                                </div>

                                {/* Effective To */}
                                <div className="space-y-2">
                                  <Label htmlFor={`lineItems.${index}.effectiveTo`}>
                                    Effective To
                                  </Label>
                                  <Input
                                    id={`lineItems.${index}.effectiveTo`}
                                    type="date"
                                    {...register(`lineItems.${index}.effectiveTo`)}
                                    placeholder="Leave empty for indefinite"
                                    readOnly={readOnly}
                                  />
                                </div>
                              </>
                            )}

                            {/* Category */}
                            <div className="space-y-2">
                              <Label htmlFor={`lineItems.${index}.category`}>
                                Category
                              </Label>
                              <Input
                                id={`lineItems.${index}.category`}
                                {...register(`lineItems.${index}.category`)}
                                placeholder="Professional Services"
                                readOnly={readOnly}
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mt-4 space-y-2">
                            <Label htmlFor={`lineItems.${index}.notes`}>
                              Notes
                            </Label>
                            <Textarea
                              id={`lineItems.${index}.notes`}
                              {...register(`lineItems.${index}.notes`)}
                              placeholder="Additional notes for this line item..."
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          {/* Proration Calculator */}
                          {showProrateCalculator === index && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Calculator className="h-4 w-4 text-blue-600" />
                                <h4 className="font-medium text-blue-900">Proration Calculator</h4>
                              </div>
                              <p className="text-sm text-blue-700">
                                Calculate prorated amount for mid-period changes
                              </p>
                              {/* Proration logic would go here */}
                            </div>
                          )}

                          {/* History Timeline (if enabled) */}
                          {showHistory && (
                            <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <History className="h-4 w-4 text-gray-600" />
                                <h4 className="font-medium text-gray-900">Change History</h4>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Created</span>
                                  </div>
                                  <span className="text-gray-500">
                                    {new Date().toLocaleDateString()}
                                  </span>
                                  <span className="text-gray-700">
                                    Initial line item creation
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {lineItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No line items yet</h3>
            <p className="text-gray-500 mb-6">
              Add services and products to define the contract value
            </p>
            {!readOnly && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Validation Summary */}
      {lineItems.length > 0 && errors.lineItems && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Line Items Need Attention</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Please review and fix the highlighted errors above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
