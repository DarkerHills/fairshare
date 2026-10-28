import { useId, type ReactNode } from "react"
import { motion } from "motion/react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

/** A pill toggle where the highlight slides between options. Built on shadcn's ToggleGroup. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
  label: string
}) {
  const id = useId()
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      spacing={0}
      className={cn("w-full rounded-full bg-muted p-1 ring-1 ring-foreground/[0.05]", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="relative h-10 flex-1 rounded-full! px-3! font-extrabold text-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-foreground"
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-full bg-card shadow-[0_2px_0_0_var(--press)] ring-1 ring-foreground/[0.06]"
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
