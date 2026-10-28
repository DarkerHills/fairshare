import { useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowRight01Icon, Refresh01Icon, UserSwitchIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Blob } from "@/components/illustrations/Blob"
import { ChoreDrawer } from "@/components/app/ChoreDrawer"
import { ConfirmButton } from "@/components/app/ConfirmButton"
import { MemberDrawer } from "@/components/app/MemberDrawer"
import { Segmented } from "@/components/app/Segmented"
import { ShareLink } from "@/components/app/ShareLink"
import { ChoreTile, EffortPill } from "@/components/app/bits"
import { shortDay } from "@/lib/dates"
import {
  MAX_MEMBERS,
  activeChores,
  activeMembers,
  addChore,
  addMember,
  currentAway,
  frequencyLabel,
  removeChore,
  removeMember,
  renameHousehold,
  renameMember,
  setAway,
  setNote,
  uid,
  updateChore,
} from "@/lib/engine"
import { navigate } from "@/lib/router"
import { moveHousehold, mutate, setMe, shareUrl } from "@/lib/store"
import type { Household, Member } from "@/lib/types"

/** Managing the house. Any member can change anything, and every change lands in the history. */
export function HouseTab({ h, me }: { h: Household; me: Member }) {
  const [view, setView] = useState<"chores" | "people">("chores")
  const [choreEdit, setChoreEdit] = useState<string | "new" | null>(null)
  const [memberEdit, setMemberEdit] = useState<string | "new" | null>(null)
  const [name, setName] = useState(h.name)
  const [note, setNoteText] = useState(h.note)
  const chores = activeChores(h)
  const members = activeMembers(h)
  const editingChore = typeof choreEdit === "string" && choreEdit !== "new" ? chores.find((c) => c.id === choreEdit) : undefined
  const editingMember = typeof memberEdit === "string" && memberEdit !== "new" ? members.find((m) => m.id === memberEdit) : undefined
  const dirty = name.trim() !== h.name || note.trim() !== h.note

  const saveDetails = () => {
    mutate(h.id, (x) => setNote(renameHousehold(x, name), note, me.id))
    toast.success("House details saved")
  }

  const newLink = () => {
    const making = moveHousehold(h.id, me.id).then((newId) => navigate(`/h/${newId}/house`, { replace: true }))
    toast.promise(making, {
      loading: "Making a new link…",
      success: { message: "New link made", description: "The old one has stopped working. Send this one to the group chat." },
      error: "Couldn't make a new link. Check your connection and try again.",
    })
  }

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
      <div className="px-1 lg:col-span-2">
        <h1 className="text-[2.1rem] leading-tight font-black lg:text-5xl">House</h1>
        <p className="font-semibold text-muted-foreground">Anyone in the house can change these. Every change shows in the history.</p>
      </div>

      <section className="rounded-[2rem] bg-card p-4 ring-1 ring-foreground/[0.06] md:p-5 lg:col-start-1">
        <h2 className="mb-1 px-1 text-lg font-black">Invite people</h2>
        <p className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Anyone with this link can see and edit the house.</p>
        <ShareLink url={shareUrl(h)} houseName={h.name} />
        <ConfirmButton
          title="Make a new link?"
          description="The current link stops working for everyone, including housemates who already joined. Send them the new one. Use this if the link got shared somewhere it shouldn't."
          confirmLabel="Make new link"
          onConfirm={newLink}
        >
          <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground">
            <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2.2} />
            Make a new link
          </Button>
        </ConfirmButton>
      </section>

      <div className="flex flex-col gap-5 lg:col-start-2 lg:row-span-3 lg:row-start-2">
      <Segmented
        label="Manage"
        value={view}
        onChange={setView}
        options={[
          { value: "chores", label: <>Chores <span className="rounded-full bg-ink/10 px-1.5 text-xs dark:bg-white/15">{chores.length}</span></> },
          { value: "people", label: <>People <span className="rounded-full bg-ink/10 px-1.5 text-xs dark:bg-white/15">{members.length}</span></> },
        ]}
      />

      {view === "chores" ? (
        <section className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1">
          {chores.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setChoreEdit(c.id)}
              className="pressable flex items-center gap-3 rounded-3xl bg-card p-3 pr-4 text-left ring-1 ring-foreground/[0.06]"
            >
              <ChoreTile emoji={c.emoji} effort={c.effort} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold">{c.name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <EffortPill effort={c.effort} />
                  <span className="text-xs font-bold text-muted-foreground">{frequencyLabel(c.frequency)}</span>
                </span>
              </span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.4} className="size-5 text-muted-foreground" />
            </motion.button>
          ))}
          <Button variant="outline" size="lg" className="mt-1 md:col-span-2 lg:col-span-1" onClick={() => setChoreEdit("new")}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.6} />
            Add a chore
          </Button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1">
          {members.map((m, i) => {
            const away = currentAway(m)
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setMemberEdit(m.id)}
                className="pressable flex items-center gap-3 rounded-3xl bg-card p-3 pr-4 text-left ring-1 ring-foreground/[0.06]"
              >
                <Blob color={m.color} shape={m.shape} size={48} mood={away ? "sleepy" : "happy"} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-extrabold">
                    <span className="truncate">{m.name}</span>
                    {m.id === me.id && <span className="rounded-full bg-sponge px-2 text-[11px] font-black text-ink">You</span>}
                  </span>
                  <span className="block text-xs font-bold text-muted-foreground">
                    {away ? `Away ${shortDay(away.from)} to ${shortDay(away.to)}` : "Home and on the rota"}
                  </span>
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.4} className="size-5 text-muted-foreground" />
              </motion.button>
            )
          })}
          {members.length < MAX_MEMBERS ? (
            <Button variant="outline" size="lg" className="mt-1 md:col-span-2 lg:col-span-1" onClick={() => setMemberEdit("new")}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2.6} />
              Add a housemate
            </Button>
          ) : (
            <p className="px-1 text-center text-sm font-semibold text-muted-foreground md:col-span-2 lg:col-span-1">Houses can have up to {MAX_MEMBERS} people.</p>
          )}
        </section>
      )}
      </div>

      <section className="flex flex-col gap-4 rounded-[2rem] bg-card p-4 ring-1 ring-foreground/[0.06] md:p-5 lg:col-start-1">
        <h2 className="px-1 text-lg font-black">House details</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="house-name" className="px-1 font-extrabold">Name</Label>
          <Input id="house-name" value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="house-note" className="px-1 font-extrabold">House note</Label>
          <Textarea
            id="house-note"
            value={note}
            maxLength={140}
            placeholder="e.g. Dishes before bed, please."
            onChange={(e) => setNoteText(e.target.value)}
          />
          <p className="px-1 text-xs font-semibold text-muted-foreground">Pinned at the top of everyone's chores.</p>
        </div>
        <Button disabled={!dirty || !name.trim()} onClick={saveDetails}>
          Save details
        </Button>
      </section>

      <section className="flex items-center gap-3 rounded-[2rem] bg-muted/70 p-4 lg:col-start-1">
        <Blob color={me.color} shape={me.shape} size={44} />
        <p className="flex-1 text-sm font-semibold text-muted-foreground">
          This device knows you as <b className="text-foreground">{me.name}</b>.
        </p>
        <Button variant="outline" size="sm" onClick={() => setMe(h.id, null)}>
          <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2.2} />
          Switch
        </Button>
      </section>

      <ChoreDrawer
        open={choreEdit !== null}
        onOpenChange={(o) => !o && setChoreEdit(null)}
        initial={editingChore}
        onSave={(d) => {
          const id = uid()
          mutate(h.id, (x) => (editingChore ? updateChore(x, editingChore.id, d, me.id) : addChore(x, d, me.id, id)))
          toast.success(editingChore ? "Chore saved" : `${d.name} added to the rota`)
        }}
        onRemove={editingChore ? () => mutate(h.id, (x) => removeChore(x, editingChore.id, me.id)) : undefined}
      />
      <MemberDrawer
        open={memberEdit !== null}
        onOpenChange={(o) => !o && setMemberEdit(null)}
        member={editingMember}
        canRemove={members.length > 2 && editingMember?.id !== me.id}
        onSave={(n, away) => {
          if (editingMember) {
            mutate(h.id, (x) => {
              let next = renameMember(x, editingMember.id, n, me.id)
              if (away !== undefined) next = setAway(next, editingMember.id, away, me.id)
              return next
            })
            toast.success(away ? `${n} is set as away` : away === null ? `Welcome back, ${n}` : "Saved")
          } else {
            const id = uid()
            mutate(h.id, (x) => addMember(x, n, me.id, id)[0])
            toast.success(`${n} moved in!`, { description: "Send them the link so they can pick their name." })
          }
        }}
        onRemove={editingMember ? () => mutate(h.id, (x) => removeMember(x, editingMember.id, me.id)) : undefined}
      />
    </div>
  )
}
