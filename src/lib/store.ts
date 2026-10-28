import { useCallback, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { materialize, newHouseId, prune, relinked, uid } from "./engine"
import { HouseGone, isReplaced, type Backend, type Stored } from "./backend/types"
import { local } from "./backend/local"
import type { ColorKey, Household } from "./types"

/**
 * Houses sync through Firebase when a project is configured (.env.local), otherwise they live in
 * this browser. Screens only talk to this file, so they work the same either way.
 */
const env = import.meta.env
export const cloudEnabled = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID)
const backend: Promise<Backend> = cloudEnabled ? import("./backend/firebase").then((m) => m.cloud) : Promise.resolve(local)

const K = {
  me: (id: string) => `fairshare:me:${id}`,
  index: "fairshare:index",
}

function get(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function set(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* blocked storage: the in-memory copy still works for this visit */
  }
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

// ---------- houses ----------

export type HouseState =
  | { status: "loading"; house?: undefined }
  | { status: "missing"; house?: undefined }
  | { status: "replaced"; house?: undefined }
  | { status: "error"; house?: undefined }
  | { status: "ready"; house: Household }

interface Pending {
  op: string
  fn: (h: Household) => Household
}

interface Entry {
  state: HouseState
  /** Latest copy from storage */
  base?: Household
  /** This device's edits that are still saving */
  pending: Pending[]
  refs: number
  unsub?: () => void
  rolledRev?: number
}

const LOADING: HouseState = { status: "loading" }
const entries = new Map<string, Entry>()

function entry(id: string) {
  let e = entries.get(id)
  if (!e) {
    e = { state: LOADING, pending: [], refs: 0 }
    entries.set(id, e)
  }
  return e
}

/** Brings the rota up to today and trims old history. Deterministic, so every phone agrees. */
const settle = (h: Household) => prune(materialize(h))

/** What the screen shows: the saved copy, rolled to today, plus this device's unsaved edits. */
function recompute(e: Entry) {
  if (!e.base) return
  const done = new Set(e.base.ops ?? [])
  let view = settle(e.base)
  for (const p of e.pending) if (!done.has(p.op)) view = settle(p.fn(view))
  e.state = { status: "ready", house: view }
  remember(view)
  emit()
}

function accept(e: Entry, h: Household) {
  if (!e.base || (h.rev ?? 0) >= (e.base.rev ?? 0)) e.base = h
}

/** The write itself: applied to the freshest saved copy, stamped with a new rev and the edit's id. */
function save(id: string, fn: (h: Household) => Household, op?: string) {
  return backend.then((b) =>
    b.transact(id, (h) => {
      const next = settle(fn(settle(h)))
      if (next === h) return h
      return { ...next, rev: (h.rev ?? 0) + 1, ops: op ? [op, ...(h.ops ?? [])].slice(0, 30) : h.ops }
    }),
  )
}

function onDoc(id: string, e: Entry, d: Stored | null) {
  if (!d) {
    e.state = { status: "missing" }
    e.base = undefined
    forget(id)
    return emit()
  }
  if (isReplaced(d)) {
    e.state = { status: "replaced" }
    e.base = undefined
    forget(id)
    return emit()
  }
  accept(e, d)
  recompute(e)
  // First visit on a new day: save the rolled-forward rota once, so everyone sees the same turns
  const rev = e.base!.rev ?? 0
  if (!e.pending.length && e.rolledRev !== rev && settle(e.base!) !== e.base) {
    e.rolledRev = rev
    save(id, (h) => h).catch(() => {})
  }
}

function start(id: string, e: Entry) {
  backend.then((b) => {
    if (!e.refs || e.unsub) return
    e.unsub = b.subscribe(
      id,
      (d) => onDoc(id, e, d),
      () => {
        if (e.base) return
        e.state = { status: "error" }
        emit()
      },
    )
  })
}

export function useHousehold(id: string): HouseState {
  const subscribe = useCallback(
    (l: () => void) => {
      const e = entry(id)
      listeners.add(l)
      if (++e.refs === 1) start(id, e)
      return () => {
        listeners.delete(l)
        if (--e.refs === 0) {
          e.unsub?.()
          e.unsub = undefined
        }
      }
    },
    [id],
  )
  return useSyncExternalStore(subscribe, () => entry(id).state)
}

/** Retry after an error: drop what we know and listen again. */
export function reconnect(id: string) {
  const e = entry(id)
  e.unsub?.()
  e.unsub = undefined
  e.state = LOADING
  emit()
  if (e.refs) start(id, e)
}

/**
 * Applies an edit on screen right away, then saves it.
 * `fn` may run more than once (once now, again on the saved copy), so it must not make random ids.
 */
export function mutate(id: string, fn: (h: Household) => Household) {
  const e = entries.get(id)
  if (!e?.base) return
  const p: Pending = { op: uid(12), fn }
  e.pending.push(p)
  recompute(e)
  save(id, fn, p.op)
    .then((saved) => {
      accept(e, saved)
    })
    .catch((err) => {
      toast.error(
        err instanceof HouseGone && err.reason === "replaced"
          ? "This house moved to a new link, so that change didn't save."
          : "That didn't save. Check your connection and try again.",
      )
    })
    .finally(() => {
      e.pending = e.pending.filter((x) => x !== p)
      recompute(e)
    })
}

export async function createHousehold(h: Household) {
  const e = entry(h.id)
  e.base = h
  recompute(e)
  const b = await backend
  await b.create(h)
}

/** A new share link: the house moves to a fresh id and the old link stops working. */
export async function moveHousehold(id: string, actorId: string) {
  const newId = newHouseId()
  const b = await backend
  const moved = await b.move(id, (h) => {
    const next = settle(relinked(settle(h), newId, actorId))
    return { ...next, rev: (h.rev ?? 0) + 1, ops: [] }
  })
  const me = getMe(id)
  if (me) setMe(newId, me)
  const e = entry(newId)
  accept(e, moved)
  recompute(e)
  return newId
}

export function shareUrl(h: Household) {
  return `${location.origin}${location.pathname}#/h/${h.id}`
}

// ---------- houses this device has opened ----------

export interface IndexEntry {
  id: string
  name: string
  faces: { color: ColorKey; shape: number }[]
}

let indexCache: IndexEntry[] | null = null

export function listHouseholds(): IndexEntry[] {
  if (indexCache) return indexCache
  try {
    indexCache = (JSON.parse(get(K.index) ?? "[]") as IndexEntry[]).filter((x) => x && x.id && x.faces)
  } catch {
    indexCache = []
  }
  return indexCache
}

function writeIndex(list: IndexEntry[]) {
  indexCache = list
  set(K.index, JSON.stringify(list))
}

function remember(h: Household) {
  const faces = h.members.filter((m) => !m.removedAt).slice(0, 4).map((m) => ({ color: m.color, shape: m.shape }))
  const list = listHouseholds()
  const old = list.find((x) => x.id === h.id)
  if (old && old.name === h.name && JSON.stringify(old.faces) === JSON.stringify(faces)) return
  writeIndex([{ id: h.id, name: h.name, faces }, ...list.filter((x) => x.id !== h.id)].slice(0, 8))
}

function forget(id: string) {
  const list = listHouseholds()
  if (list.some((x) => x.id === id)) writeIndex(list.filter((x) => x.id !== id))
}

export function useHouseholdList() {
  return useSyncExternalStore(subscribeAll, listHouseholds)
}

function subscribeAll(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

// ---------- who is using this device ----------

const meCache = new Map<string, string | null>()

export function getMe(id: string) {
  if (!meCache.has(id)) meCache.set(id, get(K.me(id)))
  return meCache.get(id) ?? null
}
export function setMe(id: string, memberId: string | null) {
  set(K.me(id), memberId)
  meCache.set(id, memberId)
  emit()
}
export function useMe(id: string) {
  return useSyncExternalStore(subscribeAll, () => getMe(id))
}

if (typeof window !== "undefined") {
  // Coming back to the tab on a new day rolls the rota forward
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return
    for (const [id, e] of entries) if (e.base && e.refs) onDoc(id, e, e.base)
  })
  window.addEventListener("storage", (e) => {
    if (e.key === K.index) indexCache = null
    if (e.key?.startsWith("fairshare:me:")) meCache.delete(e.key.slice("fairshare:me:".length))
    if (e.key === K.index || e.key?.startsWith("fairshare:me:")) emit()
  })
}
