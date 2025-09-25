import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200",
        secondary:
          "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200",
        success:
          "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200",
        destructive:
          "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200",
        warning:
          "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200",
        outline:
          "border-2 border-gray-300 text-gray-700 bg-white",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean
  onRemove?: () => void
  pulse?: boolean
}

function Badge({
  className,
  variant,
  size,
  removable = false,
  onRemove,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <motion.div
      className={cn(badgeVariants({ variant, size }), className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      {...props}
    >
      {pulse && (
        <span className="absolute -left-1 -top-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
        </span>
      )}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-1.5 hover:text-current/70 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  )
}

export { Badge, badgeVariants }