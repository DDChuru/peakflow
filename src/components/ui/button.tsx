import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] hover:from-indigo-700 hover:to-indigo-800 focus-visible:ring-indigo-600",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] hover:from-red-600 hover:to-red-700 focus-visible:ring-red-600",
        outline:
          "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-300",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-300",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.01]",
        link:
          "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
        success:
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] hover:from-green-600 hover:to-green-700 focus-visible:ring-green-600",
        glass:
          "border border-white/20 bg-white/10 text-white/90 backdrop-blur hover:bg-white/20 hover:border-white/30 focus-visible:ring-white/40",
        muted:
          "bg-gray-800 text-white/90 hover:bg-gray-700 focus-visible:ring-gray-500",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, type, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        type={type}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
