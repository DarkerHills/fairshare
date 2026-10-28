import { useEffect, useMemo, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { format } from "date-fns"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, StickyNote01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BubbleBath } from "@/components/illustrations/Scenes"
import { ChoreCard } from "@/components/app/ChoreCard"
import { ChoreTile, SectionTitle } from "@/components/app/bits"
import { popFrom, vibrate } from "@/lib/celebrate"
import { friendlyDay, today } from "@/lib/dates"
import { choreById, completeOccurrence, forecast, undoComplete } from "@/lib/engine"
import { navigate } from "@/lib/router"
import { mutate } from "@/lib/store"
import type { Household, Member, Occurrence } from "@/lib/types"

const CHEERS = ["Nice one!", "Sparkling!", "Look at you go!", "Squeaky clean!", "Done and dusted!"]

/** Flow 3: what's mine today, and one tap to finish it. */
export function MineTab({ h, me }: { h: Household; me: Member }) {
  const t = today()
  const open = h.occurrences
    .filter((o) => !o.doneBy && o.assigneeId === me.id && o.due <= t)
    .sort((a, b) => a.due.localeCompare(b.due) || (choreById(h, b.choreId)?.effort ?? 0) - (choreById(h, a.choreId)?.effort ?? 0))
  const late = open.filter((o) => o.due < t)
  const todays = open.filter((o) => o.due === t)
  const doneToday = h.occurrences.filter((o) => o.doneBy === me.id && o.doneAt?.slice(0, 10) === t).length
  const total = open.length + doneToday
  const comingUp = useMemo(() => forecast(h, 7).filter((o) => o.assigneeId === me.id), [h, me.id])

  const bathRef = useRef<HTMLDivElement>(null)
  const prevOpen = useRef(open.length)
  useEffect(() => {
    if (prevOpen.current > 0 && open.length === 0) {
      setTimeout(() => popFrom(bathRef.current), 250)
      vibrate(30)
    }
    prevOpen.current = open.length
  }, [open.length])

  const complete = (o: Occurrence) => {
    const chore = choreById(h, o.choreId)
    let actId = ""
    mutate(h.id, (x) => {
      const [next, id] = completeOccurrence(x, o.id, me.id)
      actId = id
      return next
    })
    if (!chore || !actId) return
    toast.success(`${CHEERS[Math.floor(Math.random() * CHEERS.length)]} ${chore.name} is done.`, {
      description: `+${chore.effort} point${chore.effort > 1 ? "s" : ""} for you`,
      action: { label: "Undo", onClick: () => mutate(h.id, (x) => undoComplete(x, o.id)) },
    })
  }

  const nextMine = comingUp[0]

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10">
      <div className="px-1 lg:col-start-1">
        <p className="text-sm font-extrabold text-muted-foreground">{format(new Date(), "EEEE d MMMM")}</p>
        <h1 className="text-[2.1rem] leading-tight font-black lg:text-5xl">Hi {me.name}</h1>
      </div>

      {h.note && (
        <motion.div
          initial={{ rotate: -3, y: -6, opacity: 0 }}
          animate={{ rotate: -1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="relative rounded-3xl bg-[#FFF1C9] p-4 pl-12 text-[#5A4300] shadow-[0_3px_0_0_#E0A21A55] lg:col-start-2 lg:row-start-1 lg:self-end dark:bg-sponge/15 dark:text-sponge"
        >
          <HugeiconsIcon icon={StickyNote01Icon} strokeWidth={2.2} className="absolute top-4 left-4 size-5" />
          <p className="text-xs font-black tracking-wide uppercase opacity-70">House note</p>
          <p className="font-bold">{h.note}</p>
        </motion.div>
      )}

      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2">
      {total > 0 && (
        <div className="rounded-3xl bg-card p-4 ring-1 ring-foreground/[0.06]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-extrabold">
              {open.length === 0 ? "All done today" : `${doneToday} of ${total} done today`}
            </span>
            <span className="text-sm font-bold text-muted-foreground">{open.length} to go</span>
          </div>
          <Progress
            value={(doneToday / total) * 100}
            className="h-4 bg-muted [&>[data-slot=progress-indicator]]:rounded-full [&>[data-slot=progress-indicator]]:bg-mint [&>[data-slot=progress-indicator]]:duration-700"
          />
        </div>
      )}

      {late.length > 0 && (
        <section>
          <SectionTitle count={late.length} hint="Still yours, no rush">From earlier</SectionTitle>
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1">
            <AnimatePresence initial={false}>
              {late.map((o) => (
                <ChoreCard key={o.id} occurrence={o} chore={choreById(h, o.choreId)!} onDone={() => complete(o)} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {todays.length > 0 && (
        <section>
          <SectionTitle count={todays.length} hint="Tap to finish">Today</SectionTitle>
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1">
            <AnimatePresence initial={false}>
              {todays.map((o) => (
                <ChoreCard key={o.id} occurrence={o} chore={choreById(h, o.choreId)!} onDone={() => complete(o)} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <AnimatePresence>
        {open.length === 0 && (
          <motion.div
            ref={bathRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.2 }}
            className="flex flex-col items-center rounded-[2rem] bg-card px-6 pt-4 pb-6 text-center ring-1 ring-foreground/[0.06]"
          >
            <BubbleBath color={me.color} shape={me.shape} className="w-64 md:w-80" />
            <h2 className="mt-1 text-2xl font-black">
              {doneToday > 0 ? "You're all done for today" : "Nothing on your list today"}
            </h2>
            <p className="mt-1 font-semibold text-balance text-muted-foreground">
              {nextMine
                ? `Put your feet up. Next up: ${choreById(h, nextMine.choreId)?.name.toLowerCase()}, ${friendlyDay(nextMine.due).toLowerCase()}.`
                : "Put your feet up. Nothing else is headed your way this week."}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(`/h/${h.id}/all`)}>
              See what everyone else has
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.4} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {comingUp.length > 0 && (
        <section className="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-2">
          <SectionTitle hint="If the rota stays as it is">Coming up for you</SectionTitle>
          <ul className="flex flex-col gap-1 rounded-3xl bg-card/60 p-2 ring-1 ring-foreground/[0.05]">
            {comingUp.slice(0, 5).map((o) => {
              const c = choreById(h, o.choreId)!
              return (
                <li key={o.id} className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
                  <ChoreTile emoji={c.emoji} effort={c.effort} size="sm" />
                  <span className="flex-1 truncate font-bold">{c.name}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-extrabold">{friendlyDay(o.due)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
