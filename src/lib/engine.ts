import { format } from "date-fns"
import { daysBetween, daysInMonth, inRange, monthOf, shiftDay, shiftMonth, today } from "./dates"
import type { Activity, AwayRange, Chore, Effort, Household, Member, Occurrence } from "./types"

export const uid = (len = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("")

export const nowStamp = () => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")

export const activeMembers = (h: Household) => h.members.filter((m) => !m.removedAt)
export const activeChores = (h: Household) => h.chores.filter((c) => !c.removedAt)
export const choreById = (h: Household, id: string) => h.chores.find((c) => c.id === id)
export const memberById = (h: Household, id?: string) => h.members.find((m) => m.id === id)

export const isAway = (m: Member, day: string) => m.away.some((r) => inRange(day, r))

export function currentAway(m: Member, day = today()): AwayRange | undefined {
  return m.away.find((r) => r.to >= day)
}

/** Days of the month (up to `upto`) the member was away. */
export function awayDaysIn(m: Member, month: string, upto: string) {
  const start = `${month}-01`
  const end = upto < start ? start : monthOf(upto) === month ? upto : `${month}-${String(daysInMonth(month)).padStart(2, "0")}`
  let n = 0
  for (let d = start; d <= end; d = shiftDay(d, 1)) if (isAway(m, d)) n++
  return n
}

/** Share of the month so far that the member was around for (1 = never away). */
function presence(m: Member, month: string, upto: string) {
  const elapsed = monthOf(upto) === month ? Number(upto.slice(8, 10)) : daysInMonth(month)
  return Math.max(0, (elapsed - awayDaysIn(m, month, upto)) / elapsed)
}

export function pointsFor(h: Household, memberId: string, month: string) {
  const m = memberById(h, memberId)
  let pts = m?.baseline?.month === month ? m.baseline.points : 0
  for (const o of h.occurrences) {
    if (o.doneBy === memberId && o.doneAt && monthOf(o.doneAt) === month) pts += o.points ?? 0
  }
  return pts
}

export function dueDates(chore: Chore, from: string, to: string): string[] {
  const out: string[] = []
  const { every, unit } = chore.frequency
  if (unit === "month") {
    for (let i = 0, d = chore.startDate; d <= to; i++, d = shiftMonth(chore.startDate, i * every)) {
      if (d >= from) out.push(d)
    }
    return out
  }
  const step = unit === "week" ? every * 7 : every
  const gap = daysBetween(chore.startDate, from)
  let k = gap > 0 ? Math.ceil(gap / step) : 0
  for (let d = shiftDay(chore.startDate, k * step); d <= to; k++, d = shiftDay(chore.startDate, k * step)) {
    out.push(d)
  }
  return out
}

/**
 * Assignment logic from the PRD:
 * 1. eligible = active, joined, not away that day
 * 2. lowest effort points this month (scaled by days present, so being away doesn't bury you)
 * 3. tie-break: did this chore least recently
 * 4. tie-break: fixed member order
 * Effort already handed out for the same day counts too, so a fresh batch of chores spreads out.
 */
export function pickAssignee(
  h: Household,
  chore: Chore,
  day: string,
  sameDayLoad: Map<string, number>,
  exclude?: Set<string>,
): string | undefined {
  const month = monthOf(day)
  const all = activeMembers(h).filter((m) => !exclude?.has(m.id))
  let pool = all.filter((m) => m.joinedAt <= day && !isAway(m, day))
  if (!pool.length) pool = all
  if (!pool.length) return undefined

  const lastDid = (id: string) =>
    h.occurrences.reduce((acc, o) => (o.choreId === chore.id && o.doneBy === id && o.due > acc ? o.due : acc), "")
  const score = (m: Member) =>
    Math.round(((pointsFor(h, m.id, month) + (sameDayLoad.get(m.id) ?? 0)) / Math.max(presence(m, month, day), 0.1)) * 1000)
  const order = (m: Member) => h.members.indexOf(m)

  return [...pool]
    .map((m) => ({ m, s: score(m), l: lastDid(m.id), o: order(m) }))
    .sort((a, b) => a.s - b.s || a.l.localeCompare(b.l) || a.o - b.o)[0].m.id
}

function loadFor(h: Household, day: string) {
  const load = new Map<string, number>()
  for (const o of h.occurrences) {
    if (o.due === day && !o.doneBy) {
      load.set(o.assigneeId, (load.get(o.assigneeId) ?? 0) + (choreById(h, o.choreId)?.effort ?? 0))
    }
  }
  return load
}

/** Creates any chore occurrences that have come due, and assigns them. */
export function materialize(h: Household, upto = today(), backfill = 14): Household {
  const have = new Set(h.occurrences.map((o) => `${o.choreId}|${o.due}`))
  const from = shiftDay(upto, -backfill)
  const fresh: { chore: Chore; day: string }[] = []
  for (const chore of activeChores(h)) {
    const start = chore.startDate > from ? chore.startDate : from
    for (const day of dueDates(chore, start, upto)) {
      if (!have.has(`${chore.id}|${day}`)) fresh.push({ chore, day })
    }
  }
  if (!fresh.length) return h

  fresh.sort((a, b) => a.day.localeCompare(b.day) || b.chore.effort - a.chore.effort)
  let next: Household = { ...h, occurrences: [...h.occurrences] }
  let loadDay = ""
  let load = new Map<string, number>()
  for (const { chore, day } of fresh) {
    if (day !== loadDay) {
      loadDay = day
      load = loadFor(next, day)
    }
    const assigneeId = pickAssignee(next, chore, day, load)
    if (!assigneeId) continue
    load.set(assigneeId, (load.get(assigneeId) ?? 0) + chore.effort)
    // Same chore + same day = same id, so two phones rolling the rota forward can't double up
    next.occurrences.push({ id: `${chore.id}-${day}`, choreId: chore.id, due: day, assigneeId })
  }
  return next
}

/**
 * Looks ahead by simulating the rotation, assuming everyone does what's on their plate.
 * Used for "whose turn is next" and "coming up".
 */
export function forecast(h: Household, days = 35, start = today()): Occurrence[] {
  const sim = (o: Occurrence, effort: number): Occurrence =>
    o.doneBy ? o : { ...o, doneBy: o.assigneeId, doneAt: `${o.due > start ? o.due : start}T20:00:00`, points: effort }
  let state: Household = {
    ...h,
    occurrences: h.occurrences.map((o) => sim(o, choreById(h, o.choreId)?.effort ?? 0)),
  }
  const out: Occurrence[] = []
  for (let i = 1; i <= days; i++) {
    const day = shiftDay(start, i)
    const before = state.occurrences.length
    state = materialize(state, day, 0)
    const added = state.occurrences.slice(before)
    if (!added.length) continue
    out.push(...added)
    state = {
      ...state,
      occurrences: [
        ...state.occurrences.slice(0, before),
        ...added.map((o) => sim(o, choreById(h, o.choreId)?.effort ?? 0)),
      ],
    }
  }
  return out
}

export interface FairRow {
  member: Member
  points: number
  share: number
  awayDays: number
}

export function fairness(h: Household, month: string, upto = today()) {
  const members = activeMembers(h).filter((m) => m.joinedAt.slice(0, 7) <= month)
  const end = monthOf(upto) === month ? upto : `${month}-${String(daysInMonth(month)).padStart(2, "0")}`
  const pts = members.map((m) => pointsFor(h, m.id, month))
  const weights = members.map((m) => presence(m, month, end))
  const total = pts.reduce((a, b) => a + b, 0)
  const wsum = weights.reduce((a, b) => a + b, 0)
  const rows: FairRow[] = members.map((m, i) => ({
    member: m,
    points: pts[i],
    share: wsum ? (total * weights[i]) / wsum : 0,
    awayDays: awayDaysIn(m, month, end),
  }))
  return { rows, total, average: members.length ? total / members.length : 0 }
}

// ---------- mutations (pure: take a household, return a new one) ----------

function log(h: Household, a: Omit<Activity, "id" | "at">): [Household, string] {
  const id = uid()
  return [{ ...h, activity: [{ id, at: nowStamp(), ...a }, ...h.activity] }, id]
}

export function completeOccurrence(h: Household, occId: string, byId: string): [Household, string] {
  const occ = h.occurrences.find((o) => o.id === occId)
  const chore = occ && choreById(h, occ.choreId)
  if (!occ || !chore || occ.doneBy) return [h, ""]
  const done: Occurrence = { ...occ, doneBy: byId, doneAt: nowStamp(), points: chore.effort }
  const next = { ...h, occurrences: h.occurrences.map((o) => (o.id === occId ? done : o)) }
  return log(next, {
    kind: byId === occ.assigneeId ? "done" : "cover",
    actorId: byId,
    memberId: occ.assigneeId,
    choreId: chore.id,
    occurrenceId: occId,
    points: chore.effort,
  })
}

export function undoComplete(h: Household, occId: string): Household {
  return {
    ...h,
    occurrences: h.occurrences.map((o) =>
      o.id === occId ? { id: o.id, choreId: o.choreId, due: o.due, assigneeId: o.assigneeId } : o,
    ),
    activity: h.activity.filter((a) => !(a.occurrenceId === occId && (a.kind === "done" || a.kind === "cover"))),
  }
}

/** Hands someone's open chores to whoever the rotation picks next. */
function reassignOpen(h: Household, memberId: string): Household {
  const exclude = new Set([memberId])
  let next = h
  for (const o of h.occurrences) {
    if (o.assigneeId !== memberId || o.doneBy) continue
    const chore = choreById(h, o.choreId)
    if (!chore) continue
    const to = pickAssignee(next, chore, o.due < today() ? today() : o.due, loadFor(next, o.due), exclude)
    if (!to) continue
    next = { ...next, occurrences: next.occurrences.map((x) => (x.id === o.id ? { ...x, assigneeId: to } : x)) }
  }
  return next
}

export interface ChoreDraft {
  name: string
  emoji: string
  effort: Effort
  frequency: Chore["frequency"]
}

export function addChore(h: Household, d: ChoreDraft, actorId?: string, id = uid()): Household {
  const chore: Chore = { id, ...d, startDate: today(), createdAt: nowStamp() }
  return log({ ...h, chores: [...h.chores, chore] }, { kind: "chore-added", actorId, choreId: chore.id })[0]
}

export const EFFORT_NAMES: Record<Effort, string> = { 1: "Light", 2: "Medium", 3: "Heavy" }

export function updateChore(h: Household, id: string, d: ChoreDraft, actorId?: string): Household {
  const old = choreById(h, id)
  if (!old) return h
  const freqChanged = old.frequency.every !== d.frequency.every || old.frequency.unit !== d.frequency.unit
  const changes: string[] = []
  if (old.name !== d.name) changes.push(`renamed it from ${old.name}`)
  if (old.effort !== d.effort) changes.push(`set effort to ${EFFORT_NAMES[d.effort]}`)
  if (freqChanged) changes.push(`changed it to ${frequencyLabel(d.frequency).toLowerCase()}`)
  const chores = h.chores.map((c) => (c.id === id ? { ...c, ...d, startDate: freqChanged ? today() : c.startDate } : c))
  const next = { ...h, chores }
  if (!changes.length) return next
  return log(next, { kind: "chore-edited", actorId, choreId: id, detail: changes.join(", ") })[0]
}

export function removeChore(h: Household, id: string, actorId?: string): Household {
  const next = {
    ...h,
    chores: h.chores.map((c) => (c.id === id ? { ...c, removedAt: nowStamp() } : c)),
    occurrences: h.occurrences.filter((o) => o.choreId !== id || o.doneBy),
  }
  return log(next, { kind: "chore-removed", actorId, choreId: id })[0]
}

export const MAX_MEMBERS = 6

export function addMember(h: Household, name: string, actorId?: string, id = uid()): [Household, string] {
  const active = activeMembers(h)
  const month = monthOf(today())
  const scores = active.map((m) => pointsFor(h, m.id, month))
  const lowest = scores.length ? Math.min(...scores) : 0
  const used = new Set(active.map((m) => m.color))
  const color = COLOR_ORDER.find((c) => !used.has(c)) ?? COLOR_ORDER[h.members.length % COLOR_ORDER.length]
  const member: Member = {
    id,
    name: name.trim(),
    color,
    shape: h.members.length % 6,
    joinedAt: today(),
    baseline: lowest > 0 ? { month, points: lowest } : undefined,
    away: [],
  }
  const [next] = log({ ...h, members: [...h.members, member] }, { kind: "member-added", actorId, memberId: member.id })
  return [next, member.id]
}

export function renameMember(h: Household, id: string, name: string, actorId?: string): Household {
  const old = memberById(h, id)
  if (!old || old.name === name.trim()) return h
  const next = { ...h, members: h.members.map((m) => (m.id === id ? { ...m, name: name.trim() } : m)) }
  return log(next, { kind: "member-edited", actorId, memberId: id, detail: `renamed from ${old.name}` })[0]
}

export function setAway(h: Household, id: string, range: AwayRange | null, actorId?: string): Household {
  const t = today()
  const m = memberById(h, id)
  if (!m) return h
  // Past trips stay, because they still adjust this month's fair share
  const past = m.away
    .filter((r) => r.from < t)
    .map((r) => (r.to >= t ? { ...r, to: shiftDay(t, -1) } : r))
  const away = range ? [...past, range] : past
  let next: Household = { ...h, members: h.members.map((x) => (x.id === id ? { ...x, away } : x)) }
  if (range && range.from <= t) next = reassignOpen(next, id)
  return log(next, {
    kind: "away",
    actorId,
    memberId: id,
    detail: range ? `${range.from}|${range.to}` : "back",
  })[0]
}

export function removeMember(h: Household, id: string, actorId?: string): Household {
  let next: Household = { ...h, members: h.members.map((m) => (m.id === id ? { ...m, removedAt: nowStamp() } : m)) }
  next = reassignOpen(next, id)
  return log(next, { kind: "member-removed", actorId, memberId: id })[0]
}

export function setNote(h: Household, note: string, actorId?: string): Household {
  if (note.trim() === h.note) return h
  return log({ ...h, note: note.trim() }, { kind: "note", actorId })[0]
}

export function renameHousehold(h: Household, name: string): Household {
  return name.trim() ? { ...h, name: name.trim() } : h
}

/** The house under a new id, which is what a new share link is. The old id stops working. */
export function relinked(h: Household, newId: string, actorId?: string): Household {
  return log({ ...h, id: newId }, { kind: "link", actorId })[0]
}

export const newHouseId = () => uid(16)

/** Keeps last month (for the meter) and 30+ days of history; drops anything older. */
export function prune(h: Household): Household {
  const keepFrom = `${monthOf(shiftMonth(today(), -1))}-01`
  const activityFrom = shiftDay(today(), -45)
  const occ = h.occurrences.filter((o) => o.due >= keepFrom || (o.doneAt && o.doneAt >= keepFrom))
  const act = h.activity.filter((a) => a.at >= activityFrom)
  if (occ.length === h.occurrences.length && act.length === h.activity.length) return h
  return { ...h, occurrences: occ, activity: act }
}

export function frequencyLabel(f: Chore["frequency"]) {
  if (f.unit === "day") return f.every === 1 ? "Every day" : `Every ${f.every} days`
  if (f.unit === "week") return f.every === 1 ? "Every week" : `Every ${f.every} weeks`
  return f.every === 1 ? "Every month" : `Every ${f.every} months`
}

export const COLOR_ORDER = ["sponge", "bubblegum", "mint", "sky", "grape", "tangerine"] as const
