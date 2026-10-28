import { useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Blob } from "@/components/illustrations/Blob"
import { HouseScene } from "@/components/illustrations/HouseScene"
import { LogoMark } from "@/components/illustrations/Scenes"
import { LoadingScreen } from "@/components/app/LoadingScreen"
import { Screen } from "@/components/app/bits"
import { today } from "@/lib/dates"
import { navigate } from "@/lib/router"
import { buildDemoHousehold } from "@/lib/starter"
import { cloudEnabled, createHousehold, setMe, useHouseholdList } from "@/lib/store"

const HERO_RESIDENTS = [
  { color: "sponge", shape: 0 },
  { color: "bubblegum", shape: 1 },
  { color: "mint", shape: 2 },
  { color: "sky", shape: 3 },
] as const

const STEPS = [
  { emoji: "🏠", title: "Add your housemates and chores", body: "Give each chore an effort level: light, medium or heavy." },
  { emoji: "🔗", title: "Drop one link in the group chat", body: "Everyone taps it, picks their name, and they're in." },
  { emoji: "✅", title: "Tap a chore when it's done", body: "Turns rotate on their own, weighted by effort." },
]

const rise = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 24, delay: 0.08 * i },
})

export function Landing() {
  const houses = useHouseholdList()
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)
  const saving = useRef<Promise<void>>(Promise.resolve())

  const openDemo = () => {
    const h = buildDemoHousehold()
    saving.current = createHousehold(h)
    // Start as whoever has the most on their plate today, so the tap-to-finish moment is right there
    const t = today()
    const busiest = [...h.members].sort(
      (a, b) =>
        h.occurrences.filter((o) => !o.doneBy && o.assigneeId === b.id && o.due <= t).length -
        h.occurrences.filter((o) => !o.doneBy && o.assigneeId === a.id && o.due <= t).length,
    )[0]
    setMe(h.id, busiest.id)
    setLoadingDemo(h.id)
  }

  return (
    <Screen className="pb-10 md:max-w-3xl md:px-8 lg:max-w-6xl lg:px-10">
      <header className="flex items-center gap-2 py-5 md:py-7">
        <LogoMark size={34} />
        <span className="font-heading text-xl font-black">Fairshare</span>
      </header>

      {/* Desktop: words on the left, house on the right */}
      <section className="lg:grid lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="-mx-2 md:mx-auto md:max-w-lg lg:order-2 lg:mx-0 lg:w-full lg:max-w-none"
      >
        <HouseScene residents={[...HERO_RESIDENTS]} className="w-full" />
      </motion.div>

      <div className="md:text-center lg:order-1 lg:text-left">
      <motion.h1 {...rise(1)} className="mt-2 text-[2.5rem] leading-[1.02] font-black text-balance md:text-6xl lg:text-[4.25rem]">
        Share the chores fairly, <span className="text-muted-foreground/70 font-bold">without anyone being the boss.</span>
      </motion.h1>
      <motion.p {...rise(2)} className="mt-4 text-lg leading-snug font-semibold text-muted-foreground md:mx-auto md:max-w-xl md:text-xl lg:mx-0">
        One link for the whole house. Turns rotate on their own, and a meter shows who's carrying the load.
      </motion.p>

      <motion.div {...rise(3)} className="mt-7 flex flex-col gap-3 md:mx-auto md:grid md:max-w-xl md:grid-cols-2 lg:mx-0">
        <Button size="xl" onClick={() => navigate("/new")} className="group/cta">
          Start a household
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.6} className="transition-transform group-hover/cta:translate-x-1" />
        </Button>
        <Button size="xl" variant="outline" onClick={openDemo}>
          Try a demo house
        </Button>
        <p className="text-center text-sm font-bold text-muted-foreground md:col-span-2 lg:text-left">No app to install. No accounts.</p>
      </motion.div>
      </div>
      </section>

      {houses.length > 0 && (
        <motion.section {...rise(4)} className="mt-10">
          <h2 className="mb-3 px-1 text-lg font-extrabold">Your houses</h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {houses.map((x) => {
              return (
                <li key={x.id}>
                  <button
                    onClick={() => navigate(`/h/${x.id}`)}
                    className="pressable flex w-full items-center gap-3 rounded-3xl bg-card p-3 pr-4 text-left ring-1 ring-foreground/[0.06]"
                  >
                    <span className="flex -space-x-3">
                      {x.faces.map((f, i) => (
                        <Blob key={i} color={f.color} shape={f.shape} size={34} />
                      ))}
                    </span>
                    <span className="flex-1 truncate font-extrabold">{x.name}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.4} className="size-5 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>
        </motion.section>
      )}

      <section className="mt-12 lg:mt-6">
        <h2 className="mb-4 px-1 text-2xl font-black md:text-3xl">How it works</h2>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 }}
              className="flex items-start gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/[0.06] md:flex-col md:p-5"
            >
              <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-muted text-3xl">
                {s.emoji}
                <span className="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full bg-ink text-xs font-black text-white dark:bg-white dark:text-ink">
                  {i + 1}
                </span>
              </span>
              <span>
                <span className="block text-base font-extrabold">{s.title}</span>
                <span className="block text-sm font-semibold text-muted-foreground">{s.body}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-center text-xs font-semibold text-muted-foreground">
        Fairshare is a working name.{" "}
        {cloudEnabled ? "Your house stays in sync on everyone's phones." : "Your house is saved in this browser."}
      </p>

      <AnimatePresence>
        {loadingDemo && (
          <LoadingScreen
            duration={1800}
            lines={["Moving in the housemates…", "Dirtying a few dishes…", "Balancing the rota…"]}
            onDone={() =>
              saving.current
                .then(() => navigate(`/h/${loadingDemo}`))
                .catch(() => {
                  setLoadingDemo(null)
                  toast.error("Couldn't set up the demo house. Check your connection and try again.")
                })
            }
          />
        )}
      </AnimatePresence>
    </Screen>
  )
}
