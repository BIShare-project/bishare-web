"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Parts } from "./primitives"
import { Progress as ProgressPrimitive } from "./primitives"

function Progress({ className, value, indicatorClassName, ...props }: Parts & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("relative h-1 w-full overflow-hidden rounded-none bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 bg-blau", indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value ?? 0))}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
