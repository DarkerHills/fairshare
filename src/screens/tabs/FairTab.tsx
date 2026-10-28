import { useState } from "react"
import { ActivityList, FairnessTubes } from "@/components/app/Fairness"
import { Segmented } from "@/components/app/Segmented"
import { monthLabel, monthOf, prevMonth, today } from "@/lib/dates"
import { fairness } from "@/lib/engine"
import type { Household } from "@/lib/types"
import { useIsDesktop } from "@/lib/useMediaQuery"

export function FairTab({ h }: { h: Household }) {
  const [view, setView] = useState<"balance" | "history">("balance")
  const thisMonth = monthOf(today())
  const lastMonth = prevMonth(thisMonth)
  const hasLast = h.createdAt.slice(0, 7) <= lastMonth || h.occurrences.some((o) => o.doneAt?.startsWith(lastMonth))
  const [month, setMonth] = useState(thisMonth)
  const { rows, total } = fairness(h, month)
  const fullShare = Math.max(0, ...rows.map((r) => r.share))
  const adjusted = rows.filter((r) => r.awayDays > 0)
  const isDesktop = useIsDesktop()

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <h1 className="text-[2.1rem] leading-tight font-black lg:text-5xl">Fairness</h1>
        <p className="font-semibold text-muted-foreground">Points by effort, not by count. Everyone resets on the 1st.</p>
      </div>

      {!isDesktop && (
        <Segmented
          label="Fairness view"
          value={view}
          onChange={setView}
          options={[
            { value: "balance", label: "Balance" },
            { value: "history", label: "History" },
          ]}
        />
      )}

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      {(isDesktop || view === "balance") && (
        <div className="flex flex-col gap-5 lg:sticky lg:top-8">
          <section className="rounded-[2rem] bg-card p-4 pt-5 ring-1 ring-foreground/[0.06] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-2 px-1">
              <h2 className="text-xl font-black">
                {monthLabel(month)}
                {month === thisMonth ? " so far" : ""}
              </h2>
              {hasLast && (
                <Segmented
                  label="Month"
                  value={month}
                  onChange={setMonth}
                  className="w-auto [&_button]:h-8! [&_button]:text-xs"
                  options={[
                    { value: lastMonth, label: monthLabel(lastMonth).slice(0, 3) },
                    { value: thisMonth, label: monthLabel(thisMonth).slice(0, 3) },
                  ]}
                />
              )}
            </div>
            <FairnessTubes key={month} rows={rows} />
          </section>

          <div className="rounded-3xl bg-muted/70 p-4 text-sm font-semibold text-muted-foreground">
            <p>
              <b className="text-foreground">{total} points</b> done {month === thisMonth ? "this month" : `in ${monthLabel(month)}`}, so a fair share is about{" "}
              <b className="text-foreground">{Math.round(fullShare)} each</b>. Light chores are 1 point, medium 2, heavy 3.
            </p>
            {adjusted.length > 0 && (
              <p className="mt-2">
                {adjusted.map((r) => r.member.name).join(" and ")} {adjusted.length > 1 ? "were" : "was"} away for part of the month, so the dotted line on{" "}
                {adjusted.length > 1 ? "their bottles" : "their bottle"} shows a smaller share.
              </p>
            )}
            <p className="mt-2">New chores go to whoever has the fewest points, so the bottles even out over time.</p>
          </div>
        </div>
      )}
      {(isDesktop || view === "history") && (
        <section>
          {isDesktop && <h2 className="mb-3 px-1 text-xl font-black">History</h2>}
          <ActivityList h={h} />
        </section>
      )}
      </div>
    </div>
  )
}
