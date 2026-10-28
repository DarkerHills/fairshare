import { shiftDay, today } from "./dates"
import { completeOccurrence, materialize, newHouseId, uid, type ChoreDraft } from "./engine"
import type { ColorKey, Household, Member } from "./types"

export const COLORS: Record<ColorKey, { fill: string; deep: string; soft: string }> = {
  sponge: { fill: "#FFC83D", deep: "#E0A21A", soft: "#FFF1C9" },
  bubblegum: { fill: "#FF6FAE", deep: "#E04D8F", soft: "#FFDCEC" },
  mint: { fill: "#2ED3A1", deep: "#1AA97F", soft: "#CFF6E9" },
  sky: { fill: "#5AB8FF", deep: "#2F93E0", soft: "#D6EDFF" },
  grape: { fill: "#8B6CFF", deep: "#6A4AE6", soft: "#E4DCFF" },
  tangerine: { fill: "#FF9248", deep: "#E5722A", soft: "#FFE3CF" },
}

export interface StarterChore extends ChoreDraft {
  key: string
  picked: boolean
}

export const STARTER_CHORES: StarterChore[] = [
  { key: "dishes", name: "Wash the dishes", emoji: "🍽️", effort: 2, frequency: { every: 1, unit: "day" }, picked: true },
  { key: "trash", name: "Take out the trash", emoji: "🗑️", effort: 1, frequency: { every: 2, unit: "day" }, picked: true },
  { key: "bathroom", name: "Clean the bathroom", emoji: "🛁", effort: 3, frequency: { every: 1, unit: "week" }, picked: true },
  { key: "kitchen", name: "Wipe down the kitchen", emoji: "🍳", effort: 2, frequency: { every: 3, unit: "day" }, picked: true },
  { key: "floors", name: "Sweep and mop the floors", emoji: "🧹", effort: 2, frequency: { every: 1, unit: "week" }, picked: true },
  { key: "laundry", name: "Wash the towels and sheets", emoji: "🧺", effort: 2, frequency: { every: 1, unit: "week" }, picked: true },
  { key: "plants", name: "Water the plants", emoji: "🪴", effort: 1, frequency: { every: 4, unit: "day" }, picked: false },
  { key: "groceries", name: "Do the grocery run", emoji: "🛒", effort: 2, frequency: { every: 1, unit: "week" }, picked: false },
  { key: "fridge", name: "Clean out the fridge", emoji: "🧊", effort: 3, frequency: { every: 1, unit: "month" }, picked: false },
  { key: "recycling", name: "Sort the recycling", emoji: "♻️", effort: 1, frequency: { every: 1, unit: "week" }, picked: false },
]

export const EMOJI_CHOICES = ["🍽️", "🗑️", "🛁", "🍳", "🧹", "🧺", "🪴", "🛒", "🧊", "♻️", "🚿", "🪟", "🛏️", "🐾", "📦", "🧽", "🚗", "🌿"]

export const HOUSE_NAME_IDEAS = ["Flat 4B", "The Nest", "Casa Chaos", "Maple Street", "The Pad"]

const COLOR_KEYS = Object.keys(COLORS) as ColorKey[]

export function buildHousehold(name: string, people: string[], chores: ChoreDraft[]): Household {
  const day = today()
  const members: Member[] = people.map((n, i) => ({
    id: uid(),
    name: n.trim(),
    color: COLOR_KEYS[i % COLOR_KEYS.length],
    shape: i % 6,
    joinedAt: day,
    away: [],
  }))
  const h: Household = {
    version: 1,
    id: newHouseId(),
    name: name.trim(),
    note: "",
    createdAt: new Date().toISOString(),
    members,
    chores: chores.map((c) => ({ id: uid(), ...c, startDate: day, createdAt: new Date().toISOString() })),
    occurrences: [],
    activity: [{ id: uid(), at: `${day}T00:00:00`, kind: "created", actorId: members[0]?.id }],
  }
  return materialize(h)
}

/** Tiny seeded RNG so the demo house looks the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/** A lived-in household with three weeks of history, an away trip and a couple of late chores. */
export function buildDemoHousehold(): Household {
  const t = today()
  // Three weeks back, so the weekly chores and the every-3-days ones all land on today
  const start = shiftDay(t, -21)
  const rand = rng(42)
  const picked = STARTER_CHORES.filter((c) => c.picked || c.key === "plants")
  let h = buildHousehold("Flat 4B", ["Ama", "Ben", "Chidi", "Dana"], picked)
  h = {
    ...h,
    note: "Dishes before bed, please. Bins go out Tuesday night.",
    members: h.members.map((m, i) => ({ ...m, joinedAt: start, away: i === 3 ? [{ from: shiftDay(t, -12), to: shiftDay(t, -8) }] : [] })),
    chores: h.chores.map((c) => ({ ...c, startDate: start })),
    occurrences: [],
    activity: [{ id: uid(), at: `${start}T09:00:00`, kind: "created", actorId: h.members[0].id }],
  }
  const ids = h.members.map((m) => m.id)
  for (let d = start; d < t; d = shiftDay(d, 1)) {
    h = materialize(h, d, 0)
    for (const o of h.occurrences.filter((x) => x.due === d)) {
      const roll = rand()
      // Leave a couple of recent ones undone so "overdue" has something to show
      if (d >= shiftDay(t, -2) && roll > 0.8) continue
      let by = o.assigneeId
      if (roll > 0.88) by = ids[Math.floor(rand() * ids.length)]
      const [next, actId] = completeOccurrence(h, o.id, by)
      const hour = 8 + Math.floor(rand() * 13)
      const stamp = `${d}T${String(hour).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00`
      h = {
        ...next,
        occurrences: next.occurrences.map((x) => (x.id === o.id ? { ...x, doneAt: stamp } : x)),
        activity: next.activity.map((a) => (a.id === actId ? { ...a, at: stamp } : a)),
      }
    }
  }
  h = { ...h, activity: [...h.activity].sort((a, b) => b.at.localeCompare(a.at)) }
  return materialize(h, t, 0)
}
