import { motion } from "motion/react"
import { format } from "date-fns"
import { Blob } from "@/components/illustrations/Blob"
import { SprayBottle } from "@/components/illustrations/Scenes"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/starter"
import { friendlyDay, shortDay } from "@/lib/dates"
import { choreById, memberById, type FairRow } from "@/lib/engine"
import type { Activity, Household } from "@/lib/types"
import { ChoreTile, CountUp } from "./bits"

const TUBE_H = 200

function status(r: FairRow) {
  if (r.share === 0 && r.points === 0) return { text: "Just getting started", tone: "text-muted-foreground" }
  const diff = r.points - r.share
  if (Math.abs(diff) <= Math.max(1, r.share * 0.15)) return { text: "Right on track", tone: "text-[#0B5E45] dark:text-mint" }
  if (diff > 0) return { text: "Doing extra", tone: "text-[#11548A] dark:text-sky" }
  return { text: "Room to catch up", tone: "text-[#A84A0C] dark:text-tangerine" }
}

/**
 * Each housemate is a soap bottle that fills with their points.
 * The dashed line is the fair share. No ranking, no red: the bottles stay in house order.
 */
export function FairnessTubes({ rows }: { rows: FairRow[] }) {
  // The line shows a full share; anyone who was away gets their own smaller marker
  const fullShare = Math.max(0, ...rows.map((r) => r.share))
  const top = Math.max(6, ...rows.map((r) => r.points), fullShare) * 1.18
  const y = (v: number) => (v / top) * TUBE_H

  return (
    <div>
      <p className="mb-3 flex items-center justify-end gap-2 px-1 text-xs font-extrabold text-muted-foreground">
        <span className="w-6 border-t-[3px] border-dashed border-ink/45 dark:border-white/50" aria-hidden />
        Fair share: {Math.round(fullShare)} pts each
      </p>
      <div className="relative flex items-end justify-around gap-2 px-1" style={{ height: TUBE_H + 8 }}>
        {/* fair share line */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 z-20 border-t-[3px] border-dashed border-ink/45 dark:border-white/50"
          initial={{ bottom: 0, opacity: 0 }}
          animate={{ bottom: y(fullShare) + 4, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.3 }}
        />

        {rows.map((r, i) => {
          const c = COLORS[r.member.color]
          const adjusted = r.awayDays > 0 && fullShare - r.share > 0.5
          return (
            <div key={r.member.id} className="relative flex w-full max-w-16 flex-1 justify-center">
              <div
                className="relative w-full max-w-14 overflow-hidden rounded-t-[1.6rem] rounded-b-[1.4rem] border-[3px] border-ink bg-white/70 dark:border-white/80 dark:bg-white/10"
                style={{ height: TUBE_H }}
              >
                <motion.div
                  className="absolute inset-x-0 bottom-0"
                  style={{ background: c.fill }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(y(r.points), r.points ? 10 : 0) }}
                  transition={{ type: "spring", stiffness: 70, damping: 14, delay: 0.15 + i * 0.09 }}
                >
                  {/* wavy surface */}
                  <div className="absolute -top-2 left-0 h-3 w-[200%]" style={{ animation: `wave-slide ${2.2 + i * 0.3}s linear infinite` }}>
                    <svg viewBox="0 0 120 12" preserveAspectRatio="none" className="h-full w-full">
                      <path d="M0 6q7.5-6 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0V12H0Z" fill={c.fill} />
                    </svg>
                  </div>
                  {r.points > 0 &&
                    [0, 1].map((b) => (
                      <span
                        key={b}
                        className="absolute bottom-2 size-2.5 rounded-full border-2 border-white/80 animate-rise"
                        style={{ left: `${30 + b * 30}%`, animationDelay: `${b * 1.1 + i * 0.4}s` }}
                      />
                    ))}
                </motion.div>
                {/* glass shine */}
                <span className="absolute top-3 left-2 h-1/3 w-1.5 rounded-full bg-white/70" />
                {adjusted && (
                  <span
                    className="absolute inset-x-1 z-10 border-t-[3px] border-dotted border-ink/70 dark:border-white/80"
                    style={{ bottom: y(r.share) }}
                    title="Their share, adjusted for time away"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-around gap-2 px-1">
        {rows.map((r) => {
          const s = status(r)
          return (
            <div key={r.member.id} className="flex w-full max-w-20 flex-1 flex-col items-center text-center">
              <Blob color={r.member.color} shape={r.member.shape} size={36} />
              <span className="mt-1 w-full truncate text-sm font-extrabold">{r.member.name}</span>
              <span className="font-heading text-xl leading-none font-black">
                <CountUp value={r.points} />
                <span className="text-xs font-bold text-muted-foreground"> pts</span>
              </span>
              <span className={cn("mt-1 text-[11px] leading-tight font-extrabold", s.tone)}>{s.text}</span>
              {r.awayDays > 0 && (
                <span className="mt-1 rounded-full bg-sky/20 px-2 py-0.5 text-[10px] font-extrabold text-[#11548A] dark:text-sky">
                  Away {r.awayDays}d
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function describe(h: Household, a: Activity) {
  const who = (id?: string) => memberById(h, id)?.name ?? "Someone"
  const chore = a.choreId ? `“${choreById(h, a.choreId)?.name ?? "a chore"}”` : ""
  switch (a.kind) {
    case "done":
      return <><b>{who(a.actorId)}</b> did it</>
    case "cover":
      return <><b>{who(a.actorId)}</b> covered for {who(a.memberId)}</>
    case "chore-added":
      return <><b>{who(a.actorId)}</b> added {chore}</>
    case "chore-edited":
      return <><b>{who(a.actorId)}</b> edited {chore}: {a.detail}</>
    case "chore-removed":
      return <><b>{who(a.actorId)}</b> removed {chore}</>
    case "member-added":
      return a.actorId === a.memberId ? <><b>{who(a.memberId)}</b> joined the house</> : <><b>{who(a.actorId)}</b> added {who(a.memberId)}</>
    case "member-edited":
      return <><b>{who(a.actorId)}</b> renamed {who(a.memberId)} ({a.detail})</>
    case "member-removed":
      return <><b>{who(a.actorId)}</b> removed {who(a.memberId)}</>
    case "away": {
      if (a.detail === "back") return <><b>{who(a.memberId)}</b> is back home</>
      const [from, to] = (a.detail ?? "").split("|")
      return <><b>{who(a.memberId)}</b> is away {shortDay(from)} to {shortDay(to)}</>
    }
    case "link":
      return <><b>{who(a.actorId)}</b> made a new share link</>
    case "note":
      return <><b>{who(a.actorId)}</b> updated the house note</>
    case "created":
      return <><b>{who(a.actorId)}</b> started the house</>
  }
}

/** Who did what and when, last 30 days. Edits show up too, so nothing changes quietly. */
export function ActivityList({ h }: { h: Household }) {
  const cutoff = format(new Date(Date.now() - 30 * 864e5), "yyyy-MM-dd")
  const items = h.activity.filter((a) => a.at >= cutoff)
  if (!items.length) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <SprayBottle className="w-28" />
        <p className="mt-3 font-heading text-xl font-extrabold">Nothing here yet</p>
        <p className="text-sm text-muted-foreground">Finished chores will show up here.</p>
      </div>
    )
  }
  const groups = new Map<string, Activity[]>()
  for (const a of items) {
    const d = a.at.slice(0, 10)
    groups.set(d, [...(groups.get(d) ?? []), a])
  }
  return (
    <div className="flex flex-col gap-5">
      {[...groups].map(([day, list]) => (
        <section key={day}>
          <h3 className="mb-2 px-1 text-xs font-black tracking-wide text-muted-foreground uppercase">{friendlyDay(day)}</h3>
          <ul className="flex flex-col gap-1 rounded-3xl bg-card p-2 ring-1 ring-foreground/[0.06]">
            {list.map((a) => {
              const actor = memberById(h, a.actorId ?? a.memberId)
              const chore = a.choreId ? choreById(h, a.choreId) : undefined
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                  {chore && (a.kind === "done" || a.kind === "cover") ? (
                    <ChoreTile emoji={chore.emoji} effort={chore.effort} size="sm" />
                  ) : actor ? (
                    <span className="grid size-10 shrink-0 place-items-center">
                      <Blob color={actor.color} shape={actor.shape} size={34} />
                    </span>
                  ) : (
                    <span className="size-10 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 text-sm leading-snug [&_b]:font-extrabold">
                    {chore && (a.kind === "done" || a.kind === "cover") && (
                      <span className="block truncate font-extrabold">{chore.name}</span>
                    )}
                    <span className={cn(chore && (a.kind === "done" || a.kind === "cover") && "text-muted-foreground [&_b]:font-bold")}>
                      {describe(h, a)}
                    </span>
                  </span>
                  {a.points ? (
                    <span className="rounded-full bg-sponge/30 px-2 py-0.5 text-xs font-black tabular">+{a.points}</span>
                  ) : null}
                  <span className="w-10 text-right text-xs font-bold text-muted-foreground tabular">{a.at.slice(11, 16)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
