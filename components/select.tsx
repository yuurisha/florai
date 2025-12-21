"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select")
  }
  return context
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value = "", onValueChange, children }) => {
  const [internalValue, setInternalValue] = React.useState(value)
  const [open, setOpen] = React.useState(false)

  const isControlled = onValueChange !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (isControlled) {
        onValueChange?.(newValue)
      } else {
        setInternalValue(newValue)
      }
      setOpen(false)
    },
    [isControlled, onValueChange],
  )

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        onOpenChange: setOpen,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
  placeholder?: string
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children, placeholder }) => {
  const { open, onOpenChange } = useSelect()

  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
        "placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={() => onOpenChange(!open)}
    >
      <span>{children || placeholder}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = useSelect()
  return <span>{value || placeholder}</span>
}

interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

const SelectContent: React.FC<SelectContentProps> = ({ className, children }) => {
  const { open } = useSelect()

  if (!open) return null

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  const { onValueChange, value: selectedValue } = useSelect()

  return (
    <button
      type="button"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none",
        "hover:bg-gray-100 focus:bg-gray-100",
        selectedValue === value && "bg-emerald-100 text-emerald-900",
        className,
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
