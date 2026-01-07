'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  currency?: string;
  locale?: string;
  allowNegative?: boolean;
  decimalPlaces?: number;
}

/**
 * CurrencyInput - A modern currency input component
 *
 * Features:
 * - Shows empty field when value is 0/null (no pre-filled zeros)
 * - Formats display value with thousand separators
 * - Allows direct typing without cursor positioning issues
 * - Handles decimal values properly
 * - Optional currency symbol display
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChange,
      currency = 'ZAR',
      locale = 'en-ZA',
      allowNegative = false,
      decimalPlaces = 2,
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Get currency symbol
    const currencySymbol = React.useMemo(() => {
      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          currencyDisplay: 'narrowSymbol',
        });
        const parts = formatter.formatToParts(0);
        const symbolPart = parts.find(part => part.type === 'currency');
        return symbolPart?.value || currency;
      } catch {
        return currency;
      }
    }, [currency, locale]);

    // Format number for display (with thousand separators)
    const formatForDisplay = React.useCallback(
      (num: number | null | undefined): string => {
        if (num === null || num === undefined || (num === 0 && !isFocused)) {
          return '';
        }

        try {
          return new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimalPlaces,
          }).format(num);
        } catch {
          return num.toString();
        }
      },
      [locale, decimalPlaces, isFocused]
    );

    // Parse input string to number
    const parseInputValue = React.useCallback(
      (input: string): number | null => {
        if (!input || input.trim() === '') {
          return null;
        }

        // Remove thousand separators and normalize decimal separator
        let cleaned = input
          .replace(/\s/g, '') // Remove spaces
          .replace(/[^\d.,\-]/g, ''); // Keep only digits, decimal separators, and minus

        // Handle different locales' decimal separators
        // For locales using comma as decimal (most of Europe)
        if (locale.startsWith('de') || locale.startsWith('fr') || locale.startsWith('es')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          // For locales using period as decimal (US, UK, ZA)
          cleaned = cleaned.replace(/,/g, '');
        }

        const num = parseFloat(cleaned);

        if (isNaN(num)) {
          return null;
        }

        if (!allowNegative && num < 0) {
          return Math.abs(num);
        }

        return num;
      },
      [locale, allowNegative]
    );

    // Sync display value with prop value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatForDisplay(value));
      }
    }, [value, isFocused, formatForDisplay]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number without formatting when focused
      if (value !== null && value !== undefined && value !== 0) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue('');
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Parse and format the value
      const parsed = parseInputValue(displayValue);
      if (parsed !== null) {
        // Round to specified decimal places
        const rounded = Math.round(parsed * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
        onChange?.(rounded);
        setDisplayValue(formatForDisplay(rounded));
      } else {
        onChange?.(null);
        setDisplayValue('');
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      // Optionally update parent on each change (for controlled components)
      const parsed = parseInputValue(inputValue);
      onChange?.(parsed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal point
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', '.', ','
      ];

      if (allowedKeys.includes(e.key)) {
        return;
      }

      // Allow minus only if negative values are allowed and at start
      if (e.key === '-' && allowNegative) {
        return;
      }

      // Allow Ctrl/Cmd + A, C, V, X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }

      // Block non-numeric characters
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }

      props.onKeyDown?.(e);
    };

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className={cn(
            "text-sm font-medium transition-colors",
            disabled ? "text-gray-300" : "text-gray-500"
          )}>
            {currencySymbol}
          </span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || '0.00'}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm text-right',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
