import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  icon?: React.ReactNode
  success?: boolean
  tone?: 'light' | 'dark'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, description, error, icon, success, tone = 'light', ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)

    const labelClass = cn(
      'block text-sm font-medium mb-1 transition-colors',
      tone === 'dark'
        ? error
          ? 'text-red-300'
          : focused
          ? 'text-white'
          : 'text-white/80'
        : error
        ? 'text-red-600'
        : focused
        ? 'text-indigo-600'
        : 'text-gray-700'
    )

    const descriptionClass = tone === 'dark' ? 'text-white/60' : 'text-gray-500'

    const baseInputClasses = cn(
      'flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50',
      tone === 'dark'
        ? error
          ? 'border-red-400/60 bg-red-950/40 text-white placeholder:text-red-200 focus:border-red-300 focus:ring-red-400/40'
          : success
          ? 'border-emerald-300/70 bg-emerald-950/30 text-white placeholder:text-emerald-200 focus:border-emerald-200 focus:ring-emerald-300/40'
          : 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-indigo-200 focus:ring-indigo-400/30'
        : error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
        : success
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
        : 'border-gray-200 bg-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20',
      icon && 'pl-10',
      className
    )

    return (
      <div className="w-full">
        {label && <label className={labelClass}>{label}</label>}
        {description && <p className={cn('text-xs mb-2', descriptionClass)}>{description}</p>}
        <div className="relative">
          {icon && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
              tone === 'dark'
                ? focused
                  ? 'text-white'
                  : 'text-white/50'
                : focused
                ? 'text-indigo-500'
                : 'text-gray-400'
            )}>
              {icon}
            </div>
          )}
          <input
            type={type}
            className={baseInputClasses}
            ref={ref}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {error && (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {success && !error && (
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </motion.div>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
