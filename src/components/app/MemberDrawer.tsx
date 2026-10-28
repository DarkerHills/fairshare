import { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"
import { HugeiconsIcon } from "@hugeicons/react"
import { AirplaneTakeOff01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "./Modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Blob } from "@/components/illustrations/Blob"
import { ConfirmButton } from "./ConfirmButton"
import { fromDay, shortDay, toDay, today } from "@/lib/dates"
import { currentAway } from "@/lib/engine"
import type { AwayRange, Member } from "@/lib/types"

/** Edit a housemate: name, away dates, or remove them. With no member, it adds one. */
export function MemberDrawer({
  open,
  onOpenChange,
  member,
  canRemove,
  onSave,
  onRemove,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  member?: Member
  canRemove?: boolean
  onSave: (name: string, away: AwayRange | null | undefined) => void
  onRemove?: () => void
}) {
  const [name, setName] = useState("")
  const [range, setRange] = useState<DateRange | undefined>()
  const [awayOpen, setAwayOpen] = useState(false)
  // Remembered from when it opened, so the header doesn't flip while the drawer slides away
  const [shown, setShown] = useState(member)

  useEffect(() => {
    if (!open) return
    setName(member?.name ?? "")
    const a = member ? currentAway(member) : undefined
    setRange(a ? { from: fromDay(a.from), to: fromDay(a.to) } : undefined)
    setAwayOpen(Boolean(a))
    setShown(member)
    // Reset only when the drawer opens, so a re-render can't wipe what's being typed
  }, [open])

  const existing = shown ? currentAway(shown) : undefined
  const picked: AwayRange | null =
    range?.from ? { from: toDay(range.from), to: toDay(range.to ?? range.from) } : null
  const awayChanged = (picked?.from ?? "") !== (existing?.from ?? "") || (picked?.to ?? "") !== (existing?.to ?? "")
  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    onSave(name, member && awayChanged ? picked : undefined)
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
          className="flex max-h-[80vh] flex-col overflow-y-auto"
        >
          <ModalHeader className="items-center">
            {shown && <Blob color={shown.color} shape={shown.shape} size={64} mood="happy" />}
            <ModalTitle className="text-2xl font-extrabold">{shown ? `Edit ${shown.name}` : "Add a housemate"}</ModalTitle>
            {!shown && (
              <ModalDescription>They start level with whoever has the fewest points, so nobody gets buried on day one.</ModalDescription>
            )}
          </ModalHeader>

          <div className="flex flex-col gap-5 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="member-name" className="font-extrabold">Name</Label>
              <Input id="member-name" autoFocus={!member} value={name} maxLength={20} placeholder="e.g. Sam" onChange={(e) => setName(e.target.value)} />
            </div>

            {shown && (
              <div className="rounded-3xl bg-muted/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky text-ink">
                    <HugeiconsIcon icon={AirplaneTakeOff01Icon} strokeWidth={2.2} className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-extrabold">Away mode</p>
                    <p className="text-sm text-muted-foreground">
                      {picked
                        ? `Away ${shortDay(picked.from)} to ${shortDay(picked.to)}. Their turns go to everyone else, and their fair share shrinks to match.`
                        : "Going somewhere? Their turns pass to others while they're gone."}
                    </p>
                  </div>
                </div>
                {awayOpen ? (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <Calendar
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      disabled={{ before: fromDay(today()) }}
                      className="rounded-3xl bg-card [--cell-size:--spacing(10)]"
                    />
                    {picked && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setRange(undefined)}>
                        {existing ? "They're back, clear away dates" : "Clear dates"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => setAwayOpen(true)}>
                    Pick away dates
                  </Button>
                )}
              </div>
            )}
          </div>

          <ModalFooter className="flex-row gap-2 pt-6">
            {member && onRemove && canRemove && (
              <ConfirmButton
                title={`Remove ${member.name} from the house?`}
                description="Their open chores get handed to everyone else. Their history stays."
                confirmLabel="Remove"
                onConfirm={() => {
                  onRemove()
                  onOpenChange(false)
                }}
              >
                <Button type="button" variant="destructive" size="icon-lg" aria-label={`Remove ${member.name}`}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2.2} />
                </Button>
              </ConfirmButton>
            )}
            <Button type="submit" size="lg" className="flex-1" disabled={!valid}>
              {shown ? "Save" : "Add housemate"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
