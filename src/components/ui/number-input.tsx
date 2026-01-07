'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  decimalPlaces?: number;
  showControls?: boolean;
  suffix?: string;
  prefix?: string;
}

/**
 * NumberInput - A modern number input component
 *
 * Features:
 * - Shows empty field when value is 0/null (no pre-filled zeros)
 * - Optional increment/decrement controls
 * - Min/max value constraints
 * - Step increments
 * - Optional prefix/suffix display
 * - Keyboard navigation support
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      min,
      max,
      step = 1,
      allowDecimal = false,
      decimalPlaces = 2,
      showControls = false,
      suffix,
      prefix,
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync display value with prop value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        if (value === null || value === undefined || (value === 0 && !isFocused)) {
          setDisplayValue('');
        } else {
          setDisplayValue(value.toString());
        }
      }
    }, [value, isFocused]);

    const parseInputValue = React.useCallback(
      (input: string): number | null => {
        if (!input || input.trim() === '') {
          return null;
        }

        const num = allowDecimal ? parseFloat(input) : parseInt(input, 10);

        if (isNaN(num)) {
          return null;
        }

        return num;
      },
      [allowDecimal]
    );

    const constrainValue = React.useCallback(
      (num: number | null): number | null => {
        if (num === null) return null;

        let constrained = num;

        if (min !== undefined && constrained < min) {
          constrained = min;
        }
        if (max !== undefined && constrained > max) {
          constrained = max;
        }

        if (allowDecimal) {
          constrained = Math.round(constrained * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
        }

        return constrained;
      },
      [min, max, allowDecimal, decimalPlaces]
    );

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (value !== null && value !== undefined && value !== 0) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue('');
      }
      // Select all text on focus for easy replacement
      e.target.select();
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const parsed = parseInputValue(displayValue);
      const constrained = constrainValue(parsed);
      onChange?.(constrained);
      if (constrained !== null) {
        setDisplayValue(constrained.toString());
      } else {
        setDisplayValue('');
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      const parsed = parseInputValue(inputValue);
      onChange?.(parsed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'Home', 'End'
      ];

      if (allowedKeys.includes(e.key)) {
        // Handle arrow up/down for increment/decrement
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleIncrement();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleDecrement();
          return;
        }
        return;
      }

      // Allow decimal point if decimals are enabled
      if (e.key === '.' && allowDecimal && !displayValue.includes('.')) {
        return;
      }

      // Allow minus for negative numbers if min allows it
      if (e.key === '-' && (min === undefined || min < 0)) {
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

    const handleIncrement = () => {
      if (disabled) return;
      const currentValue = value ?? 0;
      const newValue = constrainValue(currentValue + step);
      onChange?.(newValue);
    };

    const handleDecrement = () => {
      if (disabled) return;
      const currentValue = value ?? 0;
      const newValue = constrainValue(currentValue - step);
      onChange?.(newValue);
    };

    const inputElement = (
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || (allowDecimal ? '0.00' : '0')}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          prefix && 'pl-8',
          suffix && !showControls && 'pr-12',
          showControls && 'text-center',
          className
        )}
        {...props}
      />
    );

    if (!showControls && !prefix && !suffix) {
      return inputElement;
    }

    return (
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className={cn(
              "text-sm font-medium transition-colors",
              disabled ? "text-gray-300" : "text-gray-500"
            )}>
              {prefix}
            </span>
          </div>
        )}

        {showControls && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && (value ?? 0) <= min)}
            className={cn(
              'absolute left-0 inset-y-0 flex items-center justify-center w-10',
              'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'rounded-l-md border-r border-input transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
            tabIndex={-1}
          >
            <Minus className="h-4 w-4" />
          </button>
        )}

        <input
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || (allowDecimal ? '0.00' : '0')}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            showControls ? 'px-12 text-center' : 'px-3',
            prefix && !showControls && 'pl-8',
            suffix && !showControls && 'pr-12',
            className
          )}
          {...props}
        />

        {showControls && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && (value ?? 0) >= max)}
            className={cn(
              'absolute right-0 inset-y-0 flex items-center justify-center w-10',
              'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'rounded-r-md border-l border-input transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}

        {suffix && !showControls && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className={cn(
              "text-sm font-medium transition-colors",
              disabled ? "text-gray-300" : "text-gray-500"
            )}>
              {suffix}
            </span>
          </div>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
