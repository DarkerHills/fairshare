import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { WashingMachine } from "@/components/illustrations/Scenes"
import type { ColorKey } from "@/lib/types"

const DEFAULT_LINES = ["Sorting the socks…", "Weighing up the chores…", "Shuffling turns fairly…", "Fluffing the cushions…"]

/** A short, skippable spin cycle while the house gets set up. */
export function LoadingScreen({
  lines = DEFAULT_LINES,
  duration = 2600,
  color,
  onDone,
}: {
  lines?: string[]
  duration?: number
  color?: ColorKey
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const step = duration / lines.length
  const fired = useRef(false)
  const finish = () => {
    if (fired.current) return
    fired.current = true
    onDone()
  }
  const finishRef = useRef(finish)
  finishRef.current = finish

  useEffect(() => {
    const tick = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), step)
    const end = setTimeout(() => finishRef.current(), duration)
    return () => {
      clearInterval(tick)
      clearTimeout(end)
    }
  }, [duration, lines.length, step])

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      onClick={finish}
      className="bg-dots fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background px-6"
    >
      <motion.div initial={{ y: 30, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 16 }}>
        <WashingMachine className="w-52" color={color} />
      </motion.div>
      <div className="h-9 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="font-heading text-2xl font-extrabold"
          >
            {lines[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="h-3 w-48 overflow-hidden rounded-full bg-muted ring-2 ring-ink/10">
        <motion.div
          className="h-full rounded-full bg-[repeating-linear-gradient(-45deg,var(--sponge)_0_10px,var(--sponge-deep)_10px_20px)]"
          initial={{ width: "6%" }}
          animate={{ width: "100%" }}
          transition={{ duration: duration / 1000, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </motion.div>
  )
}

const BOOT_LINES = ["Knocking on the door…", "Finding the spare key…", "Checking the rota…"]

/** While a house is on its way from the server. Fades in late, so quick loads never flash it. */
export function BootScreen() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % BOOT_LINES.length), 1100)
    return () => clearInterval(t)
  }, [])
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-dots fixed inset-0 z-40 flex animate-in flex-col items-center justify-center gap-6 bg-background px-6 delay-300 duration-500 fill-mode-both fade-in-0"
    >
      <WashingMachine className="w-44" />
      <div className="h-9 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="font-heading text-2xl font-extrabold"
          >
            {BOOT_LINES[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
