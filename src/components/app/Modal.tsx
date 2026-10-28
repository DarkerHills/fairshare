import { createContext, useContext, type ComponentProps, type ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsWide } from "@/lib/useMediaQuery"
import { cn } from "@/lib/utils"

const Wide = createContext(false)

/** A slide-up drawer on phones (easy to reach and swipe away), a centered dialog on tablets and desktops. */
export function Modal({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: ReactNode }) {
  const wide = useIsWide()
  const Root = wide ? Dialog : Drawer
  return (
    <Wide.Provider value={wide}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </Wide.Provider>
  )
}

export function ModalContent({ className, children }: { className?: string; children: ReactNode }) {
  return useContext(Wide) ? (
    // Don't auto-select the first field when editing; new items still focus their name via autoFocus
    <DialogContent className={cn("gap-0 rounded-[2rem] p-2 sm:max-w-lg", className)} onOpenAutoFocus={(e) => e.preventDefault()}>
      {children}
    </DialogContent>
  ) : (
    <DrawerContent className={cn("mx-auto max-w-md", className)}>{children}</DrawerContent>
  )
}

export function ModalHeader({ className, ...props }: ComponentProps<"div">) {
  return useContext(Wide) ? (
    <DialogHeader className={cn("items-center p-4 pb-2 text-center", className)} {...props} />
  ) : (
    <DrawerHeader className={className} {...props} />
  )
}

export function ModalTitle({ className, ...props }: ComponentProps<typeof DialogTitle>) {
  return useContext(Wide) ? <DialogTitle className={cn("leading-tight", className)} {...props} /> : <DrawerTitle className={className} {...props} />
}

export function ModalDescription({ className, ...props }: ComponentProps<typeof DialogDescription>) {
  return useContext(Wide) ? (
    <DialogDescription className={cn("text-balance", className)} {...props} />
  ) : (
    <DrawerDescription className={className} {...props} />
  )
}

export function ModalFooter({ className, ...props }: ComponentProps<"div">) {
  return useContext(Wide) ? (
    <DialogFooter className={cn("flex-row gap-2 p-4 sm:justify-stretch", className)} {...props} />
  ) : (
    <DrawerFooter className={className} {...props} />
  )
}
