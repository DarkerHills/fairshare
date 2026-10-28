import { useEffect, useRef, useState, type ReactNode } from "react"
import { animate, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { EFFORT_NAMES } from "@/lib/engine"
import type { Effort } from "@/lib/types"

const EFFORT_STYLE: Record<Effort, { tile: string; pill: string; dot: string }> = {
  1: { tile: "bg-[#CFF6E9] dark:bg-mint/25", pill: "bg-[#CFF6E9] text-[#0B5E45] dark:bg-mint/20 dark:text-mint", dot: "bg-mint" },
  2: { tile: "bg-[#D6EDFF] dark:bg-sky/25", pill: "bg-[#D6EDFF] text-[#11548A] dark:bg-sky/20 dark:text-sky", dot: "bg-sky" },
  3: { tile: "bg-[#E4DCFF] dark:bg-grape/30", pill: "bg-[#E4DCFF] text-[#4A2FB8] dark:bg-grape/25 dark:text-[#C9BAFF]", dot: "bg-grape" },
}

export function ChoreTile({ emoji, effort, size = "md" }: { emoji: string; effort: Effort; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl",
        EFFORT_STYLE[effort].tile,
        size === "sm" && "size-10 text-xl",
        size === "md" && "size-13 text-2xl",
        size === "lg" && "size-16 rounded-3xl text-3xl",
      )}
    >
      {emoji}
    </span>
  )
}

export function EffortPill({ effort, className }: { effort: Effort; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap", EFFORT_STYLE[effort].pill, className)}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("size-1.5 rounded-full", i <= effort ? EFFORT_STYLE[effort].dot : "bg-current opacity-20")} />
        ))}
      </span>
      {EFFORT_NAMES[effort]} · {effort} pt{effort > 1 ? "s" : ""}
    </span>
  )
}

/** Numbers that count up to their new value instead of jumping. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce) {
      el.textContent = String(Math.round(value))
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = String(Math.round(v))),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, reduce])
  return (
    <span ref={ref} className={cn("tabular", className)}>
      {Math.round(prev.current)}
    </span>
  )
}

export function SectionTitle({ children, count, hint }: { children: ReactNode; count?: number; hint?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        {children}
        {count !== undefined && (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs font-black text-white dark:bg-white dark:text-ink">
            {count}
          </span>
        )}
      </h2>
      {hint && <span className="text-xs font-bold text-muted-foreground">{hint}</span>}
    </div>
  )
}

/** The round check that fills with mint and draws its tick. */
export function CheckBubble({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full border-[3px] transition-colors",
        checked ? "border-ink bg-mint dark:border-white" : "border-dashed border-ink/25 bg-card group-hover/chore:border-mint group-hover/chore:bg-mint/10 dark:border-white/25",
        className,
      )}
      animate={checked ? { scale: [1, 1.28, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <svg viewBox="0 0 24 24" className="size-6">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="#231942"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.3, delay: checked ? 0.08 : 0 }}
        />
      </svg>
    </motion.span>
  )
}

const BURST_COLORS = ["#FFC83D", "#FF6FAE", "#2ED3A1", "#5AB8FF", "#8B6CFF", "#FF9248"]

/** Bubbles pop out of the check and the points float up. */
export function PointsBurst({ points }: { points: number }) {
  const [bubbles] = useState(() =>
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.4
      const dist = 34 + Math.random() * 26
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, r: 5 + Math.random() * 7, c: BURST_COLORS[i % BURST_COLORS.length] }
    }),
  )
  return (
    <span className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border-2 border-ink/70"
          style={{ width: b.r * 2, height: b.r * 2, background: b.c, left: -b.r, top: -b.r }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
          animate={{ x: b.x, y: b.y, scale: [0.2, 1, 0.6], opacity: [1, 1, 0] }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="absolute -top-3 -left-6 font-heading text-2xl font-black text-ink [text-shadow:0_2px_0_#fff] dark:text-white dark:[text-shadow:0_2px_0_#231942]"
        initial={{ y: 0, opacity: 0, scale: 0.6 }}
        animate={{ y: -46, opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1] }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        +{points}
      </motion.span>
    </span>
  )
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto flex min-h-dvh w-full max-w-md flex-col px-4", className)}>{children}</div>
}
