import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-gray-800 dark:focus:ring-gray-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 dark:bg-gray-50 dark:text-gray-900",//hover:bg-gray-900/80 삭제
        secondary:
          "border-transparent bg-purple-500 text-gray-50 dark:bg-gray-800 dark:text-gray-50",
        destructive:
          "border-transparent bg-red-500 text-gray-50 dark:bg-red-900 dark:text-gray-50",
        outline: "text-gray-950 dark:text-gray-50",
        primary: 
          "border-transparent bg-gray-500 text-gray-50 dark:bg-red-900",
        warning: 
          "border-transparent bg-yellow-500 text-gray-50 dark:bg-red-900",
        success: 
          "border-transparent bg-green-500 text-gray-50 dark:bg-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
