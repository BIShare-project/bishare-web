import { cn } from "@/lib/utils";

// Classes by variant: a component's base classes, plus those of the variants it is asked for.

type Config = { variants: Record<string, Record<string, string>>; defaultVariants?: Record<string, string> };
type Choice<C extends Config> = { [K in keyof C["variants"]]?: keyof C["variants"][K] | null };

export function variants<const C extends Config>(base: string, config: C) {
  return (choice: Choice<C> & { className?: string } = {}) =>
    cn(
      base,
      ...Object.entries(config.variants).map(([name, classes]) => classes[(choice[name as keyof C["variants"]] ?? config.defaultVariants?.[name] ?? "") as string]),
      choice.className,
    );
}

export type VariantProps<F extends (c: never) => string> = Omit<NonNullable<Parameters<F>[0]>, "className">;
