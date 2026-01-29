"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog")
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(open)

  const isControlled = onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen)
      } else {
        setInternalOpen(newOpen)
      }
    },
    [isControlled, onOpenChange],
  )

  React.useEffect(() => {
    if (!isControlled) {
      setInternalOpen(open)
    }
  }, [open, isControlled])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleOpenChange(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, handleOpenChange])

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>{children}</DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ asChild = false, children, className }) => {
  const { onOpenChange } = useDialog()

  const handleClick = (event: React.MouseEvent) => {
    if (React.isValidElement(children) && typeof ((children as React.ReactElement<any, any>).props.onClick) === "function") {
      (children as React.ReactElement<any, any>).props.onClick(event)
    }
    onOpenChange(true)
  }

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<any, any>;
    return React.cloneElement(childElement, {
      ...childElement.props,
      onClick: handleClick,
      className: cn((childElement.props as any).className, className),
    })
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}

interface DialogOverlayProps {
  className?: string
}

const DialogOverlay: React.FC<DialogOverlayProps> = ({ className }) => {
  const { onOpenChange } = useDialog()

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      onClick={() => onOpenChange(false)}
      aria-hidden="true"
    />
  )
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
  onPointerDownOutside?: (event: React.PointerEvent) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}

const DialogContent: React.FC<DialogContentProps> = ({
  className,
  children,
  onPointerDownOutside,
  onEscapeKeyDown,
}) => {
  const { open, onOpenChange } = useDialog()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Handle click outside
  const handlePointerDown = (event: React.PointerEvent) => {
    if (onPointerDownOutside) {
      onPointerDownOutside(event)
    }
  }

  // Focus management
  React.useEffect(() => {
    if (open && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0] as HTMLElement
      if (firstElement) {
        firstElement.focus()
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogOverlay />
      <div
        ref={contentRef}
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 border border-gray-200 bg-white p-6 shadow-lg",
          "rounded-lg animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
          "sm:max-w-[425px]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
}

interface DialogFooterProps {
  className?: string
  children: React.ReactNode
}

const DialogFooter: React.FC<DialogFooterProps> = ({ className, children }) => {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
  )
}

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900", className)}>{children}</h2>
  )
}

interface DialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children }) => {
  return <p className={cn("text-sm text-gray-600", className)}>{children}</p>
}

interface DialogCloseProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

const DialogClose: React.FC<DialogCloseProps> = ({ asChild = false, children, className }) => {
  const { onOpenChange } = useDialog()

  const handleClick = () => {
    onOpenChange(false)
  }

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<any, any>;
    const existingOnClick = childElement.props.onClick;
    return React.cloneElement(childElement, {
      ...childElement.props,
      onClick: (event: React.MouseEvent) => {
        if (typeof existingOnClick === "function") {
          existingOnClick(event);
        }
        handleClick();
      },
      className: cn(childElement.props.className, className),
    });
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
}
