import type { Household } from "../types"
import { HouseGone, isReplaced, type Backend, type Stored } from "./types"

/** Saves to this browser only. Used when no Firebase project is set up. */
const key = (id: string) => `fairshare:h:${id}`
const subs = new Map<string, Set<(d: Stored | null) => void>>()

function read(id: string): Stored | null {
  try {
    const raw = localStorage.getItem(key(id))
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

function write(id: string, d: Stored) {
  try {
    localStorage.setItem(key(id), JSON.stringify(d))
  } catch {
    /* storage full or blocked: subscribers still get the update for this visit */
  }
  subs.get(id)?.forEach((cb) => cb(d))
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key?.startsWith("fairshare:h:")) return
    const id = e.key.slice("fairshare:h:".length)
    const d = read(id)
    subs.get(id)?.forEach((cb) => cb(d))
  })
}

function readHouse(id: string): Household {
  const d = read(id)
  if (!d) throw new HouseGone("missing")
  if (isReplaced(d)) throw new HouseGone("replaced")
  return d
}

export const local: Backend = {
  kind: "local",
  subscribe(id, onDoc) {
    const set = subs.get(id) ?? new Set()
    subs.set(id, set)
    set.add(onDoc)
    queueMicrotask(() => set.has(onDoc) && onDoc(read(id)))
    return () => set.delete(onDoc)
  },
  async create(h) {
    write(h.id, h)
  },
  async transact(id, fn) {
    const h = readHouse(id)
    const next = fn(h)
    if (next !== h) write(id, next)
    return next
  },
  async move(oldId, fn) {
    const next = fn(readHouse(oldId))
    write(next.id, next)
    write(oldId, { replaced: true })
    return next
  },
}
