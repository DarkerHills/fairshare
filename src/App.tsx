import { MotionConfig } from "motion/react"
import { Toaster } from "@/components/ui/sonner"
import { useRoute } from "@/lib/router"
import { Landing } from "@/screens/Landing"
import { Setup } from "@/screens/Setup"
import { HouseholdRoute } from "@/screens/Household"

export default function App() {
  const { segments } = useRoute()
  const [first, id, tab] = segments

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-dots min-h-dvh">
        {first === "new" ? (
          <Setup />
        ) : first === "h" && id ? (
          <HouseholdRoute key={id} id={id} tab={tab} />
        ) : (
          <Landing />
        )}
      </div>
      <Toaster
        position="top-center"
        offset={14}
        toastOptions={{
          classNames: {
            toast: "!rounded-[1.6rem] !border-2 !border-ink !px-4 !py-3.5 !font-sans !shadow-[0_4px_0_0_var(--ink)] dark:!border-white/80 dark:!shadow-[0_4px_0_0_rgb(0_0_0/0.5)]",
            title: "!text-[15px] !font-extrabold",
            description: "!font-semibold !text-muted-foreground",
            icon: "!text-mint-deep",
            actionButton: "!h-8 !rounded-full !bg-sponge !px-3.5 !text-[13px] !font-extrabold !text-ink",
          },
        }}
      />
    </MotionConfig>
  )
}
