import type { ComponentProps } from "@/jsx";
import { Command as CommandPrimitive } from "./command-list"
import { Search } from "@/ui/icons"
import { cn } from "@/lib/utils"
import type { Parts } from "./primitives"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/drive/ui/dialog"

function Command({ className, ...props }: Parts) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground", className)}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command palette",
  description = "Search",
  shouldFilter,
  children,
  ...props
}: ComponentProps<typeof Dialog> & { title?: string; description?: string; shouldFilter?: boolean }) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <Command shouldFilter={shouldFilter} className="[&_[data-command-group-heading]]:px-3 [&_[data-command-group-heading]]:py-1.5 [&_[data-command-group-heading]]:text-2xs [&_[data-command-group-heading]]:font-medium [&_[data-command-group-heading]]:text-muted-foreground">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({ className, ...props }: Parts) {
  return (
    <div data-slot="command-input-wrapper" className="flex h-11 items-center gap-2 border-b px-3">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("flex h-10 w-full bg-transparent py-3 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: Parts) {
  return <CommandPrimitive.List data-slot="command-list" className={cn("max-h-[360px] scroll-py-1 overflow-x-hidden overflow-y-auto py-1", className)} {...props} />
}

function CommandEmpty(props: Parts) {
  return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-xs text-muted-foreground" {...props} />
}

function CommandGroup({ className, ...props }: Parts) {
  return <CommandPrimitive.Group data-slot="command-group" className={cn("overflow-hidden text-foreground", className)} {...props} />
}

function CommandItem({ className, ...props }: Parts) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 px-3 py-2 text-xs outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-muted data-[selected=true]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="command-shortcut" className={cn("ml-auto text-2xs tracking-wide text-muted-foreground", className)} {...props} />
}

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut }
