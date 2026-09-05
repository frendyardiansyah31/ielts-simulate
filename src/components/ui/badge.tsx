import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  success: "bg-green-600 text-white",
  destructive: "bg-red-600 text-white",
  neutral: "bg-muted text-muted-foreground",
} as const

type BadgeVariant = keyof typeof badgeVariants

function Badge({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
