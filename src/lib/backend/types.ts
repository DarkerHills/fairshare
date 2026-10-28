import type { Household } from "../types"

/** What sits at a house's address: the house, or a note that it moved to a new link. */
export type Stored = Household | { replaced: true }

export const isReplaced = (d: Stored): d is { replaced: true } => "replaced" in d && d.replaced === true

export class HouseGone extends Error {
  constructor(public reason: "missing" | "replaced") {
    super(`House ${reason}`)
  }
}

export interface Backend {
  kind: "local" | "cloud"
  /** Calls back with the latest copy now and on every change. `null` means nothing is there. */
  subscribe(id: string, onDoc: (doc: Stored | null) => void, onError: (e: unknown) => void): () => void
  create(h: Household): Promise<void>
  /** Read, change, write, retrying if someone else saved in between. Return the same object for no change. */
  transact(id: string, fn: (h: Household) => Household): Promise<Household>
  /** Copies the house to a new id and leaves a "replaced" note at the old one, in one step. */
  move(oldId: string, fn: (h: Household) => Household): Promise<Household>
}
