import { useSyncExternalStore } from "react"

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Matches Tailwind's `lg` breakpoint: where the sidebar and side-by-side panels kick in. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")

/** Matches Tailwind's `md` breakpoint: where slide-up drawers become centered dialogs. */
export const useIsWide = () => useMediaQuery("(min-width: 768px)")
