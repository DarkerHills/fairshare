import { useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { BalanceScaleIcon, CheckListIcon, Home09Icon, House03Icon, UserAdd01Icon, UserSwitchIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Blob } from "@/components/illustrations/Blob"
import { HouseScene } from "@/components/illustrations/HouseScene"
import { LogoMark, LostKey } from "@/components/illustrations/Scenes"
import { BootScreen } from "@/components/app/LoadingScreen"
import { MemberDrawer } from "@/components/app/MemberDrawer"
import { CountUp, Screen } from "@/components/app/bits"
import { cn } from "@/lib/utils"
import { vibrate } from "@/lib/celebrate"
import { monthOf, today } from "@/lib/dates"
import { MAX_MEMBERS, activeMembers, addMember, pointsFor, uid } from "@/lib/engine"
import { navigate } from "@/lib/router"
import { cloudEnabled, mutate, reconnect, setMe, useHousehold, useMe } from "@/lib/store"
import type { Household as House, Member } from "@/lib/types"
import { MineTab } from "./tabs/MineTab"
import { AllTab } from "./tabs/AllTab"
import { FairTab } from "./tabs/FairTab"
import { HouseTab } from "./tabs/HouseTab"

const TABS = [
  { key: "mine", label: "My chores", icon: Home09Icon },
  { key: "all", label: "Everyone", icon: CheckListIcon },
  { key: "fair", label: "Fairness", icon: BalanceScaleIcon },
  { key: "house", label: "House", icon: House03Icon },
] as const
type TabKey = (typeof TABS)[number]["key"]

export function HouseholdRoute({ id, tab }: { id: string; tab?: string }) {
  const state = useHousehold(id)
  const meId = useMe(id)

  // Links from the first version carried a ?k= token; the id alone is the key now
  useEffect(() => {
    if (location.hash.includes("?")) navigate(`/h/${id}${tab ? `/${tab}` : ""}`, { replace: true })
  }, [id, tab])

  if (state.status === "loading") return <BootScreen />
  if (state.status === "error") return <Offline id={id} />
  if (state.status === "missing") return <Missing />
  if (state.status === "replaced") return <Replaced />
  const h = state.house
  const me = activeMembers(h).find((m) => m.id === meId)
  if (!me) return <Join h={h} />
  const current = (TABS.find((t) => t.key === tab)?.key ?? "mine") as TabKey
  return <Shell h={h} me={me} tab={current} />
}

function Shell({ h, me, tab }: { h: House; me: Member; tab: TabKey }) {
  const t = today()
  const myPoints = pointsFor(h, me.id, monthOf(t))
  const myOpen = h.occurrences.filter((o) => !o.doneBy && o.assigneeId === me.id && o.due <= t).length
  const go = (key: TabKey) => navigate(`/h/${h.id}/${key}`)

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop: a sidebar replaces the bottom bar */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 border-r border-foreground/[0.06] bg-card/60 p-5 backdrop-blur-md lg:flex">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 rounded-full px-1 text-left transition active:scale-95" aria-label="Fairshare home">
          <LogoMark size={34} />
          <span className="font-heading text-xl font-black">Fairshare</span>
        </button>
        <div className="rounded-3xl bg-muted/70 px-4 py-3">
          <p className="text-xs font-black tracking-wide text-muted-foreground uppercase">House</p>
          <p className="truncate font-heading text-lg font-black">{h.name}</p>
        </div>
        <nav className="flex flex-col gap-1.5">
          {TABS.map((tb) => {
            const active = tb.key === tab
            return (
              <button
                key={tb.key}
                onClick={() => go(tb.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-13 items-center gap-3 rounded-full px-4 text-base font-extrabold transition-colors",
                  active ? "text-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span layoutId="nav-pill-side" className="absolute inset-0 rounded-full bg-sponge shadow-[0_3px_0_0_var(--sponge-deep)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
                )}
                <HugeiconsIcon icon={tb.icon} strokeWidth={active ? 2.4 : 2} className="relative size-[22px]" />
                <span className="relative flex-1 text-left">{tb.label}</span>
                {tb.key === "mine" && myOpen > 0 && (
                  <span className="relative grid h-6 min-w-6 place-items-center rounded-full bg-bubblegum px-1.5 text-xs font-black text-white">{myOpen}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto">
          <MeMenu h={h} me={me} align="start">
            <button className="flex w-full items-center gap-3 rounded-3xl bg-card p-3 text-left ring-1 ring-foreground/[0.06] transition hover:ring-ink/30">
              <Blob color={me.color} shape={me.shape} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold">{me.name}</span>
                <span className="block text-sm font-bold text-muted-foreground">
                  <CountUp value={myPoints} /> points this month
                </span>
              </span>
            </button>
          </MeMenu>
        </div>
      </aside>

      <div className="mx-auto w-full max-w-md px-4 pb-28 md:max-w-3xl md:px-8 lg:max-w-6xl lg:px-10 lg:pt-8 lg:pb-12">
        <header className="sticky top-0 z-20 -mx-4 flex items-center gap-2.5 bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8 lg:hidden">
          <button onClick={() => navigate("/")} aria-label="Fairshare home" className="transition active:scale-90">
            <LogoMark size={30} />
          </button>
          <span className="min-w-0 flex-1 truncate font-heading text-lg font-black">{h.name}</span>
          <span className="flex items-center gap-1 rounded-full bg-sponge/30 px-3 py-1 text-sm font-black" aria-label={`${myPoints} points this month`}>
            <CountUp value={myPoints} /> <span className="font-bold opacity-70">pts</span>
          </span>
          <MeMenu h={h} me={me} align="end">
            <button aria-label="You" className="rounded-full transition hover:rotate-6 active:scale-90">
              <Blob color={me.color} shape={me.shape} size={40} />
            </button>
          </MeMenu>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="pt-2 lg:pt-0"
          >
            {tab === "mine" && <MineTab h={h} me={me} />}
            {tab === "all" && <AllTab h={h} me={me} />}
            {tab === "fair" && <FairTab h={h} />}
            {tab === "house" && <HouseTab h={h} me={me} />}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Phones and tablets: bottom bar within thumb reach */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-3 pt-2 lg:hidden">
        <div className="flex rounded-full bg-card/90 p-1.5 shadow-[0_8px_30px_-6px_rgb(35_25_66/0.25)] ring-1 ring-foreground/[0.07] backdrop-blur-md">
          {TABS.map((tb) => {
            const active = tb.key === tab
            return (
              <button
                key={tb.key}
                onClick={() => go(tb.key)}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-extrabold transition-colors", active ? "text-ink" : "text-muted-foreground hover:text-foreground")}
              >
                {active && (
                  <motion.span layoutId="nav-pill-bottom" className="absolute inset-0 rounded-full bg-sponge" transition={{ type: "spring", stiffness: 500, damping: 34 }} />
                )}
                <motion.span className="relative" animate={active ? { y: [0, -4, 0], rotate: [0, -8, 0] } : {}} transition={{ duration: 0.35 }}>
                  <HugeiconsIcon icon={tb.icon} strokeWidth={active ? 2.4 : 2} className="size-[22px]" />
                  {tb.key === "mine" && myOpen > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-bubblegum px-1 text-[10px] font-black text-white ring-2 ring-card">
                      {myOpen}
                    </span>
                  )}
                </motion.span>
                <span className="relative">{tb.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function MeMenu({ h, me, align, children }: { h: House; me: Member; align: "start" | "end"; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60 rounded-3xl p-2">
        <DropdownMenuLabel className="font-extrabold">You're {me.name} on this device</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-2xl py-2 font-bold" onSelect={() => setMe(h.id, null)}>
          <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2.2} />
          Switch person
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-2xl py-2 font-bold" onSelect={() => navigate("/")}>
          <HugeiconsIcon icon={House03Icon} strokeWidth={2.2} />
          All my houses
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// On tablets and up everyone fits on one row
const WIDE_COLS: Record<number, string> = { 2: "", 3: "", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" }

/** Flow 2: tap your name and you're in. */
function Join({ h }: { h: House }) {
  const members = activeMembers(h)
  const [picked, setPicked] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const pick = (id: string) => {
    if (picked) return
    setPicked(id)
    vibrate(20)
    setTimeout(() => setMe(h.id, id), 650)
  }

  return (
    <Screen className="pt-4 pb-10 md:max-w-2xl md:pt-10">
      <HouseScene sign={h.name} residents={members.map((m) => ({ color: m.color, shape: m.shape }))} className="mx-auto w-full max-w-72 md:max-w-80" />
      <h1 className="mt-1 text-center text-[2.2rem] leading-tight font-black">Who's this?</h1>
      <p className="mt-1 text-center font-semibold text-muted-foreground">Tap your name. This device will remember you.</p>

      <ul className={cn("mt-6 grid gap-3 md:gap-4", members.length === 3 || members.length > 4 ? "grid-cols-3" : "grid-cols-2", WIDE_COLS[members.length])}>
        {members.map((m, i) => {
          const isPicked = picked === m.id
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: picked && !isPicked ? 0.35 : 1, y: 0, scale: isPicked ? 1.06 : picked ? 0.94 : 1 }}
              transition={{ type: "spring", stiffness: 340, damping: 20, delay: picked ? 0 : 0.06 * i }}
            >
              <button
                onClick={() => pick(m.id)}
                className={cn(
                  "pressable flex w-full flex-col items-center gap-2 rounded-[2rem] bg-card px-2 pt-4 pb-3 ring-1 ring-foreground/[0.06] transition-colors hover:ring-ink/30",
                  isPicked && "bg-sponge/30 ring-2 ring-ink",
                )}
              >
                <motion.span animate={isPicked ? { y: [0, -18, 0], rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.55 }}>
                  <Blob color={m.color} shape={m.shape} mood={isPicked ? "joy" : "happy"} size={members.length === 3 || members.length > 4 ? 64 : 80} />
                </motion.span>
                <span className="w-full truncate text-lg font-black">{isPicked ? `Hi ${m.name}!` : m.name}</span>
              </button>
            </motion.li>
          )
        })}
      </ul>

      {members.length < MAX_MEMBERS && (
        <Button variant="ghost" className="mx-auto mt-6" onClick={() => setAdding(true)}>
          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2.2} />
          I'm not on the list
        </Button>
      )}
      <MemberDrawer
        open={adding}
        onOpenChange={setAdding}
        onSave={(name) => {
          const id = uid()
          mutate(h.id, (x) => addMember(x, name, id, id)[0])
          setMe(h.id, id)
        }}
      />
    </Screen>
  )
}

function Missing() {
  return (
    <Screen className="items-center justify-center py-10 text-center">
      <LostKey className="w-48" />
      <h1 className="mt-4 text-3xl font-black">{cloudEnabled ? "We can't find this house" : "We can't find this house here"}</h1>
      <p className="mt-2 font-semibold text-balance text-muted-foreground">
        {cloudEnabled
          ? "The link might be missing a few letters. Ask a housemate to send it again, or start your own house."
          : "For now, each house is saved in the browser that created it, so this link only opens there. Start your own, or try a demo house."}
      </p>
      <Button size="lg" className="mt-6" onClick={() => navigate("/new")}>
        Start a household
      </Button>
      <Button variant="ghost" className="mt-2" onClick={() => navigate("/")}>
        Go to the home page
      </Button>
    </Screen>
  )
}

function Offline({ id }: { id: string }) {
  return (
    <Screen className="items-center justify-center py-10 text-center">
      <LostKey className="w-48" color="sky" />
      <h1 className="mt-4 text-3xl font-black">We couldn't open this house</h1>
      <p className="mt-2 font-semibold text-balance text-muted-foreground">Check your internet connection, then try again.</p>
      <Button size="lg" className="mt-6" onClick={() => reconnect(id)}>
        Try again
      </Button>
    </Screen>
  )
}

function Replaced() {
  return (
    <Screen className="items-center justify-center py-10 text-center">
      <LostKey className="w-48" color="tangerine" />
      <h1 className="mt-4 text-3xl font-black">This link has been replaced</h1>
      <p className="mt-2 font-semibold text-balance text-muted-foreground">
        Someone in the house made a new link. Ask a housemate to send you the new one.
      </p>
      <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
        Go to the home page
      </Button>
    </Screen>
  )
}
