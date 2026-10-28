import { useSyncExternalStore } from "react"

function subscribe(l: () => void) {
  window.addEventListener("hashchange", l)
  return () => window.removeEventListener("hashchange", l)
}

const snapshot = () => window.location.hash.replace(/^#/, "") || "/"

export function useRoute() {
  const raw = useSyncExternalStore(subscribe, snapshot)
  const [path, qs = ""] = raw.split("?")
  return { path, segments: path.split("/").filter(Boolean), query: new URLSearchParams(qs) }
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const url = `#${to}`
  if (opts.replace) {
    history.replaceState(null, "", url)
    window.dispatchEvent(new HashChangeEvent("hashchange"))
  } else {
    window.location.hash = to
  }
  window.scrollTo({ top: 0 })
}
