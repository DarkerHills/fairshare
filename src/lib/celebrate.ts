import confetti from "canvas-confetti"

const PALETTE = ["#FFC83D", "#FF6FAE", "#2ED3A1", "#5AB8FF", "#8B6CFF", "#FF9248"]

/** A big two-sided burst of round "bubble" confetti for the moments that matter. */
export function bigCelebration() {
  const base = { colors: PALETTE, shapes: ["circle" as const], scalar: 1.3, disableForReducedMotion: true, zIndex: 60 }
  confetti({ ...base, particleCount: 90, angle: 60, spread: 70, startVelocity: 55, origin: { x: 0, y: 0.75 } })
  confetti({ ...base, particleCount: 90, angle: 120, spread: 70, startVelocity: 55, origin: { x: 1, y: 0.75 } })
  setTimeout(() => confetti({ ...base, particleCount: 60, spread: 120, startVelocity: 30, origin: { x: 0.5, y: 0.35 } }), 350)
}

/** A smaller pop from a point on screen, used when the last chore of the day is done. */
export function popFrom(el: Element | null) {
  const r = el?.getBoundingClientRect()
  const origin = r
    ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
    : { x: 0.5, y: 0.5 }
  confetti({
    colors: PALETTE,
    shapes: ["circle"],
    particleCount: 50,
    spread: 80,
    startVelocity: 28,
    scalar: 1,
    origin,
    disableForReducedMotion: true,
    zIndex: 60,
  })
}

export function vibrate(ms = 12) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}
