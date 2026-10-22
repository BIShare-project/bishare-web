"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

function Progress({ className, value, indicatorClassName, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("relative h-1 w-full overflow-hidden rounded-none bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 bg-blau transition-transform duration-300", indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value ?? 0))}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
