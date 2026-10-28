export type Effort = 1 | 2 | 3

export type ColorKey = "sponge" | "bubblegum" | "mint" | "sky" | "grape" | "tangerine"

export interface Frequency {
  every: number
  unit: "day" | "week" | "month"
}

/** Inclusive local dates, yyyy-mm-dd */
export interface AwayRange {
  from: string
  to: string
}

export interface Member {
  id: string
  name: string
  color: ColorKey
  shape: number
  joinedAt: string
  /** Mid-month joiners start at the household's lowest score, not zero */
  baseline?: { month: string; points: number }
  away: AwayRange[]
  removedAt?: string
}

export interface Chore {
  id: string
  name: string
  emoji: string
  effort: Effort
  frequency: Frequency
  startDate: string
  createdAt: string
  removedAt?: string
}

export interface Occurrence {
  id: string
  choreId: string
  due: string
  assigneeId: string
  doneBy?: string
  doneAt?: string
  /** Effort awarded at completion, so later effort edits don't rewrite history */
  points?: number
}

export type ActivityKind =
  | "created"
  | "done"
  | "cover"
  | "chore-added"
  | "chore-edited"
  | "chore-removed"
  | "member-added"
  | "member-edited"
  | "member-removed"
  | "away"
  | "link"
  | "note"

export interface Activity {
  id: string
  at: string
  kind: ActivityKind
  actorId?: string
  choreId?: string
  memberId?: string
  occurrenceId?: string
  points?: number
  detail?: string
}

export interface Household {
  version: 1
  /** Long and random: the share link is the only key to the house, so the id is the secret */
  id: string
  name: string
  note: string
  createdAt: string
  /** Bumped on every save, so an older copy never overwrites a newer one on screen */
  rev?: number
  /** Ids of the latest saved edits, so an edit isn't shown twice while it's in flight */
  ops?: string[]
  members: Member[]
  chores: Chore[]
  occurrences: Occurrence[]
  activity: Activity[]
}
