import type { ComponentProps } from "@/jsx";
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-none bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
