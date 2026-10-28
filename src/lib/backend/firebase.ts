import { initializeApp } from "firebase/app"
import {
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  runTransaction,
  setDoc,
} from "firebase/firestore"
import type { Household } from "../types"
import { HouseGone, isReplaced, type Backend, type Stored } from "./types"

/**
 * Cloud Firestore on Firebase's free Spark plan. Each house is one document at houses/{id},
 * and the long random id is the share link's secret (see firestore.rules).
 */
const env = import.meta.env
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

const db = initializeFirestore(app, {
  // Optional fields are left undefined throughout the app; Firestore would reject them otherwise
  ignoreUndefinedProperties: true,
  // Opens instantly from the last copy on this device, then catches up
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

const ref = (id: string) => doc(db, "houses", id)

function asHouse(d: Stored | undefined): Household {
  if (!d) throw new HouseGone("missing")
  if (isReplaced(d)) throw new HouseGone("replaced")
  return d
}

export const cloud: Backend = {
  kind: "cloud",
  subscribe(id, onDoc, onError) {
    return onSnapshot(
      ref(id),
      (snap) => {
        // An empty answer from the on-device cache only means we haven't heard from the server yet
        if (!snap.exists()) {
          if (!snap.metadata.fromCache) onDoc(null)
          return
        }
        onDoc(snap.data() as Stored)
      },
      onError,
    )
  },
  create: (h) => setDoc(ref(h.id), h),
  transact: (id, fn) =>
    runTransaction(db, async (tx) => {
      const snap = await tx.get(ref(id))
      const h = asHouse(snap.data() as Stored | undefined)
      const next = fn(h)
      if (next !== h) tx.set(ref(id), next)
      return next
    }),
  move: (oldId, fn) =>
    runTransaction(db, async (tx) => {
      const snap = await tx.get(ref(oldId))
      const next = fn(asHouse(snap.data() as Stored | undefined))
      tx.set(ref(next.id), next)
      tx.set(ref(oldId), { replaced: true })
      return next
    }),
}
