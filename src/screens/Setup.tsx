import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Blob } from "@/components/illustrations/Blob"
import { HouseScene } from "@/components/illustrations/HouseScene"
import { ChoreDrawer } from "@/components/app/ChoreDrawer"
import { LoadingScreen } from "@/components/app/LoadingScreen"
import { ShareLink } from "@/components/app/ShareLink"
import { CheckBubble, ChoreTile, Screen } from "@/components/app/bits"
import { cn } from "@/lib/utils"
import { bigCelebration } from "@/lib/celebrate"
import { EFFORT_NAMES, MAX_MEMBERS, frequencyLabel, uid, type ChoreDraft } from "@/lib/engine"
import { navigate } from "@/lib/router"
import { COLORS, HOUSE_NAME_IDEAS, STARTER_CHORES, buildHousehold, type StarterChore } from "@/lib/starter"
import { createHousehold, setMe, shareUrl } from "@/lib/store"
import type { ColorKey, Household } from "@/lib/types"

const COLOR_KEYS = Object.keys(COLORS) as ColorKey[]
const STEP_TITLES = ["What's your house called?", "Who lives here?", "Pick your chores"]

const slide = {
  enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
}

export function Setup() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [name, setName] = useState("")
  const [people, setPeople] = useState(() => [{ id: uid(), name: "" }, { id: uid(), name: "" }])
  const [chores, setChores] = useState<StarterChore[]>(() => STARTER_CHORES.map((c) => ({ ...c })))
  const [editing, setEditing] = useState<number | "new" | null>(null)
  const [phase, setPhase] = useState<"form" | "loading" | "done">("form")
  const [house, setHouse] = useState<Household | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const saving = useRef<Promise<void>>(Promise.resolve())

  const filled = people.map((p) => p.name.trim()).filter(Boolean)
  const lower = filled.map((p) => p.toLowerCase())
  const dupes = lower.some((p, i) => lower.indexOf(p) !== i)
  const picked = chores.filter((c) => c.picked)
  const canNext = [name.trim().length > 0, filled.length >= 2 && !dupes, picked.length > 0][step]

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
  }

  const next = () => {
    if (!canNext) return
    if (step < 2) return go(step + 1)
    const h = buildHousehold(name, filled, picked)
    saving.current = createHousehold(h)
    setMe(h.id, h.members[0].id)
    setHouse(h)
    setPhase("loading")
  }

  const updatePerson = (i: number, v: string) => setPeople((p) => p.map((x, j) => (j === i ? { ...x, name: v } : x)))
  const addPerson = () => {
    if (people.length >= MAX_MEMBERS) return
    setPeople((p) => [...p, { id: uid(), name: "" }])
    setTimeout(() => inputs.current[people.length]?.focus(), 30)
  }

  if (phase === "done" && house) return <Success house={house} />

  return (
    <Screen className="pb-32 md:max-w-xl lg:max-w-6xl lg:px-10 lg:pb-16">
      <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-background/85 px-4 py-4 backdrop-blur lg:static lg:mx-0 lg:max-w-md lg:bg-transparent lg:px-0 lg:py-8 lg:backdrop-blur-none">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => (step === 0 ? navigate("/") : go(step - 1))}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.6} />
        </Button>
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-black tracking-wide text-muted-foreground uppercase">Step {step + 1} of 3</span>
          <Progress value={((step + 1) / 3) * 100} className="h-2.5 [&>[data-slot=progress-indicator]]:rounded-full [&>[data-slot=progress-indicator]]:duration-500" />
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
      {/* Desktop: the house stays in view on every step and fills up as you type */}
      <aside className="hidden lg:sticky lg:top-10 lg:block">
        <HouseScene
          sign={name.trim() || "Your house"}
          residents={filled.map((_, i) => ({ color: COLOR_KEYS[i % 6], shape: i % 6 }))}
          className="w-full"
        />
      </aside>
      <div>
      {step < 2 && (
        <div className="-mx-2 -mt-2 lg:hidden">
          <HouseScene
            sign={name.trim() || "Your house"}
            residents={filled.map((_, i) => ({ color: COLOR_KEYS[i % 6], shape: i % 6 }))}
            className="mx-auto w-full max-w-80"
          />
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={step}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        >
          <h1 className="text-[2rem] leading-tight font-black lg:text-5xl">{STEP_TITLES[step]}</h1>

          {step === 0 && (
            <div className="mt-4 flex flex-col gap-4">
              <Input
                autoFocus
                aria-label="House name"
                placeholder="e.g. Flat 4B"
                value={name}
                maxLength={28}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
                className="h-14 text-lg"
              />
              <div className="flex flex-wrap gap-2">
                {HOUSE_NAME_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    onClick={() => setName(idea)}
                    className="rounded-full bg-card px-3.5 py-1.5 text-sm font-extrabold ring-1 ring-foreground/10 transition hover:-translate-y-0.5 hover:ring-ink/40 active:scale-95"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-2">
              <p className="font-semibold text-muted-foreground">Add 2 to 6 people, starting with you.</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {people.map((p, i) => (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      className="flex items-center gap-2.5"
                    >
                      <span className="grid size-12 shrink-0 place-items-center">
                        <AnimatePresence mode="popLayout">
                          {p.name.trim() ? (
                            <motion.span key="b" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                              <Blob color={COLOR_KEYS[i % 6]} shape={i % 6} size={46} />
                            </motion.span>
                          ) : (
                            <motion.span key="e" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="size-10 rounded-full border-[3px] border-dashed border-ink/20 dark:border-white/25" />
                          )}
                        </AnimatePresence>
                      </span>
                      <Input
                        ref={(el) => {
                          inputs.current[i] = el
                        }}
                        autoFocus={i === 0}
                        aria-label={i === 0 ? "Your name" : `Housemate ${i}`}
                        placeholder={i === 0 ? "Your name" : "Housemate's name"}
                        value={p.name}
                        maxLength={20}
                        onChange={(e) => updatePerson(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return
                          e.preventDefault()
                          if (i < people.length - 1) inputs.current[i + 1]?.focus()
                          else if (p.name.trim() && people.length < MAX_MEMBERS) addPerson()
                          else next()
                        }}
                      />
                      {people.length > 2 && (
                        <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => setPeople((x) => x.filter((_, j) => j !== i))}>
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.4} />
                        </Button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {dupes && <p className="mt-3 px-1 text-sm font-bold text-[#A84A0C] dark:text-tangerine">Two people have the same name. Add an initial so everyone can find themselves.</p>}
              {people.length < MAX_MEMBERS && (
                <button
                  onClick={addPerson}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border-[3px] border-dashed border-ink/15 font-extrabold text-muted-foreground transition hover:border-ink/30 hover:text-foreground active:scale-[0.98] dark:border-white/20"
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2.6} className="size-5" />
                  Add another person
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mt-2">
              <p className="font-semibold text-muted-foreground">Tap to add or remove. You can change these any time.</p>
              <ul className="mt-4 flex flex-col gap-2">
                {chores.map((c, i) => (
                  <motion.li key={c.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="flex items-center gap-2">
                    <button
                      onClick={() => setChores((x) => x.map((y, j) => (j === i ? { ...y, picked: !y.picked } : y)))}
                      aria-pressed={c.picked}
                      className={cn(
                        "pressable flex flex-1 items-center gap-3 rounded-3xl p-2.5 pr-3 text-left ring-1 transition-colors",
                        c.picked ? "bg-card ring-ink/80 [--ledge:var(--ink)] dark:ring-white/70" : "bg-card/50 ring-foreground/[0.06] [--ledge:transparent]",
                      )}
                    >
                      <span className={cn("transition", !c.picked && "opacity-50 grayscale")}>
                        <ChoreTile emoji={c.emoji} effort={c.effort} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate font-extrabold", !c.picked && "text-muted-foreground")}>{c.name}</span>
                        <span className="block text-xs font-bold text-muted-foreground">
                          {EFFORT_NAMES[c.effort]} · {frequencyLabel(c.frequency)}
                        </span>
                      </span>
                      <CheckBubble checked={c.picked} className="size-8 border-2" />
                    </button>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => setEditing(i)}>
                      <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2.2} />
                    </Button>
                  </motion.li>
                ))}
              </ul>
              <button
                onClick={() => setEditing("new")}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border-[3px] border-dashed border-ink/15 font-extrabold text-muted-foreground transition hover:border-ink/30 hover:text-foreground active:scale-[0.98] dark:border-white/20"
              >
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2.6} className="size-5" />
                Add your own chore
              </button>
              <ChoreDrawer
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
                initial={typeof editing === "number" ? chores[editing] : undefined}
                onSave={(d: ChoreDraft) =>
                  setChores((x) =>
                    editing === "new"
                      ? [...x, { ...d, key: uid(), picked: true }]
                      : x.map((y, j) => (j === editing ? { ...y, ...d, picked: true } : y)),
                  )
                }
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md bg-gradient-to-t from-background via-background to-transparent px-4 pt-8 md:max-w-xl md:px-8 lg:static lg:mt-8 lg:max-w-none lg:bg-none lg:p-0">
        <Button size="xl" className="group/cta w-full" disabled={!canNext} onClick={next}>
          {step < 2 ? "Continue" : `Create household with ${picked.length} chore${picked.length === 1 ? "" : "s"}`}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.6} className="transition-transform group-hover/cta:translate-x-1" />
        </Button>
      </div>
      </div>
      </div>

      <AnimatePresence>
        {phase === "loading" && (
          <LoadingScreen
            color={house?.members[0].color}
            onDone={() =>
              // The spin cycle keeps going until the house is safely saved
              saving.current
                .then(() => setPhase("done"))
                .catch(() => {
                  setPhase("form")
                  toast.error("Couldn't create the house. Check your connection and try again.")
                })
            }
          />
        )}
      </AnimatePresence>
    </Screen>
  )
}

function Success({ house }: { house: Household }) {
  useEffect(() => {
    const t = setTimeout(bigCelebration, 250)
    return () => clearTimeout(t)
  }, [])

  return (
    <Screen className="items-center pt-6 pb-10 text-center md:max-w-xl md:justify-center lg:grid lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:text-left">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} className="w-full">
        <HouseScene sign={house.name} mood="joy" residents={house.members.map((m) => ({ color: m.color, shape: m.shape }))} className="mx-auto w-full max-w-sm lg:max-w-none" />
      </motion.div>
      <div className="flex w-full flex-1 flex-col items-center lg:items-start">
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 22 }}
        className="mt-2 text-[2.4rem] leading-tight font-black text-balance lg:text-6xl"
      >
        {house.name} is ready!
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-2 text-lg font-semibold text-muted-foreground text-balance">
        Send this link to your group chat. Housemates tap it, pick their name, and they're in.
      </motion.p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85 }} className="mt-6 w-full">
        <ShareLink url={shareUrl(house)} houseName={house.name} />
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="mt-auto w-full pt-8 md:mt-0 lg:pt-6">
        <Button size="xl" className="group/cta w-full" onClick={() => navigate(`/h/${house.id}`)}>
          Go to my chores
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.6} className="transition-transform group-hover/cta:translate-x-1" />
        </Button>
      </motion.div>
      </div>
    </Screen>
  )
}
