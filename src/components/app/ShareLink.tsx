import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Share08Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ShareLink({ url, houseName, className }: { url: string; houseName: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== "undefined" && "share" in navigator

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy. Press and hold the link to copy it instead.")
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: houseName, text: `Join ${houseName} on Fairshare and pick your name:`, url })
    } catch {
      /* closed the share sheet */
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 rounded-full border-2 border-dashed border-ink/20 bg-card py-1.5 pr-1.5 pl-4 dark:border-white/20">
        <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-muted-foreground select-all">{url.replace(/^https?:\/\//, "")}</span>
        <Button size="sm" variant={copied ? "mint" : "ink"} onClick={copy} className="min-w-24" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "y" : "n"}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2.6} />
              {copied ? "Copied" : "Copy"}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>
      {canShare && (
        <Button variant="outline" onClick={share}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2.4} />
          Send to the group chat
        </Button>
      )}
    </div>
  )
}
