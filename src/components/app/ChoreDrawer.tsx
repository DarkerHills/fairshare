import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "./Modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ConfirmButton } from "./ConfirmButton"
import { cn } from "@/lib/utils"
import { EFFORT_NAMES, type ChoreDraft } from "@/lib/engine"
import { EMOJI_CHOICES } from "@/lib/starter"
import type { Effort, Frequency } from "@/lib/types"

const PRESETS: { key: string; label: string; f?: Frequency }[] = [
  { key: "1d", label: "Every day", f: { every: 1, unit: "day" } },
  { key: "2d", label: "Every 2 days", f: { every: 2, unit: "day" } },
  { key: "3d", label: "Every 3 days", f: { every: 3, unit: "day" } },
  { key: "1w", label: "Every week", f: { every: 1, unit: "week" } },
  { key: "2w", label: "Every 2 weeks", f: { every: 2, unit: "week" } },
  { key: "1m", label: "Every month", f: { every: 1, unit: "month" } },
  { key: "nd", label: "Every few days…" },
]

const EXAMPLES: Record<Effort, string> = { 1: "like taking out the trash", 2: "like washing the dishes", 3: "like cleaning the bathroom" }

function presetFor(f: Frequency) {
  return PRESETS.find((p) => p.f && p.f.every === f.every && p.f.unit === f.unit)?.key ?? "nd"
}

const BLANK: ChoreDraft = { name: "", emoji: "🧽", effort: 2, frequency: { every: 1, unit: "week" } }

export function ChoreDrawer({
  open,
  onOpenChange,
  initial,
  onSave,
  onRemove,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initial?: ChoreDraft
  onSave: (d: ChoreDraft) => void
  onRemove?: () => void
}) {
  const [draft, setDraft] = useState<ChoreDraft>(initial ?? BLANK)
  const [preset, setPreset] = useState(presetFor((initial ?? BLANK).frequency))
  const [nDays, setNDays] = useState(initial?.frequency.unit === "day" ? initial.frequency.every : 4)
  // Remembered from when it opened, so the title doesn't flip while the drawer slides away
  const [isEdit, setIsEdit] = useState(Boolean(initial))

  // Reset only when the drawer opens, so a re-render can't wipe what's being typed
  const initialRef = useRef(initial)
  initialRef.current = initial
  useEffect(() => {
    if (!open) return
    const d = initialRef.current ?? BLANK
    setDraft(d)
    setPreset(presetFor(d.frequency))
    setNDays(d.frequency.unit === "day" ? d.frequency.every : 4)
    setIsEdit(Boolean(initialRef.current))
  }, [open])

  const frequency: Frequency =
    preset === "nd" ? { every: Math.min(Math.max(nDays || 1, 1), 60), unit: "day" } : PRESETS.find((p) => p.key === preset)!.f!
  const valid = draft.name.trim().length > 0

  const save = () => {
    if (!valid) return
    onSave({ ...draft, name: draft.name.trim(), frequency })
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          className="flex max-h-[78vh] flex-col overflow-y-auto"
        >
          <ModalHeader>
            <ModalTitle className="text-2xl font-extrabold">{isEdit ? "Edit chore" : "Add a chore"}</ModalTitle>
            <ModalDescription>Points are how the rota keeps things fair.</ModalDescription>
          </ModalHeader>

          <div className="flex flex-col gap-5 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="chore-name" className="font-extrabold">What needs doing?</Label>
              <div className="flex gap-2">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>
                  {draft.emoji}
                </span>
                <Input
                  id="chore-name"
                  autoFocus={!isEdit}
                  placeholder="e.g. Clean the oven"
                  value={draft.name}
                  maxLength={40}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <ToggleGroup
                type="single"
                value={draft.emoji}
                onValueChange={(v) => v && setDraft({ ...draft, emoji: v })}
                aria-label="Icon"
                spacing={1}
                className="w-full flex-wrap justify-start"
              >
                {EMOJI_CHOICES.map((e) => (
                  <ToggleGroupItem
                    key={e}
                    value={e}
                    aria-label={e}
                    className="size-10 rounded-2xl text-xl transition-transform data-[state=on]:scale-110 data-[state=on]:bg-sponge/40 data-[state=on]:ring-2 data-[state=on]:ring-ink"
                  >
                    {e}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-extrabold">How much effort?</Label>
              <ToggleGroup
                type="single"
                value={String(draft.effort)}
                onValueChange={(v) => v && setDraft({ ...draft, effort: Number(v) as Effort })}
                aria-label="Effort"
                spacing={2}
                className="grid w-full grid-cols-3"
              >
                {([1, 2, 3] as Effort[]).map((e) => (
                  <ToggleGroupItem
                    key={e}
                    value={String(e)}
                    className={cn(
                      "pressable h-auto flex-col gap-1 rounded-3xl border-2 border-border bg-card px-2 py-3 whitespace-normal [--ledge:var(--border)]",
                      "data-[state=on]:border-ink data-[state=on]:bg-sponge/30 data-[state=on]:[--ledge:var(--ink)] dark:data-[state=on]:border-white",
                    )}
                  >
                    <span className="flex gap-1" aria-hidden>
                      {[1, 2, 3].map((i) => (
                        <span key={i} className={cn("size-2.5 rounded-full border-2 border-ink dark:border-white", i <= e ? "bg-ink dark:bg-white" : "bg-transparent")} />
                      ))}
                    </span>
                    <span className="text-sm font-black">{EFFORT_NAMES[e]}</span>
                    <span className="text-xs font-bold text-muted-foreground">{e} pt{e > 1 ? "s" : ""}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="px-1 text-xs font-semibold text-muted-foreground">
                {EFFORT_NAMES[draft.effort]} is {EXAMPLES[draft.effort]}.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-extrabold">How often?</Label>
              <div className="flex gap-2">
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger className="h-12! flex-1 rounded-full border-2 bg-card px-4 text-base font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl">
                    {PRESETS.map((p) => (
                      <SelectItem key={p.key} value={p.key} className="rounded-2xl py-2 font-semibold">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preset === "nd" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={60}
                      aria-label="Number of days"
                      value={nDays || ""}
                      onChange={(e) => setNDays(Number(e.target.value))}
                      className="w-20 text-center"
                    />
                    <span className="text-sm font-bold">days</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ModalFooter className="flex-row gap-2 pt-6">
            {onRemove && (
              <ConfirmButton
                title={`Remove ${draft.name || "this chore"}?`}
                description="It comes off the rota. Points already earned for it stay in everyone's totals."
                confirmLabel="Remove chore"
                onConfirm={() => {
                  onRemove()
                  onOpenChange(false)
                }}
              >
                <Button type="button" variant="destructive" size="icon-lg" aria-label="Remove chore">
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2.2} />
                </Button>
              </ConfirmButton>
            )}
            <Button type="submit" size="lg" className="flex-1" disabled={!valid}>
              {isEdit ? "Save chore" : "Add chore"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
