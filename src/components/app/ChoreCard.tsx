import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { lateLabel } from "@/lib/dates"
import { vibrate } from "@/lib/celebrate"
import type { Chore, Occurrence } from "@/lib/types"
import { CheckBubble, ChoreTile, EffortPill, PointsBurst } from "./bits"

/**
 * One tap marks it done. The check fills, bubbles pop and the points float up,
 * then the card slides away. The whole moment takes under a second.
 */
export function ChoreCard({
  occurrence,
  chore,
  onDone,
}: {
  occurrence: Occurrence
  chore: Chore
  onDone: () => void
}) {
  const [done, setDone] = useState(false)
  const reduce = useReducedMotion()
  const late = lateLabel(occurrence.due)

  const tap = () => {
    if (done) return
    setDone(true)
    vibrate()
    setTimeout(onDone, reduce ? 120 : 720)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 90, rotate: 4, transition: { duration: 0.3, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="list-none"
    >
      <button
        type="button"
        onClick={tap}
        aria-label={`Mark ${chore.name} done, ${chore.effort} points`}
        className={cn(
          "group/chore pressable flex w-full items-center gap-3 rounded-3xl bg-card p-3 pr-4 text-left ring-1 ring-foreground/[0.06] outline-none [--ledge:var(--press)] focus-visible:ring-[3px] focus-visible:ring-ring/60",
          done && "bg-mint/15",
        )}
      >
        <ChoreTile emoji={chore.emoji} effort={chore.effort} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-base font-extrabold transition-all", done && "text-muted-foreground line-through decoration-mint decoration-[3px]")}>
            {chore.name}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <EffortPill effort={chore.effort} />
            {late && (
              <span className="rounded-full bg-tangerine/15 px-2.5 py-0.5 text-xs font-extrabold text-[#A84A0C] dark:text-tangerine">{late}</span>
            )}
          </span>
        </span>
        <span className="relative">
          <CheckBubble checked={done} />
          <span className="absolute top-1/2 left-1/2">
            <AnimatePresence>{done && !reduce && <PointsBurst points={chore.effort} />}</AnimatePresence>
          </span>
        </span>
      </button>
    </motion.li>
  )
}
