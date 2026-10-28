import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { HandHelpingIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Blob } from "@/components/illustrations/Blob"
import { BubbleBath } from "@/components/illustrations/Scenes"
import { PointsBurst, ChoreTile } from "@/components/app/bits"
import { Segmented } from "@/components/app/Segmented"
import { vibrate } from "@/lib/celebrate"
import { friendlyDay, lateLabel, today } from "@/lib/dates"
import { activeChores, choreById, completeOccurrence, forecast, frequencyLabel, memberById, undoComplete } from "@/lib/engine"
import { mutate } from "@/lib/store"
import { useIsDesktop } from "@/lib/useMediaQuery"
import { SectionTitle } from "@/components/app/bits"
import type { Household, Member, Occurrence } from "@/lib/types"

/** Everyone's chores: what's open right now, and whose turn each chore is next. Flow 4 lives here. */
export function AllTab({ h, me }: { h: Household; me: Member }) {
  const [view, setView] = useState<"open" | "next">("open")
  const t = today()
  const order = (id: string) => h.members.findIndex((m) => m.id === id)
  const open = h.occurrences
    .filter((o) => !o.doneBy && o.due <= t)
    .sort((a, b) => a.due.localeCompare(b.due) || order(a.assigneeId) - order(b.assigneeId))
  const future = useMemo(() => forecast(h, 35), [h])
  // Wide screens have room for both lists, so nothing hides behind a toggle
  const isDesktop = useIsDesktop()
  const showOpen = isDesktop || view === "open"
  const showNext = isDesktop || view === "next"

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <h1 className="text-[2.1rem] leading-tight font-black lg:text-5xl">Everyone's chores</h1>
        <p className="font-semibold text-muted-foreground">Covering for someone? Tap "I did this" and the points are yours.</p>
      </div>

      {!isDesktop && (
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: "open", label: <>Open now <span className="rounded-full bg-ink/10 px-1.5 text-xs dark:bg-white/15">{open.length}</span></> },
            { value: "next", label: "Who's next" },
          ]}
        />
      )}

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      {showOpen && (
        <section>
        {isDesktop && <SectionTitle count={open.length}>Open now</SectionTitle>}
        {open.length ? (
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1">
            <AnimatePresence initial={false}>
              {open.map((o) => (
                <OpenRow key={o.id} h={h} o={o} me={me} />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-[2rem] bg-card px-6 pt-4 pb-6 text-center ring-1 ring-foreground/[0.06]">
            <BubbleBath color="sky" shape={2} className="w-56" />
            <h2 className="text-2xl font-black">The whole house is done</h2>
            <p className="font-semibold text-muted-foreground">Nothing's waiting on anyone right now.</p>
          </div>
        )}
        </section>
      )}
      {showNext && (
        <section>
        {isDesktop && <SectionTitle hint="If the rota stays as it is">Who's next</SectionTitle>}
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1">
          {activeChores(h).map((c, i) => {
            const now = open.find((o) => o.choreId === c.id)
            const nxt = now ?? future.find((o) => o.choreId === c.id)
            const who = memberById(h, nxt?.assigneeId)
            return (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                className="flex items-center gap-3 rounded-3xl bg-card p-3 ring-1 ring-foreground/[0.06]"
              >
                <ChoreTile emoji={c.emoji} effort={c.effort} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold">{c.name}</span>
                  <span className="block text-xs font-bold text-muted-foreground">{frequencyLabel(c.frequency)}</span>
                </span>
                {who && nxt && (
                  <span className="flex shrink-0 flex-col items-center">
                    <Blob color={who.color} shape={who.shape} size={34} />
                    <span className="text-xs font-extrabold">{who.id === me.id ? "You" : who.name}</span>
                    <span className="text-[11px] font-bold text-muted-foreground">{now ? "Now" : friendlyDay(nxt.due)}</span>
                  </span>
                )}
              </motion.li>
            )
          })}
        </ul>
        </section>
      )}
      </div>
    </div>
  )
}

function OpenRow({ h, o, me }: { h: Household; o: Occurrence; me: Member }) {
  const [done, setDone] = useState(false)
  const chore = choreById(h, o.choreId)!
  const who = memberById(h, o.assigneeId)!
  const mine = who.id === me.id
  const late = lateLabel(o.due)

  const finish = () => {
    if (done) return
    setDone(true)
    vibrate()
    setTimeout(() => {
      let actId = ""
      mutate(h.id, (x) => {
        const [next, id] = completeOccurrence(x, o.id, me.id)
        actId = id
        return next
      })
      if (!actId) return
      toast.success(mine ? `${chore.name} is done.` : `Thanks for covering ${who.name}!`, {
        description: `${mine ? "" : `${chore.name}. `}+${chore.effort} point${chore.effort > 1 ? "s" : ""} for you`,
        action: { label: "Undo", onClick: () => mutate(h.id, (x) => undoComplete(x, o.id)) },
      })
    }, 650)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      className="flex items-center gap-3 rounded-3xl bg-card p-3 ring-1 ring-foreground/[0.06]"
    >
      <ChoreTile emoji={chore.emoji} effort={chore.effort} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 leading-tight font-extrabold">{chore.name}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs font-extrabold whitespace-nowrap">
            <Blob color={who.color} shape={who.shape} size={20} />
            {mine ? "Your turn" : `${who.name}'s turn`}
          </span>
          {late && (
            <span className="rounded-full bg-tangerine/15 px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap text-[#A84A0C] dark:text-tangerine">{late}</span>
          )}
        </span>
      </span>
      <span className="relative">
        <Button
          size="sm"
          variant={done ? "mint" : mine ? "default" : "outline"}
          onClick={finish}
          aria-label={mine ? `Mark ${chore.name} done` : `I did ${chore.name} for ${who.name}`}
          className="h-auto min-w-[5.5rem] flex-col gap-0 px-3 py-1.5"
        >
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={done || mine ? Tick02Icon : HandHelpingIcon} strokeWidth={2.4} />
            {done || mine ? "Done" : "I did this"}
          </span>
          <span className="text-[11px] font-bold opacity-70">+{chore.effort} pt{chore.effort > 1 ? "s" : ""}</span>
        </Button>
        <span className="absolute top-1/2 left-1/2">
          <AnimatePresence>{done && <PointsBurst points={chore.effort} />}</AnimatePresence>
        </span>
      </span>
    </motion.li>
  )
}
